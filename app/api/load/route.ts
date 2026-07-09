import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const res = await fetch(`${baseUrl}/api/emdc-state`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return NextResponse.json(
        { error: data?.error || "Failed to load EMDC state" },
        { status: res.status || 500 }
      );
    }

    const appState = data?.data?.appState || {};

    // Keep the old /api/load response shape so CalendarView does not need changes.
    return NextResponse.json({
      calendarEvents: appState.calendarEvents ?? null,
      calendarTypes: appState.calendarTypes ?? null,
      seasonalEvents: appState.seasonalEvents ?? null,
      checklistGroups: appState.checklistGroups ?? null,
      checklistItems: appState.checklistItems ?? {},
      checklistStatuses: appState.checklistStatuses ?? null,
      skuBrands: appState.skuBrands ?? null,
      skuItems: appState.skuItems ?? null,
    });
  } catch (err) {
    console.error("[EMDC] /api/load proxy error:", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
