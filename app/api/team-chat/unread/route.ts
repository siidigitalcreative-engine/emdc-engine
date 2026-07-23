import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAT_PATH = "emdc-team-chat/store.json";

const normalizeEmail = (value: unknown) =>
  String(value || "").trim().toLowerCase();

type StoredMessage = {
  id?: string;
  roomId?: string;
  senderEmail?: string;
  createdAt?: string;
  mentions?: string[];
  readBy?: string[];
};

const readMessages = async (): Promise<StoredMessage[]> => {
  try {
    const result = await get(CHAT_PATH, {
      access: "private",
      useCache: false,
    });

    if (!result || result.statusCode === 304 || !result.stream) {
      return [];
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw || "{}");

    return Array.isArray(parsed?.messages)
      ? parsed.messages.filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    const requesterEmail = normalizeEmail(
      request.nextUrl.searchParams.get("requesterEmail")
    );

    if (!requesterEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Signed-in user email is required.",
        },
        { status: 400 }
      );
    }

    const messages = await readMessages();

    const unreadMessages = messages.filter((message) => {
      const senderEmail = normalizeEmail(message?.senderEmail);
      const readers = Array.isArray(message?.readBy)
        ? message.readBy.map(normalizeEmail)
        : [];

      return (
        senderEmail !== requesterEmail &&
        !readers.includes(requesterEmail)
      );
    });

    const mentionCount = unreadMessages.filter((message) => {
      const mentions = Array.isArray(message?.mentions)
        ? message.mentions.map(normalizeEmail)
        : [];

      return mentions.includes(requesterEmail);
    }).length;

    const unreadRoomCount = new Set(
      unreadMessages
        .map((message) => String(message?.roomId || "general"))
        .filter(Boolean)
    ).size;

    const latestCreatedAt = unreadMessages.reduce(
      (latest, message) => {
        const createdAt = String(message?.createdAt || "");
        return createdAt > latest ? createdAt : latest;
      },
      ""
    );

    return NextResponse.json(
      {
        ok: true,
        unreadCount: unreadMessages.length,
        unreadRoomCount,
        mentionCount,
        latestCreatedAt,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to load the team chat unread count.",
      },
      { status: 500 }
    );
  }
}
