import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  id: string;
  sender: string;
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

const getBlobToken = () => {
  const token = String(process.env.BLOB_READ_WRITE_TOKEN || "").trim();

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  return token;
};

const readMessages = async (): Promise<ChatMessage[]> => {
  const token = getBlobToken();

  const result = await list({
    prefix: CHAT_PATH,
    limit: 5,
    token,
  });

  const blob = result.blobs.find(
    (item) => item.pathname === CHAT_PATH
  );

  if (!blob?.url) return [];

  // Private Blob URLs must be read server-side with the Blob token.
  const response = await fetch(blob.url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) return [];

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Unable to read private chat storage (${response.status})${
        detail ? `: ${detail.slice(0, 180)}` : ""
      }`
    );
  }

  const json = await response.json().catch(() => null);

  return Array.isArray(json?.messages)
    ? json.messages.filter(Boolean)
    : [];
};

const writeMessages = async (messages: ChatMessage[]) => {
  const token = getBlobToken();

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
      token,
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
    const text = cleanText(payload?.text, 2000);

    if (!sender || !text) {
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
