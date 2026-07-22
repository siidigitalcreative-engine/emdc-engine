"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

type BudgetPlannerRow = {
  id: string;
  sku: string;
  qty: string;
  nameSnapshot?: string;
  srpSnapshot?: number;
};

type BudgetPlannerData = {
  version: 2;
  rows: BudgetPlannerRow[];
  updatedAt: string;
};

type BudgetPlannerProps = {
  rawData?: any;
  skuStorage?: any;
  groupSkus?: any[];
  onChange: (
    planner: BudgetPlannerData
  ) => void;
};

const DEFAULT_ROW_COUNT = 6;

const makeId = () =>
  `budget-${Date.now().toString(
    36
  )}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const normalizeSku = (
  value: unknown
) =>
  String(value || "")
    .trim()
    .toUpperCase();

const toNumber = (
  value: unknown
) => {
  const parsed = Number(
    String(value ?? "")
      .replace(/[₱,\s]/g, "")
      .trim()
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const formatMoney = (
  value: number
) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(value)
      ? value
      : 0
  );

const formatQty = (
  value: number
) => {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(value);
};

const getSkuCode = (
  item: any
) =>
  String(
    item?.sku ||
      item?.skuCode ||
      item?.code ||
      item?.extraFields?.SKU ||
      item?.extraFields?.Sku ||
      ""
  ).trim();

const getProductName = (
  item: any
) =>
  String(
    item?.productName ||
      item?.product ||
      item?.name ||
      item?.title ||
      item?.value ||
      ""
  ).trim();

const getSrp = (
  item: any
) =>
  toNumber(
    item?.srp ??
      item?.SRP ??
      item?.price ??
      item?.retailPrice ??
      item?.extraFields?.SRP ??
      item?.extraFields?.Srp ??
      item?.extraFields?.srp ??
      item?.extraFields?.[
        "Suggested Retail Price"
      ] ??
      item?.extraFields?.[
        "SRP Price"
      ]
  );

const asArray = (
  value: any
): any[] =>
  Array.isArray(value)
    ? value
    : [];

const collectSkuItems = (
  skuStorage: any,
  groupSkus: any[]
) => {
  const candidates: any[] = [
    ...asArray(groupSkus),
    ...asArray(skuStorage),
    ...asArray(
      skuStorage?.items
    ),
    ...asArray(
      skuStorage?.rows
    ),
    ...asArray(
      skuStorage?.skus
    ),
    ...asArray(
      skuStorage?.skuItems
    ),
    ...asArray(
      skuStorage?.data?.items
    ),
    ...asArray(
      skuStorage?.data?.rows
    ),
    ...asArray(
      skuStorage?.data?.skus
    ),
    ...asArray(
      skuStorage?.data
        ?.skuItems
    ),
  ];

  if (
    skuStorage &&
    typeof skuStorage ===
      "object" &&
    !Array.isArray(skuStorage)
  ) {
    Object.values(
      skuStorage
    ).forEach((value) => {
      if (Array.isArray(value)) {
        candidates.push(
          ...value
        );
      }
    });
  }

  const seen =
    new Set<string>();

  return candidates.filter(
    (item) => {
      const sku =
        normalizeSku(
          getSkuCode(item)
        );

      if (!sku || seen.has(sku)) {
        return false;
      }

      seen.add(sku);
      return true;
    }
  );
};

const isOldPlaceholderSku = (
  value: unknown
) =>
  /^SKU\s*\d+$/i.test(
    String(value || "").trim()
  );

const normalizeRows = (
  rows: any[]
): BudgetPlannerRow[] => {
  const normalized = asArray(
    rows
  ).map((row) => ({
    id:
      String(row?.id || "") ||
      makeId(),
    sku: String(
      row?.sku || ""
    ),
    qty: String(
      row?.qty ?? ""
    ),
    nameSnapshot: String(
      row?.nameSnapshot || ""
    ),
    srpSnapshot:
      toNumber(
        row?.srpSnapshot
      ) || 0,
  }));

  while (
    normalized.length <
    DEFAULT_ROW_COUNT
  ) {
    normalized.push({
      id: makeId(),
      sku: "",
      qty: "",
      nameSnapshot: "",
      srpSnapshot: 0,
    });
  }

  return normalized;
};

const buildInitialPlanner = (
  rawData: any,
  catalog: any[],
  groupSkus: any[]
): BudgetPlannerData => {
  const savedPlanner =
    rawData?.planner;

  if (
    Array.isArray(
      savedPlanner?.rows
    )
  ) {
    return {
      version: 2,
      rows: normalizeRows(
        savedPlanner.rows
      ),
      updatedAt:
        String(
          savedPlanner.updatedAt ||
            ""
        ) ||
        new Date().toISOString(),
    };
  }

  const catalogMap =
    new Map<string, any>();

  catalog.forEach((item) => {
    catalogMap.set(
      normalizeSku(
        getSkuCode(item)
      ),
      item
    );
  });

  const selectedCodes =
    asArray(groupSkus)
      .map(getSkuCode)
      .filter(Boolean);

  const oldCells =
    rawData?.sheet?.cells &&
    typeof rawData.sheet
      .cells === "object"
      ? rawData.sheet.cells
      : {};

  const rowCount = Math.max(
    DEFAULT_ROW_COUNT,
    selectedCodes.length
  );

  const rows =
    Array.from(
      {
        length: rowCount,
      },
      (_, index) => {
        const oldRow =
          index + 4;

        const oldSku =
          String(
            oldCells[
              `A${oldRow}`
            ] || ""
          ).trim();

        const sku =
          oldSku &&
          !isOldPlaceholderSku(
            oldSku
          )
            ? oldSku
            : selectedCodes[
                index
              ] || "";

        const item =
          catalogMap.get(
            normalizeSku(sku)
          );

        return {
          id: makeId(),
          sku,
          qty: String(
            oldCells[
              `B${oldRow}`
            ] ?? ""
          ),
          nameSnapshot:
            getProductName(item),
          srpSnapshot:
            getSrp(item) ||
            toNumber(
              oldCells[
                `C${oldRow}`
              ]
            ),
        };
      }
    );

  return {
    version: 2,
    rows,
    updatedAt:
      new Date().toISOString(),
  };
};

export default function BudgetPlanner({
  rawData = {},
  skuStorage,
  groupSkus = [],
  onChange,
}: BudgetPlannerProps) {
  const catalog = useMemo(
    () =>
      collectSkuItems(
        skuStorage,
        groupSkus
      ),
    [skuStorage, groupSkus]
  );

  const catalogMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          any
        >();

      catalog.forEach(
        (item) => {
          map.set(
            normalizeSku(
              getSkuCode(item)
            ),
            item
          );
        }
      );

      return map;
    }, [catalog]);

  const [planner, setPlanner] =
    useState<BudgetPlannerData>(
      () =>
        buildInitialPlanner(
          rawData,
          catalog,
          groupSkus
        )
    );

  const savedUpdatedAt =
    String(
      rawData?.planner
        ?.updatedAt || ""
    );

  useEffect(() => {
    if (
      !savedUpdatedAt ||
      savedUpdatedAt ===
        planner.updatedAt ||
      !Array.isArray(
        rawData?.planner
          ?.rows
      )
    ) {
      return;
    }

    setPlanner({
      version: 2,
      rows: normalizeRows(
        rawData.planner.rows
      ),
      updatedAt:
        savedUpdatedAt,
    });
  }, [
    savedUpdatedAt,
    rawData?.planner?.rows,
    planner.updatedAt,
  ]);

  const commitRows = (
    rows: BudgetPlannerRow[]
  ) => {
    const next: BudgetPlannerData =
      {
        version: 2,
        rows: normalizeRows(
          rows
        ),
        updatedAt:
          new Date().toISOString(),
      };

    setPlanner(next);
    onChange(next);
  };

  const patchRow = (
    rowId: string,
    patch: Partial<BudgetPlannerRow>
  ) => {
    commitRows(
      planner.rows.map(
        (row) =>
          row.id === rowId
            ? {
                ...row,
                ...patch,
              }
            : row
      )
    );
  };

  const handleSkuChange = (
    row: BudgetPlannerRow,
    value: string
  ) => {
    const item =
      catalogMap.get(
        normalizeSku(value)
      );

    patchRow(row.id, {
      sku: value,
      ...(item
        ? {
            nameSnapshot:
              getProductName(
                item
              ),
            srpSnapshot:
              getSrp(item),
          }
        : {}),
    });
  };

  const addRow = () => {
    commitRows([
      ...planner.rows,
      {
        id: makeId(),
        sku: "",
        qty: "",
        nameSnapshot: "",
        srpSnapshot: 0,
      },
    ]);
  };

  const resolvedRows =
    planner.rows.map(
      (row) => {
        const item =
          catalogMap.get(
            normalizeSku(
              row.sku
            )
          );

        const name =
          getProductName(
            item
          ) ||
          row.nameSnapshot ||
          "";

        const srp =
          getSrp(item) ||
          toNumber(
            row.srpSnapshot
          );

        const qty =
          toNumber(row.qty);

        return {
          ...row,
          name,
          srp,
          qtyNumber: qty,
          srpValue:
            qty * srp,
        };
      }
    );

  const totalProductValue =
    resolvedRows.reduce(
      (sum, row) =>
        sum +
        row.srpValue,
      0
    );

  const totalBudget =
    totalProductValue *
    0.12;

  const budgetSplit = [
    {
      label:
        "External Traffic",
      percent: 0.025,
      note:
        "2.5% of total Product Value",
    },
    {
      label:
        "Platform Ads",
      percent: 0.085,
      note:
        "8.5% of total Product Value",
    },
    {
      label: "Flash Sale",
      percent: 0.005,
      note:
        "0.5% of total Product Value",
    },
    {
      label: "Affiliate",
      percent: 0.005,
      note:
        "0.5% of total Product Value",
    },
  ];

  return (
    <div className="emdc-budget-planner">
      <datalist id="emdc-budget-sku-list">
        {catalog.map(
          (item) => {
            const sku =
              getSkuCode(item);

            return (
              <option
                key={sku}
                value={sku}
              >
                {getProductName(
                  item
                )}
              </option>
            );
          }
        )}
      </datalist>

      <div className="emdc-budget-layout">
        <section className="emdc-budget-panel emdc-budget-main-panel">
          <div className="emdc-budget-table-scroll">
            <div className="emdc-budget-product-table">
              <div className="emdc-budget-table-header emdc-budget-row-label-cell" />

              {[
                "SKU",
                "Name",
                "SRP",
                "QTY",
                "SRP value",
              ].map((label) => (
                <div
                  key={label}
                  className="emdc-budget-table-header"
                >
                  {label}
                </div>
              ))}

              {resolvedRows.map(
                (row, index) => (
                  <React.Fragment
                    key={row.id}
                  >
                    <div className="emdc-budget-row-label">
                      ROW {index + 1}
                    </div>

                    <div className="emdc-budget-cell emdc-budget-input-cell">
                      <input
                        list="emdc-budget-sku-list"
                        value={row.sku}
                        onChange={(
                          event
                        ) =>
                          handleSkuChange(
                            row,
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={
                          index === 0
                            ? "Input SKU"
                            : ""
                        }
                        aria-label={`Row ${
                          index + 1
                        } SKU`}
                      />
                    </div>

                    <div className="emdc-budget-cell emdc-budget-linked-cell">
                      {row.name || (
                        <span>
                          [linked from
                          Storage]
                        </span>
                      )}
                    </div>

                    <div className="emdc-budget-cell emdc-budget-linked-cell emdc-budget-number">
                      {row.srp
                        ? formatMoney(
                            row.srp
                          )
                        : (
                          <span>
                            [linked from
                            Storage]
                          </span>
                        )}
                    </div>

                    <div className="emdc-budget-cell emdc-budget-input-cell">
                      <input
                        value={row.qty}
                        onChange={(
                          event
                        ) =>
                          patchRow(
                            row.id,
                            {
                              qty:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        inputMode="decimal"
                        placeholder={
                          index === 0
                            ? "Input QTY"
                            : ""
                        }
                        aria-label={`Row ${
                          index + 1
                        } quantity`}
                      />
                    </div>

                    <div className="emdc-budget-cell emdc-budget-number emdc-budget-calculated-cell">
                      {row.srpValue
                        ? formatMoney(
                            row.srpValue
                          )
                        : ""}
                    </div>
                  </React.Fragment>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="emdc-budget-add-row"
          >
            + Add Row
          </button>

          <div className="emdc-budget-total-block">
            <div className="emdc-budget-total-row">
              <strong>
                Total Product Value
              </strong>

              <output>
                {formatMoney(
                  totalProductValue
                )}
              </output>
            </div>

            <div className="emdc-budget-total-row">
              <strong>
                Total Budget:
              </strong>

              <div>
                <output>
                  {formatMoney(
                    totalBudget
                  )}
                </output>

                <small>
                  (12% of total
                  Product Value)
                </small>
              </div>
            </div>
          </div>

          <h3 className="emdc-budget-split-title">
            Budget Split
          </h3>

          <div className="emdc-budget-split-grid">
            {budgetSplit.map(
              (item) => (
                <div
                  key={item.label}
                  className="emdc-budget-split-item"
                >
                  <strong>
                    {item.label}:
                  </strong>

                  <div>
                    <output>
                      {formatMoney(
                        totalProductValue *
                          item.percent
                      )}
                    </output>

                    <small>
                      ({item.note})
                    </small>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="emdc-budget-panel emdc-budget-affiliate-panel">
          <div className="emdc-budget-table-scroll">
            <div className="emdc-budget-affiliate-table">
              <div className="emdc-budget-table-header emdc-budget-row-label-cell" />

              {[
                "SKU",
                "Value per SKU",
                "Affiliate Sample QTY",
              ].map((label) => (
                <div
                  key={label}
                  className="emdc-budget-table-header"
                >
                  {label}
                </div>
              ))}

              {resolvedRows.map(
                (row, index) => {
                  const valuePerSku =
                    row.srpValue *
                    0.005;

                  const sampleQty =
                    row.srp > 0
                      ? valuePerSku /
                        row.srp
                      : 0;

                  return (
                    <React.Fragment
                      key={`affiliate-${row.id}`}
                    >
                      <div className="emdc-budget-row-label">
                        ROW {index + 1}
                      </div>

                      <div className="emdc-budget-cell emdc-budget-linked-cell">
                        {row.sku}
                      </div>

                      <div className="emdc-budget-cell emdc-budget-number emdc-budget-calculated-cell">
                        {row.sku &&
                        row.srpValue
                          ? formatMoney(
                              valuePerSku
                            )
                          : ""}
                      </div>

                      <div className="emdc-budget-cell emdc-budget-number emdc-budget-calculated-cell">
                        {row.sku &&
                        row.srpValue
                          ? formatQty(
                              sampleQty
                            )
                          : ""}
                      </div>
                    </React.Fragment>
                  );
                }
              )}
            </div>
          </div>

          <div className="emdc-budget-affiliate-formulas">
            <span>
              SKU = SKU from Row
            </span>

            <span>
              Value per SKU =
              SRP Value × 0.5%
            </span>

            <span>
              Affiliate Sample
              QTY = Value per SKU
              ÷ SRP
            </span>
          </div>
        </section>
      </div>

      <style jsx>{`
        .emdc-budget-planner {
          width: 100%;
          color: #111827;
          font-family:
            Inter,
            system-ui,
            sans-serif;
        }

        .emdc-budget-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.5fr)
            minmax(390px, 1fr);
          gap: 28px;
          align-items: start;
        }

        .emdc-budget-panel {
          min-width: 0;
          padding: 26px 24px;
          border: 1px solid
            #334155;
          background: #dce6f7;
        }

        .emdc-budget-table-scroll {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 3px;
        }

        .emdc-budget-product-table {
          min-width: 760px;
          display: grid;
          grid-template-columns:
            72px
            minmax(130px, 1fr)
            minmax(170px, 1.25fr)
            minmax(130px, 0.95fr)
            minmax(115px, 0.9fr)
            minmax(145px, 1fr);
        }

        .emdc-budget-affiliate-table {
          min-width: 520px;
          display: grid;
          grid-template-columns:
            72px
            minmax(130px, 1fr)
            minmax(150px, 1.1fr)
            minmax(170px, 1.2fr);
        }

        .emdc-budget-table-header {
          min-height: 34px;
          padding: 8px 7px 6px;
          display: flex;
          align-items: end;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
        }

        .emdc-budget-row-label-cell {
          background: transparent;
        }

        .emdc-budget-row-label {
          min-height: 34px;
          padding-right: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
        }

        .emdc-budget-cell {
          min-width: 0;
          min-height: 34px;
          padding: 7px 9px;
          display: flex;
          align-items: center;
          border-right: 1px solid
            #4b5563;
          border-bottom: 1px solid
            #4b5563;
          background: #ffffff;
          font-size: 12px;
          line-height: 1.35;
          overflow: hidden;
        }

        .emdc-budget-product-table
          .emdc-budget-table-header:not(
            .emdc-budget-row-label-cell
          ),
        .emdc-budget-affiliate-table
          .emdc-budget-table-header:not(
            .emdc-budget-row-label-cell
          ) {
          border-top: 1px solid
            #4b5563;
          border-right: 1px solid
            #4b5563;
          background: #ffffff;
        }

        .emdc-budget-product-table
          > :nth-child(6n + 2),
        .emdc-budget-affiliate-table
          > :nth-child(4n + 2) {
          border-left: 1px solid
            #4b5563;
        }

        .emdc-budget-linked-cell {
          background: #f7e2d3;
        }

        .emdc-budget-linked-cell span {
          color: #374151;
          font-style: italic;
        }

        .emdc-budget-calculated-cell {
          background: #ffffff;
          font-weight: 700;
        }

        .emdc-budget-number {
          justify-content: flex-end;
          text-align: right;
          font-variant-numeric:
            tabular-nums;
        }

        .emdc-budget-input-cell {
          padding: 0;
        }

        .emdc-budget-input-cell input {
          width: 100%;
          min-width: 0;
          min-height: 33px;
          padding: 7px 9px;
          border: 0;
          outline: none;
          background: #ffffff;
          font-size: 12px;
        }

        .emdc-budget-input-cell
          input::placeholder {
          color: #ef0000;
          font-style: italic;
          font-weight: 700;
          opacity: 1;
        }

        .emdc-budget-input-cell
          input:focus {
          box-shadow: inset
            0 0 0 2px #2563eb;
        }

        .emdc-budget-add-row {
          margin: 10px 0 0 72px;
          padding: 7px 11px;
          border: 1px solid
            #64748b;
          border-radius: 7px;
          background: #ffffff;
          color: #111827;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .emdc-budget-total-block {
          width: min(360px, 100%);
          margin: 18px 42px 0 auto;
          display: grid;
          gap: 18px;
        }

        .emdc-budget-total-row {
          display: grid;
          grid-template-columns:
            minmax(150px, 1fr)
            minmax(130px, 1fr);
          gap: 12px;
          align-items: start;
        }

        .emdc-budget-total-row strong {
          padding-top: 7px;
          text-align: right;
          font-size: 13px;
        }

        .emdc-budget-total-row
          output,
        .emdc-budget-split-item
          output {
          min-height: 32px;
          padding: 7px 9px;
          display: block;
          border: 1px solid
            #64748b;
          background: #ffffff;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
          font-variant-numeric:
            tabular-nums;
        }

        .emdc-budget-total-row small,
        .emdc-budget-split-item small {
          margin-top: 4px;
          display: block;
          color: #ef0000;
          font-size: 10px;
          font-style: italic;
          line-height: 1.3;
          text-align: center;
        }

        .emdc-budget-split-title {
          margin: 24px 0 16px
            72px;
          font-size: 14px;
          font-weight: 900;
        }

        .emdc-budget-split-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          column-gap: 60px;
          row-gap: 24px;
          padding: 0 42px 0 72px;
        }

        .emdc-budget-split-item {
          display: grid;
          grid-template-columns:
            minmax(115px, 0.8fr)
            minmax(135px, 1fr);
          gap: 12px;
          align-items: start;
        }

        .emdc-budget-split-item
          strong {
          padding-top: 7px;
          text-align: right;
          font-size: 13px;
        }

        .emdc-budget-affiliate-formulas {
          margin: 10px 0 0 72px;
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 8px;
          color: #ef0000;
          font-size: 9px;
          font-style: italic;
          font-weight: 700;
          text-align: center;
        }

        @media (
          max-width: 1240px
        ) {
          .emdc-budget-layout {
            grid-template-columns: 1fr;
          }

          .emdc-budget-affiliate-panel {
            width: 100%;
          }
        }

        @media (
          max-width: 760px
        ) {
          .emdc-budget-layout {
            gap: 16px;
          }

          .emdc-budget-panel {
            padding: 18px 12px;
          }

          .emdc-budget-total-block {
            width: 100%;
            margin: 18px 0 0;
          }

          .emdc-budget-total-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .emdc-budget-total-row
            strong {
            padding-top: 0;
            text-align: left;
          }

          .emdc-budget-split-title {
            margin: 22px 0 14px;
          }

          .emdc-budget-split-grid {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 0;
          }

          .emdc-budget-split-item {
            grid-template-columns:
              minmax(110px, 0.8fr)
              minmax(130px, 1fr);
          }

          .emdc-budget-affiliate-formulas {
            min-width: 448px;
            margin-left: 72px;
          }
        }
      `}</style>
    </div>
  );
}
