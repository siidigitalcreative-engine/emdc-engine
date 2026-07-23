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

function escapeRegExp(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function formatInlineText(
  value: unknown,
  boldPhrases?: string | string[]
) {
  let formatted =
    escapeHtml(value);

  const phrases = Array.from(
    new Set(
      [
        ...(
          Array.isArray(boldPhrases)
            ? boldPhrases
            : [boldPhrases]
        ),
        "ORDER",
      ]
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean)
    )
  ).sort(
    (left, right) =>
      right.length - left.length
  );

  phrases.forEach((phrase) => {
    const escapedPhrase =
      escapeHtml(phrase);

    if (!escapedPhrase) return;

    const pattern =
      phrase.toUpperCase() === "ORDER"
        ? /\bORDER\b/gi
        : new RegExp(
            escapeRegExp(
              escapedPhrase
            ),
            "gi"
          );

    formatted = formatted.replace(
      pattern,
      (match) =>
        `<strong style="font-weight:700;color:#111827;">${match}</strong>`
    );
  });

  return formatted;
}

function formatFeatureBullet(
  value: unknown,
  boldPhrases?: string | string[]
) {
  const source = String(value || "").trim();
  const colonIndex = source.indexOf(":");

  if (colonIndex <= 0) {
    return formatInlineText(
      source,
      boldPhrases
    );
  }

  const label = source
    .slice(0, colonIndex + 1)
    .trim();

  const description = source
    .slice(colonIndex + 1)
    .trim();

  return [
    `<strong style="font-weight:700;color:#111827;">${formatInlineText(
      label,
      boldPhrases
    )}</strong>`,
    description
      ? ` ${formatInlineText(
          description,
          boldPhrases
        )}`
      : "",
  ].join("");
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

function resolveImageCandidates(
  value: unknown
) {
  const source = String(value || "").trim();

  if (!source) return [];

  const driveId =
    getGoogleDriveFileId(source);

  if (driveId) {
    const encodedId =
      encodeURIComponent(driveId);

    return [
      `https://drive.usercontent.google.com/download?id=${encodedId}&export=download&confirm=t`,
      `https://drive.google.com/uc?export=download&id=${encodedId}&confirm=t`,
      `https://drive.google.com/uc?export=view&id=${encodedId}`,
      `https://drive.google.com/thumbnail?id=${encodedId}&sz=w2000`,
    ];
  }

  return /^https?:\/\//i.test(source)
    ? [source]
    : [];
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

function getYoutubeVideoId(
  value: unknown
) {
  const source = String(value || "").trim();

  if (!source) return "";

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/watch\?(?:[^#]*&)?v=([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{6,})/i,
    /[?&]v=([a-zA-Z0-9_-]{6,})/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getAutomaticYoutubeThumbnailCandidates(
  youtubeUrl: unknown
) {
  const videoId =
    getYoutubeVideoId(youtubeUrl);

  if (!videoId) return [];

  const encodedVideoId =
    encodeURIComponent(videoId);

  return [
    `https://i.ytimg.com/vi/${encodedVideoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${encodedVideoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${encodedVideoId}/hqdefault.jpg`,
  ];
}

function wrapBase64(
  value: string
) {
  return value.match(/.{1,76}/g)?.join("\r\n") || "";
}

function plainTextToHtml(
  value: string,
  options?: {
    hideYoutubeLine?: boolean;
    insertHtmlBeforeWhy?: string;
    insertHtmlAfterChecklistSummary?: string;
    boldPhrases?: string[];
    emailAudience?: "client" | "internal" | "viber";
  }
) {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const parts: string[] = [];
  let bullets: string[] = [];
  let greetingSeen = false;
  let pendingGreeting = "";
  let bodyHeadlineRendered = false;
  let insertedBeforeWhy = false;
  let insertedAfterChecklistSummary = false;
  let internalSummaryStarted = false;

  const isInternalEmail =
    options?.emailAudience === "internal";

  const flushBullets = () => {
    if (!bullets.length) return;

    parts.push(
      `<ul style="margin:8px 0 18px;padding-left:22px;">${bullets
        .map(
          (item) =>
            `<li style="margin:0 0 7px;line-height:1.55;">${formatFeatureBullet(
              item,
              options?.boldPhrases
            )}</li>`
        )
        .join("")}</ul>`
    );

    bullets = [];
  };

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();

    const nextNonEmptyLine = lines
      .slice(lineIndex + 1)
      .map((item) => item.trim())
      .find(Boolean) || "";

    if (!line) {
      flushBullets();
      return;
    }

    if (
      isInternalEmail &&
      /^hi\s+team\s*,?$/i.test(line)
    ) {
      flushBullets();

      parts.push(
        `<p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(
          line
        )}</p>`
      );
      return;
    }

    if (/^dear\s+partner\s*,?$/i.test(line)) {
      flushBullets();
      greetingSeen = true;
      pendingGreeting = line;
      return;
    }

    if (
      greetingSeen &&
      !bodyHeadlineRendered
    ) {
      flushBullets();
      bodyHeadlineRendered = true;

      parts.push(
        `<h2 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#111827;font-weight:700;">${formatInlineText(
          line,
          options?.boldPhrases
        )}</h2>`
      );

      if (pendingGreeting) {
        parts.push(
          `<p style="margin:0 0 18px;line-height:1.6;color:#374151;">${formatInlineText(
            pendingGreeting,
            options?.boldPhrases
          )}</p>`
        );
        pendingGreeting = "";
      }

      return;
    }

    const checklistSummaryMatch =
      line.match(
        /^(Checklist Title|No\.?\s*of\s*SKU|Checklist Type)\s*:\s*(.*)$/i
      );

    if (checklistSummaryMatch) {
      flushBullets();

      const label =
        checklistSummaryMatch[1];

      const value =
        checklistSummaryMatch[2];

      if (
        isInternalEmail &&
        !internalSummaryStarted
      ) {
        parts.push(
          `<h2 style="margin:26px 0 12px;color:#111827;font-size:19px;line-height:1.3;font-weight:750;">Checklist Summary</h2>`
        );
        internalSummaryStarted = true;
      }

      parts.push(
        `<div style="display:table;width:100%;margin:0 0 8px;border:1px solid #E2E8F0;border-radius:8px;background:#F8FAFC;box-sizing:border-box;">
          <div style="display:table-row;">
            <div style="display:table-cell;width:155px;padding:11px 12px;color:#475569;font-size:13px;font-weight:700;vertical-align:top;">
              ${escapeHtml(label)}
            </div>
            <div style="display:table-cell;padding:11px 12px;color:#111827;font-size:14px;line-height:1.45;vertical-align:top;">
              ${value
                ? formatInlineText(
                    value,
                    options?.boldPhrases
                  )
                : "—"}
            </div>
          </div>
        </div>`
      );
      return;
    }

    if (
      /^uploaded\s+assets\s*:?\s*$/i.test(
        line
      )
    ) {
      flushBullets();

      if (
        isInternalEmail &&
        options?.insertHtmlAfterChecklistSummary &&
        !insertedAfterChecklistSummary
      ) {
        parts.push(
          options.insertHtmlAfterChecklistSummary
        );
        insertedAfterChecklistSummary = true;
      }

      parts.push(
        `<div style="margin:30px 0 14px;padding-top:22px;border-top:1px solid #E2E8F0;">
          <h2 style="margin:0;color:#111827;font-size:20px;line-height:1.3;font-weight:750;">Uploaded Assets</h2>
          <p style="margin:5px 0 0;color:#64748B;font-size:13px;line-height:1.45;">Open each link to review the completed asset.</p>
        </div>`
      );
      return;
    }

    const isStandaloneUrl =
      /^https?:\/\/\S+$/i.test(line);

    if (isStandaloneUrl) {
      flushBullets();

      const safeUrl =
        escapeHtml(line);

      parts.push(
        `<div style="margin:0 0 16px;padding:10px 12px;border:1px solid #DBEAFE;border-radius:8px;background:#EFF6FF;line-height:1.4;overflow-wrap:anywhere;">
          <a
            href="${safeUrl}"
            style="color:#1D4ED8;text-decoration:none;font-size:13px;font-weight:600;"
          >Open Asset</a>
          <div style="margin-top:4px;color:#64748B;font-size:11px;line-height:1.4;overflow-wrap:anywhere;">${safeUrl}</div>
        </div>`
      );
      return;
    }

    const nextLineIsUrl =
      /^https?:\/\/\S+$/i.test(
        nextNonEmptyLine
      );

    if (
      nextLineIsUrl &&
      line.length <= 100
    ) {
      flushBullets();

      parts.push(
        `<div style="margin:18px 0 6px;color:#111827;font-size:15px;line-height:1.4;">
          <strong style="font-weight:750;">${formatInlineText(
            line,
            options?.boldPhrases
          )}</strong>
        </div>`
      );
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
      flushBullets();

      if (
        options?.insertHtmlBeforeWhy &&
        !insertedBeforeWhy
      ) {
        parts.push(
          options.insertHtmlBeforeWhy
        );
        insertedBeforeWhy = true;
      }

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
      if (options?.hideYoutubeLine) {
        return;
      }

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
        `<h2 style="margin:18px 0 12px;font-size:20px;line-height:1.35;color:#111827;">${formatInlineText(
          line,
          options?.boldPhrases
        )}</h2>`
      );
      return;
    }

    if (
      isInternalEmail &&
      /^(please\s+review|next\s+step|for\s+review|action\s+required)/i.test(
        line
      )
    ) {
      parts.push(
        `<div style="margin:24px 0 0;padding:14px 16px;border-left:4px solid #1D4ED8;border-radius:8px;background:#EFF6FF;color:#1E3A8A;font-size:14px;line-height:1.55;">
          <strong style="display:block;margin-bottom:4px;color:#1E3A8A;">Next Step</strong>
          ${formatInlineText(
            line,
            options?.boldPhrases
          )}
        </div>`
      );
      return;
    }

    parts.push(
      `<p style="margin:0 0 14px;line-height:1.65;color:#374151;">${formatInlineText(
        line,
        options?.boldPhrases
      )}</p>`
    );
  });

  flushBullets();

  if (pendingGreeting) {
    parts.push(
      `<p style="margin:0 0 18px;line-height:1.6;color:#374151;">${formatInlineText(
        pendingGreeting,
        options?.boldPhrases
      )}</p>`
    );
  }

  if (
    options?.insertHtmlBeforeWhy &&
    !insertedBeforeWhy
  ) {
    parts.push(
      options.insertHtmlBeforeWhy
    );
  }

  if (
    isInternalEmail &&
    options?.insertHtmlAfterChecklistSummary &&
    !insertedAfterChecklistSummary
  ) {
    parts.push(
      options.insertHtmlAfterChecklistSummary
    );
  }

  return parts.join("");
}

function getEmailProductTitleFromSubject(
  subject: string
) {
  return String(subject || "")
    .replace(
      /^\s*\[[^\]]+\]\s*/i,
      ""
    )
    .replace(
      /\s+[—–-]\s+(?:now available|available again|now live|special campaign)\s*$/i,
      ""
    )
    .trim();
}

function getInternalEmailHeading(
  subject: string
) {
  const cleanSubject =
    String(subject || "").trim();

  const bracketMatch =
    cleanSubject.match(
      /^\[([^\]]+)\]\s*(.*)$/
    );

  if (bracketMatch) {
    return {
      eyebrow:"INTERNAL TEAM",
      title:String(
        bracketMatch[1] || "Assets Ready"
      ).trim(),
      subtitle:String(
        bracketMatch[2] || ""
      ).trim(),
    };
  }

  return {
    eyebrow:"INTERNAL TEAM",
    title:"Checklist Assets Ready",
    subtitle:
      getEmailProductTitleFromSubject(
        cleanSubject
      ),
  };
}

