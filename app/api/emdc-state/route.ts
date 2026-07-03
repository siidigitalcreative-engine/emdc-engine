import { NextRequest, NextResponse } from "next/server";
import { del, head, list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const LAST_GOOD_PATH = "emdc-state/last-good.json";
const SKU_META_PATH = "emdc-state/sku-items/meta.json";
const SKU_CHUNK_PREFIX = "emdc-state/sku-items/chunk-";

const MAX_SKU_CHUNKS = 2000;

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

async function readJsonBlob(pathname: string) {
  try {
    const info: any = await head(pathname);
    if (!info?.url) return null;
    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, value: any) {
  return put(pathname, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  } as any);
}

async function deleteBlobPrefix(prefix: string) {
  try {
    let cursor: string | undefined = undefined;
    do {
      const result: any = await list({ prefix, cursor, limit: 1000 });
      const urls = safeArray(result?.blobs).map((blob: any) => blob?.url).filter(Boolean);
      if (urls.length) await del(urls);
      cursor = result?.cursor;
    } while (cursor);
  } catch {}
}

async function hydrateSkuChunks(data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;

  const appState = data.appState;
  const needsSkuHydration =
    !!appState.skuItemsExternalCloud ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0 ||
    (safeArray(appState.skuItems).length === 0 && Number(appState.skuItemsExternalCount || 0) > 0);

  if (!needsSkuHydration) return data;

  const meta: any = (await readJsonBlob(SKU_META_PATH)) || {};
  const chunkCount = Number(meta.chunkCount || appState.skuItemsCloudChunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_SKU_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => readJsonBlob(`${SKU_CHUNK_PREFIX}${index}.json`))
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

async function hydrateCloudData(data: any) {
  return hydrateSkuChunks(data);
}

function hasMeaningfulAppState(appState: any) {
  if (!isRecord(appState)) return false;
  return (
    safeArray(appState.skuItems).length > 0 ||
    safeArray(appState.checklistGroups).length > 0 ||
    Object.keys(isRecord(appState.checklistItems) ? appState.checklistItems : {}).length > 0 ||
    safeArray(appState.calendarEvents).length > 0 ||
    safeArray(appState.seasonalEvents).length > 0 ||
    Number(appState.skuItemsExternalCount || 0) > 0 ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "current";

    if (mode === "history") {
      return NextResponse.json({ ok: true, mode, keys: [] });
    }

    if (mode === "last-good") {
      const data = await readJsonBlob(LAST_GOOD_PATH);
      return NextResponse.json({ ok: true, mode, data: data ? await hydrateCloudData(data) : emptyState });
    }

    const data = await readJsonBlob(STATE_PATH);
    return NextResponse.json({ ok: true, mode: "current", data: data ? await hydrateCloudData(data) : emptyState });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to read EMDC state from Vercel Blob.", data: emptyState },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "";
    const body = await req.json().catch(() => ({}));

    if (mode === "cleanup-all-cloud" || body?.mode === "cleanup-all-cloud" || mode === "cleanup-cloud" || body?.mode === "cleanup-cloud") {
      await Promise.all([
        del([STATE_PATH, LAST_GOOD_PATH, SKU_META_PATH]).catch(() => {}),
        deleteBlobPrefix(SKU_CHUNK_PREFIX),
      ]);
      return NextResponse.json({ ok: true, mode: mode || body?.mode || "cleanup-cloud" });
    }

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows);

      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_SKU_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }

      if (index === 0) {
        await deleteBlobPrefix(SKU_CHUNK_PREFIX);
      }

      await Promise.all([
        writeJsonBlob(`${SKU_CHUNK_PREFIX}${index}.json`, rows),
        writeJsonBlob(SKU_META_PATH, {
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
      return NextResponse.json({ ok: true, mode: "local-storage-chunk", disabled: true, count: 0 });
    }

    const incomingAppState = isRecord(body?.appState) ? body.appState : {};

    if (!hasMeaningfulAppState(incomingAppState)) {
      const existing = await readJsonBlob(STATE_PATH);
      if (existing && hasMeaningfulAppState(existing?.appState)) {
        return NextResponse.json(
          { ok: false, blocked: true, error: "Blocked empty state overwrite.", data: existing },
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

    await writeJsonBlob(STATE_PATH, payload);
    await writeJsonBlob(LAST_GOOD_PATH, payload);

    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save EMDC state to Vercel Blob." },
      { status: 500 }
    );
  }
}
