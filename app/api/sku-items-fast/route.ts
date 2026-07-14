import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SKU_PATH = "emdc-state/sku-items/all.json";

async function readSkuItems() {
  try {
    const result: any = await get(SKU_PATH, { access: "private" } as any);
    if (!result?.stream) return [];
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const skuItems = await readSkuItems();

  return NextResponse.json(
    { ok: true, skuItems },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
