"use client";

import React, { useEffect, useMemo, useState } from "react";

type HubData = {
  enabled?: boolean;
  slug?: string;
  heroImage?: string;
  introduction?: string;
  features?: string;
  specifications?: string;
  care?: string;
  warranty?: string;
  gallery?: string;
  shopee?: string;
  lazada?: string;
  tiktok?: string;
  website?: string;
  manual?: string;
  video?: string;
  relatedSkus?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
};

const emptyHub: HubData = {
  enabled: true,
  slug: "",
  heroImage: "",
  introduction: "",
  features: "",
  specifications: "",
  care: "",
  warranty: "",
  gallery: "",
  shopee: "",
  lazada: "",
  tiktok: "",
  website: "",
  manual: "",
  video: "",
  relatedSkus: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 14,
  outline: "none",
  background: "#FFFFFF",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#6B7280",
  letterSpacing: ".06em",
  textTransform: "uppercase",
};

function TextField({ label, value, onChange, placeholder }: any) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      <input style={inputStyle} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 5 }: any) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      <textarea
        style={{ ...inputStyle, minHeight: rows * 24, resize: "vertical", lineHeight: 1.5 }}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
      />
    </label>
  );
}

function sectionTitle(title: string, desc?: string) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{title}</h2>
      {desc ? <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>{desc}</p> : null}
    </div>
  );
}

export default function ProductHubEditorPage({ params }: { params: { sku: string } }) {
  const decodedSku = useMemo(() => decodeURIComponent(params?.sku || ""), [params?.sku]);
  const [hub, setHub] = useState<HubData>(emptyHub);
  const [skuItem, setSkuItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [dirty, setDirty] = useState(false);

  const publicSku = hub.slug?.trim() || decodedSku;
  const publicUrl = `/p/${encodeURIComponent(publicSku)}`;

  const update = (key: keyof HubData, value: any) => {
    setHub((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatus("Loading Product Hub...");
      try {
        const [hubRes, stateRes] = await Promise.allSettled([
          fetch(`/api/product-hub?sku=${encodeURIComponent(decodedSku)}`, { cache: "no-store" }),
          fetch(`/api/load`, { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (hubRes.status === "fulfilled") {
          const json = await hubRes.value.json().catch(() => null);
          if (json?.ok && json?.data) setHub({ ...emptyHub, ...json.data });
          else setHub({ ...emptyHub, slug: decodedSku });
        }

        if (stateRes.status === "fulfilled") {
          const json = await stateRes.value.json().catch(() => null);
          const rows = Array.isArray(json?.skuItems) ? json.skuItems : Array.isArray(json?.data?.appState?.skuItems) ? json.data.appState.skuItems : [];
          const match = rows.find((row: any) => {
            const values = [row?.sku, row?.skuCode, row?.value, row?.id].map((v) => String(v || "").trim().toLowerCase());
            return values.includes(decodedSku.trim().toLowerCase());
          });
          setSkuItem(match || null);
        }

        setDirty(false);
        setStatus("Loaded");
      } catch (error: any) {
        if (!cancelled) setStatus(error?.message || "Unable to load Product Hub");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [decodedSku]);

  const save = async () => {
    setSaving(true);
    setStatus("Saving Product Hub...");
    try {
      const res = await fetch("/api/product-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: decodedSku, data: hub }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");
      setDirty(false);
      setStatus(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
      setStatus(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", color: "#111827", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280", fontWeight: 700 }}>EMDC Product Hub</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.1 }}>{skuItem?.productName || skuItem?.product || decodedSku}</h1>
            <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 14 }}>
              SKU: <strong style={{ color: "#111827" }}>{decodedSku}</strong>
              {skuItem?.brand || skuItem?.brandId ? <> · {skuItem.brand || skuItem.brandId}</> : null}
              {skuItem?.collection || skuItem?.category ? <> · {skuItem.collection || skuItem.category}</> : null}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <a href={publicUrl} target="_blank" style={{ textDecoration: "none", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", color: "#111827", fontWeight: 800, fontSize: 13 }}>
              View Page
            </a>
            <button
              onClick={save}
              disabled={saving || loading}
              style={{ background: "#111827", color: "#FFFFFF", border: 0, borderRadius: 10, padding: "11px 18px", fontWeight: 900, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: dirty ? "#B45309" : "#059669", fontWeight: 700 }}>
          {status}{dirty ? " · Unsaved changes" : ""}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18 }}>
            {sectionTitle("General", "This data is separate from SKU Storage.")}
            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                <input type="checkbox" checked={!!hub.enabled} onChange={(e) => update("enabled", e.target.checked)} />
                Product Hub Enabled
              </label>
              <TextField label="Hub Slug / URL SKU" value={hub.slug} onChange={(v: string) => update("slug", v)} placeholder={decodedSku} />
              <TextField label="Hero Image URL" value={hub.heroImage} onChange={(v: string) => update("heroImage", v)} placeholder={skuItem?.imageLink || "https://..."} />
              <TextArea label="Gallery Images" value={hub.gallery} onChange={(v: string) => update("gallery", v)} placeholder="One image URL per line" rows={5} />
            </div>
          </section>

          <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18 }}>
            {sectionTitle("Product Details")}
            <div style={{ display: "grid", gap: 14 }}>
              <TextArea label="Product Introduction" value={hub.introduction} onChange={(v: string) => update("introduction", v)} rows={6} />
              <TextArea label="Features" value={hub.features} onChange={(v: string) => update("features", v)} placeholder="One feature per line" rows={6} />
              <TextArea label="Specifications" value={hub.specifications} onChange={(v: string) => update("specifications", v)} placeholder="One specification per line" rows={6} />
              <TextArea label="Care & Use" value={hub.care} onChange={(v: string) => update("care", v)} rows={5} />
              <TextArea label="Warranty / Notes" value={hub.warranty} onChange={(v: string) => update("warranty", v)} rows={4} />
            </div>
          </section>

          <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18 }}>
            {sectionTitle("Shopping Links")}
            <div style={{ display: "grid", gap: 14 }}>
              <TextField label="Shopee Link" value={hub.shopee} onChange={(v: string) => update("shopee", v)} placeholder="https://..." />
              <TextField label="Lazada Link" value={hub.lazada} onChange={(v: string) => update("lazada", v)} placeholder="https://..." />
              <TextField label="TikTok Shop Link" value={hub.tiktok} onChange={(v: string) => update("tiktok", v)} placeholder="https://..." />
              <TextField label="Website Link" value={hub.website} onChange={(v: string) => update("website", v)} placeholder="https://..." />
              <TextField label="Manual / PDF Link" value={hub.manual} onChange={(v: string) => update("manual", v)} placeholder="https://..." />
              <TextField label="Video Link" value={hub.video} onChange={(v: string) => update("video", v)} placeholder="https://..." />
            </div>
          </section>

          <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18 }}>
            {sectionTitle("Related Products & SEO")}
            <div style={{ display: "grid", gap: 14 }}>
              <TextArea label="Related SKUs" value={hub.relatedSkus} onChange={(v: string) => update("relatedSkus", v)} placeholder="One SKU per line" rows={5} />
              <TextField label="Meta Title" value={hub.metaTitle} onChange={(v: string) => update("metaTitle", v)} />
              <TextArea label="Meta Description" value={hub.metaDescription} onChange={(v: string) => update("metaDescription", v)} rows={4} />
              <TextArea label="Keywords" value={hub.keywords} onChange={(v: string) => update("keywords", v)} placeholder="One keyword per line" rows={4} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
