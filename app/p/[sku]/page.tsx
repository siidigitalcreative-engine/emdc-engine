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
  relatedSkus?: string[];
};

type SeparateProductHub = {
  enabled?: boolean;
  slug?: string;
  heroImage?: string;
  gallery?: string;
  introduction?: string;
  features?: string;
  specifications?: string;
  care?: string;
  warranty?: string;
  shopee?: string;
  lazada?: string;
  tiktok?: string;
  website?: string;
  manual?: string;
  video?: string;
  relatedSkus?: string | string[];
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  updatedAt?: string;
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
const PUBLIC_STATE_CACHE_KEY = "emdc_public_product_state_cache_v1";
const PUBLIC_STATE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const RELATED_PRODUCT_LIMIT = 4;
const list = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).map(String) : [];
const lines = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item || "").split(/[\r\n,;]+/))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return String(value || "")
    .split(/[\r\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};
const compactNormalize = (value = "") => String(value || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
};

function safeJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function readCachedPublicState() {
  if (typeof window === "undefined") return null;
  try {
    const parsed: any = safeJson(window.sessionStorage.getItem(PUBLIC_STATE_CACHE_KEY));
    if (!parsed?.savedAt) return null;
    if (Date.now() - Number(parsed.savedAt) > PUBLIC_STATE_CACHE_TTL_MS) return null;
    const skuItems = Array.isArray(parsed.skuItems) ? parsed.skuItems : [];
    const skuBrands = Array.isArray(parsed.skuBrands) ? parsed.skuBrands : [];
    if (!skuItems.length) return null;
    return { skuItems, skuBrands };
  } catch {
    return null;
  }
}

function writeCachedPublicState(skuItems: SkuItem[], skuBrands: any[]) {
  if (typeof window === "undefined" || !skuItems.length) return;
  try {
    window.sessionStorage.setItem(PUBLIC_STATE_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      skuItems,
      skuBrands,
    }));
  } catch {
    // Cache is optional. Do nothing if the browser blocks storage.
  }
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

function getSkuCandidateValues(item: any) {
  const extraValues = item?.extraFields && typeof item.extraFields === "object"
    ? Object.values(item.extraFields)
    : [];
  return [
    item?.sku,
    item?.skuCode,
    item?.value,
    item?.id,
    item?.productCode,
    item?.code,
    item?.productHub?.slug,
    item?.productHub?.sku,
    ...extraValues,
  ];
}

function findSkuByCode(skuItems: SkuItem[], code: string) {
  const target = normalize(code || "");
  const compactTarget = compactNormalize(code || "");
  if (!target && !compactTarget) return null;

  const exact = skuItems.find((item: any) =>
    getSkuCandidateValues(item).some((value) => normalize(String(value || "")) === target)
  );
  if (exact) return exact;

  return skuItems.find((item: any) =>
    getSkuCandidateValues(item).some((value) => compactNormalize(String(value || "")) === compactTarget)
  ) || null;
}

function makeMissingRelatedProduct(code: string): SkuItem & { __missingRelated?: boolean } {
  return {
    id: `missing-${code}`,
    sku: code,
    productName: "SKU not found in SKU Storage",
    __missingRelated: true,
  } as any;
}

