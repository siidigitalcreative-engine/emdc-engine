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
  ecommerce_listing:
    "Generate a complete marketplace-ready e-commerce listing based on selected SKUs and catalog references. Use clean copy-paste-ready section titles only. Do not use markdown heading symbols like ###. Do not number section headers.",
  ecommerce_prompt_from_catalog:
    "Read catalog references and selected products, then create a complete AI prompt that can generate an e-commerce marketplace listing. The prompt itself must instruct the next AI output to avoid markdown heading symbols, numbered section headers, and the Recommended Final Listing Structure section.",
  phaseout_matcher:
    "Analyze products and match them to the best campaign/event opportunities. Return exactly what the user requested.",
  asset_completion_announcement:
    "Create an email announcement, a concise Viber message, and an internal team message for completed Digital Creative assets. Return strict JSON only using the requested structure. Do not use markdown code fences.",
};

const toneInstructions: Record<string, string> = {
  professional: "Use a professional but accessible English tone.",
  premium: "Use a premium, polished, lifestyle-brand tone.",
  casual: "Use a casual, friendly, easy-to-read tone.",
  taglish:
    "Use natural Filipino Taglish where appropriate, but keep product details clear.",
  short: "Keep the output short, direct, and easy to copy.",
};

const selectableTextModels = new Set([
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
]);

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl || "");
  if (!match) return null;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = !!match[2];
  const rawData = match[3] || "";

  if (!isBase64) {
    return {
      mimeType,
      base64: Buffer.from(decodeURIComponent(rawData)).toString("base64"),
      text: decodeURIComponent(rawData),
    };
  }

  const base64 = rawData.replace(/\s/g, "");
  let text = "";

  try {
    if (
      mimeType.startsWith("text/") ||
      mimeType.includes("json") ||
      mimeType.includes("csv")
    ) {
      text = Buffer.from(base64, "base64").toString("utf8");
    }
  } catch {}

  return { mimeType, base64, text };
}

function fileParts(file: any) {
  const name =
    typeof file?.name === "string"
      ? file.name
      : "uploaded reference";

  const type =
    typeof file?.type === "string"
      ? file.type
      : "";

  const parsed = parseDataUrl(
    String(file?.dataUrl || "")
  );

  if (!parsed) return [];

  const mimeType =
    parsed.mimeType ||
    type ||
    "application/octet-stream";

  if (parsed.text) {
    return [
      {
        text: [
          `Uploaded catalog/reference file: ${name}`,
          `MIME type: ${mimeType}`,
          "",
          parsed.text,
        ].join("\n"),
      },
    ];
  }

  return [
    {
      text: [
        `Uploaded catalog/reference image or PDF: ${name}`,
        `MIME type: ${mimeType}`,
        "Read this visual reference carefully. Extract visible product names, labels, material, sizes, capacity, colors, variants, care instructions, package inclusions, and any readable text. Use it as source material for the output.",
      ].join("\n"),
    },
    {
      inlineData: {
        mimeType,
        data: parsed.base64,
      },
    },
  ];
}

export async function POST(req: NextRequest) {
  let selectedModel = "";

  try {
    const body = await req.json();

    const input =
      typeof body?.input === "string"
        ? body.input.trim()
        : "";

    const task =
      typeof body?.task === "string"
        ? body.task
        : "product_description";

    const tone =
      typeof body?.tone === "string"
        ? body.tone
        : "professional";

    const customInstruction =
      typeof body?.instruction === "string"
        ? body.instruction.trim()
        : "";

    const taskLabel =
      typeof body?.taskLabel === "string"
        ? body.taskLabel.trim()
        : "";

    const requestedModel =
      typeof body?.model === "string"
        ? body.model.trim()
        : "";

    const maxOutputTokensRaw = Number(
      body?.maxOutputTokens || 1800
    );

    const maxOutputTokens = Math.max(
      512,
      Math.min(
        65536,
        Number.isFinite(maxOutputTokensRaw)
          ? maxOutputTokensRaw
          : 1800
      )
    );

    if (!input && !customInstruction) {
      return NextResponse.json(
        { error: "Input is required." },
        { status: 400 }
      );
    }

    if (
      requestedModel &&
      !selectableTextModels.has(requestedModel)
    ) {
      return NextResponse.json(
        {
          error:
            "The selected Gemini model is not allowed by this EMDC route.",
          requestedModel,
          allowedModels: Array.from(
            selectableTextModels
          ),
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    selectedModel =
      requestedModel ||
      process.env.GEMINI_TEXT_MODEL ||
      "gemini-3.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing GEMINI_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    const instruction =
      customInstruction ||
      taskInstructions[task] ||
      taskInstructions.product_description;

    const toneInstruction =
      toneInstructions[tone] ||
      toneInstructions.professional;

    const prompt = [
      "You are EMDC's marketing and ecommerce copy assistant for product content.",
      taskLabel ? `Task: ${taskLabel}` : "",
      instruction,
      toneInstruction,
      "Avoid em dashes.",
      "Do not invent technical specs that are not provided.",
      "Use clear formatting that is easy to copy.",
      "For e-commerce listing outputs, do not use markdown heading symbols like ###.",
      "For e-commerce listing outputs, do not number section headers like 1., 2., or 8.",
      "Use plain section titles only, with the content below each section. Do not include a section called Recommended Final Listing Structure.",
      "When uploaded catalog/reference images are included, actively read the image and extract visible text and product details.",
      "If an uploaded catalog image is unreadable, say which details are unreadable instead of ignoring it.",
      "",
      "User input:",
      input,
    ]
      .filter(Boolean)
      .join("\n");

    const uploadedFiles = [
      ...(Array.isArray(body?.catalogFiles)
        ? body.catalogFiles
        : []),
      ...(Array.isArray(body?.referenceImages)
        ? body.referenceImages
        : []),
    ];

    const attachedParts = uploadedFiles
      .slice(0, 12)
      .flatMap(fileParts)
      .filter(Boolean);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        selectedModel
      )}:generateContent`,
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
              parts: [
                { text: prompt },
                ...attachedParts,
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens,
          },
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            "Gemini text generation failed.",
          model: selectedModel,
          details: data,
        },
        { status: response.status }
      );
    }

    const generatedText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || "")
        .join("")
        .trim() || "";

    return NextResponse.json({
      text: generatedText,
      model: selectedModel,
      finishReason:String(
        data?.candidates?.[0]
          ?.finishReason ||
        ""
      ),
      raw: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error.",
        model: selectedModel || undefined,
      },
      { status: 500 }
    );
  }
}
