import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Accept both formats so old/new links work:
  // /api/qr?text=https://...
  // /api/qr?url=https://...
  const text = searchParams.get("text") || searchParams.get("url") || "";

  if (!text.trim()) {
    return NextResponse.json(
      { error: "Missing text. Use /api/qr?text=PRODUCT_URL or /api/qr?url=PRODUCT_URL" },
      { status: 400 }
    );
  }

  try {
    const svg = await QRCode.toString(text, {
      type: "svg",
      margin: 2,
      width: 512,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[EMDC] QR generation failed:", error);
    return NextResponse.json({ error: "Unable to generate QR" }, { status: 500 });
  }
}
