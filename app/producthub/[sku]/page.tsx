"use client";

import React, { useEffect, useMemo, useState } from "react";

type HubData = {
  enabled?: boolean;
  slug?: string;
  heroImage?: string;
  introduction?: string;
  features?: string[];
  specifications?: string[];
  careUse?: string;
  warranty?: string;
  galleryImages?: string[];
  shopeeLink?: string;
  lazadaLink?: string;
  tiktokLink?: string;
  websiteLink?: string;
  manualLink?: string;
  catalogLink?: string;
  warrantyLink?: string;
  videoLink?: string;
  relatedSkus?: string[];
  badges?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
};

type SkuItem = {
  id?: string;
  sku?: string;
  value?: string;
  productName?: string;
  collection?: string;
  category?: string;
  brandId?: string;
  imageLink?: string;
  imageUrl?: string;
  srp?: string;
};

const normalize = (value: any) => String(value ?? "").trim();
const linesToText = (value: any) => Array.isArray(value) ? value.join("\n") : String(value || "");
const textToLines = (value: string) => String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const EMPTY_FORM = {
  enabled: true,
  slug: "",
  heroImage: "",
  introduction: "",
  features: "",
  specifications: "",
  careUse: "",
  warranty: "",
  galleryImages: "",
  shopeeLink: "",
  lazadaLink: "",
  tiktokLink: "",
  websiteLink: "",
  manualLink: "",
  catalogLink: "",
  warrantyLink: "",
  videoLink: "",
  relatedSkus: "",
  badges: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

const BADGE_OPTIONS = [
  "BPA Free",
  "Leakproof",
  "Dishwasher Safe",
  "Freezer Safe",
  "Microwave Safe",
  "Food Grade",
  "Double Wall",
  "Reusable",
  "Easy to Clean",
  "Quick Dry",
  "Premium Material",
  "Space Saving",
];

function findSku(items: SkuItem[], sku: string) {
  const target = normalize(decodeURIComponent(sku)).toLowerCase();
  return items.find((item) => {
    const values = [item.sku, item.value, item.id].map((v) => normalize(v).toLowerCase());
    return values.includes(target);
  }) || null;
}

function skuDisplay(item?: SkuItem | null, fallback = "") {
  return normalize(item?.sku || item?.value || item?.id || fallback);
}

export default function ProductHubEditorPage({ params }: { params: { sku: string } }) {
  const requestedSku = decodeURIComponent(params.sku || "");
  const [skuItems, setSkuItems] = useState<SkuItem[]>([]);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM, slug: requestedSku });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Loading Product Hub…");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setStatus("Loading SKU and Product Hub data…");

        let items: SkuItem[] = [];
        try {
          const res = await fetch("/api/emdc-state?mode=current", { cache: "no-store" });
          const data = await res.json();
          const source = data?.data?.appState || data?.appState || {};
          items = Array.isArray(source?.skuItems) ? source.skuItems : [];
        } catch {}

        if (!items.length) {
          try {
            const res = await fetch("/api/load", { cache: "no-store" });
            const data = await res.json();
            const source = data?.appState || data || {};
            items = Array.isArray(source?.skuItems) ? source.skuItems : [];
          } catch {}
        }

        const found = findSku(items, requestedSku);
        const skuCode = skuDisplay(found, requestedSku);

        let hub: HubData | null = null;
        try {
          const hubRes = await fetch(`/api/product-hub?sku=${encodeURIComponent(skuCode)}`, { cache: "no-store" });
          const hubJson = await hubRes.json();
          hub = hubJson?.data || null;
        } catch {}

        if (cancelled) return;
        setSkuItems(items);
        setProduct(found);
        setForm({
          ...EMPTY_FORM,
          enabled: hub?.enabled !== false,
          slug: hub?.slug || skuCode,
          heroImage: hub?.heroImage || found?.imageLink || found?.imageUrl || "",
          introduction: hub?.introduction || "",
          features: linesToText(hub?.features),
          specifications: linesToText(hub?.specifications),
          careUse: hub?.careUse || "",
          warranty: hub?.warranty || "",
          galleryImages: linesToText(hub?.galleryImages),
          shopeeLink: hub?.shopeeLink || "",
          lazadaLink: hub?.lazadaLink || "",
          tiktokLink: hub?.tiktokLink || "",
          websiteLink: hub?.websiteLink || "",
          manualLink: hub?.manualLink || "",
          catalogLink: hub?.catalogLink || "",
          warrantyLink: hub?.warrantyLink || "",
          videoLink: hub?.videoLink || "",
          relatedSkus: linesToText(hub?.relatedSkus),
          badges: linesToText(hub?.badges),
          seoTitle: hub?.seoTitle || "",
          seoDescription: hub?.seoDescription || "",
          seoKeywords: linesToText(hub?.seoKeywords),
        });
        setStatus(hub ? "Product Hub loaded." : "New Product Hub record. Save when ready.");
      } catch (error: any) {
        if (!cancelled) setStatus(error?.message || "Unable to load Product Hub.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestedSku]);

  const skuCode = skuDisplay(product, requestedSku);
  const productName = product?.productName || skuCode;
  const category = normalize(product?.collection || product?.category || "");
  const hero = form.heroImage || product?.imageLink || product?.imageUrl || "";

  const relatedMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skuItems.slice(0, 30);
    return skuItems.filter((item) => {
      const haystack = [item.sku, item.value, item.id, item.productName, item.collection, item.category, item.brandId].join(" ").toLowerCase();
      return haystack.includes(q);
    }).slice(0, 40);
  }, [query, skuItems]);

  const selectedRelated = useMemo(() => new Set(textToLines(form.relatedSkus).map((s) => s.toLowerCase())), [form.relatedSkus]);
  const selectedBadges = useMemo(() => new Set(textToLines(form.badges)), [form.badges]);

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const toggleRelated = (sku: string) => {
    const current = textToLines(form.relatedSkus);
    const normalized = sku.toLowerCase();
    const exists = current.some((item) => item.toLowerCase() === normalized);
    update("relatedSkus", exists ? current.filter((item) => item.toLowerCase() !== normalized).join("\n") : [...current, sku].join("\n"));
  };

  const toggleBadge = (badge: string) => {
    const current = textToLines(form.badges);
    const exists = current.includes(badge);
    update("badges", exists ? current.filter((item) => item !== badge).join("\n") : [...current, badge].join("\n"));
  };

  const save = async () => {
    try {
      setSaving(true);
      setStatus("Saving Product Hub…");
      const payload = {
        sku: skuCode,
        data: {
          sku: skuCode,
          enabled: !!form.enabled,
          slug: form.slug || skuCode,
          heroImage: form.heroImage,
          introduction: form.introduction,
          features: textToLines(form.features),
          specifications: textToLines(form.specifications),
          careUse: form.careUse,
          warranty: form.warranty,
          galleryImages: textToLines(form.galleryImages),
          shopeeLink: form.shopeeLink,
          lazadaLink: form.lazadaLink,
          tiktokLink: form.tiktokLink,
          websiteLink: form.websiteLink,
          manualLink: form.manualLink,
          catalogLink: form.catalogLink,
          warrantyLink: form.warrantyLink,
          videoLink: form.videoLink,
          relatedSkus: textToLines(form.relatedSkus),
          badges: textToLines(form.badges),
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          seoKeywords: textToLines(form.seoKeywords),
        },
      };

      const res = await fetch("/api/product-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");
      setStatus(`Saved Product Hub for ${skuCode}.`);
    } catch (error: any) {
      setStatus(error?.message || "Unable to save Product Hub.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ph-page">
      <style>{css}</style>
      <div className="ph-shell">
        <div className="ph-topbar">
          <a href="/#/skus" className="ph-link">← Back to SKU Storage</a>
          <a href={`/p/${encodeURIComponent(form.slug || skuCode)}`} target="_blank" rel="noreferrer" className="ph-link ph-link-dark">View Customer Page</a>
        </div>

        <section className="ph-hero">
          <div className="ph-image-wrap">
            {hero ? <img src={hero} alt={productName} className="ph-image" /> : <div className="ph-empty">No Image</div>}
          </div>
          <div className="ph-hero-copy">
            <div className="ph-kicker">Product Hub Editor</div>
            <h1>{productName}</h1>
            <p className="ph-muted">{skuCode}{category ? ` · ${category}` : ""}</p>
            <p className="ph-status">{status}</p>
          </div>
        </section>

        <section className="ph-card">
          <div className="ph-section-title-row">
            <h2>General</h2>
            <label className="ph-check"><input type="checkbox" checked={!!form.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Enabled</label>
          </div>
          <div className="ph-grid-2">
            <Field label="Hub Slug / URL SKU"><input value={form.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
            <Field label="Hero Image URL"><input value={form.heroImage} onChange={(e) => update("heroImage", e.target.value)} /></Field>
          </div>
          <Field label="Gallery Images" hint="One URL per line"><textarea rows={4} value={form.galleryImages} onChange={(e) => update("galleryImages", e.target.value)} /></Field>
        </section>

        <section className="ph-card">
          <h2>Product Details</h2>
          <Field label="Product Introduction"><textarea rows={5} value={form.introduction} onChange={(e) => update("introduction", e.target.value)} /></Field>
          <div className="ph-grid-2">
            <Field label="Features" hint="One per line"><textarea rows={7} value={form.features} onChange={(e) => update("features", e.target.value)} /></Field>
            <Field label="Specifications" hint="One per line"><textarea rows={7} value={form.specifications} onChange={(e) => update("specifications", e.target.value)} /></Field>
          </div>
          <div className="ph-grid-2">
            <Field label="Care & Use"><textarea rows={6} value={form.careUse} onChange={(e) => update("careUse", e.target.value)} /></Field>
            <Field label="Warranty / Notes"><textarea rows={6} value={form.warranty} onChange={(e) => update("warranty", e.target.value)} /></Field>
          </div>
        </section>

        <section className="ph-card">
          <h2>Shopping Links & Downloads</h2>
          <div className="ph-grid-2">
            <Field label="Shopee Link"><input value={form.shopeeLink} onChange={(e) => update("shopeeLink", e.target.value)} /></Field>
            <Field label="Lazada Link"><input value={form.lazadaLink} onChange={(e) => update("lazadaLink", e.target.value)} /></Field>
            <Field label="TikTok Shop Link"><input value={form.tiktokLink} onChange={(e) => update("tiktokLink", e.target.value)} /></Field>
            <Field label="Website Link"><input value={form.websiteLink} onChange={(e) => update("websiteLink", e.target.value)} /></Field>
            <Field label="Manual / PDF Link"><input value={form.manualLink} onChange={(e) => update("manualLink", e.target.value)} /></Field>
            <Field label="Catalog Link"><input value={form.catalogLink} onChange={(e) => update("catalogLink", e.target.value)} /></Field>
            <Field label="Warranty PDF Link"><input value={form.warrantyLink} onChange={(e) => update("warrantyLink", e.target.value)} /></Field>
            <Field label="Video Link"><input value={form.videoLink} onChange={(e) => update("videoLink", e.target.value)} /></Field>
          </div>
        </section>

        <section className="ph-card">
          <h2>Badges</h2>
          <div className="ph-chip-row">
            {BADGE_OPTIONS.map((badge) => (
              <button key={badge} type="button" className={selectedBadges.has(badge) ? "ph-chip active" : "ph-chip"} onClick={() => toggleBadge(badge)}>{badge}</button>
            ))}
          </div>
          <Field label="Custom Badges" hint="One per line"><textarea rows={3} value={form.badges} onChange={(e) => update("badges", e.target.value)} /></Field>
        </section>

        <section className="ph-card">
          <h2>Related Products</h2>
          <Field label="Search SKU Storage"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU, product, category…" /></Field>
          <div className="ph-related-list">
            {relatedMatches.map((item) => {
              const code = skuDisplay(item);
              if (!code || code.toLowerCase() === skuCode.toLowerCase()) return null;
              const active = selectedRelated.has(code.toLowerCase());
              return <button key={item.id || code} type="button" className={active ? "ph-related active" : "ph-related"} onClick={() => toggleRelated(code)}><strong>{code}</strong><span>{item.productName || "Product"}</span></button>;
            })}
          </div>
          <Field label="Selected Related SKUs" hint="One per line"><textarea rows={4} value={form.relatedSkus} onChange={(e) => update("relatedSkus", e.target.value)} /></Field>
        </section>

        <section className="ph-card">
          <h2>SEO</h2>
          <Field label="Meta Title"><input value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} /></Field>
          <Field label="Meta Description"><textarea rows={3} value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} /></Field>
          <Field label="Keywords" hint="One per line"><textarea rows={3} value={form.seoKeywords} onChange={(e) => update("seoKeywords", e.target.value)} /></Field>
        </section>

        <div className="ph-savebar">
          <button type="button" onClick={save} disabled={saving || loading}>{saving ? "Saving…" : "Save Product Hub"}</button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="ph-field"><span>{label}{hint ? <em>{hint}</em> : null}</span>{children}</label>;
}

const css = `
  *{box-sizing:border-box}
  body{margin:0}
  .ph-page{min-height:100vh;background:#F8FAFC;color:#111827;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:18px}
  .ph-shell{width:min(100%,1120px);margin:0 auto;padding-bottom:110px}
  .ph-topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
  .ph-link{font-size:13px;font-weight:800;color:#374151;text-decoration:none;background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:9px 12px}
  .ph-link-dark{background:#111827;color:#fff;border-color:#111827}
  .ph-hero,.ph-card{background:#fff;border:1px solid #E5E7EB;border-radius:20px;box-shadow:0 12px 36px rgba(17,24,39,.06)}
  .ph-hero{display:grid;grid-template-columns:260px minmax(0,1fr);gap:20px;padding:18px;margin-bottom:14px;align-items:center}
  .ph-image-wrap{height:220px;border-radius:16px;background:#F3F4F6;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .ph-image{width:100%;height:100%;object-fit:contain;display:block}
  .ph-empty{font-size:13px;font-weight:900;color:#9CA3AF}
  .ph-kicker{font-size:12px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#6B7280;margin-bottom:8px}
  .ph-hero h1{font-size:clamp(26px,4vw,42px);line-height:1.05;margin:0 0 8px;letter-spacing:-.04em;overflow-wrap:anywhere}
  .ph-muted{margin:0 0 12px;color:#6B7280;font-size:13px;font-weight:700;overflow-wrap:anywhere}
  .ph-status{margin:0;color:#374151;font-size:13px;font-weight:800;background:#F3F4F6;border-radius:999px;padding:8px 11px;display:inline-flex;max-width:100%;overflow-wrap:anywhere}
  .ph-card{padding:18px;margin-bottom:14px}
  .ph-card h2{font-size:16px;margin:0 0 14px;font-weight:950;letter-spacing:-.02em}
  .ph-section-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .ph-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:900;color:#111827}
  .ph-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .ph-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;min-width:0}
  .ph-field span{font-size:11px;font-weight:950;letter-spacing:.05em;text-transform:uppercase;color:#6B7280}
  .ph-field em{font-style:normal;text-transform:none;letter-spacing:0;font-weight:600;color:#9CA3AF;margin-left:6px}
  .ph-field input,.ph-field textarea{width:100%;border:1.5px solid #E5E7EB;border-radius:11px;background:#fff;color:#111827;font:inherit;font-size:14px;padding:11px 12px;outline:none;resize:vertical;min-width:0}
  .ph-field input:focus,.ph-field textarea:focus{border-color:#111827;box-shadow:0 0 0 3px rgba(17,24,39,.06)}
  .ph-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .ph-chip{border:1px solid #E5E7EB;background:#F9FAFB;color:#374151;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:900;cursor:pointer}
  .ph-chip.active{background:#111827;color:#fff;border-color:#111827}
  .ph-related-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;max-height:260px;overflow:auto;border:1px solid #E5E7EB;border-radius:12px;padding:8px;margin:8px 0 12px;background:#F8FAFC}
  .ph-related{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:1px solid #E5E7EB;background:#fff;border-radius:10px;padding:9px;text-align:left;cursor:pointer;min-width:0}
  .ph-related strong{font-size:12px;color:#111827;overflow-wrap:anywhere}
  .ph-related span{font-size:12px;color:#6B7280;overflow-wrap:anywhere}
  .ph-related.active{border-color:#111827;background:#111827}
  .ph-related.active strong,.ph-related.active span{color:#fff}
  .ph-savebar{position:fixed;left:0;right:0;bottom:0;padding:14px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-top:1px solid #E5E7EB;display:flex;justify-content:center;z-index:50}
  .ph-savebar button{width:min(100%,1120px);height:48px;border:none;border-radius:12px;background:#111827;color:#fff;font-size:14px;font-weight:950;cursor:pointer}
  .ph-savebar button:disabled{opacity:.55;cursor:not-allowed}
  @media(max-width:760px){.ph-page{padding:10px}.ph-hero{grid-template-columns:1fr;padding:12px}.ph-image-wrap{height:220px}.ph-card{padding:14px;border-radius:16px}.ph-grid-2{grid-template-columns:1fr}.ph-topbar{align-items:stretch}.ph-link{flex:1;text-align:center}.ph-related-list{grid-template-columns:1fr}.ph-shell{padding-bottom:96px}}
`;
