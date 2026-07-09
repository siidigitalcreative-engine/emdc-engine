import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";
const SKU_ALL_PATH = "emdc-state/sku-items/all.json";
const CHECKLIST_ITEMS_PATH = "emdc-state/checklist-items/all.json";
const CHECKLIST_GROUPS_PATH = "emdc-state/checklist-groups/all.json";

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

export async function GET() {
  try {
    const state: any = await readJsonBlob(STATE_PATH);
    const appState: any = isRecord(state?.appState) ? state.appState : {};

    const [skuItemsBlob, checklistGroupsBlob, checklistItemsBlob] = await Promise.all([
      readJsonBlob(SKU_ALL_PATH),
      readJsonBlob(CHECKLIST_GROUPS_PATH),
      readJsonBlob(CHECKLIST_ITEMS_PATH),
    ]);

    const skuItems = Array.isArray(skuItemsBlob)
      ? skuItemsBlob
      : Array.isArray(appState.skuItems)
        ? appState.skuItems
        : [];

    const checklistGroups = Array.isArray(checklistGroupsBlob)
      ? checklistGroupsBlob
      : Array.isArray(appState.checklistGroups)
        ? appState.checklistGroups
        : null;

    const checklistItems = isRecord(checklistItemsBlob)
      ? checklistItemsBlob
      : isRecord(appState.checklistItems)
        ? appState.checklistItems
        : {};

    return NextResponse.json({
      calendarEvents: Array.isArray(appState.calendarEvents) ? appState.calendarEvents : null,
      calendarTypes: Array.isArray(appState.calendarTypes) ? appState.calendarTypes : null,
      seasonalEvents: Array.isArray(appState.seasonalEvents) ? appState.seasonalEvents : null,
      checklistGroups,
      checklistItems,
      checklistStatuses: Array.isArray(appState.checklistStatuses) ? appState.checklistStatuses : null,
      skuBrands: Array.isArray(appState.skuBrands) ? appState.skuBrands : null,
      skuItems,
      skuTableColumns: Array.isArray(appState.skuTableColumns) ? appState.skuTableColumns : null,
      source: "vercel-blob",
      updatedAt: state?.updatedAt || "",
    });
  } catch (err) {
    console.error("[EMDC] /api/load blob error:", err);
    return NextResponse.json({ error: "Failed to load data from Vercel Blob" }, { status: 500 });
  }
}
