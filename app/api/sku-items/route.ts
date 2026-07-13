import { NextRequest, NextResponse } from "next/server";
import { del, get, list, put } from "@vercel/blob";
import { createServerClient } from "@supabase/ssr";

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

function normalizeSkuKey(item: any) {
  return String(
    item?.sku ||
    item?.skuCode ||
    item?.productCode ||
    item?.code ||
    item?.id ||
    ""
  ).trim().toLowerCase();
}

function displaySku(item: any) {
  return String(
    item?.sku ||
    item?.skuCode ||
    item?.productCode ||
    item?.code ||
    item?.id ||
    "Unknown SKU"
  ).trim();
}

function displayProductName(item: any) {
  return String(
    item?.productName ||
    item?.product ||
    item?.name ||
    item?.title ||
    ""
  ).trim();
}

function comparableSku(item: any) {
  if (!item || typeof item !== "object") return {};
  const copy = { ...item };
  delete copy.updatedAt;
  delete copy.createdAt;
  delete copy.lastModified;
  delete copy.savedAt;
  return copy;
}

function changedFields(before: any, after: any) {
  const ignored = new Set([
    "updatedAt",
    "createdAt",
    "lastModified",
    "savedAt",
  ]);

  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  return Array.from(keys)
    .filter((key) => !ignored.has(key))
    .filter((key) => {
      try {
        return JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after?.[key] ?? null);
      } catch {
        return String(before?.[key] ?? "") !== String(after?.[key] ?? "");
      }
    });
}

function diffSkuRows(previousRows: any[], nextRows: any[]) {
  const previousMap = new Map<string, any>();
  const nextMap = new Map<string, any>();

  previousRows.forEach((row) => {
    const key = normalizeSkuKey(row);
    if (key) previousMap.set(key, row);
  });

  nextRows.forEach((row) => {
    const key = normalizeSkuKey(row);
    if (key) nextMap.set(key, row);
  });

  const added: any[] = [];
  const deleted: any[] = [];
  const updated: Array<{ before: any; after: any; fields: string[] }> = [];

  nextMap.forEach((row, key) => {
    const before = previousMap.get(key);
    if (!before) {
      added.push(row);
      return;
    }

    const beforeComparable = comparableSku(before);
    const afterComparable = comparableSku(row);

    if (JSON.stringify(beforeComparable) !== JSON.stringify(afterComparable)) {
      updated.push({
        before,
        after: row,
        fields: changedFields(before, row),
      });
    }
  });

  previousMap.forEach((row, key) => {
    if (!nextMap.has(key)) deleted.push(row);
  });

  return { added, deleted, updated };
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
      const urls = safeArray(result?.blobs)
        .map((blob: any) => blob?.url || blob?.pathname)
        .filter(Boolean);

      if (urls.length) await del(urls as any);
      cursor = result?.cursor;
    } while (cursor);
  } catch {}
}

async function logSkuActivity(
  req: NextRequest,
  diff: ReturnType<typeof diffSkuRows>,
  totalRows: number,
  source = "SKU Storage"
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !publishableKey) return;

    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // This route only reads the existing session.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "EMDC User";

    const rowsToInsert: any[] = [];
    const href = "/#/skus";
    const addedCount = diff.added.length;
    const updatedCount = diff.updated.length;
    const deletedCount = diff.deleted.length;
    const totalChanges = addedCount + updatedCount + deletedCount;

    if (!totalChanges) return;

    const bulkThreshold = 8;

    if (totalChanges >= bulkThreshold) {
      const summaryParts = [
        addedCount ? `${addedCount} added` : "",
        updatedCount ? `${updatedCount} updated` : "",
        deletedCount ? `${deletedCount} deleted` : "",
      ].filter(Boolean);

      rowsToInsert.push({
        user_id: user.id,
        display_name: displayName,
        email: user.email || "",
        action: `updated ${totalChanges} SKUs`,
        entity_type: "sku",
        entity_name: source,
        description: summaryParts.join(" · "),
        href,
        metadata: {
          source,
          totalRows,
          addedCount,
          updatedCount,
          deletedCount,
          bulk: true,
        },
      });
    } else {
      diff.added.forEach((row) => {
        rowsToInsert.push({
          user_id: user.id,
          display_name: displayName,
          email: user.email || "",
          action: "added SKU",
          entity_type: "sku",
          entity_name: displaySku(row),
          description: displayProductName(row) || source,
          href,
          metadata: {
            source,
            sku: displaySku(row),
            productName: displayProductName(row),
          },
        });
      });

      diff.updated.forEach(({ after, fields }) => {
        rowsToInsert.push({
          user_id: user.id,
          display_name: displayName,
          email: user.email || "",
          action: "updated SKU",
          entity_type: "sku",
          entity_name: displaySku(after),
          description: fields.length
            ? `Changed: ${fields.slice(0, 6).join(", ")}${fields.length > 6 ? "…" : ""}`
            : displayProductName(after) || source,
          href,
          metadata: {
            source,
            sku: displaySku(after),
            productName: displayProductName(after),
            changedFields: fields,
          },
        });
      });

      diff.deleted.forEach((row) => {
        rowsToInsert.push({
          user_id: user.id,
          display_name: displayName,
          email: user.email || "",
          action: "deleted SKU",
          entity_type: "sku",
          entity_name: displaySku(row),
          description: displayProductName(row) || source,
          href,
          metadata: {
            source,
            sku: displaySku(row),
            productName: displayProductName(row),
          },
        });
      });
    }

    if (rowsToInsert.length) {
      await supabase.from("activity_logs").insert(rowsToInsert);
    }
  } catch {
    // Activity logging must never block SKU saving.
  }
}

