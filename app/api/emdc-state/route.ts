import { NextRequest, NextResponse } from "next/server";
import { del, get, list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const LAST_GOOD_PATH = "emdc-state/last-good.json";
const SKU_ALL_PATH = "emdc-state/sku-items/all.json";
const CHECKLIST_ITEMS_PATH = "emdc-state/checklist-items/all.json";
const CHECKLIST_GROUPS_PATH = "emdc-state/checklist-groups/all.json";
const LOCAL_SNAPSHOT_PATH = "emdc-state/local-snapshot/all.json";
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

async function hydrateSkuData(data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;

  const appState = data.appState;

  // Preferred Blob SKU source: one dedicated private JSON file.
  const allSkuItems = await readJsonBlob(SKU_ALL_PATH);
  if (Array.isArray(allSkuItems) && allSkuItems.length) {
    return {
      ...data,
      appState: {
        ...appState,
        skuItems: allSkuItems,
        skuItemsExternalCloud: false,
        skuItemsExternalBlob: true,
        skuItemsExternalCount: allSkuItems.length,
      },
    };
  }

  // Backward compatibility for older chunked saves.
  const needsChunkHydration =
    !!appState.skuItemsExternalCloud ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0 ||
    (safeArray(appState.skuItems).length === 0 && Number(appState.skuItemsExternalCount || 0) > 0);

  if (!needsChunkHydration) return data;

  const meta: any = (await readJsonBlob(SKU_META_PATH)) || {};
  const chunkCount = Number(meta.chunkCount || appState.skuItemsCloudChunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_SKU_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => readJsonBlob(`${SKU_CHUNK_PREFIX}${index}.json`))
  );

  const skuItems = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!skuItems.length) return data;

  // Migrate old chunks into the stable all.json file.
  await writeJsonBlob(SKU_ALL_PATH, skuItems).catch(() => {});

  return {
    ...data,
    appState: {
      ...appState,
      skuItems,
      skuItemsExternalCloud: false,
      skuItemsExternalBlob: true,
      skuItemsExternalCount: skuItems.length,
    },
  };
}


async function hydrateChecklistGroupsData(data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;
  const savedChecklistGroups = await readJsonBlob(CHECKLIST_GROUPS_PATH);
  if (Array.isArray(savedChecklistGroups)) {
    return { ...data, appState: { ...data.appState, checklistGroups: savedChecklistGroups } };
  }
  return data;
}

async function hydrateChecklistItemsData(data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;

  const savedChecklistItems = await readJsonBlob(CHECKLIST_ITEMS_PATH);
  if (savedChecklistItems && isRecord(savedChecklistItems)) {
    return {
      ...data,
      appState: {
        ...data.appState,
        checklistItems: savedChecklistItems,
      },
    };
  }

  return data;
}



async function hydrateLocalSnapshotData(data: any) {
  if (!isRecord(data)) return data;
  const savedLocalSnapshot = await readJsonBlob(LOCAL_SNAPSHOT_PATH);
  if (savedLocalSnapshot && isRecord(savedLocalSnapshot)) {
    return {
      ...data,
      localStorage: savedLocalSnapshot,
    };
  }
  return data;
}

