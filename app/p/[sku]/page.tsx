"use client";

import React, { useEffect, useMemo, useState } from "react";

type ProductHub = {
  enabled?: boolean;
  slug?: string;
  heroImage?: string;
  intro?: string;
  features?: string[];
  specs?: string[];
  careUse?: string;
  warranty?: string;
  shopeeLink?: string;
  lazadaLink?: string;
  tiktokLink?: string;
  manualLink?: string;
  videoLink?: string;
};

type SkuItem = {
  id?: string;
  sku?: string;
  productName?: string;
  collection?: string;
  category?: string;
  brandId?: string;
  imageLink?: string;
  imageUrl?: string;
  srp?: string;
  tag?: string;
  extraFields?: Record<string, any>;
  productHub?: ProductHub;
};

const slugify = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalize = (value = "") => slugify(value).toLowerCase();
const list = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).map(String) : [];

function safeJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function readLocalSkuItems() {
  if (typeof window === "undefined") return [] as SkuItem[];

  const keys = [
    "emdc_sku_items_external_v1",
    "emdc_sku_items_v1",
    "emdc_sku_items_last_good_v1",
    "emdc_app_state_v1",
    "emdc_last_good_app_state_v1",
  ];

  for (const key of keys) {
    const parsed: any = safeJson(window.localStorage.getItem(key));
    if (Array.isArray(parsed) && parsed.length) return parsed;
    if (Array.isArray(parsed?.skuItems) && parsed.skuItems.length) return parsed.skuItems;
    if (Array.isArray(parsed?.appState?.skuItems) && parsed.appState.skuItems.length) return parsed.appState.skuItems;
  }

  return [] as SkuItem[];
}

function readLocalBrands() {
  if (typeof window === "undefined") return [] as any[];

  const keys = ["emdc_sku_brands_v1", "emdc_app_state_v1", "emdc_last_good_app_state_v1"];
  for (const key of keys) {
    const parsed: any = safeJson(window.localStorage.getItem(key));
    if (Array.isArray(parsed) && parsed.length) return parsed;
    if (Array.isArray(parsed?.skuBrands) && parsed.skuBrands.length) return parsed.skuBrands;
    if (Array.isArray(parsed?.appState?.skuBrands) && parsed.appState.skuBrands.length) return parsed.appState.skuBrands;
  }

  return [] as any[];
}

function findProduct(skuItems: SkuItem[], requested: string) {
  const target = normalize(decodeURIComponent(requested || ""));
  return skuItems.find((item) => {
    const sku = normalize(item?.sku || "");
    const hubSlug = normalize(item?.productHub?.slug || "");
    const id = normalize(item?.id || "");
    return sku === target || hubSlug === target || id === target;
  }) || null;
}

function getCategory(product?: SkuItem | null) {
  return String(product?.collection || product?.category || product?.extraFields?.category || product?.extraFields?.collection || "").trim();
}

