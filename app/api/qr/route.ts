import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QR_SIZE = 1024;
const QUIET_ZONE_MODULES = 4;
const DARK_COLOR = "#000000";
const LIGHT_COLOR = "#FFFFFF";

function isFinderCell(
  row: number,
  column: number,
  moduleCount: number
) {
  const inTopLeft =
    row >= 0 &&
    row <= 6 &&
    column >= 0 &&
    column <= 6;

  const inTopRight =
    row >= 0 &&
    row <= 6 &&
    column >= moduleCount - 7 &&
    column < moduleCount;

  const inBottomLeft =
    row >= moduleCount - 7 &&
    row < moduleCount &&
    column >= 0 &&
    column <= 6;

  return (
    inTopLeft ||
    inTopRight ||
    inBottomLeft
  );
}

function drawRoundedFinder(
  x: number,
  y: number
) {
  /*
   * Finder structure remains QR-standard:
   * 7 × 7 dark outer area
   * 5 × 5 light middle area
   * 3 × 3 dark center
   *
   * Only the corner radii are customized.
   */
  return [
    `<rect x="${x}" y="${y}" width="7" height="7" rx="0.8" fill="${DARK_COLOR}"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="0.62" fill="${LIGHT_COLOR}"/>`,
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.48" fill="${DARK_COLOR}"/>`,
  ].join("");
}

function buildStyledQrSvg(
  text: string
) {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: "H",
  });

  const moduleCount =
    qr.modules.size;

  const canvasSize =
    moduleCount +
    QUIET_ZONE_MODULES * 2;

  const moduleInset = 0.06;
  const moduleSize =
    1 - moduleInset * 2;

  const shapes: string[] = [
    `<rect width="${canvasSize}" height="${canvasSize}" fill="${LIGHT_COLOR}"/>`,
  ];

  /*
   * Render each active data module as a rounded dot.
   * The occupied QR cells remain unchanged, which preserves scanning
   * reliability while creating the softer reference-image appearance.
   */
  for (
    let row = 0;
    row < moduleCount;
    row += 1
  ) {
    for (
      let column = 0;
      column < moduleCount;
      column += 1
    ) {
      if (
        !qr.modules.get(
          row,
          column
        ) ||
        isFinderCell(
          row,
          column,
          moduleCount
        )
      ) {
        continue;
      }

      const x =
        QUIET_ZONE_MODULES +
        column +
        moduleInset;

      const y =
        QUIET_ZONE_MODULES +
        row +
        moduleInset;

      shapes.push(
        `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" rx="${moduleSize / 2}" fill="${DARK_COLOR}"/>`
      );
    }
  }

  const topLeft =
    QUIET_ZONE_MODULES;

  const topRight =
    QUIET_ZONE_MODULES +
    moduleCount -
    7;

  const bottomLeft =
    QUIET_ZONE_MODULES +
    moduleCount -
    7;

  shapes.push(
    drawRoundedFinder(
      topLeft,
      topLeft
    ),
    drawRoundedFinder(
      topRight,
      topLeft
    ),
    drawRoundedFinder(
      topLeft,
      bottomLeft
    )
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg`,
    ` xmlns="http://www.w3.org/2000/svg"`,
    ` width="${QR_SIZE}"`,
    ` height="${QR_SIZE}"`,
    ` viewBox="0 0 ${canvasSize} ${canvasSize}"`,
    ` role="img"`,
    ` aria-label="EMDC product QR code"`,
    ` shape-rendering="geometricPrecision"`,
    `>`,
    shapes.join(""),
    `</svg>`,
  ].join("");
}

export async function GET(
  req: NextRequest
) {
  const { searchParams } =
    new URL(req.url);

  /*
   * Preserve both existing URL formats:
   * /api/qr?text=https://...
   * /api/qr?url=https://...
   */
  const text =
    searchParams.get("text") ||
    searchParams.get("url") ||
    "";

  if (!text.trim()) {
    return NextResponse.json(
      {
        error:
          "Missing text. Use /api/qr?text=PRODUCT_URL or /api/qr?url=PRODUCT_URL",
      },
      { status: 400 }
    );
  }

  try {
    const svg =
      buildStyledQrSvg(
        text.trim()
      );

    return new NextResponse(
      svg,
      {
        headers: {
          "Content-Type":
            "image/svg+xml; charset=utf-8",
          "Cache-Control":
            "public, max-age=3600",
          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "[EMDC] Styled QR generation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate QR",
      },
      { status: 500 }
    );
  }
}
