import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NAVY = "172033";
const GOLD = "D6A84B";
const LIGHT = "F4F6F8";
const WHITE = "FFFFFF";
const TEXT = "1F2937";

function safeName(value: any) {
  return String(value || "Campaign").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Campaign";
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
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
  row.height = 26;
}

function styleBody(sheet: ExcelJS.Worksheet, startRow = 2) {
  for (let r = startRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.eachCell((cell) => {
      cell.font = { color: { argb: TEXT }, size: 10 };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        bottom: { style: "hair", color: { argb: "E5E7EB" } },
      };
      if (r % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FAFBFC" } };
    });
  }
}

function setWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
}

function addTitle(sheet: ExcelJS.Worksheet, title: string, subtitle?: string, span = 8) {
  sheet.mergeCells(1, 1, 1, span);
  const cell = sheet.getCell(1, 1);
  cell.value = title;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  cell.font = { bold: true, color: { argb: WHITE }, size: 16 };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 32;
  if (subtitle) {
    sheet.mergeCells(2, 1, 2, span);
    const sub = sheet.getCell(2, 1);
    sub.value = subtitle;
    sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F7F3EA" } };
    sub.font = { italic: true, color: { argb: TEXT }, size: 10 };
    sub.alignment = { wrapText: true, vertical: "middle" };
    sheet.getRow(2).height = 28;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief = body?.brief || {};
    const plan = body?.plan || {};
    const products = Array.isArray(body?.products) ? body.products : [];
    if (!plan || !Object.keys(plan).length) {
      return Response.json({ error: "Campaign plan is required." }, { status: 400 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "EMDC Campaign Strategy Builder";
    wb.company = "Sunbeams Lifestyle";
    wb.created = new Date();

    // Strategy Dashboard
    const s1 = wb.addWorksheet("Strategy Dashboard", { views: [{ state: "frozen", ySplit: 4 }] });
    addTitle(s1, `${brief.campaignName || "Campaign"} — Strategy Dashboard`, plan?.campaignConcept?.tagline || "", 8);
    s1.addRow([]);
    s1.addRow(["Campaign", "Theme", "Start", "Peak", "End", "Platforms", "Objectives", "AI Model"]);
    styleHeader(s1.getRow(4));
    s1.addRow([
      brief.campaignName || "", brief.theme || "", brief.startDate || "", brief.peakDate || "", brief.endDate || "",
      (brief.platforms || []).join(", "), (brief.objectives || []).join(", "), brief.textModel || "Default Model (Vercel)"
    ]);
    s1.addRow([]);
    s1.addRow(["Executive Summary"]);
    s1.getCell("A7").font = { bold: true, color: { argb: NAVY }, size: 12 };
    s1.mergeCells("A8:H10");
    s1.getCell("A8").value = plan.executiveSummary || "";
    s1.getCell("A8").alignment = { vertical: "top", wrapText: true };
    s1.getCell("A8").fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    s1.addRow([]);
    s1.getCell("A12").value = "Core Strategy";
    s1.getCell("A12").font = { bold: true, color: { argb: NAVY }, size: 12 };
    s1.mergeCells("A13:H15");
    s1.getCell("A13").value = plan.coreStrategy || "";
    s1.getCell("A13").alignment = { vertical: "top", wrapText: true };
    s1.getCell("A13").fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    setWidths(s1, [24, 22, 14, 14, 14, 30, 32, 24]);

    // Promo Deal Matrix
    const s2 = wb.addWorksheet("Promo Deal Matrix", { views: [{ state: "frozen", ySplit: 4, xSplit: 2 }] });
    addTitle(s2, "Product-Level Promo Deals & Strategy", "Discounts are planning guardrails. Validate against SRP, cost, marketplace fees, voucher funding and minimum margin.", 13);
    s2.addRow([]);
    s2.addRow(["SKU","Product","Classification","Commercial Role","Priority","Primary Platform","Promo Deal","Discount Guardrail","Target Deal Price","Attach / Bundle With","Campaign Strategy","Post-Campaign Strategy","Content Hook"]);
    styleHeader(s2.getRow(4));
    (plan.productPlan || []).forEach((x: any) => s2.addRow([
      x.sku || "", x.product || "", x.classification || "", x.commercialRole || "", x.priority || "", x.primaryPlatform || "",
      x.promoDeal || "", x.discountGuardrail || "", x.targetDealPrice || "", x.attachBundleWith || "", x.campaignStrategy || "", x.postCampaignStrategy || "", x.contentHook || ""
    ]));
    styleBody(s2, 5);
    setWidths(s2, [16,34,25,22,10,24,38,28,18,32,38,38,38]);
    s2.autoFilter = { from: "A4", to: "M4" };

    // Bundle Library
    const s3 = wb.addWorksheet("Bundle & Offer Library", { views: [{ state: "frozen", ySplit: 3 }] });
    addTitle(s3, "Bundle & Offer Library", undefined, 8);
    s3.addRow([]);
    s3.addRow(["Bundle / Offer","Hero Product","Attach Products","Mechanic","Suggested Saving","Primary Goal","Best Platform","Recommended Message"]);
    styleHeader(s3.getRow(3));
    (plan.bundles || []).forEach((x: any) => s3.addRow([x.name,x.heroProduct,x.attachProducts,x.mechanic,x.saving,x.goal,x.platform,x.message]));
    styleBody(s3, 4);
    setWidths(s3, [28,30,34,34,24,24,22,40]);

    // Campaign Calendar
    const s4 = wb.addWorksheet("Campaign Calendar", { views: [{ state: "frozen", ySplit: 3 }] });
    addTitle(s4, "Campaign Execution Calendar", undefined, 9);
    s4.addRow([]);
    s4.addRow(["Period","Theme","Goal","Hero Products","Attach Products","External Traffic","In-Platform Push","Conversion Action","Primary KPI"]);
    styleHeader(s4.getRow(3));
    (plan.timeline || []).forEach((x: any) => s4.addRow([x.period,x.theme,x.goal,x.heroProducts,x.attachProducts,x.externalTraffic,x.inPlatform,x.conversionAction,x.kpi]));
    styleBody(s4, 4);
    setWidths(s4, [18,24,28,35,35,36,36,36,22]);

    // Platform Plan
    const s5 = wb.addWorksheet("Platform Plan", { views: [{ state: "frozen", ySplit: 3 }] });
    addTitle(s5, "Platform-Specific Execution", undefined, 6);
    s5.addRow([]);
    s5.addRow(["Platform","Primary Role","Priority Products","Execution","Offer Formula","KPIs"]);
    styleHeader(s5.getRow(3));
    (plan.platformPlan || []).forEach((x: any) => s5.addRow([x.platform,x.role,x.priorityProducts,x.execution,x.offerFormula,x.kpis]));
    styleBody(s5, 4);
    setWidths(s5, [18,28,42,44,36,24]);

    // KPI + Budget Planner
    const s6 = wb.addWorksheet("Budget & KPI Planner", { views: [{ state: "frozen", ySplit: 3 }] });
    addTitle(s6, "Budget & KPI Planner", "Inputs from the campaign brief are copied below. Edit in Excel as final finance/commercial numbers are confirmed.", 6);
    s6.addRow([]);
    s6.addRow(["Input","Value","","KPI","Target / Formula","Why It Matters"]);
    styleHeader(s6.getRow(4));
    const inputs = [
      ["Campaign Budget", brief.budget || ""], ["Target GMV", brief.targetGMV || ""], ["Target AOV", brief.targetAOV || ""],
      ["Max Seller Discount %", brief.maxDiscount || ""], ["Minimum Margin %", brief.minimumMargin || ""]
    ];
    const kpis = Array.isArray(plan.kpis) ? plan.kpis : [];
    const maxRows = Math.max(inputs.length, kpis.length);
    for (let i=0; i<maxRows; i++) {
      const inp = inputs[i] || ["",""];
      const k = kpis[i] || {};
      s6.addRow([inp[0], inp[1], "", k.kpi || "", k.targetOrFormula || "", k.reason || ""]);
    }
    styleBody(s6, 5);
    s6.getColumn(2).numFmt = "#,##0.00";
    setWidths(s6, [28,18,4,28,28,48]);

    // Product Input snapshot
    const s7 = wb.addWorksheet("Selected Products", { views: [{ state: "frozen", ySplit: 3 }] });
    addTitle(s7, "Selected Campaign Products", undefined, 8);
    s7.addRow([]);
    s7.addRow(["SKU","Product","Brand","Category","Collection","SRP","Classification Tags","Notes"]);
    styleHeader(s7.getRow(3));
    products.forEach((p: any) => s7.addRow([p.sku,p.productName,p.brand,p.category,p.collection,p.srp,(p.tags||[]).join(", "),p.notes]));
    styleBody(s7, 4);
    setWidths(s7, [16,34,20,22,22,14,32,36]);

    // Budget guidance as small summary at right of dashboard
    s1.getCell("J4").value = "Budget Guidance";
    s1.getCell("J4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    s1.getCell("J4").font = { bold: true, color: { argb: NAVY } };
    s1.getCell("J5").value = "Bucket"; s1.getCell("K5").value = "Share"; s1.getCell("L5").value = "Purpose";
    ["J5","K5","L5"].forEach((c) => { s1.getCell(c).fill = { type:"pattern",pattern:"solid",fgColor:{argb:NAVY} }; s1.getCell(c).font={bold:true,color:{argb:WHITE},size:9}; });
    (plan.budgetGuidance || []).forEach((x: any, i: number) => {
      const r = 6+i; s1.getCell(r,10).value=x.bucket; s1.getCell(r,11).value=x.recommendedShare; s1.getCell(r,12).value=x.purpose;
      [10,11,12].forEach(c=>s1.getCell(r,c).alignment={wrapText:true,vertical:"top"});
    });
    s1.getColumn(10).width=24; s1.getColumn(11).width=16; s1.getColumn(12).width=34;

    const out = await wb.xlsx.writeBuffer();
    const filename = `${safeName(brief.campaignName)}_Promo_Strategy.xlsx`;
    return new Response(Buffer.from(out), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Excel export failed." }, { status: 500 });
  }
}

/*
LOCATION PATH: app/api/campaign-planner/export-excel/route.ts
ACTION: Create this as a NEW file.
*/
