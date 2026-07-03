import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const SKU_CHUNK_PREFIX = "emdc:app-state:v1:sku-items:chunk:";
const SKU_META_KEY = "emdc:app-state:v1:sku-items:meta";
const LOCAL_STORAGE_CHUNK_PREFIX = "emdc:app-state:v1:local-storage:chunk:";
const LOCAL_STORAGE_META_KEY = "emdc:app-state:v1:local-storage:meta";
const LAST_GOOD_KEY = "emdc:app-state:v1:last-good";
const HISTORY_INDEX_KEY = "emdc:app-state:v1:history";
const HISTORY_PREFIX = "emdc:app-state:v1:backup:";

const MAX_LOCAL_STORAGE_VALUE_LENGTH = 80_000;
const MAX_SKU_CHUNKS = 2000;
const MAX_LOCAL_STORAGE_CHUNKS = 4000;

function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!url || !token) {
    throw new Error("Missing Redis REST environment variables.");
  }

  if (!url.startsWith("http")) {
    throw new Error("Redis URL must be the REST URL that starts with https://, not the rediss:// URL.");
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

function compactLocalStorage(localStorageValue: any) {
  if (!isRecord(localStorageValue)) return {};

  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(localStorageValue)) {
    const lowerKey = key.toLowerCase();
    if (!key.startsWith("emdc")) continue;

    // Never mirror backups/history back to Upstash; they are what filled the DB.
    if (lowerKey.includes("backup")) continue;
    if (lowerKey.includes("history")) continue;
    if (lowerKey.includes("last_good")) continue;
    if (lowerKey.includes("last-good")) continue;

    // Avoid duplicating huge caches in the main state. The dedicated chunk endpoints handle needed data.
    if (lowerKey.includes("generated_batch_outputs")) continue;
    if (lowerKey.includes("ai_saved_outputs")) continue;
    if (lowerKey.includes("text_saved_outputs")) continue;
    if (lowerKey.includes("protected_sku")) continue;

    const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue ?? "");
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
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_SKU_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => redis.get(`${SKU_CHUNK_PREFIX}${index}`))
  );

  const skuItems = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!skuItems.length) return data;

  return {
    ...data,
    appState: {
      ...appState,
      skuItems,
    },
  };
}

async function hydrateLocalStorageChunks(redis: Redis, data: any) {
  if (!isRecord(data)) return data;

  const meta: any = (await redis.get(LOCAL_STORAGE_META_KEY)) || {};
  const chunkCount = Number(meta.chunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_LOCAL_STORAGE_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => redis.get(`${LOCAL_STORAGE_CHUNK_PREFIX}${index}`))
  );

  const rows = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!rows.length) return data;

  const partsByKey: Record<string, any[]> = {};
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const key = String(row.key || "");
    if (!key.startsWith("emdc")) continue;
    if (!partsByKey[key]) partsByKey[key] = [];
    partsByKey[key].push(row);
  }

  const restored: Record<string, string> = {};
  for (const [key, parts] of Object.entries(partsByKey)) {
    const sorted = parts.sort((a: any, b: any) => Number(a.partIndex || 0) - Number(b.partIndex || 0));
    const partCount = Number(sorted[0]?.partCount || sorted.length);
    if (sorted.length < partCount) continue;
    restored[key] = sorted.slice(0, partCount).map((part: any) => String(part.valuePart || "")).join("");
  }

  return {
    ...data,
    localStorage: {
      ...(isRecord(data.localStorage) ? data.localStorage : {}),
      ...restored,
    },
  };
}

async function hydrateCloudData(redis: Redis, data: any) {
  const withSku = await hydrateSkuChunks(redis, data);
  return hydrateLocalStorageChunks(redis, withSku);
}

async function batchDelete(redis: Redis, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  let deleted = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    if (!batch.length) continue;
    try {
      const result = await (redis as any).del(...batch);
      deleted += Number(result || 0);
    } catch {
      for (const key of batch) {
        try {
          const result = await redis.del(key);
          deleted += Number(result || 0);
        } catch {}
      }
    }
  }
  return deleted;
}

