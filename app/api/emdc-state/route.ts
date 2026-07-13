import { NextRequest, NextResponse } from "next/server";
import { del, get, list, put } from "@vercel/blob";
import { createServerClient } from "@supabase/ssr";

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
const SKU_SESSION_CHUNK_PREFIX = "emdc-state/sku-items/sessions/";
const SKU_DELETED_KEYS_PATH = "emdc-state/sku-items/deleted-keys.json";

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

function skuKey(row: any) {
  return String(row?.sku || row?.skuCode || row?.value || row?.id || "")
    .trim()
    .toLowerCase();
}

function skuLabel(row: any) {
  return String(row?.sku || row?.skuCode || row?.value || row?.id || "Unknown SKU").trim();
}

function productLabel(row: any) {
  return String(row?.productName || row?.product || row?.name || row?.title || "").trim();
}

function comparableValue(value: any) {
  if (!value || typeof value !== "object") return value;
  const clone = { ...value };
  delete clone.updatedAt;
  delete clone.createdAt;
  delete clone.savedAt;
  delete clone.lastModified;
  return clone;
}

function diffSkuRows(beforeRows: any[] = [], afterRows: any[] = []) {
  const before = new Map<string, any>();
  const after = new Map<string, any>();

  safeArray(beforeRows).forEach((row: any) => {
    const key = skuKey(row);
    if (key) before.set(key, row);
  });

  safeArray(afterRows).forEach((row: any) => {
    const key = skuKey(row);
    if (key) after.set(key, row);
  });

  const added: any[] = [];
  const deleted: any[] = [];
  const updated: Array<{ before: any; after: any; fields: string[] }> = [];

  after.forEach((row, key) => {
    const oldRow = before.get(key);
    if (!oldRow) {
      added.push(row);
      return;
    }

    if (JSON.stringify(comparableValue(oldRow)) !== JSON.stringify(comparableValue(row))) {
      const keys = Array.from(new Set([
        ...Object.keys(oldRow || {}),
        ...Object.keys(row || {}),
      ]));

      const fields = keys.filter((field) => {
        if (["updatedAt", "createdAt", "savedAt", "lastModified"].includes(field)) return false;
        return JSON.stringify(oldRow?.[field] ?? null) !== JSON.stringify(row?.[field] ?? null);
      });

      updated.push({ before: oldRow, after: row, fields });
    }
  });

  before.forEach((row, key) => {
    if (!after.has(key)) deleted.push(row);
  });

  return { added, updated, deleted };
}

async function getRequestUser(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) return { supabase: null, user: null };

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // This API route only reads the current auth session.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

const activityDedupeStore: Map<string, number> =
  (globalThis as any).__emdcActivityDedupeStore ||
  ((globalThis as any).__emdcActivityDedupeStore = new Map<string, number>());

function activityFingerprint(userId: string, row: any) {
  return [
    userId,
    String(row?.action || ""),
    String(row?.entityType || ""),
    String(row?.entityName || ""),
    String(row?.description || ""),
  ].join("|").toLowerCase();
}

async function writeActivityRows(req: NextRequest, rows: any[]) {
  try {
    if (!rows.length) return;

    const { supabase, user } = await getRequestUser(req);
    if (!supabase || !user) return;

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "EMDC User";

    const now = Date.now();
    const dedupeWindowMs = 20_000;
    const recentCutoff = new Date(now - dedupeWindowMs).toISOString();

    // Clean old in-memory fingerprints.
    activityDedupeStore.forEach((timestamp, key) => {
      if (now - timestamp > dedupeWindowMs) activityDedupeStore.delete(key);
    });

    const candidates: any[] = [];

    for (const row of rows) {
      const fingerprint = activityFingerprint(user.id, row);
      const seenAt = activityDedupeStore.get(fingerprint);

      // Stops repeated autosave requests handled by the same server instance.
      if (seenAt && now - seenAt < dedupeWindowMs) continue;

      // Also check Supabase in case another server instance handled the first request.
      const { data: existingRows } = await supabase
        .from("activity_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("action", row.action)
        .eq("entity_type", row.entityType || null)
        .eq("entity_name", row.entityName || null)
        .eq("description", row.description || null)
        .gte("created_at", recentCutoff)
        .limit(1);

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        activityDedupeStore.set(fingerprint, now);
        continue;
      }

      activityDedupeStore.set(fingerprint, now);

      candidates.push({
        user_id: user.id,
        display_name: displayName,
        email: user.email || "",
        action: row.action,
        entity_type: row.entityType || null,
        entity_name: row.entityName || null,
        description: row.description || null,
        href: row.href || null,
        metadata: {
          ...(row.metadata || {}),
          dedupeFingerprint: fingerprint,
        },
      });
    }

    if (candidates.length) {
      await supabase.from("activity_logs").insert(candidates);
    }
  } catch {
    // Notifications must never interrupt or roll back a successful EMDC save.
  }
}