export default function ProductInfoPage({ params }: { params: { sku: string } }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [related, setRelated] = useState<SkuItem[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [debugCount, setDebugCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let skuItems: SkuItem[] = [];
        let brands: any[] = [];

        try {
          const res = await fetch("/api/emdc-state?mode=current", { cache: "no-store" });
          const data = await res.json();
          const source = data?.data?.appState || data?.appState || {};
          skuItems = Array.isArray(source?.skuItems) ? source.skuItems : [];
          brands = Array.isArray(source?.skuBrands) ? source.skuBrands : [];
        } catch (error) {
          console.warn("[EMDC] Product page /api/emdc-state load failed.", error);
        }

        if (!skuItems.length || skuItems.length < 10) {
          try {
            const res = await fetch("/api/load", { cache: "no-store" });
            const data = await res.json();
            const source = data?.appState || data || {};
            const redisSkuItems = Array.isArray(source?.skuItems) ? source.skuItems : [];
            const redisBrands = Array.isArray(source?.skuBrands) ? source.skuBrands : [];
            if (redisSkuItems.length > skuItems.length) skuItems = redisSkuItems;
            if (!brands.length && redisBrands.length) brands = redisBrands;
          } catch (error) {
            console.warn("[EMDC] Product page /api/load fallback failed.", error);
          }
        }

        if (!skuItems.length) skuItems = readLocalSkuItems();
        if (!brands.length) brands = readLocalBrands();

        const found = findProduct(skuItems, params.sku);
        const category = getCategory(found);
        const relatedItems = found ? skuItems
          .filter((item) => item?.sku !== found.sku)
          .filter((item) => item?.brandId === found.brandId || getCategory(item) === category)
          .slice(0, 4) : [];

        if (!cancelled) {
          setProduct(found);
          setRelated(relatedItems);
          setBrand(found ? brands.find((b) => b.id === found.brandId) || null : null);
          setDebugCount(skuItems.length);
        }
      } catch (error) {
        console.error("[EMDC] Product page load failed:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [params.sku]);

  const hub = useMemo(() => product?.productHub || {}, [product]);
  const hero = hub.heroImage || product?.imageLink || product?.imageUrl || "";
  const features = list(hub.features);
  const specs = list(hub.specs);
  const category = getCategory(product);
  const links = [
    { label: "Shopee", href: hub.shopeeLink },
    { label: "Lazada", href: hub.lazadaLink },
    { label: "TikTok Shop", href: hub.tiktokLink },
    { label: "Manual / PDF", href: hub.manualLink },
    { label: "Video", href: hub.videoLink },
  ].filter((x) => x.href);

  if (loading) return <main className="emdc-product-center">Loading product information…<ResponsiveCss /></main>;

  if (!product) {
    return (
      <main className="emdc-product-center">
        <ResponsiveCss />
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Product page not found.</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Requested SKU: {decodeURIComponent(params.sku || "")}</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Loaded SKU count: {debugCount}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="emdc-product-page">
      <ResponsiveCss />
      <section className="emdc-product-shell">
        <div className="emdc-product-topbar">
          <div>
            <div className="emdc-product-kicker">Product Information</div>
            <div className="emdc-product-small-muted">Product details, care guide, and where to buy.</div>
          </div>
        </div>

        <section className="emdc-product-hero-card">
          <div className="emdc-product-hero-wrap">
            {hero ? <img src={hero} alt={product.productName || product.sku || "Product"} className="emdc-product-hero-img" /> : <div className="emdc-product-placeholder">No Image</div>}
          </div>

          <div className="emdc-product-content">
            <div className="emdc-product-brand-row">
              {brand?.name && <span className="emdc-product-brand-pill">{brand.name}</span>}
              {category && <span className="emdc-product-collection-pill">{category}</span>}
            </div>
            <h1 className="emdc-product-title">{product.productName || product.sku}</h1>
            <p className="emdc-product-sku">{product.sku}</p>
            {product.srp && <p className="emdc-product-price">SRP: ₱{product.srp}</p>}
            {hub.intro ? <p className="emdc-product-intro">{hub.intro}</p> : <p className="emdc-product-intro emdc-product-intro-muted">Product details can be added from EMDC SKU Storage &gt; Edit &gt; Product Hub / QR Page.</p>}

            {links.length > 0 && (
              <div className="emdc-product-button-row">
                {links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="emdc-product-button">{link.label}</a>)}
              </div>
            )}
          </div>
        </section>

        <section className="emdc-product-info-grid">
          {features.length > 0 && <InfoCard title="Features" items={features} />}
          {specs.length > 0 && <InfoCard title="Specifications" items={specs} />}
          {hub.careUse && <TextCard title="Care & Use" text={hub.careUse} />}
          {hub.warranty && <TextCard title="Warranty / Notes" text={hub.warranty} />}
        </section>

        {related.length > 0 && (
          <section className="emdc-product-related-card">
            <h2 className="emdc-product-h2">Related Products</h2>
            <div className="emdc-product-related-grid">
              {related.map((item) => {
                const itemHero = item.productHub?.heroImage || item.imageLink || item.imageUrl || "";
                const itemSlug = item.productHub?.slug || item.sku || item.id || "";
                return (
                  <a key={item.id || item.sku} href={`/p/${encodeURIComponent(itemSlug)}`} className="emdc-product-related-item">
                    <div className="emdc-product-related-thumb-wrap">{itemHero ? <img src={itemHero} alt={item.productName || item.sku || "Product"} className="emdc-product-related-thumb" /> : <span className="emdc-product-related-no-image">No Image</span>}</div>
                    <div className="emdc-product-related-name">{item.productName || item.sku}</div>
                    <div className="emdc-product-related-sku">{item.sku}</div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <div className="emdc-product-info-card"><h2 className="emdc-product-h2">{title}</h2><ul className="emdc-product-ul">{items.map((item, index) => <li key={index} className="emdc-product-li">{item}</li>)}</ul></div>;
}

function TextCard({ title, text }: { title: string; text: string }) {
  return <div className="emdc-product-info-card"><h2 className="emdc-product-h2">{title}</h2><p className="emdc-product-text">{text}</p></div>;
}

function ResponsiveCss() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      .emdc-product-page {
        min-height: 100vh;
        background: linear-gradient(180deg,#F8FAFC 0%,#EEF2F7 100%);
        color: #111827;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: clamp(14px, 2vw, 28px);
        overflow-x: hidden;
      }
      .emdc-product-center {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, system-ui, sans-serif;
        color: #374151;
        background: #F8F9FA;
        padding: 24px;
        text-align: center;
      }
      .emdc-product-shell {
        width: min(100%, 1180px);
        margin: 0 auto;
      }
      .emdc-product-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        margin-bottom: 14px;
        padding: 2px 2px 0;
      }
      .emdc-product-kicker {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .08em;
        color: #111827;
        text-transform: uppercase;
      }
      .emdc-product-small-muted {
        font-size: 12px;
        color: #6B7280;
        margin-top: 3px;
      }
      .emdc-product-hero-card {
        display: grid;
        grid-template-columns: minmax(260px, 430px) minmax(0, 1fr);
        gap: clamp(16px, 2vw, 22px);
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: clamp(18px, 2vw, 24px);
        padding: clamp(14px, 2vw, 20px);
        box-shadow: 0 18px 48px rgba(17,24,39,.08);
        align-items: stretch;
      }
      .emdc-product-hero-wrap {
        min-height: clamp(260px, 32vw, 380px);
        border-radius: 18px;
        background: #F3F4F6;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .emdc-product-hero-img {
        width: 100%;
        height: 100%;
        max-height: 440px;
        object-fit: contain;
        display: block;
      }
      .emdc-product-placeholder {
        color: #9CA3AF;
        font-weight: 800;
      }
      .emdc-product-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
      }
      .emdc-product-brand-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .emdc-product-brand-pill,
      .emdc-product-collection-pill {
        max-width: 100%;
        overflow-wrap: anywhere;
        font-size: 12px;
        border-radius: 999px;
        padding: 5px 10px;
      }
      .emdc-product-brand-pill {
        font-weight: 900;
        background: #111827;
        color: #FFFFFF;
      }
      .emdc-product-collection-pill {
        font-weight: 800;
        background: #F3F4F6;
        color: #374151;
      }
      .emdc-product-title {
        margin: 0 0 8px;
        font-size: clamp(26px, 4vw, 42px);
        line-height: 1.05;
        letter-spacing: -.045em;
        overflow-wrap: anywhere;
      }
      .emdc-product-sku {
        margin: 0 0 10px;
        font-size: 13px;
        color: #6B7280;
        font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
        overflow-wrap: anywhere;
      }
      .emdc-product-price {
        margin: 0 0 16px;
        font-size: 14px;
        color: #111827;
        font-weight: 900;
      }
      .emdc-product-intro {
        margin: 0 0 20px;
        font-size: 15px;
        line-height: 1.7;
        color: #374151;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .emdc-product-intro-muted {
        font-size: 14px;
        line-height: 1.65;
        color: #9CA3AF;
      }
      .emdc-product-button-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .emdc-product-button {
        text-decoration: none;
        background: #111827;
        color: #FFFFFF;
        border-radius: 11px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 900;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .emdc-product-info-grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
        gap: 14px;
      }
      .emdc-product-info-card,
      .emdc-product-related-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 18px;
        padding: clamp(16px, 2vw, 18px);
        box-shadow: 0 10px 28px rgba(17,24,39,.04);
        min-width: 0;
      }
      .emdc-product-related-card {
        margin-top: 16px;
      }
      .emdc-product-h2 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 950;
        letter-spacing: -.02em;
      }
      .emdc-product-ul {
        margin: 0;
        padding-left: 20px;
        color: #374151;
        line-height: 1.7;
      }
      .emdc-product-li {
        margin-bottom: 4px;
        overflow-wrap: anywhere;
      }
      .emdc-product-text {
        margin: 0;
        color: #374151;
        line-height: 1.7;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .emdc-product-related-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
        gap: 12px;
      }
      .emdc-product-related-item {
        text-decoration: none;
        color: #111827;
        border: 1px solid #E5E7EB;
        border-radius: 14px;
        padding: 10px;
        background: #FFFFFF;
        min-width: 0;
      }
      .emdc-product-related-thumb-wrap {
        height: 120px;
        border-radius: 12px;
        background: #F3F4F6;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .emdc-product-related-thumb {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .emdc-product-related-no-image {
        color: #9CA3AF;
        font-size: 12px;
        font-weight: 800;
      }
      .emdc-product-related-name {
        font-size: 13px;
        font-weight: 900;
        line-height: 1.35;
        margin-bottom: 4px;
        overflow-wrap: anywhere;
      }
      .emdc-product-related-sku {
        font-size: 11px;
        color: #6B7280;
        font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
        overflow-wrap: anywhere;
      }

      @media (max-width: 820px) {
        .emdc-product-page {
          padding: 12px;
        }
        .emdc-product-topbar {
          margin-bottom: 10px;
        }
        .emdc-product-hero-card {
          grid-template-columns: 1fr;
          gap: 14px;
          padding: 12px;
          border-radius: 18px;
        }
        .emdc-product-hero-wrap {
          min-height: 260px;
          max-height: 360px;
        }
        .emdc-product-content {
          justify-content: flex-start;
          padding: 2px 2px 4px;
        }
        .emdc-product-title {
          font-size: clamp(25px, 8vw, 34px);
        }
        .emdc-product-intro {
          font-size: 14px;
          line-height: 1.65;
        }
      }

      @media (max-width: 520px) {
        .emdc-product-page {
          padding: 10px;
        }
        .emdc-product-small-muted {
          font-size: 11px;
        }
        .emdc-product-hero-card,
        .emdc-product-info-card,
        .emdc-product-related-card {
          border-radius: 16px;
        }
        .emdc-product-hero-wrap {
          min-height: 220px;
          border-radius: 14px;
        }
        .emdc-product-brand-row {
          gap: 6px;
          margin-bottom: 10px;
        }
        .emdc-product-brand-pill,
        .emdc-product-collection-pill {
          font-size: 11px;
          padding: 5px 9px;
        }
        .emdc-product-title {
          letter-spacing: -.035em;
        }
        .emdc-product-button-row {
          flex-direction: column;
          gap: 8px;
        }
        .emdc-product-button {
          width: 100%;
          min-height: 44px;
        }
        .emdc-product-related-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .emdc-product-related-thumb-wrap {
          height: 105px;
        }
      }

      @media (max-width: 360px) {
        .emdc-product-related-grid {
          grid-template-columns: 1fr;
        }
        .emdc-product-hero-wrap {
          min-height: 200px;
        }
      }
    `}</style>
  );
}
