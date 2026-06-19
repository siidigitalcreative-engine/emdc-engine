import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";

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

export async function GET() {
  try {
    const redis = getRedisClient();
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

    const payload = {
      version: 1,
      ...body,
      updatedAt: body?.updatedAt || new Date().toISOString(),
    };

    await redis.set(STATE_KEY, payload);

    return NextResponse.json({
      ok: true,
      data: payload,
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
