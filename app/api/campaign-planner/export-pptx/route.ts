import { NextRequest } from "next/server";
import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLORS = {
  navy: "172033",
  gold: "D6A84B",
  cream: "F7F3EA",
  white: "FFFFFF",
  text: "1F2937",
  sub: "667085",
  line: "E5E7EB",
  light: "F4F6F8",
  green: "EAF7EF",
  blue: "EEF4FF",
};

function safeName(value: any) {
  return String(value || "Campaign").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Campaign";
}

function cleanText(value: any, max = 500) {
  const s = String(value || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function addHeader(slide: any, title: string, subtitle?: string, index?: number) {
  slide.addText(title, { x: 0.6, y: 0.45, w: 8.6, h: 0.42, fontFace: "Aptos Display", fontSize: 24, bold: true, color: COLORS.navy, margin: 0 });
  if (subtitle) slide.addText(subtitle, { x: 0.6, y: 0.92, w: 8.8, h: 0.32, fontFace: "Aptos", fontSize: 10.5, color: COLORS.sub, margin: 0 });
  slide.addShape("line", { x: 0.6, y: 1.34, w: 8.7, h: 0, line: { color: COLORS.line, width: 1 } });
  if (index) slide.addText(String(index).padStart(2,"0"), { x: 9.05, y: 0.48, w: 0.55, h: 0.25, fontSize: 9, color: COLORS.sub, align: "right", margin: 0 });
}

function addFooter(slide: any) {
  slide.addText("SUNBEAMS LIFESTYLE  •  EMDC CAMPAIGN STRATEGY BUILDER", { x: 0.6, y: 7.1, w: 8.8, h: 0.18, fontSize: 6.8, color: "98A2B3", charSpacing: 0.7, margin: 0 });
}

function addBullets(slide: any, bullets: string[], x = 0.8, y = 1.7, w = 8.2, h = 4.9, fontSize = 18) {
  const runs: any[] = [];
  bullets.slice(0, 7).forEach((b) => {
    runs.push({ text: cleanText(b, 220), options: { bullet: { indent: fontSize * 1.2 }, hanging: fontSize * 0.35, breakLine: true } });
  });
  slide.addText(runs, { x, y, w, h, fontFace: "Aptos", fontSize, color: COLORS.text, valign: "top", margin: 0.04, breakLine: false, paraSpaceAfterPt: 10 });
}

function addNotes(slide: any, notes: string) {
  try { (slide as any).addNotes?.(cleanText(notes, 2500)); } catch {}
}

function splitIntoColumns<T>(items: T[]) {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief = body?.brief || {};
    const plan = body?.plan || {};
    if (!plan || !Object.keys(plan).length) {
      return Response.json({ error: "Campaign plan is required." }, { status: 400 });
    }

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "EMDC Campaign Strategy Builder";
    pptx.company = "Sunbeams Lifestyle";
    pptx.subject = brief.campaignName || "Campaign Strategy";
    pptx.title = `${brief.campaignName || "Campaign"} Team Deck`;
    pptx.lang = "en-PH";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "en-PH",
    } as any;
    pptx.defineSlideMaster({
      title: "SUNBEAMS_MASTER",
      background: { color: COLORS.white },
      objects: [
        { rect: { x: 0, y: 0, w: 0.16, h: 7.5, fill: { color: COLORS.gold }, line: { color: COLORS.gold } } },
      ],
      slideNumber: { x: 12.55, y: 7.06, w: 0.28, h: 0.18, fontSize: 7, color: "98A2B3", align: "right" },
    } as any);

    let slideNo = 0;

    // 1 Cover
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER");
      slide.background = { color: COLORS.navy };
      slide.addShape("rect", { x: 0.16, y: 0, w: 13.17, h: 7.5, fill: { color: COLORS.navy }, line: { color: COLORS.navy } });
      slide.addShape("rect", { x: 0.65, y: 0.7, w: 0.16, h: 5.65, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
      slide.addText(String(plan?.campaignConcept?.name || brief.campaignName || "Campaign Strategy"), { x: 1.05, y: 1.5, w: 10.5, h: 1.2, fontFace: "Aptos Display", fontSize: 31, bold: true, color: COLORS.white, margin: 0, breakLine: false });
      slide.addText(String(plan?.campaignConcept?.tagline || "Product Intelligence → Promo Strategy → Conversion"), { x: 1.08, y: 2.86, w: 9.8, h: 0.55, fontFace: "Aptos", fontSize: 17, color: "E7EAF0", margin: 0 });
      slide.addText(`${brief.theme || "Campaign"}  •  ${brief.startDate || ""}${brief.peakDate ? `  •  Peak: ${brief.peakDate}` : ""}${brief.endDate ? `  •  End: ${brief.endDate}` : ""}`, { x: 1.08, y: 3.62, w: 10.2, h: 0.32, fontFace: "Aptos", fontSize: 10.5, color: "B7BFCC", margin: 0 });
      slide.addText("SUNBEAMS LIFESTYLE", { x: 1.08, y: 6.56, w: 3.4, h: 0.25, fontSize: 8.5, bold: true, color: COLORS.gold, charSpacing: 1.8, margin: 0 });
      addNotes(slide, "Open by framing the campaign as one coordinated commercial system, not a collection of disconnected discounts.");
    }

    // 2 Executive summary
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "The Commercial Idea", plan?.campaignConcept?.positioning || "", slideNo); addFooter(slide);
      slide.addShape("roundRect", { x: 0.75, y: 1.75, w: 11.8, h: 1.5, rectRadius: 0.08, fill: { color: COLORS.cream }, line: { color: COLORS.cream } });
      slide.addText(cleanText(plan.executiveSummary, 780), { x: 1.05, y: 2.05, w: 11.2, h: 0.9, fontSize: 18, bold: true, color: COLORS.navy, align: "center", valign: "mid", margin: 0.05 });
      slide.addText(cleanText(plan.coreStrategy, 900), { x: 1.0, y: 3.75, w: 11.3, h: 2.1, fontSize: 15, color: COLORS.text, align: "left", valign: "mid", margin: 0.05 });
      addNotes(slide, `Executive summary: ${plan.executiveSummary || ""}\nCore strategy: ${plan.coreStrategy || ""}`);
    }

    // 3 Product role system
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "How Products Work Together", "Best sellers acquire the shopper. New and slow-moving products monetize the visit. High-ticket products grow GMV.", slideNo); addFooter(slide);
      const roles = [
        ["01", "TRAFFIC HERO", "Pull clicks, search demand and LIVE traffic", COLORS.blue],
        ["02", "NEW / BRIDGE", "Introduce priority products through proven demand", "F4F6F8"],
        ["03", "BASKET BUILDER", "Increase units/order through bundles and add-ons", "FFF7E8"],
        ["04", "GMV ANCHOR", "Increase AOV with premium/high-ticket products", COLORS.green],
      ];
      roles.forEach((r, i) => {
        const y = 1.75 + i * 1.18;
        slide.addShape("roundRect", { x: 0.9, y, w: 11.5, h: 0.9, rectRadius: 0.05, fill: { color: String(r[3]) }, line: { color: "E4E7EC" } });
        slide.addText(String(r[0]), { x: 1.15, y: y+0.23, w: 0.6, h: 0.25, fontSize: 10, bold: true, color: COLORS.gold, margin: 0 });
        slide.addText(String(r[1]), { x: 1.9, y: y+0.16, w: 2.3, h: 0.35, fontSize: 16, bold: true, color: COLORS.navy, margin: 0 });
        slide.addText(String(r[2]), { x: 4.45, y: y+0.18, w: 7.2, h: 0.4, fontSize: 12.5, color: COLORS.text, margin: 0 });
      });
      addNotes(slide, "Explain the Hero → Attach → Upgrade → Cross-sell model. We should not replace best sellers with slow movers. We use best sellers to carry them.");
    }

    // 4 Pillars
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Campaign Shopping Missions", "Organize the assortment by customer mission instead of showing one giant catalog.", slideNo); addFooter(slide);
      const pillars = (plan.pillars || []).slice(0, 6);
      const positions = [[0.75,1.65],[4.6,1.65],[8.45,1.65],[0.75,4.15],[4.6,4.15],[8.45,4.15]];
      pillars.forEach((p: any, i: number) => {
        const [x,y] = positions[i];
        slide.addShape("roundRect", { x, y, w: 3.25, h: 2.05, rectRadius: 0.05, fill: { color: i%2 ? "FAFBFC" : COLORS.cream }, line: { color: "E4E7EC" } });
        slide.addText(cleanText(p.name, 50), { x:x+0.18,y:y+0.17,w:2.9,h:0.38,fontSize:15,bold:true,color:COLORS.navy,margin:0 });
        slide.addText(cleanText(p.purpose, 150), { x:x+0.18,y:y+0.62,w:2.9,h:0.55,fontSize:9.5,color:COLORS.sub,margin:0.02,breakLine:false });
        slide.addText(`Heroes: ${cleanText((p.heroProducts||[]).join(", "), 120)}`, { x:x+0.18,y:y+1.25,w:2.9,h:0.28,fontSize:8.5,bold:true,color:COLORS.text,margin:0 });
        slide.addText(`Attach: ${cleanText((p.attachProducts||[]).join(", "), 120)}`, { x:x+0.18,y:y+1.57,w:2.9,h:0.28,fontSize:8.2,color:COLORS.text,margin:0 });
      });
      addNotes(slide, "Present these as shoppable missions. This makes content, storefront merchandising, bundles and live-selling easier to understand.");
    }

    // 5 Funnel
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Full-Funnel Campaign Flow", "External Traffic → Engagement → In-Platform Push → Conversion → Continuation", slideNo); addFooter(slide);
      const funnel = (plan.funnel || []).slice(0, 5);
      const w = 11.55 / Math.max(1, funnel.length);
      funnel.forEach((f: any, i: number) => {
        const x = 0.85 + i*w;
        slide.addShape("roundRect", { x, y:1.85, w:w-0.18, h:3.65, rectRadius:0.05, fill:{color:i%2?"FAFBFC":COLORS.blue}, line:{color:"E4E7EC"} });
        slide.addText(String(i+1).padStart(2,"0"), {x:x+0.15,y:2.05,w:0.5,h:0.25,fontSize:9,bold:true,color:COLORS.gold,margin:0});
        slide.addText(cleanText(f.stage,45), {x:x+0.15,y:2.42,w:w-0.48,h:0.45,fontSize:13.5,bold:true,color:COLORS.navy,margin:0});
        slide.addText(cleanText(f.objective,120), {x:x+0.15,y:3.0,w:w-0.48,h:0.7,fontSize:9.5,color:COLORS.text,margin:0.02});
        slide.addText(cleanText(f.execution,170), {x:x+0.15,y:3.82,w:w-0.48,h:1.0,fontSize:8.8,color:COLORS.sub,margin:0.02});
        slide.addText(`KPI: ${cleanText(f.kpi,45)}`, {x:x+0.15,y:5.05,w:w-0.48,h:0.25,fontSize:8,bold:true,color:COLORS.text,margin:0});
      });
      addNotes(slide, "Stress that media allocation should shift over time: early campaign creates demand; peak and payday periods harvest demand.");
    }

    // 6 Product priorities
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Product Priorities", "The campaign should concentrate visibility instead of spreading attention equally across the catalog.", slideNo); addFooter(slide);
      const pp = [...(plan.productPlan || [])].sort((a:any,b:any)=>(b.priority||0)-(a.priority||0)).slice(0, 14);
      const [left,right] = splitIntoColumns(pp);
      [left,right].forEach((col:any[], ci:number)=>{
        col.forEach((p:any, i:number)=>{
          const x=ci===0?0.85:6.75, y=1.7+i*0.68;
          slide.addShape("roundRect", {x,y,w:5.55,h:0.52,rectRadius:0.03,fill:{color:(p.priority||0)>=5?COLORS.cream:"FAFBFC"},line:{color:"E4E7EC"}});
          slide.addText(cleanText(p.product,80), {x:x+0.13,y:y+0.10,w:3.55,h:0.2,fontSize:9.4,bold:true,color:COLORS.navy,margin:0});
          slide.addText(`${p.commercialRole || ""} • P${p.priority || ""}`, {x:x+3.75,y:y+0.1,w:1.55,h:0.2,fontSize:7.8,color:COLORS.sub,align:"right",margin:0});
        });
      });
      addNotes(slide, "Use this slide to agree which products receive hero placement, acquisition creative, storefront visibility, creator support and LIVE time.");
    }

    // 7 Promo mechanics
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Promo Deal Architecture", "Not every product should receive the same discount mechanic.", slideNo); addFooter(slide);
      const samples = (plan.productPlan || []).slice(0, 6);
      samples.forEach((p:any,i:number)=>{
        const y=1.65+i*0.82;
        slide.addText(cleanText(p.product,70), {x:0.8,y:y+0.08,w:2.8,h:0.22,fontSize:10,bold:true,color:COLORS.navy,margin:0});
        slide.addText(cleanText(p.commercialRole,40), {x:3.7,y:y+0.08,w:1.7,h:0.22,fontSize:8.5,color:COLORS.sub,margin:0});
        slide.addText(cleanText(p.promoDeal,150), {x:5.3,y:y+0.02,w:4.25,h:0.36,fontSize:9.2,color:COLORS.text,margin:0});
        slide.addText(cleanText(p.discountGuardrail,90), {x:9.7,y:y+0.02,w:2.5,h:0.36,fontSize:8.5,color:"7A4B00",margin:0});
        slide.addShape("line", {x:0.8,y:y+0.55,w:11.45,h:0,line:{color:"EAECF0",width:0.7}});
      });
      slide.addShape("roundRect", {x:0.85,y:6.15,w:11.35,h:0.55,rectRadius:0.03,fill:{color:"FFF7E8"},line:{color:"F2D39A"}});
      slide.addText("Guardrail: validate every final deal against SRP, product cost, marketplace fees, seller-funded vouchers and minimum margin.", {x:1.05,y:6.31,w:10.9,h:0.18,fontSize:8.6,bold:true,color:"7A4B00",align:"center",margin:0});
      addNotes(slide, "Use value-add for high-ticket products. Use add-on, multi-buy and bundle mechanics to move slow inventory without weakening hero products.");
    }

    // 8 Bundle strategy
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Hero → Attach Bundle Strategy", "The strongest inventory-movement mechanic is pairing products customers already want with products we want them to discover.", slideNo); addFooter(slide);
      const bundles=(plan.bundles||[]).slice(0,8);
      bundles.forEach((b:any,i:number)=>{
        const y=1.58+i*0.64;
        slide.addText(cleanText(b.name,55), {x:0.8,y:y+0.07,w:2.4,h:0.2,fontSize:9.3,bold:true,color:COLORS.navy,margin:0});
        slide.addText(cleanText(b.heroProduct,60), {x:3.35,y:y+0.07,w:2.4,h:0.2,fontSize:8.5,color:COLORS.text,margin:0});
        slide.addText("→", {x:5.78,y:y+0.03,w:0.3,h:0.25,fontSize:14,bold:true,color:COLORS.gold,margin:0,align:"center"});
        slide.addText(cleanText(b.attachProducts,75), {x:6.2,y:y+0.07,w:2.6,h:0.2,fontSize:8.5,color:COLORS.text,margin:0});
        slide.addText(cleanText(b.mechanic,75), {x:8.95,y:y+0.07,w:3.1,h:0.2,fontSize:8.2,color:COLORS.sub,margin:0});
        slide.addShape("line", {x:0.8,y:y+0.43,w:11.25,h:0,line:{color:"EAECF0",width:0.6}});
      });
      addNotes(slide, "The point is to move multiple units with one conversion and use logical product relationships rather than discounting isolated slow movers.");
    }

    // 9 Platform plan
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Platform Roles", "Same campaign, different jobs per platform.", slideNo); addFooter(slide);
      const platforms=(plan.platformPlan||[]).slice(0,5);
      platforms.forEach((p:any,i:number)=>{
        const x=0.78+i*2.47;
        slide.addShape("roundRect", {x,y:1.75,w:2.2,h:4.7,rectRadius:0.05,fill:{color:i%2?"FAFBFC":COLORS.blue},line:{color:"E4E7EC"}});
        slide.addText(cleanText(p.platform,35), {x:x+0.15,y:2.0,w:1.9,h:0.35,fontSize:14,bold:true,color:COLORS.navy,align:"center",margin:0});
        slide.addText(cleanText(p.role,120), {x:x+0.15,y:2.55,w:1.9,h:0.75,fontSize:9.2,color:COLORS.text,align:"center",margin:0.02});
        slide.addText(cleanText(p.priorityProducts,160), {x:x+0.15,y:3.5,w:1.9,h:0.95,fontSize:8.5,color:COLORS.sub,align:"center",margin:0.02});
        slide.addText(cleanText(p.execution,180), {x:x+0.15,y:4.65,w:1.9,h:1.0,fontSize:8.3,color:COLORS.text,align:"center",margin:0.02});
        slide.addText(`KPI: ${cleanText(p.kpis,70)}`, {x:x+0.15,y:5.85,w:1.9,h:0.3,fontSize:7.8,bold:true,color:COLORS.navy,align:"center",margin:0});
      });
      addNotes(slide, "TikTok should feel discovery- and demo-led; Shopee should maximize deal/bundle/search behavior; Lazada should protect and convert higher-value demand. Meta builds and retargets audiences.");
    }

    // 10 Timeline
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "Campaign Timeline", "The product story should evolve before, during and after the sale.", slideNo); addFooter(slide);
      const tl=(plan.timeline||[]).slice(0,7);
      const h=4.95/Math.max(1,tl.length);
      tl.forEach((t:any,i:number)=>{
        const y=1.65+i*h;
        slide.addText(cleanText(t.period,30), {x:0.75,y:y+0.05,w:1.35,h:0.2,fontSize:8.8,bold:true,color:COLORS.gold,margin:0});
        slide.addText(cleanText(t.theme,55), {x:2.15,y:y+0.03,w:2.2,h:0.24,fontSize:9.6,bold:true,color:COLORS.navy,margin:0});
        slide.addText(cleanText(t.goal,80), {x:4.5,y:y+0.03,w:2.25,h:0.24,fontSize:8.7,color:COLORS.text,margin:0});
        slide.addText(cleanText(t.heroProducts,100), {x:6.9,y:y+0.03,w:2.55,h:0.24,fontSize:8.2,color:COLORS.sub,margin:0});
        slide.addText(cleanText(t.conversionAction,100), {x:9.62,y:y+0.03,w:2.5,h:0.24,fontSize:8.2,color:COLORS.text,margin:0});
        slide.addShape("line", {x:0.75,y:y+h-0.08,w:11.35,h:0,line:{color:"EAECF0",width:0.6}});
      });
      addNotes(slide, "Do not run the same sale message for the entire month. Immediately after the peak date, shift into a fresh theme and use payday to reintroduce premium/high-ticket heroes.");
    }

    // 11 KPIs
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "How We Will Measure Success", "GMV alone does not tell us whether the inventory strategy worked.", slideNo); addFooter(slide);
      const kpis=(plan.kpis||[]).slice(0,8);
      const positions=[[0.8,1.7],[6.7,1.7],[0.8,3.0],[6.7,3.0],[0.8,4.3],[6.7,4.3],[0.8,5.6],[6.7,5.6]];
      kpis.forEach((k:any,i:number)=>{const [x,y]=positions[i];slide.addShape("roundRect",{x,y,w:5.3,h:0.95,rectRadius:0.04,fill:{color:i%2?"FAFBFC":COLORS.cream},line:{color:"E4E7EC"}});slide.addText(cleanText(k.kpi,45),{x:x+0.18,y:y+0.15,w:1.65,h:0.24,fontSize:10.5,bold:true,color:COLORS.navy,margin:0});slide.addText(cleanText(k.targetOrFormula,75),{x:x+1.95,y:y+0.13,w:1.5,h:0.3,fontSize:8.7,bold:true,color:COLORS.gold,margin:0});slide.addText(cleanText(k.reason,120),{x:x+3.45,y:y+0.11,w:1.65,h:0.45,fontSize:7.8,color:COLORS.sub,margin:0.01});});
      addNotes(slide, "Track hero-to-add-on attach rate and units per order. Those are the clearest indicators that the campaign is successfully moving secondary inventory.");
    }

    // 12 Team actions
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, "What Each Team Needs to Do", "Turn the strategy into clear operating responsibilities.", slideNo); addFooter(slide);
      const teams=(plan.teamActions||[]).slice(0,5);
      const xPositions=[0.65,3.15,5.65,8.15,10.65];
      teams.forEach((t:any,i:number)=>{
        const x=xPositions[i]; slide.addShape("roundRect",{x,y:1.7,w:2.15,h:4.85,rectRadius:0.04,fill:{color:i%2?"FAFBFC":COLORS.blue},line:{color:"E4E7EC"}});slide.addText(cleanText(t.team,30),{x:x+0.12,y:1.95,w:1.9,h:0.42,fontSize:12,bold:true,color:COLORS.navy,align:"center",margin:0}); const bullets=(t.actions||[]).slice(0,5); addBullets(slide,bullets,x+0.2,2.55,1.75,3.55,8.5);
      });
      addNotes(slide, "Close the working session by assigning owners and dates to each action. The campaign plan should become the operating brief for Marketing, E-commerce, Creative and Live/Affiliate teams.");
    }

    // Additional AI-proposed slides (up to 4) if they add new value
    const proposed = (plan.presentationSlides || []).filter((s:any)=>s?.title).slice(0,4);
    proposed.forEach((s:any) => {
      const slide = pptx.addSlide("SUNBEAMS_MASTER"); slideNo++;
      addHeader(slide, cleanText(s.title,80), cleanText(s.subtitle,140), slideNo); addFooter(slide);
      addBullets(slide, (s.bullets||[]).map((x:any)=>String(x)), 0.95, 1.75, 11.2, 4.95, 17);
      addNotes(slide, s.speakerNotes || "");
    });

    // Final slide
    {
      const slide = pptx.addSlide("SUNBEAMS_MASTER");
      slide.background = { color: COLORS.navy };
      slide.addShape("rect",{x:0.16,y:0,w:13.17,h:7.5,fill:{color:COLORS.navy},line:{color:COLORS.navy}});
      slide.addText("THE OPERATING PRINCIPLE",{x:1.0,y:1.35,w:3.6,h:0.25,fontSize:9,bold:true,color:COLORS.gold,charSpacing:1.7,margin:0});
      slide.addText("Sell what customers already want.\nUse those transactions to introduce what we want them to discover.",{x:1.0,y:2.0,w:10.9,h:1.6,fontSize:28,bold:true,color:COLORS.white,margin:0,breakLine:false});
      slide.addText("BEST SELLER  →  NEW / ATTACH  →  SLOW-MOVER BASKET BUILDER  →  HIGH-TICKET UPGRADE",{x:1.0,y:4.45,w:10.7,h:0.38,fontSize:12,bold:true,color:"E7EAF0",align:"center",margin:0});
      slide.addText("Sunbeams Lifestyle • Campaign Strategy Builder",{x:1.0,y:6.55,w:4.2,h:0.25,fontSize:8,color:"B7BFCC",margin:0});
      addNotes(slide, "End with the principle that the campaign should protect proven demand while deliberately building the next generation of best sellers.");
    }

    const out = await pptx.write({ outputType: "nodebuffer" } as any);
    const filename = `${safeName(brief.campaignName)}_Team_Deck.pptx`;
    return new Response(out as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || "PowerPoint export failed." }, { status: 500 });
  }
}

/*
LOCATION PATH: app/api/campaign-planner/export-pptx/route.ts
ACTION: Create this as a NEW file.
*/
