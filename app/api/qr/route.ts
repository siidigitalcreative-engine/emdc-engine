import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_SIZE = 2048;

/*
 * The uploaded reference uses a compact one-module white margin.
 * Keep the background pure white and every active module pure black.
 */
const QUIET_ZONE_MODULES = 1;
const DARK = "#000000";
const LIGHT = "#FFFFFF";

/*
 * Reference proportions measured from the uploaded sample:
 * - roughly 89% of each QR module is filled
 * - a narrow white gap remains between neighboring modules
 */
const DOT_INSET = 0.055;
const DOT_SIZE = 1 - DOT_INSET * 2;

type QrMatrix = {
  size: number;
  get: (row: number, column: number) => boolean;
};

function isFinderCell(
  row: number,
  column: number,
  moduleCount: number
) {
  const topLeft =
    row >= 0 &&
    row <= 6 &&
    column >= 0 &&
    column <= 6;

  const topRight =
    row >= 0 &&
    row <= 6 &&
    column >= moduleCount - 7 &&
    column < moduleCount;

  const bottomLeft =
    row >= moduleCount - 7 &&
    row < moduleCount &&
    column >= 0 &&
    column <= 6;

  return topLeft || topRight || bottomLeft;
}

function isDark(
  matrix: QrMatrix,
  row: number,
  column: number
) {
  if (
    row < 0 ||
    column < 0 ||
    row >= matrix.size ||
    column >= matrix.size
  ) {
    return false;
  }

  return Boolean(
    matrix.get(row, column)
  );
}

function drawCircleModule(
  x: number,
  y: number
) {
  const radius = DOT_SIZE / 2;

  return `<circle cx="${x + radius}" cy="${y + radius}" r="${radius}" fill="${DARK}"/>`;
}

function drawTopRoundedModule(
  x: number,
  y: number
) {
  const width = DOT_SIZE;
  const height = DOT_SIZE;
  const radius = width / 2;

  return [
    `<path`,
    ` d="M ${x} ${y + height}`,
    ` L ${x} ${y + radius}`,
    ` A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    ` L ${x + width - radius} ${y}`,
    ` A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
    ` L ${x + width} ${y + height}`,
    ` Z"`,
    ` fill="${DARK}"`,
    `/>`,
  ].join("");
}

function drawBottomRoundedModule(
  x: number,
  y: number
) {
  const width = DOT_SIZE;
  const height = DOT_SIZE;
  const radius = width / 2;

  return [
    `<path`,
    ` d="M ${x} ${y}`,
    ` L ${x + width} ${y}`,
    ` L ${x + width} ${y + height - radius}`,
    ` A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}`,
    ` L ${x + radius} ${y + height}`,
    ` A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius}`,
    ` Z"`,
    ` fill="${DARK}"`,
    `/>`,
  ].join("");
}

/*
 * This recreates the "classy-rounded" behavior visible in the reference:
 *
 * - isolated and horizontally grouped modules remain circular
 * - the first module in a vertical run has a rounded top and flat bottom
 * - the last module in a vertical run has a flat top and rounded bottom
 * - middle modules in longer vertical runs remain circular
 */
function drawClassyRoundedModule(
  matrix: QrMatrix,
  row: number,
  column: number,
  x: number,
  y: number
) {
  const up = isDark(
    matrix,
    row - 1,
    column
  );

  const down = isDark(
    matrix,
    row + 1,
    column
  );

  if (!up && down) {
    return drawTopRoundedModule(
      x,
      y
    );
  }

  if (up && !down) {
    return drawBottomRoundedModule(
      x,
      y
    );
  }

  return drawCircleModule(
    x,
    y
  );
}

/*
 * Extra-rounded finder style matching the uploaded reference:
 * - heavily rounded outer square
 * - rounded white inner square
 * - rounded black center square
 *
 * The small overshoot recreates the slightly oversized finder markers.
 */
