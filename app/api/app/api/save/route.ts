import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { KEYS } from "@/lib/store-keys";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const writes: Promise<unknown>[] = [];

    if (body.calendarEvents !== undefined)
      writes.push(redis.set(KEYS.calendarEvents, JSON.stringify(body.calendarEvents)));
    if (body.calendarTypes !== undefined)
      writes.push(redis.set(KEYS.calendarTypes, JSON.stringify(body.calendarTypes)));
    if (body.seasonalEvents !== undefined)
      writes.push(redis.set(KEYS.seasonalEvents, JSON.stringify(body.seasonalEvents)));
    if (body.checklistGroups !== undefined)
      writes.push(redis.set(KEYS.checklistGroups, JSON.stringify(body.checklistGroups)));
    if (body.checklistStatuses !== undefined)
      writes.push(redis.set(KEYS.checklistStatuses, JSON.stringify(body.checklistStatuses)));
    if (body.skuBrands !== undefined)
      writes.push(redis.set(KEYS.skuBrands, JSON.stringify(body.skuBrands)));
    if (body.skuItems !== undefined)
      writes.push(redis.set(KEYS.skuItems, JSON.stringify(body.skuItems)));

    if (body.checklistItems && typeof body.checklistItems === "object") {
      for (const [groupId, items] of Object.entries(body.checklistItems)) {
        writes.push(redis.set(KEYS.checklistItems(groupId), JSON.stringify(items)));
      }
    }

    if (Array.isArray(body.deletedGroupIds)) {
      for (const id of body.deletedGroupIds) {
        writes.push(redis.del(KEYS.checklistItems(id)));
      }
    }

    await Promise.all(writes);
    return NextResponse.json({ ok: true, saved: writes.length });
  } catch (err) {
    console.error("[EMDC] /api/save error:", err);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
