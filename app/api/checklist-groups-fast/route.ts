import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_GROUPS_PATH = "emdc-state/checklist-groups/all.json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checklistGroups = Array.isArray(body?.checklistGroups)
      ? body.checklistGroups
      : [];

    const updatedAt =
      typeof body?.updatedAt === "string" && body.updatedAt
        ? body.updatedAt
        : new Date().toISOString();

    // Fast path: save only the authoritative checklist-group blob.
    // Arrival status, group name, deadline, selected products, and workspace
    // metadata do not need to wait for the full EMDC app-state backup cycle.
    await put(
      CHECKLIST_GROUPS_PATH,
      JSON.stringify(checklistGroups),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      } as any
    );

    return NextResponse.json({
      ok: true,
      mode: "checklist-groups-fast",
      updatedAt,
      count: checklistGroups.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to save checklist groups.",
      },
      { status: 500 }
    );
  }
}
