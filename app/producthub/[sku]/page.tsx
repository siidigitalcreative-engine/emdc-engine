"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  relatedSkus?: string | string[];
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

function textToLines(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        String(item || "").split(
          /[\r\n,;]+/
        )
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[\r\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function linesToText(value: unknown) {
  return textToLines(value).join("\n");
}

function getGoogleDriveFileId(
  value: unknown
) {
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
        return decodeURIComponent(
          match[1]
        );
      } catch {
        return match[1];
      }
    }
  }

  return "";
}

function toPreviewImageUrl(
  value: unknown
) {
  const text = String(value || "").trim();

  if (!text) return "";

  if (text.startsWith("data:image/")) {
    return text;
  }

  const driveId =
    getGoogleDriveFileId(text);

  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveId
    )}&sz=w1600`;
  }

  return /^https?:\/\//i.test(text)
    ? text
    : "";
}

function ImagePreview({
  source,
  label,
}: {
  source: string;
  label: string;
}) {
  const [failed, setFailed] =
    useState(false);

  const previewUrl =
    toPreviewImageUrl(source);

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  if (!previewUrl) {
    return null;
  }

  return (
    <figure
      style={{
        width: "100%",
        margin: 0,
        overflow: "hidden",
        border:
          "1px solid #E5E7EB",
        borderRadius: 12,
        background: "#F8FAFC",
      }}
    >
      <figcaption
        style={{
          padding: "9px 11px",
          borderBottom:
            "1px solid #E5E7EB",
          color: "#6B7280",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {label}
      </figcaption>

      {!failed ? (
        <img
          src={previewUrl}
          alt={label}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() =>
            setFailed(true)
          }
          style={{
            display: "block",
            width: "100%",
            height: 190,
            objectFit: "contain",
            background: "#FFFFFF",
          }}
        />
      ) : (
        <div
          style={{
            minHeight: 110,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Preview unavailable. For
          Google Drive files, set
          sharing to “Anyone with the
          link can view.”
        </div>
      )}
    </figure>
  );
}

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

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: any) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={labelStyle}>
        {label}
      </span>

      <input
        style={inputStyle}
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder || ""}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: any) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={labelStyle}>
        {label}
      </span>

      <textarea
        style={{
          ...inputStyle,
          minHeight: rows * 24,
          resize: "vertical",
          lineHeight: 1.5,
        }}
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder || ""}
      />
    </label>
  );
}

function sectionTitle(
  title: string,
  desc?: string
) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          color: "#111827",
        }}
      >
        {title}
      </h2>

      {desc ? (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          {desc}
        </p>
      ) : null}
    </div>
  );
}

export default function ProductHubEditorPage({
  params,
}: {
  params: { sku: string };
}) {
  const decodedSku = useMemo(
    () =>
      decodeURIComponent(
        params?.sku || ""
      ),
    [params?.sku]
  );

  const [hub, setHub] =
    useState<HubData>(emptyHub);

  const [skuItem, setSkuItem] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [dirty, setDirty] =
    useState(false);

  const [savedAt, setSavedAt] =
    useState(0);

  const publicSku =
    hub.slug?.trim() || decodedSku;

  const publicUrl = `/p/${encodeURIComponent(
    publicSku
  )}${
    savedAt
      ? `?v=${savedAt}`
      : ""
  }`;

  const heroPreviewSource =
    String(
      hub.heroImage || ""
    ).trim();

  const galleryPreviewSources =
    textToLines(hub.gallery)
      .filter((source) =>
        Boolean(
          toPreviewImageUrl(
            source
          )
        )
      )
      .slice(0, 20);

  const update = (
    key: keyof HubData,
    value: any
  ) => {
    setHub((previous) => ({
      ...previous,
      [key]: value,
    }));

    setDirty(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatus(
        "Loading Product Hub..."
      );

      try {
        const requestTime =
          Date.now();

        const [hubRes, stateRes] =
          await Promise.allSettled([
            fetch(
              `/api/product-hub?sku=${encodeURIComponent(
                decodedSku
              )}&_=${requestTime}`,
              {
                cache: "no-store",
                headers: {
                  "Cache-Control":
                    "no-cache, no-store, max-age=0",
                  Pragma: "no-cache",
                },
              }
            ),
            fetch(
              `/api/load?_=${requestTime}`,
              {
                cache: "no-store",
                headers: {
                  "Cache-Control":
                    "no-cache, no-store, max-age=0",
                  Pragma: "no-cache",
                },
              }
            ),
          ]);

        if (cancelled) return;

        if (
          hubRes.status ===
          "fulfilled"
        ) {
          const json =
            await hubRes.value
              .json()
              .catch(() => null);

          if (
            json?.ok &&
            json?.data
          ) {
            setHub({
              ...emptyHub,
              ...json.data,
              relatedSkus:
                linesToText(
                  json.data
                    .relatedSkus
                ),
            });
          } else {
            setHub({
              ...emptyHub,
              slug: decodedSku,
            });
          }
        }

        if (
          stateRes.status ===
          "fulfilled"
        ) {
          const json =
            await stateRes.value
              .json()
              .catch(() => null);

          const rows =
            Array.isArray(
              json?.skuItems
            )
              ? json.skuItems
              : Array.isArray(
                    json?.data
                      ?.appState
                      ?.skuItems
                  )
                ? json.data
                    .appState
                    .skuItems
                : [];

          const match = rows.find(
            (row: any) => {
              const values = [
                row?.sku,
                row?.skuCode,
                row?.value,
                row?.id,
              ].map((value) =>
                String(value || "")
                  .trim()
                  .toLowerCase()
              );

              return values.includes(
                decodedSku
                  .trim()
                  .toLowerCase()
              );
            }
          );

          setSkuItem(
            match || null
          );
        }

        setDirty(false);
        setStatus("Loaded");
      } catch (error: any) {
        if (!cancelled) {
          setStatus(
            error?.message ||
              "Unable to load Product Hub"
          );
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
    };
  }, [decodedSku]);

  const save = async () => {
    setSaving(true);
    setStatus(
      "Saving Product Hub..."
    );

    try {
      const res = await fetch(
        "/api/product-hub",
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type":
              "application/json",
            "Cache-Control":
              "no-cache, no-store, max-age=0",
          },
          body: JSON.stringify({
            sku: decodedSku,
            data: {
              ...hub,
              relatedSkus:
                textToLines(
                  hub.relatedSkus
                ),
            },
          }),
        }
      );

      const json =
        await res
          .json()
          .catch(() => null);

      if (
        !res.ok ||
        !json?.ok
      ) {
        throw new Error(
          json?.error ||
            "Save failed"
        );
      }

      // Read the record back immediately so the editor confirms
      // the exact data that is now available to the public page.
      const confirmedRes =
        await fetch(
          `/api/product-hub?sku=${encodeURIComponent(
            decodedSku
          )}&_=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control":
                "no-cache, no-store, max-age=0",
              Pragma: "no-cache",
            },
          }
        );

      const confirmedJson =
        await confirmedRes
          .json()
          .catch(() => null);

      if (
        confirmedRes.ok &&
        confirmedJson?.ok &&
        confirmedJson?.data
      ) {
        setHub({
          ...emptyHub,
          ...confirmedJson.data,
          relatedSkus:
            linesToText(
              confirmedJson.data
                .relatedSkus
            ),
        });
      }

      const updateTime =
        Date.now();

      const updateMessage = {
        sku: decodedSku,
        slug:
          hub.slug?.trim() ||
          decodedSku,
        updatedAt: updateTime,
      };

      setSavedAt(updateTime);
      setDirty(false);
      setStatus(
        `Saved ${new Date(
          updateTime
        ).toLocaleTimeString()}`
      );

      // Notify an already-open public product page in another tab.
      try {
        localStorage.setItem(
          "emdc-product-hub-updated",
          JSON.stringify(
            updateMessage
          )
        );
      } catch {}

      if (
        typeof BroadcastChannel !==
        "undefined"
      ) {
        const channel =
          new BroadcastChannel(
            "emdc-product-hub-updates"
          );

        channel.postMessage(
          updateMessage
        );
        channel.close();
      }
    } catch (error: any) {
      setStatus(
        error?.message ||
          "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#111827",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding:
            "24px 16px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: 16,
            alignItems:
              "flex-start",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#6B7280",
                fontWeight: 700,
              }}
            >
              EMDC Product Hub
            </p>

            <h1
              style={{
                margin:
                  "4px 0 0",
                fontSize: 28,
                lineHeight: 1.1,
              }}
            >
              {skuItem
                ?.productName ||
                skuItem?.product ||
                decodedSku}
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: "#6B7280",
                fontSize: 14,
              }}
            >
              SKU:{" "}
              <strong
                style={{
                  color:
                    "#111827",
                }}
              >
                {decodedSku}
              </strong>

              {skuItem?.brand ||
              skuItem?.brandId ? (
                <>
                  {" "}
                  ·{" "}
                  {skuItem.brand ||
                    skuItem.brandId}
                </>
              ) : null}

              {skuItem?.collection ||
              skuItem?.category ? (
                <>
                  {" "}
                  ·{" "}
                  {skuItem.collection ||
                    skuItem.category}
                </>
              ) : null}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems:
                "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration:
                  "none",
                background:
                  "#FFFFFF",
                border:
                  "1px solid #E5E7EB",
                borderRadius: 10,
                padding:
                  "10px 14px",
                color: "#111827",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              View Page
            </a>

            <button
              onClick={save}
              disabled={
                saving || loading
              }
              style={{
                background:
                  "#111827",
                color: "#FFFFFF",
                border: 0,
                borderRadius: 10,
                padding:
                  "11px 18px",
                fontWeight: 900,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : dirty
                  ? "Save Changes"
                  : "Saved"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: dirty
              ? "#B45309"
              : "#059669",
            fontWeight: 700,
          }}
        >
          {status}
          {dirty
            ? " · Unsaved changes"
            : ""}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          <section
            style={{
              background:
                "#FFFFFF",
              border:
                "1px solid #E5E7EB",
              borderRadius: 18,
              padding: 18,
            }}
          >
            {sectionTitle(
              "General",
              "This data is separate from SKU Storage."
            )}

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 10,
                  fontWeight: 800,
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    !!hub.enabled
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "enabled",
                      event
                        .target
                        .checked
                    )
                  }
                />

                Product Hub Enabled
              </label>

              <TextField
                label="Hub Slug / URL SKU"
                value={hub.slug}
                onChange={(
                  value: string
                ) =>
                  update(
                    "slug",
                    value
                  )
                }
                placeholder={
                  decodedSku
                }
              />

              <TextField
                label="Hero Image URL"
                value={
                  hub.heroImage
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "heroImage",
                    value
                  )
                }
                placeholder={
                  skuItem
                    ?.imageLink ||
                  "https://..."
                }
              />

              {!!heroPreviewSource && (
                <ImagePreview
                  source={
                    heroPreviewSource
                  }
                  label="Hero Image Preview"
                />
              )}

              <TextArea
                label="Gallery Images"
                value={hub.gallery}
                onChange={(
                  value: string
                ) =>
                  update(
                    "gallery",
                    value
                  )
                }
                placeholder="One image URL per line"
                rows={5}
              />

              {!!galleryPreviewSources.length && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 10,
                  }}
                >
                  {galleryPreviewSources.map(
                    (
                      source,
                      index
                    ) => (
                      <ImagePreview
                        key={`${source}-${index}`}
                        source={source}
                        label={`Gallery Image ${
                          index + 1
                        }`}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section
            style={{
              background:
                "#FFFFFF",
              border:
                "1px solid #E5E7EB",
              borderRadius: 18,
              padding: 18,
            }}
          >
            {sectionTitle(
              "Product Details"
            )}

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <TextArea
                label="Product Introduction"
                value={
                  hub.introduction
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "introduction",
                    value
                  )
                }
                rows={6}
              />

              <TextArea
                label="Features"
                value={
                  hub.features
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "features",
                    value
                  )
                }
                placeholder="One feature per line"
                rows={6}
              />

              <TextArea
                label="Specifications"
                value={
                  hub.specifications
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "specifications",
                    value
                  )
                }
                placeholder="One specification per line"
                rows={6}
              />

              <TextArea
                label="Care & Use"
                value={hub.care}
                onChange={(
                  value: string
                ) =>
                  update(
                    "care",
                    value
                  )
                }
                rows={5}
              />

              <TextArea
                label="Warranty / Notes"
                value={
                  hub.warranty
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "warranty",
                    value
                  )
                }
                rows={4}
              />
            </div>
          </section>

          <section
            style={{
              background:
                "#FFFFFF",
              border:
                "1px solid #E5E7EB",
              borderRadius: 18,
              padding: 18,
            }}
          >
            {sectionTitle(
              "Shopping Links"
            )}

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <TextField
                label="Shopee Link"
                value={hub.shopee}
                onChange={(
                  value: string
                ) =>
                  update(
                    "shopee",
                    value
                  )
                }
                placeholder="https://..."
              />

              <TextField
                label="Lazada Link"
                value={hub.lazada}
                onChange={(
                  value: string
                ) =>
                  update(
                    "lazada",
                    value
                  )
                }
                placeholder="https://..."
              />

              <TextField
                label="TikTok Shop Link"
                value={hub.tiktok}
                onChange={(
                  value: string
                ) =>
                  update(
                    "tiktok",
                    value
                  )
                }
                placeholder="https://..."
              />

              <TextField
                label="Website Link"
                value={hub.website}
                onChange={(
                  value: string
                ) =>
                  update(
                    "website",
                    value
                  )
                }
                placeholder="https://..."
              />

              <TextField
                label="Manual / PDF Link"
                value={hub.manual}
                onChange={(
                  value: string
                ) =>
                  update(
                    "manual",
                    value
                  )
                }
                placeholder="https://..."
              />

              <TextField
                label="Video Link"
                value={hub.video}
                onChange={(
                  value: string
                ) =>
                  update(
                    "video",
                    value
                  )
                }
                placeholder="https://..."
              />
            </div>
          </section>

          <section
            style={{
              background:
                "#FFFFFF",
              border:
                "1px solid #E5E7EB",
              borderRadius: 18,
              padding: 18,
            }}
          >
            {sectionTitle(
              "Related Products & SEO"
            )}

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <TextArea
                label="Related SKUs"
                value={
                  hub.relatedSkus
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "relatedSkus",
                    value
                  )
                }
                placeholder="One SKU per line"
                rows={5}
              />

              <TextField
                label="Meta Title"
                value={
                  hub.metaTitle
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "metaTitle",
                    value
                  )
                }
              />

              <TextArea
                label="Meta Description"
                value={
                  hub.metaDescription
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "metaDescription",
                    value
                  )
                }
                rows={4}
              />

              <TextArea
                label="Keywords"
                value={
                  hub.keywords
                }
                onChange={(
                  value: string
                ) =>
                  update(
                    "keywords",
                    value
                  )
                }
                placeholder="One keyword per line"
                rows={4}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