async function logSkuDiff(
  req: NextRequest,
  previousRows: any[],
  nextRows: any[],
  source = "SKU Storage"
) {
  const diff = diffSkuRows(previousRows, nextRows);
  const total = diff.added.length + diff.updated.length + diff.deleted.length;
  if (!total) return;

  const href = "/#/skus";
  const rows: any[] = [];

  if (total >= 8) {
    const details = [
      diff.added.length ? `${diff.added.length} added` : "",
      diff.updated.length ? `${diff.updated.length} updated` : "",
      diff.deleted.length ? `${diff.deleted.length} deleted` : "",
    ].filter(Boolean);

    rows.push({
      action: `updated ${total} SKUs`,
      entityType: "sku",
      entityName: source,
      description: details.join(" · "),
      href,
      metadata: {
        source,
        added: diff.added.length,
        updated: diff.updated.length,
        deleted: diff.deleted.length,
        bulk: true,
      },
    });
  } else {
    diff.added.forEach((row) => rows.push({
      action: "added SKU",
      entityType: "sku",
      entityName: skuLabel(row),
      description: productLabel(row) || source,
      href,
      metadata: { source, sku: skuLabel(row), productName: productLabel(row) },
    }));

    diff.updated.forEach(({ after, fields }) => rows.push({
      action: "updated SKU",
      entityType: "sku",
      entityName: skuLabel(after),
      description: fields.length
        ? `Changed: ${fields.slice(0, 6).join(", ")}${fields.length > 6 ? "…" : ""}`
        : productLabel(after) || source,
      href,
      metadata: {
        source,
        sku: skuLabel(after),
        productName: productLabel(after),
        changedFields: fields,
      },
    }));

    diff.deleted.forEach((row) => rows.push({
      action: "deleted SKU",
      entityType: "sku",
      entityName: skuLabel(row),
      description: productLabel(row) || source,
      href,
      metadata: { source, sku: skuLabel(row), productName: productLabel(row) },
    }));
  }

  await writeActivityRows(req, rows);
}

function normalizeSkuDeleteKey(value: any) {
  return String(value ?? "").trim().toLowerCase();
}

function getSkuDeleteKeys(row: any) {
  const keys: string[] = [];
  const id = normalizeSkuDeleteKey(row?.id);
  const sku = normalizeSkuDeleteKey(row?.sku || row?.skuCode || row?.value);
  if (id) keys.push(`id:${id}`);
  if (sku) keys.push(`sku:${sku}`);
  return keys;
}

function normalizeDeletedKeys(value: any) {
  const raw = Array.isArray(value)
    ? value
    : Array.isArray(value?.keys)
      ? value.keys
      : Array.isArray(value?.items)
        ? value.items.map((item: any) => item?.key || item)
        : [];
  return Array.from(new Set(raw.map((item: any) => String(item?.key || item || "").trim().toLowerCase()).filter(Boolean))).slice(-20000);
}

async function readDeletedSkuKeys() {
  // EMERGENCY RESTORE: ignore old deleted-SKU tombstones so backup imports can fully restore all brands/SKUs.
  return [];
}

async function mergeDeletedSkuKeys(incoming: any) {
  // EMERGENCY RESTORE: do not persist or apply deleted-SKU tombstones.
  return [];
}

