import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_PATH = "emdc-state/checklist-groups/all.json";
const VERSION_PATH = "emdc-sync/v2/version.json";
const EMPTY_VERSION = {
  version: 0, updatedAt: "",
  checklistGroupsVersion: 0, checklistGroupsUpdatedAt: "",
  checklistItemsVersion: 0, checklistItemsUpdatedAt: "",
};

async function readJson(path: string, fallback: any) {
  try {
    const result: any = await get(path, { access: "private" } as any);
    if (!result?.stream) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

async function bump(updatedAt: string) {
  const current = { ...EMPTY_VERSION, ...(await readJson(VERSION_PATH, EMPTY_VERSION)) };
  const next = {
    ...current,
    version: Number(current.version || 0) + 1,
    updatedAt,
    checklistGroupsVersion: Number(current.checklistGroupsVersion || 0) + 1,
    checklistGroupsUpdatedAt: updatedAt,
  };
  await put(VERSION_PATH, JSON.stringify(next), {
    access: "private", addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/json",
  } as any);
  return next;
}

export async function GET() {
  const checklistGroups = await readJson(DATA_PATH, []);
  return NextResponse.json(
    { ok: true, checklistGroups: Array.isArray(checklistGroups) ? checklistGroups : [] },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checklistGroups = Array.isArray(body?.checklistGroups) ? body.checklistGroups : [];
    const updatedAt = typeof body?.updatedAt === "string" && body.updatedAt
      ? body.updatedAt : new Date().toISOString();

    await put(DATA_PATH, JSON.stringify(checklistGroups), {
      access: "private", addRandomSuffix: false, allowOverwrite: true,
      contentType: "application/json",
    } as any);

    const sync = await bump(updatedAt);
    return NextResponse.json({
      ok: true, updatedAt, count: checklistGroups.length,
      syncVersion: sync.version,
      checklistGroupsVersion: sync.checklistGroupsVersion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save checklist groups." },
      { status: 500 }
    );
  }
}
