import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  id: string;
  sender: string;
  senderEmail?: string;
  text: string;
  createdAt: string;
};

const CHAT_PATH = "emdc-team-chat/recent.json";
const MAX_STORED_MESSAGES = 100;
const DEFAULT_LIMIT = 30;

const cleanText = (value: unknown, maxLength: number) =>
  String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);

const streamToText = async (
  stream: ReadableStream<Uint8Array>
) => {
  return new Response(stream).text();
};

const readMessages = async (): Promise<ChatMessage[]> => {
  const result = await get(CHAT_PATH, {
    access: "private",
    useCache: false,
  });

  if (!result || result.statusCode === 304 || !result.stream) {
    return [];
  }

  const raw = await streamToText(result.stream);
  const json = JSON.parse(raw || "{}");

  return Array.isArray(json?.messages)
    ? json.messages.filter(Boolean)
    : [];
};

const writeMessages = async (messages: ChatMessage[]) => {
  await put(
    CHAT_PATH,
    JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      messages: messages.slice(-MAX_STORED_MESSAGES),
    }),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    }
  );
};

export async function GET(request: NextRequest) {
  try {
    const requestedLimit = Number(
      request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT
    );

    const limit = Math.min(
      Math.max(
        Number.isFinite(requestedLimit)
          ? requestedLimit
          : DEFAULT_LIMIT,
        1
      ),
      50
    );

    const messages = await readMessages();

    return NextResponse.json(
      {
        ok: true,
        messages: messages.slice(-limit),
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Team chat GET error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to load team chat.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const sender = cleanText(payload?.sender, 80);
    const senderEmail = cleanText(payload?.senderEmail, 160).toLowerCase();
    const text = cleanText(payload?.text, 2000);

    if (!sender || !senderEmail || !text) {
      return NextResponse.json(
        {
          ok: false,
          error: "Signed-in user and message are required.",
        },
        { status: 400 }
      );
    }

    const currentMessages = await readMessages();

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      senderEmail,
      text,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [
      ...currentMessages,
      message,
    ].slice(-MAX_STORED_MESSAGES);

    await writeMessages(nextMessages);

    return NextResponse.json({
      ok: true,
      message,
      messages: nextMessages.slice(-DEFAULT_LIMIT),
    });
  } catch (error: any) {
    console.error("Team chat POST error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to send team chat message.",
      },
      { status: 500 }
    );
  }
}


const safePasswordMatch = (submitted: string, expected: string) => {
  const left = Buffer.from(submitted);
  const right = Buffer.from(expected);

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 30);
    const currentMessages = await readMessages();

    if (action === "delete-message") {
      const messageId = cleanText(payload?.messageId, 100);
      const requesterEmail = cleanText(
        payload?.requesterEmail,
        160
      ).toLowerCase();

      if (!messageId || !requesterEmail) {
        return NextResponse.json(
          {
            ok: false,
            error: "Message and signed-in user are required.",
          },
          { status: 400 }
        );
      }

      const target = currentMessages.find(
        (message) => message.id === messageId
      );

      if (!target) {
        return NextResponse.json(
          {
            ok: false,
            error: "Message was not found.",
          },
          { status: 404 }
        );
      }

      if (
        !target.senderEmail ||
        target.senderEmail.toLowerCase() !== requesterEmail
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "You can delete only your own messages.",
          },
          { status: 403 }
        );
      }

      const nextMessages = currentMessages.filter(
        (message) => message.id !== messageId
      );

      await writeMessages(nextMessages);

      return NextResponse.json({
        ok: true,
        messages: nextMessages.slice(-DEFAULT_LIMIT),
      });
    }

    if (action === "clear-chat") {
      const submittedPassword = String(
        payload?.adminPassword || ""
      );
      const expectedPassword = String(
        process.env.TEAM_CHAT_ADMIN_PASSWORD || ""
      );

      if (!expectedPassword) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "TEAM_CHAT_ADMIN_PASSWORD is not configured in Vercel.",
          },
          { status: 500 }
        );
      }

      if (
        !submittedPassword ||
        !safePasswordMatch(submittedPassword, expectedPassword)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Incorrect administrator password.",
          },
          { status: 403 }
        );
      }

      await writeMessages([]);

      return NextResponse.json({
        ok: true,
        messages: [],
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Unsupported chat action.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Team chat DELETE error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to update team chat.",
      },
      { status: 500 }
    );
  }
}
