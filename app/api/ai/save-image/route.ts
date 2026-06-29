import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import sharp from "sharp";
import { Readable } from "stream";

const clean = (value: unknown) => String(value || "").trim();

const normalizePrivateKey = (value: unknown) => {
  const raw = clean(value);
  return raw.replace(/\\n/g, "\n");
};

const getDrivePublicUrl = (fileId: string) => `https://drive.google.com/uc?export=view&id=${fileId}`;

const getDriveClient = () => {
  const clientEmail = clean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive service account env vars are missing. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
};

const downloadImageBuffer = async (imageUrl: string) => {
  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error("Only real image URLs can be saved to Google Drive. Base64 and local previews are blocked.");
  }

  const res = await fetch(imageUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 EMDC Google Drive Image Saver",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to download generated image before saving. Status: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("The generated image URL did not return an image file.");
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) throw new Error("Downloaded image was empty.");
  return buffer;
};

const safeFilePart = (value: unknown) => clean(value)
  .replace(/[^a-z0-9-_]+/gi, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 80) || "emdc-image";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = clean(body?.imageUrl || body?.url);
    const title = clean(body?.title) || "EMDC AI Image";
    const source = clean(body?.source) || "Digital Creative";
    const prompt = clean(body?.prompt);
    const folderId = clean(process.env.GOOGLE_DRIVE_FOLDER_ID);

    if (!folderId) {
      return NextResponse.json({ error: "GOOGLE_DRIVE_FOLDER_ID is not configured in Vercel." }, { status: 500 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl to save." }, { status: 400 });
    }

    if (/^data:image\//i.test(imageUrl)) {
      return NextResponse.json({ error: "Base64 images are blocked. Generate URL output first, then save." }, { status: 400 });
    }

    const originalBuffer = await downloadImageBuffer(imageUrl);

    const webpBuffer = await sharp(originalBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const drive = getDriveClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${timestamp}-${safeFilePart(source)}-${safeFilePart(title)}.webp`;

    const created = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: "image/webp",
        description: prompt ? `EMDC generated image\n\n${prompt.slice(0, 4000)}` : "EMDC generated image",
      },
      media: {
        mimeType: "image/webp",
        body: Readable.from(webpBuffer),
      },
      fields: "id,name,webViewLink,webContentLink",
    });

    const fileId = clean(created.data.id);
    if (!fileId) throw new Error("Google Drive upload completed without returning a file ID.");

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
    });

    const publicUrl = getDrivePublicUrl(fileId);

    return NextResponse.json({
      url: publicUrl,
      imageUrl: publicUrl,
      driveFileId: fileId,
      driveFileName: created.data.name,
      webViewLink: created.data.webViewLink,
      originalBytes: originalBuffer.length,
      savedBytes: webpBuffer.length,
      format: "webp",
      quality: 82,
      storage: "google-drive",
      savedOnlyAfterClick: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save image to Google Drive." }, { status: 500 });
  }
}
