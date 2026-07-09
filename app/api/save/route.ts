import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const updatedAt = new Date().toISOString();

    // Keep the old /api/save input shape, but save through the newer Blob-backed state API.
    // This prevents Redis from becoming the stale source of truth after refresh.
    const appState: Record<string, unknown> = {};

    if (body.calendarEvents !== undefined) appState.calendarEvents = body.calendarEvents;
    if (body.calendarTypes !== undefined) appState.calendarTypes = body.calendarTypes;
    if (body.seasonalEvents !== undefined) appState.seasonalEvents = body.seasonalEvents;
    if (body.checklistGroups !== undefined) appState.checklistGroups = body.checklistGroups;
    if (body.checklistItems !== undefined) appState.checklistItems = body.checklistItems;
    if (body.checklistStatuses !== undefined) appState.checklistStatuses = body.checklistStatuses;
    if (body.skuBrands !== undefined) appState.skuBrands = body.skuBrands;
    if (body.skuItems !== undefined) appState.skuItems = Array.isArray(body.skuItems) ? body.skuItems : [];

    const res = await fetch(`${baseUrl}/api/emdc-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        version: 1,
        clientId: body.clientId || "api-save-proxy",
        updatedAt,
        appState,
        localStorage: {},
        deletedGroupIds: Array.isArray(body.deletedGroupIds) ? body.deletedGroupIds : [],
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return NextResponse.json(
        { error: data?.error || "Failed to save EMDC state" },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      saved: Object.keys(appState).length,
      source: "vercel-blob",
      updatedAt,
      data: data?.data || null,
    });
  } catch (err) {
    console.error("[EMDC] /api/save proxy error:", err);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
