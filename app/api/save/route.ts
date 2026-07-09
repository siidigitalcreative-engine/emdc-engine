import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const LAST_GOOD_PATH = "emdc-state/last-good.json";
const SKU_ALL_PATH = "emdc-state/sku-items/all.json";
const CHECKLIST_ITEMS_PATH = "emdc-state/checklist-items/all.json";
const CHECKLIST_GROUPS_PATH = "emdc-state/checklist-groups/all.json";
const LOCAL_SNAPSHOT_PATH = "emdc-state/local-snapshot/all.json";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const existingRaw: any = await readJsonBlob(STATE_PATH);
    const existing: any = isRecord(existingRaw)
      ? existingRaw
      : { version: 1, updatedAt: "", appState: {}, localStorage: {} };

    const existingAppState: any = isRecord(existing.appState) ? existing.appState : {};
    let nextAppState: any = { ...existingAppState };
    let saved = 0;
    const updatedAt = body?.updatedAt || new Date().toISOString();

    if (body.calendarEvents !== undefined) {
      nextAppState.calendarEvents = Array.isArray(body.calendarEvents) ? body.calendarEvents : [];
      saved++;
    }

    if (body.calendarTypes !== undefined) {
      nextAppState.calendarTypes = Array.isArray(body.calendarTypes) ? body.calendarTypes : [];
      saved++;
    }

    if (body.seasonalEvents !== undefined) {
      nextAppState.seasonalEvents = Array.isArray(body.seasonalEvents) ? body.seasonalEvents : [];
      saved++;
    }

    if (body.checklistGroups !== undefined) {
      const groups = Array.isArray(body.checklistGroups) ? body.checklistGroups : [];
      nextAppState.checklistGroups = groups;
      nextAppState.checklistGroupsExternalBlob = true;
      await writeJsonBlob(CHECKLIST_GROUPS_PATH, groups);
      saved++;
    }

    if (body.checklistItems && typeof body.checklistItems === "object") {
      const checklistItems = isRecord(body.checklistItems) ? body.checklistItems : {};
      nextAppState.checklistItems = checklistItems;
      nextAppState.checklistItemsExternalBlob = true;
      await writeJsonBlob(CHECKLIST_ITEMS_PATH, checklistItems);
      saved++;
    }

    if (body.checklistStatuses !== undefined) {
      nextAppState.checklistStatuses = Array.isArray(body.checklistStatuses) ? body.checklistStatuses : [];
      saved++;
    }

    if (body.skuBrands !== undefined) {
      nextAppState.skuBrands = Array.isArray(body.skuBrands) ? body.skuBrands : [];
      saved++;
    }

    if (body.skuTableColumns !== undefined) {
      nextAppState.skuTableColumns = Array.isArray(body.skuTableColumns) ? body.skuTableColumns : [];
      saved++;
    }

    if (body.localStorage && typeof body.localStorage === "object") {
      await writeJsonBlob(LOCAL_SNAPSHOT_PATH, body.localStorage);
      saved++;
    }

    if (body.skuItems !== undefined) {
      const incomingSkuItems = Array.isArray(body.skuItems) ? body.skuItems : [];
      const allowEmptySkuOverwrite = body.allowEmptySkuItemsOverwrite === true || body.skuItemsExplicitEmpty === true;

      // Important: many older autosave calls send skuItems: [] only because large SKU
      // catalogs are stored externally. Do not let that blank old autosave erase all SKUs.
      if (incomingSkuItems.length > 0 || allowEmptySkuOverwrite) {
        await writeJsonBlob(SKU_ALL_PATH, incomingSkuItems);
        nextAppState.skuItems = [];
        nextAppState.skuItemsExternalBlob = true;
        nextAppState.skuItemsExternalCloud = true;
        nextAppState.skuItemsExternalCount = incomingSkuItems.length;
        nextAppState.skuItemsCloudUpdatedAt = updatedAt;
        saved++;
      } else {
        const currentSkuItems = await readJsonBlob(SKU_ALL_PATH);
        const currentCount = Array.isArray(currentSkuItems)
          ? currentSkuItems.length
          : Number(existingAppState.skuItemsExternalCount || 0);
        nextAppState.skuItems = [];
        nextAppState.skuItemsExternalBlob = true;
        nextAppState.skuItemsExternalCloud = true;
        nextAppState.skuItemsExternalCount = currentCount;
      }
    }

    const payload = {
      ...existing,
      version: 1,
      updatedAt,
      appState: nextAppState,
      localStorage: {},
    };

    await writeJsonBlob(STATE_PATH, payload);
    await writeJsonBlob(LAST_GOOD_PATH, payload);

    return NextResponse.json({ ok: true, saved, source: "vercel-blob", data: payload });
  } catch (err) {
    console.error("[EMDC] /api/save blob error:", err);
    return NextResponse.json({ error: "Failed to save data to Vercel Blob" }, { status: 500 });
  }
}
