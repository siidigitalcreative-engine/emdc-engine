import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_PATH = "emdc-state/checklist-groups/all.json";
const SUMMARY_PATH = "emdc-sync/v2/checklist-progress/index.json";
const LEGACY_ITEMS_PATH = "emdc-state/checklist-items/all.json";
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

function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
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
  };
}

async function readProgressIndex() {
  const existing = await readJson(SUMMARY_PATH, null);
  if (isRecord(existing)) return existing;

  const legacyItems = await readJson(LEGACY_ITEMS_PATH, {});
  const summaryIndex: Record<string,any> = {};

  Object.entries(isRecord(legacyItems) ? legacyItems : {}).forEach(
    ([groupId,groupItems]: any) => {
      summaryIndex[groupId] = summarizeGroupItems(groupItems);
    }
  );

  try {
    await put(SUMMARY_PATH, JSON.stringify(summaryIndex), {
      access:"private",
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:"application/json",
    } as any);
  } catch {}

  return summaryIndex;
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

function compactSku(row: any) {
  // Older checklist groups may store selected products as a plain SKU/id
  // string instead of a complete object. Preserve that value so the client can
  // still match it against SKU Storage after the group is opened.
  if (
    typeof row === "string" ||
    typeof row === "number"
  ) {
    const value = String(row || "").trim();

    return {
      id:"",
      value,
      sourceId:value,
      storageId:value,
      skuStorageId:value,
      brandId:"",
      brand:"",
      productName:"",
      product:"",
      name:"",
      sku:value,
      skuCode:value,
      collection:"",
      category:"",
      imageLink:"",
      imageUrl:"",
      imageLinks:[],
      links:[],
    };
  }

  const sourceId =
    row?.sourceId ||
    row?.storageId ||
    row?.skuStorageId ||
    row?.id ||
    "";

  const sku =
    row?.sku ||
    row?.skuCode ||
    row?.value ||
    "";

  const productName =
    row?.productName ||
    row?.product ||
    row?.name ||
    "";

  const imageLink =
    row?.imageLink ||
    row?.imageUrl ||
    row?.image ||
    (Array.isArray(row?.imageLinks) ? row.imageLinks[0] : "") ||
    (Array.isArray(row?.links) ? row.links[0] : "") ||
    "";

  return {
    id:row?.id || sourceId,
    sourceId,
    storageId:row?.storageId || sourceId,
    skuStorageId:row?.skuStorageId || sourceId,
    value:row?.value || sku || productName,
    brandId:row?.brandId || "",
    brand:row?.brand || "",
    productName,
    product:row?.product || productName,
    name:row?.name || productName,
    sku,
    skuCode:row?.skuCode || sku,
    collection:row?.collection || row?.category || "",
    category:row?.category || row?.collection || "",
    imageLink,
    imageUrl:row?.imageUrl || imageLink,
    imageLinks:Array.isArray(row?.imageLinks)
      ? row.imageLinks
      : imageLink
        ? [imageLink]
        : [],
    links:Array.isArray(row?.links)
      ? row.links
      : imageLink
        ? [imageLink]
        : [],
    localProductOverride:!!row?.localProductOverride,
  };
}

function toChecklistIndexRow(group: any, progressSummary: any) {
  return {
    id: group?.id,
    groupName: group?.groupName || group?.name || "",
    name: group?.name || group?.groupName || "",
    launchType: group?.launchType || "",
    arrivalStatus:
      group?.arrivalStatus ||
      (group?.productsArrived ? "arrived" : "waiting"),
    productsArrived: !!group?.productsArrived,
    arrivedAt: group?.arrivedAt || "",
    deadline: group?.deadline || "",
    deadlineEnd: group?.deadlineEnd || "",
    dateMode: group?.dateMode || "",
    monthOnlyMonths: Array.isArray(group?.monthOnlyMonths)
      ? group.monthOnlyMonths
      : [],
    calendarType: group?.calendarType || "",
    calendarColor: group?.calendarColor || "",
    linkedEventIds: Array.isArray(group?.linkedEventIds)
      ? group.linkedEventIds
      : [],
    createdAt: group?.createdAt || "",
    skus:Array.isArray(group?.skus) ? group.skus.map(compactSku) : [],
    progressSummary:
      progressSummary && typeof progressSummary==="object"
        ? progressSummary
        : { done:0,total:0,departmentCount:0,departments:{} },
  };
}

export async function GET(req: NextRequest) {
  const checklistGroupsRaw = await readJson(DATA_PATH, []);
  const checklistGroups = Array.isArray(checklistGroupsRaw)
    ? checklistGroupsRaw
    : [];

  const groupId = String(
    req.nextUrl.searchParams.get("groupId") || ""
  ).trim();
  const mode = String(
    req.nextUrl.searchParams.get("mode") || ""
  ).trim();

  if (groupId) {
    const group = checklistGroups.find(
      (row: any) => String(row?.id) === groupId
    );

    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Checklist group not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, group },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (mode === "index") {
    const progressIndex = await readProgressIndex();

    return NextResponse.json(
      {
        ok: true,
        checklistGroups: checklistGroups.map((group:any)=>
          toChecklistIndexRow(
            group,
            progressIndex?.[String(group?.id || "")]
          )
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, checklistGroups },
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
