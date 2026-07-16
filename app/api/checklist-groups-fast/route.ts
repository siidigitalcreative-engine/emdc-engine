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
  return {
    id:row?.id || "",
    brand:row?.brand || "",
    productName:row?.productName || row?.product || "",
    product:row?.product || row?.productName || "",
    sku:row?.sku || row?.skuCode || "",
    skuCode:row?.skuCode || row?.sku || "",
    collection:row?.collection || row?.category || "",
    category:row?.category || row?.collection || "",
    imageLink:row?.imageLink || row?.image || "",
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

function mergeWorkspace(existing: any, incoming: any) {
  if (!isRecord(incoming)) {
    return isRecord(existing) ? existing : {};
  }

  const previous = isRecord(existing) ? existing : {};
  const next: Record<string,any> = { ...previous };

  Object.entries(incoming).forEach(([tab,value]: any) => {
    if (isRecord(value) && isRecord(previous?.[tab])) {
      next[tab] = {
        ...previous[tab],
        ...value,
      };
    } else {
      next[tab] = value;
    }
  });

  return next;
}

function mergeChecklistGroup(existing: any, incoming: any) {
  const previous = isRecord(existing) ? existing : {};
  const nextIncoming = isRecord(incoming) ? incoming : {};

  const merged: Record<string,any> = {
    ...previous,
    ...nextIncoming,
  };

  // The checklist overview now loads compact index rows. Those rows intentionally
  // omit large workspace fields. Never let a compact save erase E-commerce,
  // Digital Creative, Marketing, Livestream, Budget, or Overview data.
  if (Object.prototype.hasOwnProperty.call(nextIncoming, "aiWorkspace")) {
    merged.aiWorkspace = mergeWorkspace(
      previous.aiWorkspace,
      nextIncoming.aiWorkspace
    );
  } else if (Object.prototype.hasOwnProperty.call(previous, "aiWorkspace")) {
    merged.aiWorkspace = previous.aiWorkspace;
  }

  // Preserve selected products when a compact row does not include them.
  if (!Object.prototype.hasOwnProperty.call(nextIncoming, "skus")) {
    merged.skus = Array.isArray(previous.skus) ? previous.skus : [];
  }

  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const incomingGroups = Array.isArray(body?.checklistGroups)
      ? body.checklistGroups
      : body?.group && isRecord(body.group)
        ? [body.group]
        : [];

    const updatedAt =
      typeof body?.updatedAt === "string" && body.updatedAt
        ? body.updatedAt
        : new Date().toISOString();

    const fullReplace = body?.fullReplace === true;

    const deletedGroupIds = new Set(
      (
        Array.isArray(body?.deletedGroupIds)
          ? body.deletedGroupIds
          : []
      )
        .map((id:any)=>String(id || "").trim())
        .filter(Boolean)
    );

    const existingRaw = await readJson(DATA_PATH, []);
    const existingGroups = Array.isArray(existingRaw)
      ? existingRaw
      : [];

    const existingById = new Map(
      existingGroups.map((group:any)=>[
        String(group?.id || ""),
        group,
      ])
    );

    const incomingById = new Map(
      incomingGroups
        .filter((group:any)=>String(group?.id || "").trim())
        .map((group:any)=>[
          String(group?.id || ""),
          group,
        ])
    );

    // Merge incoming rows with their complete stored versions.
    const mergedIncoming = incomingGroups
      .filter((group:any)=>{
        const id = String(group?.id || "");
        return id && !deletedGroupIds.has(id);
      })
      .map((incoming:any)=>{
        const id = String(incoming?.id || "");
        return mergeChecklistGroup(
          existingById.get(id),
          incoming
        );
      });

    let checklistGroups:any[];

    if (fullReplace) {
      // Use only when the client intentionally sends the complete group list.
      checklistGroups = mergedIncoming;
    } else {
      // Safe default: partial/lazy saves update only the supplied groups and
      // preserve every stored group that was not part of this request.
      const untouchedExisting = existingGroups.filter((group:any)=>{
        const id = String(group?.id || "");
        return (
          id &&
          !incomingById.has(id) &&
          !deletedGroupIds.has(id)
        );
      });

      checklistGroups = [
        ...untouchedExisting,
        ...mergedIncoming,
      ];
    }

    // Never let an empty or partial UI state wipe all checklist groups unless
    // the caller explicitly requests a full replacement.
    if (
      checklistGroups.length === 0 &&
      existingGroups.length > 0 &&
      !fullReplace &&
      deletedGroupIds.size === 0
    ) {
      return NextResponse.json(
        {
          ok:false,
          protected:true,
          error:
            "Blocked an accidental empty checklist-group save.",
          existingCount:existingGroups.length,
        },
        { status:409 }
      );
    }

    await put(DATA_PATH, JSON.stringify(checklistGroups), {
      access:"private",
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:"application/json",
    } as any);

    // Keep the compact preview progress index synchronized with any progress
    // summaries included in the saved rows.
    const currentProgressIndex = await readProgressIndex();
    const nextProgressIndex:Record<string,any> = {
      ...(isRecord(currentProgressIndex)
        ? currentProgressIndex
        : {}),
    };

    mergedIncoming.forEach((group:any)=>{
      const id = String(group?.id || "");
      if (!id) return;

      if (
        group?.progressSummary &&
        typeof group.progressSummary === "object"
      ) {
        nextProgressIndex[id] = {
          ...group.progressSummary,
          updatedAt:
            group.progressSummary.updatedAt || updatedAt,
        };
      }
    });

    deletedGroupIds.forEach((id:string)=>{
      delete nextProgressIndex[id];
    });

    await put(SUMMARY_PATH, JSON.stringify(nextProgressIndex), {
      access:"private",
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:"application/json",
    } as any);

    const sync = await bump(updatedAt);

    return NextResponse.json({
      ok:true,
      updatedAt,
      count:checklistGroups.length,
      savedCount:mergedIncoming.length,
      deletedCount:deletedGroupIds.size,
      fullReplace,
      syncVersion:sync.version,
      checklistGroupsVersion:
        sync.checklistGroupsVersion,
      preservedWorkspaceData:true,
      preservedUnsentGroups:!fullReplace,
      progressIndexUpdated:true,
    });
  } catch (error:any) {
    return NextResponse.json(
      {
        ok:false,
        error:
          error?.message ||
          "Unable to save checklist groups.",
      },
      { status:500 }
    );
  }
}

