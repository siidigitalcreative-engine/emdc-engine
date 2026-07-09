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
  srp?: string;
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

export default function ProductInfoPage({ params }: { params: { sku: string } }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [debugCount, setDebugCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let skuItems: SkuItem[] = [];
        let brands: any[] = [];

        // 1. Try the same cloud state endpoint used by the live EMDC backup/sync system.
        // This endpoint hydrates the full SKU Storage from Vercel Blob, so it can load all 3,000+ SKUs.
        try {
          const res = await fetch("/api/emdc-state?mode=current", { cache: "no-store" });
          const data = await res.json();
          const source = data?.data?.appState || data?.appState || {};
          skuItems = Array.isArray(source?.skuItems) ? source.skuItems : [];
          brands = Array.isArray(source?.skuBrands) ? source.skuBrands : [];
        } catch (error) {
          console.warn("[EMDC] Product page /api/emdc-state load failed.", error);
        }

        // 2. Fallback to the older Redis load endpoint.
        // This may only contain checklist SKUs, so it is not the preferred source.
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

        // 3. Fallback to local protected SKU cache used by EMDC.
        if (!skuItems.length) skuItems = readLocalSkuItems();
        if (!brands.length) brands = readLocalBrands();

        const found = findProduct(skuItems, params.sku);

        if (!cancelled) {
          setProduct(found);
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
  const hero = hub.heroImage || product?.imageLink || "";
  const features = list(hub.features);
  const specs = list(hub.specs);
  const category = product?.collection || product?.category || "";
  const links = [
    { label: "Shopee", href: hub.shopeeLink },
    { label: "Lazada", href: hub.lazadaLink },
    { label: "TikTok Shop", href: hub.tiktokLink },
    { label: "Manual", href: hub.manualLink },
    { label: "Video", href: hub.videoLink },
  ].filter((x) => x.href);

  if (loading) return <main style={styles.center}>Loading product information…</main>;

  if (!product) {
    return (
      <main style={styles.center}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Product page not found.</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Requested SKU: {decodeURIComponent(params.sku || "")}</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Loaded SKU count: {debugCount}</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.heroWrap}>
          {hero ? <img src={hero} alt={product.productName || product.sku || "Product"} style={styles.hero} /> : <div style={styles.placeholder}>No Image</div>}
        </div>
        <div style={styles.content}>
          <div style={styles.brandRow}>
            {brand?.name && <span style={styles.brand}>{brand.name}</span>}
            {category && <span style={styles.collection}>{category}</span>}
          </div>
          <h1 style={styles.title}>{product.productName || product.sku}</h1>
          <p style={styles.sku}>{product.sku}</p>
          {product.srp && <p style={styles.price}>SRP: ₱{product.srp}</p>}
          {hub.intro && <p style={styles.intro}>{hub.intro}</p>}
          {links.length > 0 && (
            <div style={styles.buttonRow}>
              {links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={styles.button}>{link.label}</a>)}
            </div>
          )}
        </div>
      </section>

      <section style={styles.grid}>
        {features.length > 0 && <InfoCard title="Features" items={features} />}
        {specs.length > 0 && <InfoCard title="Specifications" items={specs} />}
        {hub.careUse && <TextCard title="Care & Use" text={hub.careUse} />}
        {hub.warranty && <TextCard title="Warranty" text={hub.warranty} />}
      </section>
    </main>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <div style={styles.infoCard}><h2 style={styles.h2}>{title}</h2><ul style={styles.ul}>{items.map((item, index) => <li key={index} style={styles.li}>{item}</li>)}</ul></div>;
}

function TextCard({ title, text }: { title: string; text: string }) {
  return <div style={styles.infoCard}><h2 style={styles.h2}>{title}</h2><p style={styles.text}>{text}</p></div>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#F8F9FA", color: "#111827", fontFamily: "Inter, system-ui, sans-serif", padding: "24px" },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", color: "#374151", background: "#F8F9FA", padding: 24, textAlign: "center" },
  card: { maxWidth: 1100, margin: "0 auto 18px", display: "grid", gridTemplateColumns: "minmax(280px, 420px) minmax(0, 1fr)", gap: 24, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 20, padding: 20, boxShadow: "0 10px 30px rgba(17,24,39,.06)" },
  heroWrap: { minHeight: 320, borderRadius: 16, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hero: { width: "100%", height: "100%", maxHeight: 420, objectFit: "contain" },
  placeholder: { color: "#9CA3AF", fontWeight: 700 },
  content: { display: "flex", flexDirection: "column", justifyContent: "center" },
  brandRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  brand: { fontSize: 12, fontWeight: 800, background: "#111827", color: "#FFFFFF", borderRadius: 999, padding: "5px 10px" },
  collection: { fontSize: 12, fontWeight: 700, background: "#F3F4F6", color: "#374151", borderRadius: 999, padding: "5px 10px" },
  title: { margin: "0 0 8px", fontSize: 36, lineHeight: 1.08, letterSpacing: "-.04em" },
  sku: { margin: "0 0 10px", fontSize: 13, color: "#6B7280", fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" },
  price: { margin: "0 0 18px", fontSize: 14, color: "#111827", fontWeight: 800 },
  intro: { margin: "0 0 20px", fontSize: 16, lineHeight: 1.7, color: "#374151" },
  buttonRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  button: { textDecoration: "none", background: "#111827", color: "#FFFFFF", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 800 },
  grid: { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
  infoCard: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: 18 },
  h2: { margin: "0 0 12px", fontSize: 16, fontWeight: 900 },
  ul: { margin: 0, paddingLeft: 20, color: "#374151", lineHeight: 1.7 },
  li: { marginBottom: 4 },
  text: { margin: 0, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" },
};
