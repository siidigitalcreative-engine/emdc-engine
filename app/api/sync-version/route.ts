import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATH = "emdc-sync/v2/version.json";
const EMPTY = {
  version: 0,
  updatedAt: "",
  checklistGroupsVersion: 0,
  checklistGroupsUpdatedAt: "",
  checklistItemsVersion: 0,
  checklistItemsUpdatedAt: "",
};

async function readVersion() {
  try {
    const result: any = await get(PATH, { access: "private" } as any);
    if (!result?.stream) return EMPTY;
    const text = await new Response(result.stream).text();
    return { ...EMPTY, ...(JSON.parse(text || "{}") || {}) };
  } catch {
    return EMPTY;
  }
}

export async function GET(req: NextRequest) {
  const data = await readVersion();
  const etag = `"emdc-sync-${data.version}"`;

  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "private, no-cache, must-revalidate" },
    });
  }

  return NextResponse.json(
    { ok: true, data },
    { headers: { ETag: etag, "Cache-Control": "private, no-cache, must-revalidate" } }
  );
}
