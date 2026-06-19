import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const size = body?.size || "2K";
    const watermark = typeof body?.watermark === "boolean" ? body.watermark : false;
    const referenceImages = Array.isArray(body?.referenceImages)
      ? body.referenceImages.filter((v: unknown) => typeof v === "string" && v)
      : [];
    const outputCountRaw = Number(body?.outputCount || 1);
    const outputCount = Math.max(1, Math.min(4, Number.isFinite(outputCountRaw) ? outputCountRaw : 1));

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.BYTEPLUS_API_KEY;
    const baseUrl =
      process.env.BYTEPLUS_BASE_URL ||
      "https://ark.ap-southeast.bytepluses.com";
    const model =
      process.env.BYTEPLUS_IMAGE_MODEL || "seedream-4-5-251128";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing BYTEPLUS_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const payload: Record<string, unknown> = {
      model,
      prompt,
      sequential_image_generation: outputCount > 1 ? "auto" : "disabled",
      response_format: "url",
      size,
      stream: false,
      watermark,
    };

    if (outputCount > 1) {
      payload.sequential_image_generation_options = {
        max_images: outputCount,
      };
    }

    if (referenceImages.length > 0) {
      payload.image = referenceImages;
      payload.sequential_image_generation = "auto";
      payload.sequential_image_generation_options = {
        max_images: outputCount,
      };
    }

    const response = await fetch(`${baseUrl}/api/v3/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.error ||
            data?.message ||
            "BytePlus image generation failed.",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
