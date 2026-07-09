import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const LAST_GOOD_PATH = "emdc-state/last-good.json";
const SKU_ALL_PATH = "emdc-state/sku-items/all.json";
const SKU_META_PATH = "emdc-state/sku-items/meta.json";
const SKU_DELETED_KEYS_PATH = "emdc-state/sku-items/deleted-keys.json";

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

async function streamToText(stream: any) {
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

async function readJsonBlob(pathname: string) {
  try {
    const result: any = await get(pathname, { access: "private" } as any);
    const text = await streamToText(result?.stream);
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, value: any) {
  return put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  } as any);
}

function isoTime(value: any) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

export async function GET() {
  try {
    const skuItemsRaw = await readJsonBlob(SKU_ALL_PATH);
    const skuItems = Array.isArray(skuItemsRaw) ? skuItemsRaw : [];
    const meta = (await readJsonBlob(SKU_META_PATH)) || {};

    return NextResponse.json({
      ok: true,
      count: skuItems.length,
      updatedAt: meta?.updatedAt || "",
      skuItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to read SKU items." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingSkuItems = Array.isArray(body?.skuItems) ? body.skuItems : [];
    const updatedAt = body?.updatedAt || new Date().toISOString();

    // Prevent an older overlapping save from overwriting a newer completed SKU save.
    const existingMeta: any = (await readJsonBlob(SKU_META_PATH)) || {};
    if (existingMeta?.updatedAt && isoTime(existingMeta.updatedAt) > isoTime(updatedAt)) {
      return NextResponse.json(
        {
          ok: false,
          stale: true,
          error: "Blocked stale SKU save. A newer SKU save already exists.",
          existingUpdatedAt: existingMeta.updatedAt,
          existingCount: existingMeta.count || 0,
        },
        { status: 409 }
      );
    }

    await writeJsonBlob(SKU_ALL_PATH, incomingSkuItems);
    await writeJsonBlob(SKU_META_PATH, {
      updatedAt,
      count: incomingSkuItems.length,
      clientId: body?.clientId || "",
      source: "dedicated-sku-items-endpoint",
    });

    // When saving the exact current SKU list, old delete tombstones must not remove newly re-added SKUs.
    await writeJsonBlob(SKU_DELETED_KEYS_PATH, { updatedAt, keys: [] }).catch(() => {});

    const existingStateRaw: any = await readJsonBlob(STATE_PATH);
    const existingState: any = existingStateRaw && isRecord(existingStateRaw)
      ? existingStateRaw
      : { version: 1, updatedAt: "", appState: {}, localStorage: {} };

    const payload = {
      ...existingState,
      version: 1,
      clientId: body?.clientId || existingState?.clientId || "",
      updatedAt,
      appState: {
        ...(isRecord(existingState?.appState) ? existingState.appState : {}),
        skuItems: [],
        skuItemsExternalBlob: true,
        skuItemsExternalCloud: false,
        skuItemsExternalCount: incomingSkuItems.length,
        skuItemsCloudUpdatedAt: updatedAt,
      },
      localStorage: isRecord(existingState?.localStorage) ? existingState.localStorage : {},
    };

    await writeJsonBlob(STATE_PATH, payload);
    await writeJsonBlob(LAST_GOOD_PATH, payload);

    return NextResponse.json({
      ok: true,
      count: incomingSkuItems.length,
      updatedAt,
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save SKU items." },
      { status: 500 }
    );
  }
}
