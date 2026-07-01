import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const LAST_GOOD_KEY = "emdc:app-state:v1:last-good";
const HISTORY_INDEX_KEY = "emdc:app-state:v1:history";
const HISTORY_PREFIX = "emdc:app-state:v1:backup:";
const MAX_HISTORY = 25;
const MAX_LOCAL_STORAGE_VALUE_LENGTH = 300_000;

function getRedisClient() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!url || !token) {
    throw new Error(
      "Missing Redis REST environment variables. Add KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }

  if (!url.startsWith("http")) {
    throw new Error(
      "Redis URL must be the REST URL that starts with https://, not the rediss:// URL."
    );
  }

  return new Redis({ url, token });
}

const emptyState = {
  version: 1,
  updatedAt: "",
  appState: {},
  localStorage: {},
};

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function hasChecklistItems(value: any) {
  if (!isRecord(value)) return false;
  return Object.values(value).some((items: any) => Array.isArray(items) && items.length > 0);
}

function isMeaningfulState(data: any) {
  const appState = data?.appState || data || {};
  return (
    safeArray(appState.skuItems).length > 0 ||
    safeArray(appState.checklistGroups).length > 0 ||
    hasChecklistItems(appState.checklistItems) ||
    safeArray(appState.overviewOutputs).length > 0 ||
    safeArray(appState.savedOutputs).length > 0 ||
    safeArray(appState.digitalCreativeRows).length > 0 ||
    safeArray(appState.digitalCreativeSavedOutputs).length > 0
  );
}

function cleanTimestamp(value?: string) {
  return String(value || new Date().toISOString())
    .replace(/[^0-9A-Za-z._-]/g, "-")
    .slice(0, 80);
}

function compactLocalStorage(localStorageValue: any) {
  if (!isRecord(localStorageValue)) return {};

  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(localStorageValue)) {
    const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue ?? "");
    const lowerKey = key.toLowerCase();

    // Do not mirror backup/history keys back into Redis on every save.
    if (lowerKey.includes("backup") || lowerKey.includes("history") || lowerKey.includes("last_good") || lowerKey.includes("last-good")) continue;

    // Avoid duplicating large generated output caches in every shared sync save.
    if (lowerKey.includes("generated_batch_outputs")) continue;
    if (lowerKey.includes("ai_saved_outputs")) continue;
    if (lowerKey.includes("text_saved_outputs")) continue;

    if (value.length > MAX_LOCAL_STORAGE_VALUE_LENGTH) continue;

    result[key] = value;
  }

  return result;
}

async function saveBackup(redis: Redis, currentData: any, label = "auto") {
  if (!currentData || !isMeaningfulState(currentData)) return;

  const timestamp = cleanTimestamp(currentData?.updatedAt || new Date().toISOString());
  const backupKey = `${HISTORY_PREFIX}${timestamp}:${label}`;

  await Promise.allSettled([
    redis.set(backupKey, currentData),
    redis.set(LAST_GOOD_KEY, currentData),
    redis.lpush(HISTORY_INDEX_KEY, backupKey),
    redis.ltrim(HISTORY_INDEX_KEY, 0, MAX_HISTORY - 1),
  ]);
}

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "current";
    const key = searchParams.get("key") || "";

    if (mode === "last-good") {
      const data = await redis.get(LAST_GOOD_KEY);
      return NextResponse.json({ ok: true, mode, data: data || emptyState });
    }

    if (mode === "history") {
      const keys = (await redis.lrange(HISTORY_INDEX_KEY, 0, MAX_HISTORY - 1)) || [];
      return NextResponse.json({ ok: true, mode, keys });
    }

    if (mode === "backup" && key.startsWith(HISTORY_PREFIX)) {
      const data = await redis.get(key);
      return NextResponse.json({ ok: true, mode, key, data: data || null });
    }

    const data = await redis.get(STATE_KEY);
    return NextResponse.json({ ok: true, mode: "current", data: data || emptyState });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to read EMDC state from Redis.",
        data: emptyState,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const body = await req.json();
    const currentData = await redis.get(STATE_KEY);

    // Always protect the previous good state before replacing the main key.
    await saveBackup(redis, currentData, "before-write");

    const payload = {
      version: 1,
      clientId: body?.clientId || "",
      updatedAt: body?.updatedAt || new Date().toISOString(),
      appState: isRecord(body?.appState) ? body.appState : {},
      localStorage: compactLocalStorage(body?.localStorage),
    };

    await redis.set(STATE_KEY, payload);

    // If the new save is also meaningful, mark it as the newest recoverable version.
    if (isMeaningfulState(payload)) {
      await Promise.allSettled([
        redis.set(LAST_GOOD_KEY, payload),
        redis.lpush(HISTORY_INDEX_KEY, `${HISTORY_PREFIX}${cleanTimestamp(payload.updatedAt)}:current`),
        redis.ltrim(HISTORY_INDEX_KEY, 0, MAX_HISTORY - 1),
      ]);
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to save EMDC state to Redis.",
      },
      { status: 500 }
    );
  }
}