function uniqueProducts(items: SkuItem[]) {
  const seen = new Set<string>();
  const output: SkuItem[] = [];
  for (const item of items) {
    const key = normalize(item?.sku || item?.id || item?.productName || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function getCategory(product?: SkuItem | null) {
  return String(product?.collection || product?.category || product?.extraFields?.category || product?.extraFields?.collection || "").trim();
}

function getSearchText(item: any) {
  const extra = item?.extraFields && typeof item.extraFields === "object"
    ? Object.values(item.extraFields).join(" ")
    : "";
  return [
    item?.sku,
    item?.id,
    item?.productName,
    item?.product,
    item?.name,
    item?.collection,
    item?.category,
    item?.tag,
    item?.brand,
    item?.brandId,
    item?.brandName,
    extra,
  ].join(" ").toLowerCase();
}

function countKeywordHits(text: string, keywords: string[]) {
  return keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
}

function getRelatedProfile(product: any) {
  const text = getSearchText(product);

  // Condiment / sauce / oil bottles should relate to cooking and kitchen-prep items,
  // not drinking glassware such as rock glasses, whiskey sets, wine items, or ice buckets.
  if (/condiment|sauce|oil|vinegar|dispenser|seasoning|spice|salt|pepper/.test(text)) {
    return {
      positive: [
        "condiment", "sauce", "oil", "vinegar", "dispenser", "seasoning", "spice", "salt", "pepper",
        "kitchen", "cooking", "cookware", "utensil", "tool", "acacia", "wood", "butter", "cheese",
        "tong", "turner", "spoon", "ladle", "grater", "chopper", "board", "cutting", "lazy susan",
        "baking", "tray", "dish", "pot", "pan", "casserole", "food", "serve", "serving"
      ],
      negative: [
        "rock glass", "whiskey", "wine", "champagne", "goblet", "shot glass", "drinking", "tumbler",
        "ice bucket", "decanter", "beer", "cocktail", "highball", "glass set", "double wall"
      ],
    };
  }

  if (/lunch|bento|food jar|food container|meal|insulated/.test(text)) {
    return {
      positive: ["lunch", "bento", "food", "container", "jar", "bag", "tumbler", "cutlery", "utensil", "meal", "insulated"],
      negative: ["whiskey", "wine", "rock glass", "ice bucket", "decanter"],
    };
  }

  if (/dinnerware|plate|bowl|serveware|serving|cutlery/.test(text)) {
    return {
      positive: ["dinnerware", "plate", "bowl", "serve", "serving", "cutlery", "glassware", "placemat", "table", "dish"],
      negative: [],
    };
  }

  if (/clean|mop|brush|sponge|trash|bin|hose|reel/.test(text)) {
    return {
      positive: ["clean", "mop", "brush", "sponge", "trash", "bin", "hose", "reel", "spray", "scrub"],
      negative: ["lunch", "dinnerware", "whiskey", "wine"],
    };
  }

  return { positive: [], negative: [] };
}

export default function ProductInfoPage({ params }: { params: { sku: string } }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<SkuItem | null>(null);
  const [related, setRelated] = useState<SkuItem[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [productHubData, setProductHubData] = useState<SeparateProductHub | null>(null);
  const [debugCount, setDebugCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        try { window.sessionStorage.removeItem(PUBLIC_STATE_CACHE_KEY); } catch {}
        let skuItems: SkuItem[] = [];
        let brands: any[] = [];

        // IMPORTANT: Do not use the SKU table render limit or session cache here.
        // The public product page must search the full cloud catalog, otherwise
        // SKUs outside the first visible batch, especially Slique, can show as not found.
        const candidates: { skuItems: SkuItem[]; brands: any[]; source: string }[] = [];

        try {
          const res = await fetch(`/api/emdc-state?mode=current&t=${Date.now()}`, { cache: "no-store" });
          const data = await res.json();
          const source = data?.data?.appState || data?.appState || {};
          candidates.push({
            skuItems: Array.isArray(source?.skuItems) ? source.skuItems : [],
            brands: Array.isArray(source?.skuBrands) ? source.skuBrands : [],
            source: "emdc-state",
          });
        } catch (error) {
          console.warn("[EMDC] Product page /api/emdc-state load failed.", error);
        }

        try {
          const res = await fetch(`/api/load?t=${Date.now()}`, { cache: "no-store" });
          const data = await res.json();
          const source = data?.appState || data || {};
          candidates.push({
            skuItems: Array.isArray(source?.skuItems) ? source.skuItems : [],
            brands: Array.isArray(source?.skuBrands) ? source.skuBrands : [],
            source: "load",
          });
        } catch (error) {
          console.warn("[EMDC] Product page /api/load fallback failed.", error);
        }

        const localSkus = readLocalSkuItems();
        const localBrands = readLocalBrands();
        if (localSkus.length) candidates.push({ skuItems: localSkus, brands: localBrands, source: "local" });

        const best = candidates.sort((a, b) => (b.skuItems?.length || 0) - (a.skuItems?.length || 0))[0];
        skuItems = best?.skuItems || [];
        brands = best?.brands || [];

        const found = findProduct(skuItems, params.sku);
        let separateHub: SeparateProductHub | null = null;

        if (found?.sku) {
          try {
            const hubRes = await fetch(`/api/product-hub?sku=${encodeURIComponent(found.sku)}&t=${Date.now()}`, { cache: "no-store" });
            const hubJson = await hubRes.json().catch(() => null);
            if (hubJson?.data && typeof hubJson.data === "object") separateHub = hubJson.data;
          } catch (error) {
            console.warn("[EMDC] Product Hub data load failed.", error);
          }
        }

        const category = getCategory(found);
        const selectedRelatedSkus = Array.from(new Set([
          ...lines(separateHub?.relatedSkus),
          ...(Array.isArray(found?.productHub?.relatedSkus) ? found.productHub.relatedSkus : []),
        ].map((code) => String(code || "").trim()).filter(Boolean)));

        const currentSkuKey = normalize(found?.sku || found?.id || "");
        const currentCategory = normalize(category);
        const currentCollection = normalize(String(found?.collection || found?.extraFields?.collection || ""));
        const currentBrand = normalize(String(found?.brandId || found?.brand || found?.brandName || ""));

        const getItemBrand = (item: any) => normalize(String(item?.brandId || item?.brand || item?.brandName || ""));
        const isSameBrand = (item: any) => {
          if (!currentBrand) return true;
          return getItemBrand(item) === currentBrand;
        };

        const selectedRelatedItems = selectedRelatedSkus
          .map((code) => findSkuByCode(skuItems, code) || makeMissingRelatedProduct(code))
          .filter((item: any) => {
            const itemSkuKey = normalize(item?.sku || item?.id || "");
            if (itemSkuKey && itemSkuKey === currentSkuKey) return false;
            if (item?.__missingRelated) return true;
            return isSameBrand(item);
          }) as SkuItem[];

        const selectedKeys = new Set(
          selectedRelatedItems
            .flatMap((item: any) => [item?.sku, item?.id, item?.productName])
            .map((value) => normalize(String(value || "")))
            .filter(Boolean)
        );

        const profile = getRelatedProfile(found);

        const automaticRelatedItems = found ? skuItems
          .filter((item: any) => {
            const itemSkuKey = normalize(item?.sku || item?.id || "");
            if (!itemSkuKey || itemSkuKey === currentSkuKey || selectedKeys.has(itemSkuKey)) return false;

            // Auto-fill must stay inside the same brand only.
            // Example: Crysalis pages can auto-fill Crysalis products only; Slique pages can auto-fill Slique products only.
            if (!isSameBrand(item)) return false;

            return true;
          })
          .sort((a: any, b: any) => {
            const score = (item: any) => {
              const text = getSearchText(item);
              const itemCategory = normalize(getCategory(item));
              const itemCollection = normalize(String(item?.collection || item?.extraFields?.collection || ""));
              let value = 10; // same-brand fallback

              const positiveHits = countKeywordHits(text, profile.positive);
              const negativeHits = countKeywordHits(text, profile.negative);

              // Functional relevance is the main priority.
              value += positiveHits * 25;

              // Keep same collection/category useful, but not mandatory.
              if (currentCollection && itemCollection === currentCollection) value += 12;
              if (currentCategory && itemCategory === currentCategory) value += 10;

              // Strongly push down unrelated display/drinking products on cooking-related pages.
              value -= negativeHits * 60;

              // Prefer rows with a real image and name.
              if (item?.imageLink || item?.imageUrl) value += 3;
              if (item?.productName || item?.product || item?.name) value += 2;

              return value;
            };
            return score(b) - score(a);
          }) : [];

        const relatedItems = uniqueProducts([
          ...selectedRelatedItems,
          ...automaticRelatedItems,
        ]).slice(0, RELATED_PRODUCT_LIMIT);

        if (!cancelled) {
          setProduct(found);
          setProductHubData(separateHub);
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

  const legacyHub = useMemo(() => product?.productHub || {}, [product]);
  const hero = firstText(productHubData?.heroImage, legacyHub.heroImage, product?.imageLink, product?.imageUrl);
  const gallery = lines(productHubData?.gallery).filter((url) => url !== hero).slice(0, 6);
  const introduction = firstText(productHubData?.introduction, legacyHub.intro);
  const features = lines(productHubData?.features || legacyHub.features);
  const specs = lines(productHubData?.specifications || legacyHub.specs);
  const careText = firstText(productHubData?.care, legacyHub.careUse);
  const warrantyText = firstText(productHubData?.warranty, legacyHub.warranty);
  const category = getCategory(product);
  const links = [
    { label: "Shopee", href: productHubData?.shopee || legacyHub.shopeeLink },
    { label: "Lazada", href: productHubData?.lazada || legacyHub.lazadaLink },
    { label: "TikTok Shop", href: productHubData?.tiktok || legacyHub.tiktokLink },
    { label: "Website", href: productHubData?.website },
    { label: "Manual / PDF", href: productHubData?.manual || legacyHub.manualLink },
    { label: "Video", href: productHubData?.video || legacyHub.videoLink },
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
            {hero ? <img src={hero} alt={product.productName || product.sku || "Product"} className="emdc-product-hero-img" loading="eager" decoding="async" /> : <div className="emdc-product-placeholder">No Image</div>}
          </div>

          <div className="emdc-product-content">
            <div className="emdc-product-brand-row">
              {brand?.name && <span className="emdc-product-brand-pill">{brand.name}</span>}
              {category && <span className="emdc-product-collection-pill">{category}</span>}
            </div>
            <h1 className="emdc-product-title">{product.productName || product.sku}</h1>
            <p className="emdc-product-sku">{product.sku}</p>
            {product.srp && <p className="emdc-product-price">SRP: ₱{product.srp}</p>}
            {introduction ? <p className="emdc-product-intro">{introduction}</p> : <p className="emdc-product-intro emdc-product-intro-muted">Product details can be added from EMDC Product Hub.</p>}

            {links.length > 0 && (
              <div className="emdc-product-button-row">
                {links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="emdc-product-button">{link.label}</a>)}
              </div>
            )}
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="emdc-product-gallery-card">
            <h2 className="emdc-product-h2">Gallery</h2>
            <div className="emdc-product-gallery-grid">
              {gallery.map((url, index) => (
                <div key={`${url}-${index}`} className="emdc-product-gallery-thumb-wrap">
                  <img src={url} alt={`${product.productName || product.sku || "Product"} gallery ${index + 1}`} className="emdc-product-gallery-thumb" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="emdc-product-info-grid">
          {features.length > 0 && <InfoCard title="Features" items={features} />}
          {specs.length > 0 && <InfoCard title="Specifications" items={specs} />}
          {careText && <TextCard title="Care & Use" text={careText} />}
          {warrantyText && <TextCard title="Warranty / Notes" text={warrantyText} />}
        </section>

        {related.length > 0 && (
          <section className="emdc-product-related-card">
            <h2 className="emdc-product-h2">Related Products</h2>
            <div className="emdc-product-related-grid">
              {related.map((item: any) => {
                const itemHero = item.productHub?.heroImage || item.imageLink || item.imageUrl || "";
                const itemSlug = item.productHub?.slug || item.sku || item.id || "";
                const card = (
                  <>
                    <div className="emdc-product-related-thumb-wrap">{itemHero ? <img src={itemHero} alt={item.productName || item.sku || "Product"} className="emdc-product-related-thumb" loading="lazy" decoding="async" /> : <span className="emdc-product-related-no-image">{item.__missingRelated ? "Check SKU" : "No Image"}</span>}</div>
                    <div className="emdc-product-related-name">{item.__missingRelated ? "SKU not found" : (item.productName || item.sku)}</div>
                    <div className="emdc-product-related-sku">{item.sku}</div>
                  </>
                );
                return item.__missingRelated ? (
                  <div key={item.id || item.sku} className="emdc-product-related-item emdc-product-related-missing">{card}</div>
                ) : (
                  <a key={item.id || item.sku} href={`/p/${encodeURIComponent(itemSlug)}`} className="emdc-product-related-item">{card}</a>
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
      .emdc-product-gallery-card,
      .emdc-product-related-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 18px;
        padding: clamp(16px, 2vw, 18px);
        box-shadow: 0 10px 28px rgba(17,24,39,.04);
        min-width: 0;
      }
      .emdc-product-gallery-card,
      .emdc-product-related-card {
        margin-top: 16px;
      }
      .emdc-product-gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
        gap: 12px;
      }
      .emdc-product-gallery-thumb-wrap {
        height: 150px;
        border-radius: 14px;
        background: #F3F4F6;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .emdc-product-gallery-thumb {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
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
      .emdc-product-related-missing {
        border-style: dashed;
        background: #FFFBEB;
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
        .emdc-product-gallery-card,
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
