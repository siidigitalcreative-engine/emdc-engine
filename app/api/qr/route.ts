import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_SIZE = 2048;

/*
 * Exact visible white space around the complete styled QR.
 *
 * The custom finder markers extend 0.17 module beyond the normal
 * QR grid. The QR origin includes that overshoot so the outermost
 * black shape remains exactly the same distance from every edge.
 */
const OUTER_PADDING_MODULES = 2;
const FINDER_OVERSHOOT_MODULES = 0.17;

const DARK = "#000000";
const LIGHT = "#FFFFFF";

const DOT_INSET = 0.055;
const DOT_SIZE = 1 - DOT_INSET * 2;

type QrMatrix = {
  size: number;
  get: (
    row: number,
    column: number
  ) => boolean;
};

type SharpCorner =
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

type CornerRadii = {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
};

type AlignmentPattern = {
  row: number;
  column: number;
};

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
    matrix.get(
      row,
      column
    )
  );
}

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

  return (
    topLeft ||
    topRight ||
    bottomLeft
  );
}

function isAlignmentPatternCenter(
  matrix: QrMatrix,
  row: number,
  column: number
) {
  if (
    row < 2 ||
    column < 2 ||
    row > matrix.size - 3 ||
    column > matrix.size - 3
  ) {
    return false;
  }

  /*
   * Standard alignment pattern:
   *
   * 11111
   * 10001
   * 10101
   * 10001
   * 11111
   */
  for (
    let rowOffset = -2;
    rowOffset <= 2;
    rowOffset += 1
  ) {
    for (
      let columnOffset = -2;
      columnOffset <= 2;
      columnOffset += 1
    ) {
      const distance =
        Math.max(
          Math.abs(rowOffset),
          Math.abs(columnOffset)
        );

      const expectedDark =
        distance === 2 ||
        (
          rowOffset === 0 &&
          columnOffset === 0
        );

      if (
        isDark(
          matrix,
          row + rowOffset,
          column + columnOffset
        ) !== expectedDark
      ) {
        return false;
      }
    }
  }

  return true;
}

function findBottomRightAlignmentPattern(
  matrix: QrMatrix
): AlignmentPattern | null {
  /*
   * Search from the bottom-right inward.
   * This returns the final QR alignment marker and avoids the
   * three standard finder regions.
   */
  for (
    let row = matrix.size - 3;
    row >= 8;
    row -= 1
  ) {
    for (
      let column = matrix.size - 3;
      column >= 8;
      column -= 1
    ) {
      if (
        isAlignmentPatternCenter(
          matrix,
          row,
          column
        )
      ) {
        return {
          row,
          column,
        };
      }
    }
  }

  return null;
}

function isAlignmentCell(
  row: number,
  column: number,
  alignment: AlignmentPattern | null
) {
  if (!alignment) return false;

  return (
    row >= alignment.row - 2 &&
    row <= alignment.row + 2 &&
    column >= alignment.column - 2 &&
    column <= alignment.column + 2
  );
}

function getCornerRadii(
  sharpCorner: SharpCorner,
  largeRadius: number,
  smallRadius: number
): CornerRadii {
  return {
    topLeft:
      sharpCorner === "top-left"
        ? smallRadius
        : largeRadius,

    topRight:
      sharpCorner === "top-right"
        ? smallRadius
        : largeRadius,

    bottomRight:
      sharpCorner === "bottom-right"
        ? smallRadius
        : largeRadius,

    bottomLeft:
      sharpCorner === "bottom-left"
        ? smallRadius
        : largeRadius,
  };
}

function rotateSharpCornerCounterClockwise(
  corner: SharpCorner
): SharpCorner {
  switch (corner) {
    case "top-left":
      return "bottom-left";

    case "top-right":
      return "top-left";

    case "bottom-right":
      return "top-right";

    case "bottom-left":
      return "bottom-right";
  }
}

function drawAsymmetricRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CornerRadii,
  fill: string
) {
  const maximumRadius =
    Math.min(
      width,
      height
    ) / 2;

  const topLeft =
    Math.min(
      radii.topLeft,
      maximumRadius
    );

  const topRight =
    Math.min(
      radii.topRight,
      maximumRadius
    );

  const bottomRight =
    Math.min(
      radii.bottomRight,
      maximumRadius
    );

  const bottomLeft =
    Math.min(
      radii.bottomLeft,
      maximumRadius
    );

  return [
    `<path`,
    ` d="`,
    `M ${x + topLeft} ${y}`,
    `H ${x + width - topRight}`,
    topRight
      ? `A ${topRight} ${topRight} 0 0 1 ${x + width} ${y + topRight}`
      : `L ${x + width} ${y}`,

    `V ${y + height - bottomRight}`,
    bottomRight
      ? `A ${bottomRight} ${bottomRight} 0 0 1 ${x + width - bottomRight} ${y + height}`
      : `L ${x + width} ${y + height}`,

    `H ${x + bottomLeft}`,
    bottomLeft
      ? `A ${bottomLeft} ${bottomLeft} 0 0 1 ${x} ${y + height - bottomLeft}`
      : `L ${x} ${y + height}`,

    `V ${y + topLeft}`,
    topLeft
      ? `A ${topLeft} ${topLeft} 0 0 1 ${x + topLeft} ${y}`
      : `L ${x} ${y}`,

    `Z`,
    `"`,
    ` fill="${fill}"`,
    `/>`,
  ].join("");
}

function drawCircleModule(
  x: number,
  y: number
) {
  const radius =
    DOT_SIZE / 2;

  return `<circle cx="${x + radius}" cy="${y + radius}" r="${radius}" fill="${DARK}"/>`;
}

function drawTopRoundedModule(
  x: number,
  y: number
) {
  const radius =
    DOT_SIZE / 2;

  return [
    `<path`,
    ` d="`,
    `M ${x} ${y + DOT_SIZE}`,
    `V ${y + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    `H ${x + DOT_SIZE - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + DOT_SIZE} ${y + radius}`,
    `V ${y + DOT_SIZE}`,
    `Z`,
    `"`,
    ` fill="${DARK}"`,
    `/>`,
  ].join("");
}

function drawBottomRoundedModule(
  x: number,
  y: number
) {
  const radius =
    DOT_SIZE / 2;

  return [
    `<path`,
    ` d="`,
    `M ${x} ${y}`,
    `H ${x + DOT_SIZE}`,
    `V ${y + DOT_SIZE - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + DOT_SIZE - radius} ${y + DOT_SIZE}`,
    `H ${x + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x} ${y + DOT_SIZE - radius}`,
    `Z`,
    `"`,
    ` fill="${DARK}"`,
    `/>`,
  ].join("");
}

