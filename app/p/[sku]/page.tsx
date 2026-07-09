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
  brandId?: string;
  imageLink?: string;
  productHub?: ProductHub;
};

const slugify = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const list = (value: unknown) => Array.isArray(value) ? value.filter(Boolean) : [];

export default function ProductInfoPage({ params }: { params: { sku: string } }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/load", { cache: "no-store" });
        const data = await res.json();
        const skuItems: SkuItem[] = Array.isArray(data?.skuItems) ? data.skuItems : [];
        const brands: any[] = Array.isArray(data?.skuBrands) ? data.skuBrands : [];
        const requested = decodeURIComponent(params.sku || "");
        const found = skuItems.find((item) =>
          slugify(item?.productHub?.slug || item?.sku || "") === requested ||
          slugify(item?.sku || "") === requested
        ) || null;
        if (!cancelled) {
          setProduct(found);
          setBrand(found ? brands.find((b) => b.id === found.brandId) || null : null);
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
  const links = [
    { label: "Shopee", href: hub.shopeeLink },
    { label: "Lazada", href: hub.lazadaLink },
    { label: "TikTok Shop", href: hub.tiktokLink },
    { label: "Manual", href: hub.manualLink },
    { label: "Video", href: hub.videoLink },
  ].filter((x) => x.href);

  if (loading) {
    return <main style={styles.center}>Loading product information…</main>;
  }

  if (!product) {
    return <main style={styles.center}>Product page not found.</main>;
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
            {product.collection && <span style={styles.collection}>{product.collection}</span>}
          </div>
          <h1 style={styles.title}>{product.productName || product.sku}</h1>
          <p style={styles.sku}>{product.sku}</p>
          {hub.intro && <p style={styles.intro}>{hub.intro}</p>}
          {links.length > 0 && (
            <div style={styles.buttonRow}>
              {links.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={styles.button}>{link.label}</a>
              ))}
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
  return (
    <div style={styles.infoCard}>
      <h2 style={styles.h2}>{title}</h2>
      <ul style={styles.ul}>{items.map((item, index) => <li key={index} style={styles.li}>{item}</li>)}</ul>
    </div>
  );
}

function TextCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={styles.infoCard}>
      <h2 style={styles.h2}>{title}</h2>
      <p style={styles.text}>{text}</p>
    </div>
  );
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
  sku: { margin: "0 0 18px", fontSize: 13, color: "#6B7280", fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" },
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
