"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppTopBar from "@/components/AppTopBar";

type ProductTag = "Best Seller / Fast Mover" | "New Product" | "Slow Mover" | "Priority Push" | "Supporting";

type PlannerProduct = {
  id: string;
  sku: string;
  productName: string;
  brand: string;
  category: string;
  collection: string;
  srp: string;
  tags: ProductTag[];
  notes: string;
};

type CampaignBrief = {
  campaignName: string;
  theme: string;
  startDate: string;
  peakDate: string;
  endDate: string;
  platforms: string[];
  objectives: string[];
  budget: string;
  targetGMV: string;
  targetAOV: string;
  maxDiscount: string;
  minimumMargin: string;
  notes: string;
  textModel: string;
};

type CampaignPlan = {
  campaignConcept?: { name?: string; tagline?: string; positioning?: string };
  executiveSummary?: string;
  coreStrategy?: string;
  funnel?: Array<{ stage: string; objective: string; execution: string; products: string[]; kpi: string }>;
  pillars?: Array<{ name: string; purpose: string; heroProducts: string[]; attachProducts: string[]; message: string }>;
  productPlan?: Array<{
    sku?: string;
    product: string;
    classification?: string;
    commercialRole: string;
    priority: number;
    primaryPlatform: string;
    promoDeal: string;
    discountGuardrail: string;
    targetDealPrice?: string;
    attachBundleWith: string;
    campaignStrategy: string;
    postCampaignStrategy: string;
    contentHook: string;
  }>;
  bundles?: Array<{ name: string; heroProduct: string; attachProducts: string; mechanic: string; saving: string; goal: string; platform: string; message: string }>;
  platformPlan?: Array<{ platform: string; role: string; priorityProducts: string; execution: string; offerFormula: string; kpis: string }>;
  timeline?: Array<{ period: string; theme: string; goal: string; heroProducts: string; attachProducts: string; externalTraffic: string; inPlatform: string; conversionAction: string; kpi: string }>;
  kpis?: Array<{ kpi: string; targetOrFormula: string; reason: string }>;
  budgetGuidance?: Array<{ bucket: string; recommendedShare: string; purpose: string }>;
  teamActions?: Array<{ team: string; actions: string[] }>;
  presentationSlides?: Array<{ title: string; subtitle?: string; bullets: string[]; speakerNotes?: string }>;
};

const TAGS: ProductTag[] = ["Best Seller / Fast Mover", "New Product", "Slow Mover", "Priority Push", "Supporting"];
const PLATFORMS = ["Lazada", "Shopee", "TikTok Shop", "Meta Ads", "Shopify"];
const OBJECTIVES = ["GMV Growth", "Inventory Movement", "New Product Launch", "AOV Growth", "Customer Acquisition", "Category Growth"];
const MODELS = [
  { value: "", label: "Default Model (Vercel)" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
];

const C = {
  bg: "#F8F9FA",
  card: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  text: "#111827",
  textSub: "#374151",
  sub: "#6B7280",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  dark: "#111827",
  gold: "#6B7280",
  blue: "#F3F4F6",
  green: "#F3F4F6",
  orange: "#F9FAFB",
  red: "#FEF2F2",
};

function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSku(item: any): PlannerProduct {
  return {
    id: String(item?.id || item?.sourceId || item?.sku || item?.skuCode || uid()),
    sku: String(item?.sku || item?.skuCode || item?.value || "").trim(),
    productName: String(item?.productName || item?.product || item?.name || item?.title || "Unnamed Product").trim(),
    brand: String(item?.brand || item?.brandName || "").trim(),
    category: String(item?.category || item?.categoryName || "").trim(),
    collection: String(item?.collection || item?.collectionName || "").trim(),
    srp: String(item?.srp || item?.price || "").trim(),
    tags: ["Supporting"],
    notes: "",
  };
}

function parseJsonFromText(text: string) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try { return JSON.parse(cleaned); } catch {}
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1));
  throw new Error("The AI response was not valid campaign JSON. Generate again.");
}