function buildHtmlEmail({
  subject,
  body,
  headerImageSource,
  imageSource,
  footerImageSource,
  youtubeUrl,
  youtubeThumbnailSource,
  checklistTitle,
  emailAudience,
}: {
  subject: string;
  body: string;
  headerImageSource?: string;
  imageSource?: string;
  footerImageSource?: string;
  youtubeUrl?: string;
  youtubeThumbnailSource?: string;
  checklistTitle?: string;
  emailAudience?: "client" | "internal" | "viber";
}) {
  const productTitleFromSubject =
    getEmailProductTitleFromSubject(
      subject
    );

  const boldPhrases = Array.from(
    new Set(
      [
        checklistTitle,
        productTitleFromSubject,
      ]
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean)
    )
  );

  const isInternalEmail =
    emailAudience === "internal";

  const internalHeading =
    getInternalEmailHeading(subject);

  const internalHeadingHtml =
    isInternalEmail
      ? `<div style="margin:0 0 26px;">
          <div style="margin:0 0 8px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
            ${escapeHtml(internalHeading.eyebrow)}
          </div>

          <h1 style="margin:0;color:#111827;font-size:28px;line-height:1.2;font-weight:750;">
            ${escapeHtml(internalHeading.title)}
          </h1>

          ${
            internalHeading.subtitle
              ? `<p style="margin:8px 0 0;color:#475569;font-size:15px;line-height:1.5;">${formatInlineText(
                  internalHeading.subtitle,
                  boldPhrases
                )}</p>`
              : ""
          }
        </div>`
      : "";

  const headerImageHtml =
    headerImageSource && !isInternalEmail
      ? `<div style="margin:0 0 28px;text-align:center;">
          <img
            src="${escapeHtml(headerImageSource)}"
            alt="Email header"
            style="display:block;width:100%;max-width:860px;height:auto;aspect-ratio:4/1;object-fit:cover;margin:0 auto;border:0;border-radius:10px;"
          />
        </div>`
      : "";

  const internalSummaryImageHtml =
    headerImageSource && isInternalEmail
      ? `<div style="margin:22px 0 28px;text-align:center;">
          <img
            src="${escapeHtml(headerImageSource)}"
            alt="${escapeHtml(subject)}"
            style="display:block;width:100%;max-width:680px;height:auto;margin:0 auto;border:0;border-radius:10px;object-fit:contain;"
          />
        </div>`
      : "";

  const imageHtml =
    imageSource && !isInternalEmail
      ? `<div style="margin:0 0 22px;text-align:center;">
        <img
          src="${escapeHtml(imageSource)}"
          alt="${escapeHtml(subject)}"
          style="display:block;width:100%;max-width:680px;height:auto;margin:0 auto;border:0;border-radius:10px;"
        />
      </div>`
    : "";

  const footerImageHtml =
    footerImageSource && !isInternalEmail
      ? `<div style="margin:24px 0 0;text-align:center;">
        <img
          src="${escapeHtml(footerImageSource)}"
          alt="${escapeHtml(subject)}"
          style="display:block;width:100%;max-width:680px;height:auto;margin:0 auto;border:0;border-radius:10px;"
        />
      </div>`
    : "";

  const youtubeHtml =
    youtubeUrl && youtubeThumbnailSource
      ? `<div style="margin:26px 0 0;padding-top:22px;border-top:1px solid #E5E7EB;">
          <h3 style="margin:0 0 12px;font-size:17px;line-height:1.35;color:#111827;">
            Watch the Product Video
          </h3>

          <a
            href="${escapeHtml(youtubeUrl)}"
            style="display:block;text-decoration:none;"
          >
            <img
              src="${escapeHtml(youtubeThumbnailSource)}"
              alt="Watch the product video on YouTube"
              style="display:block;width:100%;max-width:680px;aspect-ratio:16/9;object-fit:cover;margin:0 auto;border:0;border-radius:10px;"
            />
          </a>

          <div style="margin-top:14px;text-align:center;">
            <a
              href="${escapeHtml(youtubeUrl)}"
              style="display:inline-block;padding:11px 20px;border-radius:8px;background:#FF0000;color:#FFFFFF;font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;"
            >
              Watch on YouTube
            </a>
          </div>
        </div>`
      : youtubeUrl
        ? `<div style="margin:24px 0 0;padding-top:20px;border-top:1px solid #E5E7EB;">
            <a href="${escapeHtml(youtubeUrl)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background:#FF0000;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;">
              Watch on YouTube
            </a>
          </div>`
        : "";

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      @media screen and (max-width:640px) {
        .emdc-email-outer {
          padding:12px 8px !important;
        }

        .emdc-email-card {
          width:100% !important;
          padding:16px !important;
          border-radius:12px !important;
        }
      }
    </style>
  </head>

  <body style="margin:0;padding:0;background:#F3F4F6;">
    <div
      class="emdc-email-outer"
      style="width:100%;padding:28px 16px;box-sizing:border-box;"
    >
      <div
        class="emdc-email-card"
        style="width:100%;max-width:860px;margin:0 auto;padding:36px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;box-sizing:border-box;"
      >
        ${headerImageHtml}
        ${internalHeadingHtml}
        ${plainTextToHtml(body, {
          hideYoutubeLine: Boolean(youtubeUrl),
          insertHtmlBeforeWhy:
            imageHtml,
          insertHtmlAfterChecklistSummary:
            internalSummaryImageHtml,
          boldPhrases,
          emailAudience,
        })}
        ${youtubeHtml}
        ${footerImageHtml}
      </div>
    </div>
  </body>
