import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_PATH = "emdc-state/current.json";

async function readCurrentState() {
  try {
    const result: any = await get(STATE_PATH, { access: "private" } as any);
    if (!result?.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text || "null");
  } catch {
    return null;
  }
}

export async function GET() {
  const cloud = await readCurrentState();
  const source = cloud?.appState && typeof cloud.appState === "object"
    ? cloud.appState
    : {};

  // Normal startup needs only small shared configuration and calendar data.
  // Large collections load through their own feature routes.
  const appState = {
    skuBrands: Array.isArray(source.skuBrands) ? source.skuBrands : [],
    skuTableColumns: Array.isArray(source.skuTableColumns) ? source.skuTableColumns : [],
    checklistTrash: Array.isArray(source.checklistTrash) ? source.checklistTrash : [],
    checklistStatuses: Array.isArray(source.checklistStatuses) ? source.checklistStatuses : [],
    calendarEvents: Array.isArray(source.calendarEvents) ? source.calendarEvents : [],
    calendarTypes: Array.isArray(source.calendarTypes) ? source.calendarTypes : [],
    seasonalEvents: Array.isArray(source.seasonalEvents) ? source.seasonalEvents : [],
  };

  return NextResponse.json(
    {
      ok: true,
      data: {
        version: cloud?.version || 1,
        updatedAt: cloud?.updatedAt || "",
        appState,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
