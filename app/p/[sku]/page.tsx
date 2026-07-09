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

function getPublicUrl(product?: SkuItem | null) {
  if (typeof window === "undefined" || !product?.sku) return "";
  const slug = String(product.productHub?.slug || product.sku || "").trim();
  return `${window.location.origin}/p/${encodeURIComponent(slug)}`;
}

export default function ProductInfoPage({ params }: { params: { sku: string } }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [related, setRelated] = useState<SkuItem[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [debugCount, setDebugCount] = useState(0);
  const [copied, setCopied] = useState(false);

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
  const publicUrl = getPublicUrl(product);
  const qrUrl = publicUrl ? `/api/qr?url=${encodeURIComponent(publicUrl)}` : "";
  const links = [
    { label: "Shopee", href: hub.shopeeLink },
    { label: "Lazada", href: hub.lazadaLink },
    { label: "TikTok Shop", href: hub.tiktokLink },
    { label: "Manual / PDF", href: hub.manualLink },
    { label: "Video", href: hub.videoLink },
  ].filter((x) => x.href);

  const copyPageLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt("Copy Product Hub link", publicUrl);
    }
  };

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
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.kicker}>Product Information Hub</div>
            <div style={styles.smallMuted}>Scan, share, or save this page for product details.</div>
          </div>
          <button type="button" onClick={copyPageLink} style={styles.copyTop}>{copied ? "Copied" : "Copy Link"}</button>
        </div>

        <section style={styles.heroCard}>
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
            {hub.intro ? <p style={styles.intro}>{hub.intro}</p> : <p style={styles.introMuted}>Product details can be added from EMDC SKU Storage &gt; Edit &gt; Product Hub / QR Page.</p>}

            {links.length > 0 && (
              <div style={styles.buttonRow}>
                {links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={styles.button}>{link.label}</a>)}
              </div>
            )}
          </div>

          <aside style={styles.qrCard}>
            <div style={styles.qrTitle}>Product QR</div>
            {qrUrl ? <img src={qrUrl} alt="Product QR Code" style={styles.qrImage} /> : <div style={styles.qrPlaceholder}>No QR</div>}
            <div style={styles.qrSku}>{product.sku}</div>
            <div style={styles.qrActions}>
              {qrUrl && <a href={qrUrl} target="_blank" rel="noreferrer" style={styles.qrButton}>Open QR</a>}
              {qrUrl && <a href={qrUrl} download={`${product.sku || "product"}-qr.svg`} style={styles.qrButtonLight}>Download</a>}
            </div>
          </aside>
        </section>

        <section style={styles.grid}>
          {features.length > 0 && <InfoCard title="Features" items={features} />}
          {specs.length > 0 && <InfoCard title="Specifications" items={specs} />}
          {hub.careUse && <TextCard title="Care & Use" text={hub.careUse} />}
          {hub.warranty && <TextCard title="Warranty / Notes" text={hub.warranty} />}
        </section>

        {related.length > 0 && (
          <section style={styles.relatedCard}>
            <h2 style={styles.h2}>Related Products</h2>
            <div style={styles.relatedGrid}>
              {related.map((item) => {
                const itemHero = item.productHub?.heroImage || item.imageLink || item.imageUrl || "";
                const itemSlug = item.productHub?.slug || item.sku || item.id || "";
                return (
                  <a key={item.id || item.sku} href={`/p/${encodeURIComponent(itemSlug)}`} style={styles.relatedItem}>
                    <div style={styles.relatedThumbWrap}>{itemHero ? <img src={itemHero} alt={item.productName || item.sku || "Product"} style={styles.relatedThumb} /> : <span style={styles.relatedNoImage}>No Image</span>}</div>
                    <div style={styles.relatedName}>{item.productName || item.sku}</div>
                    <div style={styles.relatedSku}>{item.sku}</div>
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
  return <div style={styles.infoCard}><h2 style={styles.h2}>{title}</h2><ul style={styles.ul}>{items.map((item, index) => <li key={index} style={styles.li}>{item}</li>)}</ul></div>;
}

function TextCard({ title, text }: { title: string; text: string }) {
  return <div style={styles.infoCard}><h2 style={styles.h2}>{title}</h2><p style={styles.text}>{text}</p></div>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#F8FAFC 0%,#EEF2F7 100%)", color: "#111827", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", padding: 18 },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", color: "#374151", background: "#F8F9FA", padding: 24, textAlign: "center" },
  shell: { maxWidth: 1180, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 14, padding: "2px 2px 0" },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#111827", textTransform: "uppercase" },
  smallMuted: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  copyTop: { border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#111827", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  heroCard: { display: "grid", gridTemplateColumns: "minmax(260px, 430px) minmax(280px,1fr) 190px", gap: 22, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: 20, boxShadow: "0 18px 48px rgba(17,24,39,.08)", alignItems: "stretch" },
  heroWrap: { minHeight: 340, borderRadius: 18, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  hero: { width: "100%", height: "100%", maxHeight: 440, objectFit: "contain" },
  placeholder: { color: "#9CA3AF", fontWeight: 800 },
  content: { display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 },
  brandRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  brand: { fontSize: 12, fontWeight: 900, background: "#111827", color: "#FFFFFF", borderRadius: 999, padding: "5px 10px" },
  collection: { fontSize: 12, fontWeight: 800, background: "#F3F4F6", color: "#374151", borderRadius: 999, padding: "5px 10px" },
  title: { margin: "0 0 8px", fontSize: 36, lineHeight: 1.05, letterSpacing: "-.045em", wordBreak: "break-word" },
  sku: { margin: "0 0 10px", fontSize: 13, color: "#6B7280", fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" },
  price: { margin: "0 0 16px", fontSize: 14, color: "#111827", fontWeight: 900 },
  intro: { margin: "0 0 20px", fontSize: 15, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" },
  introMuted: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.65, color: "#9CA3AF", whiteSpace: "pre-wrap" },
  buttonRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  button: { textDecoration: "none", background: "#111827", color: "#FFFFFF", borderRadius: 11, padding: "10px 14px", fontSize: 13, fontWeight: 900 },
  qrCard: { border: "1px solid #E5E7EB", borderRadius: 18, background: "#FAFAFA", padding: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 260 },
  qrTitle: { fontSize: 13, fontWeight: 900, color: "#111827" },
  qrImage: { width: 145, height: 145, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: 8, objectFit: "contain" },
  qrPlaceholder: { width: 145, height: 145, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 12, fontWeight: 800 },
  qrSku: { fontSize: 11, color: "#6B7280", fontWeight: 800, textAlign: "center", wordBreak: "break-word" },
  qrActions: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" },
  qrButton: { textDecoration: "none", background: "#111827", color: "#FFFFFF", borderRadius: 9, padding: "8px 10px", fontSize: 11, fontWeight: 900 },
  qrButtonLight: { textDecoration: "none", background: "#FFFFFF", color: "#111827", border: "1px solid #D1D5DB", borderRadius: 9, padding: "8px 10px", fontSize: 11, fontWeight: 900 },
  grid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 },
  infoCard: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(17,24,39,.04)" },
  h2: { margin: "0 0 12px", fontSize: 16, fontWeight: 950, letterSpacing: "-.02em" },
  ul: { margin: 0, paddingLeft: 20, color: "#374151", lineHeight: 1.7 },
  li: { marginBottom: 4 },
  text: { margin: 0, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" },
  relatedCard: { marginTop: 16, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(17,24,39,.04)" },
  relatedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  relatedItem: { textDecoration: "none", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 14, padding: 10, background: "#FFFFFF" },
  relatedThumbWrap: { height: 120, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 10 },
  relatedThumb: { width: "100%", height: "100%", objectFit: "contain" },
  relatedNoImage: { color: "#9CA3AF", fontSize: 12, fontWeight: 800 },
  relatedName: { fontSize: 13, fontWeight: 900, lineHeight: 1.35, marginBottom: 4 },
  relatedSku: { fontSize: 11, color: "#6B7280", fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" },
};
