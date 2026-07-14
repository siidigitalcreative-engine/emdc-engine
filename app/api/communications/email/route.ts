import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeHeader(value: string) {
  const encoded = Buffer.from(value || "", "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function splitRecipients(value: any) {
  return String(value || "")
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

async function getAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail server sending is not configured. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.error_description ||
      json?.error ||
      "Unable to authenticate with Gmail."
    );
  }

  return String(json.access_token);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "send" ? "send" : "draft";
    const to = splitRecipients(body?.to);
    const cc = splitRecipients(body?.cc);
    const subject = String(body?.subject || "").trim();
    const messageBody = String(body?.body || "").trim();
    const sender = String(process.env.GMAIL_SENDER_EMAIL || "me").trim();

    if (!to || !subject || !messageBody) {
      return NextResponse.json(
        { ok: false, error: "To, subject, and body are required." },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const headers = [
      `From: ${sender}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      messageBody,
    ].filter((line, index) => line !== "" || index >= 7);

    const raw = base64Url(headers.join("\r\n"));

    const endpoint =
      action === "send"
        ? "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        : "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

    const payload =
      action === "send"
        ? { raw }
        : { message: { raw } };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error?.message ||
        `Unable to ${action === "send" ? "send email" : "create Gmail draft"}.`
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      id: json?.id || json?.message?.id || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unexpected Gmail error.",
      },
      { status: 500 }
    );
  }
}