function filterDeletedSkuRows(rows: any[] = [], deletedKeys: string[] = []) {
  // EMERGENCY RESTORE: return rows exactly as saved/imported.
  return safeArray(rows);
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
  const deletedSkuKeys = await readDeletedSkuKeys();
  const allSkuItemsRaw = await readJsonBlob(SKU_ALL_PATH);
  const allSkuItems = filterDeletedSkuRows(Array.isArray(allSkuItemsRaw) ? allSkuItemsRaw : [], deletedSkuKeys);
  if (Array.isArray(allSkuItems) && allSkuItems.length) {
    if (Array.isArray(allSkuItemsRaw) && allSkuItemsRaw.length !== allSkuItems.length) {
      await writeJsonBlob(SKU_ALL_PATH, allSkuItems).catch(() => {});
    }
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

  const skuItems = filterDeletedSkuRows(chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []), deletedSkuKeys);
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
        del([STATE_PATH, LAST_GOOD_PATH, SKU_ALL_PATH, SKU_META_PATH, SKU_DELETED_KEYS_PATH, CHECKLIST_ITEMS_PATH, CHECKLIST_GROUPS_PATH, LOCAL_SNAPSHOT_PATH] as any).catch(() => {}),
        deleteBlobPrefix(SKU_CHUNK_PREFIX),
        deleteBlobPrefix(SKU_SESSION_CHUNK_PREFIX),
      ]);
      return NextResponse.json({ ok: true, mode: mode || body?.mode || "cleanup-cloud" });
    }

    if (mode === "sku-delete" || body?.mode === "sku-delete") {
      const incomingDeleted = normalizeDeletedKeys(body?.deletedSkuKeys || body?.deletedKeys || []);
      if (!incomingDeleted.length) {
        return NextResponse.json({ ok: false, error: "No SKU delete keys received." }, { status: 400 });
      }

      const deletedSkuKeys = await mergeDeletedSkuKeys(incomingDeleted);
      const existingRowsRaw = await readJsonBlob(SKU_ALL_PATH);
      const existingRows = Array.isArray(existingRowsRaw) ? existingRowsRaw : [];
      const nextSkus = filterDeletedSkuRows(existingRows, deletedSkuKeys);
      await writeJsonBlob(SKU_ALL_PATH, nextSkus);

      const existingRaw:any = await readJsonBlob(STATE_PATH);
      const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
        version: 1,
        updatedAt: "",
        appState: {},
        localStorage: {},
      };

      const payload = {
        ...existing,
        version: 1,
        clientId: body?.clientId || existing?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        appState: {
          ...(isRecord(existing?.appState) ? existing.appState : {}),
          skuItems: [],
          deletedSkuKeys,
          skuItemsExternalBlob: true,
          skuItemsExternalCloud: true,
          skuItemsExternalCount: nextSkus.length,
          skuItemsCloudUpdatedAt: body?.updatedAt || new Date().toISOString(),
        },
        localStorage: {},
      };

      await writeJsonBlob(STATE_PATH, payload);
      await writeJsonBlob(LAST_GOOD_PATH, payload);

      return NextResponse.json({
        ok: true,
        mode: "sku-delete",
        deletedKeys: incomingDeleted.length,
        count: nextSkus.length,
        data: payload,
      });
    }

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const saveIdRaw = String(body?.saveId || body?.updatedAt || "latest").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 140) || "latest";
      const sessionPrefix = `${SKU_SESSION_CHUNK_PREFIX}${saveIdRaw}/chunk-`;

      // For an authoritative full SKU save, the incoming chunks are the exact list.
      // Clear old delete tombstones so newly added/re-added SKUs are not removed during hydration.
      const resetDeletedSkuKeys = body?.resetDeletedSkuKeys === true;
      if (resetDeletedSkuKeys) {
        await writeJsonBlob(SKU_DELETED_KEYS_PATH, { updatedAt: new Date().toISOString(), keys: [] }).catch(() => {});
      }
      const deletedSkuKeys = resetDeletedSkuKeys ? [] : await mergeDeletedSkuKeys(body?.deletedSkuKeys || body?.deletedKeys || []);
      const rows = filterDeletedSkuRows(safeArray(body?.rows), deletedSkuKeys);

      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_SKU_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }

      // Write chunks into a unique save session. This prevents a previous save and a
      // newer delete save from mixing chunks and re-saving old deleted SKUs.
      await writeJsonBlob(`${sessionPrefix}${index}.json`, rows);

      const meta = {
        version: 1,
        clientId: body?.clientId || "",
        updatedAt: body?.updatedAt || new Date().toISOString(),
        saveId: saveIdRaw,
        chunkCount: total,
        totalItems: Number(body?.totalItems || 0),
        deletedSkuKeys,
      };
      await writeJsonBlob(SKU_META_PATH, meta);

      // Do not automatically consolidate chunks into all.json.
      // The authoritative SKU file is updated only by the sku-items endpoint.
      // This prevents older background/autosave chunk writes from overwriting
      // newly added or newly deleted SKUs.
      if (index === total - 1 && body?.consolidateToAll === true) {
        const chunks = await Promise.all(
          Array.from({ length: total }, (_, i) => readJsonBlob(`${sessionPrefix}${i}.json`))
        );
        const finalDeletedKeys = resetDeletedSkuKeys ? [] : await readDeletedSkuKeys();
        const allRows = filterDeletedSkuRows(chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []), finalDeletedKeys);

        await writeJsonBlob(SKU_ALL_PATH, allRows);

        const existingRaw:any = await readJsonBlob(STATE_PATH);
        const existing:any = existingRaw && isRecord(existingRaw) ? existingRaw : {
          version: 1,
          updatedAt: "",
          appState: {},
          localStorage: {},
        };

        const payload = {
          ...existing,
          version: 1,
          clientId: body?.clientId || existing?.clientId || "",
          updatedAt: body?.updatedAt || new Date().toISOString(),
          appState: {
            ...(isRecord(existing?.appState) ? existing.appState : {}),
            skuItems: [],
            skuItemsExternalBlob: true,
            skuItemsExternalCount: allRows.length,
          },
          localStorage: {},
        };

        await writeJsonBlob(STATE_PATH, payload);
        await writeJsonBlob(LAST_GOOD_PATH, payload);
      }

      return NextResponse.json({ ok: true, mode: "sku-chunk", index, total, count: rows.length, saveId: saveIdRaw });
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

      if (Array.isArray((patch as any).deletedSkuKeys)) {
        await mergeDeletedSkuKeys((patch as any).deletedSkuKeys);
      }

      if (Array.isArray((patch as any).skuItems)) {
        const patchSkus = safeArray((patch as any).skuItems);
        const allowEmptySkuOverwrite = body?.allowEmptySkuItemsOverwrite === true;

        // app-patch may send skuItems: [] as metadata. Never let that clear
        // the real cloud SKU file unless explicitly requested.
        if (patchSkus.length > 0 || allowEmptySkuOverwrite) {
          const nextSkus = filterDeletedSkuRows(patchSkus, await readDeletedSkuKeys());
          await writeJsonBlob(SKU_ALL_PATH, nextSkus);
          nextAppState = { ...nextAppState, skuItems: [], skuItemsExternalBlob: true, skuItemsExternalCount: nextSkus.length };
        } else {
          const existingSkus = await readJsonBlob(SKU_ALL_PATH);
          const existingCount = Array.isArray(existingSkus) ? existingSkus.length : Number(existingAppState?.skuItemsExternalCount || 0);
          nextAppState = { ...nextAppState, skuItems: [], skuItemsExternalBlob: true, skuItemsExternalCount: existingCount };
        }
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

      const resetDeletedSkuKeys = body?.resetDeletedSkuKeys === true;
      if (resetDeletedSkuKeys) {
        await writeJsonBlob(SKU_DELETED_KEYS_PATH, { updatedAt: new Date().toISOString(), keys: [] }).catch(() => {});
      }
      const deletedSkuKeys = resetDeletedSkuKeys ? [] : await mergeDeletedSkuKeys(body?.deletedSkuKeys || body?.deletedKeys || []);
      const previousSkuRows = safeArray(await readJsonBlob(SKU_ALL_PATH));
      const nextSkus = filterDeletedSkuRows(safeArray(body?.skuItems), deletedSkuKeys);
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

      await logSkuDiff(
        req,
        previousSkuRows,
        nextSkus,
        String(body?.source || "SKU Storage")
      );

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
    const incomingDeletedSkuKeys = await mergeDeletedSkuKeys((incomingAppState as any).deletedSkuKeys || body?.deletedSkuKeys || body?.deletedKeys || []);
    const incomingSkuItems = filterDeletedSkuRows(safeArray((incomingAppState as any).skuItems), incomingDeletedSkuKeys);

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
