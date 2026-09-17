import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NAVY = "172033";
const WHITE = "FFFFFF";
const TEXT = "1F2937";

function safeName(value: any) {
  return String(value || "SKU_Storage").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "SKU_Storage";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title: string = body?.title || "SKU Storage";
    const subtitle: string = body?.subtitle || "";
    const headers: string[] = Array.isArray(body?.headers) ? body.headers.map((h: any) => String(h ?? "")) : [];
    const rows: any[][] = Array.isArray(body?.rows) ? body.rows : [];

    if (!headers.length) {
      return new Response(JSON.stringify({ error: "No columns to export." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const span = headers.length;
    const wb = new ExcelJS.Workbook();
    wb.creator = "EMDC Engine";
    wb.created = new Date();
    const sheet = wb.addWorksheet("SKU Storage", { views: [{ state: "frozen", ySplit: subtitle ? 3 : 2 }] });

    // Title band
    sheet.mergeCells(1, 1, 1, span);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    titleCell.font = { bold: true, color: { argb: WHITE }, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(1).height = 30;

    let headerRowIndex = 2;
    if (subtitle) {
      sheet.mergeCells(2, 1, 2, span);
      const subCell = sheet.getCell(2, 1);
      subCell.value = subtitle;
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      subCell.font = { color: { argb: "C7CEDB" }, size: 10 };
      subCell.alignment = { vertical: "middle", horizontal: "left" };
      sheet.getRow(2).height = 18;
      headerRowIndex = 3;
    }

    // Column headers
    const headerRow = sheet.getRow(headerRowIndex);
    headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "D9DEE7" } },
        bottom: { style: "thin", color: { argb: "D9DEE7" } },
        left: { style: "thin", color: { argb: "D9DEE7" } },
        right: { style: "thin", color: { argb: "D9DEE7" } },
      };
    });
    headerRow.height = 24;

    // Body rows
    rows.forEach((r) => {
      const cells = headers.map((_, i) => {
        const v = r?.[i];
        return v === null || v === undefined ? "" : v;
      });
      const added = sheet.addRow(cells);
      added.eachCell((cell) => {
        cell.font = { color: { argb: TEXT }, size: 10 };
        cell.alignment = { vertical: "middle", wrapText: false };
        cell.border = { bottom: { style: "hair", color: { argb: "E5E7EB" } } };
        if (added.number % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FAFBFC" } };
      });
    });

    // Column widths — size to content, clamped
    headers.forEach((h, i) => {
      let max = String(h).length;
      rows.forEach((r) => { const v = r?.[i]; const len = v === null || v === undefined ? 0 : String(v).length; if (len > max) max = len; });
      sheet.getColumn(i + 1).width = Math.min(Math.max(max + 3, 10), 48);
    });

    const out = await wb.xlsx.writeBuffer();
    const filename = `EMDC_${safeName(title)}.xlsx`;
    return new Response(Buffer.from(out), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Export failed." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
