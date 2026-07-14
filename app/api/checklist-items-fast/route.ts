import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEGACY_ALL_ITEMS_PATH = "emdc-state/checklist-items/all.json";
const SUMMARY_PATH = "emdc-sync/v2/checklist-progress/index.json";
const VERSION_PATH = "emdc-sync/v2/version.json";

const EMPTY_VERSION = {
  version: 0,
  updatedAt: "",
  checklistGroupsVersion: 0,
  checklistGroupsUpdatedAt: "",
  checklistItemsVersion: 0,
  checklistItemsUpdatedAt: "",
  checklistItemGroupVersions: {} as Record<string,number>,
};

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function groupPath(groupId: string) {
  return `emdc-sync/v2/checklist-items/${encodeURIComponent(groupId)}.json`;
}

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

function summarizeGroupItems(groupItems: any) {
  const departments: Record<string,{ done:number; total:number }> = {};
  let done = 0;
  let total = 0;

  Object.entries(isRecord(groupItems) ? groupItems : {}).forEach(
    ([department,rows]: any) => {
      const items = Array.isArray(rows) ? rows : [];
      const departmentDone = items.filter((item:any)=>!!item?.done).length;
      departments[department] = { done:departmentDone, total:items.length };
      done += departmentDone;
      total += items.length;
    }
  );

  return {
    done,
    total,
    departmentCount:Object.keys(departments).length,
    departments,
    updatedAt:new Date().toISOString(),
  };
}

async function readGroupItems(groupId: string) {
  const direct = await readJson(groupPath(groupId), null);
  if (isRecord(direct)) return direct;

  const legacyAll = await readJson(LEGACY_ALL_ITEMS_PATH, {});
  return isRecord(legacyAll?.[groupId]) ? legacyAll[groupId] : {};
}

export async function GET(req: NextRequest) {
  const groupId = String(req.nextUrl.searchParams.get("groupId") || "").trim();

  if (!groupId) {
    return NextResponse.json(
      { ok: false, error: "groupId is required." },
      { status: 400 }
    );
  }

  const groupItems = await readGroupItems(groupId);

  return NextResponse.json(
    { ok: true, groupId, groupItems },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const groupId = String(body?.groupId || "").trim();
    const groupItems = isRecord(body?.groupItems) ? body.groupItems : null;

    if (!groupId || !groupItems) {
      return NextResponse.json(
        { ok: false, error: "groupId and groupItems are required." },
        { status: 400 }
      );
    }

    const updatedAt =
      typeof body?.updatedAt === "string" && body.updatedAt
        ? body.updatedAt
        : new Date().toISOString();

    await put(groupPath(groupId), JSON.stringify(groupItems), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    } as any);

    const existingSummaryIndex = await readJson(SUMMARY_PATH, {});
    const nextSummaryIndex = {
      ...(isRecord(existingSummaryIndex) ? existingSummaryIndex : {}),
      [groupId]:summarizeGroupItems(groupItems),
    };

    await put(SUMMARY_PATH, JSON.stringify(nextSummaryIndex), {
      access:"private",
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:"application/json",
    } as any);

    const current = {
      ...EMPTY_VERSION,
      ...(await readJson(VERSION_PATH, EMPTY_VERSION)),
    };

    const previousGroupVersions =
      isRecord(current.checklistItemGroupVersions)
        ? current.checklistItemGroupVersions
        : {};

    const nextGroupVersion = Number(previousGroupVersions[groupId] || 0) + 1;

    const nextVersion = {
      ...current,
      version: Number(current.version || 0) + 1,
      updatedAt,
      checklistItemsVersion: Number(current.checklistItemsVersion || 0) + 1,
      checklistItemsUpdatedAt: updatedAt,
      checklistItemGroupVersions: {
        ...previousGroupVersions,
        [groupId]: nextGroupVersion,
      },
    };

    await put(VERSION_PATH, JSON.stringify(nextVersion), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    } as any);

    return NextResponse.json({
      ok: true,
      groupId,
      updatedAt,
      syncVersion: nextVersion.version,
      checklistItemsVersion: nextVersion.checklistItemsVersion,
      groupVersion: nextGroupVersion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save checklist group items." },
      { status: 500 }
    );
  }
}
