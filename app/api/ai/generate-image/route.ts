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

const isRealImageUrl = (value: unknown) => {
  const raw = clean(value);
  if (!raw) return false;
  if (/^product\s+link\s*\d*$/i.test(raw)) return false;
  if (/^(image|video)\s*placeholder$/i.test(raw)) return false;
  if (!/^https?:\/\//i.test(raw) && !/^www\./i.test(raw)) return false;
  return true;
};

const normalizeUrlList = (...lists: unknown[]) => Array.from(new Set(
  lists
    .flatMap((list: any) => Array.isArray(list) ? list : [])
    .filter(isRealImageUrl)
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
    .slice(0, 6);
};

const extractLinksFromPrompt = (prompt: string) => {
  const matches = prompt.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  return matches.filter(isRealImageUrl).map(normalizeUrl).filter(Boolean);
};

const validateImageUrl = async (url: string) => {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 EMDC BytePlus Seedream Product Reference Fetcher",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.startsWith("image/")) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length > 0;
  } catch {
    return false;
  }
};

const toBytePlusSize = (value: unknown) => {
  const size = clean(value) || "1024x1024";
  const map: Record<string, string> = {
    "1024x1024": "1K",
    "1024x1536": "1K",
    "1536x1024": "1K",
    "1080x1920": "2K",
    "1920x1080": "2K",
    "2048x2048": "2K",
    "4096x4096": "4K",
  };
  return map[size] || size;
};

const getBytePlusEndpoint = () => {
  const base = clean(process.env.BYTEPLUS_BASE_URL).replace(/\/+$/g, "");
  if (!base) return "";
  if (/\/images\/generations$/i.test(base)) return base;
  return `${base}/images/generations`;
};

const extractGeneratedImage = (data: any) => {
  if (!data) return "";
  if (typeof data?.url === "string") return data.url;
  if (typeof data?.image === "string") return data.image;
  if (typeof data?.image_url === "string") return data.image_url;
  if (typeof data?.output === "string") return data.output;
  if (Array.isArray(data?.output) && typeof data.output[0] === "string") return data.output[0];
  if (Array.isArray(data?.images) && data.images[0]?.url) return data.images[0].url;
  if (Array.isArray(data?.images) && typeof data.images[0] === "string") return data.images[0];
  if (Array.isArray(data?.data) && data.data[0]?.url) return data.data[0].url;
  if (Array.isArray(data?.data) && data.data[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
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
      body?.productLinks,
      extractLinksFromPrompt(prompt),
    );

    const uploadedReferenceImages = normalizeReferenceImages(body?.referenceImages);
    const requireProductImageLinks = body?.requireProductImageLinks !== false;

    if (!prompt) {
      return NextResponse.json({ error: "Missing image prompt." }, { status: 400 });
    }

    if (requireProductImageLinks && !productImageLinks.length) {
      return NextResponse.json({ error: "Product image link is required. Add real product image URLs before generating." }, { status: 400 });
    }

    const validProductImageLinks: string[] = [];
    const unreadableLinks: string[] = [];

    for (const link of productImageLinks.slice(0, 8)) {
      const ok = await validateImageUrl(link);
      if (ok) validProductImageLinks.push(link);
      else unreadableLinks.push(link);
    }

    if (requireProductImageLinks && !validProductImageLinks.length) {
      return NextResponse.json({
        error: "Seedream needs real readable product image URLs. The links on this card could not be read as direct images.",
        unreadableLinks,
      }, { status: 400 });
    }

    const apiKey = clean(process.env.BYTEPLUS_API_KEY);
    const model = clean(process.env.BYTEPLUS_IMAGE_MODEL);
    const endpoint = getBytePlusEndpoint();

    if (!apiKey) {
      return NextResponse.json({ error: "BYTEPLUS_API_KEY is not configured in Vercel Environment Variables." }, { status: 500 });
    }

    if (!model) {
      return NextResponse.json({ error: "BYTEPLUS_IMAGE_MODEL is not configured in Vercel Environment Variables." }, { status: 500 });
    }

    if (!endpoint) {
      return NextResponse.json({ error: "BYTEPLUS_BASE_URL is not configured in Vercel Environment Variables." }, { status: 500 });
    }

    const strictPrompt = [
      "STRICT PRODUCT REFERENCE MODE FOR SEEDREAM 4.5:",
      "Use the supplied product image URLs as the mandatory visual source of truth.",
      "Read the reference product images first and preserve the exact product appearance.",
      "Do not invent, redesign, recolor, reshape, resize incorrectly, replace, or approximate the product.",
      "Preserve product shape, silhouette, color, material, texture, proportions, labels, SKU details, packaging, and visible design details.",
      "Only create or change the background, lighting, props, composition, and lifestyle setting requested by the prompt.",
      "The final image must clearly match the product in the reference image links.",
      "",
      validProductImageLinks.length ? `PRODUCT IMAGE LINKS TO USE AS REFERENCES:\n${validProductImageLinks.join("\n")}` : "",
      unreadableLinks.length ? `UNREADABLE LINKS NOT USED:\n${unreadableLinks.join("\n")}` : "",
      uploadedReferenceImages.length ? `${uploadedReferenceImages.length} uploaded reference image(s) were also provided by the app.` : "",
      "",
      "USER IMAGE REQUEST:",
      prompt,
    ].filter(Boolean).join("\n");

    const payload: Record<string, any> = {
      model,
      prompt: strictPrompt,
      image: validProductImageLinks,
      image_urls: validProductImageLinks,
      reference_images: validProductImageLinks,
      size: toBytePlusSize(body?.size),
      response_format: "url",
      watermark: false,
      n: 1,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        error: data?.error?.message || data?.message || data?.error || "BytePlus Seedream image generation failed.",
        endpoint,
        model,
        productImageLinks: validProductImageLinks,
        unreadableLinks,
        raw: data,
      }, { status: response.status });
    }

    const url = extractGeneratedImage(data);
    if (!url) {
      return NextResponse.json({
        error: "BytePlus Seedream returned no image URL.",
        endpoint,
        model,
        raw: data,
      }, { status: 502 });
    }

    return NextResponse.json({
      url,
      prompt: strictPrompt,
      provider: "byteplus-seedream",
      model,
      productImageLinks: validProductImageLinks,
      productReferencesRead: validProductImageLinks.length,
      unreadableLinks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "BytePlus Seedream image generation failed." }, { status: 500 });
  }
}
