import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import sharp from "sharp";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const rawSize = clean(value).toUpperCase();

  // Seedream 4.5 does not support 1K.
  // Keep 2K as the safest supported web output, then EMDC compresses before saving to Drive.
  const map: Record<string, string> = {
    "1024X1024": "2K",
    "1024X1536": "2K",
    "1536X1024": "2K",
    "1080X1920": "2K",
    "1920X1080": "2K",
    "1920X1920": "2K",
    "2048X2048": "2K",
    "4096X4096": "4K",
    "1K": "2K",
    "2K": "2K",
    "4K": "4K",
  };

  return map[rawSize] || "2K";
};

const normalizeAspectRatio = (value: unknown) => {
  const raw = clean(value).replace(/\s+/g, "");
  const supported = new Set(["1:1","4:5","3:4","9:16","16:9","4:3","3:2","2:3"]);
  return supported.has(raw) ? raw : "1:1";
};

const getBytePlusEndpoint = () => {
  const base = clean(process.env.BYTEPLUS_BASE_URL).replace(/\/+$/g, "");
  if (!base) return "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
  if (/\/api\/v3\/images\/generations$/i.test(base)) return base;
  if (/\/images\/generations$/i.test(base)) return base;
  if (/\/api\/v3$/i.test(base)) return `${base}/images/generations`;
  return `${base}/api/v3/images/generations`;
};

const extractGeneratedImageFromText = (text: string): string => {
  const raw = clean(text);
  if (!raw) return "";

  const lines = raw.split(/\r?\n/);
  const parsedObjects: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "data: [DONE]" || trimmed === "[DONE]") continue;
    const jsonText = trimmed.startsWith("data:") ? trimmed.replace(/^data:\s*/i, "") : trimmed;
    if (!jsonText || jsonText === "[DONE]") continue;
    try {
      parsedObjects.push(JSON.parse(jsonText));
    } catch {
      // Ignore non-JSON stream lines.
    }
  }

  for (let i = parsedObjects.length - 1; i >= 0; i -= 1) {
    const url = extractGeneratedImage(parsedObjects[i]);
    if (url) return url;
  }

  const urls = raw.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  const imageUrl = urls.find(url => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) || urls[urls.length - 1] || "";
  return imageUrl.replace(/[),.;]+$/g, "");
};