function drawReferenceModule(
  matrix: QrMatrix,
  row: number,
  column: number,
  x: number,
  y: number
) {
  const above =
    isDark(
      matrix,
      row - 1,
      column
    );

  const below =
    isDark(
      matrix,
      row + 1,
      column
    );

  if (
    !above &&
    below
  ) {
    return drawTopRoundedModule(
      x,
      y
    );
  }

  if (
    above &&
    !below
  ) {
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

function drawFinderMarker(
  x: number,
  y: number,
  sharpCorner: SharpCorner
) {
  /*
   * Measurements are based on the uploaded reference:
   *
   * Outer silhouette: 7.34 modules
   * White cutout:     5.22 modules
   * Center mark:      3.16 modules
   *
   * The corner facing the QR center is intentionally much less
   * rounded, creating the characteristic leaf/drop silhouette.
   */
  const outerOffset = -0.17;
  const outerSize = 7.34;

  const innerOffset = 0.89;
  const innerSize = 5.22;

  const centerOffset = 2.08;
  const centerSize = 3.16;

  const centerSharpCorner =
    rotateSharpCornerCounterClockwise(
      sharpCorner
    );

  return [
    drawAsymmetricRoundedRect(
      x + outerOffset,
      y + outerOffset,
      outerSize,
      outerSize,
      getCornerRadii(
        sharpCorner,
        2.32,
        0.68
      ),
      DARK
    ),

    drawAsymmetricRoundedRect(
      x + innerOffset,
      y + innerOffset,
      innerSize,
      innerSize,
      getCornerRadii(
        sharpCorner,
        1.50,
        0
      ),
      LIGHT
    ),

    drawAsymmetricRoundedRect(
      x + centerOffset,
      y + centerOffset,
      centerSize,
      centerSize,
      getCornerRadii(
        centerSharpCorner,
        0.82,
        0.16
      ),
      DARK
    ),
  ].join("");
}

function drawAlignmentMarker(
  centerX: number,
  centerY: number
) {
  /*
   * The fourth reference corner is the bottom-right alignment
   * marker, rendered as the same leaf shape at its correct
   * 5 × 5 alignment-pattern scale.
   *
   * Its sharp corner faces the center of the QR: top-left.
   */
  const x =
    centerX - 2;

  const y =
    centerY - 2;

  const sharpCorner:
    SharpCorner =
      "top-left";

  const centerSharpCorner =
    rotateSharpCornerCounterClockwise(
      sharpCorner
    );

  return [
    drawAsymmetricRoundedRect(
      x - 0.14,
      y - 0.14,
      5.28,
      5.28,
      getCornerRadii(
        sharpCorner,
        1.64,
        0.46
      ),
      DARK
    ),

    drawAsymmetricRoundedRect(
      x + 0.76,
      y + 0.76,
      3.48,
      3.48,
      getCornerRadii(
        sharpCorner,
        1.08,
        0
      ),
      LIGHT
    ),

    drawAsymmetricRoundedRect(
      centerX - 0.53,
      centerY - 0.53,
      1.06,
      1.06,
      getCornerRadii(
        centerSharpCorner,
        0.31,
        0.06
      ),
      DARK
    ),
  ].join("");
}

function buildReferenceQrSvg(
  text: string
) {
  const qr = QRCode.create(
    text,
    {
      errorCorrectionLevel:
        "H",
    }
  );

  const matrix: QrMatrix = {
    size: qr.modules.size,

    get: (
      row,
      column
    ) =>
      Boolean(
        qr.modules.get(
          row,
          column
        )
      ),
  };

  const alignment =
    findBottomRightAlignmentPattern(
      matrix
    );

  const qrOrigin =
    OUTER_PADDING_MODULES +
    FINDER_OVERSHOOT_MODULES;

  const canvasModules =
    matrix.size +
    qrOrigin * 2;

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
        ) ||
        isAlignmentCell(
          row,
          column,
          alignment
        )
      ) {
        continue;
      }

      const x =
        qrOrigin +
        column +
        DOT_INSET;

      const y =
        qrOrigin +
        row +
        DOT_INSET;

      elements.push(
        drawReferenceModule(
          matrix,
          row,
          column,
          x,
          y
        )
      );
    }
  }

  const topLeft =
    qrOrigin;

  const topRight =
    qrOrigin +
    matrix.size -
    7;

  const bottomLeft =
    qrOrigin +
    matrix.size -
    7;

  /*
   * The less-rounded corner of each finder faces inward:
   *
   * TL → bottom-right
   * TR → bottom-left
   * BL → top-right
   */
  elements.push(
    drawFinderMarker(
      topLeft,
      topLeft,
      "bottom-right"
    ),

    drawFinderMarker(
      topRight,
      topLeft,
      "bottom-left"
    ),

    drawFinderMarker(
      topLeft,
      bottomLeft,
      "top-right"
    )
  );

  if (alignment) {
    elements.push(
      drawAlignmentMarker(
        qrOrigin +
          alignment.column,

        qrOrigin +
          alignment.row
      )
    );
  }

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
   * Preserve both existing endpoint formats:
   *
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
      {
        status: 400,
      }
    );
  }

  try {
    const svg =
      buildReferenceQrSvg(
        text.trim()
      );

    return new NextResponse(
      svg,
      {
        headers: {
          "Content-Type":
            "image/svg+xml; charset=utf-8",

          "Cache-Control":
            "public, max-age=0, must-revalidate",

          "ETag":
            `"emdc-qr-equal-spacing-v1-${Buffer.from(
              text.trim()
            ).toString("base64url").slice(0, 20)}"`,

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "[EMDC] Exact reference QR generation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate QR",
      },
      {
        status: 500,
      }
    );
  }
}
