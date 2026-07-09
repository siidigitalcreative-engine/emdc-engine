import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCT_HUB_PREFIX = "product-hub";

function cleanSku(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 160);
}

function pathForSku(sku: string) {
  const safe = encodeURIComponent(sku);
  return `${PRODUCT_HUB_PREFIX}/${safe}.json`;
}

async function streamToText(stream: any) {
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

async function readJsonBlob(pathname: string) {
  try {
    const result: any = await get(pathname, { access: "private" } as any);
    const text = await streamToText(result?.stream);
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, value: any) {
  return put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  } as any);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = cleanSku(searchParams.get("sku"));

    if (!sku) {
      return NextResponse.json({ ok: false, error: "Missing sku" }, { status: 400 });
    }

    const data = await readJsonBlob(pathForSku(sku));
    return NextResponse.json({ ok: true, sku, data: data || null });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to read Product Hub data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sku = cleanSku(body?.sku);

    if (!sku) {
      return NextResponse.json({ ok: false, error: "Missing sku" }, { status: 400 });
    }

    const incoming = body?.data && typeof body.data === "object" ? body.data : {};
    const now = new Date().toISOString();

    const data = {
      ...incoming,
      sku,
      updatedAt: now,
      version: 1,
    };

    await writeJsonBlob(pathForSku(sku), data);
    return NextResponse.json({ ok: true, sku, savedAt: now, data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save Product Hub data" },
      { status: 500 }
    );
  }
}
