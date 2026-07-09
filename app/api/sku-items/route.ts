import { NextRequest, NextResponse } from "next/server";
import { del, get, list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const LAST_GOOD_PATH = "emdc-state/last-good.json";
const SKU_ALL_PATH = "emdc-state/sku-items/all.json";
const SKU_UPLOAD_PREFIX = "emdc-state/sku-items/upload/";
const SKU_DELETED_KEYS_PATH = "emdc-state/sku-items/deleted-keys.json";

function safeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cleanSaveId(value: any) {
  return String(value || "latest").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160) || "latest";
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

async function deleteBlobPrefix(prefix: string) {
  try {
    let cursor: string | undefined = undefined;
    do {
      const result: any = await list({ prefix, cursor, limit: 1000 } as any);
      const urls = safeArray(result?.blobs).map((blob: any) => blob?.url || blob?.pathname).filter(Boolean);
      if (urls.length) await del(urls as any);
      cursor = result?.cursor;
    } while (cursor);
  } catch {}
}

export async function GET() {
  try {
    const rows = safeArray(await readJsonBlob(SKU_ALL_PATH));
    return NextResponse.json({ ok: true, count: rows.length, skuItems: rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load SKU items." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const saveId = cleanSaveId(body?.saveId || body?.updatedAt);
    const uploadPrefix = `${SKU_UPLOAD_PREFIX}${saveId}/`;
    const updatedAt = body?.updatedAt || new Date().toISOString();

    if (action === "begin") {
      await deleteBlobPrefix(uploadPrefix);
      await writeJsonBlob(`${uploadPrefix}meta.json`, {
        version: 1,
        saveId,
        updatedAt,
        total: Number(body?.total || 0),
        totalItems: Number(body?.totalItems || 0),
      });
      return NextResponse.json({ ok: true, action, saveId });
    }

    if (action === "chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }
      const rows = safeArray(body?.rows);
      await writeJsonBlob(`${uploadPrefix}chunk-${index}.json`, rows);
      return NextResponse.json({ ok: true, action, saveId, index, total, count: rows.length });
    }

    if (action === "commit") {
      const total = Number(body?.total || 0);
      const expectedTotalItems = Number(body?.totalItems || 0);
      if (!Number.isInteger(total) || total < 0 || total > 5000) {
        return NextResponse.json({ ok: false, error: "Invalid SKU commit total." }, { status: 400 });
      }

      const chunks = await Promise.all(
        Array.from({ length: total }, (_, index) => readJsonBlob(`${uploadPrefix}chunk-${index}.json`))
      );
      const missing = chunks.findIndex((chunk: any) => !Array.isArray(chunk));
      if (missing >= 0) {
        return NextResponse.json({ ok: false, error: `Missing SKU chunk ${missing + 1} of ${total}.` }, { status: 400 });
      }

      const rows = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
      if (expectedTotalItems && rows.length !== expectedTotalItems) {
        return NextResponse.json({ ok: false, error: `SKU count mismatch. Expected ${expectedTotalItems}, got ${rows.length}.` }, { status: 400 });
      }

      await writeJsonBlob(SKU_DELETED_KEYS_PATH, { updatedAt, keys: [] }).catch(() => {});
      await writeJsonBlob(SKU_ALL_PATH, rows);

      const existingRaw: any = await readJsonBlob(STATE_PATH);
      const existing: any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt,
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          skuItems: [],
          skuItemsExternalBlob: true,
          skuItemsExternalCloud: false,
          skuItemsExternalCount: rows.length,
          skuItemsCloudUpdatedAt: updatedAt,
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);
      await deleteBlobPrefix(uploadPrefix);

      return NextResponse.json({ ok: true, action, saveId, count: rows.length, data: payload });
    }

    // Full authoritative SKU replace.
    // This is intentionally a single endpoint so SKU Storage does not fight
    // the generic app-state sync. It writes the SKU file AND updates current.json
    // metadata so refresh/new tabs load the same SKU count.
    if (action === "replace") {
      const rows = safeArray(body?.skuItems || body?.rows);
      await writeJsonBlob(SKU_DELETED_KEYS_PATH, { updatedAt, keys: [] }).catch(() => {});
      await writeJsonBlob(SKU_ALL_PATH, rows);

      const existingRaw: any = await readJsonBlob(STATE_PATH);
      const existing: any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt,
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          skuItems: [],
          skuItemsExternalBlob: true,
          skuItemsExternalCloud: false,
          skuItemsExternalCount: rows.length,
          skuItemsCloudUpdatedAt: updatedAt,
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, action, count: rows.length, updatedAt, data: payload });
    }

    return NextResponse.json({ ok: false, error: "Unknown SKU action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to save SKU items." }, { status: 500 });
  }
}
