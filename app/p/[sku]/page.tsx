"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  skuCode?: string;
  productName?: string;
  product?: string;
  collection?: string;
  category?: string;
  brandId?: string;
  brand?: string;
  brandName?: string;
  imageLink?: string;
  imageUrl?: string;
  srp?: string | number;
  tag?: string;
  extraFields?: Record<string, any>;
  productHub?: ProductHub;
};

const lines = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        String(item || "").split(/[\r\n,;]+/)
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[\r\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }

  return "";
};

const getGoogleDriveFileId = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text) return "";

  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?id=([^&#]+)/i,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/i,
    /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&#]+)/i,
    /[?&]id=([^&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return "";
};

const toPreviewImageUrl = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text) return "";

  if (text.startsWith("data:image/")) {
    return text;
  }

  const driveId = getGoogleDriveFileId(text);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveId
    )}&sz=w1600`;
  }

  return /^https?:\/\//i.test(text) ? text : "";
};

const getFirstImageUrl = (
  item: any,
  hub?: any
) => {
  const directValues = [
    hub?.heroImage,
    hub?.image,
    hub?.imageLink,
    item?.imageLink,
    item?.imageUrl,
    item?.imageURL,
    item?.mainImage,
    item?.photo,
    item?.thumbnail,
    item?.coverImage,
    item?.extraFields?.["Image Link"],
    item?.extraFields?.["Image URL"],
    item?.extraFields?.["Image"],
    item?.extraFields?.imageLink,
    item?.extraFields?.imageUrl,
    item?.extraFields?.image,
  ];

  const arrayValues = [
    hub?.galleryImages,
    hub?.gallery,
    item?.imageLinks,
    item?.links,
    item?.images,
    item?.gallery,
    item?.extraFields?.imageLinks,
    item?.extraFields?.links,
    item?.extraFields?.images,
  ];

  for (const value of directValues) {
    const text = String(value || "").trim();

    if (
      /^https?:\/\//i.test(text) ||
      text.startsWith("data:image/")
    ) {
      return toPreviewImageUrl(text);
    }
  }

  for (const value of arrayValues) {
    const values = Array.isArray(value)
      ? value
      : String(value || "").split(
          /[\r\n,;]+/
        );

    for (const entry of values) {
      const text =
        String(entry || "").trim();

      if (
        /^https?:\/\//i.test(text) ||
        text.startsWith("data:image/")
      ) {
        return toPreviewImageUrl(text);
      }
    }
  }

  return "";
};

const getCategory = (
  product?: SkuItem | null
) =>
  String(
    product?.collection ||
      product?.category ||
      product?.extraFields?.category ||
      product?.extraFields?.collection ||
      ""
  ).trim();

const getProductName = (item: any) =>
  String(
    item?.productName ||
      item?.product ||
      item?.name ||
      item?.sku ||
      "Product"
  );

const formatPrice = (
  value: unknown
) => {
  const numberValue = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim()
  );

  if (!Number.isFinite(numberValue)) {
    return String(value || "");
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(numberValue);
};

export default function ProductInfoPage({
  params,
}: {
  params: { sku: string };
}) {
  const [loading, setLoading] =
    useState(true);

  const [product, setProduct] =
    useState<SkuItem | null>(null);

  const [related, setRelated] =
    useState<SkuItem[]>([]);

  const [brand, setBrand] =
    useState<any>(null);

  const [
    productHubData,
    setProductHubData,
  ] =
    useState<SeparateProductHub | null>(
      null
    );

  const [debugCount, setDebugCount] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const controller =
      new AbortController();

    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/product-hub?sku=${encodeURIComponent(
            params.sku
          )}&public=1`,
          {
            method: "GET",
            cache: "force-cache",
            signal: controller.signal,
          }
        );

        const payload =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !payload?.ok ||
          !payload?.found
        ) {
          if (!cancelled) {
            setProduct(null);
            setRelated([]);
            setBrand(null);
            setProductHubData(null);
            setDebugCount(
              Number(
                payload?.skuCount || 0
              )
            );
            setErrorMessage(
              String(
                payload?.error ||
                  "Product page not found."
              )
            );
          }

          return;
        }

        if (!cancelled) {
          setProduct(
            payload.product || null
          );

          setRelated(
            Array.isArray(
              payload.related
            )
              ? payload.related
              : []
          );

          setBrand(
            payload.brand || null
          );

          setProductHubData(
            payload.productHubData ||
              null
          );

          setDebugCount(
            Number(
              payload.skuCount || 0
            )
          );
        }
      } catch (error: any) {
        if (
          error?.name !== "AbortError"
        ) {
          console.error(
            "[EMDC] Public product page load failed:",
            error
          );

          if (!cancelled) {
            setErrorMessage(
              "Unable to load product information."
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [params.sku]);

  const legacyHub = useMemo(
    () => product?.productHub || {},
    [product]
  );

  const hero = getFirstImageUrl(
    product,
    productHubData || legacyHub
  );

  const gallery = Array.from(
    new Set(
      lines(
        productHubData?.gallery ||
          (productHubData as any)?.galleryImages
      )
        .map(toPreviewImageUrl)
        .filter(Boolean)
        .filter((url) => url !== hero)
    )
  ).slice(0, 12);

  const introduction = firstText(
    productHubData?.introduction,
    legacyHub.intro
  );

  const features = lines(
    productHubData?.features ||
      legacyHub.features
  );

  const specs = lines(
    productHubData?.specifications ||
      legacyHub.specs
  );

  const careText = firstText(
    productHubData?.care,
    legacyHub.careUse
  );

  const warrantyText = firstText(
    productHubData?.warranty,
    legacyHub.warranty
  );

  const category =
    getCategory(product);

  const links = [
    {
      label: "Shopee",
      href:
        productHubData?.shopee ||
        legacyHub.shopeeLink,
    },
    {
      label: "Lazada",
      href:
        productHubData?.lazada ||
        legacyHub.lazadaLink,
    },
    {
      label: "TikTok Shop",
      href:
        productHubData?.tiktok ||
        legacyHub.tiktokLink,
    },
    {
      label: "Website",
      href:
        productHubData?.website,
    },
    {
      label: "Manual / PDF",
      href:
        productHubData?.manual ||
        legacyHub.manualLink,
    },
    {
      label: "Video",
      href:
        productHubData?.video ||
        legacyHub.videoLink,
    },
  ].filter((item) => item.href);

  if (loading) {
    return (
      <main className="emdc-product-center">
        <ResponsiveCss />
        <div className="emdc-loading-card">
          <div className="emdc-spinner" />
          <div>
            Loading product information…
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="emdc-product-center">
        <ResponsiveCss />

        <div className="emdc-error-card">
          <div className="emdc-error-title">
            {errorMessage ||
              "Product page not found."}
          </div>

          <div className="emdc-product-small-muted">
            Requested SKU:{" "}
            {decodeURIComponent(
              params.sku || ""
            )}
          </div>

          <div className="emdc-product-small-muted">
            Loaded SKU count:{" "}
            {debugCount}
          </div>
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
            <div className="emdc-product-kicker">
              Product Information
            </div>

            <div className="emdc-product-small-muted">
              Product details, care
              guide, and where to buy.
            </div>
          </div>
        </div>

        <section className="emdc-product-hero-card">
          <div className="emdc-product-hero-wrap">
            {hero ? (
              <img
                src={hero}
                alt={getProductName(
                  product
                )}
                className="emdc-product-hero-img"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="emdc-product-placeholder">
                No Image
              </div>
            )}
          </div>

          <div className="emdc-product-content">
            <div className="emdc-product-brand-row">
              {!!brand?.name && (
                <span className="emdc-product-brand-pill">
                  {brand.name}
                </span>
              )}

              {!!category && (
                <span className="emdc-product-collection-pill">
                  {category}
                </span>
              )}
            </div>

            <h1 className="emdc-product-title">
              {getProductName(product)}
            </h1>

            <p className="emdc-product-sku">
              {product.sku ||
                product.skuCode}
            </p>

            {!!String(
              product.srp || ""
            ).trim() && (
              <p className="emdc-product-price">
                SRP: ₱
                {formatPrice(
                  product.srp
                )}
              </p>
            )}

            {introduction ? (
              <p className="emdc-product-intro">
                {introduction}
              </p>
            ) : (
              <p className="emdc-product-intro emdc-product-intro-muted">
                Product details can be
                added from EMDC Product
                Hub.
              </p>
            )}

            {!!links.length && (
              <div className="emdc-product-button-row">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="emdc-product-button"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {!!gallery.length && (
          <section className="emdc-product-gallery-card">
            <h2 className="emdc-product-h2">
              Gallery
            </h2>

            <div className="emdc-product-gallery-grid">
              {gallery.map(
                (url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="emdc-product-gallery-thumb-wrap"
                  >
                    <img
                      src={url}
                      alt={`${getProductName(
                        product
                      )} gallery ${
                        index + 1
                      }`}
                      className="emdc-product-gallery-thumb"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <section className="emdc-product-info-grid">
          {!!features.length && (
            <InfoCard
              title="Features"
              items={features}
            />
          )}

          {!!specs.length && (
            <InfoCard
              title="Specifications"
              items={specs}
            />
          )}

          {!!careText && (
            <TextCard
              title="Care & Use"
              text={careText}
            />
          )}

          {!!warrantyText && (
            <TextCard
              title="Warranty / Notes"
              text={warrantyText}
            />
          )}
        </section>

        {!!related.length && (
          <section className="emdc-product-related-card">
            <h2 className="emdc-product-h2">
              Related Products
            </h2>

            <div className="emdc-product-related-grid">
              {related.map(
                (item: any) => {
                  const itemHero =
                    getFirstImageUrl(
                      item,
                      item.productHub
                    );

                  const itemSlug =
                    item.productHub
                      ?.slug ||
                    item.sku ||
                    item.skuCode ||
                    item.id ||
                    "";

                  return (
                    <a
                      key={
                        item.id ||
                        item.sku ||
                        item.skuCode
                      }
                      href={`/p/${encodeURIComponent(
                        itemSlug
                      )}`}
                      className="emdc-product-related-item"
                    >
                      <div className="emdc-product-related-thumb-wrap">
                        {itemHero ? (
                          <img
                            src={itemHero}
                            alt={getProductName(
                              item
                            )}
                            className="emdc-product-related-thumb"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="emdc-product-related-no-image">
                            No Image
                          </span>
                        )}
                      </div>

                      <div className="emdc-product-related-name">
                        {getProductName(
                          item
                        )}
                      </div>

                      <div className="emdc-product-related-sku">
                        {item.sku ||
                          item.skuCode}
                      </div>
                    </a>
                  );
                }
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="emdc-product-info-card">
      <h2 className="emdc-product-h2">
        {title}
      </h2>

      <ul className="emdc-product-list">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TextCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <section className="emdc-product-info-card">
      <h2 className="emdc-product-h2">
        {title}
      </h2>

      <p className="emdc-product-body-text">
        {text}
      </p>
    </section>
  );
}

function ResponsiveCss() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #f4f7fb;
        color: #111827;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .emdc-product-page {
        min-height: 100vh;
        padding: 28px 20px 48px;
        background:
          linear-gradient(
            180deg,
            #ffffff 0,
            #f4f7fb 340px
          );
      }

      .emdc-product-shell {
        width: min(1160px, 100%);
        margin: 0 auto;
      }

      .emdc-product-topbar {
        margin-bottom: 16px;
      }

      .emdc-product-kicker {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .emdc-product-small-muted {
        margin-top: 3px;
        font-size: 12px;
        color: #6b7280;
      }

      .emdc-product-hero-card,
      .emdc-product-gallery-card,
      .emdc-product-info-card,
      .emdc-product-related-card,
      .emdc-error-card,
      .emdc-loading-card {
        border: 1px solid #dfe4ec;
        border-radius: 22px;
        background: #ffffff;
        box-shadow:
          0 18px 44px rgba(
            17,
            24,
            39,
            0.08
          );
      }

      .emdc-product-hero-card {
        display: grid;
        grid-template-columns:
          minmax(320px, 0.9fr)
          minmax(360px, 1.1fr);
        gap: 30px;
        min-height: 430px;
        padding: 22px;
      }

      .emdc-product-hero-wrap {
        min-height: 380px;
        overflow: hidden;
        border-radius: 18px;
        background: #f6f7f9;
      }

      .emdc-product-hero-img {
        width: 100%;
        height: 100%;
        min-height: 380px;
        object-fit: contain;
        display: block;
      }

      .emdc-product-placeholder {
        min-height: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-weight: 800;
      }

      .emdc-product-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 12px 12px 12px 0;
      }

      .emdc-product-brand-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .emdc-product-brand-pill,
      .emdc-product-collection-pill {
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
      }

      .emdc-product-brand-pill {
        background: #111827;
        color: #ffffff;
      }

      .emdc-product-collection-pill {
        background: #eef2f7;
        color: #374151;
      }

      .emdc-product-title {
        margin: 0;
        font-size: clamp(
          30px,
          4vw,
          52px
        );
        line-height: 1.02;
        letter-spacing: -0.04em;
      }

      .emdc-product-sku {
        margin: 14px 0 0;
        color: #6b7280;
        font-size: 13px;
      }

      .emdc-product-price {
        margin: 12px 0 0;
        font-size: 17px;
        font-weight: 900;
      }

      .emdc-product-intro {
        margin: 20px 0 0;
        color: #4b5563;
        font-size: 15px;
        line-height: 1.65;
        white-space: pre-line;
      }

      .emdc-product-intro-muted {
        color: #9ca3af;
      }

      .emdc-product-button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 24px;
      }

      .emdc-product-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 9px 15px;
        border-radius: 9px;
        background: #111827;
        color: #ffffff;
        text-decoration: none;
        font-size: 12px;
        font-weight: 900;
      }

      .emdc-product-gallery-card,
      .emdc-product-related-card {
        margin-top: 24px;
        padding: 20px;
      }

      .emdc-product-h2 {
        margin: 0 0 14px;
        font-size: 18px;
        line-height: 1.2;
      }

      .emdc-product-gallery-grid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(150px, 1fr)
          );
        gap: 12px;
      }

      .emdc-product-gallery-thumb-wrap {
        overflow: hidden;
        border-radius: 14px;
        background: #f6f7f9;
        aspect-ratio: 1;
      }

      .emdc-product-gallery-thumb {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .emdc-product-info-grid {
        display: grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap: 18px;
        margin-top: 24px;
      }

      .emdc-product-info-card {
        padding: 20px;
      }

      .emdc-product-list {
        margin: 0;
        padding-left: 20px;
        color: #4b5563;
        line-height: 1.7;
        font-size: 14px;
      }

      .emdc-product-body-text {
        margin: 0;
        color: #4b5563;
        line-height: 1.7;
        font-size: 14px;
        white-space: pre-line;
      }

      .emdc-product-related-grid {
        display: grid;
        grid-template-columns:
          repeat(
            4,
            minmax(0, 1fr)
          );
        gap: 12px;
      }

      .emdc-product-related-item {
        overflow: hidden;
        border: 1px solid #dfe4ec;
        border-radius: 14px;
        background: #ffffff;
        text-decoration: none;
        color: inherit;
        transition:
          transform 0.16s ease,
          box-shadow 0.16s ease;
      }

      .emdc-product-related-item:hover {
        transform: translateY(-2px);
        box-shadow:
          0 10px 26px rgba(
            17,
            24,
            39,
            0.1
          );
      }

      .emdc-product-related-thumb-wrap {
        aspect-ratio: 1.45;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f6f7f9;
        overflow: hidden;
      }

      .emdc-product-related-thumb {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .emdc-product-related-no-image {
        color: #9ca3af;
        font-size: 12px;
        font-weight: 800;
      }

      .emdc-product-related-name {
        padding: 11px 11px 0;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.35;
      }

      .emdc-product-related-sku {
        padding: 5px 11px 12px;
        color: #6b7280;
        font-size: 10px;
      }

      .emdc-product-center {
        min-height: 100vh;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f7fb;
      }

      .emdc-loading-card,
      .emdc-error-card {
        width: min(460px, 100%);
        padding: 28px;
      }

      .emdc-loading-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #4b5563;
        font-weight: 800;
      }

      .emdc-spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #dfe4ec;
        border-top-color: #111827;
        animation:
          emdcSpin 0.8s linear infinite;
      }

      .emdc-error-title {
        margin-bottom: 12px;
        font-size: 18px;
        font-weight: 900;
      }

      @keyframes emdcSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (
        max-width: 820px
      ) {
        .emdc-product-page {
          padding: 18px 12px 36px;
        }

        .emdc-product-hero-card {
          grid-template-columns: 1fr;
          gap: 18px;
          padding: 14px;
          border-radius: 18px;
        }

        .emdc-product-hero-wrap,
        .emdc-product-hero-img,
        .emdc-product-placeholder {
          min-height: 280px;
        }

        .emdc-product-content {
          padding: 4px 6px 10px;
        }

        .emdc-product-title {
          font-size: clamp(
            29px,
            9vw,
            42px
          );
        }

        .emdc-product-info-grid {
          grid-template-columns: 1fr;
        }

        .emdc-product-related-grid {
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
        }
      }

      @media (
        max-width: 480px
      ) {
        .emdc-product-related-grid {
          grid-template-columns: 1fr;
        }

        .emdc-product-button {
          flex: 1 1 44%;
        }
      }
    `}</style>
  );
}