const extractGeneratedImage = (data: any): string => {
  if (!data) return "";
  if (typeof data === "string") return extractGeneratedImageFromText(data);
  if (typeof data?.url === "string") return data.url;
  if (typeof data?.image === "string") return data.image;
  if (typeof data?.image_url === "string") return data.image_url;
  if (typeof data?.output === "string") return data.output;
  if (Array.isArray(data?.output) && typeof data.output[0] === "string") return data.output[0];
  if (Array.isArray(data?.images) && data.images[0]?.url) return data.images[0].url;
  if (Array.isArray(data?.images) && typeof data.images[0] === "string") return data.images[0];
  if (Array.isArray(data?.data) && data.data[0]?.url) return data.data[0].url;
  if (Array.isArray(data?.data) && data.data[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (Array.isArray(data?.data) && data.data[0]?.content?.[0]?.url) return data.data[0].content[0].url;
  return "";
};

const getGooglePrivateKey = () => {
  const raw = process.env.GOOGLE_PRIVATE_KEY || "";
  return raw.replace(/\\n/g, "\n");
};

const getDriveClient = async () => {
  const clientEmail = clean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const privateKey = getGooglePrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive is not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  await auth.authorize();
  return google.drive({ version: "v3", auth });
};

const sanitizeFilename = (value: unknown) => clean(value)
  .replace(/[^a-z0-9-_]+/gi, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 80) || "emdc-ai-image";

const downloadImageBuffer = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 EMDC Image Compressor",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Unable to download generated image. Status ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error("Generated image URL did not return an image file.");
  return Buffer.from(await res.arrayBuffer());
};

const compressToWebp = async (inputBuffer: Buffer) => {
  const output = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  return output;
};

const uploadWebpToDrive = async (webpBuffer: Buffer, filenameBase: string) => {
  const folderId = clean(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured in Vercel.");

  const drive = await getDriveClient();
  const fileName = `${sanitizeFilename(filenameBase)}-${Date.now()}.webp`;

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: "image/webp",
    },
    media: {
      mimeType: "image/webp",
      body: Readable.from(webpBuffer),
    },
    fields: "id,name,size,webViewLink,webContentLink",
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("Google Drive upload failed. No file ID returned.");

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const driveViewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  return {
    fileId,
    fileName,
    imageUrl: driveViewUrl,
    driveViewUrl,
    driveDownloadUrl,
    webViewLink: created.data.webViewLink || "",
    sizeBytes: Number(created.data.size || webpBuffer.length),
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = clean(body?.prompt);
    const aspectRatio = normalizeAspectRatio(body?.aspectRatio || body?.ratio);

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

    const apiKey = clean(process.env.BYTEPLUS_API_KEY || process.env.ARK_API_KEY);
    const model = clean(process.env.BYTEPLUS_IMAGE_MODEL) || "seedream-4-5-251128";
    const endpoint = getBytePlusEndpoint();

    if (!apiKey) {
      return NextResponse.json({ error: "BYTEPLUS_API_KEY is not configured in Vercel Environment Variables." }, { status: 500 });
    }

    const strictPrompt = [
      "STRICT PRODUCT REFERENCE MODE FOR SEEDREAM 4.5:",
      "Use the supplied product image URLs as the mandatory visual source of truth.",
      "Read the reference product images first and preserve the exact product appearance.",
      "Do not invent, redesign, recolor, reshape, resize incorrectly, replace, or approximate the product.",
      "Preserve product shape, silhouette, color, material, texture, proportions, labels, SKU details, packaging, and visible design details.",
      "Only create or change the background, lighting, props, composition, and lifestyle setting requested by the prompt.",
      "The final image must clearly match the product in the reference image links.",
      "Create a web-optimized image suitable for site preview. Avoid unnecessary 4K detail or oversized output.",
      `COMPOSITION RATIO REQUIREMENT: Generate the image composition in ${aspectRatio} aspect ratio. Keep the main product/s fully visible and correctly framed for this ratio.`,
      "Return an image URL only. Never return base64/b64_json/data URL output.",
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
      sequential_image_generation: "disabled",
      response_format: "url",
      size: toBytePlusSize(body?.size),
      stream: true,
      watermark: false,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return NextResponse.json({
        error: parsed?.error?.message || parsed?.message || parsed?.error || extractGeneratedImageFromText(responseText) || "BytePlus Seedream image generation failed.",
        endpoint,
        model,
        productImageLinks: validProductImageLinks,
        unreadableLinks,
        raw: parsed || responseText,
      }, { status: response.status });
    }

    const generatedUrl = extractGeneratedImage(parsed) || extractGeneratedImageFromText(responseText);
    if (/^data:image\//i.test(generatedUrl)) {
      return NextResponse.json({
        error: "Image provider returned base64. EMDC blocks base64 images to protect site transfer and storage. Please retry with URL output.",
        endpoint,
        model,
      }, { status: 502 });
    }

    if (!generatedUrl) {
      return NextResponse.json({
        error: "BytePlus Seedream returned no image URL.",
        endpoint,
        model,
        raw: parsed || responseText,
      }, { status: 502 });
    }

    const originalBuffer = await downloadImageBuffer(generatedUrl);
    const compressedWebp = await compressToWebp(originalBuffer);
    const titleForFilename = body?.title || body?.name || body?.productName || "emdc-ai-image";
    const driveUpload = await uploadWebpToDrive(compressedWebp, titleForFilename);

    return NextResponse.json({
      url: driveUpload.imageUrl,
      imageUrl: driveUpload.imageUrl,
      originalProviderUrl: generatedUrl,
      driveFileId: driveUpload.fileId,
      driveFileName: driveUpload.fileName,
      driveViewUrl: driveUpload.driveViewUrl,
      driveDownloadUrl: driveUpload.driveDownloadUrl,
      webViewLink: driveUpload.webViewLink,
      optimizedForSite: true,
      compressionMode: "Seedream URL output downloaded, compressed to WebP quality 82, uploaded to Google Drive, app stores Drive URL only",
      originalSizeBytes: originalBuffer.length,
      compressedSizeBytes: compressedWebp.length,
      compressionSavingsPercent: originalBuffer.length ? Math.round((1 - compressedWebp.length / originalBuffer.length) * 100) : 0,
      prompt: strictPrompt,
      provider: "byteplus-seedream-google-drive",
      model,
      productImageLinks: validProductImageLinks,
      productReferencesRead: validProductImageLinks.length,
      aspectRatio,
      unreadableLinks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "BytePlus Seedream image generation failed." }, { status: 500 });
  }
}
