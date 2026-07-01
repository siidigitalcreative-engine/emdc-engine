import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const SKU_CHUNK_PREFIX = "emdc:app-state:v1:sku-items:chunk:";
const SKU_META_KEY = "emdc:app-state:v1:sku-items:meta";
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
    Number(appState.skuItemsExternalCount || 0) > 0 ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0 ||
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

async function hydrateSkuChunks(redis: Redis, data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;

  const appState = data.appState;
  const needsSkuHydration =
    !!appState.skuItemsExternalCloud ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0 ||
    (safeArray(appState.skuItems).length === 0 && Number(appState.skuItemsExternalCount || 0) > 0);

  if (!needsSkuHydration) return data;

  const meta: any = (await redis.get(SKU_META_KEY)) || {};
  const chunkCount = Number(meta.chunkCount || appState.skuItemsCloudChunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > 1000) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => redis.get(`${SKU_CHUNK_PREFIX}${index}`))
  );

  const skuItems = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!skuItems.length) return data;

  return {
    ...data,
    appState:{
      ...appState,
      skuItems,
    },
  };
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
      return NextResponse.json({ ok: true, mode, data: data ? await hydrateSkuChunks(redis,data) : emptyState });
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
    return NextResponse.json({ ok: true, mode: "current", data: data ? await hydrateSkuChunks(redis,data) : emptyState });
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
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "";
    const body = await req.json();

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total) {
        return NextResponse.json({ ok:false, error:"Invalid SKU chunk index." }, { status:400 });
      }

      await Promise.all([
        redis.set(`${SKU_CHUNK_PREFIX}${index}`, rows),
        redis.set(SKU_META_KEY, {
          version:1,
          clientId:body?.clientId || "",
          updatedAt:body?.updatedAt || new Date().toISOString(),
          chunkCount:total,
          totalItems:Number(body?.totalItems || 0),
        }),
      ]);

      return NextResponse.json({ ok:true, mode:"sku-chunk", index, total, count:rows.length });
    }

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