async function hydrateCloudData(data: any) {
  const withSku = await hydrateSkuData(data);
  const withGroups = await hydrateChecklistGroupsData(withSku);
  const withItems = await hydrateChecklistItemsData(withGroups);
  return hydrateLocalSnapshotData(withItems);
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
        del([STATE_PATH, LAST_GOOD_PATH, SKU_ALL_PATH, SKU_META_PATH, CHECKLIST_ITEMS_PATH, CHECKLIST_GROUPS_PATH, LOCAL_SNAPSHOT_PATH] as any).catch(() => {}),
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

      // Keep supporting the old chunk calls from page.tsx, but also consolidate into all.json
      // after the final chunk so newly added SKUs do not disappear on refresh/poll.
      await writeJsonBlob(`${SKU_CHUNK_PREFIX}${index}.json`, rows);

      const meta = {
        version: 1,
        clientId: body?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        chunkCount: total,
        totalItems: Number(body?.totalItems || 0),
      };
      await writeJsonBlob(SKU_META_PATH, meta);

      if (index === total - 1) {
        const chunks = await Promise.all(
          Array.from({ length: total }, (_, i) => readJsonBlob(`${SKU_CHUNK_PREFIX}${i}.json`))
        );
        const allRows = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
        if (allRows.length) {
          await writeJsonBlob(SKU_ALL_PATH, allRows);
        }
      }

      return NextResponse.json({ ok: true, mode: "sku-chunk", index, total, count: rows.length });
    }

    if (mode === "app-patch" || body?.mode === "app-patch") {
      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const patch = isRecord(body?.patch) ? body.patch : {};
      const existingAppState:any = isRecord(existing?.appState) ? existing.appState : {};
      let nextAppState:any = { ...existingAppState, ...patch };

      if (Array.isArray((patch as any).skuItems)) {
        const nextSkus = safeArray((patch as any).skuItems);
        await writeJsonBlob(SKU_ALL_PATH, nextSkus);
        nextAppState = { ...nextAppState, skuItems: [], skuItemsExternalBlob: true, skuItemsExternalCount: nextSkus.length };
      }

      if (Array.isArray((patch as any).checklistGroups)) {
        const nextGroups = safeArray((patch as any).checklistGroups);
        await writeJsonBlob(CHECKLIST_GROUPS_PATH, nextGroups);
        nextAppState = { ...nextAppState, checklistGroups: nextGroups, checklistGroupsExternalBlob: true };
      }

      if (isRecord((patch as any).checklistItems)) {
        await writeJsonBlob(CHECKLIST_ITEMS_PATH, (patch as any).checklistItems);
        nextAppState = { ...nextAppState, checklistItems: (patch as any).checklistItems, checklistItemsExternalBlob: true };
      }

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        appState: nextAppState,
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, mode: "app-patch", data: payload });
    }

    if (mode === "sku-items" || body?.mode === "sku-items") {
      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const nextSkus = safeArray(body?.skuItems);
      await writeJsonBlob(SKU_ALL_PATH, nextSkus);

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          skuItems: [],
          skuItemsExternalBlob: true,
          skuItemsExternalCount: nextSkus.length,
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, mode: "sku-items", count: nextSkus.length, data: payload });
    }

    if (mode === "checklist-groups" || body?.mode === "checklist-groups") {
      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const nextGroups = safeArray(body?.checklistGroups);
      await writeJsonBlob(CHECKLIST_GROUPS_PATH, nextGroups);

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          checklistGroups: nextGroups,
          checklistGroupsExternalBlob: true,
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, mode: "checklist-groups", count: nextGroups.length, data: payload });
    }

    if (mode === "checklist-items" || body?.mode === "checklist-items") {
      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const nextItems = isRecord(body?.checklistItems) ? body.checklistItems : {};
      await writeJsonBlob(CHECKLIST_ITEMS_PATH, nextItems);

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          checklistItems: nextItems,
          checklistItemsExternalBlob: true,
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, mode: "checklist-items", data: payload });
    }

    if (mode === "local-snapshot" || body?.mode === "local-snapshot") {
      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const snapshot = isRecord(body?.localStorage) ? body.localStorage : {};
      await writeJsonBlob(LOCAL_SNAPSHOT_PATH, snapshot);

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        localStorage: snapshot,
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({ ok: true, mode: "local-snapshot", totalKeys: Object.keys(snapshot).length, data: payload });
    }

    if (mode === "local-storage-chunk" || body?.mode === "local-storage-chunk") {
      return NextResponse.json({ ok: true, mode: "local-storage-chunk", disabled: true, count: 0 });
    }

    const incomingAppState = isRecord(body?.appState) ? body.appState : {};
    const incomingSkuItems = safeArray((incomingAppState as any).skuItems);

    // Any POST that includes SKU rows becomes the authoritative SKU Blob file.
    // This covers adding 88 SKUs, editing SKUs, and importing backup files.
    let appStateForSave: any = incomingAppState;
    if (incomingSkuItems.length > 0) {
      await writeJsonBlob(SKU_ALL_PATH, incomingSkuItems);
      appStateForSave = {
        ...incomingAppState,
        skuItems: [],
        skuItemsExternalBlob: true,
        skuItemsExternalCount: incomingSkuItems.length,
      };
    }

    if (!hasMeaningfulAppState(appStateForSave)) {
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
      appState: appStateForSave,
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
