import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const taskInstructions: Record<string, string> = {
  product_description:
    "Write a marketplace-ready product description. Make it clear, benefit-led, SEO-friendly, and easy to understand.",
  marketplace_title:
    "Create 5 Shopee/Lazada-ready product title options. Keep them searchable, concise, and keyword-rich without sounding spammy.",
  tiktok_caption:
    "Write 5 TikTok caption options. Keep them scroll-stopping, natural, and conversion-focused. Add light emojis only when useful.",
  ad_copy:
    "Write paid ad copy for Meta/TikTok. Include hook, benefit, and CTA. Provide 5 options.",
  selling_points:
    "Extract and improve the strongest product selling points. Write them as short bullet points for live selling or product listing use.",
  hashtags:
    "Generate relevant hashtags for the product. Group them into branded, product, marketplace, and lifestyle hashtags.",
  image_prompt:
    "Improve this into a detailed image generation prompt for realistic commercial product photography. Keep product accuracy, scene, lighting, camera, and composition clear.",
  video_prompt:
    "Improve this into a cinematic image-to-video or text-to-video prompt. Include camera motion, subject action, pacing, lighting, and product hero focus.",
};

const toneInstructions: Record<string, string> = {
  professional: "Use a professional but accessible English tone.",
  premium: "Use a premium, polished, lifestyle-brand tone.",
  casual: "Use a casual, friendly, easy-to-read tone.",
  taglish: "Use natural Filipino Taglish where appropriate, but keep product details clear.",
  short: "Keep the output short, direct, and easy to copy.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const input = typeof body?.input === "string" ? body.input.trim() : "";
    const task = typeof body?.task === "string" ? body.task : "product_description";
    const tone = typeof body?.tone === "string" ? body.tone : "professional";

    if (!input) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const instruction = taskInstructions[task] || taskInstructions.product_description;
    const toneInstruction = toneInstructions[tone] || toneInstructions.professional;

    const prompt = [
      "You are EMDC's marketing and ecommerce copy assistant for product content.",
      instruction,
      toneInstruction,
      "Avoid em dashes.",
      "Do not invent technical specs that are not provided.",
      "Use clear formatting that is easy to copy.",
      "",
      "User input:",
      input,
    ].join("\\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            "Gemini text generation failed.",
          details: data,
        },
        { status: response.status }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || "")
        .join("")
        .trim() || "";

    return NextResponse.json({ text, raw: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
