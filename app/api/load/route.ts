import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { KEYS } from "@/lib/store-keys";

export async function GET() {
  try {
    const [
      calendarEvents,
      calendarTypes,
      seasonalEvents,
      checklistGroups,
      checklistStatuses,
      skuBrands,
      skuItems,
    ] = await Promise.all([
      redis.get(KEYS.calendarEvents),
      redis.get(KEYS.calendarTypes),
      redis.get(KEYS.seasonalEvents),
      redis.get(KEYS.checklistGroups),
      redis.get(KEYS.checklistStatuses),
      redis.get(KEYS.skuBrands),
      redis.get(KEYS.skuItems),
    ]);

    let checklistItems: Record<string, unknown> = {};
    if (checklistGroups) {
      const groups = typeof checklistGroups === "string"
        ? JSON.parse(checklistGroups)
        : checklistGroups;
      if (Array.isArray(groups) && groups.length > 0) {
        const itemEntries = await Promise.all(
          groups.map(async (g: { id: string }) => {
            const items = await redis.get(KEYS.checklistItems(g.id));
            return [g.id, items ? (typeof items === "string" ? JSON.parse(items) : items) : null] as const;
          })
        );
        checklistItems = Object.fromEntries(itemEntries.filter(([, v]) => v !== null));
      }
    }

    const parse = (v: unknown) => {
      if (v === null || v === undefined) return null;
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
      return v;
    };

    return NextResponse.json({
      calendarEvents:    parse(calendarEvents),
      calendarTypes:     parse(calendarTypes),
      seasonalEvents:    parse(seasonalEvents),
      checklistGroups:   parse(checklistGroups),
      checklistItems,
      checklistStatuses: parse(checklistStatuses),
      skuBrands:         parse(skuBrands),
      skuItems:          parse(skuItems),
    });
  } catch (err) {
    console.error("[EMDC] /api/load error:", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