function productLabel(p: PlannerProduct) {
  return [p.brand, p.productName, p.sku ? `(${p.sku})` : ""].filter(Boolean).join(" ");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function buildInstruction(lockedSections: string[], currentPlan: CampaignPlan | null) {
  const lockedText = lockedSections.length && currentPlan
    ? `\nLOCKED SECTIONS: ${lockedSections.join(", ")}. Preserve those top-level JSON keys exactly from CURRENT_PLAN. Regenerate the remaining sections only.`
    : "";

  return `You are Sunbeams Lifestyle's senior commercial marketing strategist for the Philippines. Build a practical marketplace campaign plan using the supplied campaign brief and selected products.

CORE COMMERCIAL LOGIC:
1. Best sellers / fast movers pull traffic and protect conversion.
2. New products create discovery and should be attached to proven traffic where possible.
3. Slow movers should usually become basket builders, bundle items, add-ons, GWP candidates, or inventory movers instead of receiving equal acquisition budget.
4. Priority Push products deserve explicit visibility even if they are slow/new.
5. High-ticket products should use value, demonstration, installment/voucher/GWP logic rather than careless deep discounting.
6. Build logical Hero -> Attach -> Upgrade -> Cross-sell relationships.
7. Differentiate Lazada, Shopee, TikTok Shop, Meta Ads and Shopify by their jobs in the funnel.
8. The funnel should cover External Traffic -> Engagement -> In-Platform Push -> Conversion -> Post-campaign/Payday recovery.
9. Never call products "slow movers" in customer-facing messaging. Reframe them as curated finds, upgrades, bundles, limited offers, or complete-the-look items.
10. Do not invent cost, margin, technical specs, stock count, historical sales, platform subsidies, or exact discount eligibility that were not provided.
11. Discount percentages must be planning guardrails only unless the user supplied an exact deal price. Respect maximum discount and minimum margin inputs as constraints.
12. Use Philippine peso when discussing monetary values.

RETURN ONLY VALID JSON. NO MARKDOWN FENCES. USE THIS EXACT TOP-LEVEL STRUCTURE:
{
  "campaignConcept":{"name":"","tagline":"","positioning":""},
  "executiveSummary":"",
  "coreStrategy":"",
  "funnel":[{"stage":"","objective":"","execution":"","products":[""],"kpi":""}],
  "pillars":[{"name":"","purpose":"","heroProducts":[""],"attachProducts":[""],"message":""}],
  "productPlan":[{"sku":"","product":"","classification":"","commercialRole":"Traffic Hero | GMV Hero | New Hero | High-Ticket Anchor | Bridge Hero | Basket Builder | Inventory Mover | Upsell | Cross-Sell | Supporting","priority":5,"primaryPlatform":"","promoDeal":"","discountGuardrail":"","targetDealPrice":"","attachBundleWith":"","campaignStrategy":"","postCampaignStrategy":"","contentHook":""}],
  "bundles":[{"name":"","heroProduct":"","attachProducts":"","mechanic":"","saving":"","goal":"","platform":"","message":""}],
  "platformPlan":[{"platform":"","role":"","priorityProducts":"","execution":"","offerFormula":"","kpis":""}],
  "timeline":[{"period":"","theme":"","goal":"","heroProducts":"","attachProducts":"","externalTraffic":"","inPlatform":"","conversionAction":"","kpi":""}],
  "kpis":[{"kpi":"","targetOrFormula":"","reason":""}],
  "budgetGuidance":[{"bucket":"","recommendedShare":"","purpose":""}],
  "teamActions":[{"team":"Marketing | E-commerce | Digital Creative | Live/Affiliate | Management","actions":[""]}],
  "presentationSlides":[{"title":"","subtitle":"","bullets":[""],"speakerNotes":""}]
}

REQUIREMENTS:
- Include every selected product in productPlan exactly once.
- Priority is integer 1-5.
- Create enough bundles to deliberately pair proven heroes with new/slow/priority products.
- Timeline must cover pre-campaign, peak day, post-campaign and payday/continuation when dates allow.
- presentationSlides should be a concise 12-16 slide team deck outline, not a duplicate of every detail.
- Customer-facing content hooks should be natural, clear and campaign-ready.
${lockedText}`;
}

export default function CampaignPlannerPage() {
  const [brief, setBrief] = useState<CampaignBrief>({
    campaignName: "",
    theme: "Double Digit Sale",
    startDate: "",
    peakDate: "",
    endDate: "",
    platforms: ["Lazada", "Shopee", "TikTok Shop", "Meta Ads"],
    objectives: ["GMV Growth", "Inventory Movement"],
    budget: "",
    targetGMV: "",
    targetAOV: "",
    maxDiscount: "",
    minimumMargin: "",
    notes: "",
    textModel: "",
  });
  const [skuItems, setSkuItems] = useState<PlannerProduct[]>([]);
  const [products, setProducts] = useState<PlannerProduct[]>([]);
  const [search, setSearch] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [lockedSections, setLockedSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("brief");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [library, setLibrary] = useState<any[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    loadSkuStorage();
    loadLibrary();
  }, []);

  async function loadSkuStorage() {
    try {
      const res = await fetch("/api/load", { cache: "no-store" });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!res.ok) throw new Error(data?.error || "Unable to load SKU Storage.");
      const items = Array.isArray(data?.skuItems)
        ? data.skuItems
        : Array.isArray(data?.appState?.skuItems)
          ? data.appState.skuItems
          : [];
      setSkuItems(items.map(normalizeSku));
    } catch (e: any) {
      setError(e?.message || "Unable to load SKU Storage.");
    }
  }

  async function loadLibrary() {
    try {
      const res = await fetch("/api/campaign-planner", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setLibrary(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } catch {}
  }

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return skuItems.filter((p) =>
      [p.sku, p.productName, p.brand, p.category, p.collection].some((v) => String(v).toLowerCase().includes(q))
    ).slice(0, 25);
  }, [search, skuItems]);

  function setBriefField<K extends keyof CampaignBrief>(key: K, value: CampaignBrief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBriefArray(key: "platforms" | "objectives", value: string) {
    setBrief((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((x) => x !== value) : [...prev[key], value],
    }));
  }

  function addProduct(p: PlannerProduct) {
    setProducts((prev) => {
      const key = p.sku || p.id;
      if (prev.some((x) => (x.sku || x.id) === key)) return prev;
      return [...prev, { ...p, id: p.id || uid(), tags: p.tags?.length ? p.tags : ["Supporting"] }];
    });
  }

  function addPastedProducts() {
    const lines = pasteText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const next: PlannerProduct[] = [];
    for (const line of lines) {
      const parts = line.split(/\t|\||,/).map((x) => x.trim());
      const [sku, productName, brand, category, srp] = parts;
      const matched = skuItems.find((s) => s.sku && s.sku.toLowerCase() === String(sku || "").toLowerCase());
      next.push(matched || {
        id: uid(), sku: sku || "", productName: productName || sku || "Pasted Product", brand: brand || "",
        category: category || "", collection: "", srp: srp || "", tags: ["Supporting"], notes: "",
      });
    }
    setProducts((prev) => {
      const map = new Map<string, PlannerProduct>();
      [...prev, ...next].forEach((p) => map.set(p.sku || p.id, p));
      return Array.from(map.values());
    });
    setPasteText("");
  }

  function updateProduct(id: string, patch: Partial<PlannerProduct>) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  function toggleTag(id: string, tag: ProductTag) {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const has = p.tags.includes(tag);
      let tags = has ? p.tags.filter((x) => x !== tag) : [...p.tags, tag];
      if (!tags.length) tags = ["Supporting"];
      if (tag !== "Supporting" && !has) tags = tags.filter((x) => x !== "Supporting");
      return { ...p, tags };
    }));
  }

  async function generatePlan(regenerateUnlocked = false) {
    setError("");
    if (!brief.campaignName.trim()) return setError("Enter a campaign name first.");
    if (!products.length) return setError("Add at least one product first.");
    if (!brief.platforms.length) return setError("Select at least one platform.");

    setBusy("generate");
    try {
      const instruction = buildInstruction(regenerateUnlocked ? lockedSections : [], regenerateUnlocked ? plan : null);
      const input = {
        campaignBrief: brief,
        selectedProducts: products.map((p) => ({
          sku: p.sku,
          productName: p.productName,
          brand: p.brand,
          category: p.category,
          collection: p.collection,
          srp: p.srp,
          classifications: p.tags,
          notes: p.notes,
        })),
        CURRENT_PLAN: regenerateUnlocked ? plan : undefined,
      };

      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "campaign_strategy_builder",
          taskLabel: "Campaign Strategy Builder",
          tone: "professional",
          model: brief.textModel,
          instruction,
          input: JSON.stringify(input, null, 2),
          maxOutputTokens: 8192,
        }),
      });
      const raw = await res.text();
      let payload: any = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error(raw || "Campaign generation failed."); }
      if (!res.ok) throw new Error(payload?.error || payload?.message || "Campaign generation failed.");
      const parsed = parseJsonFromText(payload?.text || "");
      setPlan(parsed);
      setActiveTab("plan");
    } catch (e: any) {
      setError(e?.message || "Campaign generation failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveCampaign() {
    setError("");
    setBusy("save");
    try {
      const payload = {
        id: campaignId || undefined,
        name: brief.campaignName,
        brief,
        products,
        plan,
        lockedSections,
      };
      const res = await fetch("/api/campaign-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to save campaign.");
      setCampaignId(data?.campaign?.id || campaignId);
      await loadLibrary();
    } catch (e: any) {
      setError(e?.message || "Unable to save campaign.");
    } finally { setBusy(""); }
  }

  async function openCampaign(id: string) {
    setBusy("open"); setError("");
    try {
      const res = await fetch(`/api/campaign-planner?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to open campaign.");
      const c = data.campaign;
      setCampaignId(c.id || "");
      setBrief(c.brief || brief);
      setProducts(Array.isArray(c.products) ? c.products : []);
      setPlan(c.plan || null);
      setLockedSections(Array.isArray(c.lockedSections) ? c.lockedSections : []);
      setShowLibrary(false);
      setActiveTab(c.plan ? "plan" : "brief");
    } catch (e: any) { setError(e?.message || "Unable to open campaign."); }
    finally { setBusy(""); }
  }

  function newCampaign() {
    setCampaignId("");
    setBrief((prev) => ({ ...prev, campaignName: "", startDate: "", peakDate: "", endDate: "", notes: "" }));
    setProducts([]); setPlan(null); setLockedSections([]); setActiveTab("brief"); setError("");
  }

  async function exportFile(kind: "excel" | "pptx") {
    if (!plan) return setError("Generate a plan before exporting.");
    setBusy(kind); setError("");
    try {
      const endpoint = kind === "excel" ? "/api/campaign-planner/export-excel" : "/api/campaign-planner/export-pptx";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, products, plan }),
      });
      if (!res.ok) {
        const text = await res.text();
        try { throw new Error(JSON.parse(text)?.error || text); } catch { throw new Error(text || `Unable to export ${kind}.`); }
      }
      const blob = await res.blob();
      const safe = brief.campaignName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Campaign";
      downloadBlob(blob, `${safe}_${kind === "excel" ? "Promo_Strategy.xlsx" : "Team_Deck.pptx"}`);
    } catch (e: any) { setError(e?.message || `Unable to export ${kind}.`); }
    finally { setBusy(""); }
  }

  function exportMarketingPlan() {
    if (!plan) return setError("Generate a plan before exporting.");
    const sections = [
      brief.campaignName,
      plan.campaignConcept?.tagline || "",
      "",
      "EXECUTIVE SUMMARY",
      plan.executiveSummary || "",
      "",
      "CORE STRATEGY",
      plan.coreStrategy || "",
      "",
      "CAMPAIGN PILLARS",
      ...(plan.pillars || []).map((x) => `${x.name}\n${x.purpose}\nHero: ${(x.heroProducts || []).join(", ")}\nAttach: ${(x.attachProducts || []).join(", ")}\nMessage: ${x.message}`),
      "",
      "FUNNEL",
      ...(plan.funnel || []).map((x) => `${x.stage}: ${x.objective}\nExecution: ${x.execution}\nProducts: ${(x.products || []).join(", ")}\nKPI: ${x.kpi}`),
      "",
      "PLATFORM PLAN",
      ...(plan.platformPlan || []).map((x) => `${x.platform}: ${x.role}\n${x.execution}\nOffer: ${x.offerFormula}\nKPIs: ${x.kpis}`),
      "",
      "TIMELINE",
      ...(plan.timeline || []).map((x) => `${x.period} | ${x.theme} | ${x.goal}\nHeroes: ${x.heroProducts}\nAttach: ${x.attachProducts}\nConversion: ${x.conversionAction}\nKPI: ${x.kpi}`),
      "",
      "TEAM ACTIONS",
      ...(plan.teamActions || []).map((x) => `${x.team}\n- ${(x.actions || []).join("\n- ")}`),
    ].join("\n");
    const safe = brief.campaignName.replace(/[^a-z0-9]+/gi, "_") || "Campaign";
    downloadBlob(new Blob([sections], { type: "text/plain;charset=utf-8" }), `${safe}_Marketing_Plan.txt`);
  }

  const topSections = ["campaignConcept","executiveSummary","coreStrategy","funnel","pillars","productPlan","bundles","platformPlan","timeline","kpis","budgetGuidance","teamActions","presentationSlides"];
  function toggleLock(section: string) {
    setLockedSections((prev) => prev.includes(section) ? prev.filter((x) => x !== section) : [...prev, section]);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 11px",
    fontSize: 13,
    color: C.text,
    background: C.card,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  };

  const btn = (selected = false): React.CSSProperties => ({
    border: `1px solid ${selected ? C.borderStrong : C.border}`,
    borderRadius: 8,
    background: selected ? C.surfaceAlt : C.card,
    color: selected ? C.text : C.textSub,
    padding: "8px 12px",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    boxShadow: "none",
  });

  return (
    <>
      <AppTopBar />
      <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ position: "relative", zIndex: 20, background: "rgba(255,255,255,.96)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", color: C.sub, fontSize: 12, fontWeight: 500 }}>Campaign Planner</Link>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Campaign Strategy Builder</div>
            <div style={{ color: C.sub, fontSize: 11 }}>Product Intelligence → Promo Strategy → Marketing Plan → Excel → Team Deck</div>
          </div>
          <button style={btn()} onClick={() => setShowLibrary((v) => !v)}>Campaign Library</button>
          <button style={btn()} onClick={newCampaign}>New Campaign</button>
          <button style={btn()} onClick={saveCampaign} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save Campaign"}</button>
          <button style={btn(true)} onClick={() => generatePlan(false)} disabled={!!busy}>{busy === "generate" ? "Generating…" : "Generate Campaign"}</button>
        </div>
      </header>

      {showLibrary && (
        <div style={{ maxWidth: 1280, margin: "14px auto 0", padding: "0 18px" }}>
          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <b>Campaign Library</b><span style={{ fontSize: 11, color: C.sub }}>{library.length} saved</span>
            </div>
            {library.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
              {library.map((c) => <button key={c.id} onClick={() => openCampaign(c.id)} style={{ textAlign: "left", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, background: "#fff", cursor: "pointer" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{c.theme || "Campaign"} • {c.productCount} products</div>
                <div style={{ color: C.sub, fontSize: 10, marginTop: 5 }}>{c.startDate || "No start date"} {c.endDate ? `→ ${c.endDate}` : ""}</div>
              </button>)}
            </div> : <div style={{ color: C.sub, fontSize: 12 }}>No saved campaigns yet.</div>}
          </section>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "18px" }}>
        {error ? <div style={{ marginBottom: 12, padding: "11px 13px", borderRadius: 10, background: C.red, color: "#B42318", fontSize: 12, fontWeight: 700 }}>{error}</div> : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[['brief','1. Campaign Brief'],['products','2. Product Input'],['plan','3. Marketing Plan'],['deals','4. Promo Deals'],['calendar','5. Calendar'],['exports','6. Exports']].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...btn(activeTab === key) }}>{label}</button>
          ))}
        </div>

        {activeTab === "brief" && (
          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Campaign Brief</div>
            <div style={{ color: C.sub, fontSize: 12, marginBottom: 18 }}>Set the commercial goal and constraints before selecting products.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 13 }}>
              <label style={labelStyle}>Campaign Name<input style={inputStyle} value={brief.campaignName} onChange={(e) => setBriefField("campaignName", e.target.value)} placeholder="e.g. 10.10 Home Upgrade Festival" /></label>
              <label style={labelStyle}>Campaign Theme<select style={inputStyle} value={brief.theme} onChange={(e) => setBriefField("theme", e.target.value)}>{["Double Digit Sale","Payday Sale","Product Launch","Bundle Promo","Clearance / Phase-Out","Back to School","Rainy Season","Christmas / Ber Months","Custom"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label style={labelStyle}>AI Model<select style={inputStyle} value={brief.textModel} onChange={(e) => setBriefField("textModel", e.target.value)}>{MODELS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
              <label style={labelStyle}>Start Date<input type="date" style={inputStyle} value={brief.startDate} onChange={(e) => setBriefField("startDate", e.target.value)} /></label>
              <label style={labelStyle}>Peak / Main Sale Date<input type="date" style={inputStyle} value={brief.peakDate} onChange={(e) => setBriefField("peakDate", e.target.value)} /></label>
              <label style={labelStyle}>End Date<input type="date" style={inputStyle} value={brief.endDate} onChange={(e) => setBriefField("endDate", e.target.value)} /></label>
              <label style={labelStyle}>Campaign Budget (₱)<input type="number" style={inputStyle} value={brief.budget} onChange={(e) => setBriefField("budget", e.target.value)} placeholder="Optional" /></label>
              <label style={labelStyle}>Target GMV (₱)<input type="number" style={inputStyle} value={brief.targetGMV} onChange={(e) => setBriefField("targetGMV", e.target.value)} placeholder="Optional" /></label>
              <label style={labelStyle}>Target AOV (₱)<input type="number" style={inputStyle} value={brief.targetAOV} onChange={(e) => setBriefField("targetAOV", e.target.value)} placeholder="Optional" /></label>
              <label style={labelStyle}>Maximum Seller Discount (%)<input type="number" style={inputStyle} value={brief.maxDiscount} onChange={(e) => setBriefField("maxDiscount", e.target.value)} placeholder="e.g. 30" /></label>
              <label style={labelStyle}>Minimum Margin (%)<input type="number" style={inputStyle} value={brief.minimumMargin} onChange={(e) => setBriefField("minimumMargin", e.target.value)} placeholder="Optional guardrail" /></label>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Platforms</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{PLATFORMS.map(x=><button key={x} onClick={()=>toggleBriefArray("platforms",x)} style={{...btn(brief.platforms.includes(x))}}>{x}</button>)}</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Objectives</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{OBJECTIVES.map(x=><button key={x} onClick={()=>toggleBriefArray("objectives",x)} style={{...btn(brief.objectives.includes(x))}}>{x}</button>)}</div>
            </div>
            <label style={{ ...labelStyle, marginTop: 16 }}>Campaign Notes<textarea rows={4} style={{...inputStyle, resize:"vertical"}} value={brief.notes} onChange={(e)=>setBriefField("notes",e.target.value)} placeholder="Special priorities, price targets, products you really want to move, campaign rules, etc." /></label>
          </section>
        )}

        {activeTab === "products" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px minmax(0,1fr)", gap: 14, alignItems: "start" }}>
            <section style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, position:"sticky", top:84 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>Add Products</div>
              <div style={{ fontSize:11, color:C.sub, margin:"4px 0 12px" }}>Search SKU Storage or paste a sheet.</div>
              <input style={inputStyle} value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={`Search ${skuItems.length.toLocaleString()} SKU Storage records…`} />
              {searchResults.length ? <div style={{ border:`1px solid ${C.border}`, borderRadius:10, marginTop:8, maxHeight:300, overflow:"auto" }}>
                {searchResults.map((p)=><div key={p.id} style={{ padding:10, borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.productName}</div><div style={{fontSize:10,color:C.sub}}>{p.sku} • {p.brand}</div></div>
                  <button style={btn()} onClick={()=>addProduct(p)}>Add</button>
                </div>)}
              </div> : null}
              <div style={{ margin:"16px 0 7px", fontSize:12, fontWeight:700 }}>Paste Sheet</div>
              <textarea style={{...inputStyle, resize:"vertical"}} rows={7} value={pasteText} onChange={(e)=>setPasteText(e.target.value)} placeholder={'One product per line:\nSKU | Product Name | Brand | Category | SRP\n\nSKU-only lines will match SKU Storage when possible.'} />
              <button style={{...btn(true), marginTop:8, width:"100%"}} onClick={addPastedProducts}>Add Pasted Products</button>
            </section>

            <section style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:12 }}><div><div style={{fontWeight:700,fontSize:16}}>Campaign Products</div><div style={{fontSize:11,color:C.sub}}>Classify products. One product can have multiple tags.</div></div><b>{products.length}</b></div>
              {products.length ? <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {products.map((p)=><div key={p.id} style={{ border:`1px solid ${C.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1.2fr .8fr .8fr 100px", gap:8, alignItems:"start" }}>
                    <div><div style={{fontWeight:700,fontSize:13}}>{p.productName}</div><div style={{fontSize:10,color:C.sub,marginTop:3}}>{p.sku || "No SKU"} • {p.brand || "No brand"} • {p.category || "No category"}</div></div>
                    <input style={inputStyle} value={p.srp} onChange={(e)=>updateProduct(p.id,{srp:e.target.value})} placeholder="SRP" />
                    <input style={inputStyle} value={p.notes} onChange={(e)=>updateProduct(p.id,{notes:e.target.value})} placeholder="Product note / exact price target" />
                    <button style={{...btn(),color:"#B42318"}} onClick={()=>setProducts(prev=>prev.filter(x=>x.id!==p.id))}>Remove</button>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:9 }}>{TAGS.map(tag=>{
                    const on=p.tags.includes(tag); return <button key={tag} onClick={()=>toggleTag(p.id,tag)} style={{border:`1px solid ${on?C.borderStrong:C.border}`,borderRadius:999,padding:"5px 8px",fontSize:10,fontWeight:600,background:on?C.surfaceAlt:C.card,color:on?C.text:C.textSub,cursor:"pointer"}}>{tag}</button>
                  })}</div>
                </div>)}
              </div> : <div style={{padding:28,textAlign:"center",color:C.sub,fontSize:12}}>Add your fast movers, new products, slow movers and priority products from the left panel.</div>}
            </section>
          </div>
        )}

        {activeTab === "plan" && (
          <section style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18 }}>
            {!plan ? <EmptyPlan onGenerate={()=>generatePlan(false)} busy={!!busy} /> : <>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div><div style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:".05em"}}>Campaign Strategy</div><h1 style={{margin:"4px 0 4px",fontSize:28}}>{plan.campaignConcept?.name || brief.campaignName}</h1><div style={{color:C.sub,fontSize:13}}>{plan.campaignConcept?.tagline}</div></div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button style={btn()} onClick={()=>generatePlan(true)} disabled={!!busy}>{busy==="generate"?"Regenerating…":"Regenerate Unlocked"}</button><button style={btn(true)} onClick={saveCampaign}>Save</button></div>
              </div>
              <div style={{marginTop:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <PlanCard title="Executive Summary" section="executiveSummary" locked={lockedSections.includes("executiveSummary")} onLock={toggleLock}><p>{plan.executiveSummary}</p></PlanCard>
                <PlanCard title="Core Strategy" section="coreStrategy" locked={lockedSections.includes("coreStrategy")} onLock={toggleLock}><p>{plan.coreStrategy}</p></PlanCard>
              </div>
              <div style={{marginTop:12}}><PlanCard title="Campaign Pillars" section="pillars" locked={lockedSections.includes("pillars")} onLock={toggleLock}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:10}}>{(plan.pillars||[]).map((x,i)=><div key={i} style={{border:`1px solid ${C.border}`,borderRadius:10,padding:11}}><b>{x.name}</b><p style={{fontSize:12}}>{x.purpose}</p><small>Heroes: {(x.heroProducts||[]).join(", ")}</small><br/><small>Attach: {(x.attachProducts||[]).join(", ")}</small><p style={{fontSize:11,color:C.sub}}>{x.message}</p></div>)}</div></PlanCard></div>
              <div style={{marginTop:12}}><PlanCard title="Funnel" section="funnel" locked={lockedSections.includes("funnel")} onLock={toggleLock}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>{(plan.funnel||[]).map((x,i)=><div key={i} style={{background:C.blue,borderRadius:10,padding:11}}><b>{x.stage}</b><div style={{fontSize:11,marginTop:5}}>{x.objective}</div><div style={{fontSize:11,color:C.sub,marginTop:5}}>{x.execution}</div><div style={{fontSize:10,fontWeight:500,marginTop:7}}>KPI: {x.kpi}</div></div>)}</div></PlanCard></div>
              <div style={{marginTop:12}}><PlanCard title="Platform Strategy" section="platformPlan" locked={lockedSections.includes("platformPlan")} onLock={toggleLock}><DataTable columns={["Platform","Role","Priority Products","Execution","Offer Formula","KPIs"]} rows={(plan.platformPlan||[]).map(x=>[x.platform,x.role,x.priorityProducts,x.execution,x.offerFormula,x.kpis])}/></PlanCard></div>
              <div style={{marginTop:12}}><PlanCard title="Team Actions" section="teamActions" locked={lockedSections.includes("teamActions")} onLock={toggleLock}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:9}}>{(plan.teamActions||[]).map((x,i)=><div key={i} style={{border:`1px solid ${C.border}`,borderRadius:10,padding:11}}><b>{x.team}</b><ul style={{paddingLeft:18,fontSize:12,lineHeight:1.6}}>{(x.actions||[]).map((a,j)=><li key={j}>{a}</li>)}</ul></div>)}</div></PlanCard></div>
              <div style={{marginTop:12,padding:11,borderRadius:10,background:C.orange,fontSize:11,color:"#7A4B00"}}>Locked sections are preserved when you click <b>Regenerate Unlocked</b>. Use this after approving parts of the plan.</div>
            </>}
          </section>
        )}

        {activeTab === "deals" && (
          <section style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,overflow:"hidden" }}>
            {!plan ? <EmptyPlan onGenerate={()=>generatePlan(false)} busy={!!busy}/> : <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontWeight:700,fontSize:17}}>Promo Deal Matrix</div><div style={{fontSize:11,color:C.sub}}>Best sellers pull traffic. New/slow/priority products are deliberately attached.</div></div><button style={btn(lockedSections.includes("productPlan"))} onClick={()=>toggleLock("productPlan")}>{lockedSections.includes("productPlan")?"🔒 Locked":"🔓 Lock Section"}</button></div>
              <DataTable columns={["Product","Class / Role","Priority","Platform","Promo Deal","Discount Guardrail","Target Deal Price","Attach / Bundle","Campaign Strategy","Post-Campaign","Content Hook"]} rows={(plan.productPlan||[]).map(x=>[x.product,`${x.classification||""} / ${x.commercialRole}`,String(x.priority),x.primaryPlatform,x.promoDeal,x.discountGuardrail,x.targetDealPrice||"",x.attachBundleWith,x.campaignStrategy,x.postCampaignStrategy,x.contentHook])}/>
              <div style={{marginTop:16,fontWeight:700}}>Bundle & Offer Library</div>
              <div style={{marginTop:8}}><DataTable columns={["Bundle","Hero","Attach Products","Mechanic","Saving","Goal","Platform","Message"]} rows={(plan.bundles||[]).map(x=>[x.name,x.heroProduct,x.attachProducts,x.mechanic,x.saving,x.goal,x.platform,x.message])}/></div>
            </>}
          </section>
        )}

        {activeTab === "calendar" && (
          <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
            {!plan ? <EmptyPlan onGenerate={()=>generatePlan(false)} busy={!!busy}/> : <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontWeight:700,fontSize:17}}>Campaign Calendar</div><div style={{fontSize:11,color:C.sub}}>Pre-sale → peak → post-sale → payday/continuation.</div></div><button style={btn(lockedSections.includes("timeline"))} onClick={()=>toggleLock("timeline")}>{lockedSections.includes("timeline")?"🔒 Locked":"🔓 Lock Section"}</button></div>
              <DataTable columns={["Period","Theme","Goal","Hero Products","Attach Products","External Traffic","In-Platform","Conversion Action","KPI"]} rows={(plan.timeline||[]).map(x=>[x.period,x.theme,x.goal,x.heroProducts,x.attachProducts,x.externalTraffic,x.inPlatform,x.conversionAction,x.kpi])}/>
            </>}
          </section>
        )}

        {activeTab === "exports" && (
          <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
            <div style={{fontWeight:700,fontSize:18}}>Final Outputs</div><div style={{fontSize:12,color:C.sub,marginTop:4}}>Generate the same three deliverables for every future campaign.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginTop:16}}>
              <ExportCard title="Marketing Plan" description="Executive strategy, pillars, funnel, platform plan, timeline and team actions." button="Download Marketing Plan" onClick={exportMarketingPlan} disabled={!plan||!!busy}/>
              <ExportCard title="Excel Promo Strategy" description="Product deal matrix, bundle library, timeline, platform plan and KPI tabs." button={busy==="excel"?"Creating Excel…":"Export Excel"} onClick={()=>exportFile("excel")} disabled={!plan||!!busy}/>
              <ExportCard title="Team Presentation" description="12–16 slide presentation generated from the approved strategy and product priorities." button={busy==="pptx"?"Creating Deck…":"Generate PowerPoint"} onClick={()=>exportFile("pptx")} disabled={!plan||!!busy}/>
            </div>
            {!plan ? <div style={{marginTop:16,padding:12,borderRadius:10,background:C.orange,color:"#7A4B00",fontSize:12}}>Generate the campaign plan first. Export buttons will activate after the plan is ready.</div> : null}
          </section>
        )}
      </div>
      </main>
    </>
  );
}