async function deleteEmdcCloudKeys(redis: Redis) {
  const keys = new Set<string>([
    STATE_KEY,
    SKU_META_KEY,
    LOCAL_STORAGE_META_KEY,
    LAST_GOOD_KEY,
    HISTORY_INDEX_KEY,
  ]);

  // Delete exact known chunk ranges. This avoids needing Redis SCAN/KEYS support.
  for (let i = 0; i < MAX_SKU_CHUNKS; i++) keys.add(`${SKU_CHUNK_PREFIX}${i}`);
  for (let i = 0; i < MAX_LOCAL_STORAGE_CHUNKS; i++) keys.add(`${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);

  // Delete known history backup keys if the index still exists.
  try {
    const historyKeys = await redis.lrange(HISTORY_INDEX_KEY, 0, 500);
    for (const key of safeArray(historyKeys)) {
      const clean = String(key || "");
      if (clean.startsWith(HISTORY_PREFIX)) keys.add(clean);
    }
  } catch {}

  // If Upstash supports KEYS on this database, remove any other old EMDC backup/chunk keys too.
  try {
    const patternKeys = await (redis as any).keys("emdc:app-state:v1*");
    for (const key of safeArray(patternKeys)) {
      const clean = String(key || "");
      if (clean.startsWith("emdc:app-state:v1")) keys.add(clean);
    }
  } catch {}

  const deleted = await batchDelete(redis, Array.from(keys));
  return { attempted: keys.size, deleted };
}


async function deleteAllCloudKeys(redis: Redis) {
  const keys = new Set<string>();

  // This is an emergency reset for this EMDC Redis database.
  // It removes every key in the database so the normal-browser localStorage can republish a clean online copy.
  try {
    const allKeys = await (redis as any).keys("*");
    for (const key of safeArray(allKeys)) {
      const clean = String(key || "");
      if (clean) keys.add(clean);
    }
  } catch {}

  // Also include known EMDC ranges in case KEYS is limited.
  keys.add(STATE_KEY);
  keys.add(SKU_META_KEY);
  keys.add(LOCAL_STORAGE_META_KEY);
  keys.add(LAST_GOOD_KEY);
  keys.add(HISTORY_INDEX_KEY);
  for (let i = 0; i < MAX_SKU_CHUNKS; i++) keys.add(`${SKU_CHUNK_PREFIX}${i}`);
  for (let i = 0; i < MAX_LOCAL_STORAGE_CHUNKS; i++) keys.add(`${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);

  const deleted = await batchDelete(redis, Array.from(keys));
  return { attempted: keys.size, deleted };
}

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "current";

    if (mode === "history") {
      return NextResponse.json({ ok: true, mode, keys: [] });
    }

    if (mode === "last-good") {
      const data = await redis.get(LAST_GOOD_KEY);
      return NextResponse.json({ ok: true, mode, data: data ? await hydrateCloudData(redis, data) : emptyState });
    }

    const data = await redis.get(STATE_KEY);
    return NextResponse.json({ ok: true, mode: "current", data: data ? await hydrateCloudData(redis, data) : emptyState });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to read EMDC state from Redis.", data: emptyState },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "";
    const body = await req.json().catch(() => ({}));

    if (mode === "cleanup-all-cloud" || body?.mode === "cleanup-all-cloud") {
      const result = await deleteAllCloudKeys(redis);
      return NextResponse.json({ ok: true, mode: "cleanup-all-cloud", ...result });
    }

    if (mode === "cleanup-cloud" || body?.mode === "cleanup-cloud") {
      const result = await deleteEmdcCloudKeys(redis);
      return NextResponse.json({ ok: true, mode: "cleanup-cloud", ...result });
    }

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_SKU_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }

      // When a new upload begins, clear stale SKU chunks so counts do not drift.
      if (index === 0) {
        const staleKeys = Array.from({ length: MAX_SKU_CHUNKS }, (_, i) => `${SKU_CHUNK_PREFIX}${i}`);
        await batchDelete(redis, staleKeys);
      }

      await Promise.all([
        redis.set(`${SKU_CHUNK_PREFIX}${index}`, rows),
        redis.set(SKU_META_KEY, {
          version: 1,
          clientId: body?.clientId || "",
          updatedAt: body?.updatedAt || new Date().toISOString(),
          chunkCount: total,
          totalItems: Number(body?.totalItems || 0),
        }),
      ]);

      return NextResponse.json({ ok: true, mode: "sku-chunk", index, total, count: rows.length });
    }

    if (mode === "local-storage-chunk" || body?.mode === "local-storage-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows).filter((row: any) => {
        const key = String(row?.key || "").toLowerCase();
        return key.startsWith("emdc") && !key.includes("backup") && !key.includes("history") && !key.includes("last_good") && !key.includes("last-good");
      });

      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_LOCAL_STORAGE_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid local storage chunk index." }, { status: 400 });
      }

      // When a new upload begins, clear stale local-storage chunks.
      if (index === 0) {
        const staleKeys = Array.from({ length: MAX_LOCAL_STORAGE_CHUNKS }, (_, i) => `${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);
        await batchDelete(redis, staleKeys);
      }

      await Promise.all([
        redis.set(`${LOCAL_STORAGE_CHUNK_PREFIX}${index}`, rows),
        redis.set(LOCAL_STORAGE_META_KEY, {
          version: 1,
          clientId: body?.clientId || "",
          updatedAt: body?.updatedAt || new Date().toISOString(),
          chunkCount: total,
          totalKeys: Number(body?.totalKeys || 0),
          totalRows: Number(body?.totalRows || 0),
        }),
      ]);

      return NextResponse.json({ ok: true, mode: "local-storage-chunk", index, total, count: rows.length });
    }

    const payload = {
      version: 1,
      clientId: body?.clientId || "",
      updatedAt: body?.updatedAt || new Date().toISOString(),
      appState: isRecord(body?.appState) ? body.appState : {},
      localStorage: compactLocalStorage(body?.localStorage),
    };

    await redis.set(STATE_KEY, payload);

    // Keep one small recoverable pointer only. Do not create history backups on the free Redis quota.
    await redis.set(LAST_GOOD_KEY, payload);

    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save EMDC state to Redis." },
      { status: 500 }
    );
  }
}
