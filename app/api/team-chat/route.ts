import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReactionMap = Record<string, string[]>;

type ChatMessage = {
  id: string;
  roomId: string;
  sender: string;
  senderEmail: string;
  text: string;
  createdAt: string;
  reactions: ReactionMap;
  mentions: string[];
  readBy: string[];
};

type ChatUser = {
  name: string;
  email: string;
};

type ChatRoom = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  ownerEmail: string;
  passwordHash?: string;
  passwordSalt?: string;
};

type ChatStore = {
  version: number;
  rooms: ChatRoom[];
  messages: ChatMessage[];
};

const CHAT_PATH = "emdc-team-chat/store.json";
const DEFAULT_ROOM_ID = "general";
const DEFAULT_LIMIT = 30;
const MAX_MESSAGES = 1000;

const DEFAULT_USERS: ChatUser[] = [
  { name: "analyst", email: "analyst@sunbeamsimpexinc.com" },
  { name: "Ayen Quintos", email: "marketing@sunbeamsimpexinc.com" },
  { name: "Charlene Quizon", email: "mariacharlenemae.quizon@gmail.com" },
  { name: "Che Navarro", email: "design@sunbeamsimpexinc.com" },
  { name: "design2", email: "design2@sunbeamsimpexinc.com" },
  { name: "Janssen Balneg", email: "janssenbalneg14@gmail.com" },
  { name: "operations", email: "operations@sunbeamsimpexinc.com" },
  { name: "Philip Jimenez Cute", email: "jimenezphilip91@gmail.com" },
  { name: "ravi", email: "ravi@sunbeamsimpexinc.com" },
  { name: "Reggienald Vargas", email: "admin@sunbeamsimpexinc.com" },
];

const ALLOWED_REACTIONS = new Set(["👍", "❤️", "😂", "😮", "😢", "👏"]);

const cleanText = (value: unknown, maxLength = 2000) =>
  String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);

const normalizeEmail = (value: unknown) =>
  cleanText(value, 200).toLowerCase();

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

const defaultRoom = (): ChatRoom => ({
  id: DEFAULT_ROOM_ID,
  name: "General",
  createdAt: new Date().toISOString(),
  createdBy: "system",
  ownerEmail: "system",
});

const emptyStore = (): ChatStore => ({
  version: 4,
  rooms: [defaultRoom()],
  messages: [],
});

const readStore = async (): Promise<ChatStore> => {
  try {
    const result = await get(CHAT_PATH, {
      access: "private",
      useCache: false,
    });

    if (!result || result.statusCode === 304 || !result.stream) {
      return emptyStore();
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw || "{}");

    const rooms = Array.isArray(parsed?.rooms) && parsed.rooms.length
      ? parsed.rooms.map((room: any) => ({
          ...room,
          ownerEmail: normalizeEmail(
            room?.ownerEmail ||
            room?.createdBy ||
            "system"
          ),
        }))
      : [defaultRoom()];

    const roomIds = new Set(rooms.map((room: ChatRoom) => room.id));

    const messages = Array.isArray(parsed?.messages)
      ? parsed.messages
          .filter(Boolean)
          .map((message: any) => ({
            ...message,
            roomId: roomIds.has(message?.roomId)
              ? message.roomId
              : DEFAULT_ROOM_ID,
            senderEmail: normalizeEmail(message?.senderEmail),
            reactions:
              message?.reactions && typeof message.reactions === "object"
                ? Object.fromEntries(
                    Object.entries(message.reactions).map(([emoji, value]) => [
                      emoji,
                      Array.isArray(value)
                        ? unique(value.map(normalizeEmail))
                        : [],
                    ])
                  )
                : {},
            mentions: Array.isArray(message?.mentions)
              ? unique(message.mentions.map(normalizeEmail))
              : [],
            readBy: Array.isArray(message?.readBy)
              ? unique(message.readBy.map(normalizeEmail))
              : [],
          }))
      : [];

    return {
      version: 4,
      rooms,
      messages,
    };
  } catch {
    return emptyStore();
  }
};

