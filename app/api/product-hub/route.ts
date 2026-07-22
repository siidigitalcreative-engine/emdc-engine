import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCT_HUB_PREFIX = "product-hub";
const SKU_PATH = "emdc-state/sku-items/all.json";
const STATE_PATH = "emdc-state/current.json";
const RELATED_PRODUCT_LIMIT = 4;

function cleanSku(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 160);
}

function pathForSku(sku: string) {
  return `${PRODUCT_HUB_PREFIX}/${encodeURIComponent(sku)}.json`;
}

async function streamToText(stream: any) {
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

async function readJsonBlob(pathname: string, fallback: any = null) {
  try {
    const result: any = await get(
      pathname,
      { access: "private" } as any
    );
    const text = await streamToText(result?.stream);
    if (!text) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonBlob(pathname: string, value: any) {
  return put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  } as any);
}

function slugify(value = "") {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(value = "") {
  return slugify(value).toLowerCase();
}

function compactNormalize(value = "") {
  return String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function lines(value: unknown) {
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
}

function getSkuCandidateValues(item: any) {
  const extraValues =
    item?.extraFields &&
    typeof item.extraFields === "object"
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

function findSkuByCode(items: any[], code: string) {
  const target = normalize(code || "");
  const compactTarget = compactNormalize(code || "");

  if (!target && !compactTarget) return null;

  const exact = items.find((item: any) =>
    getSkuCandidateValues(item).some(
      (value) =>
        normalize(String(value || "")) === target
    )
  );

  if (exact) return exact;

  return (
    items.find((item: any) =>
      getSkuCandidateValues(item).some(
        (value) =>
          compactNormalize(String(value || "")) ===
          compactTarget
      )
    ) || null
  );
}

function findProduct(items: any[], requested: string) {
  const target = normalize(
    decodeURIComponent(requested || "")
  );

  return (
    items.find((item: any) => {
      const sku = normalize(
        item?.sku || item?.skuCode || ""
      );
      const hubSlug = normalize(
        item?.productHub?.slug || ""
      );
      const id = normalize(item?.id || "");

      return (
        sku === target ||
        hubSlug === target ||
        id === target
      );
    }) || null
  );
}

function getCategory(product: any) {
  return String(
    product?.collection ||
      product?.category ||
      product?.extraFields?.category ||
      product?.extraFields?.collection ||
      ""
  ).trim();
}

function getSearchText(item: any) {
  const extra =
    item?.extraFields &&
    typeof item.extraFields === "object"
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
  ]
    .join(" ")
    .toLowerCase();
}

function countKeywordHits(
  text: string,
  keywords: string[]
) {
  return keywords.reduce(
    (sum, word) =>
      sum + (text.includes(word) ? 1 : 0),
    0
  );
}

function getRelatedProfile(product: any) {
  const text = getSearchText(product);

  if (
    /condiment|sauce|oil|vinegar|dispenser|seasoning|spice|salt|pepper/.test(
      text
    )
  ) {
    return {
      positive: [
        "condiment",
        "sauce",
        "oil",
        "vinegar",
        "dispenser",
        "seasoning",
        "spice",
        "salt",
        "pepper",
        "kitchen",
        "cooking",
        "cookware",
        "utensil",
        "tool",
        "acacia",
        "wood",
        "butter",
        "cheese",
        "tong",
        "turner",
        "spoon",
        "ladle",
        "grater",
        "chopper",
        "board",
        "cutting",
        "lazy susan",
        "baking",
        "tray",
        "dish",
        "pot",
        "pan",
        "casserole",
        "food",
        "serve",
        "serving",
      ],
      negative: [
        "rock glass",
        "whiskey",
        "wine",
        "champagne",
        "goblet",
        "shot glass",
        "drinking",
        "tumbler",
        "ice bucket",
        "decanter",
        "beer",
        "cocktail",
        "highball",
        "glass set",
        "double wall",
      ],
    };
  }

  if (
    /lunch|bento|food jar|food container|meal|insulated/.test(
      text
    )
  ) {
    return {
      positive: [
        "lunch",
        "bento",
        "food",
        "container",
        "jar",
        "bag",
        "tumbler",
        "cutlery",
        "utensil",
        "meal",
        "insulated",
      ],
      negative: [
        "whiskey",
        "wine",
        "rock glass",
        "ice bucket",
        "decanter",
      ],
    };
  }

  if (
    /dinnerware|plate|bowl|serveware|serving|cutlery/.test(
      text
    )
  ) {
    return {
      positive: [
        "dinnerware",
        "plate",
        "bowl",
        "serve",
        "serving",
        "cutlery",
        "glassware",
        "placemat",
        "table",
        "dish",
      ],
      negative: [],
    };
  }

  if (
    /clean|mop|brush|sponge|trash|bin|hose|reel/.test(
      text
    )
  ) {
    return {
      positive: [
        "clean",
        "mop",
        "brush",
        "sponge",
        "trash",
        "bin",
        "hose",
        "reel",
        "spray",
        "scrub",
      ],
      negative: [
        "lunch",
        "dinnerware",
        "whiskey",
        "wine",
      ],
    };
  }

  return {
    positive: [],
    negative: [],
  };
}

function uniqueProducts(items: any[]) {
  const seen = new Set<string>();
  const output: any[] = [];

  for (const item of items) {
    const key = normalize(
      item?.sku ||
        item?.id ||
        item?.productName ||
        ""
    );

    if (!key || seen.has(key)) continue;

    seen.add(key);
    output.push(item);
  }

  return output;
}

function compactProduct(item: any) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item?.id || "",
    sku: item?.sku || item?.skuCode || "",
    skuCode: item?.skuCode || item?.sku || "",
    productName:
      item?.productName ||
      item?.product ||
      item?.name ||
      "",
    product:
      item?.product ||
      item?.productName ||
      item?.name ||
      "",
    collection:
      item?.collection ||
      item?.category ||
      "",
    category:
      item?.category ||
      item?.collection ||
      "",
    brandId: item?.brandId || "",
    brand: item?.brand || item?.brandName || "",
    brandName:
      item?.brandName ||
      item?.brand ||
      "",
    imageLink:
      item?.imageLink ||
      item?.imageUrl ||
      "",
    imageUrl:
      item?.imageUrl ||
      item?.imageLink ||
      "",
    srp: item?.srp || "",
    tag: item?.tag || "",
    extraFields:
      item?.extraFields &&
      typeof item.extraFields === "object"
        ? item.extraFields
        : {},
    productHub:
      item?.productHub &&
      typeof item.productHub === "object"
        ? item.productHub
        : {},
  };
}

async function buildPublicPayload(requestedSku: string) {
  const [skuItemsRaw, currentState] =
    await Promise.all([
      readJsonBlob(SKU_PATH, []),
      readJsonBlob(STATE_PATH, null),
    ]);

  const skuItems = Array.isArray(skuItemsRaw)
    ? skuItemsRaw
    : [];

  const product = findProduct(
    skuItems,
    requestedSku
  );

  if (!product) {
    return {
      found: false,
      product: null,
      related: [],
      brand: null,
      productHubData: null,
      skuCount: skuItems.length,
    };
  }

  const productSku = String(
    product?.sku ||
      product?.skuCode ||
      requestedSku
  );

  const productHubData =
    await readJsonBlob(
      pathForSku(productSku),
      null
    );

  const appState =
    currentState?.appState &&
    typeof currentState.appState === "object"
      ? currentState.appState
      : {};

  const brands = Array.isArray(
    appState?.skuBrands
  )
    ? appState.skuBrands
    : [];

  const brand =
    brands.find(
      (row: any) =>
        String(row?.id || "") ===
        String(product?.brandId || "")
    ) ||
    (
      product?.brand ||
      product?.brandName
        ? {
            id:
              product?.brandId || "",
            name:
              product?.brand ||
              product?.brandName ||
              "",
          }
        : null
    );

  const selectedRelatedSkus =
    Array.from(
      new Set(
        [
          ...lines(
            productHubData?.relatedSkus
          ),
          ...(
            Array.isArray(
              product?.productHub?.relatedSkus
            )
              ? product.productHub.relatedSkus
              : []
          ),
        ]
          .map((code) =>
            String(code || "").trim()
          )
          .filter(Boolean)
      )
    );

  const currentSkuKey = normalize(
    product?.sku ||
      product?.skuCode ||
      product?.id ||
      ""
  );

  const currentCategory = normalize(
    getCategory(product)
  );

  const currentCollection = normalize(
    String(
      product?.collection ||
        product?.extraFields?.collection ||
        ""
    )
  );

  const currentBrand = normalize(
    String(
      product?.brandId ||
        product?.brand ||
        product?.brandName ||
        ""
    )
  );

  const getItemBrand = (item: any) =>
    normalize(
      String(
        item?.brandId ||
          item?.brand ||
          item?.brandName ||
          ""
      )
    );

  const isSameBrand = (item: any) => {
    if (!currentBrand) return true;
    return getItemBrand(item) === currentBrand;
  };

  const selectedRelatedItems =
    selectedRelatedSkus
      .map((code) =>
        findSkuByCode(skuItems, code)
      )
      .filter(Boolean)
      .filter((item: any) => {
        const itemSkuKey = normalize(
          item?.sku ||
            item?.skuCode ||
            item?.id ||
            ""
        );

        return (
          itemSkuKey &&
          itemSkuKey !== currentSkuKey &&
          isSameBrand(item)
        );
      });

  const selectedKeys = new Set(
    selectedRelatedItems
      .flatMap((item: any) => [
        item?.sku,
        item?.skuCode,
        item?.id,
        item?.productName,
      ])
      .map((value) =>
        normalize(String(value || ""))
      )
      .filter(Boolean)
  );

  const profile =
    getRelatedProfile(product);

  const automaticRelatedItems =
    skuItems
      .filter((item: any) => {
        const itemSkuKey = normalize(
          item?.sku ||
            item?.skuCode ||
            item?.id ||
            ""
        );

        if (
          !itemSkuKey ||
          itemSkuKey === currentSkuKey ||
          selectedKeys.has(itemSkuKey)
        ) {
          return false;
        }

        return isSameBrand(item);
      })
      .sort((a: any, b: any) => {
        const score = (item: any) => {
          const text =
            getSearchText(item);

          const itemCategory =
            normalize(getCategory(item));

          const itemCollection =
            normalize(
              String(
                item?.collection ||
                  item?.extraFields?.collection ||
                  ""
              )
            );

          let value = 10;

          value +=
            countKeywordHits(
              text,
              profile.positive
            ) * 25;

          if (
            currentCollection &&
            itemCollection === currentCollection
          ) {
            value += 12;
          }

          if (
            currentCategory &&
            itemCategory === currentCategory
          ) {
            value += 10;
          }

          value -=
            countKeywordHits(
              text,
              profile.negative
            ) * 60;

          if (
            item?.imageLink ||
            item?.imageUrl
          ) {
            value += 3;
          }

          if (
            item?.productName ||
            item?.product ||
            item?.name
          ) {
            value += 2;
          }

          return value;
        };

        return score(b) - score(a);
      });

  const related = uniqueProducts([
    ...selectedRelatedItems,
    ...automaticRelatedItems,
  ])
    .slice(0, RELATED_PRODUCT_LIMIT)
    .map(compactProduct)
    .filter(Boolean);

  return {
    found: true,
    product: compactProduct(product),
    related,
    brand,
    productHubData,
    skuCount: skuItems.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } =
      new URL(req.url);

    const sku = cleanSku(
      searchParams.get("sku")
    );

    if (!sku) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing sku",
        },
        { status: 400 }
      );
    }

    const publicMode =
      searchParams.get("public") === "1";

    if (publicMode) {
      const payload =
        await buildPublicPayload(sku);

      return NextResponse.json(
        {
          ok: true,
          sku,
          ...payload,
        },
        {
          status: payload.found ? 200 : 404,
          headers: {
            "Cache-Control":
              "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    const data = await readJsonBlob(
      pathForSku(sku),
      null
    );

    return NextResponse.json(
      {
        ok: true,
        sku,
        data: data || null,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to read Product Hub data",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sku = cleanSku(body?.sku);

    if (!sku) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing sku",
        },
        { status: 400 }
      );
    }

    const incoming =
      body?.data &&
      typeof body.data === "object"
        ? body.data
        : {};

    const now =
      new Date().toISOString();

    const data = {
      ...incoming,
      sku,
      updatedAt: now,
      version: 1,
    };

    await writeJsonBlob(
      pathForSku(sku),
      data
    );

    return NextResponse.json({
      ok: true,
      sku,
      savedAt: now,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to save Product Hub data",
      },
      { status: 500 }
    );
  }
}
