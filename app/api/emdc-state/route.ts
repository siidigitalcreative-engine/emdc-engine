import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const LAST_GOOD_KEY = "emdc:app-state:v1:last-good";
const HISTORY_KEY = "emdc:app-state:v1:history";
const MAX_HISTORY_ITEMS = 10;

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

function safeParse(value: any) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function countChecklistItems(items: any) {
  if (!items || typeof items !== "object") return 0;
  return Object.values(items).reduce((sum: number, value: any) => {
    if (Array.isArray(value)) return sum + value.length;
    if (value && typeof value === "object") return sum + 1;
    return sum;
  }, 0);
}

function getAppState(payload: any) {
  return payload?.appState && typeof payload.appState === "object"
    ? payload.appState
    : payload;
}

function getStateWeight(payload: any) {
  const state = getAppState(payload);
  if (!state || typeof state !== "object") return 0;

  return (
    (Array.isArray(state.skuItems) ? state.skuItems.length : 0) +
    (Array.isArray(state.checklistGroups) ? state.checklistGroups.length : 0) +
    countChecklistItems(state.checklistItems)
  );
}

function getSafeCloudLocalStorage(localStorageValue: any) {
  if (!localStorageValue || typeof localStorageValue !== "object") return {};
  const next: Record<string, any> = {};
  const omitted: string[] = [];

  Object.entries(localStorageValue).forEach(([key,value]: any) => {
    const size = String(value || "").length;
    const k = String(key || "");
    const heavy =
      k === "emdc_app_state_v1" ||
      k === "emdc_app_state_last_good_v1" ||
      k === "emdc_app_state_history_v1" ||
      k.includes("history") ||
      k.includes("last_good") ||
      k.includes("generated_batch_outputs") ||
      k.includes("saved_outputs") ||
      k.includes("ai_saved_outputs") ||
      size > 120000;

    if (heavy) {
      omitted.push(k);
      return;
    }
    next[k] = value;
  });

  if (omitted.length) next.emdc_cloud_omitted_large_local_keys_v1 = JSON.stringify(omitted);
  return next;
}

function compactPayload(payload: any) {
  if (!payload || typeof payload !== "object") return payload;
  return {
    ...payload,
    localStorage: getSafeCloudLocalStorage(payload.localStorage),
  };
}

async function saveBackup(redis: Redis, current: any, reason: string) {
  try {
    if (!current || getStateWeight(current) <= 0) return;

    const compactCurrent = compactPayload(current);
    const backup = {
      reason,
      savedAt: new Date().toISOString(),
      data: compactCurrent,
    };

    await redis.set(LAST_GOOD_KEY, backup);
    await redis.lpush(HISTORY_KEY, backup);
    await redis.ltrim(HISTORY_KEY, 0, MAX_HISTORY_ITEMS - 1);
  } catch {
    // Do not fail the main save just because backup/history write failed.
  }
}

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const mode = req.nextUrl.searchParams.get("mode");

    if (mode === "last-good") {
      const lastGood = await redis.get(LAST_GOOD_KEY);
      return NextResponse.json({
        ok: true,
        data: lastGood || emptyState,
      });
    }

    if (mode === "history") {
      const history = await redis.lrange(HISTORY_KEY, 0, MAX_HISTORY_ITEMS - 1);
      return NextResponse.json({
        ok: true,
        data: history || [],
      });
    }

    const data = await redis.get(STATE_KEY);

    return NextResponse.json({
      ok: true,
      data: data || emptyState,
    });
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

    const current = await redis.get(STATE_KEY);
    const lastGood = await redis.get(LAST_GOOD_KEY);

    const currentWeight = getStateWeight(current);
    const lastGoodWeight = getStateWeight(safeParse((lastGood as any)?.data) || (lastGood as any)?.data || lastGood);

    const payload = compactPayload({
      version: 1,
      ...body,
      updatedAt: body?.updatedAt || new Date().toISOString(),
    });

    const nextWeight = getStateWeight(payload);

    // Critical safety guard:
    // Never allow a suddenly empty SKU/checklist payload to overwrite a richer saved state.
    // This protects against UI bugs, hydration errors, or failed local state loading.
    if (nextWeight === 0 && Math.max(currentWeight, lastGoodWeight) > 0) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          error:
            "Blocked empty EMDC state from overwriting existing SKU/checklist data. Export/restore first if this was intentional.",
          currentWeight,
          lastGoodWeight,
          nextWeight,
        },
        { status: 409 }
      );
    }

    await saveBackup(redis, current, "before-overwrite");

    await redis.set(STATE_KEY, payload);

    if (nextWeight > 0) {
      await saveBackup(redis, payload, "saved-new-good-state");
    }

    return NextResponse.json({
      ok: true,
      data: payload,
      currentWeight,
      nextWeight,
    });
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