function drawExtraRoundedFinder(
  baseX: number,
  baseY: number
) {
  const outerOffset = 0.17;
  const outerX =
    baseX - outerOffset;
  const outerY =
    baseY - outerOffset;
  const outerSize = 7.34;
  const outerRadius = 2.22;

  const innerX =
    baseX + 0.89;
  const innerY =
    baseY + 0.89;
  const innerSize = 5.22;
  const innerRadius = 1.48;

  const centerX =
    baseX + 2.08;
  const centerY =
    baseY + 2.08;
  const centerSize = 3.16;
  const centerRadius = 0.72;

  return [
    `<rect`,
    ` x="${outerX}"`,
    ` y="${outerY}"`,
    ` width="${outerSize}"`,
    ` height="${outerSize}"`,
    ` rx="${outerRadius}"`,
    ` fill="${DARK}"`,
    `/>`,

    `<rect`,
    ` x="${innerX}"`,
    ` y="${innerY}"`,
    ` width="${innerSize}"`,
    ` height="${innerSize}"`,
    ` rx="${innerRadius}"`,
    ` fill="${LIGHT}"`,
    `/>`,

    `<rect`,
    ` x="${centerX}"`,
    ` y="${centerY}"`,
    ` width="${centerSize}"`,
    ` height="${centerSize}"`,
    ` rx="${centerRadius}"`,
    ` fill="${DARK}"`,
    `/>`,
  ].join("");
}

function buildReferenceStyleQrSvg(
  text: string
) {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: "H",
  });

  const matrix: QrMatrix = {
    size: qr.modules.size,
    get: (row, column) =>
      Boolean(
        qr.modules.get(
          row,
          column
        )
      ),
  };

  const canvasModules =
    matrix.size +
    QUIET_ZONE_MODULES * 2;

  const elements: string[] = [
    `<rect width="${canvasModules}" height="${canvasModules}" fill="${LIGHT}"/>`,
  ];

  for (
    let row = 0;
    row < matrix.size;
    row += 1
  ) {
    for (
      let column = 0;
      column < matrix.size;
      column += 1
    ) {
      if (
        !matrix.get(
          row,
          column
        )
      ) {
        continue;
      }

      if (
        isFinderCell(
          row,
          column,
          matrix.size
        )
      ) {
        continue;
      }

      const x =
        QUIET_ZONE_MODULES +
        column +
        DOT_INSET;

      const y =
        QUIET_ZONE_MODULES +
        row +
        DOT_INSET;

      elements.push(
        drawClassyRoundedModule(
          matrix,
          row,
          column,
          x,
          y
        )
      );
    }
  }

  const finderTopLeft =
    QUIET_ZONE_MODULES;

  const finderTopRight =
    QUIET_ZONE_MODULES +
    matrix.size -
    7;

  const finderBottomLeft =
    QUIET_ZONE_MODULES +
    matrix.size -
    7;

  elements.push(
    drawExtraRoundedFinder(
      finderTopLeft,
      finderTopLeft
    ),
    drawExtraRoundedFinder(
      finderTopRight,
      finderTopLeft
    ),
    drawExtraRoundedFinder(
      finderTopLeft,
      finderBottomLeft
    )
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg`,
    ` xmlns="http://www.w3.org/2000/svg"`,
    ` width="${OUTPUT_SIZE}"`,
    ` height="${OUTPUT_SIZE}"`,
    ` viewBox="0 0 ${canvasModules} ${canvasModules}"`,
    ` role="img"`,
    ` aria-label="EMDC product QR code"`,
    ` shape-rendering="geometricPrecision"`,
    `>`,
    elements.join(""),
    `</svg>`,
  ].join("");
}

export async function GET(
  req: NextRequest
) {
  const { searchParams } =
    new URL(req.url);

  /*
   * Preserve both existing formats:
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
      buildReferenceStyleQrSvg(
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
      "[EMDC] Reference-style QR generation failed:",
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