function EmptyPlan({ onGenerate, busy }: { onGenerate:()=>void; busy:boolean }) {
  return <div style={{padding:"55px 20px",textAlign:"center"}}>
    <div style={{fontSize:28,color:C.sub}}>✦</div>
    <div style={{fontWeight:700,fontSize:18,marginTop:8}}>No campaign plan generated yet</div>
    <div style={{fontSize:12,color:C.sub,margin:"6px auto 15px",maxWidth:520}}>Complete the campaign brief, add and classify your products, then generate the full strategy.</div>
    <button
      onClick={onGenerate}
      disabled={busy}
      style={{
        border:`1px solid ${C.borderStrong}`,
        borderRadius:8,
        background:busy?"#F9FAFB":C.surfaceAlt,
        color:busy?"#9CA3AF":C.textSub,
        padding:"9px 14px",
        fontWeight:600,
        fontSize:12,
        cursor:busy?"not-allowed":"pointer",
      }}
    >
      {busy?"Generating…":"Generate Campaign"}
    </button>
  </div>
}

function PlanCard({ title, section, locked, onLock, children }: any) {
  return <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:13,height:"100%",boxSizing:"border-box",background:C.card}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text}}>{title}</div>
      <button
        onClick={()=>onLock(section)}
        style={{
          border:`1px solid ${locked?C.borderStrong:C.border}`,
          borderRadius:7,
          background:locked?C.surfaceAlt:C.card,
          color:C.textSub,
          padding:"5px 8px",
          fontSize:10,
          fontWeight:600,
          cursor:"pointer"
        }}
      >
        {locked?"🔒 Locked":"🔓 Lock"}
      </button>
    </div>
    <div style={{fontSize:12,lineHeight:1.55}}>{children}</div>
  </div>
}

