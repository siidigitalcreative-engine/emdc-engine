import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReactionMap = Record<string, string[]>;

type ChatMessage = {
  id: string;
  sender: string;
  senderEmail?: string;
  text: string;
  createdAt: string;
  reactions?: ReactionMap;
  mentions?: string[];
  readBy?: string[];
};

type ChatUser = {
  name: string;
  email: string;
  lastSeenAt: string;
};

type ChatStore = {
  messages: ChatMessage[];
  users: ChatUser[];
};

const CHAT_PATH = "emdc-team-chat/recent.json";
const MAX_STORED_MESSAGES = 100;
const DEFAULT_LIMIT = 30;
const ALLOWED_REACTIONS = new Set([
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "👏",
]);

const cleanText = (value: unknown, maxLength: number) =>
  String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);

const normalizeEmail = (value: unknown) =>
  cleanText(value, 200).toLowerCase();

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

const streamToText = async (
  stream: ReadableStream<Uint8Array>
) => new Response(stream).text();

const readStore = async (): Promise<ChatStore> => {
  const result = await get(CHAT_PATH, {
    access: "private",
    useCache: false,
  });

  if (!result || result.statusCode === 304 || !result.stream) {
    return { messages: [], users: [] };
  }

  const raw = await streamToText(result.stream);
  const json = JSON.parse(raw || "{}");

  return {
    messages: Array.isArray(json?.messages)
      ? json.messages.filter(Boolean)
      : [],
    users: Array.isArray(json?.users)
      ? json.users.filter(Boolean)
      : [],
  };
};

