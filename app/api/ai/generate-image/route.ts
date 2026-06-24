import { NextRequest, NextResponse } from "next/server";

type ReferenceImage = {
  name?: string;
  type?: string;
  dataUrl?: string;
};

const clean = (value: unknown) => String(value || "").trim();

const normalizeUrl = (value: unknown) => {
  const raw = clean(value);
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

const normalizeUrlList = (...lists: unknown[]) => Array.from(new Set(
  lists
    .flatMap((list: any) => Array.isArray(list) ? list : [])
    .map(normalizeUrl)
    .filter(Boolean)
)).slice(0, 30);

const normalizeReferenceImages = (images: unknown): ReferenceImage[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img: any) => ({
      name: clean(img?.name),
      type: clean(img?.type) || "image/png",
      dataUrl: clean(img?.dataUrl || img),
    }))
    .filter(img => img.dataUrl.startsWith("data:image/"))
    .slice(0, 8);
};

const extractLinksFromPrompt = (prompt: string) => {
  const matches = prompt.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi) || [];
  return matches.map(normalizeUrl).filter(Boolean);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = clean(body?.prompt);

    const productImageLinks = normalizeUrlList(
      body?.productImageLinks,
      body?.referenceImageUrls,
      body?.imageLinks,
      extractLinksFromPrompt(prompt),
    );

    const referenceImages = normalizeReferenceImages(body?.referenceImages);
    const requireProductImageLinks = Boolean(body?.requireProductImageLinks);

    if (!prompt) {
      return NextResponse.json({ error: "Missing image prompt." }, { status: 400 });
    }

    if (requireProductImageLinks && !productImageLinks.length) {
      return NextResponse.json({ error: "Product image link is required. Add product image links and try again." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const strictPrompt = [
      "STRICT PRODUCT IMAGE REFERENCE MODE:",
      "Before generating, use the product image links as the default and required visual reference source when supplied.",
      "Product accuracy is higher priority than style, background, lighting, or composition instructions.",
      "Preserve the exact product shape, silhouette, size relationship, color, material, texture, packaging, labels, logo placement, proportions, and visible design details.",
      "Do not redesign, recolor, distort, replace, simplify, approximate, or invent a different product. If a product image link is supplied, treat it as the source of truth for the product look.",
      productImageLinks.length
        ? `Product image links to read and follow as references:\n${productImageLinks.join("\n")}`
        : "No product image links supplied. Use uploaded reference images if available.",
      referenceImages.length
        ? `Uploaded reference images supplied: ${referenceImages.map(img => img.name || "reference image").join(", ")}`
        : "No uploaded reference images supplied.",
      "",
      "USER IMAGE GENERATION REQUEST:",
      prompt,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt: strictPrompt,
        size: body?.size || "1024x1024",
        n: Math.max(1, Math.min(Number(body?.outputCount || body?.n || 1), 4)),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Image generation failed." }, { status: response.status });
    }

    const first = data?.data?.[0] || {};
    const b64 = first?.b64_json;
    const url = first?.url || (b64 ? `data:image/png;base64,${b64}` : "");

    if (!url) {
      return NextResponse.json({ error: "Image generation returned no image." }, { status: 502 });
    }

    return NextResponse.json({ url, prompt: strictPrompt, productImageLinks });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Image generation failed." }, { status: 500 });
  }
}