function DataTable({ columns, rows }: { columns:string[]; rows:any[][] }) {
  return <div style={{overflowX:"auto",border:`1px solid ${C.border}`,borderRadius:9,background:C.card}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
      <thead>
        <tr>
          {columns.map(c=><th key={c} style={{
            position:"sticky",
            top:0,
            textAlign:"left",
            padding:"9px 10px",
            background:C.surfaceAlt,
            color:C.textSub,
            fontSize:10,
            fontWeight:600,
            whiteSpace:"nowrap",
            borderBottom:`1px solid ${C.border}`
          }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length?rows.map((r,i)=><tr key={i} style={{background:i%2?"#FAFAFA":C.card}}>
          {r.map((v,j)=><td key={j} style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,verticalAlign:"top",minWidth:j===0?150:110,maxWidth:280,lineHeight:1.4,color:C.textSub}}>{String(v??"")}</td>)}
        </tr>):<tr><td colSpan={columns.length} style={{padding:20,textAlign:"center",color:C.sub}}>No rows generated.</td></tr>}
      </tbody>
    </table>
  </div>
}

function ExportCard({title,description,button,onClick,disabled}:any){
  return <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:16,display:"flex",flexDirection:"column",minHeight:180,background:C.card}}>
    <div style={{fontWeight:700,fontSize:16,color:C.text}}>{title}</div>
    <div style={{fontSize:12,color:C.sub,lineHeight:1.55,marginTop:7,flex:1}}>{description}</div>
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        border:`1px solid ${disabled?C.border:C.borderStrong}`,
        borderRadius:8,
        padding:"9px 12px",
        background:disabled?"#F9FAFB":C.surfaceAlt,
        color:disabled?"#9CA3AF":C.textSub,
        fontWeight:600,
        fontSize:12,
        cursor:disabled?"not-allowed":"pointer"
      }}
    >
      {button}
    </button>
  </div>
}




/*
LOCATION PATH: app/campaign-planner/page.tsx
ACTION: Replace the existing Campaign Planner page with this full code.
UI UPDATE: Uses the same light EMDC visual language; no black/heavy button styling.
*/
