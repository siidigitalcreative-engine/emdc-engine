import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_ITEMS_PATH = "emdc-state/checklist-items/all.json";

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checklistItems = isRecord(body?.checklistItems)
      ? body.checklistItems
      : {};

    const updatedAt =
      typeof body?.updatedAt === "string" && body.updatedAt
        ? body.updatedAt
        : new Date().toISOString();

    // Fast path: write only the authoritative checklist-items blob.
    // The normal app-state backup can catch up through the existing background
    // save flow, but status changes no longer wait for three sequential writes.
    await put(
      CHECKLIST_ITEMS_PATH,
      JSON.stringify(checklistItems),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      } as any
    );

    return NextResponse.json({
      ok: true,
      mode: "checklist-items-fast",
      updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to save checklist items.",
      },
      { status: 500 }
    );
  }
}
