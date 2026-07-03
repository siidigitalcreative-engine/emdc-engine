import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const SKU_CHUNK_PREFIX = "emdc:app-state:v1:sku-items:chunk:";
const SKU_META_KEY = "emdc:app-state:v1:sku-items:meta";
const MAX_SKU_CHUNKS = 2000;

function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!url || !token) throw new Error("Missing Redis REST environment variables.");
  if (!url.startsWith("http")) throw new Error("Redis URL must be the REST URL that starts with https://, not the rediss:// URL.");

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

function appStateHasData(appState: any) {
  if (!isRecord(appState)) return false;
  if (safeArray(appState.skuItems).length > 0) return true;
  if (Number(appState.skuItemsExternalCount || 0) > 0) return true;
  if (safeArray(appState.checklistGroups).length > 0) return true;
  if (isRecord(appState.checklistItems) && Object.keys(appState.checklistItems).length > 0) return true;
  if (safeArray(appState.calendarEvents).length > 0) return true;
  if (safeArray(appState.seasonalEvents).length > 0) return true;
  return false;
}

async function batchDelete(redis: Redis, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    if (!batch.length) continue;
    try { await (redis as any).del(...batch); }
    catch {
      for (const key of batch) {
        try { await redis.del(key); } catch {}
      }
    }
  }
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

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const data = await redis.get(STATE_KEY);
    return NextResponse.json({ ok: true, mode: "current", data: data ? await hydrateSkuChunks(redis, data) : emptyState });
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

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_SKU_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }

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

    // Local-storage chunks are intentionally disabled. Redis state is the only source of truth.
    if (mode === "local-storage-chunk" || body?.mode === "local-storage-chunk") {
      return NextResponse.json({ ok: true, mode: "local-storage-chunk", disabled: true });
    }

    const incomingAppState = isRecord(body?.appState) ? body.appState : {};
    if (!appStateHasData(incomingAppState)) {
      const existing: any = await redis.get(STATE_KEY);
      if (existing && isRecord(existing) && appStateHasData(existing.appState)) {
        return NextResponse.json(
          { ok: false, blocked: true, error: "Blocked empty state overwrite.", data: await hydrateSkuChunks(redis, existing) },
          { status: 409 }
        );
      }
    }

    const payload = {
      version: 1,
      clientId: body?.clientId || "",
      updatedAt: body?.updatedAt || new Date().toISOString(),
      appState: incomingAppState,
      localStorage: {},
    };

    await redis.set(STATE_KEY, payload);
    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save EMDC state to Redis." },
      { status: 500 }
    );
  }
}