</html>`;
}

function detectImageContentType(
  bytes: Buffer,
  statedType: string
) {
  const normalizedType =
    String(statedType || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

  if (
    normalizedType.startsWith(
      "image/"
    )
  ) {
    return normalizedType;
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 6 &&
    bytes
      .subarray(0, 6)
      .toString("ascii")
      .startsWith("GIF8")
  ) {
    return "image/gif";
  }

  if (
    bytes.length >= 12 &&
    bytes
      .subarray(0, 4)
      .toString("ascii") ===
      "RIFF" &&
    bytes
      .subarray(8, 12)
      .toString("ascii") ===
      "WEBP"
  ) {
    return "image/webp";
  }

  return "";
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

    const bytes = Buffer.from(
      await response.arrayBuffer()
    );

    if (
      !bytes.length ||
      bytes.length > MAX_INLINE_IMAGE_BYTES
    ) {
      return null;
    }

    const contentType =
      detectImageContentType(
        bytes,
        String(
          response.headers.get(
            "content-type"
          ) || ""
        )
      );

    if (!contentType) {
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

async function fetchFirstAvailableInlineImage(
  urls: string[]
) {
  for (const url of urls) {
    const image =
      await fetchInlineImage(url);

    if (image) {
      return {
        image,
        url,
      };
    }
  }

  return {
    image: null,
    url:
      urls[urls.length - 1] ||
      "",
  };
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

    const emailAudience =
      requestBody?.emailAudience === "internal"
        ? "internal"
        : requestBody?.emailAudience === "viber"
          ? "viber"
          : "client";

    const subject = String(
      requestBody?.subject || ""
    ).trim();

    const messageBody = String(
      requestBody?.body || ""
    ).trim();

    const checklistTitle = String(
      requestBody?.checklistTitle || ""
    ).trim();

    const requestedHeaderImageCandidates =
      resolveImageCandidates(
        requestBody?.headerImageUrl
      );

    const requestedHeaderImageUrl =
      requestedHeaderImageCandidates[0] ||
      "";

    const requestedImageCandidates =
      emailAudience === "client"
        ? resolveImageCandidates(
            requestBody?.imageUrl
          )
        : [];

    const requestedImageUrl =
      requestedImageCandidates[0] ||
      "";

    const requestedFooterImageCandidates =
      emailAudience === "viber"
        ? resolveImageCandidates(
            requestBody?.footerImageUrl
          )
        : [];

    const requestedFooterImageUrl =
      requestedFooterImageCandidates[0] ||
      "";

    const youtubeUrl = String(
      requestBody?.youtubeUrl || ""
    ).trim();

    const customYoutubeThumbnailUrl =
      resolveImageUrl(
        requestBody?.youtubeThumbnailUrl
      );

    const youtubeThumbnailCandidates =
      customYoutubeThumbnailUrl
        ? [customYoutubeThumbnailUrl]
        : getAutomaticYoutubeThumbnailCandidates(
            youtubeUrl
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

    const [
      headerImageResult,
      productImageResult,
      footerImageResult,
      youtubeThumbnailResult,
    ] = await Promise.all([
      requestedHeaderImageCandidates.length
        ? fetchFirstAvailableInlineImage(
            requestedHeaderImageCandidates
          )
        : Promise.resolve({
            image: null,
            url: "",
          }),
      requestedImageCandidates.length
        ? fetchFirstAvailableInlineImage(
            requestedImageCandidates
          )
        : Promise.resolve({
            image: null,
            url: "",
          }),
      requestedFooterImageCandidates.length
        ? fetchFirstAvailableInlineImage(
            requestedFooterImageCandidates
          )
        : Promise.resolve({
            image: null,
            url: "",
          }),
      youtubeUrl &&
      youtubeThumbnailCandidates.length
        ? fetchFirstAvailableInlineImage(
            youtubeThumbnailCandidates
          )
        : Promise.resolve({
            image: null,
            url: "",
          }),
    ]);

    const inlineHeaderImage =
      headerImageResult.image;

    const resolvedHeaderImageUrl =
      headerImageResult.url;

    const inlineImage =
      productImageResult.image;

    const resolvedImageUrl =
      productImageResult.url;

    const inlineFooterImage =
      footerImageResult.image;

    const resolvedFooterImageUrl =
      footerImageResult.url;

    if (
      requestedFooterImageCandidates.length &&
      !inlineFooterImage
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "The Viber Email Image could not be embedded. In Google Drive, set General access to “Anyone with the link” as Viewer, then try again.",
          code:
            "FOOTER_IMAGE_NOT_PUBLIC",
        },
        { status: 400 }
      );
    }

    if (
      requestedHeaderImageCandidates.length &&
      !inlineHeaderImage
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "The Email Header Image could not be embedded. In Google Drive, open Share and set General access to “Anyone with the link” as Viewer, then try again.",
          code:
            "HEADER_IMAGE_NOT_PUBLIC",
        },
        { status: 400 }
      );
    }

    const inlineYoutubeThumbnail =
      youtubeThumbnailResult.image;

    const resolvedYoutubeThumbnailUrl =
      youtubeThumbnailResult.url;

    const alternativeBoundary =
      `emdc-alt-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const relatedBoundary =
      `emdc-related-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const headerImageContentId =
      "emdc-email-header-image";

    const imageContentId =
      "emdc-email-image";

    const footerImageContentId =
      "emdc-email-footer-image";

    const youtubeThumbnailContentId =
      "emdc-youtube-thumbnail";

    const htmlBody = buildHtmlEmail({
      subject,
      body: messageBody,
      headerImageSource:
        inlineHeaderImage
          ? `cid:${headerImageContentId}`
          : "",
      imageSource: inlineImage
        ? `cid:${imageContentId}`
        : resolvedImageUrl,
      footerImageSource:
        inlineFooterImage
          ? `cid:${footerImageContentId}`
          : "",
      youtubeUrl,
      youtubeThumbnailSource:
        inlineYoutubeThumbnail
          ? `cid:${youtubeThumbnailContentId}`
          : resolvedYoutubeThumbnailUrl,
      checklistTitle,
      emailAudience,
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

    const inlineAttachments = [
      inlineHeaderImage
        ? {
            ...inlineHeaderImage,
            contentId:
              headerImageContentId,
          }
        : null,
      inlineImage
        ? {
            ...inlineImage,
            contentId: imageContentId,
          }
        : null,
      inlineFooterImage
        ? {
            ...inlineFooterImage,
            contentId:
              footerImageContentId,
          }
        : null,
      inlineYoutubeThumbnail
        ? {
            ...inlineYoutubeThumbnail,
            contentId:
              youtubeThumbnailContentId,
          }
        : null,
    ].filter(Boolean) as Array<{
      contentType: string;
      filename: string;
      base64: string;
      contentId: string;
    }>;

    let mimeBody = "";

    if (inlineAttachments.length) {
      const attachmentParts =
        inlineAttachments.flatMap(
          (attachment) => [
            `--${relatedBoundary}`,
            `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
            "Content-Transfer-Encoding: base64",
            `Content-ID: <${attachment.contentId}>`,
            `Content-Disposition: inline; filename="${attachment.filename}"`,
            "",
            attachment.base64,
          ]
        );

      mimeBody = [
        ...messageHeaders,
        `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
        "",
        `--${relatedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        "",
        alternativeParts,
        ...attachmentParts,
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
      headerImageEmbedded:
        Boolean(inlineHeaderImage),
      headerImageUrlUsed:
        Boolean(requestedHeaderImageUrl),
      headerImageFetchUrl:
        resolvedHeaderImageUrl,
      imageEmbedded:
        Boolean(inlineImage),
      imageUrlUsed:
        Boolean(requestedImageUrl),
      footerImageEmbedded:
        Boolean(inlineFooterImage),
      footerImageUrlUsed:
        Boolean(requestedFooterImageUrl),
      footerImageFetchUrl:
        resolvedFooterImageUrl,
      youtubeThumbnailEmbedded:
        Boolean(inlineYoutubeThumbnail),
      youtubeThumbnailUrlUsed:
        Boolean(
          resolvedYoutubeThumbnailUrl
        ),
      youtubeThumbnailResolution:
        resolvedYoutubeThumbnailUrl.includes(
          "maxresdefault"
        )
          ? "maxres"
          : resolvedYoutubeThumbnailUrl.includes(
                "sddefault"
              )
            ? "standard"
            : resolvedYoutubeThumbnailUrl
              ? "high"
              : "none",
      youtubeUrlUsed:
        Boolean(youtubeUrl),
      emailAudience,
      secondaryImageSuppressed:
        emailAudience === "internal",
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