const writeStore = async (store: ChatStore) => {
  await put(
    CHAT_PATH,
    JSON.stringify({
      version: 3,
      updatedAt: new Date().toISOString(),
      messages: store.messages.slice(-MAX_STORED_MESSAGES),
      users: store.users.slice(-200),
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

const readMessages = async () => (await readStore()).messages;

const writeMessages = async (messages: ChatMessage[]) => {
  const store = await readStore();
  await writeStore({ ...store, messages });
};

const safePasswordMatch = (
  submitted: string,
  expected: string
) => {
  const left = Buffer.from(submitted);
  const right = Buffer.from(expected);

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const extractMentions = (
  text: string,
  directory: Array<{ name?: string; email?: string }>
) => {
  const lowerText = text.toLowerCase();

  return unique(
    directory
      .filter((person) => {
        const name = cleanText(person?.name, 100);
        return name && lowerText.includes(`@${name.toLowerCase()}`);
      })
      .map((person) => normalizeEmail(person?.email))
      .filter(Boolean)
  );
};

export async function GET(request: NextRequest) {
  try {
    const requestedLimit = Number(
      request.nextUrl.searchParams.get("limit") ||
        DEFAULT_LIMIT
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

    const store = await readStore();

    return NextResponse.json(
      {
        ok: true,
        messages: store.messages.slice(-limit),
        users: store.users
          .sort(
            (left, right) =>
              new Date(right.lastSeenAt).getTime() -
              new Date(left.lastSeenAt).getTime()
          )
          .slice(0, 100),
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
          error?.message || "Unable to load team chat.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const sender = cleanText(payload?.sender, 80);
    const senderEmail = normalizeEmail(payload?.senderEmail);
    const text = cleanText(payload?.text, 2000);
    const mentionDirectory = Array.isArray(
      payload?.mentionDirectory
    )
      ? payload.mentionDirectory.slice(0, 100)
      : [];

    if (!sender || !senderEmail || !text) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Signed-in user and message are required.",
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
      reactions: {},
      mentions: extractMentions(text, mentionDirectory),
      readBy: [senderEmail],
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
          error?.message || "Unable to send team chat message.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 40);
    const requesterEmail = normalizeEmail(
      payload?.requesterEmail
    );

    if (!requesterEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Signed-in user is required.",
        },
        { status: 400 }
      );
    }

    const store = await readStore();
    const currentMessages = store.messages;
    let changed = false;

    if (action === "register-user") {
      const requesterName = cleanText(payload?.requesterName, 100);

      if (!requesterName) {
        return NextResponse.json(
          { ok: false, error: "Display name is required." },
          { status: 400 }
        );
      }

      const nextUser: ChatUser = {
        name: requesterName,
        email: requesterEmail,
        lastSeenAt: new Date().toISOString(),
      };

      const users = [
        ...store.users.filter(
          (user) => normalizeEmail(user.email) !== requesterEmail
        ),
        nextUser,
      ];

      await writeStore({ ...store, users });

      return NextResponse.json({
        ok: true,
        users,
      });
    }

    if (action === "toggle-reaction") {
      const messageId = cleanText(payload?.messageId, 100);
      const emoji = cleanText(payload?.emoji, 10);

      if (!messageId || !ALLOWED_REACTIONS.has(emoji)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid reaction request.",
          },
          { status: 400 }
        );
      }

      const nextMessages = currentMessages.map((message) => {
        if (message.id !== messageId) return message;

        const reactions: ReactionMap = {
          ...(message.reactions || {}),
        };

        const existing = unique(
          (reactions[emoji] || []).map(normalizeEmail)
        );

        reactions[emoji] = existing.includes(requesterEmail)
          ? existing.filter(
              (email) => email !== requesterEmail
            )
          : [...existing, requesterEmail];

        if (!reactions[emoji].length) {
          delete reactions[emoji];
        }

        changed = true;
        return { ...message, reactions };
      });

      if (!changed) {
        return NextResponse.json(
          { ok: false, error: "Message was not found." },
          { status: 404 }
        );
      }

      await writeMessages(nextMessages);

      return NextResponse.json({
        ok: true,
        messages: nextMessages.slice(-DEFAULT_LIMIT),
      });
    }

    if (action === "mark-read") {
      const messageIds = unique(
        (Array.isArray(payload?.messageIds)
          ? payload.messageIds
          : []
        )
          .map((id: unknown) => cleanText(id, 100))
          .filter(Boolean)
      ).slice(0, 50);

      if (!messageIds.length) {
        return NextResponse.json({
          ok: true,
          messages: currentMessages.slice(-DEFAULT_LIMIT),
        });
      }

      const idSet = new Set(messageIds);

      const nextMessages = currentMessages.map((message) => {
        if (!idSet.has(message.id)) return message;

        const readers = unique(
          (message.readBy || []).map(normalizeEmail)
        );

        if (readers.includes(requesterEmail)) {
          return message;
        }

        changed = true;
        return {
          ...message,
          readBy: [...readers, requesterEmail],
        };
      });

      if (changed) await writeMessages(nextMessages);

      return NextResponse.json({
        ok: true,
        messages: nextMessages.slice(-DEFAULT_LIMIT),
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
    console.error("Team chat PATCH error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message || "Unable to update team chat.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 40);
    const currentMessages = await readMessages();

    if (action === "delete-selected") {
      const requesterEmail = normalizeEmail(
        payload?.requesterEmail
      );

      const messageIds = unique(
        (Array.isArray(payload?.messageIds)
          ? payload.messageIds
          : []
        )
          .map((id: unknown) => cleanText(id, 100))
          .filter(Boolean)
      ).slice(0, 50);

      if (!requesterEmail || !messageIds.length) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Selected messages and signed-in user are required.",
          },
          { status: 400 }
        );
      }

      const idSet = new Set(messageIds);
      const unauthorized = currentMessages.some(
        (message) =>
          idSet.has(message.id) &&
          normalizeEmail(message.senderEmail) !==
            requesterEmail
      );

      if (unauthorized) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "You can delete only your own messages.",
          },
          { status: 403 }
        );
      }

      const nextMessages = currentMessages.filter(
        (message) => !idSet.has(message.id)
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
        !safePasswordMatch(
          submittedPassword,
          expectedPassword
        )
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
          error?.message || "Unable to update team chat.",
      },
      { status: 500 }
    );
  }
}
