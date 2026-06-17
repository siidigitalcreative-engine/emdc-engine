export const KEYS = {
  calendarEvents:    "emdc:calendar:events",
  calendarTypes:     "emdc:calendar:types",
  seasonalEvents:    "emdc:events:seasonal",
  checklistGroups:   "emdc:checklists:groups",
  checklistItems:    (id: string) => `emdc:checklists:items:${id}`,
  checklistStatuses: "emdc:checklists:statuses",
  skuBrands:         "emdc:skus:brands",
  skuItems:          "emdc:skus:items",
} as const;