const writeStore = async (store: ChatStore) => {
  await put(
    CHAT_PATH,
    JSON.stringify({
      ...store,
      version: 4,
      messages: store.messages.slice(-MAX_MESSAGES),
      updatedAt: new Date().toISOString(),
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

const safePasswordMatch = (submitted: string, expected: string) => {
  const left = Buffer.from(submitted);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const hashRoomPassword = (password: string, salt: string) =>
  crypto.scryptSync(password, salt, 64).toString("hex");

const createRoomPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    passwordSalt: salt,
    passwordHash: hashRoomPassword(password, salt),
  };
};

const verifyRoomPassword = (
  room: ChatRoom,
  submittedPassword: unknown
) => {
  if (!room.passwordHash || !room.passwordSalt) return true;

  const submitted = String(submittedPassword || "");
  if (!submitted) return false;

  const submittedHash = hashRoomPassword(
    submitted,
    room.passwordSalt
  );

  return safePasswordMatch(
    submittedHash,
    room.passwordHash
  );
};

const publicRoom = (room: ChatRoom) => ({
  id: room.id,
  name: room.name,
  createdAt: room.createdAt,
  createdBy: room.createdBy,
  ownerEmail: room.ownerEmail,
  passwordProtected: Boolean(
    room.passwordHash && room.passwordSalt
  ),
});

const extractMentions = (text: string) => {
  const lower = text.toLowerCase();

  return DEFAULT_USERS.filter((user) =>
    lower.includes(`@${user.name.toLowerCase()}`)
  ).map((user) => normalizeEmail(user.email));
};

export async function GET(request: NextRequest) {
  try {
    const store = await readStore();
    const roomId =
      cleanText(request.nextUrl.searchParams.get("roomId"), 100) ||
      DEFAULT_ROOM_ID;
    const requestedLimit = Number(
      request.nextUrl.searchParams.get("limit") || DEFAULT_LIMIT
    );
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1),
      100
    );

    const currentRoom =
      store.rooms.find((room) => room.id === roomId) ||
      store.rooms[0];

    const requesterEmail = normalizeEmail(
      request.nextUrl.searchParams.get("requesterEmail")
    );

    const roomPassword =
      request.nextUrl.searchParams.get("roomPassword") || "";

    const requesterIsOwner =
      requesterEmail &&
      requesterEmail ===
        normalizeEmail(currentRoom?.ownerEmail);

    const roomUnlocked =
      requesterIsOwner ||
      verifyRoomPassword(currentRoom, roomPassword);

    const messages = roomUnlocked
      ? store.messages
          .filter((message) => message.roomId === roomId)
          .slice(-limit)
      : [];

    const roomSummaries = store.rooms.map((room) => {
      const roomMessages = store.messages.filter(
        (message) => message.roomId === room.id
      );

      const latestMessage =
        roomMessages[roomMessages.length - 1] || null;

      const latestMentionForRequester = requesterEmail
        ? [...roomMessages]
            .reverse()
            .find((message) => {
              const mentions = (message.mentions || []).map(
                normalizeEmail
              );
              const readers = (message.readBy || []).map(
                normalizeEmail
              );

              return (
                mentions.includes(requesterEmail) &&
                normalizeEmail(message.senderEmail) !==
                  requesterEmail &&
                !readers.includes(requesterEmail)
              );
            }) || null
        : null;

      const passwordProtected = Boolean(
        room.passwordHash && room.passwordSalt
      );

      return {
        roomId: room.id,
        latestMessage: passwordProtected
          ? null
          : latestMessage,
        mentionedYou: passwordProtected
          ? false
          : Boolean(latestMentionForRequester),
        mentionMessageId: passwordProtected
          ? ""
          : latestMentionForRequester?.id || "",
      };
    });

    return NextResponse.json(
      {
        ok: true,
        rooms: store.rooms.map(publicRoom),
        users: DEFAULT_USERS,
        messages,
        roomSummaries,
        roomUnlocked,
        currentRoom: publicRoom(currentRoom),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to load team chat." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 40);
    const store = await readStore();

    if (action === "create-room") {
      const name = cleanText(payload?.name, 80);
      const requesterEmail = normalizeEmail(payload?.requesterEmail);
      const roomPassword = cleanText(payload?.roomPassword, 200);

      if (!name || !requesterEmail) {
        return NextResponse.json(
          { ok: false, error: "Group name and signed-in user are required." },
          { status: 400 }
        );
      }

      const passwordFields = roomPassword
        ? createRoomPassword(roomPassword)
        : {};

      const room: ChatRoom = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        createdBy: requesterEmail,
        ownerEmail: requesterEmail,
        ...passwordFields,
      };

      const nextStore = {
        ...store,
        rooms: [...store.rooms, room],
      };

      await writeStore(nextStore);

      return NextResponse.json({
        ok: true,
        room: publicRoom(room),
        rooms: nextStore.rooms.map(publicRoom),
      });
    }

    const roomId = cleanText(payload?.roomId, 100) || DEFAULT_ROOM_ID;
    const sender = cleanText(payload?.sender, 100);
    const senderEmail = normalizeEmail(payload?.senderEmail);
    const text = cleanText(payload?.text, 2000);

    const currentRoom = store.rooms.find(
      (room) => room.id === roomId
    );

    if (!currentRoom) {
      return NextResponse.json(
        { ok: false, error: "Chat group was not found." },
        { status: 404 }
      );
    }

    const requesterIsOwner =
      normalizeEmail(currentRoom.ownerEmail) === senderEmail;

    if (
      !requesterIsOwner &&
      !verifyRoomPassword(
        currentRoom,
        payload?.roomPassword
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Incorrect group password.",
          code: "ROOM_PASSWORD_REQUIRED",
        },
        { status: 403 }
      );
    }

    if (!sender || !senderEmail || !text) {
      return NextResponse.json(
        { ok: false, error: "Signed-in user and message are required." },
        { status: 400 }
      );
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId,
      sender,
      senderEmail,
      text,
      createdAt: new Date().toISOString(),
      reactions: {},
      mentions: extractMentions(text),
      readBy: [senderEmail],
    };

    const nextStore = {
      ...store,
      messages: [...store.messages, message],
    };

    await writeStore(nextStore);

    return NextResponse.json({
      ok: true,
      message,
      messages: nextStore.messages
        .filter((item) => item.roomId === roomId)
        .slice(-DEFAULT_LIMIT),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to send message." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 40);
    const requesterEmail = normalizeEmail(payload?.requesterEmail);
    const roomId = cleanText(payload?.roomId, 100) || DEFAULT_ROOM_ID;
    const store = await readStore();

    if (!requesterEmail) {
      return NextResponse.json(
        { ok: false, error: "Signed-in user is required." },
        { status: 400 }
      );
    }

    const currentRoom = store.rooms.find(
      (room) => room.id === roomId
    );

    if (!currentRoom) {
      return NextResponse.json(
        { ok: false, error: "Group chat was not found." },
        { status: 404 }
      );
    }

    const requesterIsOwner =
      normalizeEmail(currentRoom.ownerEmail) ===
      requesterEmail;

    if (action === "set-room-password") {
      if (!requesterIsOwner) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Only the group owner can change the password.",
          },
          { status: 403 }
        );
      }

      const newPassword = cleanText(
        payload?.newPassword,
        200
      );

      const rooms = store.rooms.map((room) => {
        if (room.id !== roomId) return room;

        if (!newPassword) {
          const {
            passwordHash,
            passwordSalt,
            ...withoutPassword
          } = room;

          return withoutPassword as ChatRoom;
        }

        return {
          ...room,
          ...createRoomPassword(newPassword),
        };
      });

      await writeStore({ ...store, rooms });

      const updatedRoom = rooms.find(
        (room) => room.id === roomId
      )!;

      return NextResponse.json({
        ok: true,
        room: publicRoom(updatedRoom),
        rooms: rooms.map(publicRoom),
      });
    }

    if (
      !requesterIsOwner &&
      !verifyRoomPassword(
        currentRoom,
        payload?.roomPassword
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Incorrect group password.",
          code: "ROOM_PASSWORD_REQUIRED",
        },
        { status: 403 }
      );
    }

    if (action === "toggle-reaction") {
      const messageId = cleanText(payload?.messageId, 100);
      const emoji = cleanText(payload?.emoji, 10);

      if (!messageId || !ALLOWED_REACTIONS.has(emoji)) {
        return NextResponse.json(
          { ok: false, error: "Invalid reaction." },
          { status: 400 }
        );
      }

      let found = false;

      const messages = store.messages.map((message) => {
        if (message.id !== messageId || message.roomId !== roomId) return message;
        found = true;

        const reactions = { ...(message.reactions || {}) };
        const existing = unique(
          (Array.isArray(reactions[emoji]) ? reactions[emoji] : []).map(
            normalizeEmail
          )
        );

        reactions[emoji] = existing.includes(requesterEmail)
          ? existing.filter((email) => email !== requesterEmail)
          : [...existing, requesterEmail];

        if (!reactions[emoji].length) delete reactions[emoji];

        return { ...message, reactions };
      });

      if (!found) {
        return NextResponse.json(
          { ok: false, error: "Message was not found." },
          { status: 404 }
        );
      }

      const nextStore = { ...store, messages };
      await writeStore(nextStore);

      return NextResponse.json({
        ok: true,
        messages: messages
          .filter((message) => message.roomId === roomId)
          .slice(-DEFAULT_LIMIT),
      });
    }

    if (action === "mark-read") {
      const ids = new Set(
        (Array.isArray(payload?.messageIds) ? payload.messageIds : [])
          .map((id: unknown) => cleanText(id, 100))
          .filter(Boolean)
      );

      let changed = false;

      const messages = store.messages.map((message) => {
        if (
          message.roomId !== roomId ||
          !ids.has(message.id) ||
          message.senderEmail === requesterEmail
        ) {
          return message;
        }

        const readers = unique((message.readBy || []).map(normalizeEmail));

        if (readers.includes(requesterEmail)) return message;

        changed = true;
        return {
          ...message,
          readBy: [...readers, requesterEmail],
        };
      });

      if (changed) await writeStore({ ...store, messages });

      return NextResponse.json({
        ok: true,
        messages: messages
          .filter((message) => message.roomId === roomId)
          .slice(-DEFAULT_LIMIT),
      });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported chat action." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to update chat." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const action = cleanText(payload?.action, 40);
    const roomId = cleanText(payload?.roomId, 100) || DEFAULT_ROOM_ID;
    const store = await readStore();

    if (action === "delete-selected") {
      const requesterEmail = normalizeEmail(payload?.requesterEmail);
      const ids = new Set(
        (Array.isArray(payload?.messageIds) ? payload.messageIds : [])
          .map((id: unknown) => cleanText(id, 100))
          .filter(Boolean)
      );

      const currentRoom = store.rooms.find(
        (room) => room.id === roomId
      );

      const requesterIsOwner =
        currentRoom &&
        normalizeEmail(currentRoom.ownerEmail) ===
          requesterEmail;

      if (
        currentRoom &&
        !requesterIsOwner &&
        !verifyRoomPassword(
          currentRoom,
          payload?.roomPassword
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Incorrect group password.",
            code: "ROOM_PASSWORD_REQUIRED",
          },
          { status: 403 }
        );
      }

      if (!requesterEmail || !ids.size) {
        return NextResponse.json(
          { ok: false, error: "Selected messages are required." },
          { status: 400 }
        );
      }

      const unauthorized = store.messages.some(
        (message) =>
          message.roomId === roomId &&
          ids.has(message.id) &&
          normalizeEmail(message.senderEmail) !== requesterEmail
      );

      if (unauthorized) {
        return NextResponse.json(
          { ok: false, error: "You can delete only your own messages." },
          { status: 403 }
        );
      }

      const messages = store.messages.filter(
        (message) => !(message.roomId === roomId && ids.has(message.id))
      );

      await writeStore({ ...store, messages });

      return NextResponse.json({
        ok: true,
        messages: messages
          .filter((message) => message.roomId === roomId)
          .slice(-DEFAULT_LIMIT),
      });
    }

    if (action === "delete-room") {
      const requesterEmail = normalizeEmail(
        payload?.requesterEmail
      );

      const roomToDelete = store.rooms.find(
        (room) => room.id === roomId
      );

      const requesterIsOwner =
        roomToDelete &&
        normalizeEmail(roomToDelete.ownerEmail) ===
          requesterEmail;

      const expected = String(
        process.env.TEAM_CHAT_ADMIN_PASSWORD || ""
      );
      const submitted = String(payload?.adminPassword || "");

      const validAdmin =
        Boolean(expected && submitted) &&
        safePasswordMatch(submitted, expected);

      if (!requesterIsOwner && !validAdmin) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Only the group owner or an administrator can delete this group.",
          },
          { status: 403 }
        );
      }

      if (roomId === DEFAULT_ROOM_ID) {
        return NextResponse.json(
          {
            ok: false,
            error: "The General group cannot be deleted.",
          },
          { status: 400 }
        );
      }

      const roomExists = store.rooms.some(
        (room) => room.id === roomId
      );

      if (!roomExists) {
        return NextResponse.json(
          {
            ok: false,
            error: "Group chat was not found.",
          },
          { status: 404 }
        );
      }

      const nextStore = {
        ...store,
        rooms: store.rooms.filter(
          (room) => room.id !== roomId
        ),
        messages: store.messages.filter(
          (message) => message.roomId !== roomId
        ),
      };

      await writeStore(nextStore);

      return NextResponse.json({
        ok: true,
        rooms: nextStore.rooms,
      });
    }

    if (action === "clear-chat") {
      const expected = String(process.env.TEAM_CHAT_ADMIN_PASSWORD || "");
      const submitted = String(payload?.adminPassword || "");

      if (!expected) {
        return NextResponse.json(
          {
            ok: false,
            error: "TEAM_CHAT_ADMIN_PASSWORD is not configured in Vercel.",
          },
          { status: 500 }
        );
      }

      if (!submitted || !safePasswordMatch(submitted, expected)) {
        return NextResponse.json(
          { ok: false, error: "Incorrect administrator password." },
          { status: 403 }
        );
      }

      const messages = store.messages.filter(
        (message) => message.roomId !== roomId
      );

      await writeStore({ ...store, messages });

      return NextResponse.json({ ok: true, messages: [] });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported chat action." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to update chat." },
      { status: 500 }
    );
  }
}
