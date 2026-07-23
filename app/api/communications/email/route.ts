import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024;

function encodeHeader(value: string) {
  const encoded = Buffer.from(
    value || "",
    "utf8"
  ).toString("base64");

  return `=?UTF-8?B?${encoded}?=`;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function splitRecipients(value: unknown) {
  return String(value || "")
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getGoogleDriveFileId(
  value: unknown
) {
  const source = String(value || "").trim();

  if (!source) return "";

  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?id=([^&#]+)/i,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/i,
    /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&#]+)/i,
    /[?&]id=([^&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);

    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return "";
}

function resolveImageUrl(
  value: unknown
) {
  const source = String(value || "").trim();

  if (!source) return "";

  const driveId =
    getGoogleDriveFileId(source);

  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveId
    )}&sz=w1600`;
  }

  return /^https?:\/\//i.test(source)
    ? source
    : "";
}

function wrapBase64(
  value: string
) {
  return value.match(/.{1,76}/g)?.join("\r\n") || "";
}

function plainTextToHtml(
  value: string
) {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const parts: string[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;

    parts.push(
      `<ul style="margin:8px 0 18px;padding-left:22px;">${bullets
        .map(
          (item) =>
            `<li style="margin:0 0 7px;line-height:1.55;">${escapeHtml(
              item
            )}</li>`
        )
        .join("")}</ul>`
    );

    bullets = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    const bulletMatch =
      line.match(/^(?:[-*•]|\d+[.)])\s*(.+)$/);

    if (bulletMatch?.[1]) {
      bullets.push(bulletMatch[1].trim());
      return;
    }

    flushBullets();

    if (
      /^why\s+you(?:'|’)?ll\s+love\s+it\s*:?\s*$/i.test(
        line
      )
    ) {
      parts.push(
        `<h3 style="margin:22px 0 8px;font-size:17px;line-height:1.3;color:#111827;">Why You’ll Love It</h3>`
      );
      return;
    }

    const youtubeMatch =
      line.match(
        /^watch\s+on\s+youtube\s*:\s*(https?:\/\/\S+)/i
      );

    if (youtubeMatch?.[1]) {
      const url = escapeHtml(youtubeMatch[1]);

      parts.push(
        `<p style="margin:20px 0 0;line-height:1.6;"><strong>Watch on YouTube:</strong> <a href="${url}" style="color:#1D4ED8;text-decoration:underline;">${url}</a></p>`
      );
      return;
    }

    const looksLikeHeadline =
      line.length <= 120 &&
      line === line.toUpperCase() &&
      /[A-Z]/.test(line);

    if (looksLikeHeadline) {
      parts.push(
        `<h2 style="margin:18px 0 12px;font-size:20px;line-height:1.35;color:#111827;">${escapeHtml(
          line
        )}</h2>`
      );
      return;
    }

    parts.push(
      `<p style="margin:0 0 14px;line-height:1.65;color:#374151;">${escapeHtml(
        line
      )}</p>`
    );
  });

  flushBullets();

  return parts.join("");
}

function buildHtmlEmail({
  subject,
  body,
  imageSource,
}: {
  subject: string;
  body: string;
  imageSource?: string;
}) {
  const imageHtml = imageSource
    ? `<div style="margin:0 0 22px;text-align:center;">
        <img
          src="${escapeHtml(imageSource)}"
          alt="${escapeHtml(subject)}"
          style="display:block;width:100%;max-width:680px;height:auto;margin:0 auto;border:0;border-radius:10px;"
        />
      </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F3F4F6;">
    <div style="width:100%;padding:24px 12px;box-sizing:border-box;">
      <div style="max-width:720px;margin:0 auto;padding:28px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;box-sizing:border-box;">
        ${imageHtml}
        ${plainTextToHtml(body)}
      </div>
    </div>
  </body>
</html>`;
}

async function fetchInlineImage(
  imageUrl: string
) {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 EMDC-Email-Image/1.0",
      },
    });

    if (!response.ok) return null;

    const contentType = String(
      response.headers.get("content-type") ||
        ""
    )
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!contentType.startsWith("image/")) {
      return null;
    }

    const bytes = Buffer.from(
      await response.arrayBuffer()
    );

    if (
      !bytes.length ||
      bytes.length > MAX_INLINE_IMAGE_BYTES
    ) {
      return null;
    }

    const extension =
      contentType === "image/png"
        ? "png"
        : contentType === "image/gif"
          ? "gif"
          : contentType === "image/webp"
            ? "webp"
            : "jpg";

    return {
      contentType,
      filename: `emdc-email-image.${extension}`,
      base64: wrapBase64(
        bytes.toString("base64")
      ),
    };
  } catch {
    return null;
  }
}

async function getAccessToken() {
  const clientId =
    process.env.GMAIL_CLIENT_ID;
  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET;
  const refreshToken =
    process.env.GMAIL_REFRESH_TOKEN;

  if (
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    throw new Error(
      "Gmail server sending is not configured. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    );
  }

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );

  const json =
    await response
      .json()
      .catch(() => ({}));

  if (
    !response.ok ||
    !json?.access_token
  ) {
    throw new Error(
      json?.error_description ||
        json?.error ||
        "Unable to authenticate with Gmail."
    );
  }

  return String(json.access_token);
}

export async function POST(
  req: NextRequest
) {
  try {
    const requestBody =
      await req
        .json()
        .catch(() => ({}));

    const action =
      requestBody?.action === "send"
        ? "send"
        : "draft";

    const to = splitRecipients(
      requestBody?.to
    );

    const cc = splitRecipients(
      requestBody?.cc
    );

    const subject = String(
      requestBody?.subject || ""
    ).trim();

    const messageBody = String(
      requestBody?.body || ""
    ).trim();

    const requestedImageUrl =
      resolveImageUrl(
        requestBody?.imageUrl
      );

    const sender = String(
      process.env.GMAIL_SENDER_EMAIL ||
        "me"
    ).trim();

    if (
      !to ||
      !subject ||
      !messageBody
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "To, subject, and body are required.",
        },
        { status: 400 }
      );
    }

    const accessToken =
      await getAccessToken();

    const inlineImage =
      requestedImageUrl
        ? await fetchInlineImage(
            requestedImageUrl
          )
        : null;

    const alternativeBoundary =
      `emdc-alt-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const relatedBoundary =
      `emdc-related-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const imageContentId =
      "emdc-email-image";

    const htmlBody = buildHtmlEmail({
      subject,
      body: messageBody,
      imageSource: inlineImage
        ? `cid:${imageContentId}`
        : requestedImageUrl,
    });

    const messageHeaders = [
      `From: ${sender}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
    ].filter(Boolean);

    const alternativeParts = [
      `--${alternativeBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      messageBody,
      `--${alternativeBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      htmlBody,
      `--${alternativeBoundary}--`,
    ].join("\r\n");

    let mimeBody = "";

    if (inlineImage) {
      mimeBody = [
        ...messageHeaders,
        `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
        "",
        `--${relatedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        "",
        alternativeParts,
        `--${relatedBoundary}`,
        `Content-Type: ${inlineImage.contentType}; name="${inlineImage.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-ID: <${imageContentId}>`,
        `Content-Disposition: inline; filename="${inlineImage.filename}"`,
        "",
        inlineImage.base64,
        `--${relatedBoundary}--`,
      ].join("\r\n");
    } else {
      mimeBody = [
        ...messageHeaders,
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        "",
        alternativeParts,
      ].join("\r\n");
    }

    const raw = base64Url(mimeBody);

    const endpoint =
      action === "send"
        ? "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        : "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

    const payload =
      action === "send"
        ? { raw }
        : { message: { raw } };

    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const json =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error?.message ||
          `Unable to ${
            action === "send"
              ? "send email"
              : "create Gmail draft"
          }.`
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      id:
        json?.id ||
        json?.message?.id ||
        "",
      imageEmbedded:
        Boolean(inlineImage),
      imageUrlUsed:
        Boolean(requestedImageUrl),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unexpected Gmail error.",
      },
      { status: 500 }
    );
  }
}
