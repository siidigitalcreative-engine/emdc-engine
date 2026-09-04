import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(
  value: unknown,
  maxLength = 4000
) {
  const clean = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean
    .slice(0, Math.max(0, maxLength - 1))
    .trim()}…`;
}

function isValidLarkWebhook(
  value: string
) {
  return /^https:\/\/(?:open\.larksuite\.com|open\.feishu\.cn)\/open-apis\/bot\/v2\/hook\//i.test(
    value
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const webhookUrl = String(
      process.env.LARK_BOT_EMDC || ""
    ).trim();

    if (!webhookUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "LARK_BOT_EMDC is not configured in the server environment.",
          code: "LARK_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    if (!isValidLarkWebhook(webhookUrl)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "LARK_BOT_EMDC is not a valid Lark custom bot webhook URL.",
          code: "INVALID_LARK_WEBHOOK",
        },
        { status: 500 }
      );
    }

    const requestBody =
      await req
        .json()
        .catch(() => ({}));

    const title = cleanText(
      requestBody?.title ||
        requestBody?.subject,
      220
    );

    const message = cleanText(
      requestBody?.message ||
        requestBody?.body,
      3000
    );

    const checklistTitle =
      cleanText(
        requestBody?.checklistTitle,
        220
      );

    const checklistType =
      cleanText(
        requestBody?.checklistType,
        120
      );

    if (!title || !message) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lark announcement title and message are required.",
          code:
            "LARK_MESSAGE_REQUIRED",
        },
        { status: 400 }
      );
    }

    const elements: any[] = [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: [
            "**EMDC Announcement**",
            checklistTitle
              ? `Checklist: **${checklistTitle}**`
              : "",
            checklistType
              ? `Type: **${checklistType}**`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
      {
        tag: "hr",
      },
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: message,
        },
      },
    ];

    const payload = {
      msg_type: "interactive",
      card: {
        config: {
          wide_screen_mode: true,
          enable_forward: true,
        },
        header: {
          template: "orange",
          title: {
            tag: "plain_text",
            content:
              `📣 EMDC · ${title}`,
          },
        },
        elements,
      },
    };

    const response =
      await fetch(
        webhookUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json; charset=utf-8",
          },
          body:
            JSON.stringify(payload),
          cache: "no-store",
        }
      );

    const json =
      await response
        .json()
        .catch(() => ({}));

    const explicitSuccess =
      json?.code === 0 ||
      json?.StatusCode === 0 ||
      json?.msg === "success" ||
      json?.StatusMessage === "success";

    if (
      !response.ok ||
      !explicitSuccess
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: String(
            json?.msg ||
              json?.StatusMessage ||
              json?.message ||
              `Lark returned HTTP ${response.status}.`
          ).trim(),
          code:
            "LARK_WEBHOOK_ERROR",
          lark:
            json || null,
        },
        {
          status:
            response.status >= 400 &&
            response.status < 500
              ? response.status
              : 502,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unexpected Lark error.",
        code:
          "LARK_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
