import { NextRequest, NextResponse } from "next/server";

type ReferenceImage = {
  name?: string;
  type?: string;
  dataUrl?: string;
};

const clean = (value: unknown) => String(value || "").trim();

const normalizeUrl = (value: unknown) => {
  const raw = clean(value).replace(/[),.;]+$/g, "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

const normalizeUrlList = (...lists: unknown[]) => Array.from(new Set(
  lists
    .flatMap((list: any) => Array.isArray(list) ? list : [])
    .map(normalizeUrl)
    .filter(Boolean)
)).slice(0, 12);

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

const fetchImageAsDataUrl = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 EMDC Product Reference Fetcher",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Unable to read product image link: ${url}`);
  const contentType = res.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) throw new Error(`Product link did not return an image: ${url}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error(`Product image link returned an empty image: ${url}`);
  return `data:${contentType.split(";")[0]};base64,${buffer.toString("base64")}`;
};

const imageSizeForResponses = (value: unknown) => {
  const size = clean(value) || "1024x1024";
  if (["1024x1024", "1024x1536", "1536x1024", "auto"].includes(size)) return size;
  return "1024x1024";
};

const extractGeneratedImageFromResponses = (data: any) => {
  const outputs = Array.isArray(data?.output) ? data.output : [];
  for (const item of outputs) {
    if (item?.type === "image_generation_call" && item?.result) return `data:image/png;base64,${item.result}`;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_image" && part?.image_url) return part.image_url;
      if (part?.type === "image" && part?.image_url) return part.image_url;
      if (part?.b64_json) return `data:image/png;base64,${part.b64_json}`;
    }
  }
  return "";
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

    const uploadedReferenceImages = normalizeReferenceImages(body?.referenceImages);
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

    const productReferenceDataUrls: string[] = [];
    const unreadableLinks: string[] = [];

    for (const link of productImageLinks.slice(0, 8)) {
      try {
        productReferenceDataUrls.push(await fetchImageAsDataUrl(link));
      } catch {
        unreadableLinks.push(link);
      }
    }

    if (requireProductImageLinks && !productReferenceDataUrls.length) {
      return NextResponse.json({
        error: "The product image links could not be read as images. Please use direct image URLs from SKU Storage/product links.",
        unreadableLinks,
      }, { status: 400 });
    }

    const strictText = [
      "STRICT PRODUCT IMAGE REFERENCE MODE:",
      "The attached product image references are mandatory source-of-truth references.",
      "Read the attached product images first before generating.",
      "Preserve the exact product shape, silhouette, color, material, texture, size ratio, logo/label placement, packaging, and visible details.",
      "Do not invent a new product, change the product design, recolor it, add missing parts, remove parts, or approximate from memory.",
      "Only change the scene/background/composition requested by the user. The product itself must match the supplied product image references.",
      productImageLinks.length ? `Original product image links:\n${productImageLinks.join("\n")}` : "",
      unreadableLinks.length ? `Unreadable links skipped:\n${unreadableLinks.join("\n")}` : "",
      "",
      "USER IMAGE GENERATION REQUEST:",
      prompt,
    ].filter(Boolean).join("\n");

    const inputContent: any[] = [
      { type: "input_text", text: strictText },
      ...productReferenceDataUrls.map((image_url) => ({ type: "input_image", image_url })),
      ...uploadedReferenceImages.map((img) => ({ type: "input_image", image_url: img.dataUrl })),
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-4.1",
        input: [{ role: "user", content: inputContent }],
        tools: [{ type: "image_generation", size: imageSizeForResponses(body?.size) }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Image generation failed." }, { status: response.status });
    }

    const url = extractGeneratedImageFromResponses(data);
    if (!url) {
      return NextResponse.json({ error: "Image generation returned no image." }, { status: 502 });
    }

    return NextResponse.json({
      url,
      prompt: strictText,
      productImageLinks,
      productReferencesRead: productReferenceDataUrls.length,
      unreadableLinks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Image generation failed." }, { status: 500 });
  }
}
