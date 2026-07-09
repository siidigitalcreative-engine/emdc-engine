import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HUB_PREFIX = "product-hub";

function normalizeSku(value: any) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getHubPath(sku: string) {
  const safeSku = normalizeSku(sku);
  if (!safeSku) return "";
  return `${HUB_PREFIX}/${safeSku}.json`;
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

function splitLines(value: any) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanHubData(raw: any, sku: string) {
  const now = new Date().toISOString();
  const incoming = raw && typeof raw === "object" ? raw : {};

  return {
    version: 1,
    sku: normalizeSku(incoming.sku || sku),
    enabled: incoming.enabled !== false,
    slug: normalizeSku(incoming.slug || sku),
    heroImage: String(incoming.heroImage || "").trim(),
    introduction: String(incoming.introduction || incoming.intro || "").trim(),
    features: splitLines(incoming.features),
    specifications: splitLines(incoming.specifications || incoming.specs),
    careUse: String(incoming.careUse || "").trim(),
    warranty: String(incoming.warranty || "").trim(),
    galleryImages: splitLines(incoming.galleryImages || incoming.gallery),
    shopeeLink: String(incoming.shopeeLink || "").trim(),
    lazadaLink: String(incoming.lazadaLink || "").trim(),
    tiktokLink: String(incoming.tiktokLink || "").trim(),
    websiteLink: String(incoming.websiteLink || "").trim(),
    manualLink: String(incoming.manualLink || "").trim(),
    catalogLink: String(incoming.catalogLink || "").trim(),
    warrantyLink: String(incoming.warrantyLink || "").trim(),
    videoLink: String(incoming.videoLink || "").trim(),
    relatedSkus: splitLines(incoming.relatedSkus),
    badges: splitLines(incoming.badges),
    seoTitle: String(incoming.seoTitle || "").trim(),
    seoDescription: String(incoming.seoDescription || "").trim(),
    seoKeywords: splitLines(incoming.seoKeywords),
    updatedAt: now,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = normalizeSku(searchParams.get("sku") || "");
    if (!sku) return NextResponse.json({ ok: false, error: "Missing sku" }, { status: 400 });

    const path = getHubPath(sku);
    const data = await readJsonBlob(path);

    return NextResponse.json({
      ok: true,
      sku,
      exists: !!data,
      data: data || null,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load Product Hub data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sku = normalizeSku(body?.sku || body?.data?.sku || "");
    if (!sku) return NextResponse.json({ ok: false, error: "Missing sku" }, { status: 400 });

    const path = getHubPath(sku);
    const clean = cleanHubData(body?.data || body, sku);
    await writeJsonBlob(path, clean);

    return NextResponse.json({
      ok: true,
      sku,
      path,
      savedAt: clean.updatedAt,
      data: clean,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to save Product Hub data" }, { status: 500 });
  }
}
