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
        "User-Agent": "Mozilla/5.0 EMDC Seedream Product Reference Fetcher",
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

const seedreamSize = (value: unknown) => {
  const size = clean(value) || "1024x1024";
  const map: Record<string, string> = {
    "1024x1024": "square_hd",
    "1024x1536": "portrait_4_3",
    "1536x1024": "landscape_4_3",
    "1080x1920": "portrait_16_9",
    "1920x1080": "landscape_16_9",
  };
  return map[size] || size || "square_hd";
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

    for (const link of productImageLinks.slice(0, 6)) {
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

    const provider = clean(process.env.SEEDREAM_PROVIDER || "fal").toLowerCase();
    const model = clean(process.env.SEEDREAM_MODEL || "seedream-4.5");
    const endpoint = clean(
      process.env.SEEDREAM_API_URL ||
      process.env.FAL_SEEDREAM_API_URL ||
      "https://fal.run/fal-ai/bytedance/seedream/v4.5/edit"
    );
    const apiKey = clean(process.env.SEEDREAM_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY);

    if (!apiKey) {
      return NextResponse.json({
        error: "SEEDREAM_API_KEY is not configured. Add SEEDREAM_API_KEY or FAL_KEY in Vercel Environment Variables.",
      }, { status: 500 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider === "fal") headers.Authorization = `Key ${apiKey}`;
    else headers.Authorization = `Bearer ${apiKey}`;

    const payload = provider === "fal"
      ? {
          prompt: strictPrompt,
          image_urls: validProductImageLinks,
          image_size: seedreamSize(body?.size),
          num_images: 1,
          enable_safety_checker: true,
        }
      : {
          model,
          prompt: strictPrompt,
          image_urls: validProductImageLinks,
          reference_images: validProductImageLinks,
          size: clean(body?.size) || "1024x1024",
          n: 1,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        error: data?.detail || data?.error?.message || data?.error || "Seedream 4.5 image generation failed.",
        provider,
        endpoint,
        productImageLinks: validProductImageLinks,
        unreadableLinks,
      }, { status: response.status });
    }

    const url = extractGeneratedImage(data);
    if (!url) {
      return NextResponse.json({
        error: "Seedream 4.5 returned no image URL.",
        provider,
        endpoint,
        raw: data,
      }, { status: 502 });
    }

    return NextResponse.json({
      url,
      prompt: strictPrompt,
      provider,
      model,
      productImageLinks: validProductImageLinks,
      productReferencesRead: validProductImageLinks.length,
      unreadableLinks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Seedream 4.5 image generation failed." }, { status: 500 });
  }
}