export async function GET() {
  try {
    const rows = safeArray(await readJsonBlob(SKU_ALL_PATH));
    return NextResponse.json({ ok: true, count: rows.length, skuItems: rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to load SKU items." },
      { status: 500 }
    );
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

      if (
        !Number.isInteger(index) ||
        !Number.isInteger(total) ||
        index < 0 ||
        total <= 0 ||
        index >= total
      ) {
        return NextResponse.json(
          { ok: false, error: "Invalid SKU chunk index." },
          { status: 400 }
        );
      }

      const rows = safeArray(body?.rows);
      await writeJsonBlob(`${uploadPrefix}chunk-${index}.json`, rows);

      return NextResponse.json({
        ok: true,
        action,
        saveId,
        index,
        total,
        count: rows.length,
      });
    }

    if (action === "commit") {
      const total = Number(body?.total || 0);
      const expectedTotalItems = Number(body?.totalItems || 0);

      if (!Number.isInteger(total) || total < 0 || total > 5000) {
        return NextResponse.json(
          { ok: false, error: "Invalid SKU commit total." },
          { status: 400 }
        );
      }

      const chunks = await Promise.all(
        Array.from({ length: total }, (_, index) =>
          readJsonBlob(`${uploadPrefix}chunk-${index}.json`)
        )
      );

      const missing = chunks.findIndex((chunk: any) => !Array.isArray(chunk));

      if (missing >= 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Missing SKU chunk ${missing + 1} of ${total}.`,
          },
          { status: 400 }
        );
      }

      const rows = chunks.flatMap((chunk: any) =>
        Array.isArray(chunk) ? chunk : []
      );

      if (expectedTotalItems && rows.length !== expectedTotalItems) {
        return NextResponse.json(
          {
            ok: false,
            error: `SKU count mismatch. Expected ${expectedTotalItems}, got ${rows.length}.`,
          },
          { status: 400 }
        );
      }

      const previousRows = safeArray(await readJsonBlob(SKU_ALL_PATH));
      const diff = diffSkuRows(previousRows, rows);

      await writeJsonBlob(SKU_DELETED_KEYS_PATH, {
        updatedAt,
        keys: [],
      }).catch(() => {});

      await writeJsonBlob(SKU_ALL_PATH, rows);

      const existingRaw: any = await readJsonBlob(STATE_PATH);
      const existing: any =
        existingRaw && isRecord(existingRaw)
          ? existingRaw
          : {
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

      await logSkuActivity(
        req,
        diff,
        rows.length,
        String(body?.source || "SKU Storage")
      );

      return NextResponse.json({
        ok: true,
        action,
        saveId,
        count: rows.length,
        changes: {
          added: diff.added.length,
          updated: diff.updated.length,
          deleted: diff.deleted.length,
        },
        data: payload,
      });
    }

    if (action === "replace") {
      const rows = safeArray(body?.skuItems || body?.rows);
      const previousRows = safeArray(await readJsonBlob(SKU_ALL_PATH));
      const diff = diffSkuRows(previousRows, rows);

      await writeJsonBlob(SKU_DELETED_KEYS_PATH, {
        updatedAt,
        keys: [],
      }).catch(() => {});

      await writeJsonBlob(SKU_ALL_PATH, rows);

      await logSkuActivity(
        req,
        diff,
        rows.length,
        String(body?.source || "SKU Storage")
      );

      return NextResponse.json({
        ok: true,
        action,
        count: rows.length,
        changes: {
          added: diff.added.length,
          updated: diff.updated.length,
          deleted: diff.deleted.length,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "Unknown SKU action." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to save SKU items.",
      },
      { status: 500 }
    );
  }
}
