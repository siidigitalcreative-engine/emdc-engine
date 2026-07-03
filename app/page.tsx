"use client";

import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:"#F8F9FA", surface:"#FFFFFF", surfaceAlt:"#F3F4F6",
  border:"#E5E7EB", borderStrong:"#D1D5DB",
  text:"#111827", textSub:"#374151", muted:"#6B7280", faint:"#9CA3AF",
  accent:"#111827", font:"'Inter', system-ui, -apple-system, sans-serif",
};

// ─── RESPONSIVE HOOK ────────────────────────────────────────────────────────
const getResponsiveWidth = () => {
  if (typeof window === "undefined") return 768;
  const visual = (window as any).visualViewport?.width || window.innerWidth || 768;
  const screenW = window.screen?.width || visual;
  return Math.min(visual, screenW);
};

const useBreakpoint = () => {
  const [w, setW] = useState(getResponsiveWidth);
  useEffect(() => {
    const fn = () => setW(getResponsiveWidth());
    window.addEventListener("resize", fn);
    (window as any).visualViewport?.addEventListener?.("resize", fn);
    window.addEventListener("orientationchange", fn);
    fn();
    return () => {
      window.removeEventListener("resize", fn);
      (window as any).visualViewport?.removeEventListener?.("resize", fn);
      window.removeEventListener("orientationchange", fn);
    };
  }, []);
  return { isMobile: w < 760, isTablet: w < 1024, w };
};

// ─── GLOBAL STYLES (injected once) ──────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    const id = "emdc-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    const existingViewport = document.querySelector('meta[name="viewport"]');
    if (!existingViewport) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";
      document.head.appendChild(meta);
    } else {
      existingViewport.setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover");
    }

    s.textContent = `
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
      html,body{margin:0;width:100%;max-width:100%;overflow-x:hidden;font-family:'Inter',system-ui,sans-serif;}
      body{position:relative;}
      #__next,main{max-width:100%;overflow-x:hidden;}
      input,select,button,textarea{font-family:inherit;max-width:100%;}
      textarea{display:block;}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-track{background:transparent;}
      ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
      .emdc-btn:hover{opacity:.85;}
      .emdc-row:hover{background:#F9FAFB;}
      .emdc-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.07);}
      .emdc-chip:hover{background:#F3F4F6;}
      @media(max-width:759px){
        .hide-mobile{display:none!important;}
        .stack-mobile{flex-direction:column!important;}
        .full-mobile{width:100%!important;}
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const DEPTS = {
  ecommerce:{ label:"E-commerce",      color:"#111827" },
  marketing: { label:"Marketing",       color:"#374151" },
  digital:   { label:"Digital Creative",color:"#6B7280" },
};
const LAUNCH_TYPES = {
  introduction:{ label:"Product Introduction", tag:"New Launch", color:"#111827" },
  campaign:    { label:"Campaign",              tag:"Promo Plan",  color:"#F59E0B" },
  reactivation:{ label:"Product Reactivation",  tag:"Relaunch",   color:"#374151" },
  phaseout:    { label:"Product Phase-Out",      tag:"Closeout",   color:"#9CA3AF" },
};
const STATUS_PALETTE = [
  "#111827","#374151","#6B7280","#9CA3AF",
  "#EF4444","#F97316","#F59E0B","#EAB308",
  "#22C55E","#14B8A6","#3B82F6","#8B5CF6","#EC4899",
];
const DEFAULT_STATUSES = [
  { id:"todo",       label:"To Do",       color:"#9CA3AF" },
  { id:"inprogress", label:"In Progress", color:"#3B82F6" },
  { id:"blocked",    label:"Blocked",     color:"#EF4444" },
  { id:"done",       label:"Done",        color:"#22C55E" },
];
const TEMPLATES = {
  introduction:{
    ecommerce:["Create and activate product listings on Shopee, Lazada, and TikTok Shop","Upload complete product photography (main, variant, lifestyle, infographic)","Write and optimize product title, description, and bullet points","Set up pricing tiers (regular, sale, bundle) across all platforms","Configure inventory allocation per channel via Ginee","Set up platform vouchers and launch-day promotional mechanics","Submit product for platform-level featuring or spotlight badge","Enable Shopify product page and confirm cross-channel sync","Configure shipping class, weight, and fulfillment rules","QA all listings: images, specs, pricing, variants, and stock display"],
    marketing:["Brief campaign concept and messaging direction for launch","Define target audience segments and key messaging pillars","Plan launch campaign timeline with content milestones","Coordinate with KOLs or brand partners for launch seeding","Draft and schedule announcement copy for IG, TikTok, and Facebook","Set up Meta Ads launch campaign (awareness + conversion objectives)","Create paid media brief and allocate launch budget per channel","Plan and schedule TikTok LIVE session for launch day","Write email campaign copy for Klaviyo launch broadcast","Monitor launch-day performance and prepare day-1 report"],
    digital:["Produce primary product photography or CGI renders","Create platform-compliant listing infographics (Shopee, Lazada, TikTok)","Design IG Feed posts, Reels cover, and Stories assets","Produce TikTok launch video (hook, demo, CTA format)","Design Meta Ads creatives (static, carousel, and Story units)","Build product highlight reel or unboxing-style short video","Export all assets in platform-required specs and file formats","Update Shopify product page layout and featured imagery","Deliver Klaviyo email header and banner design","Archive final production files to shared drive with naming convention"],
  },
  campaign:{
    ecommerce:["Map campaign product list and confirm SKU availability per platform","Create campaign product rows for Shopee, Lazada, TikTok Shop, Shopify, and Meta","Set campaign pricing, bundle offers, vouchers, and platform mechanics","Confirm inventory allocation and fulfillment readiness before campaign go-live","QA all campaign listings, product links, prices, variants, and stock display","Prepare campaign schedule with launch date, promo period, and cut-off deadlines","Add campaign product links and final marketplace URLs for team reference","Coordinate flash sale, payday sale, mega sale, and platform ad placements","Track campaign product performance and flag items needing optimization","Finalize campaign post-mortem notes and next action items"],
    marketing:["Define campaign objective, promotion angle, and key selling message","Build campaign content plan for Meta, TikTok, Shopee, Lazada, and website","Create ad copy directions for single image, carousel, collection, Reels, and TikTok ads","Prepare campaign caption sets, hooks, headlines, and CTA variations","Set paid media budget, targeting, retargeting, and optimization schedule","Coordinate affiliate, KOL, livestream, and social posting requirements","Review campaign creative outputs and approve final marketing assets","Monitor campaign performance and update optimization notes","Prepare daily or milestone campaign performance summary","Collect learnings for the next campaign cycle"],
    digital:["Create campaign key visual direction and overall design treatment","Design campaign banners for marketplace, website, Meta, and TikTok placements","Create product image prompts, lifestyle prompts, and creative asset directions","Produce carousel, feed, story, and Reels/TikTok creative layouts","Prepare digital creative asset links table for product image, CEM banner, store banner, feed, story, and showcase video","Generate or upload final creative output links and add approved assets to Overview manually","Export all campaign assets in required sizes and platform-safe formats","QA all creative assets for readability, spacing, product accuracy, and brand consistency","Archive final campaign files with clear naming convention","Update source tabs when Overview cards are edited or finalized"],
  },
  reactivation:{
    // Keep Product Reactivation using the exact same operational template/settings as Product Introduction.
    ecommerce:["Create and activate product listings on Shopee, Lazada, and TikTok Shop","Upload complete product photography (main, variant, lifestyle, infographic)","Write and optimize product title, description, and bullet points","Set up pricing tiers (regular, sale, bundle) across all platforms","Configure inventory allocation per channel via Ginee","Set up platform vouchers and launch-day promotional mechanics","Submit product for platform-level featuring or spotlight badge","Enable Shopify product page and confirm cross-channel sync","Configure shipping class, weight, and fulfillment rules","QA all listings: images, specs, pricing, variants, and stock display"],
    marketing:["Brief campaign concept and messaging direction for launch","Define target audience segments and key messaging pillars","Plan launch campaign timeline with content milestones","Coordinate with KOLs or brand partners for launch seeding","Draft and schedule announcement copy for IG, TikTok, and Facebook","Set up Meta Ads launch campaign (awareness + conversion objectives)","Create paid media brief and allocate launch budget per channel","Plan and schedule TikTok LIVE session for launch day","Write email campaign copy for Klaviyo launch broadcast","Monitor launch-day performance and prepare day-1 report"],
    digital:["Produce primary product photography or CGI renders","Create platform-compliant listing infographics (Shopee, Lazada, TikTok)","Design IG Feed posts, Reels cover, and Stories assets","Produce TikTok launch video (hook, demo, CTA format)","Design Meta Ads creatives (static, carousel, and Story units)","Build product highlight reel or unboxing-style short video","Export all assets in platform-required specs and file formats","Update Shopify product page layout and featured imagery","Deliver Klaviyo email header and banner design","Archive final production files to shared drive with naming convention"],
  },
  phaseout:{
    ecommerce:["Flag SKU(s) internally as phase-out status — notify all stakeholders","Reduce inventory allocation to minimum across channels","Set clearance pricing to accelerate sell-through","Add bundle or bundle-with-replacement offer to redirect demand","Schedule listing deactivation date post-stock depletion","Disable replenishment and purchasing orders for this SKU","Update product title or description to reflect final stock status if needed","Coordinate with warehouse on remaining inventory disposition","Ensure replacement or successor product is ready before full delisting","Document final sales data and channel performance for records"],
    marketing:["Plan final stock clearance campaign with urgency messaging","Draft internal announcement to sales and support teams","Suppress SKU from ongoing paid media campaigns","Redirect any active campaigns toward replacement or alternative product","Create last-chance email send to past purchasers via Klaviyo","Communicate product discontinuation to key affiliates and partners","Update any active landing pages referencing the discontinued SKU","Monitor clearance sell-through rate and adjust promotions accordingly","Archive campaign and performance documentation","Brief team on transition messaging to maintain brand continuity"],
    digital:["Remove product from active featured placements on website and social","Create clearance sale asset set (banners, Stories, Reels)","Update Shopify product page to reflect clearance or final stock status","Suppress discontinued SKU from catalog and collection displays","Produce transition content introducing the replacement product if applicable","Archive all production files, raw assets, and final exports","Update Klaviyo template visuals for clearance email","Remove or replace ads featuring discontinued product","Notify design team to exclude SKU from future campaign briefs","Document asset archive location and update internal file index"],
  },
};

const mergeChecklistLaunchTypesWithDefaults = (saved:any) => {
  const base = { ...LAUNCH_TYPES };
  const safeSaved = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  return {
    ...base,
    ...safeSaved,
    campaign: {
      ...base.campaign,
      ...(safeSaved.campaign || {}),
      label: base.campaign.label,
      tag: base.campaign.tag,
    },
  };
};

const mergeChecklistTemplatesWithDefaults = (saved:any) => {
  const safeSaved = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const merged:any = { ...TEMPLATES, ...safeSaved };
  Object.keys(LAUNCH_TYPES).forEach((typeKey:string)=>{
    merged[typeKey] = { ...(TEMPLATES as any)[typeKey], ...(safeSaved as any)[typeKey] };
    Object.keys(DEPTS).forEach((deptKey:string)=>{
      if (!Array.isArray(merged[typeKey]?.[deptKey])) {
        merged[typeKey][deptKey] = ((TEMPLATES as any)[typeKey]?.[deptKey] || []);
      }
    });
  });

  // Product Reactivation must always mirror Product Introduction settings/tasks.
  // This also migrates older browsers that still have the previous relaunch template saved.
  merged.reactivation = {
    ecommerce:[...(merged.introduction?.ecommerce || [])],
    marketing:[...(merged.introduction?.marketing || [])],
    digital:[...(merged.introduction?.digital || [])],
  };

  return merged;
};

const uid = () => Math.random().toString(36).slice(2,9);
const EMDC_LOCAL_STATE_UPDATED_AT_KEY = "emdc_app_state_local_updated_at_v1";
const markEmdcLocalStateUpdated = (updatedAt = new Date().toISOString()) => {
  if (typeof window === "undefined") return updatedAt;
  try { localStorage.setItem(EMDC_LOCAL_STATE_UPDATED_AT_KEY, updatedAt); } catch {}
  return updatedAt;
};
const getEmdcLocalStateUpdatedAt = () => {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(EMDC_LOCAL_STATE_UPDATED_AT_KEY) || ""; } catch { return ""; }
};
const isIsoTimeNewer = (a:any, b:any, toleranceMs = 500) => {
  const at = Date.parse(String(a || ""));
  const bt = Date.parse(String(b || ""));
  return Number.isFinite(at) && Number.isFinite(bt) && at > bt + toleranceMs;
};
const EMDC_LAST_GOOD_APP_STATE_KEY = "emdc_app_state_last_good_v1";
const EMDC_APP_STATE_HISTORY_KEY = "emdc_app_state_history_v1";
const EMDC_PRE_WRITE_BACKUP_KEY = "emdc_app_state_before_last_write_v1";
const EMDC_PRE_WRITE_HISTORY_KEY = "emdc_app_state_before_last_write_history_v1";
const EMDC_LOCAL_KEY_PREFIX = "emdc";
const EMDC_GROUP_AI_WORKSPACE_PREFIX = "emdc_group_ai_workspace_v1_";
const EMDC_CHECKLIST_ITEMS_PREFIX = "emdc_checklist_items_v1_";
const EMDC_SKU_ITEMS_STORAGE_KEY = "emdc_sku_items_v1";
const EMDC_SKU_ITEMS_COUNT_KEY = "emdc_sku_items_count_v1";
const EMDC_SKU_ITEMS_LAST_GOOD_KEY = "emdc_sku_items_last_good_v1";
const EMDC_SKU_ITEMS_EMPTY_MARKER_KEY = "emdc_sku_items_explicit_empty_v1";
const EMDC_CALENDAR_MANUAL_EVENTS_KEY = "emdc_calendar_manual_events_v1";
const EMDC_SEASONAL_EVENTS_STORAGE_KEY = "emdc_seasonal_events_v1";
const EMDC_CALENDAR_TYPES_STORAGE_KEY = "emdc_calendar_types_v1";
const EMDC_LARGE_SKU_COUNT = 1000;
const EMDC_CLOUD_SKU_CHUNK_SIZE = 250;
const EMDC_CLOUD_LOCAL_STORAGE_CHUNK_SIZE = 260000;

const getEmdcGroupWorkspaceBackupKey = (groupId:any) => `${EMDC_GROUP_AI_WORKSPACE_PREFIX}${String(groupId || "")}`;
const getEmdcChecklistItemsBackupKey = (groupId:any) => `${EMDC_CHECKLIST_ITEMS_PREFIX}${String(groupId || "")}`;

const readEmdcGroupWorkspaceBackups = () => {
  const map:any = {};
  if (typeof window === "undefined") return map;
  try {
    for (let i=0; i<localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (!key.startsWith(EMDC_GROUP_AI_WORKSPACE_PREFIX)) continue;
      const parsed = parseEmdcJson(localStorage.getItem(key));
      const groupId = String(parsed?.groupId || key.replace(EMDC_GROUP_AI_WORKSPACE_PREFIX, ""));
      if (groupId && parsed?.aiWorkspace && typeof parsed.aiWorkspace === "object") {
        map[groupId] = parsed;
      }
    }
  } catch {}
  return map;
};

const writeEmdcGroupWorkspaceBackup = (groupId:any, aiWorkspace:any) => {
  if (typeof window === "undefined" || !groupId || !aiWorkspace || typeof aiWorkspace !== "object") return;
  try {
    localStorage.setItem(getEmdcGroupWorkspaceBackupKey(groupId), JSON.stringify({
      groupId:String(groupId),
      updatedAt:new Date().toISOString(),
      aiWorkspace,
    }));
  } catch {}
};

const readEmdcChecklistItemsBackups = () => {
  const map:any = {};
  if (typeof window === "undefined") return map;
  try {
    for (let i=0; i<localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (!key.startsWith(EMDC_CHECKLIST_ITEMS_PREFIX)) continue;
      const parsed = parseEmdcJson(localStorage.getItem(key));
      const groupId = String(parsed?.groupId || key.replace(EMDC_CHECKLIST_ITEMS_PREFIX, ""));
      if (groupId && parsed?.items && typeof parsed.items === "object") {
        map[groupId] = parsed;
      }
    }
  } catch {}
  return map;
};

const writeEmdcChecklistItemsBackup = (groupId:any, items:any) => {
  if (typeof window === "undefined" || !groupId || !items || typeof items !== "object") return;
  try {
    localStorage.setItem(getEmdcChecklistItemsBackupKey(groupId), JSON.stringify({
      groupId:String(groupId),
      updatedAt:new Date().toISOString(),
      items,
    }));
  } catch {}
};

const readEmdcArrayBackup = (key:string) => {
  if (typeof window === "undefined") return [];
  try {
    const parsed:any = parseEmdcJson(localStorage.getItem(key));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed?.events)) return parsed.events;
    if (Array.isArray(parsed?.types)) return parsed.types;
    return [];
  } catch { return []; }
};

const writeEmdcArrayBackup = (key:string, value:any[], label:string) => {
  if (typeof window === "undefined" || !Array.isArray(value)) return;
  // Do not let a fresh/empty render created by a code update erase a useful event backup.
  if (!value.length) {
    const existing = readEmdcArrayBackup(key);
    if (existing.length) return;
  }
  try {
    localStorage.setItem(key, JSON.stringify({
      label,
      updatedAt:new Date().toISOString(),
      items:value,
    }));
  } catch {}
};

const protectedEmdcArray = (current:any, key:string) => {
  const currentRows = Array.isArray(current) ? current : [];
  const backupRows = readEmdcArrayBackup(key);
  if (!currentRows.length && backupRows.length) return backupRows;
  // If a TSX update or delayed state applies a partial event list, keep the fuller backup.
  // Normal edits are also written back to this backup, so the backup follows real user changes.
  if (backupRows.length > currentRows.length) return backupRows;
  return currentRows;
};

const rememberCalendarEventBackups = (state:any = {}) => {
  try {
    if (Array.isArray(state?.calendarEvents)) writeEmdcArrayBackup(EMDC_CALENDAR_MANUAL_EVENTS_KEY, state.calendarEvents, "manual-calendar-events");
    if (Array.isArray(state?.seasonalEvents)) writeEmdcArrayBackup(EMDC_SEASONAL_EVENTS_STORAGE_KEY, state.seasonalEvents, "events-and-seasons");
    if (Array.isArray(state?.calendarTypes)) writeEmdcArrayBackup(EMDC_CALENDAR_TYPES_STORAGE_KEY, state.calendarTypes, "calendar-tag-types");
  } catch {}
};

const mergeChecklistItemsWithLocalBackups = (items:any = {}) => {
  const base = items && typeof items === "object" && !Array.isArray(items) ? { ...items } : {};
  const backups = readEmdcChecklistItemsBackups();
  Object.keys(backups).forEach((groupId:string)=>{
    if (backups[groupId]?.items && typeof backups[groupId].items === "object") {
      base[groupId] = backups[groupId].items;
    }
  });
  return base;
};

const mergeChecklistGroupsWithWorkspaceBackups = (groups:any[] = []) => {
  if (!Array.isArray(groups) || !groups.length) return Array.isArray(groups) ? groups : [];
  const backups = readEmdcGroupWorkspaceBackups();
  if (!Object.keys(backups).length) return groups;
  return groups.map((group:any)=>{
    const backup = backups[String(group?.id || "")];
    if (!backup?.aiWorkspace || typeof backup.aiWorkspace !== "object") return group;
    return {
      ...group,
      aiWorkspace:{
        ...(group?.aiWorkspace || {}),
        ...(backup.aiWorkspace || {}),
      },
    };
  });
};

const countEmdcChecklistItems = (items:any) => {
  if (!items || typeof items !== "object") return 0;
  return Object.values(items).reduce((sum:number,value:any)=>{
    if (Array.isArray(value)) return sum + value.length;
    if (value && typeof value === "object") return sum + 1;
    return sum;
  },0);
};

const getEmdcExternalSkuCount = (state:any) => {
  const direct = Number(state?.skuItemsExternalCount || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  if (typeof window === "undefined") return 0;
  try {
    const saved = Number(localStorage.getItem(EMDC_SKU_ITEMS_COUNT_KEY) || 0);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
};

const getEmdcAppStateWeight = (state:any) => {
  if (!state || typeof state !== "object") return 0;
  return (Array.isArray(state.skuItems) ? state.skuItems.length : getEmdcExternalSkuCount(state)) +
    (Array.isArray(state.checklistGroups) ? state.checklistGroups.length : 0) +
    countEmdcChecklistItems(state.checklistItems);
};

const parseEmdcJson = (value:any) => {
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return null; }
};

const getExplicitEmptySkuStorageAt = () => {
  if (typeof window === "undefined") return "";
  try {
    const parsed:any = parseEmdcJson(localStorage.getItem(EMDC_SKU_ITEMS_EMPTY_MARKER_KEY));
    return String(parsed?.savedAt || "");
  } catch { return ""; }
};

const markSkuStorageExplicitlyEmpty = (reason="user-cleared-sku-storage") => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EMDC_SKU_ITEMS_EMPTY_MARKER_KEY, JSON.stringify({ savedAt:new Date().toISOString(), reason }));
    localStorage.setItem(EMDC_SKU_ITEMS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(EMDC_SKU_ITEMS_COUNT_KEY, "0");
  } catch {}
};

const clearSkuStorageExplicitEmptyMarker = () => {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(EMDC_SKU_ITEMS_EMPTY_MARKER_KEY); } catch {}
};

const rememberProtectedSkuItems = (skuItems:any[] = [], reason="sku-storage-save") => {
  if (typeof window === "undefined" || !Array.isArray(skuItems)) return;

  if (!skuItems.length) {
    markSkuStorageExplicitlyEmpty(reason);
    return;
  }

  clearSkuStorageExplicitEmptyMarker();
  try {
    localStorage.setItem(EMDC_SKU_ITEMS_STORAGE_KEY, JSON.stringify(skuItems));
    localStorage.setItem(EMDC_SKU_ITEMS_COUNT_KEY, String(skuItems.length));
    localStorage.setItem(EMDC_SKU_ITEMS_LAST_GOOD_KEY, JSON.stringify({
      savedAt:new Date().toISOString(),
      reason,
      count:skuItems.length,
      skuItems,
    }));
  } catch {
    // If storage is tight, keep the primary external SKU key first and avoid older duplicates.
    clearHeavyEmdcLocalBackupKeys();
    try {
      localStorage.setItem(EMDC_SKU_ITEMS_STORAGE_KEY, JSON.stringify(skuItems));
      localStorage.setItem(EMDC_SKU_ITEMS_COUNT_KEY, String(skuItems.length));
    } catch {}
  }
};

const readProtectedSkuItemsBackup = () => {
  if (typeof window === "undefined") return [];
  try {
    const explicitEmptyAt = getExplicitEmptySkuStorageAt();
    const direct = parseEmdcJson(localStorage.getItem(EMDC_SKU_ITEMS_STORAGE_KEY));
    if (Array.isArray(direct) && direct.length) return direct;

    const lastGood:any = parseEmdcJson(localStorage.getItem(EMDC_SKU_ITEMS_LAST_GOOD_KEY));
    const lastGoodAt = String(lastGood?.savedAt || "");
    if (explicitEmptyAt && (!lastGoodAt || !isIsoTimeNewer(lastGoodAt, explicitEmptyAt, 0))) return [];
    if (Array.isArray(lastGood?.skuItems) && lastGood.skuItems.length) return lastGood.skuItems;

    const appState:any = parseEmdcJson(localStorage.getItem("emdc_app_state_v1"));
    if (Array.isArray(appState?.skuItems) && appState.skuItems.length) return appState.skuItems;
  } catch {}
  return [];
};

const readExternalSkuItemsFromLocal = () => {
  if (typeof window === "undefined") return [];
  try {
    const protectedRows = readProtectedSkuItemsBackup();
    if (protectedRows.length) return protectedRows;
    const parsed = parseEmdcJson(localStorage.getItem(EMDC_SKU_ITEMS_STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const hydrateExternalSkuItems = (state:any) => {
  if (!state || typeof state !== "object") return state;
  if (Array.isArray(state.skuItems) && state.skuItems.length) return state;
  if (!state.skuItemsExternal && !state.skuItemsExternalCloud && !state.skuItemsExternalCount) return state;
  const skuItems = readExternalSkuItemsFromLocal();
  return skuItems.length ? { ...state, skuItems } : state;
};

const clearHeavyEmdcLocalBackupKeys = () => {
  if (typeof window === "undefined") return;
  [
    EMDC_PRE_WRITE_BACKUP_KEY,
    EMDC_PRE_WRITE_HISTORY_KEY,
    EMDC_LAST_GOOD_APP_STATE_KEY,
    EMDC_APP_STATE_HISTORY_KEY,
  ].forEach((key:string)=>{ try { localStorage.removeItem(key); } catch {} });
};

const makeLocalStorableEmdcAppState = (state:any) => {
  if (!state || typeof state !== "object") return state;
  const skuItems = Array.isArray(state.skuItems) ? state.skuItems : [];

  // Always keep SKU Storage in its own protected key too. This prevents code updates,
  // partial cloud payloads, or delayed hydration from wiping user-entered SKU rows.
  if (skuItems.length) rememberProtectedSkuItems(skuItems,"make-local-storable-app-state");

  if (skuItems.length < EMDC_LARGE_SKU_COUNT) return state;

  return {
    ...state,
    skuItems:[],
    skuItemsExternal:true,
    skuItemsExternalCount:skuItems.length,
  };
};

const safeSetEmdcAppStateLocal = (state:any) => {
  if (typeof window === "undefined") return false;
  const storable = makeLocalStorableEmdcAppState(state);
  const json = JSON.stringify(storable);
  try {
    localStorage.setItem("emdc_app_state_v1", json);
    return true;
  } catch {
    clearHeavyEmdcLocalBackupKeys();
    try {
      localStorage.setItem("emdc_app_state_v1", json);
      return true;
    } catch {
      return false;
    }
  }
};

const readStoredEmdcAppState = () => {
  if (typeof window === "undefined") return null;
  try { return hydrateExternalSkuItems(parseEmdcJson(localStorage.getItem("emdc_app_state_v1"))); } catch { return null; }
};

const readLastGoodEmdcAppState = () => {
  if (typeof window === "undefined") return null;
  try {
    const parsed:any = parseEmdcJson(localStorage.getItem(EMDC_LAST_GOOD_APP_STATE_KEY));
    if (parsed?.appState) return { ...parsed, appState:hydrateExternalSkuItems(parsed.appState) };
    return hydrateExternalSkuItems(parsed);
  } catch { return null; }
};

const rememberLastGoodEmdcAppState = (state:any) => {
  if (typeof window === "undefined") return;
  if (getEmdcAppStateWeight(state) <= 0) return;

  try {
    if (Array.isArray(state?.skuItems) && state.skuItems.length) rememberProtectedSkuItems(state.skuItems,"last-good-app-state");
    rememberCalendarEventBackups(state);
    const storableState = makeLocalStorableEmdcAppState(state);
    const entry = { savedAt:new Date().toISOString(), appState:storableState };
    localStorage.setItem(EMDC_LAST_GOOD_APP_STATE_KEY, JSON.stringify(entry));

    // Avoid duplicating a 1000+ SKU catalog many times in localStorage.
    // The main app state + external SKU key are the source of truth; history stays lightweight.
    const skuCount = Array.isArray(state?.skuItems) ? state.skuItems.length : getEmdcExternalSkuCount(state);
    const historyEntry = skuCount >= EMDC_LARGE_SKU_COUNT
      ? { savedAt:entry.savedAt, skuItemsExternal:true, skuItemsExternalCount:skuCount, checklistGroupsCount:Array.isArray(state?.checklistGroups)?state.checklistGroups.length:0 }
      : entry;

    const rawHistory = parseEmdcJson(localStorage.getItem(EMDC_APP_STATE_HISTORY_KEY));
    const history = Array.isArray(rawHistory) ? rawHistory : [];
    history.unshift(historyEntry);
    localStorage.setItem(EMDC_APP_STATE_HISTORY_KEY, JSON.stringify(history.slice(0,4)));
  } catch {}
};

const shouldBlockEmptyEmdcState = (nextState:any) => {
  if (getEmdcAppStateWeight(nextState) > 0) return false;
  const current = readStoredEmdcAppState();
  const lastGoodEntry:any = readLastGoodEmdcAppState();
  const lastGood = lastGoodEntry?.appState || lastGoodEntry;
  return Math.max(getEmdcAppStateWeight(current), getEmdcAppStateWeight(lastGood)) > 0;
};

const recommendedCarouselMediaType = (index:number) => ([0,3,7].includes(index) ? "video" : "image");
const PERF_SKU_PICKER_LIMIT = 80;
const PERF_SKU_STORAGE_GROUP_LIMIT = 160;
const PERF_IDLE_SAVE_DELAY = 450;
const PERF_CLOUD_SAVE_DELAY = 500;
const PERF_CLOUD_POLL_INTERVAL = 12000;

const scheduleIdleWork = (cb:()=>void, timeout=900) => {
  if (typeof window === "undefined") return setTimeout(cb, 0);
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === "function") return ric(cb, { timeout });
  return window.setTimeout(cb, Math.min(timeout, 500));
};

const cancelIdleWork = (id:any) => {
  if (typeof window === "undefined" || !id) return;
  const cic = (window as any).cancelIdleCallback;
  if (typeof cic === "function") cic(id);
  else clearTimeout(id);
};

const getDaysInMonth = (y:number,m:number) => new Date(y,m+1,0).getDate();
const getFirstDay    = (y:number,m:number) => new Date(y,m,1).getDay();
const pad = (n:number) => String(n).padStart(2,"0");
const ordinalSuffix = (n:number|string) => { const v=+n%100; if(v>=11&&v<=13) return "th"; switch(+n%10){case 1:return "st";case 2:return "nd";case 3:return "rd";default:return "th";} };
const today = new Date();
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["S","M","T","W","T","F","S"];
const DAYS_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// EVENT_TYPES is now live state inside CalendarView; this is the seed
const DEFAULT_EVENT_TYPES = [
  { id:"task",     label:"Task",     color:"#374151", useColor:false },
  { id:"campaign", label:"Campaign", color:"#F59E0B", useColor:false },
  { id:"deadline", label:"Deadline", color:"#EF4444", useColor:false },
  { id:"launch",   label:"Launch",   color:"#22C55E", useColor:false },
  { id:"meeting",  label:"Meeting",  color:"#3B82F6", useColor:false },
  { id:"seasonal", label:"Seasonal", color:"#3B82F6", useColor:false },
  { id:"holiday",  label:"Holiday",  color:"#9CA3AF", useColor:false },
];

const ensureRequiredCalendarTypes = (types:any[] = []) => {
  const list = Array.isArray(types) ? types : [];
  const required = DEFAULT_EVENT_TYPES.filter((item:any)=>item.id==="seasonal");
  const missing = required.filter((item:any)=>!list.some((type:any)=>type.id===item.id));
  return missing.length ? [...list,...missing] : list;
};
const EVENT_COLORS = ["#111827","#374151","#6B7280","#9CA3AF","#EF4444","#F97316","#F59E0B","#22C55E","#14B8A6","#3B82F6","#8B5CF6","#EC4899"];
const INITIAL_BRANDS = [
  { id:"slique",    name:"Slique",          color:"#111827" },
  { id:"scrubz",    name:"Scrubz",          color:"#111827" },
  { id:"crysalis",  name:"Crysalis",        color:"#111827" },
  { id:"primeo",    name:"Primeo",          color:"#111827" },
  { id:"nest",      name:"Nest Design Lab", color:"#111827" },
  { id:"moderno",   name:"Moderno",         color:"#111827" },
  { id:"fitspire",  name:"Fitspire",        color:"#111827" },
  { id:"graylabel", name:"Gray Label",      color:"#111827" },
  { id:"quencha",   name:"Quencha",         color:"#111827" },
];
const INITIAL_SEASONAL = [
  { id:"s1",  name:"Valentine's Day",            date:"Feb 14",         calDate:`${today.getFullYear()}-02-14`, type:"holiday",  color:"#EC4899",
    desc:"Romance-driven gifting peak. Personal care, fragrances, and couple gifting dominate. Online orders spike 3-5x the week before.", products:["Perfumes & body mists (Shopee PH top category)","Facial skincare sets","Scented candles & diffusers","Couple mugs & tumblers","Chocolate & sweets gift packs"] },
  { id:"s2",  name:"Mother's Day",               date:"2nd Sun of May", calDate:null,                           type:"holiday",  color:"#F97316",
    desc:"One of the top gifting occasions nationally. Premium self-care and home products perform best. Bundles outperform single SKUs.", products:["Skincare & beauty gift sets","Perfume & lotion bundles","Kitchen appliances (air fryer, blender)","Personalized jewelry & accessories","Flowers & hamper combos (Lazada/Shopee top sellers)"] },
  { id:"s3",  name:"Back to School",             date:"June - July",    calDate:`${today.getFullYear()}-06-01`, calDateEnd:`${today.getFullYear()}-07-31`, type:"seasonal", color:"#3B82F6",
    desc:"One of the highest-volume seasons in PH. Practical, value-for-money items dominate. Parents and students both buying.", products:["Insulated water bottles & tumblers","Lunch boxes & food containers","School bags & backpacks","Stationery & organizers","Desk fans & study lamps"] },
  { id:"s4",  name:"Mid-Year Sale (6.6-7.7)",    date:"June - July",    calDate:`${today.getFullYear()}-06-06`, calDateEnd:`${today.getFullYear()}-07-07`, type:"campaign", color:"#F59E0B",
    desc:"Platform-wide mega sale. Electronics, fashion, and home consistently top the charts. Flash deals in the first hour convert best.", products:["Electronics & gadget accessories","Fashion & apparel","Home & living essentials","Beauty & personal care","Sports & fitness gear"] },
  { id:"s5",  name:"Independence Day PH",        date:"June 12",        calDate:`${today.getFullYear()}-06-12`, type:"holiday",  color:"#EF4444",
    desc:"Patriotic sentiment drives Filipino-made and locally inspired purchases. Food, lifestyle, and heritage products do well.", products:["Local food & delicacy gift packs","Filipino-made lifestyle products","Barong & traditional apparel","Home decor with Filipino design","Outdoor & picnic essentials"] },
  { id:"s6",  name:"Ber Months / Christmas Prep", date:"Sep - Nov",     calDate:`${today.getFullYear()}-09-01`, calDateEnd:`${today.getFullYear()}-11-30`, type:"seasonal", color:"#22C55E",
    desc:"PH's Christmas season starts in September — the longest in the world. Gift-buying mindset kicks in early. Hampers and bundles move fast.", products:["Gift hampers & bundles","Christmas decor & lights","Food items & noche buena essentials","Toy & kids gift sets","Premium candles & home fragrance"] },
  { id:"s7",  name:"10.10 / 11.11 Mega Sale",    date:"Oct - Nov",      calDate:`${today.getFullYear()}-10-10`, calDateEnd:`${today.getFullYear()}-11-11`, type:"campaign", color:"#EF4444",
    desc:"Biggest online shopping events of the year in PH. Shoppers wait all year for these. Max discount depth and stock readiness are critical.", products:["Smartphones & earbuds (highest AOV)","Air purifiers & fans","Skincare & beauty megabundles","Cookware & kitchen tools","Fitness equipment & activewear"] },
  { id:"s8",  name:"12.12 Year-End Sale",         date:"Dec 12",         calDate:`${today.getFullYear()}-12-12`, type:"campaign", color:"#8B5CF6",
    desc:"Final major platform sale before Christmas. Last-chance gifting and year-end personal purchases drive volume.", products:["Last-minute Christmas gift sets","Travel bags & luggage","Premium skincare & wellness kits","Smart home devices","Clothing & fashion accessories"] },
  { id:"s9",  name:"Christmas",                   date:"Dec 25",         calDate:`${today.getFullYear()}-12-25`, type:"holiday",  color:"#F59E0B",
    desc:"Highest emotional gifting moment of the year. Premium presentation and gift-ready packaging matter most.", products:["Noche Buena food packs (ham, queso, etc.)","Premium gift sets & hampers","Toys & kids gifts","Home appliances as family gifts","Wines, spirits & celebration items"] },
  { id:"s10", name:"New Year",                    date:"Jan 1",          calDate:`${today.getFullYear()+1}-01-01`, type:"holiday", color:"#6B7280",
    desc:"New year resolution spending — health, fitness, and home reset. Motivational and self-improvement categories spike in January.", products:["Fitness equipment & resistance bands","Insulated water bottles & shakers","Planners, journals & stationery","Home organization & storage","Vitamins & health supplements"] },
  { id:"s11", name:"Women's Month",               date:"March",          calDate:`${today.getFullYear()}-03-01`, type:"seasonal", color:"#A855F7",
    desc:"Empowerment and self-care messaging resonates strongly. Women are both the buyers and the recipients. Beauty and wellness lead.", products:["Premium skincare & serums","Self-care kits & spa sets","Activewear & leggings","Empowerment-themed accessories & bags","Books, journals & wellness products"] },
  { id:"s12", name:"Payday Sales (15th & 30th)",  date:"Monthly",        calDate:null,                           type:"campaign", color:"#14B8A6",
    desc:"Recurring monthly spend spike every 15th and 30th. Everyday essentials and mid-range lifestyle products perform best on these days.", products:["Everyday personal care (body wash, shampoo)","Reusable tumblers & food containers","Affordable fashion & footwear","Home cleaning & organization tools","Snacks & ready-to-eat food packs"] },
];

// ─── BASE COMPONENTS ─────────────────────────────────────────────────────────
const Tag = ({ children, color=C.muted, sm }) => (
  <span style={{ display:"inline-flex",alignItems:"center",padding:sm?"1px 6px":"2px 8px",borderRadius:4,fontSize:sm?10:11,fontWeight:600,letterSpacing:".02em",background:color+"18",color,border:`1px solid ${color}28`,whiteSpace:"nowrap" }}>{children}</span>
);

const Btn = ({ children, onClick, variant="primary", sm, xs, disabled, full, style={} }) => {
  const pad = xs?"4px 10px":sm?"6px 14px":"9px 20px";
  const fs  = xs?11:sm?12:13;
  const base = { display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:pad,fontSize:fs,fontWeight:600,borderRadius:7,border:"none",cursor:disabled?"not-allowed":"pointer",opacity:disabled ? .4 : 1,transition:"all .15s",whiteSpace:"nowrap",width:full?"100%":"auto",...style };
  const v = { primary:{background:C.accent,color:"#fff"},outline:{background:"transparent",color:C.textSub,border:`1px solid ${C.border}`},ghost:{background:"transparent",color:C.muted},danger:{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"} };
  return <button className="emdc-btn" style={{...base,...v[variant]}} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Field = ({ label, hint, children }) => (
  <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
    {label&&<label style={{ fontSize:11,fontWeight:600,color:C.muted,letterSpacing:".05em",textTransform:"uppercase" }}>{label}{hint&&<span style={{ fontWeight:400,textTransform:"none",letterSpacing:0,marginLeft:6,color:C.faint }}>{hint}</span>}</label>}
    {children}
  </div>
);

const TI = ({ value, onChange, placeholder, type="text", style={} }) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
    style={{ width:"100%",height:38,padding:"9px 12px",fontSize:14,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",boxSizing:"border-box",transition:"border-color .15s",...style }}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.border}
  />
);

const DateInput = ({ value, onChange, style={} }) => {
  const recurring = typeof value === "string" && value.startsWith("monthly:");
  const yearly = typeof value === "string" && value.startsWith("yearly:");
  const getModeFromValue = (v:any) => String(v || "").startsWith("monthly:") ? "monthly" : String(v || "").startsWith("yearly:") ? "yearly" : "date";
  const [mode,setMode]=useState(getModeFromValue(value));
  const dateInputRef = useRef<any>(null);
  const yearlyRaw = yearly ? String(value).replace("yearly:","") : (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : `${pad(today.getMonth()+1)}-${pad(today.getDate())}`);
  const yearlyParts = yearlyRaw.split("-");
  const yearlyMonth = /^\d{2}$/.test(yearlyParts[0] || "") ? yearlyParts[0] : pad(today.getMonth()+1);
  const yearlyDayMax = new Date(2024, Number(yearlyMonth), 0).getDate();
  const yearlyDay = pad(Math.min(Math.max(Number(yearlyParts[1]) || 1, 1), yearlyDayMax));
  const setYearlyPart = (nextMonth:any, nextDay:any) => {
    const mm = pad(Number(nextMonth) || 1);
    const max = new Date(2024, Number(mm), 0).getDate();
    const dd = pad(Math.min(Math.max(Number(nextDay) || 1, 1), max));
    onChange(`yearly:${mm}-${dd}`);
  };
  const monthlyDays = recurring ? value.replace("monthly:","").split(",").filter(Boolean) : ["15","30"];
  const [customDay,setCustomDay] = useState("");
  useEffect(()=>{ if(typeof value==="string") setMode(getModeFromValue(value)); },[value]);

  const openNativeDatePicker = () => {
    const el:any = dateInputRef.current;
    if(!el) return;
    try {
      if(typeof el.showPicker === "function") el.showPicker();
      else el.focus();
    } catch {
      try { el.focus(); } catch {}
    }
  };

  const toggleDay = day => {
    const has = monthlyDays.includes(day);
    const next = has ? monthlyDays.filter(d=>d!==day) : [...monthlyDays, day];
    onChange(`monthly:${next.join(",")}`);
  };
  const addCustomDay = () => {
    const n = customDay.trim();
    if (!n || +n<1 || +n>31 || monthlyDays.includes(n)) { setCustomDay(""); return; }
    onChange(`monthly:${[...monthlyDays, n].join(",")}`);
    setCustomDay("");
  };
  const numericDays = monthlyDays.filter(d=>d!=="first"&&d!=="last");

  return (<div style={{display:"flex",flexDirection:"column",gap:8,...style}}>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <Select value={mode} onChange={v=>{
        setMode(v);
        if(v==="monthly") onChange(`monthly:${monthlyDays.join(",")}`);
        else if(v==="yearly") {
          const base = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : yearly ? String(value).replace("yearly:","") : `${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
          onChange(`yearly:${base}`);
        }
        else onChange("");
      }} style={{width:170,flexShrink:0}}>
        <option value="date">Specific date</option>
        <option value="yearly">Recurring yearly</option>
        <option value="monthly">Recurring monthly</option>
      </Select>
      {mode==="date" && (
        <div onClick={openNativeDatePicker} style={{ flex:1,position:"relative",cursor:"pointer" }}>
          <input
            ref={dateInputRef}
            type="date"
            value={(recurring||yearly)?"":(value||"")}
            onClick={openNativeDatePicker}
            onFocus={openNativeDatePicker}
            onChange={e=>onChange(e.target.value)}
            style={{ width:"100%",height:38,padding:"9px 12px",fontSize:14,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",colorScheme:"light",fontFamily:"inherit",boxSizing:"border-box",cursor:"pointer" }}
          />
        </div>
      )}
      {mode==="yearly" && (
        <div style={{ flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          <Select value={yearlyMonth} onChange={(m:any)=>setYearlyPart(m, yearlyDay)} style={{height:38}}>
            {MONTHS_SHORT.map((m,i)=><option key={m} value={pad(i+1)}>{m}</option>)}
          </Select>
          <Select value={yearlyDay} onChange={(d:any)=>setYearlyPart(yearlyMonth, d)} style={{height:38}}>
            {Array.from({length:yearlyDayMax},(_,i)=>pad(i+1)).map(d=><option key={d} value={d}>{Number(d)}</option>)}
          </Select>
        </div>
      )}
    </div>
    {mode==="yearly" && <span style={{fontSize:11,color:C.muted}}>Repeats every year on this same month and day.</span>}
    {mode==="monthly" && (
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{id:"first",label:"First day"},{id:"last",label:"Last day"}].map(opt=>{
            const active = monthlyDays.includes(opt.id);
            return (
              <button key={opt.id} type="button" onClick={()=>toggleDay(opt.id)}
                style={{ padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",
                  border:`1.5px solid ${active?C.accent:C.border}`,
                  background:active?C.accent:C.surface, color:active?"#fff":C.textSub }}>
                {opt.label}
              </button>
            );
          })}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {numericDays.map(d=>(
            <span key={d} onClick={()=>toggleDay(d)} style={{ cursor:"pointer",padding:"4px 9px",borderRadius:6,fontSize:12,fontWeight:600,background:C.accent+"18",color:C.accent,border:`1px solid ${C.accent}28`,display:"inline-flex",alignItems:"center",gap:5 }}>
              Day {d} <span style={{fontSize:11}}>&#215;</span>
            </span>
          ))}
          <input type="text" value={customDay} placeholder="+ day (1-31)"
            onChange={e=>setCustomDay(e.target.value.replace(/[^0-9]/g,""))}
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addCustomDay(); } }}
            onBlur={addCustomDay}
            style={{ width:96,height:30,padding:"4px 10px",fontSize:12,borderRadius:6,border:`1.5px solid ${C.border}`,outline:"none" }} />
        </div>
        {monthlyDays.length===0&&<span style={{fontSize:11,color:C.faint}}>Select at least one day, or First/Last day.</span>}
      </div>
    )}
  </div>);
};

const monthOnlyValues = (value:any) => Array.isArray(value)
  ? value.map((v:any)=>Number(v)).filter((n:number)=>Number.isFinite(n)&&n>=0&&n<12)
  : [];

const formatMonthOnlyLabel = (months:any[]) => {
  const vals = monthOnlyValues(months).sort((a:number,b:number)=>a-b);
  if (!vals.length) return "";
  return vals.map((m:number)=>MONTHS_SHORT[m]).join(" / ");
};

const MonthOnlyPicker = ({ value=[], onChange }: any) => {
  const selected = monthOnlyValues(value);
  const toggle = (idx:number) => {
    const exists = selected.includes(idx);
    const next = exists ? selected.filter((m:number)=>m!==idx) : [...selected,idx];
    onChange(next.sort((a:number,b:number)=>a-b));
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(72px,1fr))",gap:6 }}>
        {MONTHS_SHORT.map((month:string,idx:number)=>{
          const active = selected.includes(idx);
          return (
            <button key={month} type="button" onClick={()=>toggle(idx)}
              style={{ height:32,borderRadius:8,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accent:C.surface,color:active?"#fff":C.textSub,fontSize:12,fontWeight:700,cursor:"pointer" }}>
              {month}
            </button>
          );
        })}
      </div>
      {selected.length>0&&(
        <button type="button" onClick={()=>onChange([])}
          style={{ alignSelf:"flex-start",border:"none",background:"transparent",color:"#DC2626",fontSize:11,fontWeight:700,cursor:"pointer",padding:0 }}>
          Clear month-only selection
        </button>
      )}
    </div>
  );
};

const Select = ({ value, onChange, children, style={} }) => {
  const layoutStyle:any = style || {};
  const wrapperStyle:any = {
    position:"relative",
    width:layoutStyle.width || "100%",
    minWidth:layoutStyle.minWidth,
    maxWidth:layoutStyle.maxWidth,
    flex:layoutStyle.flex,
    flexShrink:layoutStyle.flexShrink,
  };

  const selectStyle:any = {
    width:"100%",
    height:layoutStyle.height || 40,
    padding:layoutStyle.padding || "0 30px 0 12px",
    fontSize:14,
    fontWeight:400,
    borderRadius:10,
    border:`1.5px solid ${C.border}`,
    background:C.surface,
    color:C.text,
    outline:"none",
    cursor:"pointer",
    appearance:"none",
    WebkitAppearance:"none",
    MozAppearance:"none",
    boxSizing:"border-box",
    lineHeight:"normal",
    whiteSpace:"nowrap",
    overflow:"hidden",
    textOverflow:"ellipsis",
    transition:"border-color .15s, box-shadow .15s",
    ...layoutStyle,
  };

  delete selectStyle.minWidth;
  delete selectStyle.maxWidth;
  delete selectStyle.flex;
  delete selectStyle.flexShrink;
  selectStyle.width = "100%";
  selectStyle.padding = layoutStyle.padding || "0 30px 0 12px";
  selectStyle.appearance = "none";
  selectStyle.WebkitAppearance = "none";
  selectStyle.MozAppearance = "none";
  selectStyle.background = layoutStyle.background || C.surface;
  selectStyle.fontWeight = layoutStyle.fontWeight || 400;

  return (
    <div style={wrapperStyle}>
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={selectStyle}
        onFocus={e=>{
          e.currentTarget.style.borderColor = C.accent;
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,.06)";
        }}
        onBlur={e=>{
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        style={{
          position:"absolute",
          right:12,
          top:"50%",
          transform:"translateY(-50%)",
          pointerEvents:"none",
          color:C.muted,
          fontSize:10,
          lineHeight:1,
        }}
      >
        ▾
      </span>
    </div>
  );
};

const Divider = ({ my=16 }) => <div style={{ height:1,background:C.border,margin:`${my}px 0` }} />;

const Modal = ({ open, onClose, onBack, title, width=480, children }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0 }}
      onClick={onClose}
      // On tablet+ center it
      onMouseEnter={e=>{ if(window.innerWidth>=640) { e.currentTarget.style.alignItems="center"; e.currentTarget.style.padding="16px"; } }}>
      <div style={{ background:C.surface,borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxWidth:width,
        boxShadow:"0 -4px 32px rgba(0,0,0,.16)",maxHeight:"92vh",overflowY:"auto",
        ...(window.innerWidth>=640?{borderRadius:14,padding:28}:{}) }}
        onClick={e=>e.stopPropagation()}>
        {/* Drag handle (mobile) */}
        {window.innerWidth<640&&<div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px" }} />}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {onBack&&<button onClick={onBack} style={{ width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:15,flexShrink:0 }}>&#8249;</button>}
            <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:C.text }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:16,flexShrink:0 }}>&#215;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const CUSTOM_COLOR_KEY = "emdc_custom_colors_v1";

const getSavedCustomColors = () => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COLOR_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((c:any)=>/^#[0-9A-F]{6}$/i.test(String(c))) : [];
  } catch {
    return [];
  }
};

const setSavedCustomColors = (colors:any[]) => {
  if (typeof window === "undefined") return [];
  const next = Array.from(new Set(
    (colors||[])
      .map((c:any)=>String(c||"").toUpperCase())
      .filter((c:string)=>/^#[0-9A-F]{6}$/i.test(c))
  )).slice(0,24);

  localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("emdc-custom-colors-updated", { detail: next }));
  return next;
};

const saveCustomColorToStorage = (color:string, replaceColor?:string|null) => {
  if (typeof window === "undefined") return [];
  const clean = String(color || "").toUpperCase();
  if (!/^#[0-9A-F]{6}$/i.test(clean)) return getSavedCustomColors();

  const current = getSavedCustomColors().map((c:string)=>String(c).toUpperCase());
  const replaceClean = replaceColor ? String(replaceColor).toUpperCase() : "";

  let next = current;
  if (replaceClean && current.includes(replaceClean)) {
    next = current.map((c:string)=>c===replaceClean ? clean : c);
  } else {
    next = [clean,...current];
  }

  return setSavedCustomColors(next);
};

const ColorPicker = ({ value, onChange, palette=STATUS_PALETTE }) => {
  const [customColors,setCustomColors] = useState<any[]>(()=>getSavedCustomColors());
  const [draftColor,setDraftColor] = useState(value || "#111827");
  const [editingSavedColor,setEditingSavedColor] = useState<any>(null);

  useEffect(()=>{
    const next = value || "#111827";
    setDraftColor(next);
    if (!getSavedCustomColors().map((c:string)=>String(c).toUpperCase()).includes(String(next).toUpperCase())) {
      setEditingSavedColor(null);
    }
  },[value]);

  useEffect(()=>{
    if (typeof window === "undefined") return;
    const sync = () => setCustomColors(getSavedCustomColors());
    window.addEventListener("storage", sync);
    window.addEventListener("emdc-custom-colors-updated", sync as any);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("emdc-custom-colors-updated", sync as any);
    };
  },[]);

  const basePalette = palette || [];
  const mergedPalette = Array.from(new Set([...basePalette,...customColors]));
  const normalizedCustomColors = customColors.map((c:any)=>String(c).toUpperCase());
  const isSavedCustom = normalizedCustomColors.includes(String(value || draftColor).toUpperCase());

  const pickColor = (color:any) => {
    const clean = String(color || "").toUpperCase();
    setDraftColor(clean);
    onChange(clean);
    setEditingSavedColor(normalizedCustomColors.includes(clean) ? clean : null);
  };

  const saveCurrentColor = () => {
    const clean = String(draftColor || value || "").toUpperCase();
    const next = saveCustomColorToStorage(clean, editingSavedColor);
    setCustomColors(next);
    setEditingSavedColor(clean);
    onChange(clean);
  };

  const removeCurrentCustomColor = () => {
    const clean = String(editingSavedColor || value || draftColor || "").toUpperCase();
    const next = setSavedCustomColors(customColors.filter((c:any)=>String(c).toUpperCase()!==clean));
    setCustomColors(next);
    setEditingSavedColor(null);
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
        {mergedPalette.map((c:any)=>(
          <button key={c} type="button" onClick={()=>pickColor(c)} title={String(c).toUpperCase()}
            style={{ width:28,height:28,borderRadius:6,background:c,border:String(value).toUpperCase()===String(c).toUpperCase()?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer",flexShrink:0,transition:"transform .1s",transform:String(value).toUpperCase()===String(c).toUpperCase()?"scale(1.1)":"scale(1)" }} />
        ))}
        <label style={{ width:28,height:28,borderRadius:6,border:`1.5px solid ${C.border}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.faint,position:"relative",flexShrink:0 }} title="Create custom color">
          <input type="color" value={draftColor || value || "#111827"} onChange={e=>{ setEditingSavedColor(null); setDraftColor(e.target.value); onChange(e.target.value); }} style={{ width:1,height:1,opacity:0,position:"absolute" }} />
          +
        </label>
      </div>

      {draftColor&&(
        <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
          <span style={{ width:24,height:24,borderRadius:6,background:draftColor,border:`1px solid ${C.border}`,display:"inline-block" }} />
          <span style={{ fontSize:11,color:C.muted,fontFamily:"monospace",fontWeight:700 }}>{String(draftColor).toUpperCase()}</span>
          <Btn xs variant="outline" onClick={saveCurrentColor}>{editingSavedColor ? "Save Edit" : "Save Color"}</Btn>

          <label style={{ height:28,padding:"0 12px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.accent,color:"#fff",fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",overflow:"hidden" }}>
            <input type="color" value={draftColor || value || "#111827"} onChange={e=>{ setDraftColor(e.target.value); onChange(e.target.value); }} style={{ width:1,height:1,opacity:0,position:"absolute" }} />
            Edit
          </label>

          {isSavedCustom&&(
            <Btn xs variant="danger" onClick={removeCurrentCustomColor}>Remove</Btn>
          )}
        </div>
      )}
    </div>
  );
};

// Empty state component
const Empty = ({ icon="", title, sub, action }) => (
  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 24px",textAlign:"center" }}>
    {icon&&<div style={{ fontSize:32,marginBottom:12,opacity:.4 }}>{icon}</div>}
    <p style={{ margin:"0 0 6px",fontSize:15,fontWeight:600,color:C.textSub }}>{title}</p>
    {sub&&<p style={{ margin:"0 0 20px",fontSize:13,color:C.muted,maxWidth:280 }}>{sub}</p>}
    {action}
  </div>
);

// ─── SKU PICKER ──────────────────────────────────────────────────────────────
const SKUPicker = ({ skuStorage, brands, onSelect, placeholder="Search SKU storage...", multiSelect=false, selectedIds=[] }) => {
  const { isMobile } = useBreakpoint();
  const [query,setQuery] = useState("");
  const [open,setOpen]   = useState(false);
  const [brandFilter,setBrandFilter] = useState("all");
  const [categoryFilter,setCategoryFilter] = useState("all");
  const ref = useRef(null);

  const selectedSet = useMemo(()=>new Set(selectedIds || []),[selectedIds]);

  const getPickerCollection = (s:any) => {
    const direct = [s.collection,s.category,s.productCategory].map(v=>String(v||"").trim()).find(Boolean);
    if(direct) return direct;

    const extra = s.extraFields || {};
    const normalize = (value:any) => String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
    const key = Object.keys(extra).find((k:string)=>{
      const clean = normalize(k);
      return clean==="collection" || clean==="category" || clean.includes("collection") || clean.includes("category");
    });
    return key ? String(extra[key]||"").trim() : "";
  };

  const brandOptions = useMemo(()=>{
    const used = new Set((skuStorage||[]).map((s:any)=>s.brandId).filter(Boolean));
    return (brands||[])
      .filter((brand:any)=>used.has(brand.id))
      .sort((a:any,b:any)=>String(a.name||"").localeCompare(String(b.name||"")));
  },[skuStorage,brands]);

  const categoryOptions = useMemo(()=>{
    const set = new Set<string>();
    (skuStorage||[])
      .filter((s:any)=>brandFilter==="all" || s.brandId===brandFilter)
      .forEach((s:any)=>{
        const value = getPickerCollection(s);
        if(value) set.add(value);
      });
    return Array.from(set).sort((a:string,b:string)=>a.localeCompare(b));
  },[skuStorage,brandFilter]);

  useEffect(()=>{
    if(brandFilter==="all") return;
    if(!brandOptions.some((brand:any)=>brand.id===brandFilter)) setBrandFilter("all");
  },[brandFilter,brandOptions]);

  useEffect(()=>{
    if(categoryFilter==="all") return;
    if(!categoryOptions.includes(categoryFilter)) setCategoryFilter("all");
  },[categoryFilter,categoryOptions]);

  const results = useMemo(() => {
    const rawQ = query.trim();
    const q = rawQ.toLowerCase();
    const compactQ = q.replace(/[^a-z0-9]+/g,"");
    const qLooksLikeSku = /[a-z]+[-_][a-z0-9_-]+/i.test(rawQ) || /\d/.test(rawQ);
    const normalizedTerms = q.split(/\s+/).map((term:string)=>term.trim()).filter((term:string)=>term.length>=2);
    const tagSearchTerms = ["phaseout","phase out","phase-out","phase_out","clearance","launch","relaunch","campaign","seasonal","holiday","deadline"];
    const qLooksLikeTag = tagSearchTerms.some((tag:string)=>tag.replace(/[^a-z0-9]+/g,"")===compactQ || tag.toLowerCase()===q);

    const normalizeCompact = (value:any) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
    const normalizeLoose = (value:any) => String(value || "").toLowerCase();

    const list = (skuStorage||[]).filter((s:any) => {
      const brandName = brands.find((b:any)=>b.id===s.brandId)?.name || "";
      const collectionName = getPickerCollection(s);
      const directTagValues = getSkuTags(s).filter(Boolean);
      const directTagText = directTagValues.join(" ");
      const fallbackTagText = getSkuTagText(s);
      const tagText = directTagText || fallbackTagText;
      const extraValues = Object.values(s.extraFields || {}).join(" ");

      if(brandFilter!=="all" && s.brandId !== brandFilter) return false;
      if(categoryFilter!=="all" && collectionName !== categoryFilter) return false;

      if(!q) return true;
      if(!compactQ) return false;

      const searchableMain = [
        s.sku,
        s.productName,
        brandName,
        collectionName,
        s.collection,
        s.category,
        s.productCategory,
        tagText,
        getSkuTagText(s),
      ].filter(Boolean).map(normalizeLoose);

      const compactMain = searchableMain.map(normalizeCompact);

      const skuCompact = normalizeCompact(s.sku);
      const productCompact = normalizeCompact(s.productName);
      const brandCompact = normalizeCompact(brandName);
      const collectionCompact = normalizeCompact(collectionName);
      const tagCompact = normalizeCompact(tagText);
      const directTagCompact = normalizeCompact(directTagText || fallbackTagText);
      const extraCompact = normalizeCompact(extraValues);

      // Tag search should match actual SKU tags only.
      // Example: "phase out" should NOT show all SKUs just because another hidden field loosely matches.
      if(qLooksLikeTag){
        return !!directTagCompact && (directTagCompact.includes(compactQ) || compactQ.includes(directTagCompact));
      }

      // Strict search behavior:
      // While typing, show only rows that actually match the typed text.
      // Example: PRM-F will only show rows whose SKU/product/brand/category/tag contains PRMF.
      if(qLooksLikeSku || compactQ.length <= 4){
        const strictFields = [
          skuCompact,
          productCompact,
          brandCompact,
          collectionCompact,
          tagCompact,
        ].filter(Boolean);

        return strictFields.some((field:string)=>field.includes(compactQ)) ||
          searchableMain.some((field:string)=>field.includes(q));
      }

      return searchableMain.some((field:string)=>field.includes(q)) ||
        [skuCompact,productCompact,brandCompact,collectionCompact,tagCompact].some((field:string)=>field.includes(compactQ)) ||
        normalizedTerms.every((term:string)=>{
          const compactTerm = normalizeCompact(term);
          if(compactTerm.length < 2) return false;
          return searchableMain.some((field:string)=>field.includes(term)) ||
            [skuCompact,productCompact,brandCompact,collectionCompact,tagCompact].some((field:string)=>field.includes(compactTerm));
        });
    });

    return list;
  }, [query,skuStorage,brands,brandFilter,categoryFilter]);

  const visibleResults = useMemo(()=>results.slice(0,PERF_SKU_PICKER_LIMIT),[results]);

  useEffect(()=>{
    const fn = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[]);

  const handlePick = (s:any) => {
    onSelect(s);
    if (!multiSelect) {
      setQuery("");
      setOpen(false);
    }
  };

  const selectAllVisible = () => {
    if (!multiSelect) return;
    visibleResults.forEach((s:any)=>{
      if (!selectedSet.has(s.id)) onSelect(s);
    });
  };

  const unselectAllVisible = () => {
    if (!multiSelect) return;
    visibleResults.forEach((s:any)=>{
      if (selectedSet.has(s.id)) onSelect(s);
    });
  };

  const clearSelectedSkus = () => {
    if (!multiSelect) return;
    (skuStorage||[]).forEach((s:any)=>{
      if (selectedSet.has(s.id)) onSelect(s);
    });
  };

  return (
    <div ref={ref} style={{ position:"relative",display:"flex",flexDirection:"column",gap:8 }}>
      {(brandOptions.length>0 || categoryOptions.length>0)&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {brandOptions.length>0&&(
            <Select value={brandFilter} onChange={v=>{ setBrandFilter(v); setCategoryFilter("all"); setOpen(true); }}>
              <option value="all">All Brands</option>
              {brandOptions.map((brand:any)=><option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </Select>
          )}

          {categoryOptions.length>0&&(
            <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:8,alignItems:"center" }}>
              <Select value={categoryFilter} onChange={v=>{ setCategoryFilter(v); setOpen(true); }}>
                <option value="all">All Collections / Categories</option>
                {categoryOptions.map((option:string)=><option key={option} value={option}>{option}</option>)}
              </Select>
              {(brandFilter!=="all" || categoryFilter!=="all")&&(
                <button type="button" onClick={()=>{ setBrandFilter("all"); setCategoryFilter("all"); setOpen(true); }}
                  style={{ height:40,border:`1.5px solid ${C.border}`,background:C.surfaceAlt,borderRadius:8,padding:"0 10px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer",whiteSpace:"nowrap" }}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <TI value={query} onChange={v=>{setQuery(v);setOpen(true);}} placeholder={placeholder}
        style={{ paddingLeft:12 }}
        onFocus={()=>setOpen(true)}
      />
      {open&&(
        <div style={{
          position:"relative",
          width:"100%",
          maxWidth:"100%",
          marginTop:6,
          background:C.surface,
          border:`1.5px solid ${C.border}`,
          borderRadius:10,
          boxShadow:"0 8px 28px rgba(15,23,42,.10)",
          zIndex:50,
          maxHeight:isMobile?"min(52vh, 420px)":"min(46vh, 440px)",
          overflowY:"auto",
          WebkitOverflowScrolling:"touch"
        }}>
          <div style={{ position:"sticky",top:0,zIndex:1,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontSize:11,color:C.muted,fontWeight:700 }}>
              {results.length} SKU{results.length===1?"":"s"} found{results.length>PERF_SKU_PICKER_LIMIT?` · showing first ${PERF_SKU_PICKER_LIMIT}`:""}{brandFilter!=="all"?` · ${(brands||[]).find((b:any)=>b.id===brandFilter)?.name || "Brand"}`:""}{categoryFilter!=="all"?` · ${categoryFilter}`:""}
            </span>
            {multiSelect&&results.length>0&&(
              <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                <button type="button" onMouseDown={e=>{e.preventDefault();selectAllVisible();}} style={{ border:`1px solid ${C.border}`,background:C.surfaceAlt,borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:700,color:C.textSub,cursor:"pointer" }}>
                  Select all visible
                </button>
                <button type="button" onMouseDown={e=>{e.preventDefault();unselectAllVisible();}} style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer" }}>
                  Unselect visible
                </button>
              </div>
            )}
          </div>

          {results.length===0&&(
            <div style={{ padding:16,fontSize:12,color:C.muted,textAlign:"center" }}>
              {query.trim() ? `No results found for "${query.trim()}".` : "No matching SKUs found."}
            </div>
          )}

          {visibleResults.map((s:any)=>{ const brand=brands.find((b:any)=>b.id===s.brandId); const checked=selectedSet.has(s.id); const collectionName=getPickerCollection(s); return (
            <div key={s.id} onMouseDown={e=>{ e.preventDefault(); handlePick(s); }}
              className="emdc-row"
              style={{ padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,background:checked?C.surfaceAlt:C.surface }}>
              {multiSelect&&(
                <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${checked?C.accent:C.borderStrong}`,background:checked?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {checked&&<span style={{ color:"#fff",fontSize:10,lineHeight:1 }}>&#10003;</span>}
                </div>
              )}
              <div style={{ minWidth:0,flex:1 }}>
                <div style={{ fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.productName}</div>
                <div style={{ fontSize:11,color:C.muted,display:"flex",gap:8,marginTop:2,alignItems:"center",flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace",background:C.surfaceAlt,padding:"1px 5px",borderRadius:3 }}>{s.sku}</span>
                  {brand&&<span style={{ display:"flex",alignItems:"center",gap:3 }}><span style={{ width:6,height:6,borderRadius:"50%",background:brand.color,display:"inline-block",flexShrink:0 }}></span>{brand.name}</span>}
                  {collectionName&&<span style={{ background:C.surfaceAlt,padding:"1px 5px",borderRadius:3 }}>{collectionName}</span>}
                  {getSkuTags(s).slice(0,2).map((tag:string)=><span key={tag} style={{ background:"#FFF7ED",color:"#C2410C",padding:"1px 5px",borderRadius:3,fontWeight:800 }}>{tag}</span>)}
                </div>
              </div>
              <span style={{ fontSize:11,fontWeight:600,color:s.inventory===0?"#EF4444":C.faint,flexShrink:0 }}>{s.inventory===0?"No stock":s.inventory+" u"}</span>
            </div>
          );})}

          {multiSelect&&(
            <div style={{ position:"sticky",bottom:0,zIndex:2,background:C.surface,borderTop:`1px solid ${C.border}`,padding:10,display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ flex:1,minWidth:0,fontSize:11,color:C.muted,fontWeight:700 }}>
                {selectedSet.size} selected SKU{selectedSet.size!==1?"s":""}
              </div>
              {selectedSet.size>0&&(
                <button
                  type="button"
                  onMouseDown={e=>{ e.preventDefault(); clearSelectedSkus(); }}
                  style={{ height:34,padding:"0 12px",border:`1px solid ${C.border}`,borderRadius:8,background:C.surfaceAlt,color:"#DC2626",fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0 }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onMouseDown={e=>{ e.preventDefault(); setOpen(false); }}
                style={{ height:34,padding:"0 16px",border:"none",borderRadius:8,background:C.accent,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",flexShrink:0 }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const phaseoutProductLabel = (sku:any, brands:any[]=[]) => {
  if (!sku) return "";
  if (sku.value && !sku.sku) return `Phase-out: ${sku.value}`;
  const brand = brands.find((b:any)=>b.id===sku.brandId)?.name || "";
  return `Phase-out: ${[brand,sku.productName,sku.sku].filter(Boolean).join(" - ")}`;
};

const isPhaseoutProduct = (value:any) => {
  const txt = String(value || "").toLowerCase();
  return txt.includes("phase-out") || txt.includes("phaseout") || txt.includes("closeout") || txt.includes("clearance");
};

const cleanPhaseoutProductLabel = (value:any) => String(value || "")
  .replace(/^\s*(phase\s*-?\s*out|phaseout|closeout|clearance)\s*:\s*/i,"")
  .trim();

const normalizeSkuTagKey = (value:any) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[-_]+/g," ")
  .replace(/\s+/g," ");

const prettySkuTagLabel = (value:any) => {
  const clean = String(value || "").trim().replace(/[-_]+/g," ").replace(/\s+/g," ");
  return clean ? clean.replace(/\b\w/g,(m:string)=>m.toUpperCase()) : "";
};

const getSkuTagText = (sku:any) => {
  const extra = sku?.extraFields || {};
  const extraKey = Object.keys(extra).find((key:string)=>normalizeSkuTagKey(key)==="tag" || normalizeSkuTagKey(key)==="tags");
  return String(sku?.tag || sku?.tags || (extraKey ? extra[extraKey] : "") || "").trim();
};

const splitSkuTags = (value:any) => Array.from(new Map(
  String(value || "")
    .split(/[;,|\n]/)
    .map((tag:string)=>tag.trim())
    .filter(Boolean)
    .map((tag:string)=>[normalizeSkuTagKey(tag), prettySkuTagLabel(tag)])
).values());

const getSkuTags = (sku:any) => splitSkuTags(getSkuTagText(sku));

const getSkuCollectionCategory = (sku:any) => {
  const extra = sku?.extraFields || {};
  const normalize = (value:any) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"");
  const categoryKey = Object.keys(extra).find((key:string)=>{
    const k = normalize(key);
    return k==="category" || k==="collection" || k==="collectioncategory" || k==="productcategory";
  });
  return String(
    sku?.collection ||
    sku?.category ||
    sku?.productCategory ||
    (categoryKey ? extra[categoryKey] : "") ||
    ""
  ).trim();
};

const hasSkuTag = (sku:any, tag:any) => {
  const target = normalizeSkuTagKey(tag);
  return getSkuTags(sku).some((item:string)=>normalizeSkuTagKey(item)===target);
};

const isPhaseoutSkuByTag = (sku:any) => getSkuTags(sku).some((tag:string)=>{
  const key = normalizeSkuTagKey(tag);
  return key==="phase out" || key==="phaseout" || key==="phase out sku" || key.includes("phase out");
});

const setSkuTagsOnItem = (sku:any, tagText:any) => {
  const cleanTags = splitSkuTags(tagText).join(", ");
  const extra = { ...(sku?.extraFields || {}) };
  const tagKey = Object.keys(extra).find((key:string)=>normalizeSkuTagKey(key)==="tag" || normalizeSkuTagKey(key)==="tags") || "Tag";
  if(cleanTags) extra[tagKey] = cleanTags;
  else delete extra[tagKey];
  return { ...sku, tag:cleanTags, extraFields:extra };
};

const removeSkuTagFromItem = (sku:any, tagToRemove:any) => {
  const target = normalizeSkuTagKey(tagToRemove);
  const nextTags = getSkuTags(sku).filter((tag:string)=>normalizeSkuTagKey(tag)!==target);
  return setSkuTagsOnItem(sku,nextTags.join(", "));
};

const normalizePhaseoutText = (value:any) => String(value || "")
  .toLowerCase()
  .replace(/&/g," and ")
  .replace(/[^a-z0-9]+/g," ")
  .trim();

const phaseoutTokens = (value:any) => normalizePhaseoutText(value)
  .split(/\s+/)
  .filter((token:string)=>token.length>=3)
  .filter((token:string)=>!["the","and","for","with","from","into","product","item","sku"].includes(token));

const phaseoutHasAny = (text:string, terms:string[]) => terms.some((term:string)=>text.includes(term));

const getSkuPhaseoutProfile = (sku:any, brands:any[]=[]) => {
  const brand = brands.find((b:any)=>b.id===sku.brandId)?.name || "";
  const extraText = Object.entries(sku.extraFields || {})
    .map(([key,value]:any)=>`${key} ${value}`)
    .join(" ");

  const rawText = [
    sku.productName,
    sku.sku,
    sku.collection,
    sku.category,
    sku.productCategory,
    brand,
    extraText,
    sku.value,
  ].filter(Boolean).join(" ");

  const text = normalizePhaseoutText(rawText);
  const tokens = Array.from(new Set(phaseoutTokens(rawText)));

  const categoryHints = [
    {
      id:"school",
      terms:["school","student","kids","kid","lunch","lunchbox","bag","bottle","tumbler","food container","food jar","cutlery"],
      eventTerms:["back to school","school","student","campus","graduation","recognition"]
    },
    {
      id:"hydration",
      terms:["tumbler","bottle","hydration","water","juice","blender","mug","cup","flask"],
      eventTerms:["summer","back to school","campus","gym","fitness","sports","payday","sale","11 11","12 12"]
    },
    {
      id:"bath",
      terms:["bath","bathroom","toilet","brush","soap","dish","lotion","dispenser","tumbler","vanity","accessories"],
      eventTerms:["home","christmas","ber","mother","women","sale","11 11","12 12","payday","year end"]
    },
    {
      id:"kitchen",
      terms:["kitchen","cookware","pan","pot","bake","glass","dining","serve","serveware","food","container","jar"],
      eventTerms:["christmas","ber","mother","women","home","payday","sale","11 11","12 12","year end"]
    },
    {
      id:"home",
      terms:["home","decor","storage","organizer","clock","furniture","basket","bin","rack"],
      eventTerms:["christmas","ber","home","mother","women","sale","11 11","12 12","year end"]
    },
    {
      id:"fitness",
      terms:["fitness","gym","dumbbell","roller","massage","yoga","exercise","sport"],
      eventTerms:["new year","summer","fitness","health","payday","sale","11 11","12 12"]
    },
    {
      id:"tools",
      terms:["tool","tools","drill","diy","hardware","repair","vanquish"],
      eventTerms:["father","new year","sale","payday","11 11","12 12","black friday"]
    },
    {
      id:"glassware",
      terms:["glass","glassware","cup","mug","wine","drinking","union","crysalis"],
      eventTerms:["christmas","ber","party","holiday","gift","sale","11 11","12 12","year end"]
    },
  ];

  const matchedCategories = categoryHints.filter((cat:any)=>phaseoutHasAny(text,cat.terms));

  return { brand, rawText, text, tokens, matchedCategories };
};

const getEventPhaseoutProfile = (ev:any) => {
  const rawText = [
    ev.name,
    ev.date,
    ev.type,
    ev.desc,
    ev.source,
    ...(ev.products || []),
  ].filter(Boolean).join(" ");

  const text = normalizePhaseoutText(rawText);
  const tokens = Array.from(new Set(phaseoutTokens(rawText)));

  const saleTerms = [
    "sale","mega","payday","clearance","closeout","last chance","final stock","flash","bundle","discount",
    "mid year","midyear","year end","yearend","10 10","11 11","12 12","black friday","cyber","campaign",
    "go live","launch","ber months","christmas prep"
  ];

  const weakHolidayOnly = ev.type === "holiday" && !phaseoutHasAny(text,saleTerms);

  return {
    rawText,
    text,
    tokens,
    isCampaign: ev.type === "campaign",
    isSeasonal: ev.type === "seasonal",
    isHoliday: ev.type === "holiday",
    isSale: phaseoutHasAny(text,saleTerms),
    weakHolidayOnly,
  };
};

const getPhaseoutEventScore = (ev:any, sku:any, brands:any[]=[]) => {
  const skuProfile = getSkuPhaseoutProfile(sku,brands);
  const eventProfile = getEventPhaseoutProfile(ev);

  let score = 0;
  const reasons:string[] = [];

  // Phase-out should strongly prefer sale/campaign windows first.
  if (eventProfile.isSale) { score += 35; reasons.push("sale/campaign event"); }
  if (eventProfile.isCampaign) { score += 25; reasons.push("campaign type"); }
  if (eventProfile.isSeasonal) { score += 8; reasons.push("seasonal event"); }
  if (eventProfile.weakHolidayOnly) { score -= 18; reasons.push("holiday without sale intent"); }

  // Exact brand match is a strong signal, but should not be required.
  if (skuProfile.brand) {
    const brandText = normalizePhaseoutText(skuProfile.brand);
    if (brandText && eventProfile.text.includes(brandText)) {
      score += 40;
      reasons.push("brand match");
    }
  }

  // Collection/category direct text match.
  [sku.collection, sku.category, sku.productCategory].filter(Boolean).forEach((term:any)=>{
    const clean = normalizePhaseoutText(term);
    if (clean && clean.length>=3 && eventProfile.text.includes(clean)) {
      score += 30;
      reasons.push("collection/category match");
    }
  });

  // Product token match, but avoid over-scoring very generic product words.
  const genericTokens = new Set(["set","pcs","with","new","small","large","medium","color","black","white","gray","grey","green","pink","blue","red"]);
  skuProfile.tokens.forEach((token:string)=>{
    if (genericTokens.has(token)) return;
    if (eventProfile.text.includes(token)) {
      score += token.length >= 5 ? 8 : 4;
      reasons.push("product keyword match");
    }
  });

  // Category-to-season logic so items go to more sensible events.
  skuProfile.matchedCategories.forEach((cat:any)=>{
    if (phaseoutHasAny(eventProfile.text,cat.eventTerms.map((t:string)=>normalizePhaseoutText(t)))) {
      score += 18;
      reasons.push(`${cat.id} seasonal fit`);
    }
  });

  // Big ecommerce sale events are acceptable fallback for any phase-out SKU.
  if (phaseoutHasAny(eventProfile.text,["11 11","12 12","10 10","payday","mid year","year end","black friday"])) {
    score += 14;
    reasons.push("ecommerce sale fallback");
  }

  // Avoid putting everything into soft occasions unless product/event really matches.
  if (eventProfile.isHoliday && !eventProfile.isSale && reasons.length < 3) {
    score -= 10;
  }

  return { score, reasons };
};

const suggestPhaseoutAssignments = (skus:any[], events:any[]=[], brands:any[]=[]) => {
  const usableEvents = (events || []).filter((ev:any)=>ev && ev.id);
  const assignments:any = {};

  skus.forEach((sku:any)=>{
    const ranked = usableEvents
      .map((ev:any)=>{
        const result:any = getPhaseoutEventScore(ev,sku,brands);
        return {
          ev,
          score: typeof result === "number" ? result : result.score,
          reasons: typeof result === "number" ? [] : result.reasons,
        };
      })
      .sort((a:any,b:any)=>b.score-a.score);

    const bestScore = ranked[0]?.score || 0;
    let chosen = ranked.filter((item:any)=>item.score >= Math.max(45,bestScore-12)).slice(0,3);

    if (!chosen.length) {
      chosen = ranked
        .filter((item:any)=>{
          const eventProfile = getEventPhaseoutProfile(item.ev);
          return eventProfile.isSale || eventProfile.isCampaign;
        })
        .slice(0,2);
    }

    if (!chosen.length && ranked[0]) chosen = [ranked[0]];

    chosen.forEach((item:any)=>{
      if (!item?.ev?.id) return;
      if (!assignments[item.ev.id]) assignments[item.ev.id] = [];
      assignments[item.ev.id].push({
        ...sku,
        phaseoutMatchScore:item.score,
        phaseoutMatchReasons:item.reasons,
      });
    });
  });

  return assignments;
};

const parsePhaseoutJson = (value:string) => {
  const raw = String(value || "").trim();
  if(!raw) throw new Error("Empty AI response.");

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const cleaned = fenced ? fenced[1].trim() : raw;

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if(start>=0 && end>start) return JSON.parse(cleaned.slice(start,end+1));
    throw new Error("AI response was not valid JSON.");
  }
};

const buildPhaseoutAiPayload = (skus:any[], events:any[]=[], brands:any[]=[]) => {
  const skuRows = (skus || []).map((sku:any,index:number)=>{
    const brand = brands.find((b:any)=>b.id===sku.brandId)?.name || "";
    const collection = sku.collection || sku.category || sku.productCategory || "";
    const extra = sku.extraFields || {};
    return {
      id:String(sku.id || sku.sku || sku.value || `sku_${index}`),
      sku:String(sku.sku || sku.value || ""),
      productName:String(sku.productName || sku.value || sku.sku || ""),
      brand:String(brand || ""),
      collection:String(collection || ""),
      category:String(sku.category || sku.productCategory || ""),
      stock:sku.inventory ?? "",
      extra:Object.fromEntries(Object.entries(extra).slice(0,8)),
    };
  });

  const eventRows = (events || []).filter((ev:any)=>ev?.id).map((ev:any)=>({
    id:String(ev.id),
    name:String(ev.name || ""),
    type:String(ev.type || ""),
    date:String(ev.date || ""),
    startDate:String(ev.calDate || ""),
    endDate:String(ev.calDateEnd || ""),
    months:Array.isArray(ev.months) ? ev.months : [],
    description:String(ev.desc || ""),
    currentProducts:(ev.products || []).slice(0,20),
  }));

  return { skus:skuRows, events:eventRows };
};

const getAiPhaseoutAssignments = async (skus:any[], events:any[]=[], brands:any[]=[]) => {
  const payload = buildPhaseoutAiPayload(skus,events,brands);

  if(!payload.skus.length || !payload.events.length) return {};

  const instruction = [
    "You are an ecommerce campaign planner for a Philippine marketplace brand portfolio.",
    "Your job is to match phase-out SKUs to the best existing events/seasons.",
    "Think like a merchandiser, not a keyword bot.",
    "",
    "Rules:",
    "1. Prefer sale/campaign events for phase-out SKUs: mid-year sale, payday, 10.10, 11.11, 12.12, year-end, Black Friday, Ber Months, Christmas prep.",
    "2. Use brand, product type, collection/category, seasonality, and shopper intent.",
    "3. Do NOT put SKUs into unrelated holidays just because the date is near.",
    "4. If product has no strong thematic event, use the strongest sale/campaign event.",
    "5. One SKU may be assigned to 1 to 3 events only.",
    "6. IMPORTANT: Do not force distribution. Only match SKUs to events/seasons where they have strong sales potential.",
    "7. Think by shopper demand: school items sell best in Back to School, gifting/home/kitchen/glassware sell best in Ber Months/Christmas/Year-End, generic clearance SKUs sell best in double-digit/payday/mega sale campaigns, fitness sells best in New Year/Summer/fitness-related campaigns.",
    "8. If only 1 or 2 events are truly high-sales matches, that is okay. If 5 events are relevant, use 5. Quality is more important than spreading.",
    "9. Return only JSON. No markdown. No explanation outside JSON.",
    "",
    "JSON format:",
    "{\"assignments\":[{\"skuId\":\"...\",\"eventIds\":[\"eventId1\",\"eventId2\"],\"reason\":\"short reason\"}]}",
  ].join("\\n");

  const res = await fetch("/api/ai/generate-text", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      task:"phaseout_matcher",
      taskLabel:"Phase-Out Event Matcher",
      tone:"professional",
      instruction,
      input:JSON.stringify(payload,null,2),
      referenceImages:[],
    }),
  });

  const raw = await res.text();
  let data:any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(raw || "AI phase-out matching failed.");
  }

  if(!res.ok) {
    const msg = data?.error || data?.message || "AI phase-out matching failed.";
    throw new Error(typeof msg === "string" ? msg : "AI phase-out matching failed.");
  }

  const parsed = parsePhaseoutJson(data?.text || "");
  const rows = Array.isArray(parsed?.assignments) ? parsed.assignments : [];

  const skuByKey = new Map<string,any>();
  skus.forEach((sku:any,index:number)=>{
    const keys = [
      sku.id,
      sku.sku,
      sku.value,
      String(sku.id || sku.sku || sku.value || `sku_${index}`),
    ].filter(Boolean).map((v:any)=>String(v));
    keys.forEach((key:string)=>skuByKey.set(key,sku));
  });

  const eventIds = new Set((events||[]).map((ev:any)=>String(ev.id)));
  const assignments:any = {};

  rows.forEach((row:any)=>{
    const sku = skuByKey.get(String(row?.skuId || ""));
    if(!sku) return;

    const ids = Array.isArray(row?.eventIds)
      ? row.eventIds.map((id:any)=>String(id)).filter((id:string)=>eventIds.has(id)).slice(0,3)
      : [];

    ids.forEach((eventId:string)=>{
      if(!assignments[eventId]) assignments[eventId] = [];
      assignments[eventId].push({
        ...sku,
        phaseoutMatchScore:999,
        phaseoutMatchReasons:[row?.reason || "Gemini AI match"],
      });
    });
  });

  return assignments;
};

const countAssignmentEvents = (assignments:any) => Object.keys(assignments || {}).filter((id:string)=>(assignments[id]||[]).length>0).length;

const assignmentSkuCount = (assignments:any) => Object.values(assignments || {}).reduce((sum:number,items:any)=>sum + (Array.isArray(items) ? items.length : 0),0);

const diversifyPhaseoutAssignments = (assignments:any, skus:any[], events:any[]=[], brands:any[]=[]) => {
  // High-sales fit cleanup.
  // This does NOT force equal distribution. It only keeps or adds event links that make sales sense.
  const usableEvents = (events || []).filter((ev:any)=>ev && ev.id);
  if(!usableEvents.length || !skus.length) return assignments || {};

  const selected:any = {};
  const skuKeys = (sku:any,index:number) => [
    String(sku.id || ""),
    String(sku.sku || ""),
    String(sku.value || ""),
    String(sku.id || sku.sku || sku.value || `sku_${index}`),
  ].filter(Boolean);

  const eventRankForSku = (sku:any) => usableEvents
    .map((ev:any)=>{
      const result:any = getPhaseoutEventScore(ev,sku,brands);
      const profile = getEventPhaseoutProfile(ev);
      let score = typeof result === "number" ? result : result.score;
      const reasons = typeof result === "number" ? [] : result.reasons;

      // Sales-potential boosts.
      if(profile.isSale) score += 28;
      if(profile.isCampaign) score += 22;

      const text = profile.text;
      if(text.includes("11 11") || text.includes("12 12") || text.includes("payday") || text.includes("mid year") || text.includes("year end")) score += 18;
      if(text.includes("ber months") || text.includes("christmas prep") || text.includes("christmas")) score += 10;
      if(text.includes("back to school")) score += 10;

      // Avoid weak holidays unless the SKU/category really fits.
      if(profile.weakHolidayOnly && score < 70) score -= 35;

      return { ev, score, reasons };
    })
    .sort((a:any,b:any)=>b.score-a.score);

  // Convert AI assignments back per SKU, but remove weak matches.
  const aiSkuToEvents:any = {};
  Object.keys(assignments || {}).forEach((eventId:string)=>{
    (assignments[eventId] || []).forEach((sku:any,index:number)=>{
      const key = String(sku.id || sku.sku || sku.value || `sku_${index}`);
      if(!aiSkuToEvents[key]) aiSkuToEvents[key] = [];
      aiSkuToEvents[key].push(eventId);
    });
  });

  skus.forEach((sku:any,index:number)=>{
    const ranked = eventRankForSku(sku);
    const bestScore = ranked[0]?.score || 0;

    // High-sales threshold. This prevents random event matching.
    const threshold = Math.max(62,bestScore - 18);

    const keys = skuKeys(sku,index);
    const aiEventIds = keys.flatMap((key:string)=>aiSkuToEvents[key] || []);
    const aiKept = ranked.filter((item:any)=>
      aiEventIds.includes(String(item.ev.id)) &&
      item.score >= threshold
    );

    let chosen = aiKept.slice(0,3);

    // If Gemini chose weak events only, use best high-sales ranked events.
    if(!chosen.length){
      chosen = ranked.filter((item:any)=>item.score >= threshold).slice(0,2);
    }

    // Always keep at least the top sales-fit event if available.
    if(!chosen.length && ranked[0]) chosen = [ranked[0]];

    chosen.forEach((item:any)=>{
      const eventId = item.ev.id;
      if(!selected[eventId]) selected[eventId] = [];
      const exists = selected[eventId].some((existing:any)=>
        String(existing.id || existing.sku || existing.value) === String(sku.id || sku.sku || sku.value)
      );
      if(!exists){
        selected[eventId].push({
          ...sku,
          phaseoutMatchScore:item.score,
          phaseoutMatchReasons:[...(item.reasons || []),"high sales fit"],
        });
      }
    });
  });

  return selected;
};

const getPhaseoutAssignmentsSmart = async (skus:any[], events:any[]=[], brands:any[]=[]) => {
  try {
    const aiAssignments = await getAiPhaseoutAssignments(skus,events,brands);
    if(Object.keys(aiAssignments || {}).length) {
      return { assignments:diversifyPhaseoutAssignments(aiAssignments,skus,events,brands), usedAi:true };
    }
  } catch (err) {
    console.warn("[EMDC] AI phase-out matcher fallback:", err);
  }

  const fallbackAssignments = suggestPhaseoutAssignments(skus,events,brands);
  return { assignments:diversifyPhaseoutAssignments(fallbackAssignments,skus,events,brands), usedAi:false };
};


// ─── STATUS MANAGER ──────────────────────────────────────────────────────────
const StatusManagerModal = ({ open, onClose, statuses, onChange }) => {
  const [newLabel,setNewLabel] = useState("");
  const [newColor,setNewColor] = useState("#3B82F6");
  const [editId,setEditId]     = useState(null);
  const [editLabel,setEditLabel] = useState("");
  const [editColor,setEditColor] = useState("#3B82F6");
  const add = ()=>{ if(!newLabel.trim()) return; onChange([...statuses,{id:uid(),label:newLabel.trim(),color:newColor}]); setNewLabel(""); setNewColor("#3B82F6"); };
  const remove = id=>onChange(statuses.filter(s=>s.id!==id));
  const startEdit = s=>{ setEditId(s.id); setEditLabel(s.label); setEditColor(s.color); };
  const saveEdit  = ()=>{ if(!editLabel.trim()) return; onChange(statuses.map(s=>s.id===editId?{...s,label:editLabel.trim(),color:editColor}:s)); setEditId(null); };
  return (
    <Modal open={open} onClose={()=>{onClose();setEditId(null);}} title="Manage Statuses" width={460}>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {statuses.map(s=>(
          <div key={s.id}>
            {editId===s.id?(
              <div style={{ padding:14,background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}` }}>
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <Field label="Name"><TI value={editLabel} onChange={setEditLabel} placeholder="Status name" /></Field>
                  <Field label="Color"><ColorPicker value={editColor} onChange={setEditColor} /></Field>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Btn sm onClick={saveEdit} disabled={!editLabel.trim()}>Save</Btn>
                    <Btn sm variant="outline" onClick={()=>setEditId(null)}>Cancel</Btn>
                    <span style={{ padding:"3px 10px",borderRadius:5,background:editColor+"18",border:`1px solid ${editColor}28`,fontSize:12,fontWeight:600,color:editColor }}>{editLabel||"Preview"}</span>
                  </div>
                </div>
              </div>
            ):(
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.surfaceAlt,borderRadius:9,border:`1px solid ${C.border}` }}>
                <div style={{ width:12,height:12,borderRadius:3,background:s.color,flexShrink:0 }} />
                <span style={{ flex:1,fontSize:13,fontWeight:600,color:C.text }}>{s.label}</span>
                <span style={{ padding:"2px 8px",borderRadius:4,background:s.color+"18",color:s.color,border:`1px solid ${s.color}28`,fontSize:11,fontWeight:700 }}>{s.label}</span>
                <button onClick={()=>startEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:600,padding:"4px 8px",borderRadius:5 }}>Edit</button>
                <button onClick={()=>remove(s.id)} style={{ width:26,height:26,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>
              </div>
            )}
          </div>
        ))}
        {statuses.length===0&&<p style={{ fontSize:13,color:C.faint,textAlign:"center",padding:"12px 0" }}>No statuses yet.</p>}
        <Divider />
        <div style={{ padding:14,background:C.bg,borderRadius:10,border:`1.5px dashed ${C.border}` }}>
          <p style={{ margin:"0 0 12px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Add New Status</p>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Field label="Name"><TI value={newLabel} onChange={setNewLabel} placeholder="e.g. Pending Review" /></Field>
            <Field label="Color"><ColorPicker value={newColor} onChange={setNewColor} /></Field>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <Btn sm onClick={add} disabled={!newLabel.trim()}>Add Status</Btn>
              {newLabel&&<span style={{ padding:"3px 10px",borderRadius:5,background:newColor+"18",border:`1px solid ${newColor}28`,fontSize:12,fontWeight:600,color:newColor }}>{newLabel}</span>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── MANAGE EVENT TYPES MODAL ────────────────────────────────────────────────
const ManageTypesModal = ({ open, onClose, eventTypes, onChange }) => {
  const [editId,setEditId]     = useState(null);
  const [editLabel,setEditLabel] = useState("");
  const [editColor,setEditColor] = useState("#374151");
  const [editUseColor,setEditUseColor] = useState(false);
  const [newLabel,setNewLabel] = useState("");
  const [newColor,setNewColor] = useState("#3B82F6");
  const [newUseColor,setNewUseColor] = useState(false);

  const startEdit = (t:any) => {
    setEditId(t.id);
    setEditLabel(t.label);
    setEditColor(t.color || "#374151");
    setEditUseColor(!!t.useColor);
  };

  const saveEdit  = () => {
    if (!editLabel.trim()) return;
    onChange(eventTypes.map((t:any) => t.id===editId ? {...t, label:editLabel.trim(), color:editColor, useColor:editUseColor} : t));
    setEditId(null);
  };

  const addType = () => {
    if (!newLabel.trim()) return;
    onChange([...eventTypes, { id:uid(), label:newLabel.trim(), color:newColor, useColor:newUseColor }]);
    setNewLabel("");
    setNewColor("#3B82F6");
    setNewUseColor(false);
  };

  const removeType = (id:any) => onChange(eventTypes.filter((t:any) => t.id!==id));

  return (
    <Modal open={open} onClose={()=>{onClose();setEditId(null);}} title="Manage Calendar Tags" width={460}>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <p style={{ margin:"0 0 4px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Current Types</p>
        {eventTypes.map((t:any) => (
          <div key={t.id}>
            {editId===t.id ? (
              <div style={{ padding:14,background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}` }}>
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <Field label="Label"><TI value={editLabel} onChange={setEditLabel} placeholder="Type name" /></Field>

                  <label style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:800,color:C.text,cursor:"pointer" }}>
                    <input type="checkbox" checked={editUseColor} onChange={e=>setEditUseColor(e.target.checked)} />
                    Use tag color for matching events
                  </label>

                  {editUseColor&&<Field label="Color"><ColorPicker value={editColor} onChange={setEditColor} palette={EVENT_COLORS} /></Field>}

                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    <Btn sm onClick={saveEdit} disabled={!editLabel.trim()}>Save</Btn>
                    <Btn sm variant="outline" onClick={()=>setEditId(null)}>Cancel</Btn>
                    <span style={{ padding:"3px 10px",borderRadius:5,background:editUseColor?editColor+"18":C.surface,border:`1px solid ${editUseColor?editColor+"28":C.border}`,fontSize:12,fontWeight:600,color:editUseColor?editColor:C.muted }}>{editLabel||"Preview"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.surfaceAlt,borderRadius:9,border:`1px solid ${C.border}` }}>
                {t.useColor&&<div style={{ width:12,height:12,borderRadius:3,background:t.color,flexShrink:0 }} />}
                <span style={{ flex:1,fontSize:13,fontWeight:600,color:C.text }}>{t.label}</span>
                {t.useColor&&<span style={{ padding:"2px 8px",borderRadius:4,background:t.color+"18",color:t.color,border:`1px solid ${t.color}28`,fontSize:11,fontWeight:700 }}>{t.label}</span>}
                {!t.useColor&&<span style={{ padding:"2px 8px",borderRadius:4,background:C.surface,border:`1px solid ${C.border}`,fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".04em" }}>No tag color</span>}
                <button onClick={()=>startEdit(t)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:600,padding:"4px 8px",borderRadius:5 }}>Edit</button>
                <button onClick={()=>removeType(t.id)} style={{ width:26,height:26,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>
              </div>
            )}
          </div>
        ))}
        <Divider />
        <div style={{ padding:14,background:C.bg,borderRadius:10,border:`1.5px dashed ${C.border}` }}>
          <p style={{ margin:"0 0 12px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Add New Type</p>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Field label="Label"><TI value={newLabel} onChange={setNewLabel} placeholder="e.g. Content Shoot" /></Field>

            <label style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:800,color:C.text,cursor:"pointer" }}>
              <input type="checkbox" checked={newUseColor} onChange={e=>setNewUseColor(e.target.checked)} />
              Use tag color for matching events
            </label>

            {newUseColor&&<Field label="Color"><ColorPicker value={newColor} onChange={setNewColor} palette={EVENT_COLORS} /></Field>}

            <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <Btn sm onClick={addType} disabled={!newLabel.trim()}>Add Type</Btn>
              {newLabel&&<span style={{ padding:"3px 10px",borderRadius:5,background:newUseColor?newColor+"18":C.surface,border:`1px solid ${newUseColor?newColor+"28":C.border}`,fontSize:12,fontWeight:600,color:newUseColor?newColor:C.muted }}>{newLabel}</span>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── CALENDAR ────────────────────────────────────────────────────────────────
const CalendarView = ({ extraEvents=[], seasonalEvents=[], setSeasonalEvents, brands=[], skuStorage=[], setSkuStorage, onNavigateToGroup, onStateChange, manualEvents=[], setManualEvents, eventTypes=[], setEventTypes }: any) => {
  const { isMobile } = useBreakpoint();
  const [year,setYear]   = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth());
  const saveEventTypes = (types: any[]) => {
    const nextTypes = ensureRequiredCalendarTypes(types || []).map((t:any)=>({
      ...t,
      color:t.color || "#9CA3AF",
      useColor:!!t.useColor,
    }));

    const tagColorMap:any = {};
    nextTypes.forEach((t:any)=>{
      if (t.useColor && t.id) tagColorMap[t.id] = t.color || "#9CA3AF";
    });

    const applyTagColor = (ev:any) => {
      const matchedColor = tagColorMap[ev?.type];
      return matchedColor ? { ...ev, color:matchedColor } : ev;
    };

    const nextManualEvents = (Array.isArray(manualEvents) ? manualEvents : []).map(applyTagColor);
    const nextSeasonalEvents = (Array.isArray(seasonalEvents) ? seasonalEvents : []).map(applyTagColor);

    if(setEventTypes) setEventTypes(nextTypes);
    if(setManualEvents) setManualEvents(nextManualEvents);
    if(setSeasonalEvents) setSeasonalEvents(nextSeasonalEvents);
    if(filter!=="all" && !nextTypes.some((t:any)=>t.id===filter)) setFilter("all");
    if(onStateChange) onStateChange({calendarTypes:nextTypes, calendarEvents:nextManualEvents, seasonalEvents:nextSeasonalEvents});
  };
  const [filter,setFilter]       = useState("all");
  const [addModal,setAddModal]   = useState(false);
  const [editModal,setEditModal] = useState(false);
  const [typesModal,setTypesModal] = useState(false);
  const [detailEv,setDetailEv]   = useState(null);
  const [editForm,setEditForm]   = useState(null);
  const [yearOverview,setYearOverview] = useState<any>(null);
  const [seasonalEditForm,setSeasonalEditForm] = useState<any>(null);
  const [phaseoutBrandFilter,setPhaseoutBrandFilter] = useState("all");
  const [phaseoutTagEdit,setPhaseoutTagEdit] = useState<any>(null);
  const [phaseoutTagValue,setPhaseoutTagValue] = useState("");
  const [phaseoutSelectedEventIds,setPhaseoutSelectedEventIds] = useState<any[]>([]);
  const [phaseoutOpenCategoryKeys,setPhaseoutOpenCategoryKeys] = useState<any>({});
  const [addForm,setAddForm]     = useState({ title:"",type:"task",date:"",color:"#374151" });
  const [dayView,setDayView]     = useState(null); // { date, label }
  const [prevDayView,setPrevDayView] = useState(null); // to go back from detail to day list

  const normalizeTagLabel = (id:any) => String(id || "event")
    .replace(/[-_]+/g," ")
    .replace(/\b\w/g,(m:string)=>m.toUpperCase());

  const calendarFilterTypes = useMemo(()=>{
    // Manage Tags is the source of truth.
    // If a tag is deleted there, it must disappear from the top calendar filters.
    return ensureRequiredCalendarTypes(eventTypes?.length ? eventTypes : DEFAULT_EVENT_TYPES).map((t:any)=>({
      ...t,
      label:t.label || normalizeTagLabel(t.id),
      color:t.color || "#9CA3AF",
      useColor:!!t.useColor,
    }));
  },[eventTypes]);

  // Helper: Manage Tags controls display color only when "Use tag color" is checked.
  // If unchecked, each event/season/checklist keeps its own saved color.
  const typeMeta = (id:any) => calendarFilterTypes.find((t:any)=>t.id===id);
  const typeColor = (id:any, fallback:string="#9CA3AF") => {
    const found = typeMeta(id);
    return found?.useColor ? found.color : (fallback || found?.color || "#9CA3AF");
  };
  const typeLabel = (id:any) => typeMeta(id)?.label || normalizeTagLabel(id);

  const monthOnlyCalendarEvents = useMemo(()=>{
    const monthStart = `${year}-${pad(month+1)}-01`;
    const monthEnd = `${year}-${pad(month+1)}-${pad(getDaysInMonth(year,month))}`;

    return (seasonalEvents||[])
      .filter((ev:any)=>{
        const selectedMonths = monthOnlyValues(ev.months);
        const hasSpecificDate = !!ev.calDate || !!ev.calDateEnd;
        return selectedMonths.includes(month) && !hasSpecificDate;
      })
      .map((ev:any)=>({
        id:`month-only-${ev.id}-${year}-${month}`,
        title:ev.name,
        type:ev.type || "seasonal",
        color:typeColor(ev.type || "seasonal", ev.color || "#14B8A6"),
        date:monthStart,
        dateEnd:monthEnd,
        fromSeasonal:true,
        seasonalType:ev.type || "seasonal",
        sourceEventId:ev.id,
        monthOnly:true,
        phaseoutCount:(ev.products||[]).filter(isPhaseoutProduct).length,
      }));
  },[seasonalEvents,year,month,calendarFilterTypes]);

  const allEvents = useMemo(()=>{
    const colorizeByTag = (ev:any) => ({
      ...ev,
      color:typeColor(ev?.type || "task", ev?.color || "#9CA3AF"),
    });

    return [
      ...(Array.isArray(manualEvents) ? manualEvents.map(colorizeByTag) : []),
      ...(Array.isArray(extraEvents) ? extraEvents.map(colorizeByTag) : []),
      ...(Array.isArray(monthOnlyCalendarEvents) ? monthOnlyCalendarEvents.map(colorizeByTag) : []),
    ];
  },[manualEvents,extraEvents,monthOnlyCalendarEvents,calendarFilterTypes]);

  // Date helpers must be defined before yearly list memo uses them during prerender.
  const dateKey = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;
  const parseDate = s => s ? new Date(s+"T00:00:00") : null;
  const formatDate = s => {
    if (typeof s === "string" && s.startsWith("yearly:")) {
      const parts = s.replace("yearly:","").split("-");
      const monthIdx = Math.max(0, Math.min(11, Number(parts[0]) - 1));
      const day = Number(parts[1] || 1);
      return `Every year on ${MONTHS_SHORT[monthIdx]} ${day}`;
    }
    if (typeof s === "string" && s.startsWith("monthly:")) {
      const labels = { first:"first day", last:"last day" };
      const tokens = s.replace("monthly:","").split(",").filter(Boolean)
        .map(t => labels[t] || `the ${t}${ordinalSuffix(t)}`);
      return `Monthly on ${tokens.join(" & ")}`;
    }
    return s;
  };

  const getMonthFromText = (value:any) => {
    const txt = String(value || "").toLowerCase();
    if (!txt) return null;
    if (txt.includes("yearly")) return { index:14, label:"Yearly / Recurring", day:1 };
    if (txt.includes("monthly")) return { index:13, label:"Monthly / Recurring", day:1 };
    for (let i=0;i<12;i++){
      const full = MONTHS[i].toLowerCase();
      const short = MONTHS_SHORT[i].toLowerCase();
      if (txt.includes(full) || txt.includes(short)) {
        const dayMatch = txt.match(/\b(\d{1,2})\b/);
        return { index:i, label:MONTHS[i], day:dayMatch ? Number(dayMatch[1]) : 1 };
      }
    }
    return null;
  };

  const getListMonthInfo = (item:any) => {
    if (Number.isFinite(Number(item.monthOnlyIndex))) {
      const idx = Number(item.monthOnlyIndex);
      return { index:idx, label:MONTHS[idx], day:1 };
    }
    const rawDate = item.calDate || item.date;
    if (typeof rawDate === "string" && rawDate.startsWith("yearly:")) {
      const parts = rawDate.replace("yearly:","").split("-");
      const idx = Math.max(0, Math.min(11, Number(parts[0]) - 1));
      return { index:idx, label:MONTHS[idx], day:Number(parts[1] || 1) };
    }
    if (typeof rawDate === "string" && rawDate.startsWith("monthly:")) {
      return { index:13, label:"Monthly / Recurring", day:1 };
    }
    if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const d = new Date(rawDate+"T00:00:00");
      if (!Number.isNaN(d.getTime())) return { index:d.getMonth(), label:MONTHS[d.getMonth()], day:d.getDate() };
    }
    const fromText = getMonthFromText(item.dateText || item.displayDate || item.date || item.name || item.title);
    if (fromText) return fromText;
    return { index:14, label:"No Specific Date", day:99 };
  };

  const yearListGroups = useMemo(()=>{
    const overlapsYear = (start:any,end:any) => {
      if (!start) return true;
      if (typeof start === "string" && start.startsWith("yearly:")) return true;
      if (typeof start === "string" && start.startsWith("monthly:")) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(start))) return true;
      const s = new Date(String(start)+"T00:00:00");
      const e = end && /^\d{4}-\d{2}-\d{2}$/.test(String(end)) ? new Date(String(end)+"T00:00:00") : s;
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return true;
      const yearStart = new Date(`${year}-01-01T00:00:00`);
      const yearEnd = new Date(`${year}-12-31T23:59:59`);
      return s <= yearEnd && e >= yearStart;
    };

    const seasonal = (seasonalEvents||[]).flatMap((ev:any)=>{
      const selectedMonths = monthOnlyValues(ev.months);
      const phaseoutCount = (ev.products||[]).filter(isPhaseoutProduct).length;
      if (selectedMonths.length) {
        return selectedMonths.map((monthIdx:number)=>({
          id:`seasonal-list-${ev.id}-${monthIdx}`,
          sourceId:ev.id,
          itemKind:"seasonal",
          title:ev.name,
          type:ev.type || "seasonal",
          color:ev.color,
          calDate:null,
          dateEnd:null,
          dateText:ev.date || formatMonthOnlyLabel(ev.months),
          monthOnlyIndex:monthIdx,
          source:"Events & Seasons",
          phaseoutCount,
        }));
      }
      return [{
        id:"seasonal-list-"+ev.id,
        sourceId:ev.id,
        itemKind:"seasonal",
        title:ev.name,
        type:ev.type || "seasonal",
        color:typeColor(ev.type || "seasonal", ev.color || "#14B8A6"),
        calDate:ev.calDate,
        dateEnd:ev.calDateEnd,
        dateText:ev.date,
        source:"Events & Seasons",
        phaseoutCount,
      }];
    });

    const manual = (manualEvents||[]).map((ev:any)=>({
      id:"manual-list-"+ev.id,
      sourceId:ev.id,
      itemKind:"manual",
      title:ev.title,
      type:ev.type || "task",
      color:typeColor(ev.type || "task", ev.color || "#374151"),
      calDate:ev.date,
      dateEnd:ev.dateEnd,
      dateText:formatDate(ev.date),
      source:"Calendar",
    }));

    const checklist = (extraEvents||[]).filter((ev:any)=>!ev.fromSeasonal).map((ev:any)=>({
      id:"extra-list-"+ev.id,
      sourceId:ev.id,
      itemKind:ev.fromChecklist ? "checklist" : "extra",
      title:ev.title,
      type:ev.type || "deadline",
      color:typeColor(ev.type || "deadline", ev.color || "#8B5CF6"),
      calDate:ev.date,
      dateEnd:ev.dateEnd,
      dateText:formatDate(ev.date),
      source:ev.fromChecklist ? "Checklist" : "Calendar",
      groupId:ev.groupId,
    }));

    const items = [...seasonal,...manual,...checklist]
      .filter((item:any)=>overlapsYear(item.calDate,item.dateEnd))
      .map((item:any)=>{
        const info = getListMonthInfo(item);
        return { ...item, monthIndex:info.index, monthLabel:info.label, day:info.day };
      })
      .sort((a:any,b:any)=>
        (a.monthIndex-b.monthIndex) ||
        (a.day-b.day) ||
        String(a.title).localeCompare(String(b.title))
      );

    const groups:any[] = [];
    items.forEach((item:any)=>{
      let group = groups.find((g:any)=>g.key===item.monthLabel);
      if (!group) {
        group = { key:item.monthLabel, label:item.monthLabel, index:item.monthIndex, items:[] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups.sort((a:any,b:any)=>a.index-b.index);
  },[year,seasonalEvents,manualEvents,extraEvents,eventTypes]);

  const updateSkuTagValue = (skuId:any, tagText:string) => {
    if(!setSkuStorage) return;
    setSkuStorage((prev:any[])=>{
      const next = (prev||[]).map((sku:any)=>sku.id===skuId ? setSkuTagsOnItem(sku,tagText) : sku);
      if(onStateChange) onStateChange({ skuItems:next });
      return next;
    });
  };

  const togglePhaseoutCategory = (key:string) => {
    setPhaseoutOpenCategoryKeys((prev:any)=>({ ...prev, [key]: !prev?.[key] }));
  };

  const phaseoutProductLabelForSku = (sku:any) => {
    const brandName = (brands||[]).find((b:any)=>b.id===sku?.brandId)?.name || sku?.brand || "";
    return `Phase-Out: ${[brandName,sku?.productName,sku?.sku].filter(Boolean).join(" - ")}`;
  };

  const eventHasPhaseoutSku = (ev:any, sku:any) => {
    if(!ev || !sku) return false;
    const skuCode = String(sku?.sku || "").toLowerCase();
    const productName = String(sku?.productName || "").toLowerCase();
    return (ev.products||[]).some((product:any)=>{
      if(!isPhaseoutProduct(product)) return false;
      const clean = String(cleanPhaseoutProductLabel(product) || product || "").toLowerCase();
      return (!!skuCode && clean.includes(skuCode)) || (!!productName && clean.includes(productName));
    });
  };

  const openPhaseoutTagEdit = (sku:any) => {
    setPhaseoutTagEdit(sku);
    setPhaseoutTagValue(getSkuTagText(sku));
    setPhaseoutSelectedEventIds((seasonalEvents||[]).filter((ev:any)=>eventHasPhaseoutSku(ev,sku)).map((ev:any)=>ev.id));
  };

  const togglePhaseoutEventSelection = (eventId:any) => {
    setPhaseoutSelectedEventIds((prev:any[])=>prev.includes(eventId) ? prev.filter((id:any)=>id!==eventId) : [...prev,eventId]);
  };

  const savePhaseoutTagEdit = () => {
    if(!phaseoutTagEdit) return;
    updateSkuTagValue(phaseoutTagEdit.id,phaseoutTagValue);

    const sku = phaseoutTagEdit;
    const nextLabel = phaseoutProductLabelForSku(sku);
    const selectedSet = new Set(phaseoutSelectedEventIds);

    const nextSeasonalEvents = (seasonalEvents||[]).map((ev:any)=>{
      const currentProducts = Array.isArray(ev.products) ? ev.products : [];
      const withoutThisSku = currentProducts.filter((product:any)=>{
        if(!isPhaseoutProduct(product)) return true;
        const clean = String(cleanPhaseoutProductLabel(product) || product || "").toLowerCase();
        const skuCode = String(sku?.sku || "").toLowerCase();
        const productName = String(sku?.productName || "").toLowerCase();
        return !((skuCode && clean.includes(skuCode)) || (productName && clean.includes(productName)));
      });
      const shouldInclude = selectedSet.has(ev.id);
      return {
        ...ev,
        products:shouldInclude ? [...withoutThisSku,nextLabel] : withoutThisSku,
      };
    });

    if(setSeasonalEvents) setSeasonalEvents(nextSeasonalEvents);
    if(onStateChange) onStateChange({ seasonalEvents:nextSeasonalEvents });

    setPhaseoutTagEdit(null);
    setPhaseoutTagValue("");
    setPhaseoutSelectedEventIds([]);
  };

  const clearPhaseoutTag = (sku:any) => {
    if(!setSkuStorage || !sku?.id) return;
    setSkuStorage((prev:any[])=>{
      const next = (prev||[]).map((item:any)=>item.id===sku.id ? removeSkuTagFromItem(item,"Phase Out") : item);
      if(onStateChange) onStateChange({ skuItems:next });
      return next;
    });

    const skuCode = String(sku?.sku || "").toLowerCase();
    const productName = String(sku?.productName || "").toLowerCase();
    const nextSeasonalEvents = (seasonalEvents||[]).map((ev:any)=>({
      ...ev,
      products:(ev.products||[]).filter((product:any)=>{
        if(!isPhaseoutProduct(product)) return true;
        const clean = String(cleanPhaseoutProductLabel(product) || product || "").toLowerCase();
        return !((skuCode && clean.includes(skuCode)) || (productName && clean.includes(productName)));
      }),
    }));
    if(setSeasonalEvents) setSeasonalEvents(nextSeasonalEvents);
    if(onStateChange) onStateChange({ seasonalEvents:nextSeasonalEvents });
  };

  const clearAllPhaseoutTags = () => {
    if(!setSkuStorage) return;
    setSkuStorage((prev:any[])=>{
      const next = (prev||[]).map((item:any)=>isPhaseoutSkuByTag(item) ? removeSkuTagFromItem(item,"Phase Out") : item);
      if(onStateChange) onStateChange({ skuItems:next });
      return next;
    });
  };

  const phaseoutSkuLinks = useMemo(()=>{
    const knownBrands = (brands||[]).map((b:any)=>String(b.name||"").trim()).filter(Boolean);
    const brandForSku = (sku:any) => (brands||[]).find((b:any)=>b.id===sku.brandId)?.name || sku.brand || "Unbranded";

    const labelForSku = (sku:any) => {
      const brandName = brandForSku(sku);
      return [brandName,sku.productName,sku.sku].filter(Boolean).join(" - ");
    };

    const productMatchesSku = (product:any, sku:any) => {
      const raw = cleanPhaseoutProductLabel(product);
      const lower = String(raw || product || "").toLowerCase();
      const skuCode = String(sku?.sku || "").toLowerCase();
      const productName = String(sku?.productName || "").toLowerCase();
      return (!!skuCode && lower.includes(skuCode)) || (!!productName && lower.includes(productName));
    };

    const byProduct:any = {};

    (skuStorage||[]).filter(isPhaseoutSkuByTag).forEach((sku:any)=>{
      const brandName = brandForSku(sku);
      const label = labelForSku(sku);
      const key = sku.id || `${brandName}__${label}`;
      const events = (seasonalEvents||[])
        .filter((ev:any)=>Array.isArray(ev.products) && ev.products.some((product:any)=>isPhaseoutProduct(product) && productMatchesSku(product,sku)))
        .map((ev:any)=>({
          id:ev.id,
          name:ev.name,
          date:ev.date,
          type:ev.type,
          color:ev.color,
        }));

      byProduct[key] = {
        sku,
        skuId:sku.id,
        label,
        brandName,
        tags:getSkuTags(sku),
        events,
      };
    });

    const detectBrand = (label:string) => {
      const lower = label.toLowerCase();
      const matched = knownBrands.find((brand:string)=>lower.startsWith(brand.toLowerCase()+" - ") || lower.includes(" - "+brand.toLowerCase()+" - "));
      if (matched) return matched;
      const firstChunk = label.split(" - ")[0]?.trim();
      return firstChunk || "Unbranded";
    };

    (seasonalEvents||[]).forEach((ev:any)=>{
      const phaseProducts = (ev.products||[]).filter(isPhaseoutProduct);
      phaseProducts.forEach((product:any)=>{
        const label = cleanPhaseoutProductLabel(product) || String(product||"").trim();
        if(!label) return;
        const alreadyMatched = Object.values(byProduct).some((item:any)=>item.events?.some((event:any)=>event.id===ev.id) && String(label).toLowerCase().includes(String(item.sku?.sku||"").toLowerCase()));
        if(alreadyMatched) return;

        const brandName = detectBrand(label);
        const key = `legacy__${brandName}__${label}`;
        if(!byProduct[key]) byProduct[key] = { label, brandName, tags:["Legacy Phase Out"], events:[], legacy:true };
        if(!byProduct[key].events.some((item:any)=>item.id===ev.id)){
          byProduct[key].events.push({
            id:ev.id,
            name:ev.name,
            date:ev.date,
            type:ev.type,
            color:ev.color,
          });
        }
      });
    });

    return Object.values(byProduct).sort((a:any,b:any)=>
      String(a.brandName).localeCompare(String(b.brandName)) || String(a.label).localeCompare(String(b.label))
    );
  },[seasonalEvents,brands,skuStorage]);

  const phaseoutBrandTabs = useMemo(()=>{
    const byBrand:any = {};
    phaseoutSkuLinks.forEach((item:any)=>{
      const brand = item.brandName || "Unbranded";
      if(!byBrand[brand]) byBrand[brand] = { brandName:brand, count:0 };
      byBrand[brand].count += 1;
    });

    return Object.values(byBrand).sort((a:any,b:any)=>String(a.brandName).localeCompare(String(b.brandName)));
  },[phaseoutSkuLinks]);

  const filteredPhaseoutSkuLinks = useMemo(()=>{
    if(phaseoutBrandFilter==="all") return phaseoutSkuLinks;
    return phaseoutSkuLinks.filter((item:any)=>item.brandName===phaseoutBrandFilter);
  },[phaseoutSkuLinks,phaseoutBrandFilter]);

  useEffect(()=>{
    if(phaseoutBrandFilter==="all") return;
    if(!phaseoutBrandTabs.some((tab:any)=>tab.brandName===phaseoutBrandFilter)) {
      setPhaseoutBrandFilter("all");
    }
  },[phaseoutBrandFilter,phaseoutBrandTabs]);

  const days=getDaysInMonth(year,month), firstDay=getFirstDay(year,month);
  const prevMo=()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1);
  const nextMo=()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1);

  // For each day: point events (single date) + range events (multi-day spanning this date)
  const eventsFor = d => {
    const key = dateKey(year,month,d);
    const dt  = new Date(`${key}T00:00:00`);
    return allEvents.filter(ev => {
      // filter by type
      if (filter!=="all" && ev.type!==filter) return false;
      // recurring yearly event (date like "yearly:01-01")
      if (typeof ev.date === "string" && ev.date.startsWith("yearly:")) {
        const [mm,dd] = ev.date.replace("yearly:","").split("-").map((n:any)=>Number(n));
        return mm === month + 1 && dd === d;
      }
      // recurring monthly event (date like "monthly:15,30" or "monthly:first,last")
      if (typeof ev.date === "string" && ev.date.startsWith("monthly:")) {
        const tokens = ev.date.replace("monthly:","").split(",").filter(Boolean);
        return tokens.some(t => {
          if (t==="first") return d===1;
          if (t==="last")  return d===days;
          return +t === d;
        });
      }
      // range event (has dateEnd)
      if (ev.dateEnd) {
        const s = parseDate(ev.date), e = parseDate(ev.dateEnd);
        return s && e && dt >= s && dt <= e;
      }
      return ev.date === key;
    });
  };

  // Determine range rendering style for a cell
  const getRangeStyle = (ev, d) => {
    if (!ev.dateEnd) return null;
    const key = dateKey(year,month,d);
    const dt  = new Date(`${key}T00:00:00`);
    const s   = parseDate(ev.date), e = parseDate(ev.dateEnd);
    const isStart  = dt.getTime()===s.getTime();
    const isEnd    = dt.getTime()===e.getTime();
    const col      = (firstDay+d-1)%7;
    const isRowStart = col===0;
    const isRowEnd   = col===6 || d===days;
    return {
      isRange:true,
      isStart: isStart || isRowStart,
      isEnd:   isEnd   || isRowEnd,
      color: typeColor(ev.type, ev.color || "#9CA3AF"),
    };
  };

  const saveNew=()=>{ if(!addForm.title||!addForm.date) return; setManualEvents(p=>{ const next=[...p,{id:uid(),...addForm}]; if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setAddForm({title:"",type:"task",date:"",color:"#374151"}); setAddModal(false); };
  const openEdit=ev=>{ setEditForm({...ev}); setDetailEv(null); setEditModal(true); };
  const saveEdit=()=>{ if(!editForm.title||!editForm.date) return; setManualEvents(p=>{ const next=p.map(e=>e.id===editForm.id?editForm:e); if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setEditModal(false); setEditForm(null); };

  const openSeasonalEdit = (id:any) => {
    const ev = (seasonalEvents||[]).find((item:any)=>item.id===id);
    if (!ev) return;
    setSeasonalEditForm({ ...ev, calDate:ev.calDate||"", calDateEnd:ev.calDateEnd||"", desc:ev.desc||"" });
  };

  const getOverviewPhaseoutSkus = (ev:any) => {
    const products = Array.isArray(ev?.products) ? ev.products : [];
    return products
      .filter(isPhaseoutProduct)
      .map((product:any)=>{
        const label = cleanPhaseoutProductLabel(product);
        const brand = (brands||[]).find((b:any)=>label.toLowerCase().startsWith(String(b.name||"").toLowerCase()+" - "))?.name || "";
        const cleanLabel = brand && label.startsWith(brand+" - ") ? label.slice(brand.length+3) : label;
        return { raw:product, label:cleanLabel, brand };
      });
  };

  const openYearOverview = (item:any) => {
    if (item.itemKind==="manual") {
      const ev = (manualEvents||[]).find((manual:any)=>manual.id===item.sourceId);
      setYearOverview({ item, type:"manual", event:ev || item, phaseoutSkus:[] });
      return;
    }

    if (item.itemKind==="seasonal") {
      const ev = (seasonalEvents||[]).find((seasonal:any)=>seasonal.id===item.sourceId);
      setYearOverview({ item, type:"seasonal", event:ev || item, phaseoutSkus:getOverviewPhaseoutSkus(ev) });
      return;
    }

    setYearOverview({ item, type:item.itemKind || "item", event:item, phaseoutSkus:[] });
  };

  const saveSeasonalEdit = () => {
    if (!seasonalEditForm?.name?.trim()) return;
    if (!setSeasonalEvents) return;
    setSeasonalEvents((prev:any[])=>{
      const next = prev.map((ev:any)=>ev.id===seasonalEditForm.id ? {
        ...ev,
        ...seasonalEditForm,
        name:seasonalEditForm.name.trim(),
        calDate:seasonalEditForm.calDate || null,
        calDateEnd:seasonalEditForm.calDateEnd || null,
      } : ev);
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
    setSeasonalEditForm(null);
  };

  const deleteSeasonalEdit = () => {
    if (!seasonalEditForm?.id || !setSeasonalEvents) return;
    setSeasonalEvents((prev:any[])=>{
      const next = prev.filter((ev:any)=>ev.id!==seasonalEditForm.id);
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
    setSeasonalEditForm(null);
  };

  const openYearListItem = (item:any) => {
    if (item.itemKind==="manual") {
      const ev = (manualEvents||[]).find((manual:any)=>manual.id===item.sourceId);
      if (ev) openEdit(ev);
      return;
    }
    if (item.itemKind==="seasonal") {
      openSeasonalEdit(item.sourceId);
      return;
    }
    if (item.groupId) {
      onNavigateToGroup?.(item.groupId);
    }
  };

  // When a type is selected in form, auto-fill color
  const handleFormTypeChange = (f, setF, v) => {
    const t = eventTypes.find(x=>x.id===v);
    setF({...f, type:v, color: t?.color || f.color});
  };

  const renderEventForm = ({ form, setForm, onSave, saveLabel="Save Event", showDelete, onDelete }: any) => (
    <div style={{ display:"flex",flexDirection:"column",gap:16,width:"100%",maxWidth:"100%",overflow:"hidden" }}>
      <Field label="Title"><TI value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. 11.11 Campaign Launch" /></Field>
      <Field label="Date"><DateInput value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} /></Field>
      <Field label="End Date">
        <DateInput value={form.dateEnd||""} onChange={v=>setForm(f=>({...f,dateEnd:v||undefined}))} />
      </Field>
      <Field label="Type">
        <Select value={form.type} onChange={v=>handleFormTypeChange(form,setForm,v)}>
          {eventTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Color">
        <ColorPicker value={form.color} onChange={v=>setForm(f=>({...f,color:v}))} palette={EVENT_COLORS} />
      </Field>
      {form.title&&(
        <div style={{ padding:"10px 14px",borderRadius:8,background:C.surfaceAlt,borderLeft:`3px solid ${form.color}`,fontSize:13,color:C.textSub,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span>{form.title}</span>
          {form.dateEnd&&<span style={{ fontSize:11,color:C.muted }}>{form.date} → {form.dateEnd}</span>}
        </div>
      )}
      <Btn onClick={onSave} full>{saveLabel}</Btn>
      {showDelete&&<Btn variant="danger" full onClick={onDelete}>Delete Event</Btn>}
    </div>
  );

  const renderSeasonalEditForm = () => seasonalEditForm && (
    <div style={{ display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:"100%",overflow:"hidden" }}>
      <Field label="Event / Season Name">
        <TI value={seasonalEditForm.name||""} onChange={v=>setSeasonalEditForm((f:any)=>({...f,name:v}))} placeholder="e.g. Back to School" />
      </Field>
      <Field label="Display Date">
        <TI value={seasonalEditForm.date||""} onChange={v=>setSeasonalEditForm((f:any)=>({...f,date:v}))} placeholder="e.g. June - July" />
      </Field>
      <Field label="Month Only" hint="optional, no specific date needed">
        <MonthOnlyPicker value={seasonalEditForm.months||[]} onChange={(months:any[])=>setSeasonalEditForm((f:any)=>({...f,months,date:months.length?formatMonthOnlyLabel(months):f.date,calDate:months.length?"":f.calDate,calDateEnd:months.length?"":f.calDateEnd}))} />
      </Field>
      <Field label="Calendar Date">
        <DateInput value={seasonalEditForm.calDate||""} onChange={v=>setSeasonalEditForm((f:any)=>({...f,calDate:v,months:v?[]:(f.months||[])}))} />
      </Field>
      <Field label="Calendar End Date">
        <DateInput value={seasonalEditForm.calDateEnd||""} onChange={v=>setSeasonalEditForm((f:any)=>({...f,calDateEnd:v}))} />
      </Field>
      <Field label="Tag / Filter Type">
        <Select value={seasonalEditForm.type||"campaign"} onChange={v=>{
          const selectedType = calendarFilterTypes.find((t:any)=>t.id===v);
          setSeasonalEditForm((f:any)=>({...f,type:v,color:selectedType?.useColor ? selectedType.color : f.color}));
        }}>
          {calendarFilterTypes.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Color">
        <ColorPicker value={typeColor(seasonalEditForm.type, seasonalEditForm.color || "#374151")} onChange={v=>setSeasonalEditForm((f:any)=>({...f,color:v}))} palette={EVENT_COLORS} />
      </Field>
      <Field label="Description" hint="optional">
        <TI value={seasonalEditForm.desc||""} onChange={v=>setSeasonalEditForm((f:any)=>({...f,desc:v}))} placeholder="Short description" />
      </Field>
      <Btn full onClick={saveSeasonalEdit} disabled={!seasonalEditForm.name?.trim()}>Save Changes</Btn>
      <Btn full variant="danger" onClick={deleteSeasonalEdit}>Delete Event / Season</Btn>
    </div>
  );

  // Cell layout constants — mobile stays compact; desktop uses more available space
  const BAND_H  = isMobile ? 14 : 18;   // unified height for ALL event rows (bands + chips same)
  const CHIP_H  = BAND_H;               // same as BAND_H — all events identical height
  const GAP     = 1;                    // px gap between rows
  const DATE_H  = isMobile ? 22 : 28;   // date number row
  const DAY_MIN_H = isMobile ? DATE_H + 24 : "clamp(78px, 10.5vh, 104px)";
  const DAY_NUM_SIZE = isMobile ? 18 : 22;
  const DAY_FONT = isMobile ? 9 : 11;
  const EVENT_FONT = isMobile ? 8 : 10;
  const dayLabels = isMobile ? DAYS_SHORT : DAYS_FULL;

  return (
    <div>
      {/* Controls row */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:isMobile?8:0 }}>
          {/* Month nav */}
          <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
            <button onClick={prevMo} style={{ width:32,height:32,borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted }}>&#8249;</button>
            <span style={{ fontSize:15,fontWeight:700,color:C.text,minWidth:isMobile?96:170,textAlign:"center" }}>{isMobile?`${MONTHS_SHORT[month]} ${year}`:`${MONTHS[month]} ${year}`}</span>
            <button onClick={nextMo} style={{ width:32,height:32,borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted }}>&#8250;</button>
          </div>
          {/* Actions */}
          <div style={{ display:"flex",gap:6,flexShrink:0 }}>
            <button onClick={()=>setTypesModal(true)} style={{ height:32,padding:"0 12px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textSub,whiteSpace:"nowrap" }}>Manage Tags</button>
            <button onClick={()=>setAddModal(true)} style={{ height:32,padding:"0 14px",borderRadius:7,border:"none",background:C.accent,cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap" }}>+ Add</button>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:10,WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none" }}>
        {[{id:"all",label:"All",color:C.accent},...calendarFilterTypes].map(t=>(
          <button key={t.id} onClick={()=>setFilter(t.id)}
            style={{ padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
              background:filter===t.id?(t.useColor?t.color:C.accent):C.surface,
              color:filter===t.id?"#fff":C.muted,
              border:`1.5px solid ${filter===t.id?(t.useColor?t.color:C.accent):C.border}`,
              whiteSpace:"nowrap",flexShrink:0,letterSpacing:".01em" }}>
            {t.label}
          </button>
        ))}
      </div>

      {monthOnlyCalendarEvents.filter((ev:any)=>filter==="all" || ev.type===filter).length>0&&(
        <div style={{ margin:"10px 0 12px",padding:isMobile?10:12,border:`1.5px solid ${C.border}`,borderRadius:12,background:C.surface }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8 }}>
            <div>
              <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text }}>Month-only Events in {MONTHS[month]}</p>
              <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>These events have no exact date but are active during this month.</p>
            </div>
            <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"2px 8px" }}>{monthOnlyCalendarEvents.filter((ev:any)=>filter==="all" || ev.type===filter).length}</span>
          </div>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {monthOnlyCalendarEvents.filter((ev:any)=>filter==="all" || ev.type===filter).map((ev:any)=>(
              <button key={ev.id} type="button" onClick={()=>setDetailEv(ev)}
                style={{ border:`1px solid ${typeColor(ev.type, ev.color||C.accent)}28`,background:typeColor(ev.type, ev.color||C.accent)+"14",color:typeColor(ev.type, ev.color||C.accent),borderRadius:999,padding:"5px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>
                {ev.phaseoutCount>0?"⚑ ":""}{ev.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",borderBottom:`1px solid ${C.border}`,background:C.surfaceAlt }}>
          {dayLabels.map((d,i)=>(<div key={i} style={{ padding:isMobile?"7px 0":"12px 0",textAlign:"center",fontSize:isMobile?11:12,fontWeight:700,color:C.faint,letterSpacing:".04em",textTransform:"uppercase" }}>{d}</div>))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gridAutoRows:"min-content" }}>
          {Array.from({length:firstDay}).map((_,i)=>(<div key={`b${i}`} style={{ minHeight:DAY_MIN_H,minWidth:0,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:C.bg }} />))}
          {Array.from({length:days}).map((_,i)=>{
            const d=i+1;
            const isToday=year===today.getFullYear()&&month===today.getMonth()&&d===today.getDate();
            const col=(firstDay+i)%7, dateStr=dateKey(year,month,d), dayEv=eventsFor(d);

            const rangeEvs = dayEv.filter(ev=>ev.dateEnd);
            const pointEvs = dayEv.filter(ev=>!ev.dateEnd);

            return (
              <div key={d}
                style={{
                  minHeight:DAY_MIN_H, minWidth:0, padding:0,
                  borderRight:col<6?`1px solid ${C.border}`:"none",
                  borderBottom:`1px solid ${C.border}`,
                  background:isToday?"#F5FFF7":C.surface,
                  cursor:"pointer",
                  display:"flex", flexDirection:"column",
                }}
                onClick={()=>setDayView({ date:dateStr, label:d })}>

                {/* Date number row — fixed height */}
                <div style={{ height:DATE_H,display:"flex",alignItems:"center",paddingLeft:3,flexShrink:0 }}>
                  <span style={{
                    display:"inline-flex",alignItems:"center",justifyContent:"center",
                    width:DAY_NUM_SIZE, height:DAY_NUM_SIZE, borderRadius:"50%",
                    fontSize:DAY_FONT, fontWeight:isToday?700:400,
                    background:isToday?C.accent:"transparent",
                    color:isToday?"#fff":C.textSub,
                  }}>{d}</span>
                </div>

                {/* Range bands — fixed height per band, flush to cell edges */}
                {rangeEvs.map(ev=>{
                  const rs=getRangeStyle(ev,d), ec=typeColor(ev.type, ev.color || "#9CA3AF");
                  return (
                    <div key={ev._monthOnlyCloneId||ev.id}
                      onClick={e=>{e.stopPropagation();setDetailEv(ev);}}
                      style={{
                        height:BAND_H, flexShrink:0, marginBottom:GAP,
                        marginLeft:rs.isStart?2:0, marginRight:rs.isEnd?2:0,
                        background:ec+"20",
                        borderLeft:  rs.isStart?`3px solid ${ec}`:`0.5px solid ${ec}30`,
                        borderTop:   `0.5px solid ${ec}20`,
                        borderBottom:`0.5px solid ${ec}20`,
                        borderRight: rs.isEnd?`0.5px solid ${ec}20`:"none",
                        borderRadius:rs.isStart&&rs.isEnd?"3px":rs.isStart?"3px 0 0 3px":rs.isEnd?"0 3px 3px 0":"0",
                        overflow:"hidden", display:"flex", alignItems:"center",
                      }}>
                      {rs.isStart&&(
                        <span style={{ fontSize:EVENT_FONT,fontWeight:700,color:ec,paddingLeft:isMobile?3:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{ev.phaseoutCount>0?"⚑ ":""}{ev.title}</span>
                      )}
                    </div>
                  );
                })}

                {/* Point chips — same visual style as range bands */}
                {pointEvs.map(ev=>{
                  const ec = typeColor(ev.type, ev.color || "#9CA3AF");
                  return (
                    <div key={ev.id}
                      onClick={e=>{e.stopPropagation();setDetailEv(ev);}}
                      style={{
                        height:CHIP_H, flexShrink:0, marginBottom:GAP,
                        marginLeft:0, marginRight:0,
                        background: ec+"20",
                        borderLeft: `3px solid ${ec}`,
                        borderTop:    `0.5px solid ${ec}20`,
                        borderBottom: `0.5px solid ${ec}20`,
                        borderRight: "none",
                        borderRadius: "0",
                        overflow:"hidden", display:"flex", alignItems:"center",
                      }}>
                      <span style={{ fontSize:EVENT_FONT,fontWeight:700,color:ec,paddingLeft:isMobile?3:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{ev.phaseoutCount>0?"⚑ ":""}{ev.title}</span>
                    </div>
                  );
                })}

                <div style={{ height:6,flexShrink:0 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Year event list */}
      <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?12:16,marginTop:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:12 }}>
          <div>
            <h3 style={{ margin:"0 0 3px",fontSize:14,fontWeight:800,color:C.text }}>{year} Events & Seasons</h3>
            <p style={{ margin:0,fontSize:12,color:C.muted }}>Monthly list includes calendar events, checklist dates, events/seasons, and items without specific dates.</p>
          </div>
        </div>
        {yearListGroups.length===0 ? (
          <p style={{ margin:0,fontSize:12,color:C.muted }}>No events listed for this year yet.</p>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
            {yearListGroups.map((group:any)=>(
              <div key={group.key} style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".04em" }}>
                  {group.label} <span style={{ color:C.faint,fontWeight:700 }}>({group.items.length})</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column" }}>
                  {group.items.map((item:any)=>(
                    <div key={item.id}
                      style={{ padding:"8px 10px",borderBottom:`1px solid ${C.border}`,background:C.surface,display:"flex",gap:8,alignItems:"flex-start" }}>
                      <button type="button"
                        onClick={()=>openYearOverview(item)}
                        style={{ flex:1,minWidth:0,textAlign:"left",padding:0,border:"none",background:"transparent",cursor:"pointer" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"center" }}>
                          <span style={{ minWidth:0,fontSize:12,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.phaseoutCount>0?"⚑ ":""}{item.title}</span>
                          <div style={{ display:"flex",gap:4,alignItems:"center",flexShrink:0 }}>
                            {item.phaseoutCount>0&&(
                              <span title="Has phase-out SKUs" style={{ fontSize:10,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"1px 6px",fontWeight:800 }}>
                                ⚑ {item.phaseoutCount}
                              </span>
                            )}
                            <span style={{ fontSize:10,color:typeColor(item.type,item.color||C.faint),background:typeColor(item.type,item.color||C.faint)+"14",border:`1px solid ${typeColor(item.type,item.color||C.faint)}28`,borderRadius:5,padding:"1px 6px",fontWeight:700 }}>{typeLabel(item.type)}</span>
                          </div>
                        </div>
                        <div style={{ marginTop:3,fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                          {item.dateText || item.calDate || "No specific date"}{item.dateEnd?` → ${item.dateEnd}`:""} · {item.source}
                        </div>
                      </button>
                      <button type="button"
                        onClick={()=>openYearListItem(item)}
                        style={{ flexShrink:0,border:`1px solid ${C.border}`,background:C.surfaceAlt,borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,color:C.textSub,cursor:"pointer" }}>
                        {item.itemKind==="checklist" ? "Open" : "Edit"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?12:16,marginTop:12 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:12 }}>
          <div>
            <h3 style={{ margin:"0 0 3px",fontSize:14,fontWeight:800,color:C.text }}>Phase-Out SKU Campaign Map</h3>
            <p style={{ margin:0,fontSize:12,color:C.muted }}>Products tagged Phase Out in SKU Storage appear here. Tag edits sync back to SKU Storage.</p>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <button type="button" onClick={clearAllPhaseoutTags} disabled={!phaseoutSkuLinks.some((item:any)=>item.skuId)}
              style={{ height:28,padding:"0 10px",border:`1px solid ${C.border}`,borderRadius:7,background:C.surfaceAlt,color:C.muted,fontSize:11,fontWeight:800,cursor:phaseoutSkuLinks.some((item:any)=>item.skuId)?"pointer":"not-allowed",opacity:phaseoutSkuLinks.some((item:any)=>item.skuId)?1:.55 }}>
              Clear All Phase-Out Tags
            </button>
            <span style={{ fontSize:11,fontWeight:800,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"4px 9px" }}>
              ⚑ {filteredPhaseoutSkuLinks.length} / {phaseoutSkuLinks.length} SKU{phaseoutSkuLinks.length!==1?"s":""}
            </span>
          </div>
        </div>

        {phaseoutSkuLinks.length>0&&(
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
            <button type="button" onClick={()=>setPhaseoutBrandFilter("all")}
              style={{ height:30,padding:"0 12px",borderRadius:999,border:`1.5px solid ${phaseoutBrandFilter==="all"?C.accent:C.border}`,background:phaseoutBrandFilter==="all"?C.accent:C.surface,color:phaseoutBrandFilter==="all"?"#fff":C.textSub,fontSize:12,fontWeight:800,cursor:"pointer" }}>
              All Brands <span style={{ opacity:.75 }}>({phaseoutSkuLinks.length})</span>
            </button>
            {phaseoutBrandTabs.map((tab:any)=>(
              <button key={tab.brandName} type="button" onClick={()=>setPhaseoutBrandFilter(tab.brandName)}
                style={{ height:30,padding:"0 12px",borderRadius:999,border:`1.5px solid ${phaseoutBrandFilter===tab.brandName?C.accent:C.border}`,background:phaseoutBrandFilter===tab.brandName?C.accent:C.surface,color:phaseoutBrandFilter===tab.brandName?"#fff":C.textSub,fontSize:12,fontWeight:800,cursor:"pointer" }}>
                {tab.brandName} <span style={{ opacity:.75 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {phaseoutSkuLinks.length===0 ? (
          <p style={{ margin:0,fontSize:12,color:C.muted }}>No products are tagged Phase Out yet. Add PHASE OUT in the SKU Storage Tag column to show products here.</p>
        ) : filteredPhaseoutSkuLinks.length===0 ? (
          <p style={{ margin:0,fontSize:12,color:C.muted }}>No phase-out SKUs found for this brand.</p>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(260px,1fr))",gap:10,maxHeight:isMobile?430:520,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingRight:2 }}>
            {(phaseoutBrandFilter==="all" ? phaseoutBrandTabs : phaseoutBrandTabs.filter((tab:any)=>tab.brandName===phaseoutBrandFilter)).map((tab:any)=>{
              const brandItems = filteredPhaseoutSkuLinks.filter((item:any)=>item.brandName===tab.brandName);
              if(!brandItems.length) return null;

              const groupedItems = brandItems.reduce((acc:any[],item:any)=>{
                const collectionName = getSkuCollectionCategory(item.sku) || "No collection/category";
                let group = acc.find((entry:any)=>entry.collectionName===collectionName);
                if(!group){
                  group = { collectionName, items:[] };
                  acc.push(group);
                }
                group.items.push(item);
                return acc;
              },[]);

              return (
                <div key={tab.brandName} style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.surface,overflow:"hidden",minHeight:180 }}>
                  <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{tab.brandName}</p>
                      <p style={{ margin:"2px 0 0",fontSize:10.5,color:C.muted }}>{brandItems.length} SKU{brandItems.length!==1?"s":""} · {groupedItems.length} collection{groupedItems.length!==1?"s":""}</p>
                    </div>
                    <span style={{ fontSize:10.5,fontWeight:800,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"2px 8px",flexShrink:0 }}>⚑ {brandItems.length}</span>
                  </div>

                  <div style={{ maxHeight:isMobile?320:430,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                    {groupedItems.map((group:any)=>{
                      const categoryKey = `${tab.brandName}__${group.collectionName}`;
                      const categoryOpen = !!phaseoutOpenCategoryKeys[categoryKey];
                      return (
                        <div key={categoryKey}>
                          <button type="button" onClick={()=>togglePhaseoutCategory(categoryKey)} style={{ width:"100%",position:"sticky",top:0,zIndex:1,padding:"7px 9px",background:categoryOpen?"#EEF2FF":"#F3F4F6",border:"none",borderBottom:`1px solid ${C.border}`,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,cursor:"pointer" }}>
                            <span style={{ minWidth:0,display:"flex",alignItems:"center",gap:7 }}>
                              <span style={{ width:18,height:18,borderRadius:6,background:categoryOpen?C.accent:C.surface,border:`1px solid ${categoryOpen?C.accent:C.border}`,color:categoryOpen?"#fff":C.muted,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,flexShrink:0 }}>{categoryOpen?"▾":"▸"}</span>
                              <span style={{ minWidth:0,fontSize:10.5,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{group.collectionName}</span>
                            </span>
                            <span style={{ fontSize:9.5,fontWeight:800,color:C.faint,background:C.surface,border:`1px solid ${C.border}`,borderRadius:999,padding:"1px 7px",flexShrink:0 }}>{group.items.length} SKU{group.items.length!==1?"s":""}</span>
                          </button>

                          {categoryOpen&&group.items.map((item:any)=>(
                            <div key={`${item.brandName}-${item.label}`} style={{ borderBottom:`1px solid ${C.border}`,background:C.surface }}>
                              <div style={{ padding:"8px 9px",display:"flex",gap:8,alignItems:"flex-start" }}>
                                <span style={{ width:18,height:18,borderRadius:999,background:"#F59E0B",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,flexShrink:0,marginTop:1 }}>⚑</span>
                                <button type="button" onClick={()=>item.sku&&openPhaseoutTagEdit(item.sku)} style={{ minWidth:0,flex:1,border:"none",background:"transparent",padding:0,textAlign:"left",cursor:item.sku?"pointer":"default" }}>
                                  <span style={{ display:"block",fontSize:11.3,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                                    {item.sku?.productName || String(item.label||"").replace(String(item.brandName||"")+" - ","")}
                                  </span>
                                  <span style={{ display:"block",marginTop:2,fontSize:10.2,color:C.faint,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                                    {item.sku?.sku || ""}
                                  </span>
                                  {Array.isArray(item.tags)&&item.tags.length>0&&(
                                    <span style={{ display:"block",marginTop:2,fontSize:9.8,color:"#B45309",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>Tags: {item.tags.join(", ")}</span>
                                  )}
                                </button>
                                {item.sku&&(
                                  <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                                    <button type="button" onClick={()=>openPhaseoutTagEdit(item.sku)} style={{ border:"none",background:C.surfaceAlt,color:C.textSub,borderRadius:6,padding:"4px 6px",fontSize:9.8,fontWeight:800,cursor:"pointer" }}>Edit</button>
                                    <button type="button" onClick={()=>clearPhaseoutTag(item.sku)} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:6,padding:"4px 6px",fontSize:9.8,fontWeight:800,cursor:"pointer" }}>Clear</button>
                                  </div>
                                )}
                              </div>

                              <div style={{ padding:"0 9px 8px 35px" }}>
                                {(!item.events || item.events.length===0) ? (
                                  <div style={{ padding:"6px 8px",fontSize:10.2,color:C.muted,background:C.bg,border:`1px solid ${C.border}`,borderRadius:7 }}>No linked event/season yet.</div>
                                ) : (
                                  <div style={{ display:"flex",gap:5,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",paddingBottom:2 }}>
                                    {item.events.map((ev:any)=>(
                                      <button key={ev.id} type="button" onClick={()=>{
                                          const fullEv = (seasonalEvents||[]).find((seasonal:any)=>seasonal.id===ev.id) || ev;
                                          setYearOverview({
                                            item:{ sourceId:ev.id,itemKind:"seasonal",title:fullEv.name||ev.name,type:fullEv.type||ev.type,color:fullEv.color||ev.color,dateText:fullEv.date||ev.date,source:"Events & Seasons" },
                                            type:"seasonal",
                                            event:fullEv,
                                            phaseoutSkus:getOverviewPhaseoutSkus(fullEv),
                                            focusedPhaseoutSku:item,
                                          });
                                        }}
                                        style={{ flex:"0 0 132px",border:`1px solid ${C.border}`,background:C.bg,borderRadius:7,padding:"4px 7px",textAlign:"left",cursor:"pointer" }}>
                                        <span style={{ display:"block",fontSize:10.1,fontWeight:850,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.name}</span>
                                        <span style={{ display:"block",fontSize:9.3,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.date || "No specific date"}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      <Modal open={!!phaseoutTagEdit} onClose={()=>{setPhaseoutTagEdit(null);setPhaseoutTagValue("");setPhaseoutSelectedEventIds([]);}} title="Edit SKU Tags & Events" width={560}>
        {phaseoutTagEdit&&(
          <div style={{ display:"flex",flexDirection:"column",gap:isMobile?10:14,minWidth:0,maxWidth:"100%" }}>
            <div style={{ padding:12,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10 }}>
              <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>{phaseoutTagEdit.productName || phaseoutTagEdit.sku}</p>
              <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,fontFamily:"monospace" }}>{phaseoutTagEdit.sku}</p>
            </div>
            <Field label="Tags" hint="Separate multiple tags with commas. Example: Phase Out, High Sales">
              <TI value={phaseoutTagValue} onChange={setPhaseoutTagValue} placeholder="Phase Out" />
            </Field>

            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8 }}>
                <div>
                  <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,textTransform:"uppercase",letterSpacing:".06em" }}>Linked Events / Seasons</p>
                  <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>Select one or more existing events/seasons where this SKU should appear.</p>
                </div>
                <span style={{ fontSize:10.5,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"3px 8px" }}>{phaseoutSelectedEventIds.length} selected</span>
              </div>
              <div style={{ maxHeight:260,overflowY:"auto",WebkitOverflowScrolling:"touch",border:`1.5px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                {(seasonalEvents||[]).length===0 ? (
                  <p style={{ margin:0,padding:12,fontSize:12,color:C.muted }}>No events/seasons created yet.</p>
                ) : (
                  (seasonalEvents||[]).map((ev:any)=> {
                    const checked = phaseoutSelectedEventIds.includes(ev.id);
                    return (
                      <button key={ev.id} type="button" onClick={()=>togglePhaseoutEventSelection(ev.id)}
                        style={{ width:"100%",display:"flex",alignItems:"center",gap:10,textAlign:"left",padding:"9px 10px",border:"none",borderBottom:`1px solid ${C.border}`,background:checked?"#FFFBEB":C.surface,cursor:"pointer" }}>
                        <span style={{ width:18,height:18,borderRadius:999,border:`2px solid ${checked?"#F59E0B":C.borderStrong}`,background:checked?"#F59E0B":"transparent",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0 }}>{checked?"✓":""}</span>
                        <span style={{ minWidth:0,flex:1 }}>
                          <span style={{ display:"block",fontSize:12.5,fontWeight:850,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.name}</span>
                          <span style={{ display:"block",fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.date || ev.calDate || formatMonthOnlyLabel(ev.months) || "No specific date"} · {ev.type || "event"}</span>
                        </span>
                        <Tag color={typeColor(ev.type || "seasonal", ev.color || "#14B8A6")}>{typeLabel(ev.type || "seasonal")}</Tag>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
              <Btn variant="danger" onClick={()=>{ clearPhaseoutTag(phaseoutTagEdit); setPhaseoutTagEdit(null); setPhaseoutTagValue(""); setPhaseoutSelectedEventIds([]); }}>Clear Phase-Out</Btn>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                <Btn variant="outline" onClick={()=>{setPhaseoutTagEdit(null);setPhaseoutTagValue("");setPhaseoutSelectedEventIds([]);}}>Cancel</Btn>
                <Btn onClick={savePhaseoutTagEdit}>Save Changes</Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Year list overview */}
      <Modal open={!!yearOverview} onClose={()=>setYearOverview(null)} title={yearOverview?.event?.name || yearOverview?.event?.title || yearOverview?.item?.title || "Overview"} width={560}>
        {yearOverview&&(()=>{
          const ev:any = yearOverview.event || {};
          const item:any = yearOverview.item || {};
          const color = typeColor(ev.type || item.type || "seasonal", ev.color || item.color || C.accent);
          const title = ev.name || ev.title || item.title;
          const dateText = item.dateText || ev.date || ev.calDate || "No specific date";
          const endText = item.dateEnd || ev.calDateEnd || ev.dateEnd || "";
          const products = Array.isArray(ev.products) ? ev.products : [];
          const phaseoutSkus = yearOverview.phaseoutSkus || [];
          const normalProducts = products.filter((p:any)=>!isPhaseoutProduct(p));

          return (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ padding:14,border:`1.5px solid ${C.border}`,borderRadius:12,background:C.surfaceAlt,borderLeft:`5px solid ${color}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                  <div style={{ minWidth:0 }}>
                    <h3 style={{ margin:"0 0 5px",fontSize:18,fontWeight:900,color:C.text }}>{title}</h3>
                    <p style={{ margin:0,fontSize:13,color:C.muted }}>{dateText}{endText?` → ${endText}`:""} · {item.source || "Calendar"}</p>
                  </div>
                  <Tag color={color}>{ev.type || item.type || "event"}</Tag>
                </div>
                {ev.desc&&<p style={{ margin:"10px 0 0",fontSize:13,color:C.textSub,lineHeight:1.45 }}>{ev.desc}</p>}
              </div>

              {yearOverview.focusedPhaseoutSku&&(
                <div style={{ padding:12,border:`1.5px solid #FDE68A`,borderRadius:12,background:"#FFFBEB",display:"flex",gap:10,alignItems:"center" }}>
                  <span style={{ width:24,height:24,borderRadius:999,background:"#F59E0B",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0 }}>⚑</span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {String(yearOverview.focusedPhaseoutSku.label||"").startsWith(String(yearOverview.focusedPhaseoutSku.brandName||"")+" - ")?String(yearOverview.focusedPhaseoutSku.label||"").slice(String(yearOverview.focusedPhaseoutSku.brandName||"").length+3):yearOverview.focusedPhaseoutSku.label}
                    </p>
                    <p style={{ margin:"2px 0 0",fontSize:10,fontWeight:900,color:"#B45309",textTransform:"uppercase",letterSpacing:".04em" }}>{yearOverview.focusedPhaseoutSku.brandName}</p>
                  </div>
                </div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:10 }}>
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                  <p style={{ margin:"0 0 3px",fontSize:11,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }}>Date</p>
                  <p style={{ margin:0,fontSize:13,fontWeight:800,color:C.text }}>{dateText}{endText?` → ${endText}`:""}</p>
                </div>
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                  <p style={{ margin:"0 0 3px",fontSize:11,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }}>Source</p>
                  <p style={{ margin:0,fontSize:13,fontWeight:800,color:C.text }}>{item.source || "Events & Seasons"}</p>
                </div>
              </div>

              {phaseoutSkus.length>0&&(
                <div style={{ border:`1.5px solid #FDE68A`,borderRadius:12,background:"#FFFBEB",overflow:"hidden" }}>
                  <div style={{ padding:"10px 12px",borderBottom:"1px solid #FDE68A",display:"flex",justifyContent:"space-between",gap:8,alignItems:"center" }}>
                    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:"#92400E" }}>Phase-Out SKUs</h4>
                    <span style={{ fontSize:11,fontWeight:900,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"2px 8px" }}>⚑ {phaseoutSkus.length}</span>
                  </div>
                  <div style={{ maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column" }}>
                    {phaseoutSkus.map((sku:any,idx:number)=>(
                      <div key={idx} style={{ padding:"9px 12px",borderBottom:"1px solid #FDE68A" }}>
                        <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text }}>{sku.label}</p>
                        {sku.brand&&<p style={{ margin:"2px 0 0",fontSize:10,fontWeight:900,color:"#B45309",textTransform:"uppercase",letterSpacing:".04em" }}>{sku.brand}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {normalProducts.length>0&&(
                <div style={{ border:`1px solid ${C.border}`,borderRadius:12,background:C.surface,overflow:"hidden" }}>
                  <div style={{ padding:"10px 12px",borderBottom:`1px solid ${C.border}` }}>
                    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Products / Notes</h4>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column" }}>
                    {normalProducts.map((product:any,idx:number)=>(
                      <div key={idx} style={{ padding:"8px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.textSub }}>{String(product)}</div>
                    ))}
                  </div>
                </div>
              )}

              {yearOverview.type==="checklist"&&(
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.surfaceAlt }}>
                  <p style={{ margin:0,fontSize:12,color:C.muted }}>This is a checklist calendar item. Open the checklist group to view SKUs, departments, and tasks.</p>
                </div>
              )}

              <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                <Btn variant="secondary" onClick={()=>setYearOverview(null)}>Close</Btn>
                <Btn onClick={()=>{ const target=yearOverview.item; setYearOverview(null); openYearListItem(target); }}>
                  {yearOverview.type==="checklist" ? "Open Checklist" : "Edit"}
                </Btn>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Events & Seasons from monthly list */}
      <Modal open={!!seasonalEditForm} onClose={()=>setSeasonalEditForm(null)} title="Edit Event / Season" width={500}>
        {renderSeasonalEditForm()}
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add Event">
        {renderEventForm({ form:addForm, setForm:setAddForm, onSave:saveNew, saveLabel:"Save Event" })}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal&&!!editForm} onClose={()=>{setEditModal(false);setEditForm(null);}} title="Edit Event">
        {editForm&&renderEventForm({
          form:editForm,
          setForm:setEditForm,
          onSave:saveEdit,
          saveLabel:"Save Changes",
          showDelete:true,
          onDelete:()=>{ setManualEvents((p:any)=>{ const next=p.filter((e:any)=>e.id!==editForm.id); if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setEditModal(false); setEditForm(null); }
        })}
      </Modal>

      {/* Manage Types Modal */}
      <ManageTypesModal open={typesModal} onClose={()=>setTypesModal(false)} eventTypes={eventTypes} onChange={saveEventTypes} />

      {/* Day View Modal — all events for a clicked date */}
      <Modal open={!!dayView} onClose={()=>setDayView(null)} title={dayView?`${MONTHS[month]} ${dayView.label}, ${year}`:"Day"} width={480}>
        {dayView&&(()=>{
          const dayEv = eventsFor(parseInt(dayView.label));
          return (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontSize:13,color:C.muted }}>{dayEv.length} event{dayEv.length!==1?"s":""}</span>
                <Btn sm onClick={()=>{ setAddForm(f=>({...f,date:dayView.date})); setDayView(null); setAddModal(true); }}>+ Add to this day</Btn>
              </div>
              {dayEv.length===0&&(
                <div style={{ textAlign:"center",padding:"28px 0",color:C.faint,fontSize:13 }}>No events on this day.</div>
              )}
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {dayEv.map(ev=>{
                  const isChecklist=!!ev.fromChecklist, isSeasonal=!!ev.fromSeasonal;
                  const tLabel = isChecklist ? "Deadline" : typeLabel(ev.type);
                  const tColor = isChecklist ? typeColor("deadline", "#8B5CF6") : typeColor(ev.type, ev.color || "#9CA3AF");
                  return (
                    <div key={ev.id} style={{ padding:"12px 14px",background:C.surfaceAlt,borderRadius:10,borderLeft:`4px solid ${tColor}`,cursor:"pointer" }}
                      onClick={()=>{ setPrevDayView(dayView); setDayView(null); setDetailEv(ev); }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:"0 0 4px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.title}</p>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                            <Tag color={tColor} sm>{tLabel}</Tag>
                            {ev.dateEnd&&<span style={{ fontSize:10,color:C.muted }}>{ev.date} → {ev.dateEnd}</span>}
                            {isSeasonal&&<Tag color={typeColor(detailEv.type || "seasonal", "#14B8A6")} sm>{typeLabel(detailEv.type || "seasonal")}</Tag>}
                            {isChecklist&&<Tag color="#8B5CF6" sm>Checklist</Tag>}
                          </div>
                        </div>
                        <span style={{ fontSize:12,color:C.faint,flexShrink:0 }}>&#8250;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailEv&&!editModal} onClose={()=>{ setDetailEv(null); setPrevDayView(null); }}
        onBack={prevDayView?()=>{ setDetailEv(null); setDayView(prevDayView); setPrevDayView(null); }:undefined}
        title="Event Details" width={560}>
        {detailEv&&(()=>{
          const isChecklist = !!detailEv.fromChecklist;
          const isSeasonal  = !!detailEv.fromSeasonal;
          const isManual    = !isChecklist && !isSeasonal;
          const tLabel = isChecklist ? "Deadline" : typeLabel(detailEv.type);
          const tColor = isChecklist ? typeColor("deadline", "#8B5CF6") : typeColor(detailEv.type, detailEv.color || "#9CA3AF");
          const seasonalSource = isSeasonal ? (seasonalEvents||[]).find((ev:any)=>ev.id===detailEv.sourceEventId) : null;
          const products = Array.isArray(seasonalSource?.products) ? seasonalSource.products : [];
          const phaseoutSkus = getOverviewPhaseoutSkus(seasonalSource);
          const normalProducts = products.filter((p:any)=>!isPhaseoutProduct(p));
          const title = seasonalSource?.name || detailEv.title;
          const dateText = detailEv.monthOnly
            ? (seasonalSource?.date || formatMonthOnlyLabel(seasonalSource?.months || []))
            : (seasonalSource?.date || formatDate(detailEv.date) || "No specific date");
          const endText = detailEv.monthOnly ? "" : (seasonalSource?.calDateEnd || detailEv.dateEnd || "");

          return (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ padding:14,border:`1.5px solid ${C.border}`,borderRadius:12,background:C.surfaceAlt,borderLeft:`5px solid ${detailEv.color||tColor}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                  <div style={{ minWidth:0 }}>
                    <h3 style={{ margin:"0 0 5px",fontSize:18,fontWeight:900,color:C.text }}>{title}</h3>
                    <p style={{ margin:0,fontSize:13,color:C.muted }}>
                      {dateText}{endText&&<span> → {endText}</span>}
                    </p>
                  </div>
                  <Tag color={tColor}>{tLabel}</Tag>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:10 }}>
                  {isSeasonal&&<Tag color="#14B8A6">Seasonal Event</Tag>}
                  {isChecklist&&<Tag color="#8B5CF6">Checklist Deadline</Tag>}
                  {detailEv.monthOnly&&<Tag color={C.muted}>Month-only</Tag>}
                  {detailEv.dateEnd&&!detailEv.monthOnly&&<Tag color={C.muted}>Multi-day</Tag>}
                </div>
                {seasonalSource?.desc&&<p style={{ margin:"10px 0 0",fontSize:13,color:C.textSub,lineHeight:1.45 }}>{seasonalSource.desc}</p>}
              </div>

              <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:10 }}>
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                  <p style={{ margin:"0 0 3px",fontSize:11,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }}>Date</p>
                  <p style={{ margin:0,fontSize:13,fontWeight:800,color:C.text }}>{dateText}{endText&&<span> → {endText}</span>}</p>
                </div>
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                  <p style={{ margin:"0 0 3px",fontSize:11,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }}>Source</p>
                  <p style={{ margin:0,fontSize:13,fontWeight:800,color:C.text }}>{isSeasonal?"Events & Seasons":isChecklist?"Checklist":"Calendar"}</p>
                </div>
              </div>

              {phaseoutSkus.length>0&&(
                <div style={{ border:`1.5px solid #FDE68A`,borderRadius:12,background:"#FFFBEB",overflow:"hidden" }}>
                  <div style={{ padding:"10px 12px",borderBottom:"1px solid #FDE68A",display:"flex",justifyContent:"space-between",gap:8,alignItems:"center" }}>
                    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:"#92400E" }}>Phase-Out SKUs</h4>
                    <span style={{ fontSize:11,fontWeight:900,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"2px 8px" }}>⚑ {phaseoutSkus.length}</span>
                  </div>
                  <div style={{ maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column" }}>
                    {phaseoutSkus.map((sku:any,idx:number)=>(
                      <div key={idx} style={{ padding:"9px 12px",borderBottom:"1px solid #FDE68A" }}>
                        <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text }}>{sku.label}</p>
                        {sku.brand&&<p style={{ margin:"2px 0 0",fontSize:10,fontWeight:900,color:"#B45309",textTransform:"uppercase",letterSpacing:".04em" }}>{sku.brand}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {normalProducts.length>0&&(
                <div style={{ border:`1px solid ${C.border}`,borderRadius:12,background:C.surface,overflow:"hidden" }}>
                  <div style={{ padding:"10px 12px",borderBottom:`1px solid ${C.border}` }}>
                    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Products / Notes</h4>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column" }}>
                    {normalProducts.map((product:any,idx:number)=>(
                      <div key={idx} style={{ padding:"8px 12px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.textSub }}>{String(product)}</div>
                    ))}
                  </div>
                </div>
              )}

              {isChecklist&&(
                <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.surfaceAlt }}>
                  <p style={{ margin:0,fontSize:12,color:C.muted }}>This is a checklist calendar item. Open the checklist group to view SKUs, departments, and tasks.</p>
                </div>
              )}

              <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                {isManual&&<Btn variant="danger" onClick={()=>{ setManualEvents((p:any)=>{ const base=Array.isArray(p)?p:[]; const next=base.filter((e:any)=>e.id!==detailEv.id); if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setDetailEv(null); }}>Delete</Btn>}
                <Btn variant="secondary" onClick={()=>setDetailEv(null)}>Close</Btn>
                {isManual&&<Btn onClick={()=>openEdit(detailEv)}>Edit Event</Btn>}
                {isSeasonal&&<Btn onClick={()=>{ setDetailEv(null); openSeasonalEdit(detailEv.sourceEventId); }}>Edit in Events & Seasons</Btn>}
                {isChecklist&&onNavigateToGroup&&<Btn onClick={()=>{ onNavigateToGroup(detailEv.groupId); setDetailEv(null); }}>Open Checklist</Btn>}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};


// ─── EVENTS & SEASONS ────────────────────────────────────────────────────────
const EventsView = ({ skuStorage, brands, onStateChange, events, setEvents, eventTypes=DEFAULT_EVENT_TYPES, setEventTypes }: any) => {
  const { isMobile } = useBreakpoint();
  const [filter,setFilter]       = useState("all");
  const [expanded,setExpanded]   = useState(null);
  const [addingTo,setAddingTo]   = useState(null);
  const [editingProd,setEditingProd] = useState(null);
  const [prodMode,setProdMode]   = useState("manual");
  const [cf,setCf]   = useState({ brand:"",product:"",sku:"" });
  const [edf,setEdf] = useState("");
  const [addEventModal,setAddEventModal] = useState(false);
  const [editEvModal,setEditEvModal]     = useState(false);
  const [editEvForm,setEditEvForm]       = useState(null);
  const [typesModal,setTypesModal]       = useState(false);
  const [dragEventId,setDragEventId]       = useState<any>(null);
  const [sortMode,setSortMode] = useState("date");
  const [showSortOptions,setShowSortOptions] = useState(false);
  const [sortMenuId,setSortMenuId] = useState<any>(null);
  const [evForm,setEvForm] = useState({ name:"",date:"",type:eventTypes[0]?.id||"task",color:eventTypes[0]?.color||"#374151",desc:"",calDate:"",calDateEnd:"",months:[] });

  const normalizeTagLabel = (id:any) => String(id || "event")
    .replace(/[-_]+/g," ")
    .replace(/\b\w/g,(m:string)=>m.toUpperCase());

  const eventFilterTypes = useMemo(()=>{
    // Manage Tags is the source of truth.
    // Removed tags should not come back just because older events still use that type.
    return ensureRequiredCalendarTypes(eventTypes?.length ? eventTypes : DEFAULT_EVENT_TYPES).map((t:any)=>({
      ...t,
      label:t.label || normalizeTagLabel(t.id),
      color:t.color || "#6B7280",
      useColor:!!t.useColor,
    }));
  },[eventTypes]);

  const eventTypeMeta = (id:any) => eventFilterTypes.find((t:any)=>t.id===id);
  const eventTypeColor = (id:any, fallback:string="#6B7280") => {
    const found = eventTypeMeta(id);
    return found?.useColor ? found.color : (fallback || found?.color || "#6B7280");
  };
  const eventTypeLabel = (id:any) => eventTypeMeta(id)?.label || normalizeTagLabel(id);
  const saveEventTypesLocal = (types:any[]) => {
    const nextTypes = ensureRequiredCalendarTypes(types || []).map((t:any)=>({
      ...t,
      color:t.color || "#6B7280",
      useColor:!!t.useColor,
    }));

    const tagColorMap:any = {};
    nextTypes.forEach((t:any)=>{
      if (t.useColor && t.id) tagColorMap[t.id] = t.color || "#6B7280";
    });

    const applyTagColor = (ev:any) => {
      const matchedColor = tagColorMap[ev?.type];
      return matchedColor ? { ...ev, color:matchedColor } : ev;
    };

    const nextEvents = (Array.isArray(events) ? events : []).map(applyTagColor);

    if(setEventTypes) setEventTypes(nextTypes);
    if(setEvents) setEvents(nextEvents);
    if(onStateChange) onStateChange({calendarTypes:nextTypes, seasonalEvents:nextEvents});
    if(filter!=="all" && !nextTypes.some((t:any)=>t.id===filter)) setFilter("all");
  };
  const filtered = filter==="all" ? events : events.filter((e:any)=>e.type===filter);

  const getEventMonthInfo = (ev:any) => {
    if (Number.isFinite(Number(ev._monthOnlyIndex))) {
      const idx = Number(ev._monthOnlyIndex);
      return { index:idx, label:MONTHS[idx], day:1 };
    }
    const selectedMonths = monthOnlyValues(ev.months);
    if (selectedMonths.length) {
      const idx = selectedMonths[0];
      return { index:idx, label:MONTHS[idx], day:1 };
    }
    if (typeof ev.calDate === "string" && ev.calDate.startsWith("yearly:")) {
      const parts = ev.calDate.replace("yearly:","").split("-");
      const idx = Math.max(0, Math.min(11, Number(parts[0]) - 1));
      return { index:idx, label:MONTHS[idx], day:Number(parts[1] || 1) };
    }
    if (ev.calDate && /^\d{4}-\d{2}-\d{2}$/.test(String(ev.calDate))) {
      const d = new Date(ev.calDate+"T00:00:00");
      if (!Number.isNaN(d.getTime())) return { index:d.getMonth(), label:MONTHS[d.getMonth()], day:d.getDate() };
    }
    const txt = String(ev.date || "").toLowerCase();
    if (txt.includes("yearly")) return { index:14, label:"Yearly / Recurring", day:1 };
    if (txt.includes("monthly")) return { index:13, label:"Monthly / Recurring", day:1 };
    for (let i=0;i<12;i++){
      const full = MONTHS[i].toLowerCase();
      const short = MONTHS_SHORT[i].toLowerCase();
      if (txt.includes(full) || txt.includes(short)) {
        const dayMatch = txt.match(/\b(\d{1,2})\b/);
        return { index:i, label:MONTHS[i], day:dayMatch ? Number(dayMatch[1]) : 1 };
      }
    }
    return { index:14, label:"No Specific Date", day:99 };
  };

  const dateSort = (a:any,b:any) => {
    const am=getEventMonthInfo(a), bm=getEventMonthInfo(b);
    const ao = sortMode==="manual" ? (a.manualOrder ?? 9999) : (a.manualOrder ?? am.day);
    const bo = sortMode==="manual" ? (b.manualOrder ?? 9999) : (b.manualOrder ?? bm.day);
    return (am.index-bm.index) || (ao-bo) || (am.day-bm.day) || String(a.name).localeCompare(String(b.name));
  };

  const sortedFiltered = useMemo(()=>[...filtered].sort((a:any,b:any)=>{
    if (sortMode==="name") return String(a.name||"").localeCompare(String(b.name||"")) || dateSort(a,b);
    if (sortMode==="tag") return String(eventTypeLabel(a.type)).localeCompare(String(eventTypeLabel(b.type))) || dateSort(a,b);
    if (sortMode==="phaseout") {
      const ap = (Array.isArray(a.products)?a.products:[]).filter(isPhaseoutProduct).length;
      const bp = (Array.isArray(b.products)?b.products:[]).filter(isPhaseoutProduct).length;
      return (bp-ap) || dateSort(a,b);
    }
    if (sortMode==="manual") return dateSort(a,b);
    return dateSort(a,b);
  }),[filtered,sortMode,eventFilterTypes]);

  const groupedEvents = useMemo(()=>{
    const groups:any[] = [];
    sortedFiltered.forEach((ev:any)=>{
      const selectedMonths = monthOnlyValues(ev.months);
      const expanded = selectedMonths.length
        ? selectedMonths.map((m:number)=>({...ev,_monthOnlyIndex:m,_monthOnlyCloneId:`${ev.id}-${m}`}))
        : [ev];

      expanded.forEach((item:any)=>{
        const info = getEventMonthInfo(item);
        let group = groups.find((g:any)=>g.label===info.label);
        if (!group) {
          group = { label:info.label, index:info.index, events:[] };
          groups.push(group);
        }
        group.events.push(item);
      });
    });
    return groups.sort((a:any,b:any)=>a.index-b.index);
  },[sortedFiltered]);

  const applyManualOrder = (nextIds:any[]) => {
    setSortMode("manual");
    setEvents((prev:any[])=>{
      const base = Array.isArray(prev) ? prev : [];
      const next = base.map((ev:any)=>nextIds.includes(ev.id)?{...ev,manualOrder:nextIds.indexOf(ev.id)}:ev);
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
  };

  const reorderEventCards = (fromId:any,toId:any) => {
    if (!fromId || !toId || fromId===toId) return;
    const ids = sortedFiltered.map((e:any)=>e.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex<0 || toIndex<0) return;
    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIndex,1);
    nextIds.splice(toIndex,0,moved);
    applyManualOrder(nextIds);
  };

  const moveEventCard = (id:any,action:any) => {
    const ids = sortedFiltered.map((e:any)=>e.id);
    const current = ids.indexOf(id);
    if (current<0) return;
    const nextIds = [...ids];
    const [moved] = nextIds.splice(current,1);
    let target = current;
    if (action==="top") target = 0;
    if (action==="up") target = Math.max(0,current-1);
    if (action==="down") target = Math.min(nextIds.length,current+1);
    if (action==="bottom") target = nextIds.length;
    nextIds.splice(target,0,moved);
    applyManualOrder(nextIds);
    setSortMenuId(null);
  };

  const resetEventSortToDate = () => {
    setSortMode("date");
    setEvents((prev:any[])=>{
      const next = prev.map((ev:any)=>{ const copy={...ev}; delete copy.manualOrder; return copy; });
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
  };

  const updProds = (id:any,fn:any) => setEvents((p:any)=>{ const next=p.map((e:any)=>e.id===id?{...e,products:fn(e.products)}:e); if(onStateChange) onStateChange({seasonalEvents:next}); return next; });

  const renderEvForm = ({ form, setForm, onSave, onDelete, saveLabel }) => (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <Field label="Event Name"><TI value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Brand Anniversary Sale" /></Field>
      <Field label="Display Date"><TI value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} placeholder="e.g. Oct 15 or Q4" /></Field>
      <Field label="Month Only" hint="optional, no specific date needed">
        <MonthOnlyPicker value={form.months||[]} onChange={(months:any[])=>setForm((f:any)=>({...f,months,date:months.length?formatMonthOnlyLabel(months):f.date,calDate:months.length?"":f.calDate,calDateEnd:months.length?"":f.calDateEnd}))} />
      </Field>
      <Field label="Calendar Date"><DateInput value={form.calDate||""} onChange={v=>setForm(f=>({...f,calDate:v,months:v?[]:(f.months||[])}))} /></Field>
      <Field label="Calendar End Date"><DateInput value={form.calDateEnd||""} onChange={v=>setForm(f=>({...f,calDateEnd:v,months:v?[]:(f.months||[])}))} /></Field>
      <Field label="Tag / Filter Type">
        <Select value={form.type} onChange={v=>{
          const selectedType = eventFilterTypes.find((t:any)=>t.id===v);
          setForm((f:any)=>({...f,type:v,color:selectedType?.useColor ? selectedType.color : f.color}));
        }}>
          {eventFilterTypes.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </Field>
      <Field label="Color"><ColorPicker value={eventTypeColor(form.type, form.color || "#6B7280")} onChange={v=>setForm(f=>({...f,color:v}))} palette={EVENT_COLORS} /></Field>
      <Field label="Description" hint="(optional)"><TI value={form.desc||""} onChange={v=>setForm(f=>({...f,desc:v}))} placeholder="Brief description" /></Field>
      <Btn full onClick={onSave} disabled={!form.name.trim()}>{saveLabel}</Btn>
      {onDelete&&<Btn full variant="danger" onClick={onDelete}>Delete Event</Btn>}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10 }}>
        <div style={{ display:"flex",gap:6,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:2 }}>
          {[{id:"all",label:"All",color:C.accent},...eventFilterTypes].map((t:any)=>(<button key={t.id} onClick={()=>setFilter(t.id)} style={{ padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:filter===t.id?(t.useColor?t.color:C.accent):C.surface,color:filter===t.id?"#fff":C.muted,border:`1.5px solid ${filter===t.id?(t.useColor?t.color:C.accent):C.border}`,whiteSpace:"nowrap",flexShrink:0 }}>{t.label}</button>))}
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          <Btn sm variant="outline" onClick={()=>setTypesModal(true)}>Manage Tags</Btn>
          <Btn sm onClick={()=>setAddEventModal(true)}>+ Add Event</Btn>
        </div>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",position:"relative" }}>
            <Btn xs variant={showSortOptions?"primary":"outline"} onClick={()=>{ setShowSortOptions(v=>!v); setSortMode("manual"); setSortMenuId(null); }}>
              {showSortOptions ? "Done Sorting" : "Sort"}
            </Btn>
          </div>
        </div>

        {groupedEvents.map((group:any)=>(
          <section key={group.label} style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <h3 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>{group.label}</h3>
              <span style={{ fontSize:11,color:C.faint,fontWeight:700 }}>{group.events.length}</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,340px),1fr))",gap:12 }}>
              {group.events.map((ev:any)=>{
          const isOpen=expanded===ev.id, tc=eventTypeColor(ev.type, ev.color || "#6B7280");
          const evProducts = Array.isArray(ev.products) ? ev.products : [];
          const phaseoutCount = evProducts.filter(isPhaseoutProduct).length;
          return (
            <div key={ev.id}
              data-event-card-id={ev.id}
              className="emdc-card"
              style={{ background:C.surface,borderRadius:12,border:`1.5px solid ${C.border}`,borderLeft:`4px solid ${tc}`,overflow:"hidden",transition:"box-shadow .18s ease",cursor:"default" }}>
              <div style={{ padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }} onClick={()=>setExpanded(isOpen?null:ev.id)}>
                <div style={{ minWidth:0,marginRight:8 }}>
                  <p style={{ margin:"0 0 5px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.name}</p>
                  <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                    <Tag color={tc} sm>{eventTypeLabel(ev.type)}</Tag>
                    <span style={{ fontSize:11,color:C.faint }}>{ev.date}</span>
                    {phaseoutCount>0&&(
                      <span style={{ fontSize:10,fontWeight:800,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"2px 7px" }}>
                        {phaseoutCount} phase-out SKU{phaseoutCount>1?"s":""}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex",gap:4,alignItems:"center",flexShrink:0,position:"relative" }}>
                  <button onClick={e=>{e.stopPropagation();setEditEvForm({...ev});setEditEvModal(true);}} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                  <button onClick={e=>{e.stopPropagation();setExpanded(isOpen?null:ev.id);}}
                    style={{ height:28,padding:"0 10px",borderRadius:6,border:`1px solid ${isOpen?C.accent:C.border}`,background:isOpen?C.accent:C.surfaceAlt,cursor:"pointer",color:isOpen?"#fff":C.muted,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>
                    {isOpen?"Done":"View"}
                  </button>
                </div>
              </div>

              {showSortOptions&&(
                <div style={{ padding:"8px 12px",borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",gap:6,flexWrap:"wrap" }}
                  onClick={e=>e.stopPropagation()}>
                  <button type="button" onClick={()=>moveEventCard(ev.id,"up")} style={{ flex:isMobile?"1 1 120px":"0 0 auto",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,fontSize:12,fontWeight:800,color:C.textSub,cursor:"pointer" }}>↑ Up</button>
                  <button type="button" onClick={()=>moveEventCard(ev.id,"down")} style={{ flex:isMobile?"1 1 120px":"0 0 auto",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,fontSize:12,fontWeight:800,color:C.textSub,cursor:"pointer" }}>↓ Down</button>
                </div>
              )}

              {isOpen&&(
                <div style={{ borderTop:`1px solid ${C.border}` }}>
                  {ev.desc&&<p style={{ margin:0,padding:"12px 16px",fontSize:13,color:C.muted,lineHeight:1.6,borderBottom:`1px solid ${C.border}` }}>{ev.desc}</p>}
                  <div style={{ padding:"14px 16px" }}>
                    <p style={{ margin:"0 0 10px",fontSize:11,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>Recommended Products</p>
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      {evProducts.map((p,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isPhaseoutProduct(p)?"#FFFBEB":C.bg,borderRadius:8,borderLeft:`2px solid ${isPhaseoutProduct(p)?"#F59E0B":tc}` }}>
                          {editingProd?.eventId===ev.id&&editingProd?.idx===i?(
                            <div style={{ display:"flex",gap:6,flex:1,alignItems:"center" }}>
                              <input value={edf} onChange={e=>setEdf(e.target.value)} style={{ flex:1,padding:"5px 8px",fontSize:12,borderRadius:6,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }} />
                              <button onClick={()=>{ updProds(ev.id,p=>p.map((x,j)=>j===i?edf:x)); setEditingProd(null); }} style={{ background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0 }}>Save</button>
                              <button onClick={()=>setEditingProd(null)} style={{ background:"none",border:"none",cursor:"pointer",color:C.faint,fontSize:18,lineHeight:1 }}>&#215;</button>
                            </div>
                          ):(
                            <>
                              <span style={{ fontSize:12,color:C.textSub,flex:1 }}>{p}</span>
                              <button onClick={()=>{setEditingProd({eventId:ev.id,idx:i});setEdf(p);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600,padding:"2px 6px",borderRadius:4,flexShrink:0 }}>Edit</button>
                              <button onClick={()=>updProds(ev.id,p=>p.filter((_,j)=>j!==i))} style={{ width:22,height:22,borderRadius:4,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0 }}>&#215;</button>
                            </>
                          )}
                        </div>
                      ))}
                      {evProducts.length===0&&<p style={{ fontSize:12,color:C.faint,margin:"4px 0" }}>No products added yet.</p>}
                    </div>

                    {/* Add product panel */}
                    {addingTo===ev.id?(
                      <div style={{ marginTop:12,padding:14,background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}` }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                          <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.textSub }}>Add Product</p>
                          <div style={{ display:"flex",gap:6 }}>
                            {["manual","storage"].map(m=>(<button key={m} onClick={()=>setProdMode(m)} style={{ padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:600,cursor:"pointer",background:prodMode===m?C.accent:C.surface,color:prodMode===m?"#fff":C.muted,border:`1px solid ${prodMode===m?C.accent:C.border}` }}>{m==="manual"?"Manual":"From Storage"}</button>))}
                          </div>
                        </div>
                        {prodMode==="storage"?(
                          skuStorage.length===0
                            ? <p style={{ fontSize:12,color:C.faint }}>No SKUs in storage yet.</p>
                            : <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={s=>{const b=brands.find(x=>x.id===s.brandId);updProds(ev.id,p=>[...p,[b?.name,s.productName,s.sku].filter(Boolean).join(" - ")]);setAddingTo(null);}} />
                        ):(
                          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                            <TI value={cf.brand}   onChange={v=>setCf(f=>({...f,brand:v}))}   placeholder="Brand" />
                            <TI value={cf.product} onChange={v=>setCf(f=>({...f,product:v}))} placeholder="Product name" />
                            <TI value={cf.sku}     onChange={v=>setCf(f=>({...f,sku:v}))}     placeholder="SKU (optional)" />
                            <div style={{ display:"flex",gap:8 }}>
                              <Btn sm full onClick={()=>{ const l=[cf.brand,cf.product,cf.sku].filter(Boolean).join(" - "); if(l){updProds(ev.id,p=>[...p,l]);setCf({brand:"",product:"",sku:""});setAddingTo(null);} }}>Add</Btn>
                              <Btn sm variant="outline" full onClick={()=>setAddingTo(null)}>Cancel</Btn>
                            </div>
                          </div>
                        )}
                        {prodMode==="storage"&&<div style={{ marginTop:10 }}><Btn xs variant="ghost" onClick={()=>setAddingTo(null)}>Cancel</Btn></div>}
                      </div>
                    ):(
                      <button onClick={()=>{setAddingTo(ev.id);setCf({brand:"",product:"",sku:""});setProdMode("manual");}} style={{ marginTop:12,width:"100%",padding:"9px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px dashed ${C.borderStrong}`,background:"transparent",color:C.muted }}>+ Add product</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
              })}
            </div>
          </section>
        ))}
      </div>

      <ManageTypesModal open={typesModal} onClose={()=>setTypesModal(false)} eventTypes={eventTypes} onChange={saveEventTypesLocal} />

      <Modal open={addEventModal} onClose={()=>setAddEventModal(false)} title="Add Custom Event" width={500}>
        {renderEvForm({
          form: evForm,
          setForm: setEvForm,
          saveLabel: "Add Event",
          onSave: ()=>{ if(!evForm.name.trim()) return; setEvents((p:any)=>{ const next=[...p,{id:uid(),...evForm,calDate:evForm.calDate||null,calDateEnd:evForm.calDateEnd||null,products:[]}]; if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEvForm({name:"",date:"",type:eventTypes[0]?.id||"task",color:eventTypes[0]?.color||"#374151",desc:"",calDate:"",calDateEnd:"",months:[]}); setAddEventModal(false); },
        })}
      </Modal>
      <Modal open={editEvModal&&!!editEvForm} onClose={()=>{setEditEvModal(false);setEditEvForm(null);}} title="Edit Event" width={500}>
        {editEvForm&&renderEvForm({
          form: editEvForm,
          setForm: setEditEvForm,
          saveLabel: "Save Changes",
          onSave: ()=>{ setEvents((p:any)=>{ const next=p.map((e:any)=>e.id===editEvForm.id?editEvForm:e); if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEditEvModal(false); setEditEvForm(null); },
          onDelete: ()=>{ setEvents((p:any)=>{ const next=p.filter((e:any)=>e.id!==editEvForm.id); if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEditEvModal(false); setEditEvForm(null); },
        })}
      </Modal>
    </div>
  );
};

// ─── CHECKLIST ITEM ──────────────────────────────────────────────────────────
const ChecklistItem = ({ item, dept, statuses, onUpdate, onDelete }) => {
  const [expanded,setExpanded] = useState(false);
  const [copied,setCopied] = useState(false);
  const color=DEPTS[dept].color, status=statuses.find(s=>s.id===item.statusId);
  const hasLink=item.link?.trim(), hasNote=item.note?.trim(), hasAssignee=item.assignee?.trim();
  const doneStatus = statuses.find(s=>s.id==="done");

  const toggleDone = () => {
    const nowDone = !item.done;
    // auto-reflect status with the checkbox: checked -> Done, unchecked -> blank
    // (only auto-manage when status is currently blank or already "done", so a manually-chosen status like "Blocked" isn't clobbered by checking the box)
    const shouldAutoStatus = !item.statusId || item.statusId==="done";
    onUpdate({ ...item, done:nowDone, ...(shouldAutoStatus ? { statusId: nowDone ? (doneStatus?.id||"done") : "" } : {}) });
  };

  const copyLink = e => {
    e.stopPropagation();
    if (!item.link) return;
    navigator.clipboard?.writeText(item.link).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1500); });
  };

  return (
    <div style={{ background:item.done?C.bg:C.surface,borderRadius:8,border:`1.5px solid ${item.done?"#E5E7EB":C.border}`,borderLeft:`3px solid ${item.done?"#D1D5DB":color}`,marginBottom:8,overflow:"hidden",opacity:item.done ? .6 : 1,transition:"all .2s" }}>
      <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px" }}>
        <button onClick={toggleDone} style={{ width:18,height:18,borderRadius:4,flexShrink:0,cursor:"pointer",marginTop:1,border:`2px solid ${item.done?color:C.borderStrong}`,background:item.done?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s" }}>
          {item.done&&<span style={{ color:"#fff",fontSize:10,lineHeight:1 }}>&#10003;</span>}
        </button>
        <div style={{ flex:1,minWidth:0 }}>
          <span style={{ fontSize:13,color:C.textSub,lineHeight:1.5,textDecoration:item.done?"line-through":"none",fontWeight:500,display:"block" }}>{item.text}</span>
          {/* Inline meta */}
          {(hasAssignee||hasLink||hasNote)&&(
            <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:4 }}>
              {hasAssignee&&(<div style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ fontSize:10,color:C.faint,width:56,flexShrink:0 }}>Assignee</span><span style={{ fontSize:11,fontWeight:600,color:C.textSub,background:C.surfaceAlt,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.border}` }}>{item.assignee}</span></div>)}
              {hasLink&&(
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:10,color:C.faint,width:56,flexShrink:0 }}>Link</span>
                  <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize:11,color,fontWeight:600,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160 }} onClick={e=>e.stopPropagation()}>{item.link.replace(/^https?:\/\//,"")}</a>
                  <button onClick={copyLink} title="Copy link" style={{ flexShrink:0,width:20,height:20,borderRadius:4,border:`1px solid ${C.border}`,background:copied?"#ECFDF5":C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:copied?"#22C55E":C.muted,padding:0 }}>
                    {copied?"✓":"⧉"}
                  </button>
                  {copied&&<span style={{ fontSize:10,color:"#22C55E",fontWeight:600 }}>Copied</span>}
                </div>
              )}
              {hasNote&&(<div style={{ display:"flex",alignItems:"flex-start",gap:6 }}><span style={{ fontSize:10,color:C.faint,width:56,flexShrink:0,paddingTop:2 }}>Note</span><span style={{ fontSize:11,color:C.muted,lineHeight:1.5 }}>{item.note}</span></div>)}
            </div>
          )}
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0 }}>
          <select value={item.statusId||""} onChange={e=>onUpdate({...item,statusId:e.target.value, ...(e.target.value==="done"?{done:true}:item.statusId==="done"?{done:false}:{})})} onClick={e=>e.stopPropagation()}
            style={{ fontSize:10,fontWeight:700,borderRadius:5,border:`1.5px solid ${status?.color||C.border}`,background:status?(status.color+"14"):C.surfaceAlt,color:status?.color||C.faint,cursor:"pointer",padding:"3px 6px",outline:"none",maxWidth:100 }}>
            <option value="">—</option>
            {statuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div style={{ display:"flex",gap:4 }}>
            <button onClick={()=>setExpanded(x=>!x)}
              style={{ height:24,padding:"0 8px",borderRadius:5,border:`1px solid ${expanded?C.accent:C.border}`,background:expanded?C.accent:C.surface,cursor:"pointer",color:expanded?"#fff":C.muted,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>
              {expanded?"Done":"Edit"}
            </button>
            <button onClick={()=>onDelete(item.id)} style={{ width:24,height:24,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>&#215;</button>
          </div>
        </div>
      </div>
      {expanded&&(
        <div style={{ padding:"12px 12px 14px",borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",flexDirection:"column",gap:10 }}>
          <Field label="Link"><TI value={item.link} onChange={v=>onUpdate({...item,link:v})} placeholder="https://..." /></Field>
          <Field label="Note"><TI value={item.note} onChange={v=>onUpdate({...item,note:v})} placeholder="Add context or detail" /></Field>
          <Field label="Assignee"><TI value={item.assignee} onChange={v=>onUpdate({...item,assignee:v})} placeholder="Name or @handle" /></Field>
        </div>
      )}
    </div>
  );
};

// ─── CHECKLIST BOARD ─────────────────────────────────────────────────────────
const ChecklistBoard = ({ group, onBack, skuStorage, brands, templates, launchTypes, events, onStateChange, initialItems, onItemsChange, statuses, setStatuses, onUpdateGroup, initialGroupTab="tasks", onGroupTabChange }: any) => {
  const { isMobile } = useBreakpoint();
  const saveStatuses = (s:any[]) => { setStatuses(s); };
  const [statusModal,setStatusModal] = useState(false);
  const [groupEditModal,setGroupEditModal] = useState(false);
  const [items,setItems] = useState(()=>{ if(initialItems) return initialItems; const out:any={}; Object.keys(DEPTS).forEach(dept=>{ out[dept]=(templates[group.launchType]?.[dept]||[]).map((t:string)=>({id:uid(),text:t,done:false,link:"",note:"",assignee:"",statusId:"",custom:false})); }); return out; });
  const [newText,setNewText]         = useState({ecommerce:"",marketing:"",digital:""});
  const [activeDept,setActiveDept]   = useState("all");
  const [activeGroupTab,setActiveGroupTabState] = useState(safeChecklistInnerTab(initialGroupTab));
  const setActiveGroupTab = (nextTab:any) => {
    const safeTab = safeChecklistInnerTab(nextTab);
    setActiveGroupTabState(safeTab);
    if(onGroupTabChange) onGroupTabChange(safeTab);
  };
  const [skuPickDept,setSkuPickDept] = useState(null);
  const [productDetail,setProductDetail] = useState<any>(null);
  const [productEdit,setProductEdit] = useState<any>(null);
  const [productTableEditOpen,setProductTableEditOpen] = useState(false);
  const [productTableDraft,setProductTableDraft] = useState<any[]>([]);
  const [aiBusy,setAiBusy] = useState<any>({});
  const [aiError,setAiError] = useState<any>({});
  const [savedEcommercePreview,setSavedEcommercePreview] = useState<any>(null);
  const [newEcommerceSection,setNewEcommerceSection] = useState("");
  const [editingEcommerceSection,setEditingEcommerceSection] = useState<any>(null);
  const [editingEcommerceSectionValue,setEditingEcommerceSectionValue] = useState("");
  const [editingEcommerceInstructionValue,setEditingEcommerceInstructionValue] = useState("");
  const [draggingEcommerceSection,setDraggingEcommerceSection] = useState("");
  const [campaignInstructionOpen,setCampaignInstructionOpen] = useState(false);
  const [campaignInstructionDraft,setCampaignInstructionDraft] = useState("");
  const [campaignHeadlineInstructionDraft,setCampaignHeadlineInstructionDraft] = useState("");
  const [campaignSubheadlineInstructionDraft,setCampaignSubheadlineInstructionDraft] = useState("");
  const [campaignCtaInstructionDraft,setCampaignCtaInstructionDraft] = useState("");
  const [campaignOverviewAddedIds,setCampaignOverviewAddedIds] = useState<string[]>([]);
  const [overviewEdit,setOverviewEdit] = useState<any>(null);
  const [actionDoneIds,setActionDoneIds] = useState<string[]>([]);
  const markActionDone = (id:any) => {
    const key = String(id || uid());
    setActionDoneIds((prev:string[])=>Array.from(new Set([...prev,key])));
    window.setTimeout(()=>setActionDoneIds((prev:string[])=>prev.filter((item:string)=>item!==key)),1600);
  };
  const actionDone = (id:any) => actionDoneIds.includes(String(id || ""));
  const TransferBtn = ({ id, children, onClick, variant="outline", style={}, ...props }: any) => {
    const done = actionDone(id);
    return (
      <Btn
        {...props}
        variant={done ? "primary" : variant}
        onClick={(e:any)=>{
          if (typeof onClick === "function") onClick(e);
          markActionDone(id);
        }}
        style={{
          ...(style || {}),
          transform:done ? "scale(1.04)" : "scale(1)",
          boxShadow:done ? "0 0 0 3px rgba(34,197,94,.14)" : "none",
          transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
        }}
      >
        {done ? "✓ Sent" : children}
      </Btn>
    );
  };
  const [campaignDigitalSentIds,setCampaignDigitalSentIds] = useState<string[]>([]);
  const [campaignMarketingSentIds,setCampaignMarketingSentIds] = useState<string[]>([]);
  const [campaignDcGeneratingImageId,setCampaignDcGeneratingImageId] = useState("");
  const [dcProductRefEditKeys,setDcProductRefEditKeys] = useState<Record<string,boolean>>({});
  const toggleDcProductRefEdit = (key:string) => setDcProductRefEditKeys(prev=>({ ...prev, [key]: !prev?.[key] }));
  const closeDcProductRefEdit = (key:string) => setDcProductRefEditKeys(prev=>({ ...prev, [key]: false }));
  const [campaignDcPreview,setCampaignDcPreview] = useState<any>(null);
  const [selectedCampaignProductKeys,setSelectedCampaignProductKeys] = useState<string[]>([]);

  useEffect(()=>{
    if(!initialItems) return;
    setItems(initialItems);
  },[initialItems]);

  useEffect(()=>{
    setActiveGroupTabState(safeChecklistInnerTab(initialGroupTab));
  },[initialGroupTab]);

  const upd    = (dept:string,item:any) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].map((i:any)=>i.id===item.id?item:i)}; if(onItemsChange) onItemsChange(next); return next; });
  const del    = (dept:string,id:string) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].filter((i:any)=>i.id!==id)}; if(onItemsChange) onItemsChange(next); return next; });
  const addItem= (dept:string)=>{ if(!newText[dept].trim()) return; setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text:newText[dept],done:false,link:"",note:"",assignee:"",statusId:"",custom:true}]}; if(onItemsChange) onItemsChange(next); return next; }); setNewText((p:any)=>({...p,[dept]:""})); };
  const addFromSKU=(dept,s)=>{ const b=brands.find(x=>x.id===s.brandId); const text=[b?.name,s.productName,s.sku].filter(Boolean).join(" - "); setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text,done:false,link:"",note:"",assignee:"",statusId:"",custom:true}]}; if(onItemsChange) onItemsChange(next); return next; }); setSkuPickDept(null); };
  const depts=activeDept==="all"?Object.keys(DEPTS):[activeDept];
  const lt=launchTypes?.[group.launchType] || LAUNCH_TYPES[group.launchType] || { label:"Checklist", tag:"Custom", color:C.accent };
  const groupColor = group.calendarColor || lt?.color || C.accent;
  const linkedEvents = (events||[]).filter((ev:any)=>(group.linkedEventIds||[]).includes(ev.id));
  const allItems = Object.values(items).flat();
  const overallDone = allItems.filter(i=>i.done).length;
  const overallPct  = allItems.length ? Math.round(overallDone/allItems.length*100) : 0;

  const findExtraField = (extra:any={}, names:string[] = []) => {
    const normalize = (value:any) => String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
    const safeNames = Array.isArray(names) ? names : [];
    const wanted = safeNames.map(normalize);
    const key = Object.keys(extra||{}).find((k:string)=>{
      const clean = normalize(k);
      return wanted.some((w:string)=>clean===w || clean.includes(w));
    });
    return key ? String(extra[key]||"").trim() : "";
  };

  const cleanValue = (value:any) => String(value||"").trim();
  const cleanLower = (value:any) => cleanValue(value).toLowerCase();
  const normalizeWords = (value:any) => cleanLower(value)
    .replace(/poly\s*resin/g,"polyresin")
    .replace(/[^a-z0-9]+/g," ")
    .split(" ")
    .filter(Boolean);

  const weakSkuWords = new Set([
    "primeo","slique","scrubz","crysalis","moderno","fitspire","gray","label","quencha","nest","design","lab",
    "polyresin","poly","resin","bathroom","accessories","accessory","collection","set","pc","pcs","piece","pieces",
    "white","taupe","gray","grey","black","wt","tp","gy","bk"
  ]);

  const productTokens = (value:any) => normalizeWords(value).filter((word:string)=>!weakSkuWords.has(word));
  const tokenKey = (value:any) => productTokens(value).join("|");

  const fieldCollection = (item:any) => [
    item.collection,
    item.category,
    item.productCategory,
    findExtraField(item.extraFields||{},["collection","category","productcategory","product category"])
  ].map(cleanValue).find(Boolean) || "";

  const brandNameFor = (item:any) => cleanValue((brands||[]).find((b:any)=>b.id===item?.brandId)?.name || item?.brand || "");
  const skuCodeFor = (item:any) => cleanValue(item?.sku || item?.value || "");

  const colorHints = (value:any) => {
    const v = cleanLower(value);
    const hints:string[] = [];
    if(/(^|[-_\s])(wt|white)($|[-_\s])/.test(v)) hints.push("wt","white");
    if(/(^|[-_\s])(tp|taupe)($|[-_\s])/.test(v)) hints.push("tp","taupe");
    if(/(^|[-_\s])(gy|gray|grey)($|[-_\s])/.test(v)) hints.push("gy","gray","grey");
    if(/(^|[-_\s])(bk|black)($|[-_\s])/.test(v)) hints.push("bk","black");
    return hints;
  };

  const findLatestSkuStorageItem = (sku:any, index:number, allSkus:any[] = []) => {
    const skuKey = cleanLower(sku?.sku || sku?.value);
    const productText = cleanValue(sku?.productName || sku?.name || sku?.value || "");
    const productKey = cleanLower(productText);
    const sourceId = sku?.sourceId || sku?.storageId || sku?.skuStorageId || sku?.id;

    const exact = (skuStorage||[]).find((item:any)=>{
      const itemSku = cleanLower(item?.sku || item?.value);
      return (
        (sourceId && item?.id===sourceId) ||
        (skuKey && itemSku && itemSku===skuKey)
      );
    });
    if(exact) return exact;

    const wantedTokens = productTokens(productText);
    const wantedKey = wantedTokens.join("|");
    if(!wantedTokens.length) return null;

    const skuBrand = brandNameFor(sku);
    const skuCollection = cleanLower(fieldCollection(sku));
    const skuHints = colorHints(`${sku?.sku||""} ${sku?.value||""} ${sku?.productName||""}`);

    const candidateRows = (skuStorage||[]).map((item:any)=>{
      const itemProduct = cleanValue(item?.productName || item?.name || item?.value || "");
      const itemTokens = productTokens(itemProduct);
      const matchedTokens = wantedTokens.filter((token:string)=>itemTokens.includes(token)).length;
      const containsProduct = cleanLower(itemProduct).includes(productKey) || productKey.includes(cleanLower(itemProduct));
      if(matchedTokens < wantedTokens.length && !containsProduct) return null;

      const itemBrand = cleanLower(brandNameFor(item));
      const itemCollection = cleanLower(fieldCollection(item));
      const itemSku = cleanLower(item?.sku || item?.value);
      let score = matchedTokens * 10;

      if(skuBrand && itemBrand && itemBrand===cleanLower(skuBrand)) score += 8;
      if(skuCollection && itemCollection && (itemCollection.includes(skuCollection) || skuCollection.includes(itemCollection))) score += 4;
      if(skuHints.some((hint:string)=>itemSku.includes(hint) || cleanLower(itemProduct).includes(hint))) score += 5;

      return { item, score, itemSku };
    }).filter(Boolean) as any[];

    if(!candidateRows.length) return null;

    candidateRows.sort((a:any,b:any)=>b.score-a.score || String(a.itemSku||"").localeCompare(String(b.itemSku||"")));

    const sameBefore = (allSkus||[]).slice(0,index).filter((prev:any)=>{
      const prevKey = tokenKey(prev?.productName || prev?.name || prev?.value || "");
      return prevKey && prevKey===wantedKey;
    }).length;

    const topScore = candidateRows[0]?.score || 0;
    const pool = candidateRows.filter((row:any)=>row.score >= Math.max(1, topScore - 5));
    return pool[sameBefore % pool.length]?.item || candidateRows[0]?.item || null;
  };

  const extractChecklistProductImageLinks = (item:any):string[] => {
    if(!item) return [];
    const directValues:any[] = [
      item?.imageLink,
      item?.imageUrl,
      item?.imageURL,
      item?.imageLinks,
      item?.productImageLink,
      item?.productImageUrl,
      item?.referenceLink,
      item?.referenceUrl,
      item?.link,
      item?.url,
      item?.productLink,
      item?.links,
    ];
    const extra = item?.extraFields && typeof item.extraFields === "object" ? item.extraFields : {};
    Object.entries(extra).forEach(([key,value]:any)=>{
      const cleanKey = String(key || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
      if(cleanKey.includes("image") || cleanKey.includes("link") || cleanKey.includes("url") || cleanKey.includes("reference")) directValues.push(value);
    });
    Object.entries(item || {}).forEach(([key,value]:any)=>{
      const cleanKey = String(key || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
      if(cleanKey.includes("image") || cleanKey.includes("link") || cleanKey.includes("url") || cleanKey.includes("reference")) directValues.push(value);
    });
    const urls = directValues
      .flatMap((value:any)=>Array.isArray(value) ? value : [value])
      .flatMap((value:any)=>{
        const raw = String(value || "");
        const matches = raw.match(/https?:\/\/[^\s,"'<>]+/gi) || [];
        return matches.map((url:string)=>url.trim().replace(/[)\].,;]+$/g,""));
      })
      .filter(Boolean);
    return Array.from(new Set(urls));
  };

  const getChecklistProductImageLink = (...items:any[]) => {
    return Array.from(new Set(items.flatMap((item:any)=>extractChecklistProductImageLinks(item)))).filter(Boolean)[0] || "";
  };

  const getSkuInfo = (sku:any, index:number) => {
    const allSkus = group.skus || [];
    const storageItem = findLatestSkuStorageItem(sku,index,allSkus) || {};

    const storageBrand = brandNameFor(storageItem);
    const skuBrand = brandNameFor(sku);
    const hasLocalOverride = !!sku?.localProductOverride;
    const brandId = hasLocalOverride ? (cleanValue(sku.brandId) || cleanValue(storageItem.brandId)) : (cleanValue(storageItem.brandId) || cleanValue(sku.brandId));

    const storageCollection = fieldCollection(storageItem);
    const skuCollection = fieldCollection(sku);

    const storageProduct = cleanValue(storageItem.productName) || cleanValue(storageItem.name) || cleanValue(storageItem.value) || cleanValue(storageItem.sku);
    const skuProduct = cleanValue(sku.productName) || cleanValue(sku.name) || cleanValue(sku.value) || cleanValue(sku.sku);
    const storageSku = cleanValue(storageItem.sku) || cleanValue(storageItem.skuCode) || cleanValue(storageItem.value);
    const localSku = cleanValue(sku.sku) || cleanValue(sku.skuCode) || cleanValue(sku.value);
    const product = hasLocalOverride ? (skuProduct || storageProduct) : (storageProduct || skuProduct);
    const skuCode = hasLocalOverride ? (localSku || storageSku) : (storageSku || localSku);
    const imageLinks = Array.from(new Set([
      ...(hasLocalOverride ? extractChecklistProductImageLinks(sku) : extractChecklistProductImageLinks(storageItem)),
      ...(hasLocalOverride ? extractChecklistProductImageLinks(storageItem) : extractChecklistProductImageLinks(sku)),
    ])).filter(Boolean);
    const imageLink = imageLinks[0] || "";

    return {
      ...(sku||{}),
      ...(storageItem||{}),
      ...(hasLocalOverride ? (sku||{}) : {}),
      originalSku:sku,
      index,
      brand: hasLocalOverride ? (skuBrand || storageBrand) : (storageBrand || skuBrand),
      brandId,
      collection: hasLocalOverride ? (skuCollection || storageCollection) : (storageCollection || skuCollection),
      product,
      skuCode,
      imageLink,
      imageLinks,
      links:imageLinks,
      sourceId: storageItem?.id || sku?.sourceId || sku?.storageId || sku?.skuStorageId || sku?.id,
      isSyncedFromSkuStorage: !!storageItem?.id,
    };
  };

  const productRows = (group.skus||[]).map(getSkuInfo).filter((row:any)=>row.product || row.skuCode);

  const openProductDetail = (row:any) => {
    setProductDetail(row);
    setProductEdit({
      productName:row.product || "",
      sku:row.skuCode || row.sku || "",
      imageLink:row.imageLink || (row.imageLinks || row.links || [])[0] || getChecklistProductImageLink(row),
      collection:row.collection || row.category || "",
      brandId:row.brandId || "",
    });
  };

  const saveProductDetail = () => {
    if(!productDetail || !productEdit) return;
    const nextSkus = (group.skus||[]).map((sku:any,idx:number)=>idx===productDetail.index ? {
      ...sku,
      id:sku.id || uid(),
      sourceId:sku.sourceId || sku.storageId || sku.skuStorageId || productDetail.sourceId || productDetail.storageId || productDetail.skuStorageId || productDetail.id,
      storageId:sku.storageId || sku.sourceId || sku.skuStorageId || productDetail.storageId || productDetail.sourceId || productDetail.skuStorageId || productDetail.id,
      skuStorageId:sku.skuStorageId || sku.sourceId || sku.storageId || productDetail.skuStorageId || productDetail.sourceId || productDetail.storageId || productDetail.id,
      value:productEdit.sku || productEdit.productName || sku.value,
      sku:productEdit.sku,
      skuCode:productEdit.sku,
      productName:productEdit.productName,
      collection:productEdit.collection,
      category:productEdit.collection,
      brandId:productEdit.brandId,
      imageLink:productEdit.imageLink || "",
      imageUrl:productEdit.imageLink || "",
      imageLinks:productEdit.imageLink ? [productEdit.imageLink] : [],
      links:productEdit.imageLink ? [productEdit.imageLink] : [],
      extraFields:{ ...(sku.extraFields || {}), ...(productEdit.imageLink ? { "Image Link": productEdit.imageLink } : {}) },
      localProductOverride:true,
    } : sku);
    if(onUpdateGroup) onUpdateGroup({ skus:nextSkus });
    setProductDetail(null);
    setProductEdit(null);
  };

  const openProductTableEdit = () => {
    setProductTableDraft(productRows.map((row:any)=>({
      index:row.index,
      brandId:row.brandId || "",
      collection:row.collection || row.category || "",
      productName:row.product || row.productName || "",
      sku:row.skuCode || row.sku || "",
      imageLink:row.imageLink || (row.imageLinks || row.links || [])[0] || getChecklistProductImageLink(row),
    })));
    setProductTableEditOpen(true);
  };

  const updateProductTableDraft = (idx:number, patch:any) => {
    setProductTableDraft((prev:any[])=>prev.map((row:any,rowIndex:number)=>rowIndex===idx ? { ...row, ...patch } : row));
  };

  const saveProductTableEdit = () => {
    const byIndex = new Map(productTableDraft.map((row:any)=>[row.index,row]));
    const nextSkus = (group.skus || []).map((sku:any,idx:number)=>{
      const draft:any = byIndex.get(idx);
      if(!draft) return sku;
      const imageLink = String(draft.imageLink || "").trim();
      return {
        ...sku,
        id:sku.id || uid(),
        sourceId:sku.sourceId || sku.storageId || sku.skuStorageId || draft.sourceId || sku.id,
        storageId:sku.storageId || sku.sourceId || sku.skuStorageId || draft.storageId || sku.id,
        skuStorageId:sku.skuStorageId || sku.sourceId || sku.storageId || draft.skuStorageId || sku.id,
        value:draft.sku || draft.productName || sku.value,
        sku:draft.sku || "",
        skuCode:draft.sku || "",
        productName:draft.productName || "",
        collection:draft.collection || "",
        category:draft.collection || "",
        brandId:draft.brandId || "",
        imageLink,
        imageUrl:imageLink,
        imageLinks:imageLink ? [imageLink] : [],
        links:imageLink ? [imageLink] : [],
        extraFields:{ ...(sku.extraFields || {}), ...(imageLink ? { "Image Link": imageLink } : {}) },
        localProductOverride:true,
      };
    });
    if(onUpdateGroup) onUpdateGroup({ skus:nextSkus });
    setProductTableEditOpen(false);
  };

  const workspaceTabs:any[] = [
    { id:"tasks", label:"Tasks", sub:"Checklist board" },
    { id:"ecommerce", label:"E-commerce", sub:"Listing copy and marketplace assets" },
    { id:"marketing", label:"Marketing", sub:"Campaign copy and ads direction" },
    { id:"digital", label:"Digital Creative", sub:"Creative briefs and image prompts" },
    { id:"livestream", label:"Livestream", sub:"Live selling plan and scripts" },
    { id:"overview", label:"Overview", sub:"Collected final outputs" },
  ];

  const checklistTypeLabel = String(lt?.label || group?.launchType || group?.type || "").toLowerCase();
  const canShowLivestreamTab = checklistTypeLabel.includes("product introduction") || checklistTypeLabel.includes("product reactivation") || checklistTypeLabel.includes("campaign");
  const visibleWorkspaceTabs = workspaceTabs.filter((tab:any)=>tab.id!=="livestream" || canShowLivestreamTab);

  const workspaceConfig:any = {
    ecommerce:{
      title:"E-commerce Overview",
      description:"Build listing text, marketplace copy, SEO titles, bullets, and product image prompts for the selected products.",
      textLabel:"AI Text Generation",
      textPlaceholder:"Example: Generate Shopee/Lazada product title, short description, bullet points, and SEO keywords for these selected products.",
      imageLabel:"AI Image Generation",
      imagePlaceholder:"Example: Create a clean marketplace hero image prompt with product benefits, lifestyle setting, and no text overlay.",
      outputHint:"Generated e-commerce text and image prompts will appear here once AI generation is connected.",
    },
    marketing:{
      title:"Marketing Overview",
      description:"Plan campaign angles, hooks, captions, offer messaging, ad copy, and content ideas for the selected products.",
      textLabel:"AI Text Generation",
      textPlaceholder:"Example: Generate 5 campaign hooks, ad captions, selling points, and promo angles for this checklist group.",
      imageLabel:"AI Image Generation",
      imagePlaceholder:"Example: Create a lifestyle campaign image prompt that matches the event/season and target buyers.",
      outputHint:"Generated marketing copy and campaign image prompts will appear here once AI generation is connected.",
    },
    digital:{
      title:"Digital Creative Overview",
      description:"Create visual directions, design briefs, video prompts, shot lists, and creative production notes.",
      textLabel:"AI Text Generation",
      textPlaceholder:"Example: Generate a creative brief, storyboard direction, and shot list for social media content.",
      imageLabel:"AI Image Generation",
      imagePlaceholder:"Example: Create a polished product photography prompt with lighting, background, props, and composition.",
      outputHint:"Generated digital creative briefs and image prompts will appear here once AI generation is connected.",
    },
    livestream:{
      title:"Livestream",
      description:"Plan live selling flow, hooks, talking points, demo sequence, and product callouts.",
      textLabel:"Livestream Script",
      textPlaceholder:"Example: Create a TikTok/Shopee live selling script with opening hook, product demo, offer push, objection handling, and closing CTA.",
      imageLabel:"Livestream Visual Direction",
      imagePlaceholder:"Example: Create a live selling setup direction with table arrangement, product placement, props, lighting, and background.",
      outputHint:"Livestream planning outputs will appear here once AI generation is connected.",
    },
    overview:{
      title:"Overview",
      description:"Collect final outputs from E-commerce, Marketing, and Digital Creative in one clean page.",
    },
  };

  const getPersistedChecklistGroup = () => {
    if (typeof window === "undefined" || !group?.id) return null;
    try {
      const raw = localStorage.getItem("emdc_app_state_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      const storedGroups = Array.isArray(parsed?.checklistGroups) ? parsed.checklistGroups : [];
      return storedGroups.find((item:any)=>item?.id===group.id) || null;
    } catch {
      return null;
    }
  };

  const persistChecklistGroupPatchNow = (patch:any) => {
    if (typeof window === "undefined" || !group?.id || !patch || typeof patch !== "object") return;
    try {
      const raw = localStorage.getItem("emdc_app_state_v1");
      const parsed = raw ? JSON.parse(raw) : {};
      const storedGroups = Array.isArray(parsed?.checklistGroups) ? parsed.checklistGroups : [];
      const nextGroup = { ...(getPersistedChecklistGroup() || group), ...patch };
      const nextGroups = storedGroups.some((item:any)=>item?.id===group.id)
        ? storedGroups.map((item:any)=>item?.id===group.id ? nextGroup : item)
        : [...storedGroups,nextGroup];

      const nextAppState = {
        ...parsed,
        checklistGroups:nextGroups,
      };
      safeSetEmdcAppStateLocal(nextAppState);
      if (patch?.aiWorkspace) writeEmdcGroupWorkspaceBackup(group.id, patch.aiWorkspace);
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const updateAiWorkspace = (tab:string, patch:any) => {
    const persistedGroup = getPersistedChecklistGroup();
    const storedWorkspace = ((persistedGroup || {}).aiWorkspace || {}) as any;
    const groupWorkspace = (group.aiWorkspace || {}) as any;
    const current = {
      ...storedWorkspace,
      ...groupWorkspace,
    };
    const next = {
      ...current,
      [tab]: {
        ...(storedWorkspace[tab] || {}),
        ...(groupWorkspace[tab] || {}),
        ...patch,
      }
    };
    const groupPatch = { aiWorkspace:next };
    writeEmdcGroupWorkspaceBackup(group.id,next);
    if(onUpdateGroup) onUpdateGroup(groupPatch);
    persistChecklistGroupPatchNow(groupPatch);
  };

  const getEcommerceSavedOutputsLocalKey = () => group?.id ? `emdc_ecommerce_saved_outputs_v1_${group.id}` : "";

  const readEcommerceSavedOutputsFromLocal = () => {
    if (typeof window === "undefined") return [];
    const key = getEcommerceSavedOutputsLocalKey();
    if(!key) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const mergeEcommerceSavedOutputs = (...lists:any[][]) => {
    const map = new Map();
    lists.flat().filter(Boolean).forEach((item:any)=>{
      const id = String(item?.id || "").trim();
      const fallback = `${item?.title || ""}|${item?.createdAt || ""}|${String(item?.text || "").slice(0,120)}`;
      const key = id || fallback;
      if(!key.trim()) return;
      map.set(key, { ...(map.get(key) || {}), ...item });
    });
    return Array.from(map.values()).sort((a:any,b:any)=>String(b?.updatedAt || b?.createdAt || "").localeCompare(String(a?.updatedAt || a?.createdAt || "")));
  };

  const writeEcommerceSavedOutputsToLocal = (items:any[] = []) => {
    if (typeof window === "undefined") return;
    const key = getEcommerceSavedOutputsLocalKey();
    if(!key) return;
    try {
      const safeItems = Array.isArray(items) ? items.filter(Boolean).slice(0,60) : [];
      localStorage.setItem(key, JSON.stringify(safeItems));

      const persistedGroup = getPersistedChecklistGroup() || group || {};
      const currentWorkspace = (persistedGroup.aiWorkspace || group.aiWorkspace || {}) as any;
      const nextWorkspace = {
        ...currentWorkspace,
        ecommerce:{
          ...(currentWorkspace.ecommerce || {}),
          savedOutputs:safeItems,
          savedOutputsUpdatedAt:new Date().toISOString(),
        },
      };
      writeEmdcGroupWorkspaceBackup(group.id,nextWorkspace);
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const getMergedEcommerceData = (rawData:any = {}) => {
    const persistedEcommerce = (((getPersistedChecklistGroup() || {}).aiWorkspace || {}).ecommerce || {}) as any;
    const localSavedOutputs = readEcommerceSavedOutputsFromLocal();
    return {
      ...persistedEcommerce,
      ...rawData,
      savedOutputs:mergeEcommerceSavedOutputs(
        localSavedOutputs,
        Array.isArray(persistedEcommerce.savedOutputs) ? persistedEcommerce.savedOutputs : [],
        Array.isArray(rawData?.savedOutputs) ? rawData.savedOutputs : [],
      ),
    };
  };

  const getOverviewLocalStorageKey = () => group?.id ? `emdc_overview_items_v1_${group.id}` : "";

  const readOverviewItemsFromLocal = () => {
    if (typeof window === "undefined") return [];
    const key = getOverviewLocalStorageKey();
    if(!key) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeOverviewItemsToLocal = (items:any[] = []) => {
    if (typeof window === "undefined") return;
    const key = getOverviewLocalStorageKey();
    if(!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(Array.isArray(items) ? items : []));
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const mergeOverviewItems = (...lists:any[][]) => {
    const map = new Map();
    lists.flat().filter(Boolean).forEach((item:any)=>{
      const key = String(item?.id || `${item?.title || ""}-${item?.createdAt || ""}-${item?.updatedAt || ""}`);
      if(!key.trim()) return;
      map.set(key, { ...(map.get(key) || {}), ...item });
    });
    return Array.from(map.values()).sort((a:any,b:any)=>String(b?.updatedAt || b?.createdAt || "").localeCompare(String(a?.updatedAt || a?.createdAt || "")));
  };

  const getOverviewItems = () => {
    const currentOverview = ((group.aiWorkspace || {}).overview || {}) as any;
    const persistedOverview = (((getPersistedChecklistGroup() || {}).aiWorkspace || {}).overview || {}) as any;
    const currentItems = Array.isArray(currentOverview.items) ? currentOverview.items : [];
    const persistedItems = Array.isArray(persistedOverview.items) ? persistedOverview.items : [];
    const localItems = readOverviewItemsFromLocal();
    return mergeOverviewItems(currentItems,persistedItems,localItems);
  };

  const addToOverview = (sourceTab:string, title:string, content:any, kind:string="Text Output", sourceRef:any=null) => {
    const isStructured = content && typeof content === "object";
    const textContent = isStructured ? content : String(content || "").trim();
    if(!isStructured && !textContent) return;
    const items = getOverviewItems();
    const newItem = {
      id:uid(),
      sourceTab,
      kind,
      title:title || `${sourceTab} output`,
      content:textContent,
      sourceRef:sourceRef || null,
      updatedAt:new Date().toISOString(),
      createdAt:new Date().toISOString(),
    };
    const nextItems = [...items,newItem];
    writeOverviewItemsToLocal(nextItems);
    updateAiWorkspace("overview",{ items:nextItems, updatedAt:new Date().toISOString() });
    markActionDone(`overview-${String(sourceTab||"").toLowerCase()}-${String(title||"").toLowerCase().replace(/[^a-z0-9]+/g,"-")}`);
  };

  const addProductIntroEcommerceOutputToOverview = (sourceData:any, actionKey:string="overview-ecommerce-product-rows") => {
    const output = String(sourceData?.generatedText || sourceData?.text || "").trim();
    if(!output) return;
    addToOverview(
      "E-commerce",
      sourceData?.title || "E-commerce Generated Output",
      {
        output,
        productRows:getEcommerceGeneratedProductRows(sourceData),
        collapsed:true,
      },
      "E-commerce Generated Output",
      { tab:"ecommerce", type:"productIntroGeneratedOutput", id:sourceData?.id || "", actionKey }
    );
    markActionDone(actionKey);
  };


  const renderOverviewProductRowsTable = (rows:any[] = []) => {
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if(!safeRows.length) return null;
    return (
      <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch",border:`1px solid ${C.border}`,borderRadius:10,background:C.surface,marginBottom:10 }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11.5,minWidth:isMobile?520:620 }}>
          <thead>
            <tr style={{ background:C.surfaceAlt }}>
              {["Platform","Brand","Category","Product","SKU"].map((head:string)=>(
                <th key={head} style={{ textAlign:"left",padding:"8px 9px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row:any,index:number)=>(
              <tr key={`${row.id || row.sku || row.product || index}`} style={{ borderBottom:index===safeRows.length-1?"none":`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 9px",color:C.textSub,fontWeight:700 }}>{row.platform || "All Platforms"}</td>
                <td style={{ padding:"8px 9px",color:C.textSub,fontWeight:700 }}>{row.brand || ""}</td>
                <td style={{ padding:"8px 9px",color:C.textSub,fontWeight:700 }}>{row.category || row.collection || ""}</td>
                <td style={{ padding:"8px 9px",color:C.text,fontWeight:850 }}>{row.product || row.productName || ""}</td>
                <td style={{ padding:"8px 9px",color:C.muted,fontFamily:"monospace",fontWeight:700 }}>{row.sku || row.skuCode || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOverviewContent = (item:any) => {
    const kind = String(item?.kind || "").toLowerCase();
    const structuredContent = item?.content && typeof item.content === "object" ? item.content : null;

    if(structuredContent && kind.includes("e-commerce generated output")){
      const output = String(structuredContent.output || "").trim();
      const rows = Array.isArray(structuredContent.productRows) ? structuredContent.productRows : [];
      return (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {renderOverviewProductRowsTable(rows)}
          <details style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:0,overflow:"hidden" }}>
            <summary style={{ cursor:"pointer",padding:"10px 12px",fontSize:12,fontWeight:900,color:C.textSub,background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
              View E-commerce Generated Output
            </summary>
            <div style={{ margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:12.5,lineHeight:1.6,color:C.text,padding:14 }}>
              {output || "No generated output."}
            </div>
          </details>
        </div>
      );
    }

    const content = String(item?.content || "");

    if(kind.includes("asset link")){
      const blocks = content.split(/\n\s*\n/).map((block:string)=>block.trim()).filter(Boolean);
      const rows = blocks.map((block:string)=>{
        const lines = block.split(/\n/).map((line:string)=>line.trim()).filter(Boolean);
        const nameLine = lines[0] || "";
        const linkLine = lines.find((line:string)=>/^link:/i.test(line)) || "";
        return {
          name:nameLine.replace(/^\d+\.\s*/,"").trim() || "Untitled Asset",
          link:linkLine.replace(/^link:\s*/i,"").trim(),
        };
      });

      return (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {rows.map((row:any,index:number)=>(
            <div key={`${row.name}-${index}`} style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(120px,.8fr) minmax(0,1.4fr)",gap:8,alignItems:"center",padding:"9px 10px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9 }}>
              <div style={{ fontSize:12,fontWeight:900,color:C.text,wordBreak:"break-word" }}>{row.name}</div>
              {row.link ? (
                <a href={row.link} target="_blank" rel="noreferrer" style={{ fontSize:12,fontWeight:800,color:"#2563EB",textDecoration:"underline",wordBreak:"break-all" }}>
                  {row.link}
                </a>
              ) : (
                <span style={{ fontSize:12,color:C.faint }}>No link added</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return (
      <div style={{ margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:12.5,lineHeight:1.6,color:C.text,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:14 }}>
        {parts.map((part:string,index:number)=>/^https?:\/\//.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noreferrer" style={{ color:"#2563EB",fontWeight:800,textDecoration:"underline",wordBreak:"break-all" }}>{part}</a>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ))}
      </div>
    );
  };

  const formatMainPromotion = (promo:any) => {
    if (promo && typeof promo === "object") {
      const type = String(promo.type || "text");
      const value = String(promo.value || "").trim();
      const text = String(promo.text || "").trim();
      if(type === "discount" && value) return `${value}% OFF${text ? ` · ${text}` : ""}`;
      if(type === "php" && value) return `₱${value} OFF${text ? ` · ${text}` : ""}`;
      return text || value;
    }
    return String(promo || "").trim();
  };

  const getMainPromotionDisplay = (promo:any) => {
    const formatted = formatMainPromotion(promo);
    if (promo && typeof promo === "object") {
      const type = String(promo.type || "text");
      const value = String(promo.value || "").trim();
      const text = String(promo.text || "").trim();
      const typeLabel = type === "discount" ? "Percentage Discount" : type === "php" ? "PHP Discount" : "Custom Promotion";
      const valueLabel = type === "discount" && value ? `${value}%` : type === "php" && value ? `₱${value}` : value || "—";
      return { formatted, type, typeLabel, valueLabel, text };
    }
    return { formatted, type:"text", typeLabel:"Custom Promotion", valueLabel:formatted || "—", text:formatted };
  };


  const renderMainPromotionCard = (promo:any, compact=false, label="Main Promotion") => {
    const promoInfo:any = getMainPromotionDisplay(promo);
    const hasPromo = !!promoInfo.formatted;
    if (!hasPromo && compact) return null;
    return (
      <div style={{ border:`1.5px solid ${hasPromo?"#A7F3D0":C.border}`,background:hasPromo?"#F0FDF4":C.bg,borderRadius:12,padding:14,display:"grid",gap:10 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap" }}>
          <div style={{ minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
              <span style={{ fontSize:11,fontWeight:900,color:hasPromo?"#047857":C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>{label}</span>
              <span style={{ fontSize:10.5,fontWeight:900,color:hasPromo?"#047857":C.faint,background:hasPromo?"#D1FAE5":C.surface,border:`1px solid ${hasPromo?"#A7F3D0":C.border}`,borderRadius:999,padding:"3px 8px" }}>{hasPromo?"Active":"Not set"}</span>
            </div>
            <div style={{ fontSize:22,fontWeight:950,color:hasPromo?"#064E3B":C.text,lineHeight:1.15,wordBreak:"break-word" }}>
              {hasPromo ? promoInfo.formatted.split(" · ")[0] : "No main promotion yet"}
            </div>
            {hasPromo&&promoInfo.text&&promoInfo.formatted.includes(" · ")&&(
              <p style={{ margin:"8px 0 0",fontSize:12.5,color:C.textSub,lineHeight:1.45,whiteSpace:"pre-wrap" }}>{promoInfo.text}</p>
            )}
            {!hasPromo&&!compact&&(
              <p style={{ margin:"8px 0 0",fontSize:12,color:C.muted,lineHeight:1.45 }}>Click Edit to add a discount, voucher, bundle, sale mechanic, or campaign offer.</p>
            )}
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:8 }}>
          <div style={{ padding:"9px 10px",borderRadius:9,background:C.surface,border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3 }}>Promotion Type</div>
            <div style={{ fontSize:12.5,fontWeight:850,color:C.text }}>{hasPromo ? promoInfo.typeLabel : "—"}</div>
          </div>
          <div style={{ padding:"9px 10px",borderRadius:9,background:C.surface,border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3 }}>Value</div>
            <div style={{ fontSize:12.5,fontWeight:850,color:C.text }}>{hasPromo ? promoInfo.valueLabel : "—"}</div>
          </div>
          <div style={{ padding:"9px 10px",borderRadius:9,background:C.surface,border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3 }}>Applies To</div>
            <div style={{ fontSize:12.5,fontWeight:850,color:C.text }}>Selected Products</div>
          </div>
        </div>
      </div>
    );
  };


  const setMainPromotionAcrossTabs = (promo:any) => {
    const current = group.aiWorkspace || {};
    const next = {
      ...current,
      ecommerce:{ ...(current.ecommerce || {}), mainPromotion:promo, mainPromotionDraft:promo, mainPromotionEditing:false },
      marketing:{ ...(current.marketing || {}), mainPromotion:promo },
      digital:{ ...(current.digital || {}), mainPromotion:promo },
      livestream:{ ...(current.livestream || {}), mainPromotion:promo },
    };
    if(onUpdateGroup) onUpdateGroup({ aiWorkspace:next });
  };

  const clearMainPromotionAcrossTabs = () => {
    setMainPromotionAcrossTabs("");
    markActionDone("promo-clear");
  };

  const getOverviewEditableContent = (item:any) => {
    const content:any = item?.content;
    if(content && typeof content === "object") return String(content.output || "");
    return String(content || "");
  };

  const parseOverviewAssetRows = (value:any) => {
    const text = String(value || "").trim();
    if(!text) return [];
    const blocks = text.split(/\n\s*\n/).map((block:string)=>block.trim()).filter(Boolean);
    return blocks.map((block:string,index:number)=>{
      const lines = block.split(/\n/).map((line:string)=>line.trim()).filter(Boolean);
      const first = lines[0] || `Asset ${index+1}`;
      const name = first.replace(/^\d+\.\s*/,"").replace(/^Asset\s*Name:\s*/i,"").trim() || `Asset ${index+1}`;
      const linkLine = lines.find((line:string)=>/^Link\s*:/i.test(line)) || "";
      const link = linkLine ? linkLine.replace(/^Link\s*:\s*/i,"").trim() : (lines.find((line:string)=>/^https?:\/\//i.test(line)) || "");
      return { id:String(name).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || uid(), name, link };
    });
  };

  const formatOverviewAssetRows = (rows:any[] = []) => (Array.isArray(rows) ? rows : [])
    .map((row:any,index:number)=>`${index+1}. ${row.name || "Untitled Asset"}${row.link ? `\n   Link: ${row.link}` : "\n   Link: "}`)
    .join("\n\n");

  const pickOverviewLabeledValue = (text:any, label:string) => {
    const lines = String(text || "").split(/\n/);
    const cleanLabel = String(label || "").toLowerCase();
    for(let i=0;i<lines.length;i++){
      if(lines[i].trim().toLowerCase()===cleanLabel){
        return String(lines[i+1] || "").trim();
      }
      const inline = lines[i].match(new RegExp(`^\\s*${label}\\s*:\\s*(.*)$`,"i"));
      if(inline) return String(inline[1] || "").trim();
    }
    return "";
  };

  const parseSavedDigitalOverviewContent = (value:any) => {
    const text = String(value || "");
    const imageMatch = text.match(/Generated Image:\s*(https?:\/\/[^\s]+)/i);
    const ownPromptMatch = text.match(/Own Prompt:\s*([\s\S]*?)(?:\n\s*\nPrompt:|$)/i);
    const promptMatch = text.match(/Prompt:\s*([\s\S]*)$/i);
    return {
      url:imageMatch?.[1] || "",
      ownPrompt:String(ownPromptMatch?.[1] || "").trim(),
      prompt:String(promptMatch?.[1] || "").trim(),
    };
  };

  const updateMarketingOverviewSource = (sourceRef:any, nextText:string, previousText:string="") => {
    if(typeof window === "undefined") return;
    const sourceId = String(sourceRef?.id || "");
    const previousClean = String(previousText || "").trim();
    const storageKeys = Array.from(new Set([
      sourceRef?.storageKey ? `emdc_marketing_generated_batch_outputs_v1_${sourceRef.storageKey}` : "",
      `emdc_marketing_generated_batch_outputs_v1_${group.id || group.groupName || "group"}_marketing_product_intro`,
      `emdc_marketing_generated_batch_outputs_v1_${group.id || group.groupName || "group"}_marketing_campaign`,
      "emdc_marketing_generated_batch_outputs_v1_global_marketing_default",
    ].filter(Boolean)));

    storageKeys.forEach((key:string)=>{
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        if(!Array.isArray(parsed)) return;
        const shouldUpdate = (item:any) => (sourceId && String(item?.id || "")===sourceId) || (!!previousClean && String(item?.text || item?.imagePrompt || "").trim()===previousClean);
        if(parsed.some(shouldUpdate)){
          localStorage.setItem(key, JSON.stringify(parsed.map((item:any)=>shouldUpdate(item) ? { ...item, text:nextText, updatedAt:new Date().toISOString() } : item)));
        }
      } catch {}
    });

    try {
      const raw = localStorage.getItem("emdc_saved_ad_templates_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if(Array.isArray(parsed)){
        const shouldUpdate = (item:any) => (sourceId && String(item?.id || "")===sourceId) || (!!previousClean && String(item?.text || "").trim()===previousClean);
        if(parsed.some(shouldUpdate)){
          localStorage.setItem("emdc_saved_ad_templates_v1", JSON.stringify(parsed.map((item:any)=>shouldUpdate(item) ? { ...item, text:nextText, updatedAt:new Date().toISOString() } : item)));
        }
      }
    } catch {}
    try { window.dispatchEvent(new Event("storage")); } catch {}
  };

  const updateOverviewSourceFromEdit = (originalItem:any, nextContent:any) => {
    const sourceRef = originalItem?.sourceRef || {};
    const sourceTab = String(sourceRef.tab || originalItem?.sourceTab || "").toLowerCase();
    const sourceType = String(sourceRef.type || "");
    const itemKindText = `${originalItem?.kind || ""} ${originalItem?.title || ""}`.toLowerCase();
    const nextText = typeof nextContent === "object" ? String(nextContent?.output || "") : String(nextContent || "");
    const now = new Date().toISOString();

    if(sourceTab.includes("digital") && (sourceType==="productIntroAssetLinks" || itemKindText.includes("asset link"))){
      const rows = parseOverviewAssetRows(nextText);
      updateAiWorkspace("digital",{ productIntroAssetLinks:rows, productIntroAssetLinksSavedAt:now });
      return;
    }

    if(sourceTab.includes("digital") && sourceType==="savedImageOutput"){
      const parsed = parseSavedDigitalOverviewContent(nextText);
      const digital = ((group.aiWorkspace || {}).digital || {}) as any;
      const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
      const nextSaved = saved.map((entry:any)=>String(entry?.id || "")===String(sourceRef.id || "") ? {
        ...entry,
        url:parsed.url || entry.url || "",
        ownPrompt:parsed.ownPrompt,
        prompt:parsed.prompt || nextText,
        title:overviewEdit?.title || entry.title,
        updatedAt:now,
      } : entry);
      const patch:any = { savedImageOutputs:nextSaved };
      if(sourceRef.sourceRowId){
        const updateRows = (rows:any[]) => Array.isArray(rows) ? rows.map((row:any)=>String(row?.id || "")===String(sourceRef.sourceRowId) ? {
          ...row,
          ownPrompt:parsed.ownPrompt || row.ownPrompt,
          imagePrompt:parsed.prompt || row.imagePrompt,
          generatedImageUrl:parsed.url || row.generatedImageUrl,
          updatedAt:now,
        } : row) : rows;
        if(Array.isArray(digital.productIntroCreativeRows)) patch.productIntroCreativeRows = updateRows(digital.productIntroCreativeRows);
        if(Array.isArray(digital.campaignCreativeRows)) patch.campaignCreativeRows = updateRows(digital.campaignCreativeRows);
      }
      updateAiWorkspace("digital",patch);
      return;
    }

    if(sourceTab.includes("digital") && sourceType==="campaignDigitalItem"){
      const digital = ((group.aiWorkspace || {}).digital || {}) as any;
      const rows = Array.isArray(digital.campaignCreativeRows) ? digital.campaignCreativeRows : [];
      const nextRows = rows.map((row:any)=>String(row?.id || "")===String(sourceRef.id || "") ? {
        ...row,
        headline:pickOverviewLabeledValue(nextText,"Headline") || row.headline,
        subheadline:pickOverviewLabeledValue(nextText,"Subheadline") || row.subheadline,
        cta:pickOverviewLabeledValue(nextText,"CTA") || row.cta,
        overviewEditedText:nextText,
        updatedAt:now,
      } : row);
      updateAiWorkspace("digital",{ campaignCreativeRows:nextRows, generatedText:nextRows.map((entry:any)=>entry.overviewEditedText || formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"), generatedAt:now });
      return;
    }

    if(sourceTab.includes("ecommerce") && (sourceType==="productIntroGeneratedOutput" || itemKindText.includes("e-commerce generated output"))){
      const ecommerce = ((group.aiWorkspace || {}).ecommerce || {}) as any;
      const saved = Array.isArray(ecommerce.savedOutputs) ? ecommerce.savedOutputs : [];
      const patch:any = { generatedText:nextText, generatedAt:now };
      if(sourceRef.id){
        patch.savedOutputs = saved.map((entry:any)=>String(entry?.id || "")===String(sourceRef.id || "") ? { ...entry, text:nextText, title:overviewEdit?.title || entry.title, updatedAt:now } : entry);
      }
      updateAiWorkspace("ecommerce",patch);
      return;
    }

    if(sourceTab.includes("marketing")){
      updateMarketingOverviewSource(sourceRef,nextText,getOverviewEditableContent(originalItem));
      return;
    }

    if(sourceType==="workspaceText" && sourceRef.tab){
      updateAiWorkspace(String(sourceRef.tab),{ generatedText:nextText, generatedAt:now });
      return;
    }

    if(sourceType==="workspaceImage" && sourceRef.tab){
      updateAiWorkspace(String(sourceRef.tab),{ generatedImagePrompt:nextText, imagePrompt:nextText, dcImagePrompt:nextText, generatedAt:now });
      return;
    }

    if(sourceTab.includes("livestream") && sourceType==="topic"){
      updateAiWorkspace("livestream",{ generatedTopicText:nextText, generatedAt:now });
    }
  };

  const openOverviewEdit = (item:any) => {
    setOverviewEdit({
      id:item?.id || "",
      title:item?.title || "Overview Item",
      content:getOverviewEditableContent(item),
      original:item,
    });
  };

  const saveOverviewEdit = () => {
    if(!overviewEdit?.id) return;
    const items = getOverviewItems();
    const original = overviewEdit.original || items.find((item:any)=>item.id===overviewEdit.id) || {};
    const nextContent = original?.content && typeof original.content === "object"
      ? { ...(original.content || {}), output:String(overviewEdit.content || "") }
      : String(overviewEdit.content || "");
    const nextItems = items.map((item:any)=>item.id===overviewEdit.id ? {
      ...item,
      title:overviewEdit.title || item.title,
      content:nextContent,
      updatedAt:new Date().toISOString(),
    } : item);
    writeOverviewItemsToLocal(nextItems);
    updateAiWorkspace("overview",{ items:nextItems, updatedAt:new Date().toISOString() });
    updateOverviewSourceFromEdit({ ...original, title:overviewEdit.title },nextContent);
    markActionDone(`overview-edit-${overviewEdit.id}`);
    setOverviewEdit(null);
  };

  const deleteOverviewItem = (id:string) => {
    const nextItems = getOverviewItems().filter((item:any)=>item.id!==id);
    writeOverviewItemsToLocal(nextItems);
    updateAiWorkspace("overview",{ items:nextItems, updatedAt:new Date().toISOString() });
  };

  const overviewItemToText = (item:any) => {
    const content:any = item?.content;
    if(content && typeof content === "object"){
      const rows = Array.isArray(content.productRows) ? content.productRows : [];
      const rowText = rows.length ? rows.map((row:any)=>[row.platform || "All Platforms", row.brand || "", row.category || row.collection || "", row.product || row.productName || "", row.sku || row.skuCode || ""].filter(Boolean).join(" | ")).join("\n") : "";
      return [rowText, String(content.output || "")].filter(Boolean).join("\n\n");
    }
    return String(content || "");
  };

  const copyOverviewItem = async (item:any) => {
    try { await navigator.clipboard.writeText(overviewItemToText(item)); } catch {}
  };

  const copyAllOverviewItems = async () => {
    const output = getOverviewItems().map((item:any)=>`${item.title}\n${overviewItemToText(item)}`).join("\n\n---\n\n");
    if(!output) return;
    try { await navigator.clipboard.writeText(output); } catch {}
  };

  const formatProductIntroOverviewRows = (extraOutput:any="") => {
    // Overview should receive the actual generated E-commerce output only.
    // Do not include the product-row table with PLATFORM / BRAND / CATEGORY / PRODUCT columns.
    return String(extraOutput || "").trim();
  };

  const normalizeTransferLookupText = (value:any) => String(value || "")
    .toLowerCase()
    .replace(/&/g," and ")
    .replace(/[^a-z0-9]+/g," ")
    .trim();

  const extractTransferUrlsFromValue = (value:any):string[] => {
    const raw = String(value || "");
    if(!raw) return [];
    const matches = raw.match(/https?:\/\/[^\s,"'<>]+/gi) || [];
    return matches.map((url:string)=>url.trim().replace(/[)\].,;]+$/g,"")).filter(Boolean);
  };

  const getTransferImageLinksFromAny = (item:any):string[] => {
    const directValues:any[] = [
      item?.imageLink,
      item?.imageUrl,
      item?.imageURL,
      item?.imageLinks,
      item?.productImageLink,
      item?.productImageUrl,
      item?.referenceLink,
      item?.referenceUrl,
      item?.link,
      item?.url,
      item?.productLink,
      item?.links,
    ];
    const extra = item?.extraFields && typeof item.extraFields === "object" ? item.extraFields : {};
    Object.entries(extra).forEach(([key,value]:any)=>{
      const cleanKey = String(key || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
      if(cleanKey.includes("image") || cleanKey.includes("link") || cleanKey.includes("url") || cleanKey.includes("reference")) directValues.push(value);
    });
    Object.entries(item || {}).forEach(([key,value]:any)=>{
      const cleanKey = String(key || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
      if(cleanKey.includes("image") || cleanKey.includes("link") || cleanKey.includes("url") || cleanKey.includes("reference")) directValues.push(value);
    });
    const urls = directValues.flatMap((value:any)=>Array.isArray(value) ? value : [value])
      .flatMap((value:any)=>extractTransferUrlsFromValue(value));
    return Array.from(new Set(urls));
  };

  const findSkuStorageMatchForTransfer = (row:any) => {
    const rows = Array.isArray(skuStorage) ? skuStorage : [];
    if(!rows.length || !row) return null;
    const targetSku = normalizeTransferLookupText(row.sku || row.skuCode || row.value || "");
    const targetProduct = normalizeTransferLookupText(row.product || row.productName || row.name || "");
    if(targetSku){
      const skuMatch = rows.find((item:any)=>normalizeTransferLookupText(item.sku || item.skuCode || item.value || "") === targetSku);
      if(skuMatch) return skuMatch;
    }
    if(targetProduct){
      const productMatch = rows.find((item:any)=>{
        const itemProduct = normalizeTransferLookupText(item.productName || item.product || item.name || "");
        return itemProduct && (itemProduct === targetProduct || itemProduct.includes(targetProduct) || targetProduct.includes(itemProduct));
      });
      if(productMatch) return productMatch;
    }
    return null;
  };

  const enrichEcommerceTransferProductRow = (row:any) => {
    const skuMatch = findSkuStorageMatchForTransfer(row);
    const links = Array.from(new Set([
      ...getTransferImageLinksFromAny(row),
      ...getTransferImageLinksFromAny(skuMatch || {}),
    ])).filter(Boolean);
    return {
      ...row,
      product:row?.product || row?.productName || skuMatch?.productName || skuMatch?.product || "",
      productName:row?.productName || row?.product || skuMatch?.productName || skuMatch?.product || "",
      sku:row?.sku || row?.skuCode || skuMatch?.sku || skuMatch?.skuCode || "",
      skuCode:row?.skuCode || row?.sku || skuMatch?.skuCode || skuMatch?.sku || "",
      brand:row?.brand || skuMatch?.brand || "",
      collection:row?.collection || row?.category || skuMatch?.collection || skuMatch?.category || "",
      category:row?.category || row?.collection || skuMatch?.category || skuMatch?.collection || "",
      imageLink:links[0] || row?.imageLink || skuMatch?.imageLink || "",
      imageLinks:links,
      links,
      productLink:links[0] || row?.productLink || row?.link || "",
      extraFields:{ ...(skuMatch?.extraFields || {}), ...(row?.extraFields || {}) },
    };
  };

  const makeProductIntroTransferProduct = (row:any) => {
    const enriched = enrichEcommerceTransferProductRow(row || {});
    const links = getTransferImageLinksFromAny(enriched);
    return {
      product:enriched.product || enriched.productName || "",
      productName:enriched.productName || enriched.product || "",
      sku:enriched.sku || enriched.skuCode || "",
      skuCode:enriched.skuCode || enriched.sku || "",
      brand:enriched.brand || "",
      collection:enriched.collection || enriched.category || "",
      category:enriched.category || enriched.collection || "",
      imageLink:links[0] || "",
      imageLinks:links,
      links,
      productLink:links[0] || "",
    };
  };

  const getTransferProductImageLinks = (product:any):string[] => {
    const skuMatch = findSkuStorageMatchForTransfer(product);
    return Array.from(new Set([
      ...getTransferImageLinksFromAny(product),
      ...getTransferImageLinksFromAny(skuMatch || {}),
    ])).filter(Boolean);
  };

  const renderTransferImageLinkCell = (product:any) => {
    const links = getTransferProductImageLinks(product);
    const first = links[0] || "";
    if(!first) return <span style={{ color:C.faint }}>—</span>;
    return (
      <a href={first} target="_blank" rel="noreferrer" title={first}
        style={{ display:"inline-block",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.accent,fontSize:12,fontWeight:800,textDecoration:"underline" }}>
        Open Link
      </a>
    );
  };

  const makeProductIntroDcItem = (row:any) => ({
    id:uid(),
    sourceRowId:String(row.id || row.skuCode || row.sku || ""),
    platform:"All Platforms",
    brand:row.brand || "",
    category:row.collection || row.category || "",
    product:row.product || row.productName || "",
    sku:row.skuCode || row.sku || "",
    headline:"",
    subheadline:"",
    cta:"",
    imagePrompt:"",
    products:[makeProductIntroTransferProduct(row)],
    linkedEventContext:group.groupName || "Product Introduction",
    createdAt:new Date().toISOString(),
  });

  const makeProductIntroDcGroupedItem = (rows:any[]) => {
    const cleanRows = (rows || []).filter(Boolean);
    const transferGroupId = uid();
    return {
      id:transferGroupId,
      transferGroupId,
      isProductListCard:true,
      sourceRowId:`group-${Date.now()}`,
      platform:"All Platforms",
      brand:joinUniqueCampaignValues(cleanRows.map((row:any)=>row.brand || "")),
      category:joinUniqueCampaignValues(cleanRows.map((row:any)=>row.collection || row.category || "")),
      product:cleanRows.map((row:any)=>row.product || row.productName || row.skuCode || row.sku).filter(Boolean).join(" + "),
      sku:cleanRows.map((row:any)=>row.skuCode || row.sku).filter(Boolean).join(", "),
      headline:"",
      subheadline:"",
      cta:"",
      imagePrompt:"",
      products:cleanRows.map((row:any)=>makeProductIntroTransferProduct(row)),
      linkedEventContext:group.groupName || "Product Introduction",
      createdAt:new Date().toISOString(),
    };
  };

  const normalizeProductIntroTransferCards = (rows:any[]) => {
    const cleanRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!cleanRows.length) return [];

    const cards:any[] = [];
    const legacySingles:any[] = [];

    cleanRows.forEach((row:any) => {
      const products = Array.isArray(row.products) && row.products.length ? row.products : [];
      if (row.isProductListCard || row.transferGroupId || products.length > 1) {
        cards.push(row);
        return;
      }
      legacySingles.push(row);
    });

    if (legacySingles.length) {
      const legacyCard = makeProductIntroDcGroupedItem(legacySingles);
      legacyCard.id = `legacy-${legacySingles.map((row:any)=>row.id || row.sku || row.product || "item").join("-")}`;
      legacyCard.createdAt = legacySingles[0]?.createdAt || new Date().toISOString();
      cards.unshift(legacyCard);
    }

    return cards;
  };

  const getEcommerceTransferRowsBackupKey = (targetTab:string, transferType:string) => group?.id ? `emdc_ecommerce_transfer_rows_v1_${group.id}_${targetTab}_${transferType}` : "";

  const getTransferRowIdentity = (row:any, idx:number=0) => {
    const products = Array.isArray(row?.products) && row.products.length ? row.products : [row];
    const productSig = products
      .map((item:any)=>String(item?.sku || item?.skuCode || item?.product || item?.productName || "").trim())
      .filter(Boolean)
      .sort()
      .join("|");
    return String(row?.sourceRowId || row?.transferGroupId || row?.id || productSig || `row-${idx}`);
  };

  const normalizeTransferRowsForStorage = (rows:any[] = []) => (Array.isArray(rows) ? rows : []).filter(Boolean).map((row:any)=>({
    ...row,
    products:Array.isArray(row?.products) && row.products.length ? row.products.map((product:any)=>makeProductIntroTransferProduct(product)) : [makeProductIntroTransferProduct(row)],
    updatedAt:row?.updatedAt || new Date().toISOString(),
  }));

  const readEcommerceTransferRowsBackup = (targetTab:string, transferType:string) => {
    if (typeof window === "undefined") return [];
    const key = getEcommerceTransferRowsBackupKey(targetTab,transferType);
    if(!key) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch { return []; }
  };

  const writeEcommerceTransferRowsBackup = (targetTab:string, transferType:string, rows:any[] = []) => {
    if (typeof window === "undefined") return;
    const key = getEcommerceTransferRowsBackupKey(targetTab,transferType);
    if(!key) return;
    try {
      const cleanRows = normalizeTransferRowsForStorage(rows);
      localStorage.setItem(key, JSON.stringify(cleanRows));
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const mergeEcommerceTransferRows = (...lists:any[][]) => {
    const map = new Map<string,any>();
    lists.flat().filter(Boolean).forEach((row:any,idx:number)=>{
      const normalized = normalizeTransferRowsForStorage([row])[0] || row;
      map.set(getTransferRowIdentity(normalized,idx), normalized);
    });
    return Array.from(map.values());
  };

  const getMarketingDcTransferRowsBackupKey = (transferType:string) => {
    const groupKey = String(group?.id || group?.groupName || "").trim().replace(/[^a-z0-9_-]+/gi,"_");
    return groupKey ? `emdc_marketing_dc_transfer_rows_v2_${groupKey}_${transferType}` : "";
  };

  const getLegacyMarketingDcTransferRowsBackupKey = (transferType:string) => group?.id ? `emdc_marketing_dc_transfer_rows_v1_${group.id}_${transferType}` : "";

  const getMarketingDcDirectQueueKey = (transferType:string) => {
    const groupKey = String(group?.id || group?.groupName || "").trim().replace(/[^a-z0-9_-]+/gi,"_");
    return groupKey ? `emdc_marketing_dc_direct_queue_v1_${groupKey}_${transferType}` : "";
  };

  // Extra durable Marketing → Digital Creative queue.
  // This prevents transferred Marketing ad outputs from disappearing when React state,
  // cloud sync, or checklist-type detection is delayed. Digital Creative reads this
  // queue directly using the current checklist group id/name.
  const MARKETING_TO_DC_GLOBAL_QUEUE_KEY = "emdc_marketing_to_dc_outputs_v3";
  const [marketingDcTransferTick,setMarketingDcTransferTick] = useState(0);
  useEffect(()=>{
    if (typeof window === "undefined") return;
    const bump = () => setMarketingDcTransferTick((value:number)=>value+1);
    window.addEventListener("emdc-marketing-dc-transfer", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("emdc-marketing-dc-transfer", bump);
      window.removeEventListener("storage", bump);
    };
  },[]);
  // Direct inbox for Marketing → Digital Creative transfers.
  // This is intentionally small and independent from the large app-state payload,
  // so Send to DC still works even when SKU Storage is huge or localStorage is near quota.
  const MARKETING_TO_DC_DIRECT_INBOX_KEY = "emdc_marketing_to_dc_direct_inbox_v1";
  const getMarketingDcGroupIdentity = () => ({
    groupId:String(group?.id || "").trim(),
    groupName:String(group?.groupName || group?.name || "").trim(),
  });
  const getMarketingDcDirectInboxMemory = () => {
    if (typeof window === "undefined") return [];
    const w:any = window as any;
    return Array.isArray(w.__emdcMarketingDcDirectInbox) ? w.__emdcMarketingDcDirectInbox : [];
  };

  const setMarketingDcDirectInboxMemory = (rows:any[] = []) => {
    if (typeof window === "undefined") return;
    try { (window as any).__emdcMarketingDcDirectInbox = Array.isArray(rows) ? rows : []; } catch {}
  };

  const getMarketingDcDirectRowGroupMatches = (row:any, transferType:string) => {
    const { groupId, groupName } = getMarketingDcGroupIdentity();
    const rowType = String(row?._dcTransferType || row?.transferType || "");
    const rowGroupId = String(row?._dcGroupId || row?.groupId || "").trim();
    const rowGroupName = String(row?._dcGroupName || row?.groupName || "").trim();
    const typeMatches = !transferType || rowType === transferType;
    const groupMatches = (!!groupId && rowGroupId === groupId) || (!!groupName && rowGroupName === groupName);
    return typeMatches && groupMatches;
  };

  const stampMarketingDcDirectRows = (transferType:string, rows:any[] = []) => {
    const { groupId, groupName } = getMarketingDcGroupIdentity();
    return normalizeTransferRowsForStorage(rows).map((row:any)=>({
      ...row,
      _dcTransferType:transferType,
      _dcGroupId:groupId,
      _dcGroupName:groupName,
      transferType,
      groupId,
      groupName,
      transferredFrom:"Marketing",
      transferredAt:row?.transferredAt || new Date().toISOString(),
    }));
  };

  const readMarketingDcDirectInbox = (transferType:string) => {
    if (typeof window === "undefined") return [];
    const lists:any[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(MARKETING_TO_DC_DIRECT_INBOX_KEY) || "[]");
      if(Array.isArray(parsed)) lists.push(...parsed);
    } catch {}
    try {
      const parsed = JSON.parse(sessionStorage.getItem(MARKETING_TO_DC_DIRECT_INBOX_KEY) || "[]");
      if(Array.isArray(parsed)) lists.push(...parsed);
    } catch {}
    lists.push(...getMarketingDcDirectInboxMemory());
    return lists.filter((row:any)=>getMarketingDcDirectRowGroupMatches(row,transferType));
  };

  const appendMarketingDcDirectInbox = (transferType:string, rows:any[] = []) => {
    if (typeof window === "undefined") return;
    const stampedRows = stampMarketingDcDirectRows(transferType, rows);
    if(!stampedRows.length) return;

    const readAll = (storage:any) => {
      try {
        const parsed = JSON.parse(storage.getItem(MARKETING_TO_DC_DIRECT_INBOX_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    };

    const mergeAll = (current:any[]) => {
      const map = new Map<string,any>();
      (Array.isArray(current) ? current : []).filter(Boolean).forEach((row:any,idx:number)=>{
        map.set(`${String(row?._dcTransferType || row?.transferType || "")}:${String(row?._dcGroupId || row?.groupId || row?._dcGroupName || row?.groupName || "")}:${getTransferRowIdentity(row,idx)}`, row);
      });
      stampedRows.forEach((row:any,idx:number)=>{
        map.set(`${String(row?._dcTransferType || row?.transferType || "")}:${String(row?._dcGroupId || row?.groupId || row?._dcGroupName || row?.groupName || "")}:${getTransferRowIdentity(row,idx)}`, row);
      });
      return Array.from(map.values()).slice(-80);
    };

    const memoryRows = mergeAll(getMarketingDcDirectInboxMemory());
    setMarketingDcDirectInboxMemory(memoryRows);
    try { localStorage.setItem(MARKETING_TO_DC_DIRECT_INBOX_KEY, JSON.stringify(mergeAll(readAll(localStorage)))); } catch {}
    try { sessionStorage.setItem(MARKETING_TO_DC_DIRECT_INBOX_KEY, JSON.stringify(mergeAll(readAll(sessionStorage)))); } catch {}
    try {
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
      window.dispatchEvent(new Event("emdc-marketing-dc-transfer"));
    } catch {}
  };

  const readMarketingDcGlobalQueue = (transferType:string) => {
    if (typeof window === "undefined") return [];
    try {
      const localParsed = JSON.parse(localStorage.getItem(MARKETING_TO_DC_GLOBAL_QUEUE_KEY) || "[]");
      const sessionParsed = JSON.parse(sessionStorage.getItem(MARKETING_TO_DC_GLOBAL_QUEUE_KEY) || "[]");
      const memoryParsed = Array.isArray((window as any).__emdcMarketingDcGlobalQueue) ? (window as any).__emdcMarketingDcGlobalQueue : [];
      const list = [
        ...(Array.isArray(localParsed) ? localParsed : []),
        ...(Array.isArray(sessionParsed) ? sessionParsed : []),
        ...(Array.isArray(memoryParsed) ? memoryParsed : []),
      ];
      const { groupId, groupName } = getMarketingDcGroupIdentity();
      return list.filter((row:any)=>{
        const rowType = String(row?._dcTransferType || row?.transferType || "");
        const rowGroupId = String(row?._dcGroupId || row?.groupId || "").trim();
        const rowGroupName = String(row?._dcGroupName || row?.groupName || "").trim();
        const typeMatches = !transferType || rowType === transferType;
        const groupMatches = (!!groupId && rowGroupId === groupId) || (!!groupName && rowGroupName === groupName);
        return typeMatches && groupMatches;
      });
    } catch { return []; }
  };
  const writeMarketingDcGlobalQueue = (transferType:string, rows:any[] = []) => {
    if (typeof window === "undefined") return;
    try {
      const parsed = JSON.parse(localStorage.getItem(MARKETING_TO_DC_GLOBAL_QUEUE_KEY) || "[]");
      const current = Array.isArray(parsed) ? parsed : [];
      const { groupId, groupName } = getMarketingDcGroupIdentity();
      const remaining = current.filter((row:any)=>{
        const rowType = String(row?._dcTransferType || row?.transferType || "");
        const rowGroupId = String(row?._dcGroupId || row?.groupId || "").trim();
        const rowGroupName = String(row?._dcGroupName || row?.groupName || "").trim();
        const sameType = rowType === transferType;
        const sameGroup = (!!groupId && rowGroupId === groupId) || (!!groupName && rowGroupName === groupName);
        return !(sameType && sameGroup);
      });
      const stampedRows = normalizeTransferRowsForStorage(rows).map((row:any)=>({
        ...row,
        _dcTransferType:transferType,
        _dcGroupId:groupId,
        _dcGroupName:groupName,
        transferType,
        groupId,
        groupName,
        transferredFrom:"Marketing",
        transferredAt:row?.transferredAt || new Date().toISOString(),
      }));
      const nextRows = [...remaining, ...stampedRows];
      try { localStorage.setItem(MARKETING_TO_DC_GLOBAL_QUEUE_KEY, JSON.stringify(nextRows)); } catch {}
      try { sessionStorage.setItem(MARKETING_TO_DC_GLOBAL_QUEUE_KEY, JSON.stringify(nextRows)); } catch {}
      try { (window as any).__emdcMarketingDcGlobalQueue = nextRows; } catch {}
    } catch {}
  };

  const readMarketingDcTransferRowsBackup = (transferType:string) => {
    if (typeof window === "undefined") return [];
    const keys = [
      getMarketingDcTransferRowsBackupKey(transferType),
      getMarketingDcDirectQueueKey(transferType),
      getLegacyMarketingDcTransferRowsBackupKey(transferType),
    ].filter(Boolean);
    const lists:any[] = [];
    keys.forEach((key:string)=>{
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        if(Array.isArray(parsed)) lists.push(...parsed.filter(Boolean));
      } catch {}
    });
    lists.push(...readMarketingDcGlobalQueue(transferType));
    lists.push(...readMarketingDcDirectInbox(transferType));
    return mergeDigitalCreativeRows(lists);
  };

  const writeMarketingDcTransferRowsBackup = (transferType:string, rows:any[] = []) => {
    if (typeof window === "undefined") return;
    const keys = [
      getMarketingDcTransferRowsBackupKey(transferType),
      getMarketingDcDirectQueueKey(transferType),
      getLegacyMarketingDcTransferRowsBackupKey(transferType),
    ].filter(Boolean);
    const cleanRows = normalizeTransferRowsForStorage(rows);
    // Save to the small direct inbox first so transfer works even if big localStorage writes fail.
    appendMarketingDcDirectInbox(transferType, cleanRows);
    try { writeMarketingDcGlobalQueue(transferType, cleanRows); } catch {}
    keys.forEach((key:string)=>{
      try { localStorage.setItem(key, JSON.stringify(cleanRows)); } catch {}
    });
    try {
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
      window.dispatchEvent(new Event("emdc-marketing-dc-transfer"));
    } catch {}
  };

  const mergeDigitalCreativeRows = (...lists:any[][]) => {
    const map = new Map<string,any>();
    lists.flat().filter(Boolean).forEach((row:any,idx:number)=>{
      const normalized = normalizeTransferRowsForStorage([row])[0] || row;
      map.set(getTransferRowIdentity(normalized,idx), normalized);
    });
    return Array.from(map.values());
  };


  // Final reliable bridge for Marketing → Digital Creative.
  // This store is intentionally separate from the heavy app-state/cloud sync so every
  // Marketing ad output can appear in Digital Creative immediately and after refresh.
  const MARKETING_DC_BRIDGE_KEY = "emdc_marketing_dc_bridge_rows_v1";
  const getMarketingDcBridgeGroupKey = () => String(group?.id || group?.groupName || group?.name || "current").trim().replace(/[^a-z0-9_-]+/gi,"_");
  const getMarketingDcBridgeIdentity = () => ({
    groupKey:getMarketingDcBridgeGroupKey(),
    groupId:String(group?.id || "").trim(),
    groupName:String(group?.groupName || group?.name || "").trim(),
  });
  const stampMarketingDcBridgeRows = (rows:any[] = []) => {
    const meta = getMarketingDcBridgeIdentity();
    return normalizeTransferRowsForStorage(rows).map((row:any)=>({
      ...row,
      id:row?.id || uid(),
      _marketingDcBridge:true,
      _marketingDcBridgeGroupKey:meta.groupKey,
      _dcGroupId:meta.groupId,
      _dcGroupName:meta.groupName,
      groupId:meta.groupId,
      groupName:meta.groupName,
      transferredFrom:"Marketing",
      transferredAt:row?.transferredAt || new Date().toISOString(),
    }));
  };
  const bridgeRowMatchesCurrentGroup = (row:any) => {
    const meta = getMarketingDcBridgeIdentity();
    const rowGroupKey = String(row?._marketingDcBridgeGroupKey || row?.groupKey || "").trim();
    const rowGroupId = String(row?._dcGroupId || row?.groupId || "").trim();
    const rowGroupName = String(row?._dcGroupName || row?.groupName || "").trim();
    return (!!meta.groupKey && rowGroupKey === meta.groupKey) || (!!meta.groupId && rowGroupId === meta.groupId) || (!!meta.groupName && rowGroupName === meta.groupName);
  };
  const readAllMarketingDcBridgeRows = () => {
    if (typeof window === "undefined") return [];
    const lists:any[] = [];
    try { const parsed = JSON.parse(localStorage.getItem(MARKETING_DC_BRIDGE_KEY) || "[]"); if(Array.isArray(parsed)) lists.push(...parsed); } catch {}
    try { const parsed = JSON.parse(sessionStorage.getItem(MARKETING_DC_BRIDGE_KEY) || "[]"); if(Array.isArray(parsed)) lists.push(...parsed); } catch {}
    try { const mem = (window as any).__emdcMarketingDcBridgeRows; if(Array.isArray(mem)) lists.push(...mem); } catch {}
    return lists.filter(Boolean);
  };
  const readMarketingDcBridgeRows = () => {
    // reference this state so the Digital Creative tab re-renders when Send to DC is clicked
    void marketingDcTransferTick;
    return mergeDigitalCreativeRows(readAllMarketingDcBridgeRows().filter(bridgeRowMatchesCurrentGroup));
  };
  const writeAllMarketingDcBridgeRows = (rows:any[] = []) => {
    if (typeof window === "undefined") return;
    const cleanRows = mergeDigitalCreativeRows(Array.isArray(rows) ? rows : []).slice(-160);
    try { localStorage.setItem(MARKETING_DC_BRIDGE_KEY, JSON.stringify(cleanRows)); } catch {}
    try { sessionStorage.setItem(MARKETING_DC_BRIDGE_KEY, JSON.stringify(cleanRows)); } catch {}
    try { (window as any).__emdcMarketingDcBridgeRows = cleanRows; } catch {}
    try {
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
      window.dispatchEvent(new Event("emdc-marketing-dc-transfer"));
    } catch {}
    try { setMarketingDcTransferTick((value:number)=>value+1); } catch {}
  };
  const appendMarketingDcBridgeRows = (rows:any[] = []) => {
    const stamped = stampMarketingDcBridgeRows(rows);
    if(!stamped.length) return;
    writeAllMarketingDcBridgeRows(mergeDigitalCreativeRows(readAllMarketingDcBridgeRows(),stamped));
  };
  const deleteMarketingDcBridgeRow = (id:any) => {
    const cleanId = String(id || "");
    if(!cleanId) return;
    const nextRows = readAllMarketingDcBridgeRows().filter((row:any)=>String(row?.id || row?.sourceRowId || "") !== cleanId);
    writeAllMarketingDcBridgeRows(nextRows);
  };
  const updateMarketingDcBridgeRow = (id:any, patch:any = {}) => {
    const cleanId = String(id || "");
    if(!cleanId) return;
    const nextRows = readAllMarketingDcBridgeRows().map((row:any)=>{
      const rowIds = [row?.id,row?.sourceRowId,row?.cardId].map((value:any)=>String(value || "")).filter(Boolean);
      return rowIds.includes(cleanId) ? { ...row, ...patch } : row;
    });
    writeAllMarketingDcBridgeRows(nextRows);
  };
  const clearMarketingDcBridgeRowsForCurrentGroup = () => {
    const nextRows = readAllMarketingDcBridgeRows().filter((row:any)=>!bridgeRowMatchesCurrentGroup(row));
    writeAllMarketingDcBridgeRows(nextRows);
  };

  const persistMarketingDcTransferDirectly = (productIntroRows:any[] = [], campaignRows:any[] = []) => {
    if (typeof window === "undefined" || !group?.id) return;
    try {
      const raw = localStorage.getItem("emdc_app_state_v1");
      const parsed = raw ? JSON.parse(raw) : {};
      const groups = Array.isArray(parsed?.checklistGroups) ? parsed.checklistGroups : [];
      const currentGroup = groups.find((item:any)=>item?.id===group.id) || group || {};
      const currentWorkspace = (currentGroup.aiWorkspace || group.aiWorkspace || {}) as any;
      const currentDigital = (currentWorkspace.digital || {}) as any;
      const nextDigital = {
        ...currentDigital,
        productIntroCreativeRows:mergeDigitalCreativeRows(currentDigital.productIntroCreativeRows || [], productIntroRows),
        campaignCreativeRows:mergeDigitalCreativeRows(currentDigital.campaignCreativeRows || [], campaignRows),
        productIntroRowsCleared:false,
        generatedAt:new Date().toISOString(),
        lastMarketingDcTransferAt:new Date().toISOString(),
      };
      const nextWorkspace = { ...currentWorkspace, digital:nextDigital };
      const nextGroup = { ...currentGroup, aiWorkspace:nextWorkspace };
      const nextGroups = groups.some((item:any)=>item?.id===group.id) ? groups.map((item:any)=>item?.id===group.id ? nextGroup : item) : [...groups,nextGroup];
      safeSetEmdcAppStateLocal({ ...parsed, checklistGroups:nextGroups });
      writeEmdcGroupWorkspaceBackup(group.id,nextWorkspace);
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const getProductIntroDigitalRows = () => {
    const digital = ((group.aiWorkspace || {}).digital || {}) as any;
    return Array.isArray(digital.productIntroCreativeRows) ? digital.productIntroCreativeRows : [];
  };

  const saveProductIntroDigitalRows = (rows:any[]) => {
    const cleanRows = Array.isArray(rows) ? rows : [];
    updateAiWorkspace("digital",{
      productIntroCreativeRows:cleanRows,
      productIntroRowsCleared:cleanRows.length===0,
      deletedProductIntroDcRowIds:cleanRows.length ? [] : (((group.aiWorkspace || {}).digital || {}) as any).deletedProductIntroDcRowIds || [],
      generatedText:cleanRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
      generatedAt:new Date().toISOString(),
    });
  };

  const getProductIntroMarketingRows = () => {
    const persistedMarketing = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).marketing || {}) as any;
    const marketing = ((group.aiWorkspace || {}).marketing || {}) as any;
    const stateRows = Array.isArray(marketing.productIntroMarketingRows) ? marketing.productIntroMarketingRows : [];
    const persistedRows = Array.isArray(persistedMarketing.productIntroMarketingRows) ? persistedMarketing.productIntroMarketingRows : [];
    const backupRows = readEcommerceTransferRowsBackup("marketing","product_intro");
    return mergeEcommerceTransferRows(persistedRows,stateRows,backupRows);
  };

  const saveProductIntroMarketingRows = (rows:any[]) => {
    const cleanRows = normalizeTransferRowsForStorage(Array.isArray(rows) ? rows : []);
    writeEcommerceTransferRowsBackup("marketing","product_intro",cleanRows);
    updateAiWorkspace("marketing",{
      productIntroMarketingRows:cleanRows,
      productIntroMarketingRowsCleared:cleanRows.length===0,
      generatedText:cleanRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
      generatedAt:new Date().toISOString(),
    });
  };


  const getProductIntroLivestreamRows = () => {
    const persistedLivestream = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).livestream || {}) as any;
    const livestream = ((group.aiWorkspace || {}).livestream || {}) as any;
    const stateRows = Array.isArray(livestream.productIntroLivestreamRows) ? livestream.productIntroLivestreamRows : [];
    const persistedRows = Array.isArray(persistedLivestream.productIntroLivestreamRows) ? persistedLivestream.productIntroLivestreamRows : [];
    const backupRows = readEcommerceTransferRowsBackup("livestream","product_intro");
    return mergeEcommerceTransferRows(persistedRows,stateRows,backupRows);
  };

  const saveProductIntroLivestreamRows = (rows:any[]) => {
    const cleanRows = normalizeTransferRowsForStorage(Array.isArray(rows) ? rows : []);
    writeEcommerceTransferRowsBackup("livestream","product_intro",cleanRows);
    updateAiWorkspace("livestream",{
      productIntroLivestreamRows:cleanRows,
      productIntroLivestreamRowsCleared:cleanRows.length===0,
      generatedAt:new Date().toISOString(),
    });
  };


  const getTransferProductSignature = (transfer:any) => {
    const products = Array.isArray(transfer?.products) && transfer.products.length ? transfer.products : [transfer];
    return products
      .map((item:any)=>String(item?.sku || item?.skuCode || item?.product || item?.productName || "").trim())
      .filter(Boolean)
      .sort()
      .join("|");
  };

  const isSameProductIntroTransferCard = (a:any,b:any) => {
    const aId = String(a?.id || "");
    const bId = String(b?.id || "");
    if (aId && bId && aId === bId) return true;

    const aGroupId = String(a?.transferGroupId || "");
    const bGroupId = String(b?.transferGroupId || "");
    if (aGroupId && bGroupId && aGroupId === bGroupId) return true;

    const aSig = getTransferProductSignature(a);
    const bSig = getTransferProductSignature(b);
    return !!aSig && !!bSig && aSig === bSig;
  };

  const deleteProductIntroMarketingTransfer = (transfer:any) => {
    const currentCards = normalizeProductIntroTransferCards(getProductIntroMarketingRows());
    const nextCards = currentCards.filter((card:any)=>!isSameProductIntroTransferCard(card,transfer));
    saveProductIntroMarketingRows(nextCards);
  };

  const deleteProductIntroLivestreamTransfer = (transfer:any) => {
    const currentCards = normalizeProductIntroTransferCards(getProductIntroLivestreamRows());
    const nextCards = currentCards.filter((card:any)=>!isSameProductIntroTransferCard(card,transfer));
    updateAiWorkspace("livestream",{
      productIntroLivestreamRows:nextCards,
      productIntroLivestreamRowsCleared:nextCards.length===0,
      generatedAt:new Date().toISOString(),
    });
  };

  const deleteProductIntroMarketingTransferAtIndex = (transferIndex:number) => {
    const currentCards = normalizeProductIntroTransferCards(getProductIntroMarketingRows());
    const nextCards = currentCards
      .filter((_:any,idx:number)=>idx!==transferIndex)
      .map((card:any)=>({
        ...card,
        isProductListCard:true,
        transferGroupId:card.transferGroupId || card.id || uid(),
      }));

    saveProductIntroMarketingRows(nextCards);
  };

  const deleteProductIntroLivestreamTransferAtIndex = (transferIndex:number) => {
    const currentCards = normalizeProductIntroTransferCards(getProductIntroLivestreamRows());
    const nextCards = currentCards.filter((_:any,idx:number)=>idx!==transferIndex);
    saveProductIntroLivestreamRows(nextCards);
  };

  const defaultEcommerceOutputSections = [
    "Product Name",
    "Product Overview",
    "Key Features",
    "Variants Available",
    "Color Options",
    "Product Specifications",
    "Perfect For",
    "Care & Use",
    "Package Includes",
    "Best SEO Listing Title",
    "Stronger Lazada/Shopee SEO Version",
    "Recommended Variations",
    "Better Option / Higher AOV",
    "Search Keywords",
  ];

  const isProductIntroEcommerceChecklist = () => {
    const raw = `${group?.launchType || ""} ${lt?.label || ""} ${lt?.tag || ""}`.toLowerCase();
    return raw.includes("introduction") || raw.includes("new launch") || raw.includes("product intro") || raw.includes("reactivation") || raw.includes("relaunch");
  };

  const hasProductNameSection = (sections:any[] = []) => (sections || [])
    .some((section:any)=>String(section || "").trim().toLowerCase() === "product name");

  const normalizeEcommerceOutputSections = (sections:any[] = []) => {
    const clean = Array.from(new Set((sections || []).map((s:any)=>String(s || "").trim()).filter(Boolean)));
    if(!isProductIntroEcommerceChecklist()) return clean;
    const withoutProductName = clean.filter((section:string)=>section.toLowerCase() !== "product name");
    return ["Product Name", ...withoutProductName];
  };

  const getEcommerceOutputSections = () => {
    const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    // Important: if outputSections exists as an empty array, respect it,
    // but Product Introduction defaults must always keep Product Name first.
    if(Array.isArray(data.outputSections)){
      return normalizeEcommerceOutputSections(data.outputSections);
    }
    return normalizeEcommerceOutputSections(defaultEcommerceOutputSections);
  };

  const ecommerceOutputSections = getEcommerceOutputSections();

  const getEcommerceSectionInstructions = () => {
    const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    return data.sectionInstructions && typeof data.sectionInstructions==="object" ? data.sectionInstructions : {};
  };

  const setEcommerceSectionInstruction = (section:string, instruction:string) => {
    const current = getEcommerceSectionInstructions();
    updateAiWorkspace("ecommerce",{
      sectionInstructions:{
        ...current,
        [section]:instruction,
      },
    });
  };

  const getSelectedEcommerceSections = () => {
    const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const all = getEcommerceOutputSections();
    // Important: if selectedSections exists as an empty array, respect it.
    // That means the user intentionally cleared all selected sections.
    if(Array.isArray(data.selectedSections)){
      const selected = data.selectedSections.filter((s:string)=>all.includes(s));
      const savedSections = Array.isArray(data.outputSections) ? data.outputSections : [];
      const needsProductNameMigration = isProductIntroEcommerceChecklist() && !hasProductNameSection(savedSections) && all.includes("Product Name");
      return needsProductNameMigration ? Array.from(new Set(["Product Name", ...selected])) : selected;
    }
    return [...all];
  };

  const saveEcommerceSections = (sections:string[], selected?:string[], instructionsPatch?:any) => {
    const cleanSections = normalizeEcommerceOutputSections(sections || []);
    const nextSections = cleanSections;
    const currentSelected = Array.isArray(selected) ? selected : getSelectedEcommerceSections();
    const nextSelected = currentSelected.filter((s:string)=>nextSections.includes(s));
    const currentInstructions = instructionsPatch || getEcommerceSectionInstructions();
    const nextInstructions:any = {};
    nextSections.forEach((section:string)=>{
      if(currentInstructions?.[section]) nextInstructions[section] = currentInstructions[section];
    });
    const ecommerceData = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const promptRows = Array.isArray(ecommerceData.promptProductRows) && ecommerceData.promptProductRows.length ? ecommerceData.promptProductRows : productRows;
    updateAiWorkspace("ecommerce",{
      outputSections:nextSections,
      selectedSections:nextSelected,
      sectionInstructions:nextInstructions,
      textPrompt:buildEcommercePrompt(nextSections,nextSelected,nextInstructions,promptRows),
    });
  };

  const toggleEcommerceSection = (section:string) => {
    const current = getSelectedEcommerceSections();
    const next = current.includes(section)
      ? current.filter((s:string)=>s!==section)
      : [...current, section];
    updateAiWorkspace("ecommerce",{ selectedSections:next });
  };

  const reorderEcommerceSection = (fromSection:string, toSection:string) => {
    if(!fromSection || !toSection || fromSection===toSection) return;
    const sections = getEcommerceOutputSections();
    const fromIndex = sections.indexOf(fromSection);
    const toIndex = sections.indexOf(toSection);
    if(fromIndex<0 || toIndex<0) return;

    const nextSections = [...sections];
    const [moved] = nextSections.splice(fromIndex,1);
    nextSections.splice(toIndex,0,moved);

    const selected = getSelectedEcommerceSections().filter((s:string)=>nextSections.includes(s));
    saveEcommerceSections(nextSections,selected);
  };

  const setAllEcommerceSections = () => {
    const sections = getEcommerceOutputSections();
    const ecommerceData = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const promptRows = Array.isArray(ecommerceData.promptProductRows) && ecommerceData.promptProductRows.length ? ecommerceData.promptProductRows : productRows;
    updateAiWorkspace("ecommerce",{ selectedSections:[...sections], textPrompt:buildEcommercePrompt(sections,[...sections],getEcommerceSectionInstructions(),promptRows) });
  };
  const clearAllEcommerceSections = () => {
    const sections = getEcommerceOutputSections();
    const ecommerceData = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const promptRows = Array.isArray(ecommerceData.promptProductRows) && ecommerceData.promptProductRows.length ? ecommerceData.promptProductRows : productRows;
    updateAiWorkspace("ecommerce",{
      selectedSections:[],
      textPrompt:buildEcommercePrompt(sections,[],getEcommerceSectionInstructions(),promptRows),
    });
  };

  const addEcommerceSection = () => {
    const label = newEcommerceSection.trim();
    if(!label) return;
    const sections = getEcommerceOutputSections();
    if(sections.some((s:string)=>s.toLowerCase()===label.toLowerCase())){
      setNewEcommerceSection("");
      return;
    }
    saveEcommerceSections([...sections,label],[...getSelectedEcommerceSections(),label]);
    setNewEcommerceSection("");
  };

  const startEditEcommerceSection = (section:string) => {
    setEditingEcommerceSection(section);
    setEditingEcommerceSectionValue(section);
    setEditingEcommerceInstructionValue(getEcommerceSectionInstructions()[section] || "");
  };

  const cancelEditEcommerceSection = () => {
    setEditingEcommerceSection(null);
    setEditingEcommerceSectionValue("");
    setEditingEcommerceInstructionValue("");
  };

  const saveEditedEcommerceSection = () => {
    const oldLabel = String(editingEcommerceSection || "");
    const newLabel = editingEcommerceSectionValue.trim();
    if(!oldLabel || !newLabel) return;
    const sections = getEcommerceOutputSections();
    const nextSections = sections.map((section:string)=>section===oldLabel ? newLabel : section);
    const nextSelected = getSelectedEcommerceSections().map((section:string)=>section===oldLabel ? newLabel : section);
    const instructions = { ...getEcommerceSectionInstructions() };
    if(oldLabel!==newLabel) delete instructions[oldLabel];
    const cleanInstruction = editingEcommerceInstructionValue.trim();
    if(cleanInstruction) instructions[newLabel] = cleanInstruction;
    else delete instructions[newLabel];
    saveEcommerceSections(nextSections,nextSelected,instructions);
    cancelEditEcommerceSection();
  };

  const deleteEcommerceSection = (section:string) => {
    const nextSections = getEcommerceOutputSections().filter((s:string)=>s!==section);
    const nextSelected = getSelectedEcommerceSections().filter((s:string)=>s!==section);
    const instructions = { ...getEcommerceSectionInstructions() };
    delete instructions[section];
    saveEcommerceSections(nextSections,nextSelected,instructions);
    if(editingEcommerceSection===section) cancelEditEcommerceSection();
  };

  const buildEcommercePrompt = (sectionsOverride?:string[], selectedOverride?:string[], instructionsOverride?:any, productRowsOverride?:any[]) => {
    const promptProductRows = Array.isArray(productRowsOverride) && productRowsOverride.length ? productRowsOverride : productRows;
    const mappedProducts = promptProductRows.map((row:any,idx:number)=>`${idx+1}. Brand: ${row.brand||""} | Collection/Category: ${row.collection||row.category||""} | Product: ${row.product||row.productName||""} | SKU: ${row.skuCode||row.sku||""}`).join("\n");
    const allSections = Array.isArray(sectionsOverride) && sectionsOverride.length ? sectionsOverride : getEcommerceOutputSections();
    const selectedSource = Array.isArray(selectedOverride) ? selectedOverride : getSelectedEcommerceSections();
    const selectedSet = new Set(selectedSource);
    const selectedSections = allSections.filter((section:string)=>selectedSet.has(section));
    const sectionInstructions = instructionsOverride || getEcommerceSectionInstructions();
    const structureBlock = selectedSections.map((section:string)=>{
      const instruction = String(sectionInstructions?.[section] || "").trim();
      return instruction ? `${section}\nInstruction: ${instruction}` : section;
    }).join("\n\n");
    return `Create a complete e-commerce listing output for this checklist group.

Group: ${group.groupName}
Operational Type: ${lt.label}
Schedule: ${group.deadline ? (group.deadlineEnd?`${group.deadline} to ${group.deadlineEnd}`:group.deadline) : (Array.isArray(group.monthOnlyMonths)&&group.monthOnlyMonths.length?formatMonthOnlyLabel(group.monthOnlyMonths):"No date")}

Selected products mapped from SKU Storage:
${mappedProducts || "No products selected yet."}

Use uploaded reference images only as visual/catalog reference for product look, specs, materials, sizes, colors, variants, package details, and care instructions. Generate only the selected output sections below. Do not add unselected sections. Make the output ready to copy and paste. Do not use markdown heading symbols like ###. Do not number section headers like 1., 2., or 8. Use clean section titles only.

Selected output sections:
${structureBlock || "No sections selected. Ask the user to select at least one output section."}

Write in clean English for Lazada, Shopee, TikTok Shop, and Shopify listing use.`;
  };

  const getEcommercePromptProductRows = (data:any) => {
    const rows = Array.isArray(data?.promptProductRows) ? data.promptProductRows.filter(Boolean) : [];
    return rows.length ? rows : productRows;
  };

  const getEcommerceGeneratedProductRows = (data:any) => {
    const savedRows = Array.isArray(data?.productRows) ? data.productRows.filter(Boolean) : [];
    if (savedRows.length) return savedRows;
    const generatedRows = Array.isArray(data?.generatedProductRows) ? data.generatedProductRows.filter(Boolean) : [];
    if (generatedRows.length) return generatedRows;
    const promptRows = Array.isArray(data?.promptProductRows) ? data.promptProductRows.filter(Boolean) : [];
    if (promptRows.length) return promptRows;
    return productRows;
  };

  const makeProductIntroTransferRowsForEcommerceOutput = (sourceData:any) => {
    const rows = getEcommerceGeneratedProductRows(sourceData).map((row:any)=>enrichEcommerceTransferProductRow(row));
    return rows.length ? [makeProductIntroDcGroupedItem(rows)] : [];
  };

  const sendProductIntroEcommerceOutputToMarketing = (sourceData:any) => {
    const rowsToSend = makeProductIntroTransferRowsForEcommerceOutput(sourceData);
    if (!rowsToSend.length) return;
    const existingRows = getProductIntroMarketingRows();
    saveProductIntroMarketingRows([...existingRows, ...rowsToSend]);
  };

  const sendProductIntroEcommerceOutputToDigital = (sourceData:any) => {
    const rowsToSend = makeProductIntroTransferRowsForEcommerceOutput(sourceData);
    if (!rowsToSend.length) return;
    saveProductIntroDigitalRows(rowsToSend);
  };

  const sendProductIntroEcommerceOutputToLivestream = (sourceData:any) => {
    const rowsToSend = makeProductIntroTransferRowsForEcommerceOutput(sourceData);
    if (!rowsToSend.length) return;
    const existingRows = getProductIntroLivestreamRows();
    saveProductIntroLivestreamRows([...existingRows, ...rowsToSend]);
  };

  const setEcommercePromptForProducts = (rows:any[]) => {
    const promptRows = Array.isArray(rows) && rows.length ? rows : productRows;
    updateAiWorkspace("ecommerce",{
      promptProductRows:promptRows,
      textPrompt:buildEcommercePrompt(
        getEcommerceOutputSections(),
        getSelectedEcommerceSections(),
        getEcommerceSectionInstructions(),
        promptRows
      ),
    });
  };


  const REFERENCE_IMAGE_MAX_FILES = 8;
  const REFERENCE_IMAGE_MAX_DIMENSION = 900;
  const REFERENCE_IMAGE_MAX_BYTES = 180000;

  const getDataUrlByteSize = (dataUrl:any) => {
    const base64 = String(dataUrl || "").split(",")[1] || "";
    return Math.ceil((base64.length * 3) / 4);
  };

  const readFileAsDataUrl = (file:any) => new Promise<string>((resolve)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

  const loadImageFromDataUrl = (dataUrl:string) => new Promise<any>((resolve,reject)=>{
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const compressCatalogImage = async (file:any) => {
    const originalDataUrl = await readFileAsDataUrl(file);
    if(!originalDataUrl) {
      return { name:file?.name || `Reference image ${Date.now()}`, type:file?.type || "image/png", size:file?.size || 0, dataUrl:"" };
    }

    try {
      const img:any = await loadImageFromDataUrl(originalDataUrl);
      const originalW = Number(img.naturalWidth || img.width || 1);
      const originalH = Number(img.naturalHeight || img.height || 1);
      const scale = Math.min(1, REFERENCE_IMAGE_MAX_DIMENSION / Math.max(originalW, originalH));
      let targetW = Math.max(1, Math.round(originalW * scale));
      let targetH = Math.max(1, Math.round(originalH * scale));
      let quality = 0.74;
      let dataUrl = originalDataUrl;

      for(let attempt=0; attempt<8; attempt++){
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx:any = canvas.getContext("2d");
        if(!ctx) break;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0,0,targetW,targetH);
        ctx.drawImage(img,0,0,targetW,targetH);
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        if(getDataUrlByteSize(dataUrl) <= REFERENCE_IMAGE_MAX_BYTES) break;
        if(quality > 0.5) quality -= 0.08;
        else {
          targetW = Math.max(480, Math.round(targetW * 0.82));
          targetH = Math.max(480, Math.round(targetH * 0.82));
        }
      }

      return {
        name:file?.name || `Reference image ${Date.now()}.jpg`,
        type:"image/jpeg",
        originalType:file?.type || "",
        originalSize:file?.size || 0,
        size:getDataUrlByteSize(dataUrl),
        compressed:true,
        dataUrl,
      };
    } catch {
      if(getDataUrlByteSize(originalDataUrl) <= REFERENCE_IMAGE_MAX_BYTES) {
        return { name:file?.name || `Reference image ${Date.now()}`, type:file?.type || "image/png", size:getDataUrlByteSize(originalDataUrl), dataUrl:originalDataUrl };
      }
      return { name:file?.name || `Reference image ${Date.now()}`, type:file?.type || "image/png", size:getDataUrlByteSize(originalDataUrl), dataUrl:originalDataUrl };
    }
  };

  const compressExistingCatalogFilesForPayload = async (files:any[] = []) => {
    const clean = uniqueCatalogFiles(files || []).slice(0,REFERENCE_IMAGE_MAX_FILES);
    const converted = await Promise.all(clean.map(async (file:any,index:number)=>{
      const dataUrl = String(file?.dataUrl || "");
      if(!dataUrl) return null;
      if(String(file?.type || "").includes("jpeg") && getDataUrlByteSize(dataUrl) <= REFERENCE_IMAGE_MAX_BYTES) {
        return { name:file?.name || `Reference image ${index+1}.jpg`, type:file?.type || "image/jpeg", size:file?.size || getDataUrlByteSize(dataUrl), dataUrl };
      }
      if(!dataUrl.startsWith("data:image/")) return { name:file?.name || `Reference image ${index+1}`, type:file?.type || "image/png", size:file?.size || getDataUrlByteSize(dataUrl), dataUrl };
      try {
        const blob = await fetch(dataUrl).then(r=>r.blob());
        const nextFile:any = new File([blob], file?.name || `Reference image ${index+1}.jpg`, { type:blob.type || file?.type || "image/png" });
        return await compressCatalogImage(nextFile);
      } catch {
        return { name:file?.name || `Reference image ${index+1}`, type:file?.type || "image/png", size:file?.size || getDataUrlByteSize(dataUrl), dataUrl };
      }
    }));
    return converted.filter(Boolean) as any[];
  };

  const handleCatalogUpload = async (tab:string, e:any) => {
    const files = Array.from(e?.target?.files || []).filter((file:any)=>String(file?.type||"").startsWith("image/")) as any[];
    if(!files.length) return;
    const existing = ((group.aiWorkspace || {})[tab]?.catalogFiles || []) as any[];
    const uploaded:any[] = await Promise.all(files.slice(0,REFERENCE_IMAGE_MAX_FILES).map(compressCatalogImage));
    updateAiWorkspace(tab,{ catalogFiles:uniqueCatalogFiles([...existing,...uploaded]).slice(0,REFERENCE_IMAGE_MAX_FILES) });
    e.target.value = "";
  };

  const removeCatalogFile = (tab:string, idx:number) => {
    const current = ((group.aiWorkspace || {})[tab]?.catalogFiles || []) as any[];
    updateAiWorkspace(tab,{ catalogFiles:current.filter((_:any,i:number)=>i!==idx) });
  };

  const readFileAsCatalog = async (file:any) => {
    try {
      return await compressCatalogImage(file);
    } catch {
      return null;
    }
  };

  const addReferenceImages = async (tab:string, filesInput:any) => {
    const files = Array.from(filesInput || []).filter((file:any)=>String(file?.type||"").startsWith("image/")) as any[];
    if(!files.length) return;
    const converted:any[] = (await Promise.all(files.map(readFileAsCatalog))).filter(Boolean) as any[];
    if(!converted.length) return;
    const data = (group.aiWorkspace || {})[tab] || {};
    const existing = data.catalogFiles || [];
    updateAiWorkspace(tab,{ catalogFiles:uniqueCatalogFiles([...existing,...converted]).slice(0,REFERENCE_IMAGE_MAX_FILES) });
  };

  const handlePromptImagePaste = async (tab:string, e:any) => {
    const items = Array.from(e?.clipboardData?.items || []) as any[];
    const files = items
      .filter((item:any)=>String(item?.type||"").startsWith("image/"))
      .map((item:any)=>item.getAsFile())
      .filter(Boolean);
    if(!files.length) return;
    e.preventDefault();
    await addReferenceImages(tab,files);
  };

  const handlePromptImageUpload = async (tab:string, e:any) => {
    const files = Array.from(e?.target?.files || []) as any[];
    await addReferenceImages(tab,files);
    if(e?.target) e.target.value = "";
  };

  const deleteGeneratedEcommerceOutput = () => {
    updateAiWorkspace("ecommerce",{ generatedText:"", generatedAt:"" });
  };

  const copyGeneratedEcommerce = async () => {
    const output = String(((group.aiWorkspace || {}).ecommerce || {}).generatedText || "");
    if(!output) return;
    try { await navigator.clipboard.writeText(output); } catch {}
  };

  const saveEcommerceOutput = () => {
    const data = getMergedEcommerceData(((group.aiWorkspace || {}).ecommerce || {}));
    const output = String(data.generatedText || "").trim();
    if(!output) return;
    const saved = mergeEcommerceSavedOutputs(
      readEcommerceSavedOutputsFromLocal(),
      Array.isArray(data.savedOutputs) ? data.savedOutputs : []
    );
    const now = new Date().toISOString();
    const savedEntry = {
      id:uid(),
      title:`E-commerce Listing ${new Date().toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,
      text:output,
      prompt:data.textPrompt || "",
      productRows:getEcommerceGeneratedProductRows(data),
      createdAt:now,
      updatedAt:now,
    };
    const nextSaved = [savedEntry,...saved].slice(0,60);
    writeEcommerceSavedOutputsToLocal(nextSaved);
    updateAiWorkspace("ecommerce",{
      savedOutputs:nextSaved,
      savedOutputsUpdatedAt:now,
    });
    markActionDone(`ecommerce-save-output-${savedEntry.id}`);
  };

  const openSavedEcommerceOutput = (item:any) => {
    setSavedEcommercePreview(item);
  };

  const copySavedEcommerceOutput = async () => {
    const output = String(savedEcommercePreview?.text || "");
    if(!output) return;
    try { await navigator.clipboard.writeText(output); } catch {}
  };

  const deleteSavedEcommerceOutput = (id:string) => {
    const data = getMergedEcommerceData(((group.aiWorkspace || {}).ecommerce || {}));
    const saved = mergeEcommerceSavedOutputs(
      readEcommerceSavedOutputsFromLocal(),
      Array.isArray(data.savedOutputs) ? data.savedOutputs : []
    );
    const nextSaved = saved.filter((item:any)=>String(item?.id || "")!==String(id || ""));
    writeEcommerceSavedOutputsToLocal(nextSaved);
    updateAiWorkspace("ecommerce",{ savedOutputs:nextSaved, savedOutputsUpdatedAt:new Date().toISOString() });
  };

  const cleanReadyToUseOutput = (value:any) => {
    return String(value || "")
      .replace(/^\s*#{1,6}\s*/gm,"")
      .replace(/^\s*\d+\.\s+(Product Name|Product Overview|Key Features|Variants Available|Color Options|Product Specifications|Perfect For|Care & Use|Package Includes|Best SEO Listing Title|Stronger Lazada\/Shopee SEO Version|Recommended Variations|Better Option \/ Higher AOV|Search Keywords)/gmi,"$1")
      .replace(/^\s*[-*]\s+(Product Name|Product Overview|Key Features|Variants Available|Color Options|Product Specifications|Perfect For|Care & Use|Package Includes|Best SEO Listing Title|Stronger Lazada\/Shopee SEO Version|Recommended Variations|Better Option \/ Higher AOV|Search Keywords)/gmi,"$1")
      .replace(/\n\s*(?:\d+\.\s*)?Recommended Final Listing Structure[\s\S]*$/i,"")
      .trim();
  };

  const uniqueCatalogFiles = (files:any[] = []) => {
    const seen = new Set();
    return (files||[]).filter((file:any)=>{
      const key = `${file?.name||""}|${file?.type||""}|${file?.size||""}|${String(file?.dataUrl||"").slice(0,80)}`;
      if(seen.has(key)) return false;
      seen.add(key);
      return !!file?.dataUrl;
    });
  };

  const generateEcommercePromptFromCatalog = async () => {
    const tab = "ecommerce";
    const data = (group.aiWorkspace || {})[tab] || {};
    const promptCatalogFiles = await compressExistingCatalogFilesForPayload(data.catalogFiles || []);

    if(!promptCatalogFiles.length && !productRows.length) {
      setAiError((p:any)=>({...p,[tab]:"Paste or upload a catalog image first, or select products from SKU Storage."}));
      return;
    }

    setAiBusy((p:any)=>({...p,ecommercePrompt:true}));
    setAiError((p:any)=>({...p,[tab]:""}));

    const mappedProducts = productRows.map((row:any,idx:number)=>({
      no:idx+1,
      brand:row.brand || "",
      collection:row.collection || row.category || "",
      product:row.product || row.productName || "",
      sku:row.skuCode || row.sku || "",
    }));

    const instruction = [
      "Create the AI E-commerce Prompt only, not the final listing output.",
      "Read the catalog/reference image and selected products.",
      "Extract all visible text from the catalog image first: product names, specs, materials, dimensions, capacity, colors, variants, package inclusions, and care instructions.",
      "Use those extracted details when writing the prompt.",
      "Write a clear instruction prompt that will be used later to generate a complete marketplace listing.",
      "The prompt must tell the AI to use a clean copy-paste ready format.",
      "Do not include markdown heading symbols like ###.",
      "Do not number the section headers.",
      "Include the exact required output sections.",
      "Mention that uploaded catalog images are only reference for product look, specs, sizes, colors, and care details.",
    ].join("\n");

    try {
      const res = await fetch("/api/ai/generate-text", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          task:"ecommerce_prompt_from_catalog",
          taskLabel:"E-commerce Prompt from Catalog",
          tone:"professional",
          instruction,
          input:JSON.stringify({
            group:{
              name:group.groupName,
              operationalType:lt.label,
              schedule:group.deadline ? (group.deadlineEnd?`${group.deadline} to ${group.deadlineEnd}`:group.deadline) : (Array.isArray(group.monthOnlyMonths)&&group.monthOnlyMonths.length?formatMonthOnlyLabel(group.monthOnlyMonths):"No date"),
            },
            products:mappedProducts,
            requiredOutputSections:selectedSections,
          },null,2),
          catalogFiles:promptCatalogFiles.map((file:any)=>({
            name:file.name,
            type:file.type || "image/jpeg",
            size:file.size || getDataUrlByteSize(file.dataUrl),
            dataUrl:file.dataUrl,
          })),
          maxOutputTokens:3000,
        }),
      });
      const raw = await res.text();
      let payload:any = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error(raw || "Prompt generation failed."); }
      if(!res.ok) throw new Error(payload?.error || payload?.message || "Prompt generation failed.");
      updateAiWorkspace(tab,{ textPrompt:cleanReadyToUseOutput(payload?.text || "") });
    } catch(err:any) {
      setAiError((p:any)=>({...p,[tab]:err?.message || "Prompt generation failed."}));
    } finally {
      setAiBusy((p:any)=>({...p,ecommercePrompt:false}));
    }
  };

  const generateEcommerceListing = async () => {
    const tab = "ecommerce";
    const data = (group.aiWorkspace || {})[tab] || {};
    const selectedSections = getSelectedEcommerceSections();
    if(!selectedSections.length){
      setAiError((p:any)=>({...p,[tab]:"Please select at least one required output section."}));
      return;
    }
    const promptProductRows = getEcommercePromptProductRows(data);
    const prompt = String(data.textPrompt || buildEcommercePrompt(undefined,undefined,undefined,promptProductRows)).trim();
    if(!prompt) return;

    setAiBusy((p:any)=>({...p,[tab]:true}));
    setAiError((p:any)=>({...p,[tab]:""}));

    const mappedProducts = promptProductRows.map((row:any,idx:number)=>({
      no:idx+1,
      brand:row.brand || "",
      collection:row.collection || "",
      product:row.product || row.productName || "",
      sku:row.skuCode || "",
      material:row.material || row.extraFields?.Material || row.extraFields?.material || "",
      size:row.size || row.extraFields?.Size || row.extraFields?.size || "",
      color:row.color || row.extraFields?.Color || row.extraFields?.color || "",
      capacity:row.capacity || row.extraFields?.Capacity || row.extraFields?.capacity || "",
    }));

    const catalogFiles = await compressExistingCatalogFilesForPayload(data.catalogFiles || []);

    const instruction = [
      "You are EMDC's e-commerce listing assistant for Philippine marketplaces.",
      "Read the selected products and any uploaded catalog/reference files.",
      "Actively read uploaded catalog images and extract all visible text and product details before writing the output.",
      "Use the uploaded catalog pages to extract product specs, materials, dimensions, capacities, color options, package inclusions, and care instructions when visible.",
      "Do not invent exact technical specifications if they are not present in the product list or catalog reference.",
      "If a detail is missing, write it as a clean placeholder like: To be confirmed.",
      "Generate a complete marketplace listing output using the exact required structure.",
      "Write in clear English for Lazada, Shopee, TikTok Shop, and Shopify.",
      "Avoid em dashes.",
      "Make the output ready to copy and paste directly into marketplaces or internal docs.",
      "Do not use markdown heading symbols like ###.",
      "Do not number the section headers like 1., 2., 8., etc.",
      "Use clean section titles only, then the content below each title.",
      "",
      "Required output structure, use only these selected clean section titles. Follow any instruction written under each section:",
      ...selectedSections.map((section:string)=>{
        const instruction = String(getEcommerceSectionInstructions()?.[section] || "").trim();
        return instruction ? `${section}\nInstruction: ${instruction}` : section;
      }),
      "Do not add any unselected sections.",
    ].join("\n");

    try {
      const res = await fetch("/api/ai/generate-text", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          task:"ecommerce_listing",
          taskLabel:"E-commerce Listing Generator",
          tone:"professional",
          instruction,
          input:JSON.stringify({
            prompt,
            group:{
              name:group.groupName,
              operationalType:lt.label,
              schedule:group.deadline ? (group.deadlineEnd?`${group.deadline} to ${group.deadlineEnd}`:group.deadline) : (Array.isArray(group.monthOnlyMonths)&&group.monthOnlyMonths.length?formatMonthOnlyLabel(group.monthOnlyMonths):"No date"),
            },
            products:mappedProducts,
            requiredOutputSections:ecommerceOutputSections,
          },null,2),
          catalogFiles:catalogFiles.map((file:any)=>({
            name:file.name,
            type:file.type || "image/jpeg",
            size:file.size || getDataUrlByteSize(file.dataUrl),
            dataUrl:file.dataUrl,
          })),
          maxOutputTokens:7000,
        }),
      });

      const raw = await res.text();
      let payload:any = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error(raw || "E-commerce generation failed."); }
      if(!res.ok) throw new Error(payload?.error || payload?.message || "E-commerce generation failed.");

      updateAiWorkspace(tab,{
        textPrompt:prompt,
        generatedText:cleanReadyToUseOutput(payload?.text || ""),
        generatedProductRows:promptProductRows,
        generatedAt:new Date().toISOString(),
      });
    } catch (err:any) {
      setAiError((p:any)=>({...p,[tab]:err?.message || "E-commerce generation failed."}));
    } finally {
      setAiBusy((p:any)=>({...p,[tab]:false}));
    }
  };

  const ecommerceCampaignPlatforms = ["All Platforms","Shopee","Lazada","TikTok Shop","Shopify","Meta Ads"];
  const ecommerceCampaignThemes = [
    "Payday Sale",
    "Double Digit Sale",
    "Product Launch",
    "Product Relaunch",
    "Clearance / Phase-Out",
    "Bundle Promo",
    "Back to School",
    "Rainy Season",
    "Christmas / Ber Months",
    "Custom",
  ];

  const getCampaignProductKey = (item:any) => String(item?.sourceId || item?.id || item?.skuCode || item?.sku || item?.product || item?.productName || "").trim();
  const getCampaignProductOptionKey = (item:any,idx:number) => `${getCampaignProductKey(item) || "mapped-product"}__${idx}`;
  const getCampaignProductByOptionKey = (key:string) => {
    const exact = productRows.find((item:any,idx:number)=>getCampaignProductOptionKey(item,idx)===key);
    if(exact) return exact;
    return productRows.find((item:any)=>getCampaignProductKey(item)===key);
  };
  const joinUniqueCampaignValues = (values:any[]) => Array.from(new Set((values || []).map((value:any)=>String(value || "").trim()).filter(Boolean))).join(", ");
  const getCampaignItemsByKeys = (keys:any[]) => (keys || []).map((key:string)=>getCampaignProductByOptionKey(key)).filter(Boolean);
  const summarizeCampaignItems = (items:any[]) => {
    const clean = (items || []).filter(Boolean);
    return {
      product: joinUniqueCampaignValues(clean.map((item:any)=>item.product || item.productName || item.skuCode || item.sku || "Unnamed Product")),
      sku: joinUniqueCampaignValues(clean.map((item:any)=>item.skuCode || item.sku || "")),
      brand: joinUniqueCampaignValues(clean.map((item:any)=>item.brand || "")),
      collection: joinUniqueCampaignValues(clean.map((item:any)=>item.collection || item.category || "")),
    };
  };
  const getCampaignRowProductKeys = (row:any) => {
    if(Array.isArray(row?.productKeys) && row.productKeys.length) return row.productKeys.map((key:any)=>String(key || "").trim()).filter(Boolean);
    const key = String(row?.productKey || "").trim();
    if(!key) return [];
    return key.includes("||") ? key.split("||").map((item:string)=>item.trim()).filter(Boolean) : [key];
  };
  const getEcommerceCampaignRowProducts = (row:any) => getCampaignItemsByKeys(getCampaignRowProductKeys(row)).map((item:any)=>({
    brand:item.brand || "",
    collection:item.collection || item.category || "",
    product:item.product || item.productName || "",
    sku:item.skuCode || item.sku || "",
    imageLink:item.imageLink || item.imageUrl || item.extraFields?.["Image Link"] || item.extraFields?.imageLink || item.extraFields?.imagelink || "",
    links:[item.imageLink || item.imageUrl || item.extraFields?.["Image Link"] || item.extraFields?.imageLink || item.extraFields?.imagelink || ""].filter(Boolean),
  }));

  const getCampaignLinkedEventItems = () => (linkedEvents || []).map((ev:any)=>({
    id:ev.id || "",
    title:ev.title || ev.name || ev.eventName || "Linked Event",
    date:ev.date || ev.startDate || ev.start || ev.deadline || "",
    endDate:ev.endDate || ev.end || ev.deadlineEnd || "",
    month:ev.month || "",
    type:ev.type || ev.category || ev.kind || "",
    tags:Array.isArray(ev.tags) ? ev.tags : [],
  }));

  const getCampaignLinkedEventLabel = () => {
    const items = getCampaignLinkedEventItems();
    if(!items.length) return "No linked event selected";
    return items.map((ev:any)=>ev.title).filter(Boolean).join(", ");
  };

  const getCampaignLinkedEventSchedule = () => {
    const items = getCampaignLinkedEventItems();
    const schedules = items.map((ev:any)=>{
      if(ev.date && ev.endDate && ev.endDate!==ev.date) return `${ev.date} to ${ev.endDate}`;
      return ev.date || ev.month || "";
    }).filter(Boolean);
    return schedules.join(", ");
  };

  const getCampaignContextFromLinkedEvents = () => {
    const label = getCampaignLinkedEventLabel();
    const schedule = getCampaignLinkedEventSchedule();
    return schedule ? `${label} · ${schedule}` : label;
  };

  const getEcommerceCampaignBuilder = () => {
    const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const builder = data.campaignBuilder || {};
    return {
      platform: builder.platform || "All Platforms",
      theme: builder.theme || "Payday Sale",
      customTheme: builder.customTheme || "",
      promotion: builder.promotion || "",
      aiInstructions: builder.aiInstructions || "",
      headlineInstructions: builder.headlineInstructions || "",
      subheadlineInstructions: builder.subheadlineInstructions || "",
      ctaInstructions: builder.ctaInstructions || "",
      selectedProductKey: builder.selectedProductKey || "",
      productRows: Array.isArray(builder.productRows) ? builder.productRows : [],
      generatedText: builder.generatedText || "",
      generatedAt: builder.generatedAt || "",
      savedOutputs: Array.isArray(builder.savedOutputs) ? builder.savedOutputs : [],
    };
  };

  const updateEcommerceCampaignBuilder = (patch:any) => {
    const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
    const currentBuilder = data.campaignBuilder || {};
    updateAiWorkspace("ecommerce",{
      campaignBuilder:{
        ...currentBuilder,
        ...patch,
      },
    });
  };

  const openEcommerceCampaignInstructions = () => {
    const builder = getEcommerceCampaignBuilder();
    setCampaignInstructionDraft(builder.aiInstructions || "");
    setCampaignHeadlineInstructionDraft(builder.headlineInstructions || "");
    setCampaignSubheadlineInstructionDraft(builder.subheadlineInstructions || "");
    setCampaignCtaInstructionDraft(builder.ctaInstructions || "");
    setCampaignInstructionOpen(true);
  };

  const saveEcommerceCampaignInstructions = () => {
    updateEcommerceCampaignBuilder({
      aiInstructions:campaignInstructionDraft,
      headlineInstructions:campaignHeadlineInstructionDraft,
      subheadlineInstructions:campaignSubheadlineInstructionDraft,
      ctaInstructions:campaignCtaInstructionDraft,
    });
    setCampaignInstructionOpen(false);
  };

  const getCampaignMainPromotionDefault = () => formatMainPromotion(((group.aiWorkspace || {}).ecommerce || {}).mainPromotion || "");
  const getCampaignRowDiscountValue = (row:any) => String(row?.discount || "").trim() || getCampaignMainPromotionDefault();

  const getEcommerceCampaignRows = () => {
    const builder = getEcommerceCampaignBuilder();
    return (builder.productRows || []).map((row:any)=>{
      const productKeys = getCampaignRowProductKeys(row);
      const items = getCampaignItemsByKeys(productKeys);
      const summary = summarizeCampaignItems(items);
      return {
        id: row.id || uid(),
        productKey: productKeys.join("||"),
        productKeys,
        product: summary.product || row.product || row.productName || "",
        sku: summary.sku || row.sku || "",
        brand: summary.brand || row.brand || "",
        collection: summary.collection || row.collection || row.category || "",
        platform: row.platform || builder.platform || "All Platforms",
        discount: row.discount || "",
        mechanics: row.mechanics || "",
        headline: row.headline || "",
        subheadline: row.subheadline || "",
        cta: row.cta || "",
        output: row.output || "",
      };
    }).filter((row:any)=>row.product || row.sku);
  };

  const saveEcommerceCampaignRows = (rows:any[]) => {
    updateEcommerceCampaignBuilder({
      productRows: (rows || []).map((row:any)=>({
        id: row.id || uid(),
        productKey: row.productKey || "",
        productKeys: Array.isArray(row.productKeys) ? row.productKeys : getCampaignRowProductKeys(row),
        product: row.product || "",
        sku: row.sku || "",
        brand: row.brand || "",
        collection: row.collection || "",
        platform: row.platform || "",
        discount: row.discount || "",
        mechanics: row.mechanics || "",
        headline: row.headline || "",
        subheadline: row.subheadline || "",
        cta: row.cta || "",
        output: row.output || "",
      })),
    });
  };

  const buildEcommerceCampaignProductRowFromItems = (selectedItems:any[], productKeys:string[], builder:any) => {
    const summary = summarizeCampaignItems(selectedItems);
    return {
      id:uid(),
      productKey: productKeys.join("||"),
      productKeys,
      product:summary.product,
      sku:summary.sku,
      brand:summary.brand,
      collection:summary.collection,
      platform:builder.platform || "All Platforms",
      discount:getCampaignMainPromotionDefault(),
      mechanics:"",
      headline:"",
      subheadline:"",
      cta:"",
      output:"",
    };
  };

  const buildEcommerceCampaignProductRow = (selected:any, productKey:string, builder:any) => (
    buildEcommerceCampaignProductRowFromItems([selected],[productKey],builder)
  );

  const saveCampaignRowsInOneUpdate = (builder:any, rows:any[], patch:any = {}) => {
    updateAiWorkspace("ecommerce",{
      campaignBuilder:{
        ...builder,
        ...patch,
        productRows:rows.map((row:any)=>({
          id: row.id || uid(),
          productKey: row.productKey || "",
          product: row.product || "",
          sku: row.sku || "",
          brand: row.brand || "",
          collection: row.collection || "",
          platform: row.platform || builder.platform || "All Platforms",
          discount: row.discount || "",
          mechanics: row.mechanics || "",
          headline: row.headline || "",
          subheadline: row.subheadline || "",
          cta: row.cta || "",
          output: row.output || "",
        })),
      },
    });
  };

  const addEcommerceCampaignProductRow = () => {
    const builder = getEcommerceCampaignBuilder();
    const selectedKey = String(builder.selectedProductKey || "").trim();
    if(!selectedKey) return;

    const selected = getCampaignProductByOptionKey(selectedKey);
    if(!selected) {
      setAiError((p:any)=>({...p,ecommerceCampaign:"Selected mapped product was not found. Please select again."}));
      return;
    }

    const rows = getEcommerceCampaignRows();
    const nextRows = [...rows,buildEcommerceCampaignProductRow(selected,selectedKey,builder)];
    saveCampaignRowsInOneUpdate(builder,nextRows,{ selectedProductKey:"" });
  };

  const toggleSelectedCampaignProductKey = (key:string) => {
    setSelectedCampaignProductKeys((prev:string[])=>prev.includes(key) ? prev.filter((item:string)=>item!==key) : [...prev,key]);
  };

  const addSelectedEcommerceCampaignProductRows = () => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const existing = new Set(rows.map((row:any)=>String(row.productKey || "")));
    const rowsToAdd = selectedCampaignProductKeys
      .filter((key:string)=>!existing.has(key))
      .map((key:string)=>{
        const selected = getCampaignProductByOptionKey(key);
        return selected ? buildEcommerceCampaignProductRow(selected,key,builder) : null;
      })
      .filter(Boolean);
    if(!rowsToAdd.length) return;
    saveCampaignRowsInOneUpdate(builder,[...rows,...rowsToAdd]);
    setSelectedCampaignProductKeys([]);
  };

  const addSelectedAsOneEcommerceCampaignProductRow = () => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const keys = selectedCampaignProductKeys.filter(Boolean);
    const items = getCampaignItemsByKeys(keys);
    if(!items.length) return;
    const groupedRow = buildEcommerceCampaignProductRowFromItems(items,keys,builder);
    saveCampaignRowsInOneUpdate(builder,[...rows,groupedRow]);
    setSelectedCampaignProductKeys([]);
  };

  const addAllAsOneEcommerceCampaignProductRow = () => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const keys = productRows.map((item:any,idx:number)=>getCampaignProductOptionKey(item,idx));
    const items = getCampaignItemsByKeys(keys);
    if(!items.length) return;
    const groupedRow = buildEcommerceCampaignProductRowFromItems(items,keys,builder);
    saveCampaignRowsInOneUpdate(builder,[...rows,groupedRow]);
    setSelectedCampaignProductKeys([]);
  };

  const addAllEcommerceCampaignProductRows = () => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const existing = new Set(rows.map((row:any)=>String(row.productKey || "")));
    const rowsToAdd = productRows
      .map((item:any,idx:number)=>({ item, key:getCampaignProductOptionKey(item,idx) }))
      .filter(({key}:any)=>!existing.has(key))
      .map(({item,key}:any)=>buildEcommerceCampaignProductRow(item,key,builder));
    if(!rowsToAdd.length) return;
    saveCampaignRowsInOneUpdate(builder,[...rows,...rowsToAdd]);
    setSelectedCampaignProductKeys([]);
  };

  const updateEcommerceCampaignRow = (rowId:string, patch:any, rowIndex?:number) => {
    const rows = getEcommerceCampaignRows().map((row:any,idx:number)=>(
      (typeof rowIndex==="number" ? idx===rowIndex : row.id===rowId) ? { ...row, ...patch } : row
    ));
    saveEcommerceCampaignRows(rows);
  };

  const deleteEcommerceCampaignRow = (rowId:string, rowIndex?:number) => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const nextRows = rows.filter((row:any,idx:number)=>(
      typeof rowIndex==="number" ? idx!==rowIndex : row.id!==rowId
    ));
    updateEcommerceCampaignBuilder({
      productRows:nextRows.map((row:any)=>({
        id: row.id || uid(),
        productKey: row.productKey || "",
        productKeys: Array.isArray(row.productKeys) ? row.productKeys : getCampaignRowProductKeys(row),
        product: row.product || "",
        sku: row.sku || "",
        brand: row.brand || "",
        collection: row.collection || "",
        platform: row.platform || builder.platform || "All Platforms",
        discount: row.discount || "",
        mechanics: row.mechanics || "",
        headline: row.headline || "",
        subheadline: row.subheadline || "",
        cta: row.cta || "",
        output: row.output || "",
      })),
      generatedText:nextRows.map((row:any)=>formatCampaignRowOutput(row)).filter(Boolean).join("\n\n---\n\n"),
      generatedAt:new Date().toISOString(),
    });
  };

  const clearEcommerceCampaignRows = () => saveEcommerceCampaignRows([]);

  const getEcommerceCampaignProductSummary = (rows:any[]) => rows.map((row:any,idx:number)=>{
    const products = getEcommerceCampaignRowProducts(row);
    const productList = products.length ? products.map((item:any)=>`${item.product || "Product"} (${item.sku || "No SKU"})`).join("; ") : `${row.product || ""} (${row.sku || "No SKU"})`;
    return `${idx+1}. Platform: ${row.platform || "All Platforms"} | Products: ${productList} | Brand: ${row.brand || "Unbranded"} | Collection/Category: ${row.collection || "No collection/category"} | Discount/Offer: ${getCampaignRowDiscountValue(row) || "Not specified"} | Mechanics/Notes: ${row.mechanics || "Not specified"}`;
  }).join("\n");

  const parseCampaignCopySections = (value:any) => {
    const text = cleanReadyToUseOutput(value || "");
    const grab = (label:string, nextLabels:string[]) => {
      const next = nextLabels.map((item:string)=>item.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
      const regex = new RegExp(`${label}\\s*\\n([\\s\\S]*?)(?=\\n(?:${next})\\s*\\n|$)`,"i");
      const match = text.match(regex);
      return String(match?.[1] || "").trim();
    };
    const headline = grab("Headline",["Subheadline","CTA"]);
    const subheadline = grab("Subheadline",["CTA"]);
    const cta = grab("CTA",[]);
    return {
      headline: headline || "",
      subheadline: subheadline || "",
      cta: cta || "",
      output: text,
    };
  };

  const formatCampaignRowOutput = (row:any) => [
    "Product",
    row.product || "",
    row.sku ? `SKU: ${row.sku}` : "",
    row.brand ? `Brand: ${row.brand}` : "",
    row.collection ? `Collection: ${row.collection}` : "",
    "",
    "Product Count",
    String(getCampaignRowProductKeys(row).length || 1),
    "",
    "Platform",
    row.platform || "",
    "",
    "Headline",
    row.headline || "",
    "",
    "Subheadline",
    row.subheadline || "",
    "",
    "CTA",
    row.cta || "",
  ].join("\n").trim();

  const requestEcommerceCampaignRowCopy = async (row:any, builder:any, theme:string) => {
    const customInstructions = String(builder.aiInstructions || "").trim();
    const headlineInstructions = String(builder.headlineInstructions || "").trim();
    const subheadlineInstructions = String(builder.subheadlineInstructions || "").trim();
    const ctaInstructions = String(builder.ctaInstructions || "").trim();
    const linkedEventContext = getCampaignContextFromLinkedEvents();
    const instruction = [
      "You are EMDC's e-commerce campaign copy assistant.",
      "Generate campaign copy for one product row only.",
      "Output must be ready to copy and paste.",
      "Do not use markdown heading symbols like ###.",
      "Do not number the section headers.",
      "Use this exact clean structure only:",
      "Headline",
      "Subheadline",
      "CTA",
      "",
      "Headline should be short, catchy, marketplace-friendly, and connected to the theme.",
      headlineInstructions ? `Headline-specific instruction:\\n${headlineInstructions}` : "",
      "Subheadline should mention the product, discount/offer, or mechanics if provided.",
      subheadlineInstructions ? `Subheadline-specific instruction:\\n${subheadlineInstructions}` : "",
      "CTA should be short and action-oriented.",
      ctaInstructions ? `CTA-specific instruction:\\n${ctaInstructions}` : "",
      "Avoid em dashes.",
      "Do not invent product specs.",
      customInstructions ? `General additional instructions:\\n${customInstructions}` : "",
    ].filter(Boolean).join("\\n");

    const res = await fetch("/api/ai/generate-text", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        task:"ecommerce_campaign_copy_single_row",
        taskLabel:"Campaign E-commerce Copy Per Product Row",
        tone:"commercial",
        instruction,
        input:JSON.stringify({
          platform:row.platform || builder.platform,
          linkedEventContext,
          linkedEvents:getCampaignLinkedEventItems(),
          theme:linkedEventContext || theme,
          checklistGroup:group.groupName,
          operationalType:lt.label,
          products:getEcommerceCampaignRowProducts(row),
          product:row.product,
          sku:row.sku,
          brand:row.brand,
          collection:row.collection,
          discountOrOffer:getCampaignRowDiscountValue(row) || "",
          mechanicsOrNotes:row.mechanics || "",
        },null,2),
        maxOutputTokens:700,
      }),
    });

    const raw = await res.text();
    let payload:any = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error(raw || "Campaign copy generation failed."); }
    if(!res.ok) throw new Error(payload?.error || payload?.message || "Campaign copy generation failed.");

    const parsed = parseCampaignCopySections(payload?.text || "");
    return {
      ...row,
      headline:parsed.headline,
      subheadline:parsed.subheadline,
      cta:parsed.cta,
      output:parsed.output,
    };
  };

  const generateEcommerceCampaignRow = async (rowId:string) => {
    const builder = getEcommerceCampaignBuilder();
    const rows = getEcommerceCampaignRows();
    const row = rows.find((item:any)=>item.id===rowId);
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || group.groupName || "Campaign").trim();

    if(!row){
      setAiError((p:any)=>({...p,ecommerceCampaign:"Please add a product row first."}));
      return;
    }

    setAiBusy((p:any)=>({...p,ecommerceCampaignRow:rowId}));
    setAiError((p:any)=>({...p,ecommerceCampaign:""}));

    try {
      const generated = await requestEcommerceCampaignRowCopy(row,builder,theme);
      const nextRows = rows.map((item:any)=>item.id===rowId ? generated : item);
      updateEcommerceCampaignBuilder({
        productRows:nextRows,
        generatedText:nextRows.map((item:any)=>formatCampaignRowOutput(item)).filter(Boolean).join("\n\n---\n\n"),
        generatedAt:new Date().toISOString(),
      });
    } catch (err:any) {
      setAiError((p:any)=>({...p,ecommerceCampaign:err?.message || "Campaign copy generation failed."}));
    } finally {
      setAiBusy((p:any)=>({...p,ecommerceCampaignRow:""}));
    }
  };

  const generateEcommerceCampaignAssets = async () => {
    const builder = getEcommerceCampaignBuilder();
    const campaignRows = getEcommerceCampaignRows();
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || group.groupName || "Campaign").trim();

    if(!campaignRows.length){
      setAiError((p:any)=>({...p,ecommerceCampaign:"Please add at least one mapped product row."}));
      return;
    }

    setAiBusy((p:any)=>({...p,ecommerceCampaign:true,ecommerceCampaignRow:""}));
    setAiError((p:any)=>({...p,ecommerceCampaign:""}));

    const generatedRows:any[] = [];

    try {
      for (const row of campaignRows) {
        setAiBusy((p:any)=>({...p,ecommerceCampaign:true,ecommerceCampaignRow:row.id}));
        const generated = await requestEcommerceCampaignRowCopy(row,builder,theme);
        generatedRows.push(generated);
      }

      const combinedOutput = generatedRows.map((row:any)=>formatCampaignRowOutput(row)).join("\n\n---\n\n");
      updateEcommerceCampaignBuilder({
        productRows:generatedRows,
        generatedText:combinedOutput,
        generatedAt:new Date().toISOString(),
      });
    } catch (err:any) {
      setAiError((p:any)=>({...p,ecommerceCampaign:err?.message || "Campaign copy generation failed."}));
    } finally {
      setAiBusy((p:any)=>({...p,ecommerceCampaign:false,ecommerceCampaignRow:""}));
    }
  };

  const copyEcommerceCampaignRowOutput = async (row:any) => {
    const output = formatCampaignRowOutput(row);
    if(!output) return;
    try { await navigator.clipboard.writeText(output); } catch {}
  };

  const addEcommerceCampaignRowToOverview = (row:any) => {
    const builder = getEcommerceCampaignBuilder();
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || "Campaign").trim();
    const rowKey = String(row.id || row.productKey || row.product || uid());
    addToOverview("E-commerce","Campaign Copy",formatCampaignRowOutput(row),`${row.product || "Product"} · ${row.platform || builder.platform} · ${theme}`, { tab:"ecommerce", type:"campaignRow", id:row?.id || row?.productKey || row?.product || "" });
    setCampaignOverviewAddedIds((prev:string[])=>Array.from(new Set([...prev,rowKey])));
    window.setTimeout(()=>setCampaignOverviewAddedIds((prev:string[])=>prev.filter((id:string)=>id!==rowKey)),1800);
  };

  const getCampaignMarketingRowsWithBackup = () => {
    const marketing = ((group.aiWorkspace || {}).marketing || {}) as any;
    const persistedMarketing = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).marketing || {}) as any;
    const stateRows = Array.isArray(marketing.campaignMarketingRows) ? marketing.campaignMarketingRows : [];
    const persistedRows = Array.isArray(persistedMarketing.campaignMarketingRows) ? persistedMarketing.campaignMarketingRows : [];
    const backupRows = readEcommerceTransferRowsBackup("marketing","campaign");
    return mergeEcommerceTransferRows(persistedRows,stateRows,backupRows);
  };

  const getCampaignLivestreamRowsWithBackup = () => {
    const livestream = ((group.aiWorkspace || {}).livestream || {}) as any;
    const persistedLivestream = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).livestream || {}) as any;
    const stateRows = Array.isArray(livestream.campaignLivestreamRows) ? livestream.campaignLivestreamRows : [];
    const persistedRows = Array.isArray(persistedLivestream.campaignLivestreamRows) ? persistedLivestream.campaignLivestreamRows : [];
    const backupRows = readEcommerceTransferRowsBackup("livestream","campaign");
    return mergeEcommerceTransferRows(persistedRows,stateRows,backupRows);
  };

  const sendEcommerceCampaignRowToMarketing = (row:any) => {
    const builder = getEcommerceCampaignBuilder();
    const rowKey = String(row.id || row.productKey || row.product || uid());
    const products = getEcommerceCampaignRowProducts(row).map((product:any)=>({
      product:product.product || row.product || "",
      productName:product.product || row.product || "",
      sku:product.sku || row.sku || "",
      skuCode:product.sku || row.sku || "",
      brand:product.brand || row.brand || "",
      collection:product.collection || row.collection || row.category || "",
      category:product.collection || row.collection || row.category || "",
      platform:row.platform || builder.platform || "All Platforms",
      headline:row.headline || "",
      subheadline:row.subheadline || "",
      cta:row.cta || "",
      discount:getCampaignRowDiscountValue(row) || "",
      mechanics:row.mechanics || "",
    }));
    const fallbackProduct = {
      product:row.product || "",
      productName:row.product || "",
      sku:row.sku || "",
      skuCode:row.sku || "",
      brand:row.brand || "",
      collection:row.collection || row.category || "",
      category:row.collection || row.category || "",
      platform:row.platform || builder.platform || "All Platforms",
      headline:row.headline || "",
      subheadline:row.subheadline || "",
      cta:row.cta || "",
      discount:getCampaignRowDiscountValue(row) || "",
      mechanics:row.mechanics || "",
    };
    const marketingProducts = (products.length ? products : [fallbackProduct]).map((item:any)=>enrichEcommerceTransferProductRow(item));
    const existingRows = getCampaignMarketingRowsWithBackup();
    const nextRows = [
      { id:rowKey, sourceRowId:rowKey, product:row.product || "Campaign Product Row", platform:row.platform || builder.platform || "All Platforms", products:marketingProducts, createdAt:new Date().toISOString() },
      ...existingRows.filter((existing:any)=>String(existing.sourceRowId || existing.id || "")!==rowKey),
    ].slice(0,30);
    writeEcommerceTransferRowsBackup("marketing","campaign",nextRows);
    updateAiWorkspace("marketing",{
      campaignMarketingRows:nextRows,
      placedMarketingProductKeys:marketingProducts.map((item:any,idx:number)=>`${item.sku || item.product || "marketing-product"}__${idx}`),
      selectedMarketingProductKeys:marketingProducts.map((item:any,idx:number)=>`${item.sku || item.product || "marketing-product"}__${idx}`),
    });
    setCampaignMarketingSentIds((prev:string[])=>Array.from(new Set([...prev,rowKey])));
    window.setTimeout(()=>setCampaignMarketingSentIds((prev:string[])=>prev.filter((id:string)=>id!==rowKey)),1800);
  };

  const sendEcommerceCampaignRowToLivestream = (row:any) => {
    const builder = getEcommerceCampaignBuilder();
    const rowKey = String(row.id || row.productKey || row.product || uid());
    const products = getEcommerceCampaignRowProducts(row).map((product:any)=>({
      product:product.product || row.product || "",
      productName:product.product || row.product || "",
      sku:product.sku || row.sku || "",
      skuCode:product.sku || row.sku || "",
      brand:product.brand || row.brand || "",
      collection:product.collection || row.collection || row.category || "",
      category:product.collection || row.collection || row.category || "",
      platform:row.platform || builder.platform || "All Platforms",
      headline:row.headline || "",
      subheadline:row.subheadline || "",
      cta:row.cta || "",
      discount:getCampaignRowDiscountValue(row) || "",
      mechanics:row.mechanics || "",
    }));
    const fallbackProduct = {
      product:row.product || "",
      productName:row.product || "",
      sku:row.sku || "",
      skuCode:row.sku || "",
      brand:row.brand || "",
      collection:row.collection || row.category || "",
      category:row.collection || row.category || "",
      platform:row.platform || builder.platform || "All Platforms",
      headline:row.headline || "",
      subheadline:row.subheadline || "",
      cta:row.cta || "",
      discount:getCampaignRowDiscountValue(row) || "",
      mechanics:row.mechanics || "",
    };
    const livestreamProducts = (products.length ? products : [fallbackProduct]).map((item:any)=>enrichEcommerceTransferProductRow(item));
    const existingRows = getCampaignLivestreamRowsWithBackup();
    const nextRows = [
      { id:rowKey, sourceRowId:rowKey, product:row.product || "Campaign Product Row", platform:row.platform || builder.platform || "All Platforms", products:livestreamProducts, createdAt:new Date().toISOString() },
      ...existingRows.filter((existing:any)=>String(existing.sourceRowId || existing.id || "")!==rowKey),
    ].slice(0,30);
    writeEcommerceTransferRowsBackup("livestream","campaign",nextRows);
    updateAiWorkspace("livestream",{
      campaignLivestreamRows:nextRows,
      placedProductKeys:livestreamProducts.map((item:any,idx:number)=>`${item.sku || item.product || "livestream-product"}__${idx}`),
      selectedProductKeys:livestreamProducts.map((item:any,idx:number)=>`${item.sku || item.product || "livestream-product"}__${idx}`),
    });
  };

  const buildCampaignDigitalCreativeItem = (row:any) => {
    const builder = getEcommerceCampaignBuilder();
    const productList = getEcommerceCampaignRowProducts(row);
    const linkedContext = getCampaignContextFromLinkedEvents() || String(builder.theme || group.groupName || "Campaign").trim();
    return {
      id:uid(),
      sourceRowId:String(row.id || row.productKey || row.product || ""),
      title:row.product || "Campaign Product Row",
      product:row.product || "",
      sku:row.sku || "",
      brand:row.brand || "",
      collection:row.collection || "",
      platform:row.platform || builder.platform || "All Platforms",
      discount:getCampaignRowDiscountValue(row) || "",
      mechanics:row.mechanics || "",
      linkedEventContext:linkedContext,
      products:productList,
      headline:row.headline || "",
      subheadline:row.subheadline || "",
      cta:row.cta || "",
      createdAt:new Date().toISOString(),
    };
  };

  const formatCampaignDigitalCreativeItem = (item:any) => [
    "Platform",
    item.platform || "",
    "",
    "Brand",
    item.brand || "",
    "",
    "Category",
    item.collection || "",
    "",
    "Product",
    item.product || "",
    "",
    "Headline",
    item.headline || "",
    "",
    "Subheadline",
    item.subheadline || "",
    "",
    "CTA",
    item.cta || "",
    "",
    Array.isArray(item.products) && item.products.length ? "Products Inside This Row" : "",
    ...(Array.isArray(item.products) ? item.products.map((product:any,idx:number)=>`${idx+1}. ${product.product || "Product"}${product.sku ? ` · ${product.sku}` : ""}${product.brand ? ` · ${product.brand}` : ""}${product.collection ? ` · ${product.collection}` : ""}`) : []),
  ].filter((line:any)=>String(line || "").trim()).join("\n");

  const sendEcommerceCampaignRowToDigitalCreative = (row:any) => {
    const item = buildCampaignDigitalCreativeItem(row);
    const digital = ((group.aiWorkspace || {}).digital || {}) as any;
    const current = Array.isArray(digital.campaignCreativeRows) ? digital.campaignCreativeRows : [];
    const nextRows = [item,...current.filter((existing:any)=>existing.sourceRowId!==item.sourceRowId)].slice(0,30);
    updateAiWorkspace("digital",{
      campaignCreativeRows:nextRows,
      generatedText:nextRows.map((entry:any)=>formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"),
      generatedAt:new Date().toISOString(),
    });
    setCampaignDigitalSentIds((prev:string[])=>Array.from(new Set([...prev,item.sourceRowId])));
    window.setTimeout(()=>setCampaignDigitalSentIds((prev:string[])=>prev.filter((id:string)=>id!==item.sourceRowId)),1800);
  };

  const addEcommerceCampaignToOverview = () => {
    const builder = getEcommerceCampaignBuilder();
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || "Campaign").trim();
    addToOverview("E-commerce","Campaign Copy",getEcommerceCampaignCombinedOutput() || builder.generatedText || "",`${builder.platform} · ${theme}`, { tab:"ecommerce", type:"campaignCombined" });
  };

  const getEcommerceCampaignCombinedOutput = () => {
    const rows = getEcommerceCampaignRows();
    const rowOutput = rows
      .filter((row:any)=>row.headline || row.subheadline || row.cta)
      .map((row:any)=>formatCampaignRowOutput(row))
      .filter(Boolean)
      .join("\n\n---\n\n");
    const builder = getEcommerceCampaignBuilder();
    return rowOutput || String(builder.generatedText || "");
  };

  const saveEcommerceCampaignRowOutput = (row:any) => {
    const builder = getEcommerceCampaignBuilder();
    const output = formatCampaignRowOutput(row).trim();
    if(!output || !(row.headline || row.subheadline || row.cta)) return;
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || "Campaign").trim();
    const saved = Array.isArray(builder.savedOutputs) ? builder.savedOutputs : [];
    updateEcommerceCampaignBuilder({
      savedOutputs:[{
        id:uid(),
        title:`Campaign Copy ${new Date().toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,
        text:output,
        platform:row.platform || builder.platform,
        theme,
        createdAt:new Date().toISOString(),
      },...saved].slice(0,20),
    });
  };

  const saveEcommerceCampaignOutput = () => {
    const builder = getEcommerceCampaignBuilder();
    const output = getEcommerceCampaignCombinedOutput().trim();
    if(!output) return;
    const theme = getCampaignContextFromLinkedEvents() || String(builder.theme || "Campaign").trim();
    const saved = Array.isArray(builder.savedOutputs) ? builder.savedOutputs : [];
    updateEcommerceCampaignBuilder({
      savedOutputs:[{
        id:uid(),
        title:`Campaign Copy ${new Date().toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,
        text:output,
        platform:builder.platform,
        theme,
        createdAt:new Date().toISOString(),
      },...saved].slice(0,20),
    });
  };

  const deleteEcommerceCampaignSavedOutput = (id:string) => {
    const builder = getEcommerceCampaignBuilder();
    const saved = Array.isArray(builder.savedOutputs) ? builder.savedOutputs : [];
    updateEcommerceCampaignBuilder({ savedOutputs:saved.filter((item:any)=>item.id!==id) });
  };

  const renderAiWorkspace = (tab:string) => {
    const cfg = workspaceConfig[tab];
    const backupWorkspace = ((readEmdcGroupWorkspaceBackups()[String(group?.id || "")] || {}).aiWorkspace || {}) as any;
    const persistedWorkspace = (((getPersistedChecklistGroup() || {}).aiWorkspace || {}) as any);
    const backupTabData = (backupWorkspace && typeof backupWorkspace[tab] === "object" && backupWorkspace[tab]) ? backupWorkspace[tab] : {};
    const persistedTabData = (persistedWorkspace && typeof persistedWorkspace[tab] === "object" && persistedWorkspace[tab]) ? persistedWorkspace[tab] : {};
    const groupTabData = (((group.aiWorkspace || {}) as any)[tab] && typeof ((group.aiWorkspace || {}) as any)[tab] === "object") ? ((group.aiWorkspace || {}) as any)[tab] : {};
    const rawData = { ...backupTabData, ...persistedTabData, ...groupTabData };
    const data = tab === "ecommerce" ? getMergedEcommerceData(rawData) : rawData;
    if(!cfg) return null;

    if(tab==="overview"){
      const overviewItems = getOverviewItems();
      const isCampaignOverview = String(lt?.label || group?.launchType || group?.type || "").toLowerCase().includes("campaign");
      const parseCampaignOverviewCopy = (content:any) => {
        const lines = String(content || "").split(/\r?\n/).map((line:string)=>line.trim());
        const getAfter = (label:string) => {
          const idx = lines.findIndex((line:string)=>line.toLowerCase()===label.toLowerCase());
          return idx>=0 ? (lines[idx+1] || "") : "";
        };
        const getPrefixed = (prefix:string) => {
          const line = lines.find((item:string)=>item.toLowerCase().startsWith(prefix.toLowerCase()));
          return line ? line.slice(prefix.length).trim() : "";
        };
        const product = getAfter("Product") || getAfter("Product Details");
        const productCount = getAfter("Product Count");
        const platform = getAfter("Platform");
        const brand = getAfter("Brand") || getPrefixed("Brand:");
        const category = getAfter("Category") || getAfter("Collection") || getPrefixed("Collection:");
        const headline = getAfter("Headline") || getPrefixed("Headline:");
        const subheadline = getAfter("Subheadline") || getPrefixed("Subheadline:");
        const cta = getAfter("CTA") || getPrefixed("CTA:");
        const hasCampaignFormat = !!(platform || brand || category || product || headline || subheadline || cta);
        return { platform, brand, category, product, productCount, headline, subheadline, cta, hasCampaignFormat };
      };
      const campaignOverviewRows = overviewItems
        .map((item:any)=>({ item, row:parseCampaignOverviewCopy(item.content) }))
        .filter(({row}:any)=>row.hasCampaignFormat);
      const campaignOverviewGroupBy = data.campaignOverviewGroupBy || "none";
      const campaignOverviewGroupedRows = (() => {
        if(campaignOverviewGroupBy==="brand"){
          const groups:any = {};
          campaignOverviewRows.forEach((entry:any)=>{
            const key = entry.row.brand || "No Brand";
            if(!groups[key]) groups[key] = [];
            groups[key].push(entry);
          });
          return Object.entries(groups).map(([label,rows]:any)=>({ label, rows }));
        }
        if(campaignOverviewGroupBy==="platform"){
          const groups:any = {};
          campaignOverviewRows.forEach((entry:any)=>{
            const key = entry.row.platform || "No Platform";
            if(!groups[key]) groups[key] = [];
            groups[key].push(entry);
          });
          return Object.entries(groups).map(([label,rows]:any)=>({ label, rows }));
        }
        return [{ label:"", rows:campaignOverviewRows }];
      })();

      if(isCampaignOverview){
        return (
          <div style={{ display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
            <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap" }}>
                <div>
                  <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Overview</h3>
                  <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:760 }}>Master table of campaign outputs added from E-commerce and Digital Creative.</p>
                </div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",justifyContent:isMobile?"stretch":"flex-end",width:isMobile?"100%":"auto" }}>
                  <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{campaignOverviewRows.length} row{campaignOverviewRows.length!==1?"s":""}</span>
                  <Select value={campaignOverviewGroupBy} onChange={(value)=>updateAiWorkspace("overview",{ campaignOverviewGroupBy:value })} style={{ width:isMobile?"100%":180,height:32,fontSize:12,padding:"5px 32px 5px 9px" }}>
                    <option value="none">No Grouping</option>
                    <option value="brand">Group by Brand</option>
                    <option value="platform">Group by Platform</option>
                  </Select>
                  <Btn sm variant="outline" onClick={copyAllOverviewItems} disabled={!campaignOverviewRows.length}>Copy All</Btn>
                </div>
              </div>
            </div>

            {campaignOverviewRows.length===0 ? (
              <div style={{ minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:18 }}>
                <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>No rows yet. Click Add to Overview from Campaign E-commerce or Campaign Digital Creative.</p>
              </div>
            ) : (
              <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",maxHeight:isMobile?430:620 }}>
                  <table style={{ width:"100%",minWidth:1180,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                    <thead>
                      <tr style={{ background:C.surfaceAlt }}>
                        {["Platform","Brand","Category","Product","Headline","Subheadline","CTA"].map((label:string)=>(
                          <th key={label} style={{ position:"sticky",top:0,zIndex:2,background:C.surfaceAlt,padding:"10px 12px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaignOverviewGroupedRows.map((group:any,groupIndex:number)=>(
                        <React.Fragment key={`${group.label || "all"}-${groupIndex}`}>
                          {campaignOverviewGroupBy!=="none"&&(
                            <tr>
                              <td colSpan={7} style={{ position:"sticky",left:0,zIndex:1,padding:"8px 12px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>
                                {group.label} <span style={{ color:C.faint,fontWeight:800,textTransform:"none",letterSpacing:0 }}>({group.rows.length} row{group.rows.length!==1?"s":""})</span>
                              </td>
                            </tr>
                          )}
                          {group.rows.map(({item,row}:any,idx:number)=>(
                            <tr key={item.id} style={{ background:idx%2?C.surface:C.bg }}>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap",fontWeight:750 }}>{row.platform || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.brand || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.category || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:220 }}>{row.product || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:190 }}>{row.headline || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:300 }}>{row.subheadline || ""}</td>
                              <td style={{ padding:12,borderBottom:`1px solid ${C.border}`,verticalAlign:"top",minWidth:150,fontWeight:850,color:C.text }}>{row.cta || ""}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }

      return (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
              <div>
                <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Overview</h3>
                <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:760 }}>Collected outputs added from E-commerce, Marketing, and Digital Creative.</p>
              </div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{overviewItems.length} item{overviewItems.length!==1?"s":""}</span>
                <Btn sm variant="outline" onClick={copyAllOverviewItems} disabled={!overviewItems.length}>Copy All</Btn>
              </div>
            </div>
          </div>

          {overviewItems.length===0 ? (
            <div style={{ minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:18 }}>
              <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>No overview items yet. Go to E-commerce, Marketing, or Digital Creative and click Add to Overview on any output.</p>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:14,alignItems:"start" }}>
              {(() => {
                const sourceRank:any = { "E-commerce":0, "Marketing":1, "Digital Creative":2, "Livestream":3 };
                const normalizeSource = (value:any) => {
                  const v = String(value || "").toLowerCase();
                  if(v.includes("e-commerce") || v.includes("ecommerce")) return "E-commerce";
                  if(v.includes("marketing")) return "Marketing";
                  if(v.includes("digital")) return "Digital Creative";
                  if(v.includes("livestream") || v.includes("live")) return "Livestream";
                  return "Other";
                };
                const sorted = [...overviewItems].sort((a:any,b:any)=>{
                  const ar = sourceRank[normalizeSource(a.sourceTab)] ?? 9;
                  const br = sourceRank[normalizeSource(b.sourceTab)] ?? 9;
                  if(ar!==br) return ar-br;
                  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
                });
                return sorted.map((item:any)=>(
                  <article key={item.id} style={{ padding:16,border:`1.5px solid ${C.border}`,borderRadius:14,background:C.surface,minWidth:0,boxShadow:"0 2px 8px rgba(15,23,42,.04)" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap",marginBottom:10 }}>
                      <div style={{ minWidth:0,flex:1 }}>
                        <span style={{ display:"inline-flex",fontSize:10.5,fontWeight:900,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"3px 8px",marginBottom:7 }}>{normalizeSource(item.sourceTab)}</span>
                        <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>{item.title || "Overview Item"}</p>
                        <p style={{ margin:"3px 0 0",fontSize:10.5,color:C.faint }}>{item.kind || "Output"} · {item.createdAt ? new Date(item.createdAt).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "Added"}</p>
                      </div>
                      <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                        <button onClick={()=>openOverviewEdit(item)} style={{ border:"none",background:C.surfaceAlt,color:C.textSub,borderRadius:7,padding:"6px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>Edit</button>
                        <button onClick={()=>copyOverviewItem(item)} style={{ border:"none",background:C.surfaceAlt,color:C.textSub,borderRadius:7,padding:"6px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>Copy</button>
                        <button onClick={()=>deleteOverviewItem(item.id)} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"6px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>Delete</button>
                      </div>
                    </div>
                    {renderOverviewContent(item)}
                  </article>
                ));
              })()}
            </div>
          )}

          <Modal open={!!overviewEdit} onClose={()=>setOverviewEdit(null)} title="Edit Overview Output" width={760}>
            {overviewEdit&&(
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <Field label="Overview Card Title">
                  <TI value={overviewEdit.title || ""} onChange={(value:any)=>setOverviewEdit((prev:any)=>({ ...prev, title:value }))} placeholder="Overview title" />
                </Field>
                <Field label="Output Content" hint="Saving also updates the source card when a source reference is available.">
                  <textarea
                    value={overviewEdit.content || ""}
                    onChange={(e:any)=>setOverviewEdit((prev:any)=>({ ...prev, content:e.target.value }))}
                    rows={isMobile?14:20}
                    style={{ width:"100%",boxSizing:"border-box",resize:"vertical",border:`1.5px solid ${C.border}`,borderRadius:10,background:C.bg,color:C.text,fontSize:12.5,lineHeight:1.55,padding:"11px 12px",outline:"none" }}
                  />
                </Field>
                <div style={{ display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap" }}>
                  <Btn variant="outline" onClick={()=>setOverviewEdit(null)}>Cancel</Btn>
                  <Btn onClick={saveOverviewEdit}>{actionDone(`overview-edit-${overviewEdit.id}`)?"✓ Saved":"Save Changes"}</Btn>
                </div>
              </div>
            )}
          </Modal>
        </div>
      );
    }

    const workspaceTypeLabel = String(lt?.label || group?.launchType || group?.type || "").toLowerCase();
    const isCampaignChecklist = workspaceTypeLabel.includes("campaign");
    const isProductIntroductionChecklist = workspaceTypeLabel.includes("product introduction") || workspaceTypeLabel.includes("product reactivation") || workspaceTypeLabel.includes("reactivation") || workspaceTypeLabel.includes("relaunch");

    if(tab==="marketing" && (isCampaignChecklist || isProductIntroductionChecklist)){
      const productIntroMarketingRows = isProductIntroductionChecklist
        ? getProductIntroMarketingRows()
        : [];
      const productIntroMarketingProducts = productIntroMarketingRows.flatMap((row:any)=>Array.isArray(row.products) && row.products.length ? row.products.map((p:any)=>({
          product:p.product || row.product || "",
          sku:p.sku || row.sku || "",
          brand:p.brand || row.brand || "",
          collection:p.collection || row.category || row.collection || "",
          category:p.collection || row.category || row.collection || "",
          headline:row.headline || "",
          subheadline:row.subheadline || "",
          cta:row.cta || "",
          imageLink:getTransferProductImageLinks(p).concat(getTransferProductImageLinks(row))[0] || "",
          imageLinks:Array.from(new Set([...getTransferProductImageLinks(p),...getTransferProductImageLinks(row)])),
          links:Array.from(new Set([...getTransferProductImageLinks(p),...getTransferProductImageLinks(row)])),
          productLink:getTransferProductImageLinks(p).concat(getTransferProductImageLinks(row))[0] || "",
        })) : [{
          product:row.product || "",
          sku:row.sku || "",
          brand:row.brand || "",
          collection:row.category || row.collection || "",
          category:row.category || row.collection || "",
          headline:row.headline || "",
          subheadline:row.subheadline || "",
          cta:row.cta || "",
          imageLink:getTransferProductImageLinks(row)[0] || "",
          imageLinks:getTransferProductImageLinks(row),
          links:getTransferProductImageLinks(row),
          productLink:getTransferProductImageLinks(row)[0] || "",
        }]);
      const campaignMarketingRows = isCampaignChecklist ? getCampaignMarketingRowsWithBackup() : [];
      const campaignMarketingProductsFromRows = campaignMarketingRows.flatMap((row:any)=>Array.isArray(row.products) && row.products.length ? row.products.map((product:any)=>({
        product:product.product || product.productName || row.product || "",
        productName:product.productName || product.product || row.product || "",
        sku:product.sku || product.skuCode || "",
        skuCode:product.skuCode || product.sku || "",
        brand:product.brand || row.brand || "",
        collection:product.collection || product.category || row.collection || "",
        category:product.category || product.collection || row.collection || "",
        headline:product.headline || row.headline || "",
        subheadline:product.subheadline || row.subheadline || "",
        cta:product.cta || row.cta || "",
        imageLink:getTransferProductImageLinks(product).concat(getTransferProductImageLinks(row))[0] || "",
        imageLinks:Array.from(new Set([...getTransferProductImageLinks(product),...getTransferProductImageLinks(row)])),
        links:Array.from(new Set([...getTransferProductImageLinks(product),...getTransferProductImageLinks(row)])),
        productLink:getTransferProductImageLinks(product).concat(getTransferProductImageLinks(row))[0] || "",
      })) : []);
      const campaignMarketingProductsFallback = isCampaignChecklist ? productRows.map((row:any)=>({
        product:row.product || row.productName || "",
        sku:row.skuCode || row.sku || "",
        brand:row.brand || "",
        collection:row.collection || row.category || "",
        category:row.collection || row.category || "",
      })) : [];
      const campaignMarketingProducts = campaignMarketingProductsFromRows.length ? campaignMarketingProductsFromRows : campaignMarketingProductsFallback;
      const marketingTransferRows = isProductIntroductionChecklist ? productIntroMarketingRows : (isCampaignChecklist ? campaignMarketingRows : []);
      const marketingTransferCards = normalizeProductIntroTransferCards(marketingTransferRows);
      const marketingAdProducts = isProductIntroductionChecklist ? productIntroMarketingProducts : campaignMarketingProducts;
      const marketingProductKey = (item:any,idx:number) => `${item.sku || item.product || "marketing-product"}__${idx}`;
      const selectedMarketingProductKeys = Array.isArray(data.selectedMarketingProductKeys) ? data.selectedMarketingProductKeys : [];
      const placedMarketingProductKeys = Array.isArray(data.placedMarketingProductKeys) ? data.placedMarketingProductKeys : [];
      const selectedMarketingProducts = marketingAdProducts.filter((item:any,idx:number)=>selectedMarketingProductKeys.includes(marketingProductKey(item,idx)));
      const placedMarketingProducts = marketingAdProducts.filter((item:any,idx:number)=>placedMarketingProductKeys.includes(marketingProductKey(item,idx)));
      const getMarketingProductKeysForTransfer = (products:any[] = []) => {
        const usedIndexes = new Set<number>();
        return (products || []).map((transferProduct:any)=>{
          const targetSku = String(transferProduct?.sku || transferProduct?.skuCode || "").trim().toLowerCase();
          const targetProduct = String(transferProduct?.product || transferProduct?.productName || "").trim().toLowerCase();
          const matchIndex = marketingAdProducts.findIndex((item:any,idx:number)=>{
            if (usedIndexes.has(idx)) return false;
            const itemSku = String(item?.sku || item?.skuCode || "").trim().toLowerCase();
            const itemProduct = String(item?.product || item?.productName || "").trim().toLowerCase();
            return (!!targetSku && itemSku === targetSku) || (!!targetProduct && itemProduct === targetProduct);
          });
          if (matchIndex < 0) return "";
          usedIndexes.add(matchIndex);
          return marketingProductKey(marketingAdProducts[matchIndex],matchIndex);
        }).filter(Boolean);
      };
      const setMarketingTransferSelected = (transferProducts:any[], selected:boolean) => {
        const transferKeys = getMarketingProductKeysForTransfer(transferProducts);
        const current = new Set(selectedMarketingProductKeys);
        transferKeys.forEach((key:string)=>{
          if (selected) current.add(key);
          else current.delete(key);
        });
        updateAiWorkspace("marketing",{ selectedMarketingProductKeys:Array.from(current) });
      };
      const setMarketingProductSelected = (product:any, selected:boolean) => {
        const productKey = getMarketingProductKeysForTransfer([product])[0];
        if (!productKey) return;
        const current = new Set(selectedMarketingProductKeys);
        if (selected) current.add(productKey);
        else current.delete(productKey);
        updateAiWorkspace("marketing",{ selectedMarketingProductKeys:Array.from(current) });
      };

      const defaultProductIntroDigitalAssetRows = [
        { id:"main-google-drive-folder", name:"Main Google Drive Folder", link:"" },
        { id:"product-images", name:"Product Images", link:"" },
        { id:"cem-banner", name:"CEM Banner", link:"" },
        { id:"store-banner", name:"Store Banner", link:"" },
        { id:"feed", name:"Feed", link:"" },
        { id:"story", name:"Story", link:"" },
        { id:"showcase-video", name:"Showcase Video", link:"" },
        { id:"a4-signage", name:"A4 Signage", link:"" },
        { id:"sampling-poster", name:"Sampling Poster", link:"" },
      ];
      const normalizeProductIntroDigitalAssetRows = (rows:any[] = []) => {
        const sourceRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
        const normalizeAssetKey = (value:any) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
        const oldDefaultKeys = new Set(["product-image","cem-banner","store-banner","feed","story","showcase-video"]);
        const looksLikeOldDefaults = sourceRows.length > 0 && sourceRows.length <= oldDefaultKeys.size && sourceRows.every((row:any)=>{
          const keys = [row?.id,row?.name].map(normalizeAssetKey).filter(Boolean);
          return keys.some((key:string)=>oldDefaultKeys.has(key));
        });
        if (sourceRows.length && !looksLikeOldDefaults) return sourceRows;
        const sourceByKey = new Map<string,any>();
        sourceRows.forEach((row:any)=>{
          [row?.id,row?.name].map(normalizeAssetKey).filter(Boolean).forEach((key:string)=>{
            if (!sourceByKey.has(key)) sourceByKey.set(key,row);
          });
        });
        if (sourceByKey.has("product-image") && !sourceByKey.has("product-images")) sourceByKey.set("product-images",sourceByKey.get("product-image"));
        return defaultProductIntroDigitalAssetRows.map((defaultRow:any)=>{
          const match = sourceByKey.get(normalizeAssetKey(defaultRow.id)) || sourceByKey.get(normalizeAssetKey(defaultRow.name));
          return match ? { ...defaultRow, link:match.link || match.url || match.outputLink || "" } : defaultRow;
        });
      };
      const productIntroDigitalAssetRows = normalizeProductIntroDigitalAssetRows(((group.aiWorkspace || {}).digital || {}).productIntroAssetLinks);
      const updateProductIntroDigitalAssetRows = (rows:any[]) => {
        const cleanRows = Array.isArray(rows) ? rows : [];
        updateAiWorkspace("digital",{ productIntroAssetLinks:cleanRows, productIntroAssetLinksSavedAt:new Date().toISOString() });
      };
      const updateProductIntroDigitalAssetRow = (rowId:string, patch:any) => {
        updateProductIntroDigitalAssetRows(productIntroDigitalAssetRows.map((row:any)=>row.id===rowId ? { ...row, ...patch } : row));
      };
      const addProductIntroDigitalAssetRow = () => {
        updateProductIntroDigitalAssetRows([...productIntroDigitalAssetRows,{ id:uid(), name:"New Asset", link:"" }]);
      };
      const deleteProductIntroDigitalAssetRow = (rowId:string) => {
        updateProductIntroDigitalAssetRows(productIntroDigitalAssetRows.filter((row:any)=>row.id!==rowId));
      };
      const moveProductIntroDigitalAssetRow = (rowId:string, direction:number) => {
        const currentIndex = productIntroDigitalAssetRows.findIndex((row:any)=>row.id===rowId);
        const nextIndex = currentIndex + direction;
        if(currentIndex < 0 || nextIndex < 0 || nextIndex >= productIntroDigitalAssetRows.length) return;
        const nextRows = [...productIntroDigitalAssetRows];
        const [movedRow] = nextRows.splice(currentIndex,1);
        nextRows.splice(nextIndex,0,movedRow);
        updateProductIntroDigitalAssetRows(nextRows);
        markActionDone(`reorder-digital-asset-${rowId}`);
      };
      const addProductIntroDigitalAssetTableToOverview = () => {
        const lines = productIntroDigitalAssetRows.map((row:any,index:number)=>`${index+1}. ${row.name || "Untitled Asset"}${row.link ? `\n   Link: ${row.link}` : "\n   Link: "}`);
        addToOverview("Digital Creative", "Product Introduction Digital Creative Asset Links", lines.join("\n\n"), "Asset Link Table", { tab:"digital", type:"productIntroAssetLinks" });
        markActionDone("overview-product-intro-digital-assets");
      };

      return (
        <div style={{ display:"flex",flexDirection:"column",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
          <div style={{ padding:isMobile?12:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>{isProductIntroductionChecklist ? "Product Introduction Marketing" : "Campaign Marketing"}</h3>
            <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:820 }}>{isProductIntroductionChecklist ? "Step 1: select products from the E-commerce product rows, then click Add Selected to Ad Menu. Step 2: choose platform and ad format. Each ad format generate button reads only the products placed in the Ad Menu." : "Step 1: select checklist products, then click Add Selected to Ad Menu. Step 2: choose platform and ad format."}</p>
          </div>

          {!!formatMainPromotion(((group.aiWorkspace || {}).marketing || {}).mainPromotion)&&(
            renderMainPromotionCard(((group.aiWorkspace || {}).marketing || {}).mainPromotion, true)
          )}

          {((isProductIntroductionChecklist&&productIntroMarketingRows.length>0) || (isCampaignChecklist&&campaignMarketingRows.length>0))&&(
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <div style={{ padding:"10px 12px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                <div>
                  <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>{isProductIntroductionChecklist ? "1. Select Product Row Groups for Marketing" : "1. Select Campaign Product Row Groups for Marketing"}</span>
                  <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>{selectedMarketingProducts.length} selected · {placedMarketingProducts.length} placed in Ad Menu · {marketingTransferCards.length} group{marketingTransferCards.length!==1?"s":""} from E-commerce</span>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",width:isMobile?"100%":"auto" }}>
                  <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ selectedMarketingProductKeys:marketingAdProducts.map((item:any,idx:number)=>marketingProductKey(item,idx)) })} disabled={!marketingAdProducts.length}>Select All Groups</Btn>
                  <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ selectedMarketingProductKeys:[] })} disabled={!selectedMarketingProductKeys.length}>Clear Selection</Btn>
                  <Btn xs onClick={()=>updateAiWorkspace("marketing",{ placedMarketingProductKeys:selectedMarketingProductKeys })} disabled={!selectedMarketingProductKeys.length}>Add Selected to Ad Menu</Btn>
                  <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ placedMarketingProductKeys:[] })} disabled={!placedMarketingProductKeys.length}>Clear Ad Menu Products</Btn>
                </div>
              </div>
              {placedMarketingProducts.length>0&&(
                <div style={{ padding:"8px 12px",background:"#ECFDF5",border:`1px solid ${C.border}`,borderRadius:10,fontSize:11.5,color:"#047857",fontWeight:850 }}>
                  Ad Menu will generate using {placedMarketingProducts.length} placed product{placedMarketingProducts.length!==1?"s":""}: {placedMarketingProducts.map((item:any)=>item.product || item.productName || item.sku).filter(Boolean).join(", ")}
                </div>
              )}
              {marketingTransferCards.map((transfer:any,transferIndex:number)=>{
                const transferProducts = Array.isArray(transfer.products) && transfer.products.length ? transfer.products : [transfer];
                const transferProductKeys = getMarketingProductKeysForTransfer(transferProducts);
                const transferSelected = transferProductKeys.length > 0 && transferProductKeys.every((key:string)=>selectedMarketingProductKeys.includes(key));
                const transferPlaced = transferProductKeys.length > 0 && transferProductKeys.every((key:string)=>placedMarketingProductKeys.includes(key));
                return (
                  <div key={transfer.id || transferIndex} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                    <div style={{ padding:"10px 12px",background:transferPlaced?"#ECFDF5":transferSelected?"#EEF2FF":C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                      <label style={{ display:"flex",alignItems:"flex-start",gap:9,minWidth:0,flex:1,cursor:"pointer" }}>
                        <input type="checkbox" checked={transferSelected} onChange={(e:any)=>setMarketingTransferSelected(transferProducts,e.target.checked)} style={{ marginTop:3,flexShrink:0 }} />
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:0,fontSize:13,fontWeight:950,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{transferProducts.map((product:any)=>product.product || product.productName || "Product").filter(Boolean).join(" + ") || `Product List Card ${transferIndex+1}`}</p>
                          <p style={{ margin:"2px 0 0",fontSize:10.5,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{transferProducts.map((product:any)=>[product.brand,product.collection || product.category,product.sku || product.skuCode].filter(Boolean).join(" · ")).filter(Boolean).join(", ") || `${transferProducts.length} product${transferProducts.length!==1?"s":""} sent from E-commerce`}</p>
                        </div>
                      </label>
                      <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                        {transferPlaced&&<span style={{ fontSize:10.5,fontWeight:800,color:"#047857",background:"#D1FAE5",border:"1px solid #A7F3D0",borderRadius:999,padding:"3px 8px" }}>Placed</span>}
                        <span style={{ fontSize:10.5,fontWeight:800,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:999,padding:"3px 8px" }}>{transferProducts.length} product{transferProducts.length!==1?"s":""}</span>
                        <button
                          type="button"
                          onMouseDown={(e:any)=>{ e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e:any)=>{
                            e.preventDefault();
                            e.stopPropagation();
                            if (isProductIntroductionChecklist) {
                              deleteProductIntroMarketingTransferAtIndex(transferIndex);
                            } else {
                              const nextRows = getCampaignMarketingRowsWithBackup().filter((_:any,idx:number)=>idx!==transferIndex);
                              writeEcommerceTransferRowsBackup("marketing","campaign",nextRows);
                              updateAiWorkspace("marketing",{
                                campaignMarketingRows:nextRows,
                                selectedMarketingProductKeys:[],
                                placedMarketingProductKeys:[],
                                generatedAt:new Date().toISOString(),
                              });
                            }
                          }}
                          style={{ border:"1px solid #FECACA",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
                      <table style={{ width:"100%",minWidth:920,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                        <thead>
                          <tr style={{ background:C.surfaceAlt }}>
                            {["Select","Platform","Brand","Category","Product","SKU","Image Link"].map((label:string)=>(
                              <th key={label} style={{ padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {transferProducts.map((product:any,idx:number)=>{
                            const productKey = getMarketingProductKeysForTransfer([product])[0] || "";
                            const productSelected = !!productKey && selectedMarketingProductKeys.includes(productKey);
                            const productPlaced = !!productKey && placedMarketingProductKeys.includes(productKey);
                            return (
                              <tr key={`${product.sku || product.skuCode || product.product || idx}`} style={{ background:productPlaced?"#ECFDF5":productSelected?"#EEF2FF":idx%2?C.surface:C.bg }}>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>
                                  <input
                                    type="checkbox"
                                    checked={productSelected}
                                    onClick={(e:any)=>e.stopPropagation()}
                                    onChange={(e:any)=>setMarketingProductSelected(product,e.target.checked)}
                                  />
                                </td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:850 }}>All Platforms</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.brand || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.collection || product.category || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,minWidth:220 }}>{product.product || product.productName || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:850 }}>{product.sku || product.skuCode || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",maxWidth:240 }}>{renderTransferImageLinkCell(product)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isProductIntroductionChecklist&&!isCampaignChecklist&&(
          <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:"10px 12px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
              <div>
                <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>1. Select Products for Marketing</span>
                <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>{selectedMarketingProducts.length} selected · {placedMarketingProducts.length} placed in Ad Menu · {marketingAdProducts.length} available</span>
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",width:isMobile?"100%":"auto" }}>
                <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ selectedMarketingProductKeys:marketingAdProducts.map((item:any,idx:number)=>marketingProductKey(item,idx)) })} disabled={!marketingAdProducts.length}>Select All</Btn>
                <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ selectedMarketingProductKeys:[] })} disabled={!selectedMarketingProductKeys.length}>Clear Selection</Btn>
                <Btn xs onClick={()=>updateAiWorkspace("marketing",{ placedMarketingProductKeys:selectedMarketingProductKeys })} disabled={!selectedMarketingProductKeys.length}>Add Selected to Ad Menu</Btn>
                <Btn xs variant="outline" onClick={()=>updateAiWorkspace("marketing",{ placedMarketingProductKeys:[] })} disabled={!placedMarketingProductKeys.length}>Clear Ad Menu Products</Btn>
              </div>
            </div>
            {placedMarketingProducts.length>0&&(
              <div style={{ padding:"8px 12px",background:"#ECFDF5",borderBottom:`1px solid ${C.border}`,fontSize:11.5,color:"#047857",fontWeight:850 }}>
                Ad Menu will generate using {placedMarketingProducts.length} placed product{placedMarketingProducts.length!==1?"s":""}: {placedMarketingProducts.map((item:any)=>item.product || item.productName || item.sku).filter(Boolean).join(", ")}
              </div>
            )}
            {marketingAdProducts.length ? (
              <div style={{ overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",maxHeight:isMobile?280:380 }}>
                <table style={{ width:"100%",minWidth:960,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                  <thead>
                    <tr style={{ background:C.surfaceAlt }}>
                      {["Select","Ad Menu","Platform","Brand","Category","Product","SKU","Image Link"].map((label:string)=>(
                        <th key={label} style={{ position:"sticky",top:0,zIndex:1,background:C.surfaceAlt,padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketingAdProducts.map((product:any,idx:number)=>{
                      const key = marketingProductKey(product,idx);
                      const checked = selectedMarketingProductKeys.includes(key);
                      const placed = placedMarketingProductKeys.includes(key);
                      return (
                        <tr key={key} style={{ background:placed?"#ECFDF5":checked?"#EEF2FF":idx%2?C.surface:C.bg }}>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>
                            <input type="checkbox" checked={checked} onChange={()=>{
                              const next = checked ? selectedMarketingProductKeys.filter((item:string)=>item!==key) : [...selectedMarketingProductKeys,key];
                              updateAiWorkspace("marketing",{ selectedMarketingProductKeys:next });
                            }} />
                          </td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:850,color:placed?"#047857":C.faint }}>{placed ? "Placed" : "Not placed"}</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:750 }}>All Platforms</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.brand || ""}</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.collection || product.category || ""}</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,minWidth:220 }}>{product.product || product.productName || ""}</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:750 }}>{product.sku || product.skuCode || ""}</td>
                          <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",maxWidth:240 }}>{renderTransferImageLinkCell(product)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ minHeight:160,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:18 }}>
                <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>{isProductIntroductionChecklist ? "No product rows sent yet. Go to E-commerce Generated Output and click Send to Marketing." : "No products found in this checklist group yet."}</p>
              </div>
            )}
          </div>
          )}

          <AIAdTemplates skuStorage={skuStorage} brands={brands} hideProductSelector presetProducts={placedMarketingProducts} mainPromotion={((group.aiWorkspace || {}).marketing || {}).mainPromotion || ""} generatedOutputsStorageKey={`${group.id || group.groupName || "group"}_marketing_${isProductIntroductionChecklist ? "product_intro" : "campaign"}`} onAddToOverview={(ad:any)=>addToOverview("Marketing",`${ad?.platformName || "Marketing"} · ${ad?.formatName || ad?.title || "Generated Output"}`,ad?.text || ad?.imagePrompt || "","Marketing Output", { tab:"marketing", type:"adTemplate", id:ad?.id || "", storageKey:`${group.id || group.groupName || "group"}_marketing_${isProductIntroductionChecklist ? "product_intro" : "campaign"}` })} onSendToDC={(ad:any)=>{
            const adText = String(ad?.text || "").trim();
            const adProducts = Array.isArray(ad?.products) && ad.products.length ? ad.products : selectedMarketingProducts;
            const selectedProductList = adProducts.map((product:any,idx:number)=>`${idx+1}. ${product?.productName || product?.product || "Product"}${product?.sku ? ` · SKU: ${product.sku}` : ""}`).join("\n");
            const dcOutputText = [`Generated Ad Output:\n${adText}`, selectedProductList ? `Selected Products for this Ad:\n${selectedProductList}` : ""].filter(Boolean).join("\n\n");
            const dcProducts = adProducts.map((product:any)=>({
              product:product?.productName || product?.product || "",
              sku:product?.sku || product?.skuCode || "",
              brand:product?.brand || "",
              collection:product?.collection || product?.category || "",
              category:product?.category || product?.collection || "",
              links:getDcProductLinks(product),
              productLink:product?.productLink || product?.link || product?.url || "",
            }));
            const extractMarketingAdField = (text:any, labels:string[]) => {
              const lines = String(text || "").split(/\r?\n/);
              const normalizedLabels = labels.map((label:string)=>label.toLowerCase().replace(/[^a-z0-9]+/g,""));
              for(let i=0;i<lines.length;i++){
                const line = String(lines[i] || "");
                const compact = line.toLowerCase().replace(/[^a-z0-9]+/g,"");
                const match = normalizedLabels.find((label:string)=>compact.startsWith(label));
                if(!match) continue;
                const inline = line.replace(/^\s*[^:]{2,40}:\s*/i,"").trim();
                const collected:string[] = [];
                if(inline && inline !== line.trim()) collected.push(inline);
                for(let j=i+1;j<lines.length;j++){
                  const nextLine = String(lines[j] || "");
                  const nextCompact = nextLine.toLowerCase().replace(/[^a-z0-9]+/g,"");
                  const hitsKnownLabel = ["hook","primarytext","copy","creativedirection","visual","visualdirection","headline","cta","caption","products"].some((known:string)=>nextCompact.startsWith(known));
                  if(hitsKnownLabel) break;
                  if(nextLine.trim()) collected.push(nextLine.trim());
                }
                return collected.join("\n").trim();
              }
              return "";
            };
            const buildMarketingDcOutputCards = () => {
              const existingCards = Array.isArray(ad?.cards) ? ad.cards.filter(Boolean) : [];
              if(existingCards.length){
                return existingCards.map((card:any,index:number)=>({
                  ...card,
                  id:card?.id || uid(),
                  cardNumber:card?.cardNumber || index+1,
                  mediaType:card?.mediaType || recommendedCarouselMediaType(index),
                  headline:card?.headline || `Card ${index+1}`,
                  copy:card?.copy || "",
                  visual:card?.visual || card?.visualDirection || card?.imagePrompt || "",
                  cta:card?.cta || "Shop Now",
                  products:Array.isArray(card?.products) && card.products.length ? card.products : dcProducts,
                  outputLink:card?.outputLink || card?.link || "",
                }));
              }
              const hook = extractMarketingAdField(adText,["Hook","Headline"]);
              const primaryText = extractMarketingAdField(adText,["Primary Text","Copy","Caption"]);
              const creativeDirection = extractMarketingAdField(adText,["Creative Direction","Visual Direction","Visual","Image Direction"]);
              const cta = extractMarketingAdField(adText,["CTA","Call to Action"]) || "Shop Now";
              return [{
                id:uid(),
                cardNumber:1,
                mediaType:"image",
                headline:hook || ad?.formatName || ad?.title || "Marketing Ad Output",
                copy:primaryText || adText,
                visual:creativeDirection || ad?.imagePrompt || adText,
                cta,
                products:dcProducts,
                outputLink:"",
                rawOutput:adText,
              }];
            };
            const marketingDcOutputCards = buildMarketingDcOutputCards();
            const joinUnique = (values:any[]) => Array.from(new Set(values.map((value:any)=>String(value || "").trim()).filter(Boolean))).join(", ");
            const row = {
              id:uid(),
              sourceRowId:`marketing-${Date.now()}`,
              platform:ad?.platformName || "All Platforms",
              brand:joinUnique(dcProducts.map((product:any)=>product.brand)),
              category:joinUnique(dcProducts.map((product:any)=>product.collection)),
              product:dcProducts.map((product:any)=>product.product || product.sku).filter(Boolean).join(" + "),
              sku:dcProducts.map((product:any)=>product.sku).filter(Boolean).join(", "),
              headline:ad?.formatName || "Generated Ad",
              subheadline:ad?.templateName || "",
              cta:"Shop Now",
              title:ad?.isCarousel ? `${ad?.platformName || "Platform"} · ${ad?.formatName || "Carousel Ad"}` : `${ad?.platformName || "Marketing"} · ${ad?.formatName || "Generated Ad"}`,
              source:"Marketing Ad Output",
              imagePrompt:dcOutputText,
              products:dcProducts,
              carouselCards:marketingDcOutputCards,
              isCarousel:marketingDcOutputCards.length>0,
              isMarketingAdOutput:true,
              isProductGmvMax:!!ad?.isProductGmvMax,
              isProductGmvMaxTable:!!ad?.isProductGmvMaxTable,
              gmvRows:Array.isArray(ad?.gmvRows) ? ad.gmvRows.map((gmvRow:any,index:number)=>({ ...gmvRow, id:gmvRow?.id || uid(), rowNumber:index+1, products:Array.isArray(gmvRow?.products) && gmvRow.products.length ? gmvRow.products : dcProducts })) : [],
              linkedEventContext:group.groupName || "Marketing",
              createdAt:new Date().toISOString(),
            };
            // Immediate small transfer write. Digital Creative reads this bridge/inbox directly.
            // This is the most reliable path and is independent from heavy app-state/cloud sync.
            appendMarketingDcBridgeRows([row]);
            appendMarketingDcDirectInbox("product_intro", [row]);
            appendMarketingDcDirectInbox("campaign", [row]);

            const persistedDigital = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).digital || {}) as any;
            const digitalData = {
              ...persistedDigital,
              ...(((group.aiWorkspace || {}).digital || {}) as any),
            };

            // Marketing → Digital Creative must be reliable even when the checklist type
            // changes or the current tab renders before parent state finishes updating.
            // Save the transferred ad into BOTH Digital Creative row stores; the active
            // Digital Creative tab will read the correct one for the current checklist type.
            const existingProductIntroRows = mergeDigitalCreativeRows(
              Array.isArray(digitalData.productIntroCreativeRows) ? digitalData.productIntroCreativeRows : [],
              readMarketingDcTransferRowsBackup("product_intro")
            );
            const existingCampaignRows = mergeDigitalCreativeRows(
              Array.isArray(digitalData.campaignCreativeRows) ? digitalData.campaignCreativeRows : [],
              readMarketingDcTransferRowsBackup("campaign")
            );
            const productIntroRows = mergeDigitalCreativeRows(existingProductIntroRows,row);
            const campaignRows = mergeDigitalCreativeRows(existingCampaignRows,row);
            writeMarketingDcTransferRowsBackup("product_intro",productIntroRows);
            writeMarketingDcTransferRowsBackup("campaign",campaignRows);
            persistMarketingDcTransferDirectly(productIntroRows,campaignRows);
            const visibleRows = isCampaignChecklist ? campaignRows : productIntroRows;
            const now = new Date().toISOString();

            const digitalPatch = {
              productIntroCreativeRows:productIntroRows,
              productIntroRowsCleared:false,
              campaignCreativeRows:campaignRows,
              generatedText:visibleRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
              generatedAt:now,
              lastMarketingDcTransferAt:now,
            };
            updateAiWorkspace("digital",digitalPatch);
            try {
              const persistedGroup = getPersistedChecklistGroup() || group || {};
              const nextWorkspace = {
                ...((persistedGroup.aiWorkspace || group.aiWorkspace || {}) as any),
                digital:{
                  ...((((persistedGroup.aiWorkspace || group.aiWorkspace || {}) as any).digital) || {}),
                  ...digitalPatch,
                },
              };
              writeEmdcGroupWorkspaceBackup(group.id,nextWorkspace);
              persistChecklistGroupPatchNow({ aiWorkspace:nextWorkspace });
              markEmdcLocalStateUpdated();
              window.dispatchEvent(new Event("emdc-local-sync"));
            } catch {}
            markActionDone(`marketing-send-dc-${row.id}`);
                  }} />
        </div>
      );
    }

    if(tab==="livestream"){
      const livestreamData = ((group.aiWorkspace || {}).livestream || {}) as any;
      const livestreamTabs = [
        { id:"main", label:"Main Livestream" },
        { id:"johnsmithShopee", label:"Johnsmith Shopee SL" },
        { id:"johnsmithTiktok", label:"Johnsmith TikTok SL" },
        { id:"humanLive", label:"Human Live (TikTok QNH)" },
      ];
      const activeLivestreamTab = livestreamTabs.some((item:any)=>item.id===livestreamData.activeTab) ? livestreamData.activeTab : "main";
      const livestreamProductKey = (item:any,idx:number) => `${item.sku || item.skuCode || item.product || item.productName || "livestream-product"}__${idx}`;
      const productIntroLivestreamRows = isProductIntroductionChecklist ? getProductIntroLivestreamRows() : [];
      const productIntroLivestreamProducts = productIntroLivestreamRows.flatMap((row:any)=>Array.isArray(row.products) && row.products.length ? row.products.map((p:any)=>({
        product:p.product || row.product || "",
        sku:p.sku || row.sku || "",
        brand:p.brand || row.brand || "",
        collection:p.collection || row.category || row.collection || "",
        category:p.collection || row.category || row.collection || "",
      })) : [{
        product:row.product || "",
        sku:row.sku || "",
        brand:row.brand || "",
        collection:row.category || row.collection || "",
        category:row.category || row.collection || "",
      }]);
      const campaignLivestreamRows = isCampaignChecklist ? getCampaignLivestreamRowsWithBackup() : [];
      const campaignLivestreamProductsFromRows = campaignLivestreamRows.flatMap((row:any)=>Array.isArray(row.products) && row.products.length ? row.products.map((product:any)=>({
        product:product.product || product.productName || row.product || "",
        productName:product.productName || product.product || row.product || "",
        sku:product.sku || product.skuCode || "",
        skuCode:product.skuCode || product.sku || "",
        brand:product.brand || row.brand || "",
        collection:product.collection || product.category || row.collection || "",
        category:product.category || product.collection || row.collection || "",
      })) : []);
      const livestreamTransferRows = isProductIntroductionChecklist ? productIntroLivestreamRows : (isCampaignChecklist ? campaignLivestreamRows : []);
      const livestreamTransferCards = normalizeProductIntroTransferCards(livestreamTransferRows);
      const fallbackLivestreamProducts = (productRows || []).map((row:any)=>({
        product:row.product || row.productName || row.name || "",
        sku:row.skuCode || row.sku || row.value || "",
        brand:row.brand || "",
        collection:row.collection || row.category || "",
        category:row.category || row.collection || "",
      })).filter((item:any)=>String(item.product || item.sku).trim());
      const livestreamMappedProducts = productIntroLivestreamProducts.length ? productIntroLivestreamProducts : (campaignLivestreamProductsFromRows.length ? campaignLivestreamProductsFromRows : fallbackLivestreamProducts);
      const selectedLivestreamProductKeys = Array.isArray(livestreamData.selectedProductKeys) ? livestreamData.selectedProductKeys : [];
      const placedLivestreamProductKeys = Array.isArray(livestreamData.placedProductKeys) ? livestreamData.placedProductKeys : [];
      const selectedLivestreamProducts = livestreamMappedProducts.filter((item:any,idx:number)=>selectedLivestreamProductKeys.includes(livestreamProductKey(item,idx)));
      const placedLivestreamProducts = livestreamMappedProducts.filter((item:any,idx:number)=>placedLivestreamProductKeys.includes(livestreamProductKey(item,idx)));
      const getLivestreamProductKeysForTransfer = (products:any[] = []) => {
        const usedIndexes = new Set<number>();
        return (products || []).map((transferProduct:any)=>{
          const targetSku = String(transferProduct?.sku || transferProduct?.skuCode || "").trim().toLowerCase();
          const targetProduct = String(transferProduct?.product || transferProduct?.productName || "").trim().toLowerCase();
          const matchIndex = livestreamMappedProducts.findIndex((item:any,idx:number)=>{
            if (usedIndexes.has(idx)) return false;
            const itemSku = String(item?.sku || item?.skuCode || "").trim().toLowerCase();
            const itemProduct = String(item?.product || item?.productName || "").trim().toLowerCase();
            return (!!targetSku && itemSku === targetSku) || (!!targetProduct && itemProduct === targetProduct);
          });
          if (matchIndex < 0) return "";
          usedIndexes.add(matchIndex);
          return livestreamProductKey(livestreamMappedProducts[matchIndex],matchIndex);
        }).filter(Boolean);
      };
      const setLivestreamTransferSelected = (transferProducts:any[], selected:boolean) => {
        const transferKeys = getLivestreamProductKeysForTransfer(transferProducts);
        const current = new Set(selectedLivestreamProductKeys);
        transferKeys.forEach((key:string)=>{
          if (selected) current.add(key);
          else current.delete(key);
        });
        updateLivestream({ selectedProductKeys:Array.from(current) });
      };
      const setLivestreamProductSelected = (product:any, selected:boolean) => {
        const productKey = getLivestreamProductKeysForTransfer([product])[0];
        if (!productKey) return;
        const current = new Set(selectedLivestreamProductKeys);
        if (selected) current.add(productKey);
        else current.delete(productKey);
        updateLivestream({ selectedProductKeys:Array.from(current) });
      };
      const livestreamPromotions = Array.isArray(livestreamData.promotions) ? livestreamData.promotions : [];
      const livestreamVoucherCards = Array.isArray(livestreamData.voucherCards) ? livestreamData.voucherCards : [];
      const updateLivestream = (patch:any) => updateAiWorkspace("livestream",{ ...livestreamData,...patch });
      const getLivestreamTopicContext = () => {
        const products = placedLivestreamProducts.map((p:any,i:number)=>({
          index:i+1,
          product:String(p.product || p.productName || p.name || "Product").trim(),
          sku:String(p.sku || p.skuCode || "").trim(),
          brand:String(p.brand || "").trim(),
          category:String(p.collection || p.category || "").trim(),
        }));
        const productNames = products.map((p:any)=>p.product).filter(Boolean);
        const firstProduct = productNames[0] || "the featured product";
        const allProductsText = products.length ? products.map((p:any)=>`${p.index}. ${p.product}${p.sku ? ` · SKU: ${p.sku}` : ""}${p.brand ? ` · ${p.brand}` : ""}${p.category ? ` · ${p.category}` : ""}`).join("\n") : "No products selected yet.";
        const promos = [livestreamData.mainPromotion, ...livestreamPromotions.map((p:any)=>formatMainPromotion(p))].map((v:any)=>String(v||"").trim()).filter(Boolean);
        const vouchers = livestreamVoucherCards.map((v:any)=>formatMainPromotion(v)).map((v:any)=>String(v||"").trim()).filter(Boolean);
        const promoLine = promos.length ? promos.join("\n") : "No active promo added yet.";
        const voucherLine = vouchers.length ? vouchers.join("\n") : "No voucher card text added yet.";
        const instructions = livestreamData.topicInstructions || {};
        return { products, productNames, firstProduct, allProductsText, promos, vouchers, promoLine, voucherLine, instructions };
      };
      const makeLivestreamTopicBank = () => {
        const ctx = getLivestreamTopicContext();
        const productNames = ctx.productNames.length ? ctx.productNames : ["Featured Product"];
        const first = ctx.firstProduct;
        const promoFocus = ctx.promos[0] || "live offer";
        const voucherFocus = ctx.vouchers[0] || "voucher card";
        const productPair = productNames.slice(0,2).join(" vs ") || first;
        const topicSets:any = {
          BAU:[
            [`Everyday Demo: Why ${first} Is Useful At Home`, "Show practical daily use, key benefit, and easy add-to-cart reminder."],
            [`Size Guide: Which ${productPair} Should Viewers Choose?`, "Compare selected products by use case, family size, and buyer need."],
            [`Customer FAQ Live: Common Questions About ${first}`, "Answer care, usage, value, size, and checkout questions in a helpful flow."],
            [`3 Easy Ways To Use ${first}`, "Give fast everyday ideas, demo moments, and simple product benefits."],
            [`Problem-Solution Demo For Busy Buyers`, "Start with a relatable pain point, then show how the selected products solve it."],
            [`Product Pairing Tips From The Collection`, "Recommend combinations from the selected products and explain when to buy each."],
            [`Care And Maintenance Mini Guide`, "Teach simple care tips while reinforcing long-term value and quality."],
            [`Best Pick For First-Time Buyers`, "Guide new buyers to the easiest product to start with, then upsell the rest."],
          ],
          Launching:[
            [`First Look: Meet ${first}`, "Introduce the product as a new release with first impressions and feature reveals."],
            [`New Collection Walkthrough`, "Present every selected product as part of the launch lineup."],
            [`What Makes This Launch Different?`, "Highlight unique features, design, and why viewers should pay attention."],
            [`Live Unboxing And First Impressions`, "Show packaging or first-look style moments, then move into demo and benefits."],
            [`Launch Day Product Test`, "Test the product live and explain what viewers should notice."],
            [`New Arrival Buyer Guide`, "Help viewers decide which selected product fits their lifestyle best."],
            [`Behind The Launch Story`, "Frame the products around why they were introduced and who they are for."],
            [`Launch Offer Push: ${promoFocus}`, "Connect the new release to the promotion and create urgency."],
          ],
          Campaign:[
            [`Campaign Deal Focus: ${promoFocus}`, "Lead with the promo, then show the products as the best picks for the campaign."],
            [`Voucher Reminder: ${voucherFocus}`, "Teach viewers how to claim/use the voucher while presenting selected products."],
            [`Live-Only Savings Walkthrough`, "Explain deal mechanics clearly and repeatedly while showing product benefits."],
            [`Bundle And Add-To-Cart Strategy`, "Encourage viewers to combine selected products to maximize savings."],
            [`Limited-Time Checkout Push`, "Create urgency around promo period, voucher card, and low-friction checkout."],
            [`Best Products To Buy During This Campaign`, "Rank or group the selected products by buyer need and promo value."],
            [`Flash Deal Talking Points`, "Use short, energetic reminders about price, promo, voucher, and CTA."],
            [`Campaign Closing Script`, "Strong final push using selected products, promo, voucher, and last-call CTA."],
          ],
        };
        const selectedTypes = Array.isArray(livestreamData.selectedAiTopics)
          ? livestreamData.selectedAiTopics
          : (livestreamData.aiTopic ? [livestreamData.aiTopic] : ["BAU"]);
        const cleanTypes = selectedTypes.filter((type:string)=>topicSets[type]);
        return cleanTypes.flatMap((type:string)=>topicSets[type].map((row:any,index:number)=>({
          id:`${type.toLowerCase()}-${index+1}-${uid()}`,
          type,
          title:row[0],
          angle:row[1],
          products:ctx.products,
          instruction:(ctx.instructions || {})[type] || "",
        })));
      };
      const generateLivestreamTopicBank = () => {
        const topics = makeLivestreamTopicBank();
        updateLivestream({ generatedTopics:topics, selectedGeneratedTopicId:"", generatedTopicText:topics.length ? "" : "Please select at least one AI Topic type: BAU, Launching, or Campaign." });
        markActionDone("livestream-generate-topics");
      };
      const getLivestreamTopicDetails = (topicItem:any) => {
        const ctx = getLivestreamTopicContext();
        if(!topicItem) return [];
        const topicType = topicItem.type || "BAU";
        const instructions = topicItem.instruction || (ctx.instructions || {})[topicType] || "";
        const productFocus = ctx.products.length
          ? ctx.products.map((p:any)=>`${p.product}${p.sku ? ` (${p.sku})` : ""}`).join(", ")
          : "No products selected yet.";
        const typeDetails:any = {
          BAU:{
            objective:"Use this as an everyday live selling angle. Focus on helpful demos, buyer questions, daily use cases, and soft add-to-cart reminders.",
            hook:`Quick live check! If you want a practical kitchen upgrade, this topic is for you: ${topicItem.title}.`,
            flow:["Start with a relatable everyday problem.","Show the selected products one by one.","Explain the key use case and buyer benefit.","Answer likely questions while showing the product clearly.","Mention the promo or voucher naturally before the CTA."],
            engagement:["Ask viewers what size or variant they need.","Invite comments like ‘Oval’ or ‘Round’ for recommendations.","Ask if they want a demo, care tip, or comparison next."],
            cta:"Add to cart while the live offer is active, then claim the voucher before checkout.",
          },
          Launching:{
            objective:"Use this as a new-product or new-collection launch angle. Focus on first look, product reveal, feature discovery, and launch urgency.",
            hook:`First look live! We are introducing ${ctx.firstProduct} and why it deserves attention today.`,
            flow:["Open with a launch-style product reveal.","Introduce what is new or special about the selected products.","Show close-up details and first impressions.","Explain who each product is best for.","Connect the launch offer to the main CTA."],
            engagement:["Ask viewers which product they want to see first.","Ask them to comment ‘NEW’ for launch picks.","Use quick polls like ‘family size or solo use?’"],
            cta:"Shop the new release while the launch promo is available.",
          },
          Campaign:{
            objective:"Use this as a campaign or promo-driven live selling angle. Focus on deals, vouchers, urgency, campaign mechanics, and fast conversion.",
            hook:`Campaign deal alert! Here are the best picks to match today’s offer: ${ctx.promos[0] || topicItem.title}.`,
            flow:["Lead with the campaign deal or voucher.","Explain how viewers can use the promo.","Show the selected products as best-buy options.","Repeat savings reminders between product demos.","End with urgency and checkout instructions."],
            engagement:["Ask viewers to comment if they want the voucher repeated.","Ask what product they want added to cart first.","Remind viewers to screenshot or pin the voucher card text."],
            cta:"Claim the voucher, add the product to cart, and check out before the live deal ends.",
          },
        };
        const detail = typeDetails[topicType] || typeDetails.BAU;
        return [
          { label:"Topic Type", value:topicType },
          { label:"Main Objective", value:detail.objective },
          { label:"Featured Product Focus", value:productFocus },
          { label:"Promotion Angle", value:ctx.promoLine },
          { label:"Voucher Card Angle", value:ctx.voucherLine },
          { label:"Suggested Opening Hook", value:detail.hook },
          { label:"Recommended Live Flow", value:detail.flow.map((line:string,idx:number)=>`${idx+1}. ${line}`).join("\n") },
          { label:"Audience Engagement Prompts", value:detail.engagement.map((line:string)=>`• ${line}`).join("\n") },
          { label:"Instruction To Follow", value:instructions || "Use the default topic type instruction." },
          { label:"Closing CTA", value:detail.cta },
        ];
      };
      const generateLivestreamScriptFromTopic = (topicItem:any) => {
        if(!topicItem) return;
        const ctx = getLivestreamTopicContext();
        const topicType = topicItem.type || livestreamData.aiTopic || "BAU";
        const instructions = topicItem.instruction || (ctx.instructions || {})[topicType] || "Create a clear live selling flow with opening hook, product demo, offer push, engagement prompts, and closing CTA.";
        const topicSpecific:any = {
          BAU:"Keep the tone helpful, practical, and everyday. Focus on customer needs, product benefits, demos, and soft selling.",
          Launching:"Keep the tone exciting and new. Emphasize newness, first look, product reveal, launch benefit, and launch urgency.",
          Campaign:"Keep the tone promotional and urgent. Prioritize campaign message, main promo, vouchers, savings, and checkout reminders.",
        };
        const productTalkingPoints = ctx.products.length ? ctx.products.map((p:any)=>`${p.index}. ${p.product}${p.sku ? ` (${p.sku})` : ""}: Show the product clearly, explain who it is for, mention one key benefit, then connect it to the promo or voucher.`).join("\n") : "1. Show the featured product clearly and explain the main customer benefit.";
        const script = [
          `AI TOPIC TYPE: ${topicType}`,
          `TOPIC TITLE:
${topicItem.title}`,
          `TOPIC ANGLE:
${topicItem.angle}`,
          `INSTRUCTIONS FOLLOWED:
${instructions}`,
          `TOPIC STYLE:
${topicSpecific[topicType] || topicSpecific.BAU}`,
          `FEATURED PRODUCTS:
${ctx.allProductsText}`,
          `PROMOTIONS:
${ctx.promoLine}`,
          `VOUCHER CARD TEXT:
${ctx.voucherLine}`,
          `OPENING HOOK:
Start with: "Quick live check! If you're looking for ${ctx.firstProduct}, this part is for you." Then introduce the topic: ${topicItem.title}.`,
          `LIVE FLOW:
1. Open with the buyer problem or shopping reason.
2. Present the selected products one by one.
3. Demonstrate the strongest benefit or use case.
4. Mention the promotion clearly.
5. Flash or repeat the voucher card text.
6. Ask viewers to comment which product they want to see again.
7. Close with a clear add-to-cart or checkout CTA.`,
          `PRODUCT TALKING POINTS:
${productTalkingPoints}`,
          `ENGAGEMENT QUESTIONS:
- Which size or product do you want me to show closer?
- Are you buying for personal use, gift, or restock?
- Do you want me to repeat the promo and voucher mechanics?`,
          `OBJECTION HANDLING:
If viewers hesitate, remind them of the product benefit, selected SKU options, current promotion, voucher card text, and limited live timing.`,
          `CLOSING CTA:
Tap the product basket, claim the voucher if available, and checkout while the live offer is active.`
        ].join("\n\n");
        updateLivestream({ selectedGeneratedTopicId:topicItem.id, generatedTopicText:script });
        markActionDone("livestream-generate-script");
      };
      const addLivestreamPromotion = () => {
        const draft = normalizeLivestreamOfferDraft(livestreamData.promotionDraft);
        if(!formatMainPromotion(draft)) return;
        updateLivestream({ promotions:[...livestreamPromotions,{ id:uid(), ...draft }], promotionDraft:{ type:"text", value:"", text:"" }, showPromotionDraft:false });
      };
      const updateLivestreamPromotion = (id:string,patch:any) => updateLivestream({ promotions:livestreamPromotions.map((item:any)=>item.id===id?{...item,...patch}:item) });
      const deleteLivestreamPromotion = (id:string) => updateLivestream({ promotions:livestreamPromotions.filter((item:any)=>item.id!==id), editingPromotionId:livestreamData.editingPromotionId===id?"":livestreamData.editingPromotionId });
      const addLivestreamVoucher = () => {
        const draft = normalizeLivestreamOfferDraft(livestreamData.voucherDraft);
        if(!formatMainPromotion(draft)) return;
        updateLivestream({ voucherCards:[...livestreamVoucherCards,{ id:uid(), ...draft }], voucherDraft:{ type:"text", value:"", text:"" }, showVoucherDraft:false });
      };
      const updateLivestreamVoucher = (id:string,patch:any) => updateLivestream({ voucherCards:livestreamVoucherCards.map((item:any)=>item.id===id?{...item,...patch}:item) });
      const deleteLivestreamVoucher = (id:string) => updateLivestream({ voucherCards:livestreamVoucherCards.filter((item:any)=>item.id!==id), editingVoucherId:livestreamData.editingVoucherId===id?"":livestreamData.editingVoucherId });

      const normalizeLivestreamOfferDraft = (value:any) => {
        if (value && typeof value === "object") {
          return {
            type:value.type || "text",
            value:String(value.value || ""),
            text:String(value.text || ""),
          };
        }
        return { type:"text", value:"", text:String(value || "") };
      };
      const updateLivestreamOfferDraft = (draftKey:string,patch:any) => {
        updateLivestream({ [draftKey]:{ ...normalizeLivestreamOfferDraft(livestreamData[draftKey]), ...patch } });
      };
      const renderLivestreamOfferInput = (offer:any,onChange:any,placeholder:string) => {
        const draft = normalizeLivestreamOfferDraft(offer);
        return (
          <div style={{ display:"grid",gap:10 }}>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"180px minmax(0,1fr)",gap:10 }}>
              <Select value={draft.type || "text"} onChange={(v:string)=>onChange({ type:v })}>
                <option value="text">Custom Text</option>
                <option value="discount">Discount %</option>
                <option value="php">PHP Value</option>
              </Select>
              <TI value={draft.value || ""} onChange={(v:string)=>onChange({ value:v })} placeholder="Value e.g. 20 or 100" />
            </div>
            <textarea
              value={draft.text || ""}
              onChange={(e:any)=>onChange({ text:e.target.value })}
              placeholder={placeholder}
              rows={3}
              style={{ width:"100%",maxWidth:"100%",boxSizing:"border-box",minHeight:78,resize:"vertical",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
            />
          </div>
        );
      };
      const renderLivestreamOfferListCard = ({ title, subtitle, draftKey, items, editingKey, addItem, updateItem, deleteItem, placeholder, emptyText }:any) => {
        const draft = normalizeLivestreamOfferDraft(livestreamData[draftKey]);
        const hasDraft = !!formatMainPromotion(draft);
        const showDraftKey = draftKey === "voucherDraft" ? "showVoucherDraft" : "showPromotionDraft";
        const showDraft = !!livestreamData[showDraftKey];
        const handleDraftButton = () => {
          if (!showDraft) {
            updateLivestream({ [showDraftKey]:true });
            return;
          }
          addItem();
        };
        return (
          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:showDraft?10:0,flexWrap:"wrap" }}>
              <div>
                <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>{title}</p>
                <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted,lineHeight:1.4 }}>{subtitle}</p>
              </div>
              <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                {showDraft&&<Btn xs variant="outline" onClick={()=>updateLivestream({ [showDraftKey]:false })}>Cancel</Btn>}
                <Btn xs onClick={handleDraftButton} disabled={showDraft&&!hasDraft}>{showDraft?"Save":"Add"}</Btn>
              </div>
            </div>

            {showDraft&&(
              <div style={{ border:`1.5px solid ${hasDraft?"#A7F3D0":C.border}`,background:hasDraft?"#F0FDF4":C.bg,borderRadius:12,padding:12,display:"grid",gap:10,marginBottom:10 }}>
                {renderLivestreamOfferInput(draft,(patch:any)=>updateLivestreamOfferDraft(draftKey,patch),placeholder)}
              </div>
            )}

            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {items.length ? items.map((item:any,index:number)=>{
                const display = formatMainPromotion(item);
                const isEditing = livestreamData[editingKey] === item.id;
                const itemInfo:any = getMainPromotionDisplay(item);
                return (
                  <div key={item.id || index} style={{ padding:12,borderRadius:10,background:display?"#F0FDF4":C.bg,border:`1.5px solid ${display?"#A7F3D0":C.border}` }}>
                    {isEditing ? (
                      renderLivestreamOfferInput(item,(patch:any)=>updateItem(item.id,patch),placeholder)
                    ) : (
                      renderMainPromotionCard(item,true,title === "Vouchers" ? "Voucher" : "Promotion")
                    )}
                    <div style={{ display:"flex",justifyContent:"flex-end",gap:6,marginTop:10,flexWrap:"wrap" }}>
                      <Btn xs variant="outline" onClick={()=>updateLivestream({ [editingKey]:isEditing?"":item.id })}>{isEditing?"Save":"Edit"}</Btn>
                      <Btn xs variant="danger" onClick={()=>deleteItem(item.id)}>Delete</Btn>
                    </div>
                  </div>
                );
              }) : <p style={{ margin:0,fontSize:12,color:C.muted }}>{emptyText}</p>}
            </div>
          </div>
        );
      };

      const LivestreamPlaceholder = ({ title }:any) => (
        <div style={{ minHeight:280,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:18 }}>
          <div>
            <p style={{ margin:"0 0 6px",fontSize:14,fontWeight:900,color:C.text }}>{title}</p>
            <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>This livestream sub-page is ready for the next workflow setup.</p>
          </div>
        </div>
      );

      return (
        <div style={{ display:"flex",flexDirection:"column",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
          <div style={{ padding:isMobile?12:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Livestream</h3>
            <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:920 }}>Plan live selling product selections, promotions, voucher card text, AI topic, scripts, talking points, demo flow, offer pushes, and closing CTAs.</p>
          </div>

          {!!formatMainPromotion(livestreamData.mainPromotion)&&(
            renderMainPromotionCard(livestreamData.mainPromotion, true)
          )}

          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12 }}>
            {renderLivestreamOfferListCard({
              title:"Promotions",
              subtitle:"Optional exclusive platform/live promo.",
              draftKey:"promotionDraft",
              items:livestreamPromotions,
              editingKey:"editingPromotionId",
              addItem:addLivestreamPromotion,
              updateItem:updateLivestreamPromotion,
              deleteItem:deleteLivestreamPromotion,
              placeholder:"Promotion details. Example: Live-only ₱100 OFF with free shipping tonight, 7.7 Rainy Deal, bundle offer, or TikTok Shop exclusive offer.",
              emptyText:"No promotions added yet.",
            })}

            {renderLivestreamOfferListCard({
              title:"Vouchers",
              subtitle:"Add short voucher lines for the live.",
              draftKey:"voucherDraft",
              items:livestreamVoucherCards,
              editingKey:"editingVoucherId",
              addItem:addLivestreamVoucher,
              updateItem:updateLivestreamVoucher,
              deleteItem:deleteLivestreamVoucher,
              placeholder:"Voucher details. Example: CLAIM NOW: ₱50 OFF minimum ₱499, free shipping voucher, or live-only checkout code.",
              emptyText:"No vouchers added yet.",
            })}
          </div>

          {((isProductIntroductionChecklist&&productIntroLivestreamRows.length>0) || (isCampaignChecklist&&campaignLivestreamRows.length>0))&&(
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <div style={{ padding:"10px 12px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                <div>
                  <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>{isProductIntroductionChecklist ? "Main Livestream Product Row Groups" : "Campaign Livestream Product Row Groups"}</span>
                  <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>{selectedLivestreamProducts.length} selected · {placedLivestreamProducts.length} placed · {livestreamTransferCards.length} group{livestreamTransferCards.length!==1?"s":""} from E-commerce</span>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",width:isMobile?"100%":"auto" }}>
                  <Btn xs variant="outline" onClick={()=>updateLivestream({ selectedProductKeys:livestreamMappedProducts.map((item:any,idx:number)=>livestreamProductKey(item,idx)) })} disabled={!livestreamMappedProducts.length}>Select All Groups</Btn>
                  <Btn xs variant="outline" onClick={()=>updateLivestream({ selectedProductKeys:[] })} disabled={!selectedLivestreamProductKeys.length}>Clear Selection</Btn>
                  <Btn xs onClick={()=>updateLivestream({ placedProductKeys:selectedLivestreamProductKeys })} disabled={!selectedLivestreamProductKeys.length}>Add Selected</Btn>
                  <Btn xs variant="danger" onClick={()=>updateLivestream({ placedProductKeys:[] })} disabled={!placedLivestreamProductKeys.length}>Clear Products</Btn>
                </div>
              </div>
              {placedLivestreamProducts.length>0&&(
                <div style={{ padding:"8px 12px",background:"#ECFDF5",border:`1px solid ${C.border}`,borderRadius:10,fontSize:11.5,color:"#047857",fontWeight:850 }}>
                  Main Livestream will use {placedLivestreamProducts.length} placed product{placedLivestreamProducts.length!==1?"s":""}: {placedLivestreamProducts.map((item:any)=>item.product || item.sku).filter(Boolean).join(", ")}
                </div>
              )}
              {livestreamTransferCards.map((transfer:any,transferIndex:number)=>{
                const transferProducts = Array.isArray(transfer.products) && transfer.products.length ? transfer.products : [transfer];
                const transferProductKeys = getLivestreamProductKeysForTransfer(transferProducts);
                const transferSelected = transferProductKeys.length > 0 && transferProductKeys.every((key:string)=>selectedLivestreamProductKeys.includes(key));
                const transferPlaced = transferProductKeys.length > 0 && transferProductKeys.every((key:string)=>placedLivestreamProductKeys.includes(key));
                return (
                  <div key={transfer.id || transferIndex} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                    <div style={{ padding:"10px 12px",background:transferPlaced?"#ECFDF5":transferSelected?"#EEF2FF":C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                      <label style={{ display:"flex",alignItems:"flex-start",gap:9,minWidth:0,flex:1,cursor:"pointer" }}>
                        <input type="checkbox" checked={transferSelected} onChange={(e:any)=>setLivestreamTransferSelected(transferProducts,e.target.checked)} style={{ marginTop:3,flexShrink:0 }} />
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:0,fontSize:13,fontWeight:950,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{transferProducts.map((product:any)=>product.product || product.productName || "Product").filter(Boolean).join(" + ") || `Product List Card ${transferIndex+1}`}</p>
                          <p style={{ margin:"2px 0 0",fontSize:10.5,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{transferProducts.map((product:any)=>[product.brand,product.collection || product.category,product.sku || product.skuCode].filter(Boolean).join(" · ")).filter(Boolean).join(", ") || `${transferProducts.length} product${transferProducts.length!==1?"s":""} sent from E-commerce`}</p>
                        </div>
                      </label>
                      <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                        {transferPlaced&&<span style={{ fontSize:10.5,fontWeight:800,color:"#047857",background:"#D1FAE5",border:"1px solid #A7F3D0",borderRadius:999,padding:"3px 8px" }}>Added</span>}
                        <span style={{ fontSize:10.5,fontWeight:800,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:999,padding:"3px 8px" }}>{transferProducts.length} product{transferProducts.length!==1?"s":""}</span>
                        <Btn xs variant="danger" onClick={(e:any)=>{
                          e?.stopPropagation?.();
                          if (isProductIntroductionChecklist) {
                            deleteProductIntroLivestreamTransferAtIndex(transferIndex);
                          } else {
                            const nextRows = campaignLivestreamRows.filter((_:any,idx:number)=>idx!==transferIndex);
                            writeEcommerceTransferRowsBackup("livestream","campaign",nextRows);
                            updateLivestream({ campaignLivestreamRows:nextRows, selectedProductKeys:[], placedProductKeys:[] });
                          }
                        }}>Delete</Btn>
                      </div>
                    </div>
                    <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
                      <table style={{ width:"100%",minWidth:920,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                        <thead>
                          <tr style={{ background:C.surfaceAlt }}>
                            {["Select","Platform","Brand","Category","Product","SKU","Image Link"].map((label:string)=>(
                              <th key={label} style={{ padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {transferProducts.map((product:any,idx:number)=>{
                            const productKey = getLivestreamProductKeysForTransfer([product])[0] || "";
                            const productSelected = !!productKey && selectedLivestreamProductKeys.includes(productKey);
                            const productPlaced = !!productKey && placedLivestreamProductKeys.includes(productKey);
                            return (
                              <tr key={`${product.sku || product.skuCode || product.product || idx}`} style={{ background:productPlaced?"#ECFDF5":productSelected?"#EEF2FF":idx%2?C.surface:C.bg }}>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>
                                  <input
                                    type="checkbox"
                                    checked={productSelected}
                                    onClick={(e:any)=>e.stopPropagation()}
                                    onChange={(e:any)=>setLivestreamProductSelected(product,e.target.checked)}
                                  />
                                </td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:850 }}>All Platforms</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.brand || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.collection || product.category || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,minWidth:220 }}>{product.product || product.productName || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:850 }}>{product.sku || product.skuCode || ""}</td>
                                <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",maxWidth:240 }}>{renderTransferImageLinkCell(product)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display:"flex",gap:8,flexWrap:"wrap",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:8 }}>
            {livestreamTabs.map((item:any)=>(
              <button key={item.id} type="button" onClick={()=>updateLivestream({ activeTab:item.id })}
                style={{ padding:"9px 14px",borderRadius:9,border:`1.5px solid ${activeLivestreamTab===item.id?C.accent:C.border}`,background:activeLivestreamTab===item.id?C.accent:C.surface,color:activeLivestreamTab===item.id?"#fff":C.textSub,fontSize:12.5,fontWeight:900,cursor:"pointer" }}>
                {item.label}
              </button>
            ))}
          </div>

          {activeLivestreamTab!=="main" ? (
            <LivestreamPlaceholder title={livestreamTabs.find((item:any)=>item.id===activeLivestreamTab)?.label || "Livestream Sub Page"} />
          ) : (
            <>
              {!isProductIntroductionChecklist&&!isCampaignChecklist&&(
              <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ padding:"10px 12px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                  <div>
                    <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Main Livestream Products</span>
                    <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>{selectedLivestreamProducts.length} selected · {placedLivestreamProducts.length} placed · {livestreamMappedProducts.length} available</span>
                  </div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",width:isMobile?"100%":"auto" }}>
                    <Btn xs variant="outline" onClick={()=>updateLivestream({ selectedProductKeys:livestreamMappedProducts.map((item:any,idx:number)=>livestreamProductKey(item,idx)) })} disabled={!livestreamMappedProducts.length}>Select All</Btn>
                    <Btn xs variant="outline" onClick={()=>updateLivestream({ selectedProductKeys:[] })} disabled={!selectedLivestreamProductKeys.length}>Clear Selection</Btn>
                    <Btn xs onClick={()=>updateLivestream({ placedProductKeys:selectedLivestreamProductKeys })} disabled={!selectedLivestreamProductKeys.length}>Add Selected</Btn>
                    <Btn xs variant="danger" onClick={()=>updateLivestream({ placedProductKeys:[] })} disabled={!placedLivestreamProductKeys.length}>Clear Products</Btn>
                  </div>
                </div>
                {placedLivestreamProducts.length>0&&(
                  <div style={{ padding:"8px 12px",background:"#ECFDF5",borderBottom:`1px solid ${C.border}`,fontSize:11.5,color:"#047857",fontWeight:850 }}>
                    Main Livestream will use {placedLivestreamProducts.length} product{placedLivestreamProducts.length!==1?"s":""}: {placedLivestreamProducts.map((item:any)=>item.product || item.sku).filter(Boolean).join(", ")}
                  </div>
                )}
                {livestreamMappedProducts.length ? (
                  <div style={{ overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",maxHeight:isMobile?280:360 }}>
                    <table style={{ width:"100%",minWidth:940,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                      <thead>
                        <tr style={{ background:C.surfaceAlt }}>
                          {["Select","Added","Brand","Category","Product","SKU","Image Link"].map((label:string)=>(
                            <th key={label} style={{ position:"sticky",top:0,zIndex:1,background:C.surfaceAlt,padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {livestreamMappedProducts.map((product:any,idx:number)=>{
                          const key = livestreamProductKey(product,idx);
                          const checked = selectedLivestreamProductKeys.includes(key);
                          const placed = placedLivestreamProductKeys.includes(key);
                          return (
                            <tr key={key} style={{ background:placed?"#ECFDF5":checked?"#EEF2FF":idx%2?C.surface:C.bg }}>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}` }}>
                                <input type="checkbox" checked={checked} onChange={()=>{
                                  const next = checked ? selectedLivestreamProductKeys.filter((item:string)=>item!==key) : [...selectedLivestreamProductKeys,key];
                                  updateLivestream({ selectedProductKeys:next });
                                }} />
                              </td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,fontWeight:850,color:placed?"#047857":C.faint }}>{placed ? "Added" : "Not added"}</td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.brand || ""}</td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{product.collection || product.category || ""}</td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,minWidth:220,fontWeight:850,color:C.text }}>{product.product || ""}</td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",fontWeight:750 }}>{product.sku || ""}</td>
                              <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,whiteSpace:"nowrap",maxWidth:240 }}>{renderTransferImageLinkCell(product)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding:16,fontSize:12,color:C.muted,textAlign:"center" }}>No mapped products available yet.</div>
                )}
              </div>
              )}

              <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10 }}>
                  <Field label="AI Topic">
                    <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                      {["BAU","Launching","Campaign"].map((topic:string)=>{
                        const selectedTopics = (Array.isArray(livestreamData.selectedAiTopics) && livestreamData.selectedAiTopics.length)
                          ? livestreamData.selectedAiTopics
                          : [livestreamData.aiTopic || "BAU"];
                        const checked = selectedTopics.includes(topic);
                        return (
                          <label key={topic} style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:9,border:`1.5px solid ${checked?C.accent:C.border}`,background:checked?"#EEF2FF":C.surface,cursor:"pointer",fontSize:13,fontWeight:800,color:C.textSub }}>
                            <input type="checkbox" checked={checked} onChange={(e:any)=>{
                              const current = (Array.isArray(livestreamData.selectedAiTopics) && livestreamData.selectedAiTopics.length)
                                ? livestreamData.selectedAiTopics
                                : [livestreamData.aiTopic || "BAU"];
                              const next = e.target.checked
                                ? Array.from(new Set([...current,topic]))
                                : current.filter((item:string)=>item!==topic);
                              updateLivestream({ selectedAiTopics:next, aiTopic:next[0] || "" });
                            }} />
                            {topic}
                          </label>
                        );
                      })}
                    </div>
                    <p style={{ margin:"6px 0 0",fontSize:11,color:C.muted }}>Only checked topic types will generate AI topics.</p>
                  </Field>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    <Btn xs variant="outline" onClick={()=>updateLivestream({ manageTopicsOpen:!livestreamData.manageTopicsOpen })}>Manage Topics</Btn>
                    <Btn xs onClick={generateLivestreamTopicBank}>{actionDone("livestream-generate-topics")?"✓ Topics Generated":"Generate Topics"}</Btn>
                    <Btn xs variant="outline" disabled={!livestreamData.selectedGeneratedTopicId} onClick={()=>{
                      const topics = Array.isArray(livestreamData.generatedTopics) ? livestreamData.generatedTopics : [];
                      const selectedTopic = topics.find((item:any)=>item.id===livestreamData.selectedGeneratedTopicId);
                      generateLivestreamScriptFromTopic(selectedTopic);
                    }}>{actionDone("livestream-generate-script")?"✓ Script Generated":"Generate Script"}</Btn>
                  </div>
                </div>
                {Array.isArray(livestreamData.generatedTopics)&&livestreamData.generatedTopics.length>0&&(
                  <div style={{ display:"grid",gap:10,marginBottom:12,padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                      <p style={{ margin:0,fontSize:11,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>AI Topic Bank</p>
                      <Tag sm>{livestreamData.generatedTopics.length} topics</Tag>
                    </div>
                    {["BAU","Launching","Campaign"].map((type:string)=>{
                      const items = livestreamData.generatedTopics.filter((item:any)=>item.type===type);
                      if(!items.length) return null;
                      return (
                        <div key={type} style={{ display:"grid",gap:8 }}>
                          <p style={{ margin:"4px 0 0",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>{type} Topics</p>
                          <div style={{ columnCount:isMobile?1:2,columnGap:8 }}>
                            {items.map((item:any)=>{
                              const active = livestreamData.selectedGeneratedTopicId===item.id;
                              return (
                                <button key={item.id} type="button" onClick={()=>updateLivestream({ selectedGeneratedTopicId:active ? "" : item.id })}
                                  style={{ textAlign:"left",padding:10,borderRadius:10,border:`1.5px solid ${active?C.accent:C.border}`,background:active?"#EEF2FF":C.surface,cursor:"pointer",display:"inline-block",width:"100%",margin:"0 0 8px",verticalAlign:"top",breakInside:"avoid",WebkitColumnBreakInside:"avoid",pageBreakInside:"avoid" }}>
                                  <div style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start" }}>
                                    <strong style={{ fontSize:12.5,color:C.text,lineHeight:1.35 }}>{item.title}</strong>
                                    {active&&<span style={{ fontSize:11,fontWeight:900,color:C.accent }}>✓</span>}
                                  </div>
                                  <p style={{ margin:"5px 0 0",fontSize:11.5,color:C.muted,lineHeight:1.4 }}>{item.angle}</p>
                                  {active&&(<div style={{ marginTop:10,padding:10,border:`1px solid ${C.border}`,borderRadius:9,background:C.surface,display:"grid",gap:8 }}>
                                    <p style={{ margin:0,fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Comprehensive Topic Details</p>
                                    {getLivestreamTopicDetails(item).map((detail:any)=>(
                                      <div key={detail.label} style={{ display:"grid",gap:2 }}>
                                        <span style={{ fontSize:10.5,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".04em" }}>{detail.label}</span>
                                        <span style={{ fontSize:11.5,color:C.text,lineHeight:1.45,whiteSpace:"pre-wrap" }}>{detail.value}</span>
                                      </div>
                                    ))}
                                  </div>)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {livestreamData.manageTopicsOpen&&(
                  <div style={{ display:"grid",gap:10,marginBottom:12,padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                    {["BAU","Launching","Campaign"].map((topic:string)=>(
                      <div key={topic} style={{ display:"grid",gap:6 }}>
                        <p style={{ margin:0,fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>{topic} Instructions</p>
                        <textarea value={(livestreamData.topicInstructions || {})[topic] || ""} onChange={(e:any)=>updateLivestream({ topicInstructions:{ ...(livestreamData.topicInstructions || {}), [topic]:e.target.value } })} placeholder={`Instructions for ${topic} live topic`} rows={3} style={{ width:"100%",boxSizing:"border-box",resize:"vertical",border:`1.5px solid ${C.border}`,borderRadius:8,padding:8,fontSize:12.5,outline:"none" }} />
                      </div>
                    ))}
                    <div style={{ display:"flex",justifyContent:"flex-end" }}><Btn xs onClick={()=>{ updateLivestream({ manageTopicsOpen:false }); markActionDone("livestream-topics-save"); }}>{actionDone("livestream-topics-save")?"✓ Saved":"Save Topics"}</Btn></div>
                  </div>
                )}
                {!!String(livestreamData.generatedTopicText || "").trim()&&(
                  <div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                    <p style={{ margin:"0 0 8px",fontSize:11,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Generated Live Script</p>
                    <pre style={{ margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:12.5,lineHeight:1.5,color:C.text }}>{livestreamData.generatedTopicText}</pre>
                    <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:10 }}>
                      <Btn xs variant={actionDone("overview-livestream-topic")?"primary":"outline"} onClick={()=>{ addToOverview("Livestream",`Livestream AI Topic · ${((Array.isArray(livestreamData.selectedAiTopics) && livestreamData.selectedAiTopics.length) ? livestreamData.selectedAiTopics.join(" / ") : (livestreamData.aiTopic || "BAU"))}`,livestreamData.generatedTopicText,"Livestream Output", { tab:"livestream", type:"topic" }); markActionDone("overview-livestream-topic"); }}>{actionDone("overview-livestream-topic")?"✓ Added":"Add to Overview"}</Btn>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }


    const dcUrlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
    const normalizeDcUrl = (url:any) => {
      const raw = String(url || "").trim();
      if(!raw) return "";
      return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    };
    const uploadGeneratedImageToDrive = async ({ url, prompt, title, source, cardId, sourceRowId }: any) => {
      const imageUrl = String(url || "").trim();
      if(!imageUrl) throw new Error("No generated image URL to save.");
      if(/^data:image\//i.test(imageUrl)) throw new Error("Base64 images are blocked. Please regenerate using URL output.");

      const res = await fetch("/api/ai/save-image", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ imageUrl, prompt, title, source, cardId, sourceRowId }),
      });
      const raw = await res.text();
      let result:any = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
      if(!res.ok) throw new Error(result?.error || result?.message || "Failed to save image to Google Drive.");
      return result;
    };

    const extractDcLinks = (value:any) => {
      const raw = String(value || "");
      const found = raw.match(dcUrlRegex) || [];
      return Array.from(new Set(found.map((item:string)=>item.trim()).filter(Boolean)));
    };
    const normalizeDcMatchKey = (value:any) => String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,"");

    const getSkuStorageRowByProduct = (product:any) => {
      const safeProduct:any = product || {};
      const rows = Array.isArray(skuStorage) ? skuStorage : [];
      if(!rows.length || !safeProduct) return null;

      const normalizeKey = normalizeDcMatchKey;
      const productText = String(safeProduct.productName || safeProduct.product || safeProduct.name || safeProduct.title || "").trim();
      const brandText = String(safeProduct.brand || safeProduct.brandName || "").trim();
      const categoryText = String(safeProduct.category || safeProduct.collection || safeProduct.productCategory || "").trim();
      const sourceIds = [safeProduct.sourceId,safeProduct.storageId,safeProduct.skuStorageId]
        .map((value:any)=>String(value || "").trim())
        .filter(Boolean);

      const skuCandidates = [safeProduct.sku,safeProduct.skuCode,safeProduct.sku_code]
        .map((value:any)=>String(value || "").trim())
        .filter(Boolean);
      const skuKeys = Array.from(new Set(skuCandidates.map(normalizeKey).filter(Boolean)));

      const productKeys = Array.from(new Set([productText,safeProduct.product,safeProduct.productName,safeProduct.name,safeProduct.title]
        .map((value:any)=>normalizeKey(value))
        .filter(Boolean)));

      const getRowSkuKeys = (row:any) => [row?.sku,row?.skuCode,row?.sku_code,row?.value]
        .map((value:any)=>String(value || "").trim())
        .filter(Boolean)
        .map(normalizeKey)
        .filter(Boolean);

      const getRowProductText = (row:any) => String(row?.productName || row?.product || row?.name || row?.title || "").trim();
      const getRowProductKeys = (row:any) => [row?.productName,row?.product,row?.name,row?.title]
        .map((value:any)=>normalizeKey(value))
        .filter(Boolean);

      const sizeTokens = (value:any) => {
        const raw = String(value || "").toLowerCase();
        const matches = raw.match(/\d+(?:\.\d+)?\s*(?:ml|l|ltr|liter|litre|cm|mm|kg|g|pcs?|pc)\b/g) || [];
        return Array.from(new Set(matches.map((item:string)=>item.replace(/\s+/g,""))));
      };

      const productSizeTokens = sizeTokens([productText,safeProduct.sku,safeProduct.skuCode,safeProduct.value].filter(Boolean).join(" "));
      const hasSizeConflict = (row:any) => {
        if(!productSizeTokens.length) return false;
        const rowSizeTokens = sizeTokens([getRowProductText(row),row?.sku,row?.skuCode,row?.value].filter(Boolean).join(" "));
        if(!rowSizeTokens.length) return false;
        return !productSizeTokens.some((token:string)=>rowSizeTokens.includes(token));
      };

      // 1) Strongest rule: exact SKU Storage row reference.
      if(sourceIds.length){
        const sourceMatch = rows.find((row:any)=>sourceIds.includes(String(row?.id || "").trim()));
        if(sourceMatch) return sourceMatch;
      }

      // 2) Exact SKU must win over product-name fallback.
      if(skuKeys.length){
        const exactSkuMatch = rows.find((row:any)=>getRowSkuKeys(row).some((key:string)=>skuKeys.includes(key)));
        if(exactSkuMatch) return exactSkuMatch;
      }

      if(!productKeys.length) return null;

      const targetBrandKey = normalizeKey(brandText);
      const targetCategoryKey = normalizeKey(categoryText);
      const targetTokens = productTokens(productText).filter((token:string)=>token.length>=2);

      const scored = rows.map((row:any)=>{
        const rowProductText = getRowProductText(row);
        const rowProductKeys = getRowProductKeys(row);
        const rowBrandKey = normalizeKey(brandNameFor(row));
        const rowCategoryKey = normalizeKey(fieldCollection(row));
        const rowTokens = productTokens(rowProductText).filter((token:string)=>token.length>=2);
        const rowSizeTokens = sizeTokens([rowProductText,row?.sku,row?.skuCode,row?.value].filter(Boolean).join(" "));
        const sizeConflict = hasSizeConflict(row);
        let score = 0;

        if(sizeConflict) score -= 120;
        if(productSizeTokens.length && rowSizeTokens.some((token:string)=>productSizeTokens.includes(token))) score += 35;
        if(targetBrandKey && rowBrandKey && targetBrandKey===rowBrandKey) score += 12;
        if(targetCategoryKey && rowCategoryKey && targetCategoryKey===rowCategoryKey) score += 8;

        productKeys.forEach((key:string)=>{
          rowProductKeys.forEach((rowKey:string)=>{
            if(key && rowKey && key===rowKey) score += 100;
            else if(key.length>=8 && rowKey.length>=8 && (rowKey.includes(key) || key.includes(rowKey))) score += 28;
          });
        });

        const matchedTokenCount = targetTokens.filter((token:string)=>rowTokens.includes(token)).length;
        if(targetTokens.length) score += matchedTokenCount * 8;
        if(targetTokens.length && matchedTokenCount===targetTokens.length) score += 20;

        return { row, score };
      }).filter((item:any)=>item.score>0)
        .sort((a:any,b:any)=>b.score-a.score);

      const best = scored[0];
      // Require a reasonably strong match so similar products like 5L and 50L do not borrow each other's image link.
      return best && best.score >= 45 ? best.row : null;
    };

    const getDcProductLinks = (product:any) => {
      // Digital Creative product references must come from the matched SKU Storage row only.
      // Use one primary image/reference link per selected product, with exact SKU matching first.
      const skuRow:any = getSkuStorageRowByProduct(product || {}) || {};
      if(!skuRow || !Object.keys(skuRow).length) return [];

      const normalizeFieldKey = (key:any) => String(key || "").toLowerCase().replace(/[^a-z0-9]+/g,"");
      const extra = skuRow.extraFields && typeof skuRow.extraFields === "object" ? skuRow.extraFields : {};
      const directPriorityValues:any[] = [
        skuRow.imageLink,
        skuRow.imageUrl,
        skuRow.imageURL,
        skuRow.productImageLink,
        skuRow.productImageUrl,
        skuRow.referenceImageLink,
        skuRow.referenceImageUrl,
        skuRow.referenceLink,
        Array.isArray(skuRow.imageLinks) ? skuRow.imageLinks[0] : "",
        Array.isArray(skuRow.productImageLinks) ? skuRow.productImageLinks[0] : "",
        Array.isArray(skuRow.referenceLinks) ? skuRow.referenceLinks[0] : "",
      ];

      const exactExtraKeys = [
        "imagelink",
        "imageurl",
        "image",
        "productimagelink",
        "productimageurl",
        "referenceimagelink",
        "referenceimageurl",
        "referencelink",
      ];

      exactExtraKeys.forEach((wanted:string)=>{
        const foundKey = Object.keys(extra).find((key:string)=>normalizeFieldKey(key)===wanted);
        if(foundKey) directPriorityValues.push(extra[foundKey]);
      });

      // Fallback only to clearly named image/reference URL fields from SKU Storage.
      Object.entries(extra).forEach(([key,value]:any)=>{
        const clean = normalizeFieldKey(key);
        const looksImageField = (clean.includes("image") || clean.includes("reference")) && (clean.includes("link") || clean.includes("url") || clean.includes("image"));
        if(looksImageField) directPriorityValues.push(value);
      });
      Object.entries(skuRow || {}).forEach(([key,value]:any)=>{
        const clean = normalizeFieldKey(key);
        const looksImageField = (clean.includes("image") || clean.includes("reference")) && (clean.includes("link") || clean.includes("url") || clean.includes("image"));
        if(looksImageField) directPriorityValues.push(value);
      });

      const firstLink = directPriorityValues
        .flatMap((source:any)=>Array.isArray(source) ? source : [source])
        .flatMap((source:any)=>extractDcLinks(source))
        .map(normalizeDcUrl)
        .find(Boolean);

      return firstLink ? [firstLink] : [];
    };

    if(tab==="digital" && isCampaignChecklist){
      const campaignCreativeRows = mergeDigitalCreativeRows(
        readMarketingDcBridgeRows(),
        Array.isArray(data.campaignCreativeRows) ? data.campaignCreativeRows : [],
        readMarketingDcTransferRowsBackup("campaign")
      );

      const getCampaignDigitalProductRows = (item:any) => {
        const baseProducts = Array.isArray(item.products) && item.products.length
          ? item.products
          : [{ product:item.product || "", sku:item.sku || "", brand:item.brand || "", collection:item.collection || "" }];
        return baseProducts.map((product:any)=>{
          const skuRow:any = getSkuStorageRowByProduct(product) || {};
          const links = getDcProductLinks(product);
          return {
            platform:item.platform || "All Platforms",
            brand:product.brand || skuRow.brand || item.brand || "",
            category:product.collection || skuRow.collection || skuRow.category || item.collection || "",
            product:product.product || skuRow.productName || item.product || "",
            sku:product.sku || skuRow.sku || item.sku || "",
            headline:item.headline || "",
            subheadline:item.subheadline || "",
            cta:item.cta || "",
            links,
          };
        });
      };
      const copyCampaignDigitalItem = async (item:any) => {
        try { await navigator.clipboard.writeText(formatCampaignDigitalCreativeItem(item)); } catch {}
      };
      const addCampaignDigitalItemToOverview = (item:any) => {
        addToOverview("Digital Creative","Campaign Digital Creative",formatCampaignDigitalCreativeItem(item),item.linkedEventContext || "Campaign Digital Creative", { tab:"digital", type:"campaignDigitalItem", id:item?.id || "" });
      };
      const formatDigitalCreativeCardOverview = (item:any, card:any, cardIndex:number) => [
        `Source: ${item?.title || item?.source || "Marketing Ad Output"}`,
        `Card ${cardIndex+1}`,
        `Media Type: ${card?.mediaType || recommendedCarouselMediaType(cardIndex)}`,
        card?.headline ? `Headline: ${card.headline}` : "",
        card?.copy ? `Copy:\n${card.copy}` : "",
        card?.visual ? `Visual Direction:\n${card.visual}` : "",
        card?.cta ? `CTA: ${card.cta}` : "",
        card?.outputLink ? `Final Link: ${card.outputLink}` : "",
        card?.generatedImageUrl ? `Generated Image: ${card.generatedImageUrl}` : "",
      ].filter(Boolean).join("\n\n");
      const addCampaignDigitalCardToOverview = (item:any, card:any, cardIndex:number) => {
        addToOverview("Digital Creative", `${item?.title || "Marketing Ad Output"} · Card ${cardIndex+1}`, formatDigitalCreativeCardOverview(item,card,cardIndex), card?.outputLink || item?.linkedEventContext || "Digital Creative Card", { tab:"digital", type:"campaignDigitalCard", id:item?.id || "", cardIndex });
        markActionDone(`overview-campaign-dc-card-${item?.id}-${cardIndex}`);
      };
      const deleteCampaignDigitalItem = (id:string) => {
        deleteMarketingDcBridgeRow(id);
        const nextRows = campaignCreativeRows.filter((item:any)=>item.id!==id);
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs.filter((img:any)=>img.sourceRowId!==id && img.cardId!==id) : [];
        writeMarketingDcTransferRowsBackup("campaign",nextRows);
        updateAiWorkspace("digital",{
          campaignCreativeRows:nextRows,
          savedImageOutputs:saved,
          generatedText:nextRows.map((entry:any)=>formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };
      const clearCampaignDigitalItems = () => {
        writeMarketingDcTransferRowsBackup("campaign",[]);
        updateAiWorkspace("digital",{ campaignCreativeRows:[], generatedText:"", generatedAt:"", savedImageOutputs:[], dcImagePrompt:"" });
      };

      const updateCampaignDigitalItem = (id:string, patch:any) => {
        const nextRows = campaignCreativeRows.map((row:any)=>row.id===id ? { ...row, ...patch } : row);
        updateMarketingDcBridgeRow(id,patch);
        writeMarketingDcTransferRowsBackup("campaign",nextRows);
        updateAiWorkspace("digital",{
          campaignCreativeRows:nextRows,
          generatedText:nextRows.map((entry:any)=>formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const saveCampaignDcImageOutput = async (item:any) => {
        if(!item.generatedImageUrl) return;
        const savedAt = new Date().toISOString();
        try {
          const uploaded = await uploadGeneratedImageToDrive({
            url:item.generatedImageUrl,
            prompt:item.generatedImagePrompt || item.imagePrompt || "",
            title:item.title || item.product || "Campaign Digital Creative",
            source:"Campaign Digital Creative",
            cardId:item.id,
            sourceRowId:item.id,
          });
          const driveUrl = uploaded?.url || uploaded?.imageUrl || item.generatedImageUrl;
          const digital = ((group.aiWorkspace || {}).digital || {}) as any;
          const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
          const nextRows = campaignCreativeRows.map((row:any)=>row.id===item.id ? { ...row, savedImageAt:savedAt, savedImageUrl:driveUrl, driveFileId:uploaded?.driveFileId || "" } : row);
          updateAiWorkspace("digital",{
            campaignCreativeRows:nextRows,
            savedImageOutputs:[{
              id:uid(),
              source:"Campaign Digital Creative",
              cardId:item.id,
              sourceRowId:item.id,
              title:item.title || item.product || "Campaign Digital Creative",
              url:driveUrl,
              driveFileId:uploaded?.driveFileId || "",
              prompt:item.generatedImagePrompt || item.imagePrompt || "",
              createdAt:savedAt,
            },...saved.filter((img:any)=>img.cardId!==item.id)].slice(0,60),
          });
          markActionDone(`save-drive-${item.id}`);
        } catch(err:any) {
          updateCampaignDigitalItem(item.id,{ generatedImageError:err?.message || "Failed to save image to Google Drive." });
        }
      };

      const deleteCampaignDcImageOutput = (item:any) => {
        updateCampaignDigitalItem(item.id,{
          generatedImageUrl:"",
          generatedImagePrompt:"",
          generatedImageAt:"",
          generatedImageError:"",
          savedImageAt:"",
          savedImageUrl:"",
          imageLinks:item.imageLinks || [],
        });
      };

      const defaultCampaignDetailedPromptInstructions = "Create a highly executable campaign digital creative prompt for AI image generation. Strictly preserve the product look from the provided product image links. Improve the user's own prompt without changing its core request. Include campaign context, scene, composition, lighting, camera angle, product placement, styling, quality, and negative restrictions. Avoid text overlays unless the user specifically asks for text.";
      const getCampaignDetailedPromptInstructions = () => String(data.campaignDetailedPromptInstructions || data.detailedPromptInstructions || defaultCampaignDetailedPromptInstructions);
      const buildCampaignDetailedPrompt = (item:any) => {
        const productRows = getCampaignDigitalProductRows(item);
        const imageLinks = productRows.flatMap((row:any)=>Array.isArray(row?.links) ? row.links : []).map(normalizeDcUrl).filter(Boolean);
        const ownPrompt = String(item.ownPrompt || "").trim();
        const productLines = productRows.map((row:any,index:number)=>`${index+1}. ${[row.brand,row.category,row.product,row.sku].filter(Boolean).join(" · ")}`).join("\n");
        return [
          "AI CAMPAIGN DIGITAL CREATIVE IMAGE PROMPT",
          "",
          "PRIMARY USER DIRECTION TO FOLLOW:",
          ownPrompt || "Create a premium campaign digital creative image using the selected campaign product/s.",
          "",
          "SAVED DETAILED PROMPT INSTRUCTIONS TO FOLLOW:",
          getCampaignDetailedPromptInstructions(),
          "",
          "CAMPAIGN / AD CONTEXT:",
          item.linkedEventContext ? `Linked campaign/event: ${item.linkedEventContext}` : "Campaign Digital Creative",
          `Platform: ${item.platform || "All Platforms"}`,
          item.headline ? `Headline: ${item.headline}` : "",
          item.subheadline ? `Subheadline: ${item.subheadline}` : "",
          item.cta ? `CTA: ${item.cta}` : "",
          "",
          "FEATURED PRODUCT/S:",
          productLines || [item.brand,item.collection,item.product,item.sku].filter(Boolean).join(" · "),
          "",
          "PRODUCT IMAGE LINKS - REQUIRED VISUAL REFERENCES:",
          imageLinks.length ? imageLinks.map((link:string,index:number)=>`${index+1}. ${link}`).join("\n") : "No product image links were found. Use only the provided product details and any uploaded references.",
          "",
          "FINAL EXECUTION:",
          ownPrompt
            ? `Improve and expand the user direction above while still following it exactly. The final scene must clearly match this request: ${ownPrompt}`
            : "Create a clean, premium product-focused campaign visual based on the selected campaign row.",
          "Use the product image links as the default reference for product accuracy. Preserve exact product color, shape, scale, material, proportions, packaging, logo placement, and visible details. Do not invent a different product.",
          "",
          "SCENE AND COMPOSITION:",
          ownPrompt ? `Build the campaign visual around the user's requested setting/concept: ${ownPrompt}` : "Use a premium campaign ecommerce setup that supports the headline, subheadline, CTA, and campaign context.",
          "Make the product/s the clear hero. Arrange the selected product/s in a balanced composition with enough breathing room for marketplace, ad, or social layout use.",
          "",
          "LIGHTING AND CAMERA:",
          "Use soft natural commercial lighting, crisp focus, realistic shadows, clean highlights, accurate product reflections, and a premium campaign photography look. Use a realistic camera angle that clearly shows the product form and important details.",
          "",
          "QUALITY STYLE:",
          "Hyper-realistic premium ecommerce campaign product photography, sharp, clean, high-resolution, natural colors, accurate materials, modern layout, polished but not overly artificial.",
          "",
          "NEGATIVE RESTRICTIONS:",
          "No wrong product shape, no color changes, no invented accessories, no extra labels, no text overlay, no watermark, no distorted handles, no incorrect size relationship, no messy clutter, no unrealistic reflections, no people unless the user's own prompt asks for people."
        ].filter(Boolean).join("\n");
      };
      const generateCampaignDetailedPrompt = (item:any) => {
        const prompt = buildCampaignDetailedPrompt(item);
        updateCampaignDigitalItem(item.id,{ imagePrompt:prompt, generatedDetailedPromptAt:new Date().toISOString() });
        markActionDone(`campaign-detailed-prompt-${item.id}`);
      };
      const saveCampaignDigitalPromptOutput = (item:any) => {
        const text = String(item.imagePrompt || "").trim();
        if(!text) return;
        const savedAt = new Date().toISOString();
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        const savedEntry = {
          id:uid(),
          source:"Campaign Digital Creative",
          cardId:`prompt-${item.id}`,
          sourceRowId:item.id,
          title:`${item.title || item.product || "Campaign Digital Creative"} · Detailed Prompt`,
          url:item.generatedImageUrl || "",
          prompt:text,
          ownPrompt:item.ownPrompt || "",
          kind:"Detailed Prompt",
          createdAt:savedAt,
        };
        updateAiWorkspace("digital",{
          savedImageOutputs:[savedEntry,...saved.filter((img:any)=>img.cardId!==`prompt-${item.id}`)].slice(0,60),
        });
        markActionDone(`campaign-save-prompt-${item.id}`);
      };

      const generateCampaignDcImage = async (item:any) => {
        const productRows = getCampaignDigitalProductRows(item);
        const imageLinks = productRows.flatMap((row:any)=>Array.isArray(row?.links) ? row.links : []).map(normalizeDcUrl).filter(Boolean);
        const uploadedReferenceImages = Array.isArray(item.referenceImages) ? item.referenceImages : [];
        const prompt = [
          "Create a premium ecommerce campaign image based on this campaign row.",
          "STRICT PRODUCT REFERENCE RULE: Read and follow the provided product image links and uploaded reference images. Preserve product shape, color, material, proportions, packaging, and visible design details. Do not redesign, recolor, replace, or invent a different product.",
          item.imagePrompt ? `User image prompt instruction:\n${item.imagePrompt}` : "",
          `Platform: ${item.platform || "All Platforms"}`,
          `Brand: ${item.brand || ""}`,
          `Category: ${item.collection || ""}`,
          `Product: ${item.product || ""}`,
          item.headline ? `Headline: ${item.headline}` : "",
          item.subheadline ? `Subheadline: ${item.subheadline}` : "",
          item.cta ? `CTA: ${item.cta}` : "",
          item.linkedEventContext ? `Linked event/campaign context: ${item.linkedEventContext}` : "",
          imageLinks.length ? `Use these product image/reference links as visual references:\n${imageLinks.join("\n")}` : "",
          "Keep the product accurate. Do not invent product details. Clean premium ecommerce layout.",
        ].filter(Boolean).join("\n");

        setCampaignDcGeneratingImageId(item.id);
        try {
          const res = await fetch("/api/ai/generate-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({
              prompt,
              size:"2K",
              aspectRatio:item.imageRatio || "1:1",
              watermark:false,
              referenceImages:uploadedReferenceImages,
              referenceImageUrls:imageLinks,
              productImageLinks:imageLinks,
              requireProductImageLinks:true,
              outputCount:1,
              optimizeForSite:true,
              avoidBase64:true,
              maxOutputBytes:900000,
            }),
          });
          const raw = await res.text();
          let result:any = {};
          try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
          if(!res.ok) throw new Error(result?.error || result?.message || "Image generation failed.");
          const url = result?.url || result?.imageUrl || result?.image_url || result?.data?.[0]?.url || result?.data?.[0]?.image_url || "";
          if(/^data:image\//i.test(url)) throw new Error("Generated image was returned as base64. EMDC blocks base64 images to keep the site lightweight. Please generate again using URL output.");
          const nextRows = campaignCreativeRows.map((row:any)=>row.id===item.id ? { ...row, generatedImageUrl:url, generatedImagePrompt:prompt, imagePrompt:item.imagePrompt || "", imageLinks, referenceImages:uploadedReferenceImages, generatedImageAt:new Date().toISOString(), generatedImageError:"" } : row);
          updateAiWorkspace("digital",{
            campaignCreativeRows:nextRows,
            generatedText:nextRows.map((entry:any)=>formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"),
            generatedAt:new Date().toISOString(),
          });
        } catch (err:any) {
          const nextRows = campaignCreativeRows.map((row:any)=>row.id===item.id ? { ...row, generatedImageError:err?.message || "Image generation failed.", generatedImagePrompt:prompt, imagePrompt:item.imagePrompt || "", imageLinks, referenceImages:uploadedReferenceImages } : row);
          updateAiWorkspace("digital",{ campaignCreativeRows:nextRows });
        } finally {
          setCampaignDcGeneratingImageId("");
        }
      };


      const updateCampaignDigitalCarouselCard = (itemId:string, cardIndex:number, patch:any) => {
        const nextRows = campaignCreativeRows.map((row:any)=>{
          if(row.id!==itemId) return row;
          const carouselCards = (Array.isArray(row.carouselCards) ? row.carouselCards : []).map((card:any,index:number)=>index===cardIndex ? { ...card, ...patch } : card);
          return { ...row, carouselCards };
        });
        const patchedRow = nextRows.find((row:any)=>row.id===itemId);
        if(patchedRow) updateMarketingDcBridgeRow(itemId,patchedRow);
        writeMarketingDcTransferRowsBackup("campaign",nextRows);
        updateAiWorkspace("digital",{
          campaignCreativeRows:nextRows,
          generatedText:nextRows.map((entry:any)=>formatCampaignDigitalCreativeItem(entry)).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const deleteCampaignDcCarouselImageOutput = (item:any, cardIndex:number) => {
        updateCampaignDigitalCarouselCard(item.id,cardIndex,{ generatedImageUrl:"", generatedImagePrompt:"", generatedImageAt:"", generatedImageError:"" });
      };

      const saveCampaignDcCarouselImageOutput = async (item:any, card:any, cardIndex:number) => {
        if(!card?.generatedImageUrl) return;
        const savedAt = new Date().toISOString();
        const cardId = `${item.id}-carousel-${cardIndex}`;
        try {
          const uploaded = await uploadGeneratedImageToDrive({
            url:card.generatedImageUrl,
            prompt:card.generatedImagePrompt || card.visual || item.imagePrompt || "",
            title:`${item.title || item.product || "Carousel"} · Card ${cardIndex+1}`,
            source:"Campaign Digital Creative",
            cardId,
            sourceRowId:item.id,
          });
          const driveUrl = uploaded?.url || uploaded?.imageUrl || card.generatedImageUrl;
          const digital = ((group.aiWorkspace || {}).digital || {}) as any;
          const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
          updateCampaignDigitalCarouselCard(item.id,cardIndex,{ savedImageAt:savedAt, savedImageUrl:driveUrl, driveFileId:uploaded?.driveFileId || "" });
          updateAiWorkspace("digital",{
            savedImageOutputs:[{
              id:uid(),
              source:"Campaign Digital Creative",
              cardId,
              sourceRowId:item.id,
              title:`${item.title || item.product || "Carousel"} · Card ${cardIndex+1}`,
              url:driveUrl,
              driveFileId:uploaded?.driveFileId || "",
              prompt:card.generatedImagePrompt || card.visual || item.imagePrompt || "",
              createdAt:savedAt,
            },...saved.filter((img:any)=>img.cardId!==cardId)].slice(0,60),
          });
          markActionDone(`save-drive-${cardId}`);
        } catch(err:any) {
          updateCampaignDigitalCarouselCard(item.id,cardIndex,{ generatedImageError:err?.message || "Failed to save image to Google Drive." });
        }
      };


      const normalizeCarouselMatchText = (value:any) => String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g," ")
        .trim();

      const normalizeCarouselProductRefRows = (products:any[]=[], fallbackLinks:any[]=[]) => {
        const rows = Array.isArray(products) ? products.filter(Boolean) : [];
        return rows.map((row:any,index:number)=>{
          const rowLinks = Array.isArray(row?.links) ? row.links : (row?.link ? [row.link] : getDcProductLinks(row));
          return {
            id:row?.id || `ref-${index}-${uid()}`,
            brand:row?.brand || "",
            product:row?.product || row?.productName || row?.name || "",
            sku:row?.sku || row?.skuCode || "",
            links:(rowLinks && rowLinks.length ? rowLinks : (index===0 ? fallbackLinks : [])).filter(Boolean),
          };
        });
      };

      const getCarouselCardProductReferences = (card:any, cardIndex:number, productRows:any[]=[]) => {
        const savedRefs = Array.isArray(card?.productRefs) ? card.productRefs.filter((ref:any)=>!ref?._removed) : [];
        if(savedRefs.length) return normalizeCarouselProductRefRows(savedRefs);
        const rows = Array.isArray(productRows) ? productRows.filter(Boolean) : [];
        if(!rows.length) return [];

        const cardText = normalizeCarouselMatchText([card?.headline,card?.copy,card?.visual,card?.cta].filter(Boolean).join(" "));
        const matched = rows.filter((row:any)=>{
          const product = normalizeCarouselMatchText(row?.product || row?.productName || row?.name || "");
          const sku = normalizeCarouselMatchText(row?.sku || "");
          const brand = normalizeCarouselMatchText(row?.brand || "");
          const collection = normalizeCarouselMatchText(row?.collection || row?.category || "");
          const productWords = product.split(" ").filter((word:string)=>word.length>=4);
          const hasSku = !!sku && cardText.includes(sku);
          const hasProductPhrase = !!product && cardText.includes(product);
          const hasProductWords = productWords.length ? productWords.some((word:string)=>cardText.includes(word)) : false;
          const hasBrandCollection = (!!brand && cardText.includes(brand)) || (!!collection && cardText.includes(collection));
          return hasSku || hasProductPhrase || hasProductWords || hasBrandCollection;
        });

        const chosen = matched.length ? matched : (rows.length===1 ? rows : rows);
        return normalizeCarouselProductRefRows(chosen);
      };

      const getCarouselCardReferenceLinks = (cardProducts:any[]=[], item:any={}) => Array.from(new Set([
        ...((Array.isArray(cardProducts) ? cardProducts : []).flatMap((row:any)=>Array.isArray(row?.links) ? row.links : (row?.link ? [row.link] : getDcProductLinks(row)))),
        // Item-level imageLinks are intentionally excluded here; keep one SKU Storage link per product only.
      ])).map(normalizeDcUrl).filter(Boolean);

      const updateCampaignDigitalCarouselProductRefs = (itemId:string, cardIndex:number, nextRefs:any[]) => {
        updateCampaignDigitalCarouselCard(itemId,cardIndex,{ productRefs:normalizeCarouselProductRefRows(nextRefs) });
      };

      const renderCarouselCardProductReferences = (cardProducts:any[]=[], links:any[]=[], opts:any={}) => {
        const products = normalizeCarouselProductRefRows(cardProducts,links);
        const safeLinks = Array.isArray(links) ? links.filter(Boolean) : [];
        const onChangeRefs = opts?.onChangeRefs;
        const canEdit = typeof onChangeRefs === "function";
        const editingProducts = !!opts?.editingProducts && canEdit;
        const onToggleEdit = typeof opts?.onToggleEdit === "function" ? opts.onToggleEdit : null;
        const onDoneEdit = typeof opts?.onDoneEdit === "function" ? opts.onDoneEdit : onToggleEdit;
        const updateRef = (idx:number, patch:any) => onChangeRefs(products.map((row:any,index:number)=>index===idx ? { ...row, ...patch } : row));
        const removeRef = (idx:number) => onChangeRefs(products.filter((_:any,index:number)=>index!==idx));
        const addRef = () => onChangeRefs([...products,{ id:uid(), brand:"", product:"", sku:"", links:[] }]);
        return (
          <div style={{ padding:8,borderRadius:8,background:"#F9FAFB",border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:6,alignItems:"center",marginBottom:6 }}>
              <p style={{ margin:0,fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Featured Product / SKU References</p>
              <div style={{ display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                {canEdit&&<button type="button" onClick={editingProducts ? (onDoneEdit || undefined) : (onToggleEdit || undefined)} style={{ border:`1px solid ${C.border}`,background:editingProducts?C.accent:C.surface,borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:900,color:editingProducts?"#fff":C.textSub,cursor:"pointer" }}>{editingProducts?"Done":"Edit Products"}</button>}
                {editingProducts&&<button type="button" onClick={addRef} style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:900,color:C.textSub,cursor:"pointer" }}>+ Add</button>}
              </div>
            </div>
            {products.length ? products.slice(0,6).map((row:any,idx:number)=>{
              const rowLinks = Array.isArray(row?.links) ? row.links : [];
              return (
                <div key={`${row?.id || row?.sku || row?.product || "product"}-${idx}`} style={{ marginTop:idx?7:0,paddingTop:idx?7:0,borderTop:idx?`1px solid ${C.border}`:"none",fontSize:10.5,color:C.textSub,lineHeight:1.35 }}>
                  {editingProducts ? (
                    <div style={{ display:"grid",gap:5 }}>
                      <input value={row?.product || ""} placeholder="Product name" onChange={e=>updateRef(idx,{ product:e.target.value })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,fontWeight:800,color:C.text,background:C.surface }} />
                      <input value={row?.sku || ""} placeholder="SKU" onChange={e=>updateRef(idx,{ sku:e.target.value })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,fontFamily:"monospace",color:C.textSub,background:C.surface }} />
                      <input value={rowLinks.join(", ")} placeholder="Product image link/s" onChange={e=>updateRef(idx,{ links:String(e.target.value).split(/[\n,]+/).map((v:string)=>v.trim()).filter(Boolean) })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,color:C.textSub,background:C.surface }} />
                      <button type="button" onClick={()=>removeRef(idx)} style={{ justifySelf:"end",border:`1px solid #FECACA`,background:"#FEF2F2",color:"#DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:900,cursor:"pointer" }}>Remove Product</button>
                    </div>
                  ) : (
                    <>
                      <strong style={{ color:C.text }}>{[row?.brand,row?.product || row?.productName || row?.name].filter(Boolean).join(" · ") || "Selected Product"}</strong>
                      {row?.sku&&<span style={{ display:"block",fontFamily:"monospace",color:C.muted }}>SKU: {row.sku}</span>}
                      {rowLinks.length>0&&<span style={{ display:"block",marginTop:2,color:C.faint,wordBreak:"break-all" }}>{rowLinks.length} product image link{rowLinks.length!==1?"s":""} attached</span>}
                    </>
                  )}
                </div>
              );
            }) : <p style={{ margin:0,fontSize:10.5,color:C.faint }}>No matched product details yet. Click Edit Products to add product image links before generating.</p>}
            {!editingProducts&&safeLinks.length>0&&(
              <div style={{ marginTop:6,display:"flex",gap:5,flexWrap:"wrap" }}>
                {safeLinks.slice(0,5).map((link:any,idx:number)=>(
                  <a key={`${link}-${idx}`} href={link} target="_blank" rel="noreferrer" style={{ fontSize:10,fontWeight:800,color:C.accent,textDecoration:"none",background:C.surface,border:`1px solid ${C.border}`,borderRadius:999,padding:"2px 6px" }}>Product Link {idx+1}</a>
                ))}
                {safeLinks.length>5&&<span style={{ fontSize:10,color:C.muted,fontWeight:800 }}>+{safeLinks.length-5} more</span>}
              </div>
            )}
          </div>
        );
      };

      const generateCampaignDcCarouselImage = async (item:any, card:any, cardIndex:number) => {
        const productRows = getCampaignDigitalProductRows(item);
        const cardProductRows = getCarouselCardProductReferences(card,cardIndex,productRows);
        const imageLinks = getCarouselCardReferenceLinks(cardProductRows,item);
        const uploadedReferenceImages = Array.isArray(item.referenceImages) ? item.referenceImages : [];
        if(!imageLinks.length){
          updateCampaignDigitalCarouselCard(item.id,cardIndex,{ generatedImageError:"Add at least one product image link in Edit Products before generating. AI image generation is locked to product image links.", generatedImagePrompt:"", imageLinks:[], referenceImages:uploadedReferenceImages });
          return;
        }
        const mediaType = card?.mediaType || recommendedCarouselMediaType(cardIndex);
        const prompt = [
          `Create one ${mediaType} creative frame for Carousel Card ${cardIndex+1}.`,
          "STRICT PRODUCT IMAGE LINK RULE: The product image links for THIS carousel card are the default and required visual references. Read those links first and copy the product look from them. Do not invent, redesign, recolor, replace, or approximate the product. Preserve exact shape, silhouette, material, color, proportions, packaging, labels, logo placement, and visible details.",
          card?.headline ? `Card headline: ${card.headline}` : "",
          card?.copy ? `Card copy: ${card.copy}` : "",
          card?.visual ? `Card image/video direction:\n${card.visual}` : "",
          card?.cta ? `CTA: ${card.cta}` : "",
          item.imagePrompt ? `Overall ad context:\n${item.imagePrompt}` : "",
          `Platform: ${item.platform || "All Platforms"}`,
          cardProductRows.length ? `Featured product/s for this carousel card:\n${cardProductRows.map((row:any)=>[row.brand,row.product || row.productName || row.name,row.sku].filter(Boolean).join(" · ")).filter(Boolean).join("\n")}` : "",
          imageLinks.length ? `Use these product image/reference links for this carousel card:\n${imageLinks.join("\n")}` : "",
          "Generate the creative only. Keep the featured product accurate. Clean premium ecommerce layout.",
        ].filter(Boolean).join("\n");

        const generatingKey = `${item.id}-carousel-${cardIndex}`;
        setCampaignDcGeneratingImageId(generatingKey);
        try {
          const res = await fetch("/api/ai/generate-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({
              prompt,
              size:"2K",
              aspectRatio:item.imageRatio || "1:1",
              watermark:false,
              referenceImages:uploadedReferenceImages,
              referenceImageUrls:imageLinks,
              productImageLinks:imageLinks,
              requireProductImageLinks:true,
              outputCount:1,
              optimizeForSite:true,
              avoidBase64:true,
              maxOutputBytes:900000,
            }),
          });
          const raw = await res.text();
          let result:any = {};
          try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
          if(!res.ok) throw new Error(result?.error || result?.message || "Image generation failed.");
          const url = result?.url || result?.imageUrl || result?.image_url || result?.data?.[0]?.url || result?.data?.[0]?.image_url || "";
          if(/^data:image\//i.test(url)) throw new Error("Generated image was returned as base64. EMDC blocks base64 images to keep the site lightweight. Please generate again using URL output.");
          updateCampaignDigitalCarouselCard(item.id,cardIndex,{ generatedImageUrl:url, generatedImagePrompt:prompt, imageLinks, referenceImages:uploadedReferenceImages, generatedImageAt:new Date().toISOString(), generatedImageError:"" });
        } catch (err:any) {
          updateCampaignDigitalCarouselCard(item.id,cardIndex,{ generatedImageError:err?.message || "Image generation failed.", generatedImagePrompt:prompt, imageLinks, referenceImages:uploadedReferenceImages });
        } finally {
          setCampaignDcGeneratingImageId("");
        }
      };

      return (
        <div style={{ display:"flex",flexDirection:"column",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
          <div style={{ padding:isMobile?12:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
              <div>
                <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Campaign Digital Creative</h3>
                <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:820 }}>Each card has the campaign row details, product image links from SKU Storage, and an AI image placeholder.</p>
              </div>
              <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{campaignCreativeRows.length} sent</span>
                {campaignCreativeRows.length>0&&<Btn xs variant="danger" onClick={clearCampaignDigitalItems}>Clear DC</Btn>}
              </div>
            </div>
          </div>

          {!!formatMainPromotion(((group.aiWorkspace || {}).digital || {}).mainPromotion)&&(
            renderMainPromotionCard(((group.aiWorkspace || {}).digital || {}).mainPromotion, true)
          )}

          {campaignCreativeRows.length===0 ? (
            <div style={{ minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:18 }}>
              <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>No campaign product row sent yet. Go to Campaign E-commerce and click Send to DC beside a generated row.</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {campaignCreativeRows.map((item:any)=>{
                const productRows = getCampaignDigitalProductRows(item);
                const carouselCards = Array.isArray(item.carouselCards) ? item.carouselCards : [];
                const gmvRows = Array.isArray(item.gmvRows) ? item.gmvRows : [];
                const isProductGmvDcOutput = !!item.isProductGmvMaxTable && gmvRows.length>0;
                const isCarouselDcOutput = !!item.isCarousel && carouselCards.length>0;
                if (isProductGmvDcOutput) {
                  const safeTitle = item.title || item.product || "Product GMV Max Ads";
                  const safeContext = item.linkedEventContext || group.groupName || "Marketing";
                  return (
                    <div key={item.id} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                      <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                        <div style={{ minWidth:0,flex:"1 1 360px" }}>
                          <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35 }}>{safeTitle}</p>
                          <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{safeContext}</p>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"auto",gap:6,width:isMobile?"100%":"auto" }}>
                          <Btn xs variant="danger" onClick={()=>deleteProductIntroDigitalItem(item.id)}>Delete</Btn>
                        </div>
                      </div>
                      <div style={{ padding:isMobile?10:12,display:"flex",flexDirection:"column",gap:10 }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <div>
                            <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Product GMV Max Ads Table</span>
                            <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>Same table format from Marketing. Each content pillar has its own AI image placeholder and Generate Image button.</span>
                          </div>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{gmvRows.length} pillar{gmvRows.length!==1?"s":""}</span>
                        </div>
                        <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                          <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
                            <table style={{ width:"100%",minWidth:1180,borderCollapse:"collapse",fontSize:12,color:C.textSub }}>
                              <thead>
                                <tr style={{ background:C.surfaceAlt }}>
                                  {["Content Pillar","AI Image Placeholder","Featured Product/s","Creative Direction","Caption Copy","Actions"].map((label:string)=>(
                                    <th key={label} style={{ padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {gmvRows.map((row:any,rowIndex:number)=>{
                                  const generatingKey = `${item.id}-gmv-${rowIndex}`;
                                  const rowProducts = Array.isArray(row?.products) && row.products.length ? row.products : cardProducts;
                                  return (
                                    <tr key={row?.id || `${item.id}-gmv-row-${rowIndex}`} style={{ background:rowIndex%2?C.surface:C.bg }}>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:150 }}>
                                        <p style={{ margin:"0 0 5px",fontSize:12,fontWeight:950,color:C.text }}>{row?.pillar || `Pillar ${rowIndex+1}`}</p>
                                        {row?.contentTheme&&<p style={{ margin:0,fontSize:11,color:C.muted,lineHeight:1.35 }}>{row.contentTheme}</p>}
                                      </td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:190 }}>
                                        <div style={{ minHeight:112,background:"#EFF6FF",border:`1px solid ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:10 }}>
                                          {row?.generatedImageUrl ? (
                                            <img src={row.generatedImageUrl} alt={`Generated GMV pillar ${rowIndex+1}`} onClick={()=>setCampaignDcPreview({ id:`${item.id}-gmv-${rowIndex}`, url:row.generatedImageUrl, prompt:row.generatedImagePrompt || row.creativeDirection || "", title:`${safeTitle} · ${row?.pillar || `Pillar ${rowIndex+1}`}` })} style={{ maxWidth:"100%",maxHeight:140,borderRadius:8,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in",background:C.surface }} />
                                          ) : (
                                            <div style={{ color:C.textSub,fontSize:11,fontWeight:800,lineHeight:1.35 }}>
                                              <p style={{ margin:"0 0 3px",fontSize:12,fontWeight:900,color:C.text }}>Image Placeholder</p>
                                              <p style={{ margin:0,fontSize:10.5,color:C.muted }}>Creative visual goes here</p>
                                              {row?.generatedImageError&&<p style={{ margin:"7px 0 0",color:"#DC2626",fontWeight:800 }}>{row.generatedImageError}</p>}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:230 }}>
                                        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                                          {rowProducts.map((product:any,productIndex:number)=>(
                                            <div key={`${product?.sku || product?.product || "gmv-product"}-${productIndex}`} style={{ padding:8,border:`1px solid ${C.border}`,borderRadius:8,background:C.surface }}>
                                              <p style={{ margin:"0 0 2px",fontSize:11,fontWeight:900,color:C.text }}>{product?.product || product?.productName || "Product"}</p>
                                              <p style={{ margin:0,fontSize:10.5,color:C.muted }}>SKU: {product?.sku || product?.skuCode || ""}</p>
                                              {getDcProductLinks(product).slice(0,3).map((link:string,linkIdx:number)=>(
                                                <a key={`${link}-${linkIdx}`} href={normalizeDcUrl(link)} target="_blank" rel="noreferrer" style={{ display:"inline-block",marginTop:4,marginRight:4,padding:"2px 6px",borderRadius:999,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:10,fontWeight:850,textDecoration:"none" }}>Product Link {linkIdx+1}</a>
                                              ))}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:320,lineHeight:1.45 }}>{row?.creativeDirection || ""}</td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:260,lineHeight:1.45 }}>{row?.captionCopy || ""}</td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,verticalAlign:"top",minWidth:150 }}>
                                        <div style={{ display:"grid",gap:6 }}>
                                          <Btn xs onClick={()=>generateProductIntroDcGmvImage(item,row,rowIndex)} disabled={campaignDcGeneratingImageId===generatingKey}>{campaignDcGeneratingImageId===generatingKey?"Generating...":"Generate Image"}</Btn>
                                          {row?.generatedImageUrl&&<Btn xs variant={row?.savedImageAt ? "primary" : "outline"} onClick={()=>saveProductIntroDcGmvImageOutput(item,row,rowIndex)}>{row?.savedImageAt ? "Saved ✓" : "Save"}</Btn>}
                                          {row?.generatedImageUrl&&<Btn xs variant="danger" onClick={()=>deleteProductIntroDcGmvImageOutput(item,rowIndex)}>Delete Image</Btn>}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (isCarouselDcOutput) {
                  const safeTitle = item.title || "Carousel Ad";
                  const safeContext = item.linkedEventContext || "Marketing";
                  return (
                    <div key={item.id} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                      <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                        <div style={{ minWidth:0,flex:"1 1 360px" }}>
                          <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35 }}>{safeTitle}</p>
                          <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{safeContext}</p>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr 1fr":"auto auto auto",gap:6,width:isMobile?"100%":"auto" }}>
                          <Btn xs variant="outline" onClick={()=>copyCampaignDigitalItem(item)}>Copy</Btn>
                          <Btn xs variant={actionDone(`overview-digital-campaign-${item.id}`)?"primary":"outline"} onClick={()=>{ addCampaignDigitalItemToOverview(item); markActionDone(`overview-digital-campaign-${item.id}`); }}>{actionDone(`overview-digital-campaign-${item.id}`)?"✓ Added":"Add to Overview"}</Btn>
                          <Btn xs variant="danger" onClick={()=>deleteCampaignDigitalItem(item.id)}>Delete</Btn>
                        </div>
                      </div>

                      <div style={{ padding:isMobile?10:12,display:"flex",flexDirection:"column",gap:10 }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <div>
                            <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Carousel Card Output</span>
                            <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>Same carousel card layout from Marketing. Each placeholder has its own Generate Image button.</span>
                          </div>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{carouselCards.length} card{carouselCards.length!==1?"s":""}</span>
                        </div>

                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(230px,1fr))",gap:10 }}>
                          {carouselCards.map((card:any,cardIndex:number)=>{
                            const generatingKey = `${item.id}-carousel-${cardIndex}`;
                            const mediaType = card?.mediaType || recommendedCarouselMediaType(cardIndex);
                            const normalizedMediaType = String(mediaType || "image").toLowerCase().includes("video") ? "video" : "image";
                            const tint = normalizedMediaType === "video" ? "#FEF2F2" : "#EFF6FF";
                            const accentColor = normalizedMediaType === "video" ? "#EF4444" : "#111827";
                            const cardProductRows = getCarouselCardProductReferences(card,cardIndex,productRows);
                            const cardReferenceLinks = getCarouselCardReferenceLinks(cardProductRows,item);
                            return (
                              <div key={card?.id || `dc-carousel-card-${cardIndex}`} style={{ border:`1px solid ${C.borderStrong}`,borderRadius:12,background:C.bg,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
                                <div style={{ minHeight:118,background:tint,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:12,position:"relative" }}>
                                  <span style={{ position:"absolute",top:9,left:10,padding:"3px 8px",borderRadius:999,background:C.surface,border:`1px solid ${normalizedMediaType==="video"?"#FECACA":C.border}`,fontSize:10,fontWeight:900,color:accentColor }}>Card {cardIndex+1}</span>
                                  {card?.generatedImageUrl ? (
                                    <img
                                      src={card.generatedImageUrl}
                                      alt={`Generated carousel card ${cardIndex+1}`}
                                      onClick={()=>setCampaignDcPreview({ id:`${item.id}-carousel-${cardIndex}`, url:card.generatedImageUrl, prompt:card.generatedImagePrompt || card.visual || "", title:`${safeTitle} · Card ${cardIndex+1}` })}
                                      style={{ maxWidth:"100%",maxHeight:160,borderRadius:9,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in",background:C.surface }}
                                    />
                                  ) : (
                                    <div style={{ color:C.textSub,fontSize:11,fontWeight:800,lineHeight:1.35 }}>
                                      <p style={{ margin:"0 0 3px",fontSize:12,fontWeight:900,color:accentColor }}>{normalizedMediaType==="video"?"Video Placeholder":"Image Placeholder"}</p>
                                      <p style={{ margin:0,fontSize:10.5,color:C.muted }}>Creative visual goes here</p>
                                      {card?.generatedImageError&&<p style={{ margin:"7px 0 0",color:"#DC2626",fontWeight:800 }}>{card.generatedImageError}</p>}
                                    </div>
                                  )}
                                </div>

                                <div style={{ padding:10,display:"grid",gap:8,fontSize:11.5,lineHeight:1.45,color:C.textSub,flex:1 }}>
                                  {renderCarouselCardProductReferences(cardProductRows,cardReferenceLinks,{ editingProducts:!!dcProductRefEditKeys[`campaign-${item.id}-${cardIndex}`], onToggleEdit:()=>toggleDcProductRefEdit(`campaign-${item.id}-${cardIndex}`), onDoneEdit:()=>closeDcProductRefEdit(`campaign-${item.id}-${cardIndex}`), onChangeRefs:(nextRefs:any)=>updateCampaignDigitalCarouselProductRefs(item.id,cardIndex,nextRefs) })}
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Headline</p>
                                    <p style={{ margin:0,fontSize:12.5,fontWeight:900,color:C.text }}>{card?.headline || ""}</p>
                                  </div>
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Copy</p>
                                    <p style={{ margin:0 }}>{card?.copy || ""}</p>
                                  </div>
                                  <div style={{ padding:8,borderRadius:8,background:C.surface,border:`1px solid ${C.border}` }}>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>{normalizedMediaType==="video"?"Video Direction":"Image Direction"}</p>
                                    <p style={{ margin:0 }}>{card?.visual || ""}</p>
                                  </div>
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>CTA</p>
                                    <p style={{ margin:0,fontWeight:900,color:C.text }}>CTA: {card?.cta || "Shop Now"}</p>
                                  </div>
                                  <div style={{ display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap",paddingTop:2,marginTop:"auto" }}>
                                    <Btn xs onClick={()=>generateCampaignDcCarouselImage(item,card,cardIndex)} disabled={campaignDcGeneratingImageId===generatingKey}>{campaignDcGeneratingImageId===generatingKey?"Generating...":"Generate Image"}</Btn>
                                    {card?.generatedImageUrl&&<Btn xs variant="outline" onClick={()=>saveCampaignDcCarouselImageOutput(item,card,cardIndex)}>Save</Btn>}
                                    {card?.generatedImageUrl&&<Btn xs variant="danger" onClick={()=>deleteCampaignDcCarouselImageOutput(item,cardIndex)}>Delete Image</Btn>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                const allLinks = productRows.flatMap((row:any)=>Array.isArray(row?.links) ? row.links.slice(0,1) : []).filter(Boolean);
                const mergeCopyCells = productRows.length>1 && productRows.every((row:any)=>String(row.headline||"")===String(productRows[0]?.headline||"") && String(row.subheadline||"")===String(productRows[0]?.subheadline||"") && String(row.cta||"")===String(productRows[0]?.cta||""));
                return (
                <div key={item.id} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                  <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                    <div style={{ minWidth:0,flex:"1 1 360px" }}>
                      <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35 }}>{item.title || "Campaign Product Row"}</p>
                      <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{item.linkedEventContext || "Campaign context"}</p>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr 1fr":"auto auto auto",gap:6,width:isMobile?"100%":"auto" }}>
                      <Btn xs variant="outline" onClick={()=>copyCampaignDigitalItem(item)}>Copy</Btn>
                      <Btn xs variant={actionDone(`overview-digital-campaign-${item.id}`)?"primary":"outline"} onClick={()=>{ addCampaignDigitalItemToOverview(item); markActionDone(`overview-digital-campaign-${item.id}`); }}>{actionDone(`overview-digital-campaign-${item.id}`)?"✓ Added":"Add to Overview"}</Btn>
                      <Btn xs variant="danger" onClick={()=>deleteCampaignDigitalItem(item.id)}>Delete</Btn>
                    </div>
                  </div>

                  <div style={{ padding:isMobile?10:12,display:"grid",gridTemplateColumns:isCarouselDcOutput ? "1fr" : (isMobile?"1fr":"minmax(0,1.35fr) minmax(260px,.65fr)"),gap:12 }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:10,minWidth:0 }}>
                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",maxHeight:isMobile?260:340 }}>
                          <table style={{ width:"100%",minWidth:1180,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                            <thead>
                              <tr style={{ background:C.surfaceAlt }}>
                                {["Platform","Brand","Category","Product","SKU","Headline","Subheadline","CTA"].map((label:string)=>(
                                  <th key={label} style={{ position:"sticky",top:0,zIndex:1,background:C.surfaceAlt,padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {productRows.map((row:any,idx:number)=>(
                                <tr key={`${row.sku || row.product || "product"}-${idx}`} style={{ background:idx%2?C.surface:C.bg }}>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap",fontWeight:750 }}>{row.platform || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.brand || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.category || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:220 }}>{row.product || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap",fontWeight:750 }}>{row.sku || ""}</td>
                                  {mergeCopyCells ? (
                                    idx===0&&<>
                                      <td rowSpan={productRows.length} style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"middle",textAlign:"center",minWidth:190 }}>{row.headline || ""}</td>
                                      <td rowSpan={productRows.length} style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"middle",textAlign:"center",minWidth:260 }}>{row.subheadline || ""}</td>
                                      <td rowSpan={productRows.length} style={{ padding:10,borderBottom:`1px solid ${C.border}`,verticalAlign:"middle",textAlign:"center",minWidth:150,fontWeight:850,color:C.text }}>{row.cta || ""}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:190 }}>{row.headline || ""}</td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:260 }}>{row.subheadline || ""}</td>
                                      <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,verticalAlign:"top",minWidth:150,fontWeight:850,color:C.text }}>{row.cta || ""}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Product Image Links</span>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{allLinks.length} link{allLinks.length!==1?"s":""}</span>
                        </div>
                        <div style={{ maxHeight:170,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:10,display:"flex",flexDirection:"column",gap:8 }}>
                          {productRows.map((row:any,idx:number)=>(
                            <div key={`${row.sku || row.product || "links"}-${idx}`} style={{ padding:9,border:`1px solid ${C.border}`,borderRadius:9,background:C.surface }}>
                              <p style={{ margin:"0 0 5px",fontSize:11,fontWeight:900,color:C.text }}>{row.product || row.sku || `Product ${idx+1}`}</p>
                              {row.links.length ? (
                                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                                  {row.links.map((link:string,linkIdx:number)=>(
                                    <a key={`${link}-${linkIdx}`} href={normalizeDcUrl(link)} target="_blank" rel="noreferrer" style={{ fontSize:11,color:C.accent,fontWeight:750,textDecoration:"underline",textUnderlineOffset:2,wordBreak:"break-all" }}>{link}</a>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ margin:0,fontSize:11,color:C.faint }}>No image/reference link found in SKU Storage for this product.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>AI Detailed Prompt</span>
                          <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                            <Btn xs variant="outline" onClick={()=>updateAiWorkspace("digital",{ campaignDetailedPromptInstructionsEditing:!data.campaignDetailedPromptInstructionsEditing })}>{data.campaignDetailedPromptInstructionsEditing ? "Hide Instructions" : "Edit Instructions"}</Btn>
                            <Btn xs variant={actionDone(`campaign-detailed-prompt-${item.id}`)?"primary":"outline"} onClick={()=>generateCampaignDetailedPrompt(item)}>{actionDone(`campaign-detailed-prompt-${item.id}`)?"✓ Prompt Generated":"Generate Detailed Prompt"}</Btn>
                            <Btn xs variant={actionDone(`campaign-save-prompt-${item.id}`)?"primary":"outline"} onClick={()=>saveCampaignDigitalPromptOutput(item)} disabled={!String(item.imagePrompt || "").trim()}>{actionDone(`campaign-save-prompt-${item.id}`)?"✓ Saved":"Save Prompt"}</Btn>
                          </div>
                        </div>
                        <div style={{ padding:10,display:"flex",flexDirection:"column",gap:10 }}>
                          {data.campaignDetailedPromptInstructionsEditing&&(
                            <div style={{ padding:10,border:`1px solid ${C.border}`,borderRadius:9,background:C.surface }}>
                              <div style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:6 }}>
                                <span style={{ fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Detailed Prompt Creator Instructions</span>
                                <Btn xs onClick={()=>{ updateAiWorkspace("digital",{ campaignDetailedPromptInstructionsEditing:false }); markActionDone("campaign-detailed-instructions-save"); }}>{actionDone("campaign-detailed-instructions-save")?"✓ Saved":"Save"}</Btn>
                              </div>
                              <textarea
                                value={data.campaignDetailedPromptInstructions || data.detailedPromptInstructions || defaultCampaignDetailedPromptInstructions}
                                onChange={(e:any)=>updateAiWorkspace("digital",{ campaignDetailedPromptInstructions:e.target.value })}
                                rows={4}
                                style={{ width:"100%",boxSizing:"border-box",minHeight:92,resize:"vertical",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.bg }}
                              />
                            </div>
                          )}
                          <div style={{ border:`1px solid ${C.border}`,borderRadius:9,background:C.surface,overflow:"hidden" }}>
                            <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                              <span style={{ fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Your Own Prompt (Optional)</span>
                            </div>
                            <textarea
                              value={item.ownPrompt || ""}
                              onChange={(e:any)=>updateCampaignDigitalItem(item.id,{ ownPrompt:e.target.value })}
                              placeholder="Type your own direction. Example: put these products in a modern kitchen counter"
                              rows={isMobile?3:3}
                              style={{ width:"100%",boxSizing:"border-box",minHeight:74,resize:"vertical",padding:"10px 12px",border:"none",outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.surface }}
                            />
                          </div>
                          <textarea
                            value={item.imagePrompt || ""}
                            onChange={(e:any)=>updateCampaignDigitalItem(item.id,{ imagePrompt:e.target.value })}
                            placeholder="Generated detailed prompt will appear here. You can also edit it before generating the image."
                            rows={isMobile?5:6}
                            style={{ width:"100%",boxSizing:"border-box",minHeight:120,resize:"vertical",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.surface }}
                          />
                          <p style={{ margin:"-4px 0 0",fontSize:10.5,color:C.faint,lineHeight:1.35 }}>Generate Detailed Prompt improves your own prompt while still following it. Product image links remain the main visual reference.</p>
                          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(180px,260px) minmax(0,1fr)",gap:8,alignItems:"end" }}>
                            <Field label="Image Ratio" hint="Seedream 4.5 compatible">
                              <Select value={item.imageRatio || "1:1"} onChange={(v:any)=>updateCampaignDigitalItem(item.id,{ imageRatio:v })}>
                                <option value="1:1">1:1 Square</option>
                                <option value="4:5">4:5 Portrait</option>
                                <option value="3:4">3:4 Portrait</option>
                                <option value="9:16">9:16 Vertical</option>
                                <option value="16:9">16:9 Landscape</option>
                                <option value="4:3">4:3 Landscape</option>
                                <option value="3:2">3:2 Landscape</option>
                                <option value="2:3">2:3 Portrait</option>
                              </Select>
                            </Field>
                            <div style={{ fontSize:10.5,color:C.faint,lineHeight:1.35 }}>The selected ratio is sent as a scene/composition requirement while the route keeps Seedream size on supported 2K output.</div>
                          </div>
                          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:0 }}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={async (e:any)=>{
                                const files = Array.from(e.target.files || []);
                                const toDataUrl = (file:any) => new Promise((resolve)=>{ const reader = new FileReader(); reader.onload=()=>resolve(String(reader.result || "")); reader.readAsDataURL(file); });
                                const uploaded = (await Promise.all(files.map(toDataUrl))).filter(Boolean);
                                updateCampaignDigitalItem(item.id,{ referenceImages:[...(Array.isArray(item.referenceImages)?item.referenceImages:[]),...uploaded].slice(0,8) });
                                e.target.value = "";
                              }}
                              style={{ fontSize:11,color:C.muted,maxWidth:"100%" }}
                            />
                            {Array.isArray(item.referenceImages)&&item.referenceImages.length>0&&<button type="button" onClick={()=>updateCampaignDigitalItem(item.id,{ referenceImages:[] })} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"6px 8px",fontSize:10.5,fontWeight:800,cursor:"pointer" }}>Clear refs ({item.referenceImages.length})</button>}
                            <span style={{ fontSize:10.5,color:C.faint }}>Optional uploaded references. Product image links are still read automatically.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isCarouselDcOutput ? (
                      <div style={{ display:"flex",flexDirection:"column",gap:10,width:"100%" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <div>
                            <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Carousel Card Output</span>
                            <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>Same carousel card layout from Marketing. Each image/video placeholder has its own Generate Image button.</span>
                          </div>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{carouselCards.length} card{carouselCards.length!==1?"s":""}</span>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(230px,1fr))",gap:10 }}>
                          {carouselCards.map((card:any,cardIndex:number)=>{
                            const generatingKey = `${item.id}-carousel-${cardIndex}`;
                            const mediaType = card.mediaType || recommendedCarouselMediaType(cardIndex);
                            const tint = mediaType === "video" ? "#FEF2F2" : "#EFF6FF";
                            const accentColor = mediaType === "video" ? "#EF4444" : "#111827";
                            return (
                              <div key={card.id || cardIndex} style={{ border:`1px solid ${C.borderStrong}`,borderRadius:12,background:C.bg,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
                                <div style={{ minHeight:118,background:tint,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:12,position:"relative" }}>
                                  <span style={{ position:"absolute",top:9,left:10,padding:"3px 8px",borderRadius:999,background:C.surface,border:`1px solid ${mediaType==="video"?"#FECACA":C.border}`,fontSize:10,fontWeight:900,color:accentColor }}>Card {cardIndex+1}</span>
                                  {card.generatedImageUrl ? (
                                    <img
                                      src={card.generatedImageUrl}
                                      alt={`Generated carousel card ${cardIndex+1}`}
                                      onClick={()=>setCampaignDcPreview({ id:`${item.id}-carousel-${cardIndex}`, url:card.generatedImageUrl, prompt:card.generatedImagePrompt || card.visual || "", title:`${item.title || "Carousel"} · Card ${cardIndex+1}` })}
                                      style={{ maxWidth:"100%",maxHeight:160,borderRadius:9,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in",background:C.surface }}
                                    />
                                  ) : (
                                    <div style={{ color:C.textSub,fontSize:11,fontWeight:800,lineHeight:1.35 }}>
                                      <p style={{ margin:"0 0 3px",fontSize:12,fontWeight:900,color:accentColor }}>{mediaType==="video"?"Video Placeholder":"Image Placeholder"}</p>
                                      <p style={{ margin:0,fontSize:10.5,color:C.muted }}>Creative visual goes here</p>
                                      {card.generatedImageError&&<p style={{ margin:"7px 0 0",color:"#DC2626",fontWeight:800 }}>{card.generatedImageError}</p>}
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding:10,display:"grid",gap:8,fontSize:11.5,lineHeight:1.45,color:C.textSub,flex:1 }}>
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Headline</p>
                                    <p style={{ margin:0,fontSize:12.5,fontWeight:900,color:C.text }}>{card.headline || ""}</p>
                                  </div>
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Copy</p>
                                    <p style={{ margin:0 }}>{card.copy || ""}</p>
                                  </div>
                                  <div style={{ padding:8,borderRadius:8,background:C.surface,border:`1px solid ${C.border}` }}>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>{mediaType==="video"?"Video Direction":"Image Direction"}</p>
                                    <p style={{ margin:0 }}>{card.visual || ""}</p>
                                  </div>
                                  <div>
                                    <p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>CTA</p>
                                    <p style={{ margin:0,fontWeight:900,color:C.text }}>CTA: {card.cta || "Shop Now"}</p>
                                  </div>
                                  <div style={{ display:"grid",gap:6,marginTop:"auto" }}>
                                    <input
                                      value={card.outputLink || ""}
                                      onChange={(e:any)=>updateCampaignDigitalCarouselCard(item.id,cardIndex,{ outputLink:e.target.value })}
                                      placeholder="Paste final output link here"
                                      style={{ width:"100%",height:30,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 8px",fontSize:10.5,color:C.textSub,background:C.surface }}
                                    />
                                    <div style={{ display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap",paddingTop:2 }}>
                                      <Btn xs variant={actionDone(`overview-campaign-dc-card-${item?.id}-${cardIndex}`)?"primary":"outline"} onClick={()=>addCampaignDigitalCardToOverview(item,card,cardIndex)}>{actionDone(`overview-campaign-dc-card-${item?.id}-${cardIndex}`)?"✓ Added":"Add to Overview"}</Btn>
                                      <Btn xs onClick={()=>generateCampaignDcCarouselImage(item,card,cardIndex)} disabled={campaignDcGeneratingImageId===generatingKey}>{campaignDcGeneratingImageId===generatingKey?"Generating...":"Generate Image"}</Btn>
                                      {card.generatedImageUrl&&<Btn xs variant="outline" onClick={()=>saveCampaignDcCarouselImageOutput(item,card,cardIndex)}>Save</Btn>}
                                      {card.generatedImageUrl&&<Btn xs variant="danger" onClick={()=>deleteCampaignDcCarouselImageOutput(item,cardIndex)}>Delete Image</Btn>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden",minHeight:260,display:"flex",flexDirection:"column" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>AI Image</span>
                          <Btn xs onClick={()=>generateCampaignDcImage(item)} disabled={campaignDcGeneratingImageId===item.id}>{campaignDcGeneratingImageId===item.id?"Generating...":"Generate Image"}</Btn>
                        </div>
                        <div style={{ flex:1,minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:12,background:C.surface }}>
                          {item.generatedImageUrl ? (
                            <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10,alignItems:"center" }}>
                              <img
                                src={item.generatedImageUrl}
                                alt="Generated campaign creative"
                                onClick={()=>setCampaignDcPreview({ id:item.id, url:item.generatedImageUrl, prompt:item.generatedImagePrompt || item.imagePrompt || "", title:item.title || item.product || "Campaign Digital Creative" })}
                                style={{ maxWidth:"100%",maxHeight:320,borderRadius:9,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in" }}
                              />
                              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:260 }}>
                                <Btn xs variant="outline" onClick={()=>saveCampaignDcImageOutput(item)}>Save</Btn>
                                <Btn xs variant="danger" onClick={()=>deleteCampaignDcImageOutput(item)}>Delete</Btn>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color:C.muted,fontSize:12,lineHeight:1.5 }}>
                              <div style={{ width:72,height:72,borderRadius:16,border:`1.5px dashed ${C.borderStrong}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:22,color:C.faint }}>＋</div>
                              <p style={{ margin:0,fontWeight:800,color:C.textSub }}>AI image placeholder</p>
                              <p style={{ margin:"4px 0 0" }}>Uses the product links and image prompt as references when generating.</p>
                              {item.generatedImageError&&<p style={{ margin:"8px 0 0",color:"#DC2626",fontWeight:750 }}>{item.generatedImageError}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
          <Modal open={!!campaignDcPreview} onClose={()=>setCampaignDcPreview(null)} title="AI Image Preview" width={820}>
            {campaignDcPreview&&(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <img src={campaignDcPreview.url} alt="AI image preview" style={{ width:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg }} />
                <div style={{ padding:12,borderRadius:10,background:C.surfaceAlt,display:"grid",gap:8 }}>
                  <div>
                    <p style={{ margin:"0 0 6px",fontSize:12,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Prompt</p>
                    <p style={{ margin:0,fontSize:13,color:C.textSub,lineHeight:1.45,whiteSpace:"pre-wrap" }}>{campaignDcPreview.prompt || "No prompt saved."}</p>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                  <Btn variant="outline" onClick={()=>window.open(campaignDcPreview.url,"_blank","noopener,noreferrer")}>Open in New Tab</Btn>
                </div>
              </div>
            )}
          </Modal>
        </div>
      );
    }



    if(tab==="digital" && !isCampaignChecklist){
      const digitalBackupWorkspace = ((readEmdcGroupWorkspaceBackups()[String(group?.id || "")] || {}).aiWorkspace || {}) as any;
      const persistedDigitalWorkspace = ((((getPersistedChecklistGroup() || group) || {}).aiWorkspace || {}).digital || {}) as any;
      const digitalData = {
        ...((digitalBackupWorkspace.digital && typeof digitalBackupWorkspace.digital === "object") ? digitalBackupWorkspace.digital : {}),
        ...(persistedDigitalWorkspace || {}),
        ...(((group.aiWorkspace || {}).digital || {}) as any),
      } as any;
      const defaultProductIntroDigitalAssetRows = [
        { id:"main-google-drive-folder", name:"Main Google Drive Folder", link:"" },
        { id:"product-images", name:"Product Images", link:"" },
        { id:"cem-banner", name:"CEM Banner", link:"" },
        { id:"store-banner", name:"Store Banner", link:"" },
        { id:"feed", name:"Feed", link:"" },
        { id:"story", name:"Story", link:"" },
        { id:"showcase-video", name:"Showcase Video", link:"" },
        { id:"a4-signage", name:"A4 Signage", link:"" },
        { id:"sampling-poster", name:"Sampling Poster", link:"" },
      ];
      const normalizeProductIntroDigitalAssetRows = (rows:any[] = []) => {
        const sourceRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
        const normalizeAssetKey = (value:any) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
        const oldDefaultKeys = new Set(["product-image","cem-banner","store-banner","feed","story","showcase-video"]);
        const looksLikeOldDefaults = sourceRows.length > 0 && sourceRows.length <= oldDefaultKeys.size && sourceRows.every((row:any)=>{
          const keys = [row?.id,row?.name].map(normalizeAssetKey).filter(Boolean);
          return keys.some((key:string)=>oldDefaultKeys.has(key));
        });
        if (sourceRows.length && !looksLikeOldDefaults) return sourceRows;
        const sourceByKey = new Map<string,any>();
        sourceRows.forEach((row:any)=>{
          [row?.id,row?.name].map(normalizeAssetKey).filter(Boolean).forEach((key:string)=>{
            if (!sourceByKey.has(key)) sourceByKey.set(key,row);
          });
        });
        if (sourceByKey.has("product-image") && !sourceByKey.has("product-images")) sourceByKey.set("product-images",sourceByKey.get("product-image"));
        return defaultProductIntroDigitalAssetRows.map((defaultRow:any)=>{
          const match = sourceByKey.get(normalizeAssetKey(defaultRow.id)) || sourceByKey.get(normalizeAssetKey(defaultRow.name));
          return match ? { ...defaultRow, link:match.link || match.url || match.outputLink || "" } : defaultRow;
        });
      };
      const productIntroDigitalAssetRows = normalizeProductIntroDigitalAssetRows(digitalData.productIntroAssetLinks);
      const updateProductIntroDigitalAssetRows = (rows:any[]) => {
        const cleanRows = Array.isArray(rows) ? rows : [];
        updateAiWorkspace("digital",{ productIntroAssetLinks:cleanRows, productIntroAssetLinksSavedAt:new Date().toISOString() });
      };
      const updateProductIntroDigitalAssetRow = (rowId:string, patch:any) => {
        updateProductIntroDigitalAssetRows(productIntroDigitalAssetRows.map((row:any)=>row.id===rowId ? { ...row, ...patch } : row));
      };
      const addProductIntroDigitalAssetRow = () => {
        updateProductIntroDigitalAssetRows([...productIntroDigitalAssetRows,{ id:uid(), name:"New Asset", link:"" }]);
      };
      const deleteProductIntroDigitalAssetRow = (rowId:string) => {
        updateProductIntroDigitalAssetRows(productIntroDigitalAssetRows.filter((row:any)=>row.id!==rowId));
      };
      const moveProductIntroDigitalAssetRow = (rowId:string, direction:number) => {
        const currentIndex = productIntroDigitalAssetRows.findIndex((row:any)=>row.id===rowId);
        const nextIndex = currentIndex + direction;
        if(currentIndex < 0 || nextIndex < 0 || nextIndex >= productIntroDigitalAssetRows.length) return;
        const nextRows = [...productIntroDigitalAssetRows];
        const [movedRow] = nextRows.splice(currentIndex,1);
        nextRows.splice(nextIndex,0,movedRow);
        updateProductIntroDigitalAssetRows(nextRows);
        markActionDone(`reorder-digital-asset-${rowId}`);
      };
      const addProductIntroDigitalAssetTableToOverview = () => {
        const lines = productIntroDigitalAssetRows.map((row:any,index:number)=>`${index+1}. ${row.name || "Untitled Asset"}${row.link ? `\n   Link: ${row.link}` : "\n   Link: "}`);
        addToOverview("Digital Creative", "Product Introduction Digital Creative Asset Links", lines.join("\n\n"), "Asset Link Table", { tab:"digital", type:"productIntroAssetLinks" });
        markActionDone("overview-product-intro-digital-assets");
      };

      const productIntroDeletedRowIds = Array.from(new Set(
        (Array.isArray(digitalData.deletedProductIntroDcRowIds) ? digitalData.deletedProductIntroDcRowIds : [])
          .map((value:any)=>String(value || ""))
          .filter(Boolean)
      ));
      const isDeletedProductIntroDcRow = (row:any) => productIntroDeletedRowIds.includes(String(row?.id || ""));
      const rawProductIntroRows = mergeDigitalCreativeRows(
        readMarketingDcBridgeRows(),
        Array.isArray(digitalData.productIntroCreativeRows) ? digitalData.productIntroCreativeRows : [],
        readMarketingDcTransferRowsBackup("product_intro")
      );
      const productIntroRows = rawProductIntroRows.filter((row:any)=>!isDeletedProductIntroDcRow(row));
      const productIntroRowsCleared = !!digitalData.productIntroRowsCleared;
      const makeProductIntroDcItem = (row:any) => ({
        id:uid(),
        sourceRowId:String(row.id || row.skuCode || row.sku || ""),
        platform:"All Platforms",
        brand:row.brand || "",
        category:row.collection || row.category || "",
        product:row.product || row.productName || "",
        sku:row.skuCode || row.sku || "",
        headline:"",
        subheadline:"",
        cta:"",
        imagePrompt:"",
        products:[{ product:row.product || row.productName || "", sku:row.skuCode || row.sku || "", brand:row.brand || "", collection:row.collection || row.category || "", imageLink:row.imageLink || row.imageUrl || row.extraFields?.["Image Link"] || row.extraFields?.imageLink || row.extraFields?.imagelink || "", links:[row.imageLink || row.imageUrl || row.extraFields?.["Image Link"] || row.extraFields?.imageLink || row.extraFields?.imagelink || ""].filter(Boolean) }],
        linkedEventContext:group.groupName || "Product Introduction",
        createdAt:new Date().toISOString(),
      });
      const makeProductIntroDcGroupedItem = (rows:any[]) => {
        const cleanRows = rows.filter(Boolean);
        const transferGroupId = uid();
        return {
          id:transferGroupId,
          transferGroupId,
          isProductListCard:true,
          sourceRowId:`group-${Date.now()}`,
          platform:"All Platforms",
          brand:Array.from(new Set(cleanRows.map((row:any)=>row.brand).filter(Boolean))).join(", "),
          category:Array.from(new Set(cleanRows.map((row:any)=>row.collection || row.category).filter(Boolean))).join(", "),
          product:cleanRows.map((row:any)=>row.product || row.productName || row.skuCode || row.sku).filter(Boolean).join(" + "),
          sku:cleanRows.map((row:any)=>row.skuCode || row.sku).filter(Boolean).join(", "),
          headline:"",
          subheadline:"",
          cta:"",
          imagePrompt:"",
          products:cleanRows.map((row:any)=>({ product:row.product || row.productName || "", sku:row.skuCode || row.sku || "", brand:row.brand || "", collection:row.collection || row.category || "", imageLink:row.imageLink || row.imageUrl || row.extraFields?.["Image Link"] || row.extraFields?.imageLink || row.extraFields?.imagelink || "", links:[row.imageLink || row.imageUrl || row.extraFields?.["Image Link"] || row.extraFields?.imageLink || row.extraFields?.imagelink || ""].filter(Boolean) })),
          linkedEventContext:group.groupName || "Product Introduction",
          createdAt:new Date().toISOString(),
        };
      };
      const sourceRows = rawProductIntroRows.length ? productIntroRows : (productIntroRowsCleared ? [] : productRows.map(makeProductIntroDcItem));
      const copyProductIntroDigitalItem = async (item:any) => {
        const output = [
          "Platform", item.platform || "All Platforms", "",
          "Brand", item.brand || "", "",
          "Category", item.category || item.collection || "", "",
          "Product", item.product || "", "",
          "Headline", item.headline || "", "",
          "Subheadline", item.subheadline || "", "",
          "CTA", item.cta || "",
        ].filter((line:any)=>String(line || "").trim()).join("\n");
        try { await navigator.clipboard.writeText(output); } catch {}
      };
      const updateProductIntroDigitalItem = (id:string, patch:any) => {
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>row.id===id ? { ...row, ...patch } : row);
        updateMarketingDcBridgeRow(id,patch);
        writeMarketingDcTransferRowsBackup("product_intro",nextRows);
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          generatedText:nextRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };
      const saveProductIntroDcImageOutput = async (item:any) => {
        if(!item.generatedImageUrl) return;
        const savedAt = new Date().toISOString();
        try {
          const uploaded = await uploadGeneratedImageToDrive({
            url:item.generatedImageUrl,
            prompt:item.generatedImagePrompt || item.imagePrompt || "",
            title:item.product || "Product Introduction Digital Creative",
            source:"Product Introduction Digital Creative",
            cardId:item.id,
            sourceRowId:item.id,
          });
          const driveUrl = uploaded?.url || uploaded?.imageUrl || item.generatedImageUrl;
          const digital = ((group.aiWorkspace || {}).digital || {}) as any;
          const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
          const savedEntry = {
            id:uid(),
            source:"Product Introduction Digital Creative",
            cardId:item.id,
            sourceRowId:item.id,
            title:item.product || "Product Introduction Digital Creative",
            url:driveUrl,
            driveFileId:uploaded?.driveFileId || "",
            prompt:item.generatedImagePrompt || item.imagePrompt || "",
            ownPrompt:item.ownPrompt || "",
            kind:"Generated Image",
            createdAt:savedAt,
          };
          const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
          const nextRows = baseRows.map((row:any)=>row.id===item.id ? { ...row, savedImageAt:savedAt, savedImageUrl:driveUrl, driveFileId:uploaded?.driveFileId || "" } : row);
          writeMarketingDcTransferRowsBackup("product_intro",nextRows);
          updateAiWorkspace("digital",{
            productIntroCreativeRows:nextRows,
            productIntroRowsCleared:nextRows.length===0,
            savedImageOutputs:[savedEntry,...saved.filter((img:any)=>img.cardId!==item.id)].slice(0,60),
            generatedText:nextRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
            generatedAt:savedAt,
          });
          markActionDone(`save-drive-${item.id}`);
        } catch(err:any) {
          updateProductIntroDigitalItem(item.id,{ generatedImageError:err?.message || "Failed to save image to Google Drive." });
        }
      };
      const deleteProductIntroDcImageOutput = (item:any) => {
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>row.id===item.id ? {
          ...row,
          generatedImageUrl:"",
          generatedImagePrompt:"",
          generatedImageAt:"",
          generatedImageError:"",
          savedImageAt:"",
          savedImageUrl:"",
          imageLinks:item.imageLinks || [],
        } : row);
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        updateMarketingDcBridgeRow(item.id,{
          generatedImageUrl:"",
          generatedImagePrompt:"",
          generatedImageAt:"",
          generatedImageError:"",
          savedImageAt:"",
          savedImageUrl:"",
          imageLinks:item.imageLinks || [],
        });
        writeMarketingDcTransferRowsBackup("product_intro",nextRows);
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          savedImageOutputs:filterSavedProductIntroOutputsForItem(saved,item.id),
          generatedText:nextRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };
      const deleteProductIntroDigitalItem = (id:string) => {
        deleteMarketingDcBridgeRow(id);
        const cleanId = String(id || "");
        const baseRows = rawProductIntroRows.length ? rawProductIntroRows : sourceRows;
        const nextRows = baseRows.filter((row:any)=>String(row.id || "")!==cleanId);
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        const deletedIds = Array.from(new Set([
          ...productIntroDeletedRowIds,
          cleanId,
        ].filter(Boolean))).slice(-250);
        writeMarketingDcTransferRowsBackup("product_intro",nextRows);
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          deletedProductIntroDcRowIds:deletedIds,
          savedImageOutputs:filterSavedProductIntroOutputsForItem(saved,cleanId),
          generatedText:nextRows.map((entry:any)=>`${entry.product || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };
      const clearProductIntroDigitalItems = () => {
        clearMarketingDcBridgeRowsForCurrentGroup();
        writeMarketingDcTransferRowsBackup("product_intro",[]);
        updateAiWorkspace("digital",{ productIntroCreativeRows:[], productIntroRowsCleared:true, deletedProductIntroDcRowIds:[], generatedText:"", generatedAt:"", savedImageOutputs:[], dcImagePrompt:"" });
      };
      const savedProductIntroDigitalOutputs = Array.isArray(digitalData.savedImageOutputs) ? digitalData.savedImageOutputs : [];
      const filterSavedProductIntroOutputsForItem = (saved:any[] = [], itemId:any, extraCardIds:any[] = []) => {
        const id = String(itemId || "");
        const cardIds = new Set([id, `prompt-${id}`, ...extraCardIds.map((value:any)=>String(value || ""))].filter(Boolean));
        return (Array.isArray(saved) ? saved : []).filter((entry:any)=>{
          const entryCardId = String(entry?.cardId || "");
          const entrySourceRowId = String(entry?.sourceRowId || "");
          return entrySourceRowId !== id && !cardIds.has(entryCardId) && !entryCardId.startsWith(`${id}-`);
        });
      };
      const deleteSavedProductIntroDigitalOutput = (savedId:string) => {
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        updateAiWorkspace("digital",{ savedImageOutputs:saved.filter((entry:any)=>entry.id!==savedId) });
        markActionDone(`delete-digital-saved-${savedId}`);
      };
      const defaultProductIntroDetailedPromptInstructions = "Create a highly executable product image prompt for AI image generation. Strictly preserve the product look from the provided product image links. Improve the user's own prompt without changing its core request. Include clear scene, composition, lighting, camera angle, product placement, styling, quality, and negative restrictions. Avoid text overlays unless the user specifically asks for text.";
      const getProductIntroDetailedPromptInstructions = () => String(digitalData.detailedPromptInstructions || defaultProductIntroDetailedPromptInstructions);
      const buildProductIntroDetailedPrompt = (item:any) => {
        const cardProducts = Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection }];
        const links = cardProducts.flatMap((product:any)=>getDcProductLinks(product)).map(normalizeDcUrl).filter(Boolean);
        const ownPrompt = String(item.ownPrompt || "").trim();
        const productLines = cardProducts.map((product:any,index:number)=>{
          const name = product?.product || product?.productName || product?.name || item.product || `Product ${index+1}`;
          const sku = product?.sku || item.sku || "";
          const brand = product?.brand || item.brand || "";
          const collection = product?.collection || product?.category || item.category || item.collection || "";
          return `${index+1}. ${[brand,collection,name,sku].filter(Boolean).join(" · ")}`;
        }).join("\n");
        return [
          "AI IMAGE GENERATION PROMPT",
          "",
          "PRIMARY USER DIRECTION TO FOLLOW:",
          ownPrompt || "Create a premium ecommerce product introduction image using the selected products.",
          "",
          "SAVED DETAILED PROMPT INSTRUCTIONS TO FOLLOW:",
          getProductIntroDetailedPromptInstructions(),
          "",
          "FEATURED PRODUCT/S:",
          productLines || [item.brand,item.category || item.collection,item.product,item.sku].filter(Boolean).join(" · "),
          "",
          "PRODUCT IMAGE LINKS - REQUIRED VISUAL REFERENCES:",
          links.length ? links.map((link:string,index:number)=>`${index+1}. ${link}`).join("\n") : "No product image links were found. Use only the provided product details and any uploaded references.",
          "",
          "FINAL EXECUTION:",
          ownPrompt
            ? `Improve and expand the user direction above while still following it exactly. The final scene must clearly match this request: ${ownPrompt}`
            : "Create a clean, premium product-focused visual based on the selected products.",
          "Use the product image links as the default reference for product accuracy. Preserve exact product color, shape, scale, material, proportions, handles, rims, packaging, logo placement, and visible details. Do not invent a different product.",
          "",
          "SCENE AND COMPOSITION:",
          ownPrompt ? `Build the scene around the user's requested setting/concept: ${ownPrompt}` : "Use a premium studio or semi-lifestyle ecommerce setup suitable for the product category.",
          "Arrange the selected products in a visually balanced composition. Keep product scale relationships accurate and give enough breathing room for marketplace or ad layout use.",
          "",
          "LIGHTING AND CAMERA:",
          "Use soft natural commercial lighting, crisp focus, realistic shadows, clean highlights, accurate product reflections, and a premium product photography look. Use a realistic camera angle that clearly shows the product form and important details.",
          "",
          "QUALITY STYLE:",
          "Hyper-realistic premium ecommerce product photography, sharp, clean, high-resolution, natural colors, accurate materials, modern layout, polished but not overly artificial.",
          "",
          "NEGATIVE RESTRICTIONS:",
          "No wrong product shape, no color changes, no invented accessories, no extra labels, no text overlay, no watermark, no distorted handles, no incorrect size relationship, no messy clutter, no unrealistic reflections, no people unless the user's own prompt asks for people."
        ].filter(Boolean).join("\n");
      };
      const generateProductIntroDetailedPrompt = (item:any) => {
        const prompt = buildProductIntroDetailedPrompt(item);
        updateProductIntroDigitalItem(item.id,{ imagePrompt:prompt, generatedDetailedPromptAt:new Date().toISOString() });
        markActionDone(`digital-detailed-prompt-${item.id}`);
      };
      const saveProductIntroDigitalPromptOutput = (item:any) => {
        const text = String(item.imagePrompt || "").trim();
        if(!text) return;
        const savedAt = new Date().toISOString();
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        const savedEntry = {
          id:uid(),
          source:"Product Introduction Digital Creative",
          cardId:`prompt-${item.id}`,
          sourceRowId:item.id,
          title:`${item.product || "Product Introduction"} · Detailed Prompt`,
          url:item.generatedImageUrl || "",
          prompt:text,
          ownPrompt:item.ownPrompt || "",
          kind:"Detailed Prompt",
          createdAt:savedAt,
        };
        updateAiWorkspace("digital",{
          savedImageOutputs:[savedEntry,...saved.filter((img:any)=>img.cardId!==`prompt-${item.id}`)].slice(0,60),
          generatedText:text,
          generatedAt:savedAt,
        });
        markActionDone(`digital-save-prompt-${item.id}`);
      };
      const addSavedProductIntroDigitalOutputToOverview = (saved:any) => {
        const content = [
          saved?.url ? `Generated Image: ${saved.url}` : "",
          saved?.ownPrompt ? `Own Prompt: ${saved.ownPrompt}` : "",
          saved?.prompt ? `Prompt:\n${saved.prompt}` : "",
        ].filter(Boolean).join("\n\n");
        addToOverview("Digital Creative", saved?.title || "Saved Digital Creative Output", content, saved?.kind || "Saved Output", { tab:"digital", type:"savedImageOutput", id:saved?.id || "", cardId:saved?.cardId || "", sourceRowId:saved?.sourceRowId || "" });
        markActionDone(`overview-digital-saved-${saved?.id}`);
      };
      const formatProductIntroDigitalCardOverview = (item:any, card:any, cardIndex:number) => [
        `Source: ${item?.title || item?.source || "Marketing Ad Output"}`,
        `Card ${cardIndex+1}`,
        `Media Type: ${card?.mediaType || recommendedCarouselMediaType(cardIndex)}`,
        card?.headline ? `Headline: ${card.headline}` : "",
        card?.copy ? `Copy:\n${card.copy}` : "",
        card?.visual ? `Visual Direction:\n${card.visual}` : "",
        card?.cta ? `CTA: ${card.cta}` : "",
        card?.outputLink ? `Final Link: ${card.outputLink}` : "",
        card?.generatedImageUrl ? `Generated Image: ${card.generatedImageUrl}` : "",
      ].filter(Boolean).join("\n\n");
      const addProductIntroDigitalCardToOverview = (item:any, card:any, cardIndex:number) => {
        addToOverview("Digital Creative", `${item?.title || "Marketing Ad Output"} · Card ${cardIndex+1}`, formatProductIntroDigitalCardOverview(item,card,cardIndex), card?.outputLink || item?.linkedEventContext || "Digital Creative Card", { tab:"digital", type:"productIntroDigitalCard", id:item?.id || "", cardIndex });
        markActionDone(`overview-product-intro-dc-card-${item?.id}-${cardIndex}`);
      };
      const generateProductIntroDcImage = async (item:any) => {
        const cardProducts = Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection }];
        const links = cardProducts.flatMap((product:any)=>getDcProductLinks(product)).map(normalizeDcUrl).filter(Boolean);
        const uploadedReferenceImages = Array.isArray(item.referenceImages) ? item.referenceImages : [];
        const prompt = [
          "Create a premium ecommerce product introduction image based on this product row.",
          "STRICT PRODUCT REFERENCE RULE: Read and follow the provided product image links and uploaded reference images. Preserve product shape, color, material, proportions, packaging, and visible design details. Do not redesign, recolor, replace, or invent a different product.",
          item.imagePrompt ? `User image prompt instruction:\n${item.imagePrompt}` : "",
          `Platform: ${item.platform || "All Platforms"}`,
          `Brand: ${item.brand || ""}`,
          `Category: ${item.category || item.collection || ""}`,
          `Product: ${item.product || ""}`,
          item.headline ? `Headline: ${item.headline}` : "",
          item.subheadline ? `Subheadline: ${item.subheadline}` : "",
          item.cta ? `CTA: ${item.cta}` : "",
          links.length ? `Use these product image/reference links as visual references:\n${links.join("\n")}` : "",
          "Keep the product accurate. Do not invent product details. Clean premium ecommerce layout.",
        ].filter(Boolean).join("\n");
        setCampaignDcGeneratingImageId(item.id);
        try {
          const res = await fetch("/api/ai/generate-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({
              prompt,
              size:"2K",
              aspectRatio:item.imageRatio || "1:1",
              watermark:false,
              referenceImages:uploadedReferenceImages,
              referenceImageUrls:links,
              productImageLinks:links,
              outputCount:1,
              optimizeForSite:true,
              avoidBase64:true,
              maxOutputBytes:900000,
            }),
          });
          const raw = await res.text();
          let result:any = {};
          try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
          if(!res.ok) throw new Error(result?.error || result?.message || "Image generation failed.");
          const url = result?.url || result?.imageUrl || result?.image_url || result?.data?.[0]?.url || result?.data?.[0]?.image_url || "";
          if(/^data:image\//i.test(url)) throw new Error("Generated image was returned as base64. EMDC blocks base64 images to keep the site lightweight. Please generate again using URL output.");
          updateProductIntroDigitalItem(item.id,{ generatedImageUrl:url, generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages, generatedImageAt:new Date().toISOString(), generatedImageError:"" });
        } catch(err:any) {
          updateProductIntroDigitalItem(item.id,{ generatedImageError:err?.message || "Image generation failed.", generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages });
        } finally {
          setCampaignDcGeneratingImageId("");
        }
      };
      const updateProductIntroDigitalCarouselCard = (itemId:string, cardIndex:number, patch:any) => {
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>{
          if(row.id!==itemId) return row;
          const carouselCards = (Array.isArray(row.carouselCards) ? row.carouselCards : []).map((card:any,index:number)=>index===cardIndex ? { ...card, ...patch } : card);
          return { ...row, carouselCards };
        });
        const patchedRow = nextRows.find((row:any)=>row.id===itemId);
        if(patchedRow) updateMarketingDcBridgeRow(itemId,patchedRow);
        writeMarketingDcTransferRowsBackup("product_intro",nextRows);
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const deleteProductIntroDcCarouselImageOutput = (item:any, cardIndex:number) => {
        const cardId = `${item.id}-carousel-${cardIndex}`;
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>{
          if(row.id!==item.id) return row;
          const carouselCards = (Array.isArray(row.carouselCards) ? row.carouselCards : []).map((card:any,index:number)=>index===cardIndex ? {
            ...card,
            generatedImageUrl:"",
            generatedImagePrompt:"",
            generatedImageAt:"",
            generatedImageError:"",
            savedImageAt:"",
            savedImageUrl:"",
          } : card);
          return { ...row, carouselCards };
        });
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        writeMarketingDcTransferRowsBackup("product_intro",nextRows);
        const patchedRow = nextRows.find((row:any)=>row.id===item.id);
        if(patchedRow) updateMarketingDcBridgeRow(item.id,patchedRow);
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          savedImageOutputs:saved.filter((entry:any)=>String(entry?.cardId || "")!==cardId),
          generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const saveProductIntroDcCarouselImageOutput = async (item:any, card:any, cardIndex:number) => {
        if(!card?.generatedImageUrl) return;
        const savedAt = new Date().toISOString();
        const cardId = `${item.id}-carousel-${cardIndex}`;
        try {
          const uploaded = await uploadGeneratedImageToDrive({
            url:card.generatedImageUrl,
            prompt:card.generatedImagePrompt || card.visual || item.imagePrompt || "",
            title:`${item.title || item.product || "Carousel"} · Card ${cardIndex+1}`,
            source:"Product Introduction Digital Creative",
            cardId,
            sourceRowId:item.id,
          });
          const driveUrl = uploaded?.url || uploaded?.imageUrl || card.generatedImageUrl;
          const digital = ((group.aiWorkspace || {}).digital || {}) as any;
          const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
          const savedEntry = {
            id:uid(),
            source:"Product Introduction Digital Creative",
            cardId,
            sourceRowId:item.id,
            title:`${item.title || item.product || "Carousel"} · Card ${cardIndex+1}`,
            url:driveUrl,
            driveFileId:uploaded?.driveFileId || "",
            prompt:card.generatedImagePrompt || card.visual || item.imagePrompt || "",
            createdAt:savedAt,
          };
          const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
          const nextRows = baseRows.map((row:any)=>{
            if(row.id!==item.id) return row;
            const carouselCards = (Array.isArray(row.carouselCards) ? row.carouselCards : []).map((carouselCard:any,index:number)=>index===cardIndex ? { ...carouselCard, savedImageAt:savedAt, savedImageUrl:driveUrl, driveFileId:uploaded?.driveFileId || "" } : carouselCard);
            return { ...row, carouselCards };
          });
          updateAiWorkspace("digital",{
            productIntroCreativeRows:nextRows,
            productIntroRowsCleared:nextRows.length===0,
            savedImageOutputs:[savedEntry,...saved.filter((img:any)=>img.cardId!==cardId)].slice(0,60),
            generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
            generatedAt:savedAt,
          });
          markActionDone(`save-drive-${cardId}`);
        } catch(err:any) {
          updateProductIntroDigitalCarouselCard(item.id,cardIndex,{ generatedImageError:err?.message || "Failed to save image to Google Drive." });
        }
      };


      const normalizeIntroCarouselMatchText = (value:any) => String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g," ")
        .trim();

      const normalizeIntroCarouselProductRefRows = (products:any[]=[], fallbackLinks:any[]=[]) => {
        const rows = Array.isArray(products) ? products.filter(Boolean) : [];
        return rows.map((row:any,index:number)=>{
          const rowLinks = Array.isArray(row?.links) ? row.links : (row?.link ? [row.link] : getDcProductLinks(row));
          return {
            id:row?.id || `ref-${index}-${uid()}`,
            brand:row?.brand || "",
            product:row?.product || row?.productName || row?.name || "",
            sku:row?.sku || row?.skuCode || "",
            links:(rowLinks && rowLinks.length ? rowLinks : (index===0 ? fallbackLinks : [])).filter(Boolean),
          };
        });
      };

      const getIntroCarouselCardProductReferences = (card:any, cardIndex:number, productRows:any[]=[]) => {
        const savedRefs = Array.isArray(card?.productRefs) ? card.productRefs.filter((ref:any)=>!ref?._removed) : [];
        if(savedRefs.length) return normalizeIntroCarouselProductRefRows(savedRefs);
        const rows = Array.isArray(productRows) ? productRows.filter(Boolean) : [];
        if(!rows.length) return [];

        const cardText = normalizeIntroCarouselMatchText([card?.headline,card?.copy,card?.visual,card?.cta].filter(Boolean).join(" "));
        const matched = rows.filter((row:any)=>{
          const product = normalizeIntroCarouselMatchText(row?.product || row?.productName || row?.name || "");
          const sku = normalizeIntroCarouselMatchText(row?.sku || "");
          const brand = normalizeIntroCarouselMatchText(row?.brand || "");
          const collection = normalizeIntroCarouselMatchText(row?.collection || row?.category || "");
          const productWords = product.split(" ").filter((word:string)=>word.length>=4);
          const hasSku = !!sku && cardText.includes(sku);
          const hasProductPhrase = !!product && cardText.includes(product);
          const hasProductWords = productWords.length ? productWords.some((word:string)=>cardText.includes(word)) : false;
          const hasBrandCollection = (!!brand && cardText.includes(brand)) || (!!collection && cardText.includes(collection));
          return hasSku || hasProductPhrase || hasProductWords || hasBrandCollection;
        });

        const chosen = matched.length ? matched : (rows.length===1 ? rows : rows);
        return normalizeIntroCarouselProductRefRows(chosen);
      };

      const getIntroCarouselCardReferenceLinks = (cardProducts:any[]=[], item:any={}) => (Array.isArray(cardProducts) ? cardProducts : [])
        .flatMap((row:any)=>getDcProductLinks(row))
        .map(normalizeDcUrl)
        .filter(Boolean);

      const updateProductIntroDigitalCarouselProductRefs = (itemId:string, cardIndex:number, nextRefs:any[]) => {
        updateProductIntroDigitalCarouselCard(itemId,cardIndex,{ productRefs:normalizeIntroCarouselProductRefRows(nextRefs) });
      };

      const renderIntroCarouselCardProductReferences = (cardProducts:any[]=[], links:any[]=[], opts:any={}) => {
        const products = normalizeIntroCarouselProductRefRows(cardProducts,links);
        const safeLinks = Array.isArray(links) ? links.filter(Boolean) : [];
        const onChangeRefs = opts?.onChangeRefs;
        const canEdit = typeof onChangeRefs === "function";
        const editable = !!opts?.editingProducts && canEdit;
        const onToggleEdit = typeof opts?.onToggleEdit === "function" ? opts.onToggleEdit : null;
        const onDoneEdit = typeof opts?.onDoneEdit === "function" ? opts.onDoneEdit : onToggleEdit;
        const updateRef = (idx:number, patch:any) => onChangeRefs(products.map((row:any,index:number)=>index===idx ? { ...row, ...patch } : row));
        const removeRef = (idx:number) => onChangeRefs(products.filter((_:any,index:number)=>index!==idx));
        const addRef = () => onChangeRefs([...products,{ id:uid(), brand:"", product:"", sku:"", links:[] }]);
        return (
          <div style={{ padding:8,borderRadius:8,background:"#F9FAFB",border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:6,alignItems:"center",marginBottom:6 }}>
              <p style={{ margin:0,fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Featured Product / SKU References</p>
              <div style={{ display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                {canEdit&&<button type="button" onClick={editable ? (onDoneEdit || undefined) : (onToggleEdit || undefined)} style={{ border:`1px solid ${C.border}`,background:editable?C.accent:C.surface,borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:900,color:editable?"#fff":C.textSub,cursor:"pointer" }}>{editable?"Done":"Edit Products"}</button>}
                {editable&&<button type="button" onClick={addRef} style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:900,color:C.textSub,cursor:"pointer" }}>+ Add</button>}
              </div>
            </div>
            {products.length ? products.slice(0,6).map((row:any,idx:number)=>{
              const rowLinks = Array.isArray(row?.links) ? row.links : [];
              return (
                <div key={`${row?.id || row?.sku || row?.product || "product"}-${idx}`} style={{ marginTop:idx?7:0,paddingTop:idx?7:0,borderTop:idx?`1px solid ${C.border}`:"none",fontSize:10.5,color:C.textSub,lineHeight:1.35 }}>
                  {editable ? (
                    <div style={{ display:"grid",gap:5 }}>
                      <input value={row?.product || ""} placeholder="Product name" onChange={e=>updateRef(idx,{ product:e.target.value })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,fontWeight:800,color:C.text,background:C.surface }} />
                      <input value={row?.sku || ""} placeholder="SKU" onChange={e=>updateRef(idx,{ sku:e.target.value })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,fontFamily:"monospace",color:C.textSub,background:C.surface }} />
                      <input value={rowLinks.join(", ")} placeholder="Product/image link/s" onChange={e=>updateRef(idx,{ links:String(e.target.value).split(/[\n,]+/).map((v:string)=>v.trim()).filter(Boolean) })} style={{ width:"100%",height:28,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",fontSize:10.5,color:C.textSub,background:C.surface }} />
                      <button type="button" onClick={()=>removeRef(idx)} style={{ justifySelf:"end",border:`1px solid #FECACA`,background:"#FEF2F2",color:"#DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:900,cursor:"pointer" }}>Remove Product</button>
                    </div>
                  ) : (
                    <>
                      <strong style={{ color:C.text }}>{[row?.brand,row?.product || row?.productName || row?.name].filter(Boolean).join(" · ") || "Selected Product"}</strong>
                      {row?.sku&&<span style={{ display:"block",fontFamily:"monospace",color:C.muted }}>SKU: {row.sku}</span>}
                    </>
                  )}
                </div>
              );
            }) : <p style={{ margin:0,fontSize:10.5,color:C.faint }}>No matched product details yet.</p>}
            {safeLinks.length>0&&(
              <div style={{ marginTop:6,display:"flex",gap:5,flexWrap:"wrap" }}>
                {safeLinks.slice(0,5).map((link:any,idx:number)=>(
                  <a key={`${link}-${idx}`} href={link} target="_blank" rel="noreferrer" style={{ fontSize:10,fontWeight:800,color:C.accent,textDecoration:"none",background:C.surface,border:`1px solid ${C.border}`,borderRadius:999,padding:"2px 6px" }}>Product Link {idx+1}</a>
                ))}
                {safeLinks.length>5&&<span style={{ fontSize:10,color:C.muted,fontWeight:800 }}>+{safeLinks.length-5} more</span>}
              </div>
            )}
          </div>
        );
      };

      const generateProductIntroDcCarouselImage = async (item:any, card:any, cardIndex:number) => {
        const allCardProducts = Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection, links:item.imageLinks || [] }];
        const cardProducts = getIntroCarouselCardProductReferences(card,cardIndex,allCardProducts);
        const links = getIntroCarouselCardReferenceLinks(cardProducts,item);
        const uploadedReferenceImages = Array.isArray(item.referenceImages) ? item.referenceImages : [];
        const mediaType = card?.mediaType || recommendedCarouselMediaType(cardIndex);
        const prompt = [
          `Create one ${mediaType} creative frame for Carousel Card ${cardIndex+1}.`,
          "STRICT PRODUCT IMAGE LINK RULE: The product image links for THIS carousel card are the default and required visual references. Read those links first and copy the product look from them. Do not invent, redesign, recolor, replace, or approximate the product. Preserve exact shape, silhouette, material, color, proportions, packaging, labels, logo placement, and visible details.",
          card?.headline ? `Card headline: ${card.headline}` : "",
          card?.copy ? `Card copy: ${card.copy}` : "",
          card?.visual ? `Card image/video direction:\n${card.visual}` : "",
          card?.cta ? `CTA: ${card.cta}` : "",
          item.imagePrompt ? `Overall ad context:\n${item.imagePrompt}` : "",
          `Platform: ${item.platform || "All Platforms"}`,
          cardProducts.length ? `Featured product/s for this carousel card:\n${cardProducts.map((row:any)=>[row.brand,row.product || row.productName || row.name,row.sku].filter(Boolean).join(" · ")).filter(Boolean).join("\n")}` : "",
          links.length ? `Use these product image/reference links for this carousel card:\n${links.join("\n")}` : "",
          "Generate the creative only. Keep the featured product accurate. Clean premium ecommerce layout.",
        ].filter(Boolean).join("\n");

        const generatingKey = `${item.id}-carousel-${cardIndex}`;
        setCampaignDcGeneratingImageId(generatingKey);
        try {
          const res = await fetch("/api/ai/generate-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({ prompt, size:"2K", aspectRatio:card?.imageRatio || item.imageRatio || "1:1", watermark:false, referenceImages:uploadedReferenceImages, referenceImageUrls:links, productImageLinks:links, outputCount:1, optimizeForSite:true, avoidBase64:true, maxOutputBytes:900000 }),
          });
          const raw = await res.text();
          let result:any = {};
          try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
          if(!res.ok) throw new Error(result?.error || result?.message || "Image generation failed.");
          const url = result?.url || result?.imageUrl || result?.image_url || result?.data?.[0]?.url || result?.data?.[0]?.image_url || "";
          if(/^data:image\//i.test(url)) throw new Error("Generated image was returned as base64. EMDC blocks base64 images to keep the site lightweight. Please generate again using URL output.");
          updateProductIntroDigitalCarouselCard(item.id,cardIndex,{ generatedImageUrl:url, generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages, generatedImageAt:new Date().toISOString(), generatedImageError:"" });
        } catch(err:any) {
          updateProductIntroDigitalCarouselCard(item.id,cardIndex,{ generatedImageError:err?.message || "Image generation failed.", generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages });
        } finally {
          setCampaignDcGeneratingImageId("");
        }
      };

      const updateProductIntroDigitalGmvRow = (itemId:string, rowIndex:number, patch:any) => {
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>{
          if(row.id!==itemId) return row;
          const gmvRows = (Array.isArray(row.gmvRows) ? row.gmvRows : []).map((gmvRow:any,index:number)=>index===rowIndex ? { ...gmvRow, ...patch } : gmvRow);
          return { ...row, gmvRows };
        });
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const deleteProductIntroDcGmvImageOutput = (item:any, rowIndex:number) => {
        const cardId = `${item.id}-gmv-${rowIndex}`;
        const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
        const nextRows = baseRows.map((row:any)=>{
          if(row.id!==item.id) return row;
          const gmvRows = (Array.isArray(row.gmvRows) ? row.gmvRows : []).map((gmvRow:any,index:number)=>index===rowIndex ? {
            ...gmvRow,
            generatedImageUrl:"",
            generatedImagePrompt:"",
            generatedImageAt:"",
            generatedImageError:"",
            savedImageAt:"",
            savedImageUrl:"",
          } : gmvRow);
          return { ...row, gmvRows };
        });
        const digital = ((group.aiWorkspace || {}).digital || {}) as any;
        const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
        updateAiWorkspace("digital",{
          productIntroCreativeRows:nextRows,
          productIntroRowsCleared:nextRows.length===0,
          savedImageOutputs:saved.filter((entry:any)=>String(entry?.cardId || "")!==cardId),
          generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
          generatedAt:new Date().toISOString(),
        });
      };

      const saveProductIntroDcGmvImageOutput = async (item:any, row:any, rowIndex:number) => {
        if(!row?.generatedImageUrl) return;
        const savedAt = new Date().toISOString();
        const cardId = `${item.id}-gmv-${rowIndex}`;
        try {
          const uploaded = await uploadGeneratedImageToDrive({
            url:row.generatedImageUrl,
            prompt:row.generatedImagePrompt || row.creativeDirection || item.imagePrompt || "",
            title:`${item.title || item.product || "Product GMV Max"} · ${row?.pillar || `Pillar ${rowIndex+1}`}`,
            source:"Product Introduction Digital Creative",
            cardId,
            sourceRowId:item.id,
          });
          const driveUrl = uploaded?.url || uploaded?.imageUrl || row.generatedImageUrl;
          const digital = ((group.aiWorkspace || {}).digital || {}) as any;
          const saved = Array.isArray(digital.savedImageOutputs) ? digital.savedImageOutputs : [];
          const savedEntry = {
            id:uid(),
            source:"Product Introduction Digital Creative",
            cardId,
            sourceRowId:item.id,
            title:`${item.title || item.product || "Product GMV Max"} · ${row?.pillar || `Pillar ${rowIndex+1}`}`,
            url:driveUrl,
            driveFileId:uploaded?.driveFileId || "",
            prompt:row.generatedImagePrompt || row.creativeDirection || item.imagePrompt || "",
            createdAt:savedAt,
          };
          const baseRows = productIntroRows.length ? productIntroRows : sourceRows;
          const nextRows = baseRows.map((dcRow:any)=>{
            if(dcRow.id!==item.id) return dcRow;
            const gmvRows = (Array.isArray(dcRow.gmvRows) ? dcRow.gmvRows : []).map((gmvRow:any,index:number)=>index===rowIndex ? { ...gmvRow, savedImageAt:savedAt, savedImageUrl:driveUrl, driveFileId:uploaded?.driveFileId || "" } : gmvRow);
            return { ...dcRow, gmvRows };
          });
          updateAiWorkspace("digital",{
            productIntroCreativeRows:nextRows,
            productIntroRowsCleared:nextRows.length===0,
            savedImageOutputs:[savedEntry,...saved.filter((img:any)=>img.cardId!==cardId)].slice(0,60),
            generatedText:nextRows.map((entry:any)=>`${entry.product || entry.title || "Product"}\n${entry.imagePrompt || ""}`).join("\n\n---\n\n"),
            generatedAt:savedAt,
          });
          markActionDone(`save-drive-${cardId}`);
        } catch(err:any) {
          updateProductIntroDigitalGmvRow(item.id,rowIndex,{ generatedImageError:err?.message || "Failed to save image to Google Drive." });
        }
      };

      const generateProductIntroDcGmvImage = async (item:any, row:any, rowIndex:number) => {
        const rowProducts = Array.isArray(row?.products) && row.products.length ? row.products : (Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection, links:[] }]);
        const links = rowProducts.flatMap((product:any)=>getDcProductLinks(product)).map(normalizeDcUrl).filter(Boolean);
        const uploadedReferenceImages = Array.isArray(row?.referenceImages) ? row.referenceImages : (Array.isArray(item.referenceImages) ? item.referenceImages : []);
        const prompt = [
          "Create one Digital Creative image for this TikTok Product GMV Max content pillar.",
          "STRICT PRODUCT IMAGE LINK RULE: Product image links are the default and required visual references. Read those links first and copy the product look from them. Do not invent, redesign, recolor, replace, or approximate the product. Preserve exact shape, silhouette, material, color, proportions, packaging, labels, logo placement, and visible details.",
          `Content Pillar: ${row?.pillar || `Pillar ${rowIndex+1}`}`,
          row?.contentTheme ? `Content Theme: ${row.contentTheme}` : "",
          row?.creativeDirection ? `Creative Direction:\n${row.creativeDirection}` : "",
          row?.captionCopy ? `Caption Copy: ${row.captionCopy}` : "",
          item.imagePrompt ? `Overall ad context:\n${item.imagePrompt}` : "",
          `Platform: ${item.platform || "TikTok"}`,
          rowProducts.length ? `Featured product/s for this GMV Max row:\n${rowProducts.map((product:any)=>[product?.brand,product?.product || product?.productName || product?.name,product?.sku].filter(Boolean).join(" · ")).filter(Boolean).join("\n")}` : "",
          links.length ? `Use these product image/reference links for this GMV Max row:\n${links.join("\n")}` : "",
          "Generate the visual only. Keep the featured product accurate. Clean premium TikTok ecommerce layout.",
        ].filter(Boolean).join("\n");
        const generatingKey = `${item.id}-gmv-${rowIndex}`;
        setCampaignDcGeneratingImageId(generatingKey);
        try {
          const res = await fetch("/api/ai/generate-image", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({ prompt, size:"2K", aspectRatio:card?.imageRatio || item.imageRatio || "1:1", watermark:false, referenceImages:uploadedReferenceImages, referenceImageUrls:links, productImageLinks:links, outputCount:1, optimizeForSite:true, avoidBase64:true, maxOutputBytes:900000 }),
          });
          const raw = await res.text();
          let result:any = {};
          try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error:raw }; }
          if(!res.ok) throw new Error(result?.error || result?.message || "Image generation failed.");
          const url = result?.url || result?.imageUrl || result?.image_url || result?.data?.[0]?.url || result?.data?.[0]?.image_url || "";
          if(/^data:image\//i.test(url)) throw new Error("Generated image was returned as base64. EMDC blocks base64 images to keep the site lightweight. Please generate again using URL output.");
          updateProductIntroDigitalGmvRow(item.id,rowIndex,{ generatedImageUrl:url, generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages, generatedImageAt:new Date().toISOString(), generatedImageError:"" });
        } catch(err:any) {
          updateProductIntroDigitalGmvRow(item.id,rowIndex,{ generatedImageError:err?.message || "Image generation failed.", generatedImagePrompt:prompt, imageLinks:links, referenceImages:uploadedReferenceImages });
        } finally {
          setCampaignDcGeneratingImageId("");
        }
      };


      return (
        <div style={{ display:"flex",flexDirection:"column",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
          <div style={{ padding:isMobile?12:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
              <div>
                <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Product Introduction Digital Creative</h3>
                <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:820 }}>Same card format as Campaign Digital Creative: product details, product links, prompt field, and AI image placeholder.</p>
              </div>
              <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{sourceRows.length} product{sourceRows.length!==1?"s":""}</span>
                {productIntroRows.length>0&&<Btn xs variant="danger" onClick={clearProductIntroDigitalItems}>Clear DC</Btn>}
              </div>
            </div>
          </div>

          {!!formatMainPromotion(((group.aiWorkspace || {}).digital || {}).mainPromotion)&&(
            renderMainPromotionCard(((group.aiWorkspace || {}).digital || {}).mainPromotion, true)
          )}

          <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap" }}>
              <div>
                <h3 style={{ margin:"0 0 4px",fontSize:15,fontWeight:900,color:C.text }}>Digital Creative Asset Links</h3>
                <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.45 }}>Add editable asset names and final output links for Product Image, banners, feed, story, and video deliverables.</p>
              </div>
              <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                <Btn xs variant="outline" onClick={addProductIntroDigitalAssetRow}>+ Add Row</Btn>
                <Btn xs variant={actionDone("save-product-intro-digital-assets")?"primary":"outline"} onClick={()=>{ updateProductIntroDigitalAssetRows(productIntroDigitalAssetRows); markActionDone("save-product-intro-digital-assets"); }}>{actionDone("save-product-intro-digital-assets")?"✓ Saved":"Save Table"}</Btn>
                <Btn xs variant={actionDone("overview-product-intro-digital-assets")?"primary":"outline"} onClick={addProductIntroDigitalAssetTableToOverview}>{actionDone("overview-product-intro-digital-assets")?"✓ Added":"Add to Overview"}</Btn>
              </div>
            </div>
            <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:isMobile?760:900 }}>
                <thead>
                  <tr style={{ background:C.surfaceAlt }}>
                    <th style={{ textAlign:"left",padding:"10px 12px",borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",width:118 }}>Rearrange</th>
                    <th style={{ textAlign:"left",padding:"10px 12px",borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Asset Name</th>
                    <th style={{ textAlign:"left",padding:"10px 12px",borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Link</th>
                    <th style={{ textAlign:"right",padding:"10px 12px",borderBottom:`1px solid ${C.border}`,fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",width:130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productIntroDigitalAssetRows.map((row:any,index:number)=>(
                    <tr key={row.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"8px 10px",verticalAlign:"top",whiteSpace:"nowrap",width:118 }}>
                        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                          <Btn xs variant="outline" disabled={index===0} onClick={()=>moveProductIntroDigitalAssetRow(row.id,-1)}>↑</Btn>
                          <Btn xs variant="outline" disabled={index===productIntroDigitalAssetRows.length-1} onClick={()=>moveProductIntroDigitalAssetRow(row.id,1)}>↓</Btn>
                          <span style={{ fontSize:11,fontWeight:800,color:C.faint,minWidth:18,textAlign:"center" }}>{index+1}</span>
                        </div>
                      </td>
                      <td style={{ padding:"8px 10px",verticalAlign:"top",width:"30%" }}>
                        <input
                          value={row.name || ""}
                          onChange={(e:any)=>updateProductIntroDigitalAssetRow(row.id,{ name:e.target.value })}
                          placeholder="Asset name"
                          style={{ width:"100%",height:36,border:`1px solid ${C.border}`,borderRadius:8,padding:"0 10px",fontSize:12.5,fontWeight:700,color:C.text,outline:"none",background:C.surface }}
                        />
                      </td>
                      <td style={{ padding:"8px 10px",verticalAlign:"top" }}>
                        <input
                          value={row.link || ""}
                          onChange={(e:any)=>updateProductIntroDigitalAssetRow(row.id,{ link:e.target.value })}
                          placeholder="Paste final output link here"
                          style={{ width:"100%",height:36,border:`1px solid ${C.border}`,borderRadius:8,padding:"0 10px",fontSize:12.5,color:C.text,outline:"none",background:C.surface }}
                        />
                      </td>
                      <td style={{ padding:"8px 10px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap" }}>
                        <div style={{ display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center" }}>
                          {row.link&&<Btn xs variant="outline" onClick={async()=>{ try { await navigator.clipboard.writeText(row.link || ""); markActionDone(`copy-digital-asset-${row.id}`); } catch {} }}>{actionDone(`copy-digital-asset-${row.id}`)?"✓":"Copy"}</Btn>}
                          <Btn xs variant="danger" onClick={()=>deleteProductIntroDigitalAssetRow(row.id)}>Delete</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sourceRows.length===0 ? (
            <div style={{ minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:18 }}>
              <p style={{ margin:0,fontSize:13,color:C.muted,lineHeight:1.5 }}>No selected products yet. Add SKUs to this Product Introduction checklist group first.</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {sourceRows.map((item:any)=>{
                const cardProducts = Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection }];
                const tableProducts = cardProducts.map((product:any)=>({
                  platform:item.platform || "All Platforms",
                  brand:product.brand || item.brand || "",
                  category:product.collection || item.category || item.collection || "",
                  product:product.product || item.product || "",
                  sku:product.sku || item.sku || "",
                  headline:item.headline || "",
                  subheadline:item.subheadline || "",
                  cta:item.cta || "",
                  links:getDcProductLinks(product),
                }));
                const links = tableProducts.flatMap((row:any)=>Array.isArray(row?.links) ? row.links.slice(0,1) : []).filter(Boolean);
                const mergeCopyCells = tableProducts.length>1 && tableProducts.every((row:any)=>String(row.headline||"")===String(tableProducts[0]?.headline||"") && String(row.subheadline||"")===String(tableProducts[0]?.subheadline||"") && String(row.cta||"")===String(tableProducts[0]?.cta||""));
                const carouselCards = Array.isArray(item.carouselCards) ? item.carouselCards : [];
                const isCarouselDcOutput = !!item.isCarousel && carouselCards.length>0;
                if (isCarouselDcOutput) {
                  const safeTitle = item.title || item.product || "Carousel Ad";
                  const safeContext = item.linkedEventContext || group.groupName || "Marketing";
                  return (
                    <div key={item.id} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                      <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                        <div style={{ minWidth:0,flex:"1 1 360px" }}>
                          <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35 }}>{safeTitle}</p>
                          <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{safeContext}</p>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"auto",gap:6,width:isMobile?"100%":"auto" }}>
                          <Btn xs variant="danger" onClick={()=>deleteProductIntroDigitalItem(item.id)}>Delete</Btn>
                        </div>
                      </div>
                      <div style={{ padding:isMobile?10:12,display:"flex",flexDirection:"column",gap:10 }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <div>
                            <span style={{ display:"block",fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Carousel Card Output</span>
                            <span style={{ display:"block",fontSize:10.5,color:C.muted,marginTop:2 }}>Same carousel card layout from Marketing. Each placeholder has its own Generate Image button.</span>
                          </div>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{carouselCards.length} card{carouselCards.length!==1?"s":""}</span>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(230px,1fr))",gap:10 }}>
                          {carouselCards.map((card:any,cardIndex:number)=>{
                            const generatingKey = `${item.id}-carousel-${cardIndex}`;
                            const mediaType = card?.mediaType || recommendedCarouselMediaType(cardIndex);
                            const normalizedMediaType = String(mediaType || "image").toLowerCase().includes("video") ? "video" : "image";
                            const tint = normalizedMediaType === "video" ? "#FEF2F2" : "#EFF6FF";
                            const accentColor = normalizedMediaType === "video" ? "#EF4444" : "#111827";
                            const allCardProducts = Array.isArray(item.products) && item.products.length ? item.products : [{ product:item.product, sku:item.sku, brand:item.brand, collection:item.category || item.collection, links:[] }];
                            const cardProductRows = getIntroCarouselCardProductReferences(card,cardIndex,allCardProducts);
                            const cardReferenceLinks = getIntroCarouselCardReferenceLinks(cardProductRows,item);
                            return (
                              <div key={card?.id || `dc-intro-carousel-card-${cardIndex}`} style={{ border:`1px solid ${C.borderStrong}`,borderRadius:12,background:C.bg,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
                                <div style={{ minHeight:118,background:tint,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:12,position:"relative" }}>
                                  <span style={{ position:"absolute",top:9,left:10,padding:"3px 8px",borderRadius:999,background:C.surface,border:`1px solid ${normalizedMediaType==="video"?"#FECACA":C.border}`,fontSize:10,fontWeight:900,color:accentColor }}>Card {cardIndex+1}</span>
                                  {card?.generatedImageUrl ? (
                                    <img src={card.generatedImageUrl} alt={`Generated carousel card ${cardIndex+1}`} onClick={()=>setCampaignDcPreview({ id:`${item.id}-carousel-${cardIndex}`, url:card.generatedImageUrl, prompt:card.generatedImagePrompt || card.visual || "", title:`${safeTitle} · Card ${cardIndex+1}` })} style={{ maxWidth:"100%",maxHeight:160,borderRadius:9,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in",background:C.surface }} />
                                  ) : (
                                    <div style={{ color:C.textSub,fontSize:11,fontWeight:800,lineHeight:1.35 }}>
                                      <p style={{ margin:"0 0 3px",fontSize:12,fontWeight:900,color:accentColor }}>{normalizedMediaType==="video"?"Video Placeholder":"Image Placeholder"}</p>
                                      <p style={{ margin:0,fontSize:10.5,color:C.muted }}>Creative visual goes here</p>
                                      {card?.generatedImageError&&<p style={{ margin:"7px 0 0",color:"#DC2626",fontWeight:800 }}>{card.generatedImageError}</p>}
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding:10,display:"grid",gap:8,fontSize:11.5,lineHeight:1.45,color:C.textSub,flex:1 }}>
                                  {renderIntroCarouselCardProductReferences(cardProductRows,cardReferenceLinks,{ editingProducts:!!dcProductRefEditKeys[`intro-${item.id}-${cardIndex}`], onToggleEdit:()=>toggleDcProductRefEdit(`intro-${item.id}-${cardIndex}`), onDoneEdit:()=>closeDcProductRefEdit(`intro-${item.id}-${cardIndex}`), onChangeRefs:(nextRefs:any)=>updateProductIntroDigitalCarouselProductRefs(item.id,cardIndex,nextRefs) })}
                                  <div><p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Headline</p><p style={{ margin:0,fontSize:12.5,fontWeight:900,color:C.text }}>{card?.headline || ""}</p></div>
                                  <div><p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Copy</p><p style={{ margin:0 }}>{card?.copy || ""}</p></div>
                                  <div style={{ padding:8,borderRadius:8,background:C.surface,border:`1px solid ${C.border}` }}><p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>{normalizedMediaType==="video"?"Video Direction":"Image Direction"}</p><p style={{ margin:0 }}>{card?.visual || ""}</p></div>
                                  <div><p style={{ margin:"0 0 2px",fontSize:10,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>CTA</p><p style={{ margin:0,fontWeight:900,color:C.text }}>CTA: {card?.cta || "Shop Now"}</p></div>
                                  <div style={{ display:"grid",gap:6,paddingTop:2,marginTop:"auto" }}>
                                    <input
                                      value={card?.outputLink || ""}
                                      onChange={(e:any)=>updateProductIntroDigitalCarouselCard(item.id,cardIndex,{ outputLink:e.target.value })}
                                      placeholder="Paste final output link here"
                                      style={{ width:"100%",height:30,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 8px",fontSize:10.5,color:C.textSub,background:C.surface }}
                                    />
                                    <div style={{ display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap" }}>
                                      <Btn xs variant={actionDone(`overview-product-intro-dc-card-${item?.id}-${cardIndex}`)?"primary":"outline"} onClick={()=>addProductIntroDigitalCardToOverview(item,card,cardIndex)}>{actionDone(`overview-product-intro-dc-card-${item?.id}-${cardIndex}`)?"✓ Added":"Add to Overview"}</Btn>
                                      <Btn xs onClick={()=>generateProductIntroDcCarouselImage(item,card,cardIndex)} disabled={campaignDcGeneratingImageId===generatingKey}>{campaignDcGeneratingImageId===generatingKey?"Generating...":"Generate Image"}</Btn>
                                      {card?.generatedImageUrl&&<Btn xs variant={card?.savedImageAt ? "primary" : "outline"} onClick={()=>saveProductIntroDcCarouselImageOutput(item,card,cardIndex)}>{card?.savedImageAt ? "Saved ✓" : "Save"}</Btn>}
                                      {card?.generatedImageUrl&&<Btn xs variant="danger" onClick={()=>deleteProductIntroDcCarouselImageOutput(item,cardIndex)}>Delete Image</Btn>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                <div key={item.id} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                  <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                    <div style={{ minWidth:0,flex:"1 1 360px" }}>
                      <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35 }}>{item.product || "Product Row"}</p>
                      <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{[item.brand, item.category || item.collection, item.sku].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"auto auto",gap:6,width:isMobile?"100%":"auto" }}>
                      <Btn xs variant="outline" onClick={()=>copyProductIntroDigitalItem(item)}>Copy</Btn>
                      <Btn xs variant="danger" onClick={()=>deleteProductIntroDigitalItem(item.id)}>Delete</Btn>
                    </div>
                  </div>

                  <div style={{ padding:isMobile?10:12,display:"grid",gridTemplateColumns:isCarouselDcOutput ? "1fr" : (isMobile?"1fr":"minmax(0,1.35fr) minmax(260px,.65fr)"),gap:12 }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:10,minWidth:0 }}>
                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",maxHeight:isMobile?220:300 }}>
                          <table style={{ width:"100%",minWidth:760,borderCollapse:"collapse",fontSize:12.5,color:C.textSub }}>
                            <thead>
                              <tr style={{ background:C.surfaceAlt }}>
                                {["Platform","Brand","Category","Product","SKU"].map((label:string)=>(
                                  <th key={label} style={{ position:"sticky",top:0,zIndex:1,background:C.surfaceAlt,padding:"9px 10px",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,textAlign:"left",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableProducts.map((row:any,idx:number)=>(
                                <tr key={`${row.sku || row.product || "product"}-${idx}`} style={{ background:idx%2?C.surface:C.bg }}>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap",fontWeight:750 }}>{row.platform || "All Platforms"}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.brand || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap" }}>{row.category || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",minWidth:220 }}>{row.product || ""}</td>
                                  <td style={{ padding:10,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,verticalAlign:"top",whiteSpace:"nowrap",fontWeight:750 }}>{row.sku || ""}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Product Image Links</span>
                          <span style={{ fontSize:10.5,fontWeight:800,color:C.muted }}>{links.length} link{links.length!==1?"s":""}</span>
                        </div>
                        <div style={{ maxHeight:170,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:10,display:"flex",flexDirection:"column",gap:8 }}>
                          {tableProducts.map((row:any,idx:number)=>(
                            <div key={`${row.sku || row.product || "links"}-${idx}`} style={{ padding:9,border:`1px solid ${C.border}`,borderRadius:9,background:C.surface }}>
                              <p style={{ margin:"0 0 5px",fontSize:11,fontWeight:900,color:C.text }}>{row.product || row.sku || `Product ${idx+1}`}</p>
                              {row.links.length ? (
                                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                                  {row.links.map((link:string,linkIdx:number)=>(
                                    <a key={`${link}-${linkIdx}`} href={normalizeDcUrl(link)} target="_blank" rel="noreferrer" style={{ fontSize:11,color:C.accent,fontWeight:750,textDecoration:"underline",textUnderlineOffset:2,wordBreak:"break-all" }}>{link}</a>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ margin:0,fontSize:11,color:C.faint }}>No image/reference link found in SKU Storage for this product.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>AI Detailed Prompt</span>
                          <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                            <Btn xs variant="outline" onClick={()=>updateAiWorkspace("digital",{ detailedPromptInstructionsEditing:!digitalData.detailedPromptInstructionsEditing })}>{digitalData.detailedPromptInstructionsEditing ? "Hide Instructions" : "Edit Instructions"}</Btn>
                            <Btn xs variant={actionDone(`digital-detailed-prompt-${item.id}`)?"primary":"outline"} onClick={()=>generateProductIntroDetailedPrompt(item)}>{actionDone(`digital-detailed-prompt-${item.id}`)?"✓ Prompt Generated":"Generate Detailed Prompt"}</Btn>
                            <Btn xs variant={actionDone(`digital-save-prompt-${item.id}`)?"primary":"outline"} onClick={()=>saveProductIntroDigitalPromptOutput(item)} disabled={!String(item.imagePrompt || "").trim()}>{actionDone(`digital-save-prompt-${item.id}`)?"✓ Saved":"Save Prompt"}</Btn>
                          </div>
                        </div>
                        <div style={{ padding:10,display:"flex",flexDirection:"column",gap:10 }}>
                          {digitalData.detailedPromptInstructionsEditing&&(
                            <div style={{ padding:10,border:`1px solid ${C.border}`,borderRadius:9,background:C.surface }}>
                              <div style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:6 }}>
                                <span style={{ fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Detailed Prompt Creator Instructions</span>
                                <Btn xs onClick={()=>{ updateAiWorkspace("digital",{ detailedPromptInstructionsEditing:false }); markActionDone("digital-detailed-instructions-save"); }}>{actionDone("digital-detailed-instructions-save")?"✓ Saved":"Save"}</Btn>
                              </div>
                              <textarea
                                value={digitalData.detailedPromptInstructions || defaultProductIntroDetailedPromptInstructions}
                                onChange={(e:any)=>updateAiWorkspace("digital",{ detailedPromptInstructions:e.target.value })}
                                rows={4}
                                style={{ width:"100%",boxSizing:"border-box",minHeight:92,resize:"vertical",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.bg }}
                              />
                            </div>
                          )}
                          <div style={{ border:`1px solid ${C.border}`,borderRadius:9,background:C.surface,overflow:"hidden" }}>
                            <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                              <span style={{ fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Your Own Prompt (Optional)</span>
                            </div>
                            <textarea
                              value={item.ownPrompt || ""}
                              onChange={(e:any)=>updateProductIntroDigitalItem(item.id,{ ownPrompt:e.target.value })}
                              placeholder="Type your own direction. Example: put these products in a modern kitchen counter"
                              rows={isMobile?3:3}
                              style={{ width:"100%",boxSizing:"border-box",minHeight:74,resize:"vertical",padding:"10px 12px",border:"none",outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.surface }}
                            />
                          </div>
                          <textarea
                            value={item.imagePrompt || ""}
                            onChange={(e:any)=>updateProductIntroDigitalItem(item.id,{ imagePrompt:e.target.value })}
                            placeholder="Generated detailed prompt will appear here. You can also edit it before generating the image."
                            rows={isMobile?5:6}
                            style={{ width:"100%",boxSizing:"border-box",minHeight:120,resize:"vertical",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12.5,lineHeight:1.5,color:C.text,background:C.surface }}
                          />
                          <p style={{ margin:"-4px 0 0",fontSize:10.5,color:C.faint,lineHeight:1.35 }}>Generate Detailed Prompt improves your own prompt while still following it. Product image links remain the main visual reference.</p>
                          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(180px,260px) minmax(0,1fr)",gap:8,alignItems:"end" }}>
                            <Field label="Image Ratio" hint="Seedream 4.5 compatible">
                              <Select value={item.imageRatio || "1:1"} onChange={(v:any)=>updateProductIntroDigitalItem(item.id,{ imageRatio:v })}>
                                <option value="1:1">1:1 Square</option>
                                <option value="4:5">4:5 Portrait</option>
                                <option value="3:4">3:4 Portrait</option>
                                <option value="9:16">9:16 Vertical</option>
                                <option value="16:9">16:9 Landscape</option>
                                <option value="4:3">4:3 Landscape</option>
                                <option value="3:2">3:2 Landscape</option>
                                <option value="2:3">2:3 Portrait</option>
                              </Select>
                            </Field>
                            <div style={{ fontSize:10.5,color:C.faint,lineHeight:1.35 }}>The selected ratio is sent as a scene/composition requirement while the route keeps Seedream size on supported 2K output.</div>
                          </div>
                          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:0 }}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={async (e:any)=>{
                                const files = Array.from(e.target.files || []);
                                const toDataUrl = (file:any) => new Promise((resolve)=>{ const reader = new FileReader(); reader.onload=()=>resolve(String(reader.result || "")); reader.readAsDataURL(file); });
                                const uploaded = (await Promise.all(files.map(toDataUrl))).filter(Boolean);
                                updateProductIntroDigitalItem(item.id,{ referenceImages:[...(Array.isArray(item.referenceImages)?item.referenceImages:[]),...uploaded].slice(0,8) });
                                e.target.value = "";
                              }}
                              style={{ fontSize:11,color:C.muted,maxWidth:"100%" }}
                            />
                            {Array.isArray(item.referenceImages)&&item.referenceImages.length>0&&<button type="button" onClick={()=>updateProductIntroDigitalItem(item.id,{ referenceImages:[] })} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"6px 8px",fontSize:10.5,fontWeight:800,cursor:"pointer" }}>Clear refs ({item.referenceImages.length})</button>}
                            <span style={{ fontSize:10.5,color:C.faint }}>Optional uploaded references. Product image links are still read automatically.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden",minHeight:260,display:"flex",flexDirection:"column" }}>
                      <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                        <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>AI Image</span>
                        <Btn xs onClick={()=>generateProductIntroDcImage(item)} disabled={campaignDcGeneratingImageId===item.id}>{campaignDcGeneratingImageId===item.id?"Generating...":"Generate Image"}</Btn>
                      </div>
                      <div style={{ flex:1,minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:12,background:C.surface }}>
                        {item.generatedImageUrl ? (
                          <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10,alignItems:"center" }}>
                            <img
                              src={item.generatedImageUrl}
                              alt="Generated product introduction creative"
                              onClick={()=>setCampaignDcPreview({ id:item.id, url:item.generatedImageUrl, prompt:item.generatedImagePrompt || item.imagePrompt || "", title:item.product || "Product Introduction Digital Creative" })}
                              style={{ maxWidth:"100%",maxHeight:320,borderRadius:9,objectFit:"contain",border:`1px solid ${C.border}`,cursor:"zoom-in" }}
                            />
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:260 }}>
                              <Btn xs variant={item.savedImageAt ? "primary" : "outline"} onClick={()=>saveProductIntroDcImageOutput(item)}>{item.savedImageAt ? "Saved ✓" : "Save"}</Btn>
                              <Btn xs variant="danger" onClick={()=>deleteProductIntroDcImageOutput(item)}>Delete</Btn>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color:C.muted,fontSize:12,lineHeight:1.5 }}>
                            <div style={{ width:72,height:72,borderRadius:16,border:`1.5px dashed ${C.borderStrong}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:22,color:C.faint }}>＋</div>
                            <p style={{ margin:0,fontWeight:800,color:C.textSub }}>AI image placeholder</p>
                            <p style={{ margin:"4px 0 0" }}>Uses the product links and image prompt as references when generating.</p>
                            {item.generatedImageError&&<p style={{ margin:"8px 0 0",color:"#DC2626",fontWeight:750 }}>{item.generatedImageError}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {savedProductIntroDigitalOutputs.length>0&&(
            <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <div style={{ padding:isMobile?12:14,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap" }}>
                <div>
                  <h3 style={{ margin:"0 0 4px",fontSize:15,fontWeight:900,color:C.text }}>Digital Creative Saved Outputs</h3>
                  <p style={{ margin:0,fontSize:12,color:C.muted }}>Saved prompts and generated images from Digital Creative.</p>
                </div>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{savedProductIntroDigitalOutputs.length} saved</span>
              </div>
              <div style={{ padding:isMobile?10:12,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:10 }}>
                {savedProductIntroDigitalOutputs.map((saved:any)=>(
                  <div key={saved.id} style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden",display:"flex",flexDirection:"column",minWidth:0 }}>
                    <div style={{ padding:"9px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap" }}>
                      <div style={{ minWidth:0,flex:1 }}>
                        <p style={{ margin:0,fontSize:12.5,fontWeight:900,color:C.text,lineHeight:1.35,wordBreak:"break-word" }}>{saved.title || "Saved Digital Creative Output"}</p>
                        <p style={{ margin:"3px 0 0",fontSize:10.5,color:C.muted }}>{saved.kind || (saved.url ? "Generated Image" : "Detailed Prompt")}</p>
                      </div>
                      <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                        <Btn xs variant={actionDone(`overview-digital-saved-${saved.id}`)?"primary":"outline"} onClick={()=>addSavedProductIntroDigitalOutputToOverview(saved)}>{actionDone(`overview-digital-saved-${saved.id}`)?"✓ Added":"Add to Overview"}</Btn>
                        <Btn xs variant="danger" onClick={()=>deleteSavedProductIntroDigitalOutput(saved.id)}>Delete</Btn>
                      </div>
                    </div>
                    <div style={{ padding:10,display:"flex",flexDirection:"column",gap:8 }}>
                      {saved.url&&<img src={saved.url} alt={saved.title || "Saved digital output"} style={{ width:"100%",maxHeight:240,objectFit:"contain",borderRadius:9,border:`1px solid ${C.border}`,background:C.surface }} />}
                      {!saved.url&&<div style={{ padding:12,border:`1px solid ${C.border}`,borderRadius:8,background:C.surface,textAlign:"center",fontSize:12,color:C.muted }}>No generated image saved for this output.</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Modal open={!!campaignDcPreview} onClose={()=>setCampaignDcPreview(null)} title="AI Image Preview" width={820}>
            {campaignDcPreview&&(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <img src={campaignDcPreview.url} alt="AI image preview" style={{ width:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg }} />
                <div style={{ padding:12,borderRadius:10,background:C.surfaceAlt,display:"grid",gap:8 }}>
                  <div>
                    <p style={{ margin:"0 0 6px",fontSize:12,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Prompt</p>
                    <p style={{ margin:0,fontSize:13,color:C.textSub,lineHeight:1.45,whiteSpace:"pre-wrap" }}>{campaignDcPreview.prompt || "No prompt saved."}</p>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                  <Btn variant="outline" onClick={()=>window.open(campaignDcPreview.url,"_blank","noopener,noreferrer")}>Open in New Tab</Btn>
                </div>
              </div>
            )}
          </Modal>
        </div>
      );
    }

    if(tab==="ecommerce"){
      const catalogFiles = data.catalogFiles || [];
      const selectedSections = getSelectedEcommerceSections();
      const sectionInstructions = getEcommerceSectionInstructions();
      const mappedProducts = productRows.slice(0,30);
      const campaignBuilder = getEcommerceCampaignBuilder();
      const campaignRows = getEcommerceCampaignRows();
      const campaignLinkedEventItems = getCampaignLinkedEventItems();
      const campaignLinkedEventLabel = getCampaignLinkedEventLabel();
      const campaignLinkedEventSchedule = getCampaignLinkedEventSchedule();
      const campaignTheme = getCampaignContextFromLinkedEvents() || "Campaign";
      const campaignSavedOutputs = Array.isArray(campaignBuilder.savedOutputs) ? campaignBuilder.savedOutputs : [];
      const campaignHasOutput = !!getEcommerceCampaignCombinedOutput().trim();
            const ecommerceTabMode = String(lt?.label || group?.launchType || group?.type || "").toLowerCase();
      const isCampaignChecklist = ecommerceTabMode.includes("campaign");

      if(!isCampaignChecklist){
        return (
                <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"minmax(0,1.1fr) minmax(0,.9fr)",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                        <div>
                          <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>E-commerce Listing Builder</h3>
                          <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:760 }}>Generate the complete marketplace listing structure for the selected products. Use Required Output Structure below to control which listing sections are included.</p>
                        </div>
                        <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{productRows.length} products</span>
                      </div>
                    </div>
        
                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                        <div>
                          <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Main Promotion</h4>
                          <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.45 }}>Optional. Add the current offer, voucher, discount, bundle, or sale mechanics here.</p>
                        </div>
                        <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <Btn xs variant="outline" onClick={()=>updateAiWorkspace(tab,{ mainPromotionEditing:true, mainPromotionDraft:data.mainPromotionDraft || (typeof data.mainPromotion === "object" ? data.mainPromotion : { type:"text", value:"", text:String(data.mainPromotion || "") }) })}>Edit</Btn>
                          <TransferBtn xs id="promo-marketing" onClick={()=>updateAiWorkspace("marketing",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to Marketing</TransferBtn>
                          <TransferBtn xs id="promo-digital" onClick={()=>updateAiWorkspace("digital",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to DC</TransferBtn>
                          <TransferBtn xs id="promo-livestream" onClick={()=>updateAiWorkspace("livestream",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to Livestream</TransferBtn>
                          <Btn xs variant="danger" onClick={clearMainPromotionAcrossTabs} disabled={!formatMainPromotion(data.mainPromotion)}>{actionDone("promo-clear")?"✓ Removed":"Remove"}</Btn>
                        </div>
                      </div>
                      {data.mainPromotionEditing ? (
                        <div style={{ display:"grid",gap:10 }}>
                          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"180px minmax(0,1fr)",gap:10 }}>
                            <Select value={(data.mainPromotionDraft || {}).type || "text"} onChange={(v:string)=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), type:v } })}>
                              <option value="text">Custom Text</option>
                              <option value="discount">Discount %</option>
                              <option value="php">PHP Value</option>
                            </Select>
                            <TI value={(data.mainPromotionDraft || {}).value || ""} onChange={(v:string)=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), value:v } })} placeholder="Value e.g. 20 or 100" />
                          </div>
                          <textarea
                            value={(data.mainPromotionDraft || {}).text || ""}
                            onChange={e=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), text:e.target.value } })}
                            placeholder="Promotion details. Example: 6.30 Payday Sale, free shipping voucher, TikTok Shop exclusive offer."
                            rows={3}
                            style={{ width:"100%",maxWidth:"100%",boxSizing:"border-box",minHeight:78,resize:"vertical",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
                          />
                          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                            <Btn xs onClick={()=>{ const draft=data.mainPromotionDraft || {}; const hasDraft=!!formatMainPromotion(draft); if(hasDraft){ updateAiWorkspace(tab,{ mainPromotion:draft, mainPromotionEditing:false }); } else { clearMainPromotionAcrossTabs(); } markActionDone("promo-save"); }}>{actionDone("promo-save")?"✓ Saved":"Save"}</Btn>
                            <Btn xs variant="outline" onClick={()=>updateAiWorkspace(tab,{ mainPromotionEditing:false })}>Done</Btn>
                          </div>
                        </div>
                      ) : (
                        renderMainPromotionCard(data.mainPromotion)
                      )}
                    </div>

                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                        <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>AI E-commerce Prompt</h4>
                        <Btn sm variant="outline" onClick={()=>updateAiWorkspace(tab,{ textPrompt:buildEcommercePrompt(ecommerceOutputSections,selectedSections,sectionInstructions,getEcommercePromptProductRows(data)) })}>Use Listing Template</Btn>
                      </div>
                      <div
                        tabIndex={0}
                        contentEditable={false}
                        onPaste={(e:any)=>handlePromptImagePaste(tab,e)}
                        onClick={(e:any)=>{ try { e.currentTarget.focus(); } catch {} }}
                        style={{ marginBottom:10,padding:"10px 12px",border:`1.5px dashed ${catalogFiles.length?"#86EFAC":C.border}`,borderRadius:10,background:catalogFiles.length?"#ECFDF5":C.bg,outline:"none",cursor:"text" }}
                      >
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                          <div style={{ minWidth:0,flex:"1 1 260px" }}>
                            <p style={{ margin:0,fontSize:12,fontWeight:850,color:C.text }}>Reference images</p>
                            <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>
                              Paste or upload catalog/product images. Images are compressed automatically before saving/generating to prevent payload errors.
                            </p>
                            {!!catalogFiles.length&&<p style={{ margin:"4px 0 0",fontSize:11,color:C.faint,fontWeight:700 }}>{catalogFiles.length} compressed reference image{catalogFiles.length>1?"s":""} added</p>}
                          </div>
                          <label style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",height:32,padding:"0 12px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",width:isMobile?"100%":"auto" }}>
                            Upload Reference Images
                            <input type="file" accept="image/*" multiple onChange={(e:any)=>handlePromptImageUpload(tab,e)} style={{ display:"none" }} />
                          </label>
                        </div>
                        {catalogFiles.length>0&&(
                          <div style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:10 }}>
                            {catalogFiles.map((file:any,idx:number)=>String(file?.type||"").startsWith("image/")&&(
                              <div key={`${file.name || 'catalog-file'}-${idx}`} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                                <img src={file.dataUrl} alt={file.name || "Catalog reference"} style={{ width:64,height:64,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}` }} />
                                <button onClick={(e:any)=>{ e.stopPropagation(); removeCatalogFile(tab,idx); }} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"5px 8px",fontSize:10.5,fontWeight:800,cursor:"pointer" }}>Remove</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <textarea
                        value={data.textPrompt || ""}
                        onPaste={(e:any)=>handlePromptImagePaste(tab,e)}
                        onChange={e=>updateAiWorkspace(tab,{ textPrompt:e.target.value })}
                        placeholder="Click Use Listing Template, upload reference images if needed, or write your own instruction for the e-commerce listing output."
                        rows={9}
                        style={{ width:"100%",maxWidth:"100%",boxSizing:"border-box",minHeight:isMobile?230:190,resize:"vertical",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
                      />
                      {Array.isArray(data.promptProductRows)&&data.promptProductRows.length>0&&(
                        <div style={{ marginTop:8,padding:"7px 10px",background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:8,fontSize:11.5,color:"#047857",fontWeight:800 }}>
                          <span>Prompt product scope: {data.promptProductRows.length} product{data.promptProductRows.length!==1?"s":""}. Save Changes will keep this same product scope.</span>
                          <button type="button" onClick={()=>updateAiWorkspace("ecommerce",{ promptProductRows:[], textPrompt:buildEcommercePrompt(ecommerceOutputSections,selectedSections,sectionInstructions,productRows) })} style={{ marginLeft:8,border:"none",background:"transparent",color:"#047857",fontSize:11.5,fontWeight:900,textDecoration:"underline",cursor:"pointer" }}>Use all products</button>
                        </div>
                      )}
                      {aiError[tab]&&<div style={{ marginTop:8,padding:"8px 10px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,color:"#B91C1C",fontWeight:700 }}>{aiError[tab]}</div>}
                      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"auto auto",gap:8,justifyContent:isMobile?"stretch":"flex-end",marginTop:10 }}>
                        <Btn sm variant="outline" onClick={()=>updateAiWorkspace(tab,{ textPrompt:data.textPrompt || buildEcommercePrompt(ecommerceOutputSections,selectedSections,sectionInstructions,getEcommercePromptProductRows(data)) })}>Save Prompt</Btn>
                        <Btn sm onClick={generateEcommerceListing} disabled={!!aiBusy[tab]}>{aiBusy[tab]?"Generating...":"Generate E-commerce Listing"}</Btn>
                      </div>
                    </div>

                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                        <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Required Output Structure</h4>
                        <div style={{ display:"grid",gridTemplateColumns:isMobile?"repeat(3,minmax(0,1fr))":"auto auto auto",gap:8,width:isMobile?"100%":"auto" }}>
                          <Btn xs variant="outline" onClick={setAllEcommerceSections}>Select All</Btn>
                          <Btn xs variant="outline" onClick={clearAllEcommerceSections}>Clear All</Btn>
                          <Btn xs onClick={()=>{
                            const sectionsNow = getEcommerceOutputSections();
                            const selectedNow = getSelectedEcommerceSections();
                            const instructionsNow = getEcommerceSectionInstructions();
                            updateAiWorkspace("ecommerce",{ textPrompt:buildEcommercePrompt(sectionsNow,selectedNow,instructionsNow,getEcommercePromptProductRows(data)) });
                          }}>Save Changes</Btn>
                        </div>
                      </div>
        
                      <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                        <input
                          value={newEcommerceSection}
                          onChange={e=>setNewEcommerceSection(e.target.value)}
                          onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addEcommerceSection(); } }}
                          placeholder="Add output section"
                          style={{ flex:"1 1 220px",height:32,padding:"0 10px",borderRadius:8,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12,color:C.text,background:C.bg }}
                        />
                        <Btn xs onClick={addEcommerceSection} disabled={!newEcommerceSection.trim()}>Add</Btn>
                      </div>
        
                      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:8 }}>
                        {ecommerceOutputSections.map((section:string,index:number)=>{
                          const active = selectedSections.includes(section);
                          const hasInstruction = !!String(sectionInstructions[section] || "").trim();
                          const isDragging = draggingEcommerceSection===section;
                          return (
                            <div
                              key={section}
                              draggable
                              onDragStart={(e)=>{ setDraggingEcommerceSection(section); try { e.dataTransfer.setData("text/plain",section); e.dataTransfer.effectAllowed="move"; } catch {} }}
                              onDragOver={(e)=>{ e.preventDefault(); try { e.dataTransfer.dropEffect="move"; } catch {} }}
                              onDrop={(e)=>{ e.preventDefault(); const from = draggingEcommerceSection || e.dataTransfer.getData("text/plain"); reorderEcommerceSection(from,section); setDraggingEcommerceSection(""); }}
                              onDragEnd={()=>setDraggingEcommerceSection("")}
                              style={{ display:"grid",gridTemplateColumns:"auto auto minmax(0,1fr) auto",alignItems:"center",gap:8,padding:"9px 10px",background:isDragging?"#DBEAFE":active?"#EEF2FF":C.bg,border:`1.5px solid ${isDragging?C.accent:active?C.accent:C.border}`,borderRadius:8,boxShadow:isDragging?"0 8px 24px rgba(59,130,246,.18)":"none",opacity:isDragging?.7:1,cursor:"grab" }}
                            >
                              <span title="Drag to rearrange" style={{ width:20,height:24,display:"inline-flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:15,fontWeight:900,letterSpacing:-2,cursor:"grab",userSelect:"none",lineHeight:1 }}>
                                ⋮⋮
                              </span>
        
                              <button type="button" onClick={()=>toggleEcommerceSection(section)} style={{ width:18,height:18,borderRadius:4,display:"inline-flex",alignItems:"center",justifyContent:"center",background:active?C.accent:"transparent",border:`1.5px solid ${active?C.accent:C.borderStrong}`,color:"#fff",fontSize:11,fontWeight:900,flexShrink:0,cursor:"pointer" }}>{active?"✓":""}</button>
        
                              <button type="button" onClick={()=>toggleEcommerceSection(section)} style={{ minWidth:0,textAlign:"left",border:"none",background:"transparent",fontSize:12,fontWeight:750,color:C.text,cursor:"pointer",padding:0 }}>
                                <span style={{ display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{index+1}. {section}</span>
                                {hasInstruction&&<span style={{ display:"block",marginTop:2,fontSize:10.5,fontWeight:700,color:"#047857" }}>Has instruction</span>}
                              </button>
        
                              <button type="button" onClick={()=>startEditEcommerceSection(section)} style={{ border:"none",background:C.surfaceAlt,color:C.muted,borderRadius:6,padding:"6px 9px",fontSize:10.5,fontWeight:850,cursor:"pointer" }}>Edit</button>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ margin:"10px 0 0",fontSize:11,color:C.faint }}>Drag the ⋮⋮ handle to rearrange the output order. Then click Save Changes so the listing template prompt above follows the new order.</p>
                    </div>
        
                    {editingEcommerceSection&&(
                      <Modal open={!!editingEcommerceSection} onClose={cancelEditEcommerceSection} title="Edit Output Section" width={560}>
                        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                          <Field label="Section Name">
                            <TI value={editingEcommerceSectionValue} onChange={setEditingEcommerceSectionValue} placeholder="e.g. Product Overview" />
                          </Field>
        
                          <Field label="Section Instruction">
                            <textarea
                              value={editingEcommerceInstructionValue}
                              onChange={e=>setEditingEcommerceInstructionValue(e.target.value)}
                              placeholder="Add specific instructions to refine how AI writes this section..."
                              style={{ width:"100%",minHeight:120,resize:"vertical",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
                            />
                          </Field>
        
                          <div style={{ padding:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10 }}>
                            <p style={{ margin:0,fontSize:11.5,color:C.muted,lineHeight:1.5 }}>This instruction will be added under this section in the AI prompt after you click Save, then Save Changes.</p>
                          </div>
        
                          <div style={{ display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
                            <Btn variant="danger" onClick={()=>deleteEcommerceSection(editingEcommerceSection)}>Delete Section</Btn>
                            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                              <Btn variant="outline" onClick={cancelEditEcommerceSection}>Cancel</Btn>
                              <Btn onClick={saveEditedEcommerceSection} disabled={!editingEcommerceSectionValue.trim()}>Save</Btn>
                            </div>
                          </div>
                        </div>
                      </Modal>
                    )}
                  </div>
        
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <h4 style={{ margin:"0 0 10px",fontSize:13,fontWeight:900,color:C.text }}>Products / SKU</h4>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {productRows.length>0&&(
                          <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.surface,overflow:"hidden" }}>
                            <div style={{ padding:isMobile?"10px":"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                              <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Select mapped products</span>
                              <div style={{ display:"flex",gap:6,width:isMobile?"100%":"auto",flexWrap:"wrap",justifyContent:isMobile?"stretch":"flex-end" }}>
                                <Btn xs variant="outline" onClick={()=>setSelectedCampaignProductKeys(productRows.map((row:any,idx:number)=>getCampaignProductOptionKey(row,idx)))}>Select All</Btn>
                                <Btn xs variant="outline" onClick={()=>setSelectedCampaignProductKeys([])}>Clear Selection</Btn>
                                <Btn xs variant="outline" onClick={()=>{
                                  const rows = getProductIntroDigitalRows();
                                  const existing = new Set(rows.flatMap((row:any)=>Array.isArray(row.products) ? row.products.map((p:any)=>String(p.sku || p.product || "")) : [String(row.sku || row.product || "")]));
                                  const rowsToAdd = selectedCampaignProductKeys
                                    .map((key:string)=>getCampaignProductByOptionKey(key))
                                    .filter(Boolean)
                                    .filter((item:any)=>!existing.has(String(item.skuCode || item.sku || item.product || item.productName || "")))
                                    .map((item:any)=>makeProductIntroDcItem(item));
                                  if(rowsToAdd.length) saveProductIntroDigitalRows([...rows,...rowsToAdd]);
                                  setSelectedCampaignProductKeys([]);
                                }} disabled={!selectedCampaignProductKeys.length}>Add Selected as Separate Rows</Btn>
                                <Btn xs onClick={()=>{
                                  const rows = getProductIntroDigitalRows();
                                  const items = getCampaignItemsByKeys(selectedCampaignProductKeys);
                                  if(items.length) saveProductIntroDigitalRows([...rows,makeProductIntroDcGroupedItem(items)]);
                                  setSelectedCampaignProductKeys([]);
                                }} disabled={!selectedCampaignProductKeys.length}>Add Selected as 1 Row</Btn>
                                <Btn xs variant="outline" onClick={()=>{
                                  const rows = productRows.map(makeProductIntroDcItem);
                                  saveProductIntroDigitalRows(rows);
                                  setSelectedCampaignProductKeys([]);
                                }} disabled={!productRows.length}>Add All as Separate Rows</Btn>
                                <Btn xs variant="outline" onClick={()=>{
                                  const rows = productRows.length ? [makeProductIntroDcGroupedItem(productRows)] : [];
                                  saveProductIntroDigitalRows(rows);
                                  setSelectedCampaignProductKeys([]);
                                }} disabled={!productRows.length}>Add All as 1 Row</Btn>
                              </div>
                            </div>
                            <div style={{ maxHeight:isMobile?260:170,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                              {productRows.map((row:any,idx:number)=>{
                                const key = getCampaignProductOptionKey(row,idx);
                                const checked = selectedCampaignProductKeys.includes(key);
                                return (
                                  <label key={key} style={{ display:"grid",gridTemplateColumns:"auto minmax(0,1fr)",gap:9,alignItems:"center",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,background:checked?"#EEF2FF":idx%2?C.surface:C.surfaceAlt,cursor:"pointer" }}>
                                    <input type="checkbox" checked={checked} onChange={()=>toggleSelectedCampaignProductKey(key)} />
                                    <span style={{ minWidth:0 }}>
                                      <span style={{ display:"block",fontSize:12,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.product || row.skuCode || "Unnamed Product"}</span>
                                      <span style={{ display:"block",fontSize:10.5,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.brand || "No brand"} · {row.collection || row.category || "No collection/category"} · {row.skuCode || row.sku || ""}</span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                          <div style={{ padding:"7px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                            <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>{getProductIntroDigitalRows().length} digital creative product row{getProductIntroDigitalRows().length!==1?"s":""}</span>
                            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                              <Btn xs variant="outline" onClick={saveEcommerceOutput} disabled={!data.generatedText}>Save Generated Outputs</Btn>
                              <Btn xs variant="danger" onClick={()=>saveProductIntroDigitalRows([])} disabled={!getProductIntroDigitalRows().length}>Clear Rows</Btn>
                            </div>
                          </div>
                          <div style={{ maxHeight:180,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                            {getProductIntroDigitalRows().length ? getProductIntroDigitalRows().map((row:any,idx:number)=>(
                              <div key={row.id || idx} style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1fr) auto",gap:8,alignItems:"center",padding:"8px 10px",borderBottom:idx===getProductIntroDigitalRows().length-1?"none":`1px solid ${C.border}`,background:idx%2?C.surface:C.surfaceAlt }}>
                                <div style={{ minWidth:0 }}>
                                  <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.product || "Product Row"}</p>
                                  <p style={{ margin:"2px 0 0",fontSize:10.5,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.brand || "No brand"} · {row.category || row.collection || "No collection/category"} · {Array.isArray(row.products)&&row.products.length>1 ? `${row.products.length} products in 1 row` : (row.sku || "")}</p>
                                </div>
                                <Btn xs variant="outline" onClick={()=>{
                                  const selectedProducts = Array.isArray(row.products) && row.products.length ? row.products : [{ product:row.product || "", sku:row.sku || "", brand:row.brand || "", collection:row.category || row.collection || "" }];
                                  setEcommercePromptForProducts(selectedProducts);
                                }}>Add to E-commerce Listing</Btn>
                              </div>
                            )) : (
                              <div style={{ padding:12,fontSize:12,color:C.faint }}>No digital creative rows yet. Add selected products above.</div>
                            )}
                          </div>
                        </div>

                        {productRows.length===0&&<div style={{ padding:12,fontSize:12,color:C.faint,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>No selected products yet.</div>}
                      </div>
                    </div>
        
                    <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                        <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>E-commerce Generated Output</h4>
                        <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                          {data.generatedAt&&<span style={{ fontSize:10.5,color:C.faint,fontWeight:700 }}>Generated {new Date(data.generatedAt).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>}
                          <Btn sm variant="outline" onClick={copyGeneratedEcommerce} disabled={!data.generatedText}>Copy</Btn>
                          <Btn sm variant="outline" onClick={saveEcommerceOutput} disabled={!data.generatedText}>Save</Btn>
                          <Btn sm variant={actionDone("overview-ecommerce-product-rows")?"primary":"outline"} onClick={()=>addProductIntroEcommerceOutputToOverview(data,"overview-ecommerce-product-rows")} disabled={!data.generatedText}>{actionDone("overview-ecommerce-product-rows")?"✓ Added":"Add to Overview"}</Btn>
                          <TransferBtn sm id="product-intro-ecommerce-send-marketing-current" onClick={()=>sendProductIntroEcommerceOutputToMarketing(data)} disabled={!data.generatedText || !getEcommerceGeneratedProductRows(data).length}>Send to Marketing</TransferBtn>
                          <TransferBtn sm id="product-intro-ecommerce-send-dc-current" onClick={()=>sendProductIntroEcommerceOutputToDigital(data)} disabled={!data.generatedText || !getEcommerceGeneratedProductRows(data).length}>Send to DC</TransferBtn>
                          <TransferBtn sm id="product-intro-ecommerce-send-livestream-current" onClick={()=>sendProductIntroEcommerceOutputToLivestream(data)} disabled={!data.generatedText || !getEcommerceGeneratedProductRows(data).length}>Send to Livestream</TransferBtn>
                          <Btn sm variant="danger" onClick={deleteGeneratedEcommerceOutput} disabled={!data.generatedText}>Delete</Btn>
                        </div>
                      </div>
                      {data.generatedText ? (
                        <textarea
                          value={data.generatedText || ""}
                          onChange={e=>updateAiWorkspace(tab,{ generatedText:e.target.value })}
                          rows={18}
                          style={{ width:"100%",minHeight:360,resize:"vertical",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:12.5,lineHeight:1.55,color:C.text,background:C.bg,whiteSpace:"pre-wrap" }}
                        />
                      ) : (
                        <div style={{ minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:10,padding:16 }}>
                          <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5 }}>Generated e-commerce listing will appear here. Upload reference images if needed, select the output sections you want, then generate the listing.</p>
                        </div>
                      )}
                    </div>
        
                    {Array.isArray(data.savedOutputs)&&data.savedOutputs.length>0&&(
                      <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10 }}>
                          <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Saved E-commerce Outputs</h4>
                          <span style={{ padding:"3px 8px",borderRadius:999,background:C.surfaceAlt,border:`1px solid ${C.border}`,fontSize:10.5,fontWeight:800,color:C.muted }}>{data.savedOutputs.length} saved</span>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:220,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                          {data.savedOutputs.map((item:any)=>(
                            <div key={item.id} style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",padding:"10px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10 }}>
                              <button onClick={()=>openSavedEcommerceOutput(item)} style={{ minWidth:0,flex:1,textAlign:"left",border:"none",background:"transparent",cursor:"pointer",padding:0 }}>
                                <p style={{ margin:0,fontSize:12,fontWeight:850,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.title || "Saved Output"}</p>
                                <p style={{ margin:"3px 0 0",fontSize:10.5,color:C.faint }}>{item.createdAt ? new Date(item.createdAt).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "Saved"} · Click to view</p>
                              </button>
                              <button onClick={(e:any)=>{ e.stopPropagation(); addProductIntroEcommerceOutputToOverview(item,`overview-ecomm-saved-${item.id}`); }} style={{ border:"none",background:actionDone(`overview-ecomm-saved-${item.id}`)?C.accent:C.surfaceAlt,color:actionDone(`overview-ecomm-saved-${item.id}`)?"#fff":C.textSub,borderRadius:7,padding:"6px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>{actionDone(`overview-ecomm-saved-${item.id}`)?"✓ Added":"Add to Overview"}</button>
                              <button onClick={(e:any)=>{ e.stopPropagation(); deleteSavedEcommerceOutput(item.id); if(savedEcommercePreview?.id===item.id) setSavedEcommercePreview(null); }} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"6px 9px",fontSize:11,fontWeight:800,cursor:"pointer" }}>Delete</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
        
                    {savedEcommercePreview&&(
                      <Modal open={!!savedEcommercePreview} onClose={()=>setSavedEcommercePreview(null)} title="Saved E-commerce Output" width={760}>
                        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                          <div style={{ padding:12,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10 }}>
                            <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>{savedEcommercePreview.title || "Saved Output"}</p>
                            <p style={{ margin:"4px 0 0",fontSize:11,color:C.faint }}>
                              {savedEcommercePreview.createdAt ? new Date(savedEcommercePreview.createdAt).toLocaleString("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "Saved output"}
                            </p>
                          </div>
                          <div style={{ maxHeight:isMobile?"58vh":"62vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,padding:14 }}>
                            <pre style={{ margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:13,lineHeight:1.55,color:C.text }}>{savedEcommercePreview.text || ""}</pre>
                          </div>
                          <div style={{ display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap" }}>
                            <Btn variant="outline" onClick={()=>setSavedEcommercePreview(null)}>Close</Btn>
                            <TransferBtn id={`product-intro-ecommerce-send-marketing-preview-${savedEcommercePreview?.id || "preview"}`} onClick={()=>sendProductIntroEcommerceOutputToMarketing(savedEcommercePreview)} disabled={!getEcommerceGeneratedProductRows(savedEcommercePreview).length}>Send to Marketing</TransferBtn>
                            <TransferBtn id={`product-intro-ecommerce-send-livestream-preview-${savedEcommercePreview?.id || "preview"}`} onClick={()=>sendProductIntroEcommerceOutputToLivestream(savedEcommercePreview)} disabled={!getEcommerceGeneratedProductRows(savedEcommercePreview).length}>Send to Livestream</TransferBtn>
                            <TransferBtn id={`product-intro-ecommerce-send-dc-preview-${savedEcommercePreview?.id || "preview"}`} onClick={()=>sendProductIntroEcommerceOutputToDigital(savedEcommercePreview)} disabled={!getEcommerceGeneratedProductRows(savedEcommercePreview).length}>Send to DC</TransferBtn>
                            <Btn variant={actionDone(`overview-ecomm-preview-${savedEcommercePreview?.id || "preview"}`)?"primary":"outline"} onClick={()=>addProductIntroEcommerceOutputToOverview(savedEcommercePreview,`overview-ecomm-preview-${savedEcommercePreview?.id || "preview"}`)}>{actionDone(`overview-ecomm-preview-${savedEcommercePreview?.id || "preview"}`)?"✓ Added":"Add to Overview"}</Btn>
                            <Btn onClick={copySavedEcommerceOutput}>Copy Output</Btn>
                          </div>
                        </div>
                      </Modal>
                    )}
        
                    <div style={{ padding:14,background:"#ECFDF5",border:"1.5px solid #A7F3D0",borderRadius:12 }}>
                      <h4 style={{ margin:"0 0 6px",fontSize:13,fontWeight:900,color:"#065F46" }}>Gemini Connected</h4>
                      <p style={{ margin:0,fontSize:12,color:"#065F46",lineHeight:1.5 }}>This tab now sends the selected products, prompt, and uploaded catalog files to Gemini through /api/ai/generate-text.</p>
                    </div>
                  </div>
                </div>
              );
      }

      return (
        <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr)",gap:isMobile?10:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap",marginBottom:12 }}>
                <div>
                  <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>Campaign E-commerce Copy Builder</h3>
                  <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.45,maxWidth:980 }}>Campaign checklist mode: create campaign copy per selected mapped product row. AI reads the linked event and uses it as the campaign context.</p>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"auto auto auto auto",gap:8,alignItems:"center",justifyContent:isMobile?"stretch":"flex-end",width:isMobile?"100%":"auto" }}>
                  <span style={{ gridColumn:isMobile?"1 / -1":"auto",textAlign:isMobile?"center":"left",fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"6px 9px" }}>Headline · Subheadline · CTA</span>
                  <Btn xs variant="outline" onClick={openEcommerceCampaignInstructions}>AI Instructions</Btn>
                  <Btn xs variant="outline" onClick={saveEcommerceCampaignOutput} disabled={!campaignHasOutput}>Save All Outputs</Btn>
                  <Btn xs onClick={generateEcommerceCampaignAssets} disabled={!!aiBusy.ecommerceCampaign || !campaignRows.length}>{aiBusy.ecommerceCampaign?"Generating All...":"Generate All Rows"}</Btn>
                </div>
              </div>

              <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                  <div>
                    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Main Promotion</h4>
                    <p style={{ margin:"3px 0 0",fontSize:11,color:C.muted,lineHeight:1.45 }}>Optional. Add the current offer, voucher, discount, bundle, or sale mechanics here.</p>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                    <Btn xs variant="outline" onClick={()=>updateAiWorkspace(tab,{ mainPromotionEditing:true, mainPromotionDraft:data.mainPromotionDraft || (typeof data.mainPromotion === "object" ? data.mainPromotion : { type:"text", value:"", text:String(data.mainPromotion || "") }) })}>Edit</Btn>
                    <TransferBtn xs id="promo-marketing" onClick={()=>updateAiWorkspace("marketing",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to Marketing</TransferBtn>
                    <TransferBtn xs id="promo-digital" onClick={()=>updateAiWorkspace("digital",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to DC</TransferBtn>
                    <TransferBtn xs id="promo-livestream" onClick={()=>updateAiWorkspace("livestream",{ mainPromotion:data.mainPromotion })} disabled={!formatMainPromotion(data.mainPromotion)}>Send to Livestream</TransferBtn>
                    <Btn xs variant="danger" onClick={clearMainPromotionAcrossTabs} disabled={!formatMainPromotion(data.mainPromotion)}>{actionDone("promo-clear")?"✓ Removed":"Remove"}</Btn>
                  </div>
                </div>
                {data.mainPromotionEditing ? (
                  <div style={{ display:"grid",gap:10 }}>
                    <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"180px minmax(0,1fr)",gap:10 }}>
                      <Select value={(data.mainPromotionDraft || {}).type || "text"} onChange={(v:string)=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), type:v } })}>
                        <option value="text">Custom Text</option>
                        <option value="discount">Discount %</option>
                        <option value="php">PHP Value</option>
                      </Select>
                      <TI value={(data.mainPromotionDraft || {}).value || ""} onChange={(v:string)=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), value:v } })} placeholder="Value e.g. 20 or 100" />
                    </div>
                    <textarea
                      value={(data.mainPromotionDraft || {}).text || ""}
                      onChange={e=>updateAiWorkspace(tab,{ mainPromotionDraft:{ ...(data.mainPromotionDraft || {}), text:e.target.value } })}
                      placeholder="Promotion details. Example: 6.30 Payday Sale, free shipping voucher, TikTok Shop exclusive offer."
                      rows={3}
                      style={{ width:"100%",maxWidth:"100%",boxSizing:"border-box",minHeight:78,resize:"vertical",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
                    />
                    <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                      <Btn xs onClick={()=>{ const draft=data.mainPromotionDraft || {}; const hasDraft=!!formatMainPromotion(draft); if(hasDraft){ updateAiWorkspace(tab,{ mainPromotion:draft, mainPromotionEditing:false }); } else { clearMainPromotionAcrossTabs(); } markActionDone("promo-save"); }}>{actionDone("promo-save")?"✓ Saved":"Save"}</Btn>
                      <Btn xs variant="outline" onClick={()=>updateAiWorkspace(tab,{ mainPromotionEditing:false })}>Done</Btn>
                    </div>
                  </div>
                ) : (
                  renderMainPromotionCard(data.mainPromotion)
                )}
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr",gap:10 }}>
                <div style={{ padding:isMobile?12:14,border:`1.5px solid ${C.border}`,borderRadius:12,background:C.bg }}>
                  <div style={{ display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap" }}>
                    <div style={{ minWidth:0,flex:"1 1 280px" }}>
                      <p style={{ margin:"0 0 4px",fontSize:10.5,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Linked Event</p>
                      <p style={{ margin:0,fontSize:13,fontWeight:900,color:C.text,lineHeight:1.35,wordBreak:"break-word" }}>{campaignLinkedEventLabel}</p>
                      {campaignLinkedEventSchedule&&<p style={{ margin:"4px 0 0",fontSize:11,color:C.muted,lineHeight:1.35 }}>{campaignLinkedEventSchedule}</p>}
                      {!campaignLinkedEventItems.length&&<p style={{ margin:"5px 0 0",fontSize:11,color:"#B45309",lineHeight:1.35 }}>Link this checklist group to an event/season so AI can use it as the campaign context.</p>}
                    </div>
                    <span style={{ fontSize:11,fontWeight:800,color:campaignLinkedEventItems.length?C.accent:"#B45309",background:campaignLinkedEventItems.length?"#ECFDF5":"#FFFBEB",border:`1px solid ${campaignLinkedEventItems.length?"#A7F3D0":"#FDE68A"}`,borderRadius:999,padding:"5px 9px",whiteSpace:"nowrap" }}>
                      {campaignLinkedEventItems.length ? `${campaignLinkedEventItems.length} linked` : "No event linked"}
                    </span>
                  </div>
                </div>

                <div>
                  <Field label="Products / SKU">
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {productRows.length>0&&(
                        <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.surface,overflow:"hidden" }}>
                          <div style={{ padding:isMobile?"10px":"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                            <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Select mapped products</span>
                            <div style={{ display:"flex",gap:6,width:isMobile?"100%":"auto",flexWrap:"wrap",justifyContent:isMobile?"stretch":"flex-end" }}>
                              <Btn xs variant="outline" onClick={()=>setSelectedCampaignProductKeys(productRows.map((row:any,idx:number)=>getCampaignProductOptionKey(row,idx)))}>Select All</Btn>
                              <Btn xs variant="outline" onClick={()=>setSelectedCampaignProductKeys([])}>Clear Selection</Btn>
                              <Btn xs variant="outline" onClick={addSelectedEcommerceCampaignProductRows} disabled={!selectedCampaignProductKeys.length}>Add Selected as Separate Rows</Btn>
                              <Btn xs onClick={addSelectedAsOneEcommerceCampaignProductRow} disabled={!selectedCampaignProductKeys.length}>Add Selected as 1 Row</Btn>
                              <Btn xs variant="outline" onClick={addAllEcommerceCampaignProductRows} disabled={!productRows.length}>Add All as Separate Rows</Btn>
                              <Btn xs variant="outline" onClick={addAllAsOneEcommerceCampaignProductRow} disabled={!productRows.length}>Add All as 1 Row</Btn>
                            </div>
                          </div>
                          <div style={{ maxHeight:isMobile?260:170,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                            {productRows.map((row:any,idx:number)=>{
                              const key = getCampaignProductOptionKey(row,idx);
                              const checked = selectedCampaignProductKeys.includes(key);
                              return (
                                <label key={key} style={{ display:"grid",gridTemplateColumns:"auto minmax(0,1fr)",gap:9,alignItems:"center",padding:"8px 10px",borderBottom:`1px solid ${C.border}`,background:checked?"#EEF2FF":idx%2?C.surface:C.surfaceAlt,cursor:"pointer" }}>
                                  <input type="checkbox" checked={checked} onChange={()=>toggleSelectedCampaignProductKey(key)} />
                                  <span style={{ minWidth:0 }}>
                                    <span style={{ display:"block",fontSize:12,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.product || row.skuCode || "Unnamed Product"}</span>
                                    <span style={{ display:"block",fontSize:10.5,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.brand || "No brand"} · {row.collection || "No collection/category"} · {row.skuCode || ""}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                        <div style={{ padding:"7px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>{campaignRows.length} campaign product row{campaignRows.length!==1?"s":""}</span>
                          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                            {campaignHasOutput&&<button type="button" onClick={saveEcommerceCampaignOutput} style={{ border:"none",background:C.accent,color:"#fff",borderRadius:7,padding:"6px 9px",fontSize:10.5,fontWeight:850,cursor:"pointer" }}>Save Generated Outputs</button>}
                            {campaignRows.length>0&&<button type="button" onClick={clearEcommerceCampaignRows} style={{ border:"none",background:"transparent",color:"#DC2626",fontSize:11,fontWeight:800,cursor:"pointer" }}>Clear Rows</button>}
                          </div>
                        </div>

                        {campaignRows.length===0 ? (
                          <div style={{ padding:14,fontSize:12,color:C.muted,textAlign:"center" }}>No product row yet. Select mapped products above, then click Add Selected or Add All.</div>
                        ) : (
                          <div style={{ overflowX:isMobile?"visible":"auto",WebkitOverflowScrolling:"touch" }}>
                            <div style={{ minWidth:isMobile?0:760 }}>
                              <div style={{ padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                                <span style={{ fontSize:10.5,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>Campaign Product Rows</span>
                              </div>
                              {campaignRows.map((row:any,rowIndex:number)=>(
                                <div key={`${row.id || row.productKey || "campaign-row"}-${rowIndex}`} style={{ margin:10,marginBottom:rowIndex===campaignRows.length-1?10:0,border:`1px solid ${C.border}`,borderRadius:12,background:C.surface,overflow:"hidden" }}>
                                  <div style={{ padding:isMobile?10:12,display:"flex",flexDirection:"column",gap:10 }}>
                                    <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                                      <div style={{ minWidth:0,flex:"1 1 320px" }}>
                                        <p style={{ margin:0,fontSize:12.5,fontWeight:900,color:C.text,lineHeight:1.35 }}>{row.product || "Product"}</p>
                                        <p style={{ margin:"3px 0 0",fontSize:10.5,color:C.muted,lineHeight:1.35 }}>{row.brand || "No brand"} · {row.collection || "No collection/category"} · {row.sku || "No SKU"}</p>
                                        {getCampaignRowProductKeys(row).length>1&&<p style={{ margin:"4px 0 0",fontSize:10.5,color:C.accent,fontWeight:850 }}>{getCampaignRowProductKeys(row).length} products inside this row</p>}
                                      </div>
                                      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"auto auto",alignItems:"center",gap:6,justifyContent:"flex-end",width:isMobile?"100%":"auto" }}>
                                        <button type="button" onClick={()=>generateEcommerceCampaignRow(row.id)} disabled={!!aiBusy.ecommerceCampaign || aiBusy.ecommerceCampaignRow===row.id} style={{ border:"none",background:C.accent,color:"#fff",borderRadius:8,padding:"8px 10px",fontSize:11,fontWeight:850,cursor:(!!aiBusy.ecommerceCampaign || aiBusy.ecommerceCampaignRow===row.id)?"not-allowed":"pointer",opacity:(!!aiBusy.ecommerceCampaign || aiBusy.ecommerceCampaignRow===row.id)?.65:1,width:"100%" }}>{aiBusy.ecommerceCampaignRow===row.id?"Generating":"Generate"}</button>
                                        <button type="button" onClick={()=>deleteEcommerceCampaignRow(row.id,rowIndex)} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:8,padding:"8px 10px",fontSize:11,fontWeight:850,cursor:"pointer",width:"100%" }}>Delete</button>
                                      </div>
                                    </div>
                                    <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(240px,.9fr) minmax(170px,.65fr) minmax(260px,1fr)",gap:10,alignItems:"end" }}>
                                      <Field label="Platform">
                                        <div style={{ minWidth:0,width:"100%" }}>
                                          <Select value={row.platform || campaignBuilder.platform || "All Platforms"} onChange={(value)=>updateEcommerceCampaignRow(row.id,{ platform:value },rowIndex)} style={{ width:"100%",minWidth:0,height:38,fontSize:12,padding:"8px 34px 8px 9px",lineHeight:"20px",borderRadius:8,background:C.surface }}>
                                            {ecommerceCampaignPlatforms.map((platform:string)=><option key={platform} value={platform}>{platform}</option>)}
                                          </Select>
                                        </div>
                                      </Field>
                                      <Field label="Discount / Offer">
                                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                                          <TI value={getCampaignRowDiscountValue(row)} onChange={(value)=>updateEcommerceCampaignRow(row.id,{ discount:value },rowIndex)} placeholder={getCampaignMainPromotionDefault() || "e.g. 20% OFF"} style={{ fontSize:12,padding:"8px 9px" }} />
                                          {!!getCampaignMainPromotionDefault()&&String(row.discount || "").trim()===getCampaignMainPromotionDefault()&&(
                                            <span style={{ fontSize:10.5,color:"#047857",fontWeight:800 }}>Using Main Promotion as default</span>
                                          )}
                                        </div>
                                      </Field>
                                      <Field label="Mechanics / Notes">
                                        <TI value={row.mechanics || ""} onChange={(value)=>updateEcommerceCampaignRow(row.id,{ mechanics:value },rowIndex)} placeholder="e.g. Min spend ₱599" style={{ fontSize:12,padding:"8px 9px" }} />
                                      </Field>
                                    </div>
                                  </div>

                                  {(row.headline || row.subheadline || row.cta || aiBusy.ecommerceCampaignRow===row.id)&&(
                                    <div style={{ margin:"0 10px 10px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                                      <div style={{ padding:"7px 9px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                                        <span style={{ fontSize:11,fontWeight:900,color:C.textSub,textTransform:"uppercase",letterSpacing:".06em" }}>AI Output for this product</span>
                                        {(row.headline || row.subheadline || row.cta)&&(
                                          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                                            <Btn xs onClick={()=>saveEcommerceCampaignRowOutput(row)}>Save Output</Btn>
                                            <Btn xs variant="outline" onClick={()=>copyEcommerceCampaignRowOutput(row)}>Copy</Btn>
                                            <TransferBtn xs id={`campaign-row-send-marketing-${row.id || row.productKey || row.product || "row"}`} onClick={()=>sendEcommerceCampaignRowToMarketing(row)}>Send to Marketing</TransferBtn>
                                            <TransferBtn xs id={`campaign-row-send-dc-${row.id || row.productKey || row.product || "row"}`} onClick={()=>sendEcommerceCampaignRowToDigitalCreative(row)}>Send to DC</TransferBtn>
                                            <TransferBtn xs id={`campaign-row-send-livestream-${row.id || row.productKey || row.product || "row"}`} onClick={()=>sendEcommerceCampaignRowToLivestream(row)}>Send to Livestream</TransferBtn>
                                            <Btn xs variant={campaignOverviewAddedIds.includes(String(row.id || row.productKey || row.product || ""))?"default":"outline"} onClick={()=>addEcommerceCampaignRowToOverview(row)}>{campaignOverviewAddedIds.includes(String(row.id || row.productKey || row.product || ""))?"Added ✓":"Add to Overview"}</Btn>
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:0 }}>
                                        <div style={{ padding:10,borderRight:isMobile?"none":`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:"none" }}>
                                          <p style={{ margin:"0 0 4px",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Headline</p>
                                          <p style={{ margin:0,fontSize:12.5,lineHeight:1.4,color:C.textSub }}>{aiBusy.ecommerceCampaignRow===row.id&&!row.headline?"Generating...":row.headline || "No output yet"}</p>
                                        </div>
                                        <div style={{ padding:10,borderRight:isMobile?"none":`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:"none" }}>
                                          <p style={{ margin:"0 0 4px",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Subheadline</p>
                                          <p style={{ margin:0,fontSize:12.5,lineHeight:1.4,color:C.textSub }}>{aiBusy.ecommerceCampaignRow===row.id&&!row.subheadline?"Generating...":row.subheadline || "No output yet"}</p>
                                        </div>
                                        <div style={{ padding:10 }}>
                                          <p style={{ margin:"0 0 4px",fontSize:10.5,fontWeight:900,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>CTA</p>
                                          <p style={{ margin:0,fontSize:12.5,lineHeight:1.4,color:C.textSub,fontWeight:800 }}>{aiBusy.ecommerceCampaignRow===row.id&&!row.cta?"Generating...":row.cta || "No output yet"}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Field>
                </div>

              </div>

              {aiError.ecommerceCampaign&&<div style={{ marginTop:10,padding:"8px 10px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,color:"#B91C1C",fontWeight:700 }}>{aiError.ecommerceCampaign}</div>}

              <Modal open={campaignInstructionOpen} onClose={()=>setCampaignInstructionOpen(false)} title="AI Output Instructions" width={680}>
                <p style={{ margin:"0 0 10px",fontSize:13,color:C.muted,lineHeight:1.5 }}>Add instructions for the overall output and for each section. These apply to both per-row Generate and Generate All Rows.</p>

                <div style={{ display:"flex",flexDirection:"column",gap:isMobile?12:10,maxHeight:isMobile?"62vh":"none",overflowY:isMobile?"auto":"visible",paddingRight:isMobile?2:0 }}>
                  <Field label="General Instructions">
                    <textarea
                      value={campaignInstructionDraft}
                      onChange={(e)=>setCampaignInstructionDraft(e.target.value)}
                      placeholder="Example: Use Taglish, focus on urgency, make it premium, avoid hard-selling..."
                      rows={4}
                      style={{ width:"100%",minHeight:isMobile?88:undefined,padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",resize:"vertical",boxSizing:"border-box",color:C.text,background:C.surface }}
                    />
                  </Field>

                  <Field label="Headline Instructions">
                    <textarea
                      value={campaignHeadlineInstructionDraft}
                      onChange={(e)=>setCampaignHeadlineInstructionDraft(e.target.value)}
                      placeholder="Example: Maximum 6 words, strong sale hook, mention the campaign theme."
                      rows={3}
                      style={{ width:"100%",minHeight:isMobile?88:undefined,padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",resize:"vertical",boxSizing:"border-box",color:C.text,background:C.surface }}
                    />
                  </Field>

                  <Field label="Subheadline Instructions">
                    <textarea
                      value={campaignSubheadlineInstructionDraft}
                      onChange={(e)=>setCampaignSubheadlineInstructionDraft(e.target.value)}
                      placeholder="Example: Mention the product benefit, discount, or mechanics in one clean sentence."
                      rows={3}
                      style={{ width:"100%",minHeight:isMobile?88:undefined,padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",resize:"vertical",boxSizing:"border-box",color:C.text,background:C.surface }}
                    />
                  </Field>

                  <Field label="CTA Instructions">
                    <textarea
                      value={campaignCtaInstructionDraft}
                      onChange={(e)=>setCampaignCtaInstructionDraft(e.target.value)}
                      placeholder="Example: Keep CTA under 3 words, direct, urgent, marketplace-ready."
                      rows={3}
                      style={{ width:"100%",minHeight:isMobile?88:undefined,padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",resize:"vertical",boxSizing:"border-box",color:C.text,background:C.surface }}
                    />
                  </Field>
                </div>

                <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"auto auto",justifyContent:isMobile?"stretch":"space-between",gap:8,marginTop:14 }}>
                  <Btn variant="outline" onClick={()=>{ setCampaignInstructionDraft(""); setCampaignHeadlineInstructionDraft(""); setCampaignSubheadlineInstructionDraft(""); setCampaignCtaInstructionDraft(""); updateEcommerceCampaignBuilder({ aiInstructions:"", headlineInstructions:"", subheadlineInstructions:"", ctaInstructions:"" }); setCampaignInstructionOpen(false); }}>Clear Instructions</Btn>
                  <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"auto auto",gap:8 }}>
                    <Btn variant="outline" onClick={()=>setCampaignInstructionOpen(false)}>Cancel</Btn>
                    <Btn onClick={saveEcommerceCampaignInstructions}>Save Instructions</Btn>
                  </div>
                </div>
              </Modal>

            </div>

            <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                <div>
                  <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Saved Campaign Outputs</h4>
                  <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>Saved headline, subheadline, and CTA outputs for this E-commerce tab.</p>
                </div>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{campaignSavedOutputs.length} saved</span>
              </div>

              {campaignSavedOutputs.length===0 ? (
                <div style={{ padding:14,border:`1px dashed ${C.border}`,borderRadius:10,fontSize:12,color:C.muted,textAlign:"center" }}>
                  No saved campaign outputs yet. Generate copy, then click Save Output.
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:260,overflowY:"auto",WebkitOverflowScrolling:"touch" }}>
                  {campaignSavedOutputs.map((item:any)=>(
                    <div key={item.id} style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1fr) auto",gap:10,alignItems:"center",padding:"9px 10px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg }}>
                      <button type="button" onClick={()=>openSavedEcommerceOutput(item)} style={{ minWidth:0,textAlign:"left",border:"none",background:"transparent",padding:0,cursor:"pointer" }}>
                        <p style={{ margin:0,fontSize:12,fontWeight:900,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.title || "Campaign Copy"}</p>
                        <p style={{ margin:"2px 0 0",fontSize:10.5,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.platform || campaignBuilder.platform} · {item.theme || campaignTheme} · Click to view</p>
                      </button>
                      <button type="button" onClick={()=>deleteEcommerceCampaignSavedOutput(item.id)} style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:8,padding:"8px 10px",fontSize:10.5,fontWeight:850,cursor:"pointer",width:isMobile?"100%":"auto" }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Modal open={!!savedEcommercePreview} onClose={()=>setSavedEcommercePreview(null)} title={savedEcommercePreview?.title || "Saved Campaign Output"} width={720}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                <p style={{ margin:0,fontSize:12,color:C.muted }}>{savedEcommercePreview?.platform || ""} {savedEcommercePreview?.theme ? `· ${savedEcommercePreview.theme}` : ""}</p>
                <Btn sm variant="outline" onClick={copySavedEcommerceOutput}>Copy</Btn>
              </div>
              <pre style={{ margin:0,padding:14,border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:13,lineHeight:1.55,color:C.textSub,maxHeight:"60vh",overflowY:"auto" }}>{savedEcommercePreview?.text || ""}</pre>
            </Modal>

          </div>

          <div style={{ padding:14,background:"#ECFDF5",border:"1.5px solid #A7F3D0",borderRadius:12 }}>
            <h4 style={{ margin:"0 0 6px",fontSize:13,fontWeight:900,color:"#065F46" }}>Gemini Connected</h4>
            <p style={{ margin:0,fontSize:12,color:"#065F46",lineHeight:1.5 }}>Campaign copy generation is connected through /api/ai/generate-text.</p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.1fr) minmax(0,.9fr)",gap:14 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
              <div>
                <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:900,color:C.text }}>{cfg.title}</h3>
                <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5,maxWidth:680 }}>{cfg.description}</p>
              </div>
              <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 9px" }}>{productRows.length} products</span>
            </div>
            <div style={{ marginTop:12,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:8 }}>
              <div style={{ padding:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9 }}>
                <p style={{ margin:"0 0 3px",fontSize:10,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>Group</p>
                <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{group.groupName}</p>
              </div>
              <div style={{ padding:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9 }}>
                <p style={{ margin:"0 0 3px",fontSize:10,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>Operation</p>
                <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text }}>{lt.label}</p>
              </div>
              <div style={{ padding:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9 }}>
                <p style={{ margin:"0 0 3px",fontSize:10,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>Schedule</p>
                <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text }}>{group.deadline ? (group.deadlineEnd?`${group.deadline} → ${group.deadlineEnd}`:group.deadline) : (Array.isArray(group.monthOnlyMonths)&&group.monthOnlyMonths.length?formatMonthOnlyLabel(group.monthOnlyMonths):"No date")}</p>
              </div>
            </div>
          </div>

          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8 }}>
              <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>{cfg.textLabel}</h4>
              <span style={{ fontSize:10.5,color:C.faint,fontWeight:800,textTransform:"uppercase",letterSpacing:".05em" }}>Interface only</span>
            </div>
            <textarea
              value={data.textPrompt || ""}
              onChange={e=>updateAiWorkspace(tab,{ textPrompt:e.target.value })}
              placeholder={cfg.textPlaceholder}
              rows={5}
              style={{ width:"100%",minHeight:120,resize:"vertical",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
            />
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap",marginTop:10 }}>
              <Btn sm variant="outline" disabled>Save Prompt</Btn>
              <Btn sm variant={actionDone(`overview-${tab}-text`)?"primary":"outline"} onClick={()=>{ addToOverview(tab,`${cfg.title} Text`,data.generatedText || data.textPrompt,"Text Output", { tab, type:"workspaceText" }); markActionDone(`overview-${tab}-text`); }} disabled={!(data.generatedText || data.textPrompt)}>{actionDone(`overview-${tab}-text`)?"✓ Added":"Add to Overview"}</Btn>
              <Btn sm disabled>Generate Text</Btn>
            </div>
          </div>

          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8 }}>
              <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>{cfg.imageLabel}</h4>
              <span style={{ fontSize:10.5,color:C.faint,fontWeight:800,textTransform:"uppercase",letterSpacing:".05em" }}>Interface only</span>
            </div>
            <textarea
              value={tab==="digital" ? (data.dcImagePrompt || "") : (data.imagePrompt || "")}
              onChange={e=>updateAiWorkspace(tab, tab==="digital" ? { dcImagePrompt:e.target.value } : { imagePrompt:e.target.value })}
              placeholder={cfg.imagePlaceholder}
              rows={5}
              style={{ width:"100%",minHeight:120,resize:"vertical",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,outline:"none",fontSize:13,lineHeight:1.5,color:C.text,background:C.surface }}
            />
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:8,marginTop:10 }}>
              <Select value={data.imageRatio || "1:1"} onChange={(v:any)=>updateAiWorkspace(tab,{ imageRatio:v })}>
                <option value="1:1">1:1 Square</option>
                <option value="4:5">4:5 Portrait</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="16:9">16:9 Landscape</option>
              </Select>
              <Select value={data.imageStyle || "photorealistic"} onChange={(v:any)=>updateAiWorkspace(tab,{ imageStyle:v })}>
                <option value="photorealistic">Photorealistic</option>
                <option value="studio">Studio Product</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="ugc">UGC / TikTok Style</option>
              </Select>
              <Btn sm variant={actionDone(`overview-${tab}-image`)?"primary":"outline"} onClick={()=>{ addToOverview(tab,`${cfg.title} Image Prompt`,data.generatedImagePrompt || (tab==="digital" ? data.dcImagePrompt : data.imagePrompt),"Image Prompt", { tab, type:"workspaceImage" }); markActionDone(`overview-${tab}-image`); }} disabled={!(data.generatedImagePrompt || (tab==="digital" ? data.dcImagePrompt : data.imagePrompt))}>{actionDone(`overview-${tab}-image`)?"✓ Added":"Add to Overview"}</Btn>
              <Btn sm disabled>Generate Image</Btn>
            </div>
          </div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <h4 style={{ margin:"0 0 10px",fontSize:13,fontWeight:900,color:C.text }}>Selected Products</h4>
            <div style={{ maxHeight:220,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:9 }}>
              {productRows.slice(0,20).map((row:any,idx:number)=>(
                <div key={`${row.skuCode}-${idx}`} style={{ padding:"8px 10px",borderBottom:idx===Math.min(productRows.length,20)-1?"none":`1px solid ${C.border}`,background:idx%2?C.surface:C.surfaceAlt }}>
                  <p style={{ margin:0,fontSize:12,fontWeight:850,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.product}</p>
                  <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{row.brand || "No brand"} · {row.collection || "No collection/category"} · {row.skuCode}</p>
                </div>
              ))}
              {productRows.length===0&&<div style={{ padding:12,fontSize:12,color:C.faint }}>No selected products yet.</div>}
            </div>
          </div>

          <div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
            <h4 style={{ margin:"0 0 10px",fontSize:13,fontWeight:900,color:C.text }}>Generated Outputs</h4>
            <div style={{ minHeight:150,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:10,padding:16 }}>
              <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5 }}>{cfg.outputHint}<br />When an output is ready, click Add to Overview to collect it in the Overview tab.</p>
            </div>
          </div>

          <div style={{ padding:14,background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:12 }}>
            <h4 style={{ margin:"0 0 6px",fontSize:13,fontWeight:900,color:"#92400E" }}>Next AI Setup</h4>
            <p style={{ margin:0,fontSize:12,color:"#92400E",lineHeight:1.5 }}>This tab is ready for Gemini text generation and image generation connection. Buttons are disabled for now so the interface can be reviewed first.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width:"100%",maxWidth:"100%",minWidth:0,overflowX:"hidden" }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,fontWeight:600,padding:"0 0 10px",display:"flex",alignItems:"center",gap:5 }}>&#8249; All Groups</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
          <div>
            <h2 style={{ margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.text }}>{group.groupName}</h2>
            <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
              <Tag color={groupColor}>{lt.label}</Tag>
              {group.calendarType&&<Tag color={groupColor}>{group.calendarType}</Tag>}
              {group.deadline&&<span style={{ fontSize:11,color:"#8B5CF6",fontWeight:600,background:"#F5F3FF",padding:"2px 8px",borderRadius:4,border:"1px solid #DDD6FE" }}>{group.deadlineEnd?`${group.deadline} → ${group.deadlineEnd}`:`Due ${group.deadline}`}</span>}
              {!group.deadline&&Array.isArray(group.monthOnlyMonths)&&group.monthOnlyMonths.length>0&&<span style={{ fontSize:11,color:"#0F766E",fontWeight:600,background:"#CCFBF1",padding:"2px 8px",borderRadius:4,border:"1px solid #99F6E4" }}>{formatMonthOnlyLabel(group.monthOnlyMonths)}</span>}
            </div>
            {linkedEvents.length>0&&(
              <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginTop:8 }}>
                <span style={{ fontSize:11,color:C.faint,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em" }}>Linked:</span>
                {linkedEvents.map((ev:any)=>(
                  <span key={ev.id} style={{ fontSize:11,color:ev.color||C.muted,background:(ev.color||C.accent)+"12",padding:"2px 8px",borderRadius:4,border:`1px solid ${(ev.color||C.accent)}33` }}>{ev.name}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex",gap:8,flexShrink:0 }}>
            <Btn sm variant="outline" onClick={()=>setGroupEditModal(true)}>Edit Group</Btn>
            <Btn sm variant="outline" onClick={()=>setStatusModal(true)}>Manage Statuses</Btn>
          </div>
        </div>
        {productRows.length>0&&(
          <div style={{ marginTop:14,padding:"12px 14px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Products</span>
              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end" }}>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:999,padding:"2px 8px" }}>{productRows.length} item{productRows.length!==1?"s":""}</span>
                <Btn xs variant="outline" onClick={openProductTableEdit}>Edit Products</Btn>
              </div>
            </div>
            <div style={{ border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden",background:C.surface }}>
              {!isMobile&&(<div style={{ display:"grid",gridTemplateColumns:"minmax(110px,.8fr) minmax(140px,1fr) minmax(210px,1.35fr) minmax(130px,.8fr) minmax(170px,1fr)",gap:10,padding:"7px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>
                <span>Brand</span><span>Category</span><span>Product</span><span>SKU</span><span>Image Link</span>
              </div>)}
              <div style={{ maxHeight:isMobile?220:154,overflowY:"auto",overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
                {productRows.map((row:any,idx:number)=>{
                  const imageLink = row.imageLink || (row.imageLinks || row.links || [])[0] || "";
                  return (
                    <div key={`${row.skuCode}-${idx}`}
                      onClick={()=>openProductDetail(row)}
                      style={{ minWidth:isMobile?0:760,width:"100%",maxWidth:"100%",display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"minmax(110px,.8fr) minmax(140px,1fr) minmax(210px,1.35fr) minmax(130px,.8fr) minmax(170px,1fr)",gap:isMobile?3:10,padding:isMobile?"8px 10px":"8px 10px",background:idx%2?C.surface:C.surfaceAlt,borderBottom:idx===productRows.length-1?"none":`1px solid ${C.border}`,textAlign:"left",cursor:"pointer",overflow:"hidden",alignItems:"center" }}>
                      <div style={{ minWidth:0,fontSize:11,fontWeight:800,color:C.textSub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{isMobile&&<span style={{ color:C.faint,fontWeight:900 }}>Brand: </span>}{row.brand || "No brand"}</div>
                      <div style={{ minWidth:0,fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{isMobile&&<span style={{ color:C.faint,fontWeight:900 }}>Category: </span>}{row.collection || "No collection/category"}</div>
                      <div style={{ minWidth:0,fontSize:11,color:C.text,fontWeight:750,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{isMobile&&<span style={{ color:C.faint,fontWeight:900 }}>Product: </span>}{row.product || "No product"}</div>
                      <div style={{ minWidth:0,fontSize:11,color:C.muted,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{isMobile&&<span style={{ color:C.faint,fontWeight:900,fontFamily:C.font }}>SKU: </span>}{row.skuCode || "—"}</div>
                      <div style={{ minWidth:0,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                        {imageLink ? <a href={imageLink} target="_blank" rel="noreferrer" onClick={(e:any)=>e.stopPropagation()} style={{ color:"#2563EB",fontWeight:750,textDecoration:"underline" }}>Open Link</a> : <span style={{ color:C.faint }}>No link</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {productRows.length>3&&(
                <div style={{ padding:"6px 10px",fontSize:10.5,color:C.faint,fontWeight:700,background:C.surface,borderTop:`1px solid ${C.border}` }}>
                  Scroll for more. Tap a product to view/edit one item, or click Edit Products to update all selected products.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop:14,padding:"12px 14px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <span style={{ fontSize:12,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Overall Progress</span>
            <span style={{ fontSize:13,fontWeight:800,color:C.accent,fontVariantNumeric:"tabular-nums" }}>{overallPct}%</span>
          </div>
          <div style={{ height:6,background:C.border,borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${overallPct}%`,background:groupColor,borderRadius:3,transition:"width .4s" }} /></div>
        </div>
      </div>

      <div style={{ display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:14,WebkitOverflowScrolling:"touch" }}>
        {visibleWorkspaceTabs.map((tab:any)=>(
          <button key={tab.id} onClick={()=>setActiveGroupTab(tab.id)}
            style={{ flexShrink:0,padding:"8px 12px",borderRadius:10,border:`1.5px solid ${activeGroupTab===tab.id?groupColor:C.border}`,background:activeGroupTab===tab.id?groupColor:C.surface,color:activeGroupTab===tab.id?"#fff":C.textSub,cursor:"pointer",textAlign:"left",minWidth:isMobile?132:150 }}>
            <span style={{ display:"block",fontSize:12,fontWeight:900 }}>{tab.label}</span>
            <span style={{ display:"block",fontSize:10,opacity:.78,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{tab.sub}</span>
          </button>
        ))}
      </div>

      {activeGroupTab==="tasks" ? (
        <>
      {/* Dept filter + status legend */}
      <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:16,WebkitOverflowScrolling:"touch" }}>
        {["all",...Object.keys(DEPTS)].map(d=>(<button key={d} onClick={()=>setActiveDept(d)} style={{ padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:activeDept===d?C.accent:C.surface,color:activeDept===d?"#fff":C.muted,border:`1.5px solid ${activeDept===d?C.accent:C.border}`,whiteSpace:"nowrap",flexShrink:0 }}>{d==="all"?"All Depts":DEPTS[d].label}</button>))}
        <div style={{ width:1,background:C.border,margin:"0 6px",flexShrink:0 }} />
        {statuses.map(s=>(<div key={s.id} style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0,padding:"5px 0" }}><div style={{ width:8,height:8,borderRadius:2,background:s.color,flexShrink:0 }} /><span style={{ fontSize:11,color:C.muted,whiteSpace:"nowrap" }}>{s.label}</span></div>))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:activeDept==="all"?"repeat(auto-fill,minmax(min(100%,320px),1fr))":"1fr",gap:16 }}>
        {depts.map(dept=>{
          const di=items[dept], done=di.filter(i=>i.done).length, pct=di.length?Math.round(done/di.length*100):0, dc=DEPTS[dept].color;
          return (
            <div key={dept} style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <div style={{ padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${dc}08,${dc}04)`,borderTop:`3px solid ${dc}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>{DEPTS[dept].label}</span>
                  <span style={{ fontSize:11,color:C.faint,fontVariantNumeric:"tabular-nums",background:C.surface,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.border}` }}>{pct}%</span>
                </div>
                <div style={{ height:4,background:C.border,borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:dc,borderRadius:2,transition:"width .4s" }} /></div>
              </div>
              <div style={{ padding:"10px 12px 4px" }}>
                {di.length===0&&<Empty title="No tasks" sub="Add one below" />}
                {di.map(item=>(<ChecklistItem key={item.id} item={item} dept={dept} statuses={statuses} onUpdate={i=>upd(dept,i)} onDelete={id=>del(dept,id)} />))}
              </div>
              <div style={{ padding:"8px 12px 12px",borderTop:`1px solid ${C.border}`,background:C.bg }}>

                <div style={{ display:"flex",gap:6 }}>
                  <TI value={newText[dept]} onChange={v=>setNewText(p=>({...p,[dept]:v}))} placeholder="Add task..." style={{ flex:1,padding:"8px 10px",fontSize:13 }} />
                  <button onClick={()=>addItem(dept)} style={{ width:36,height:36,background:C.accent,color:"#fff",border:"none",borderRadius:7,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>+</button>

                </div>
              </div>
            </div>
          );
        })}
      </div>
        </>
      ) : (
        renderAiWorkspace(activeGroupTab)
      )}

      <Modal open={productTableEditOpen} onClose={()=>setProductTableEditOpen(false)} title="Edit Selected Products" width={980}>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5 }}>Edit the selected product rows for this checklist group. These changes apply to the selected products only and will save with this checklist type.</p>
          <div style={{ border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",background:C.surface }}>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"150px 140px 190px 140px minmax(220px,1fr)",gap:8,padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:900,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>
              <span>Brand</span><span>Category</span><span>Product</span><span>SKU</span><span>Image Link</span>
            </div>
            <div style={{ maxHeight:420,overflow:"auto",WebkitOverflowScrolling:"touch" }}>
              {productTableDraft.map((row:any,idx:number)=>(
                <div key={`${row.index}-${idx}`} style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"150px 140px 190px 140px minmax(220px,1fr)",gap:8,padding:"8px 10px",borderBottom:idx===productTableDraft.length-1?"none":`1px solid ${C.border}`,alignItems:"center" }}>
                  <Select value={row.brandId||""} onChange={(v:any)=>updateProductTableDraft(idx,{ brandId:v })}>
                    <option value="">No brand</option>
                    {(brands||[]).map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  <TI value={row.collection||""} onChange={(v:any)=>updateProductTableDraft(idx,{ collection:v })} placeholder="Category" />
                  <TI value={row.productName||""} onChange={(v:any)=>updateProductTableDraft(idx,{ productName:v })} placeholder="Product" />
                  <TI value={row.sku||""} onChange={(v:any)=>updateProductTableDraft(idx,{ sku:v })} placeholder="SKU" />
                  <div style={{ display:"flex",gap:6,alignItems:"center",minWidth:0 }}>
                    <TI value={row.imageLink||""} onChange={(v:any)=>updateProductTableDraft(idx,{ imageLink:v })} placeholder="https://..." />
                    {row.imageLink&&<a href={row.imageLink} target="_blank" rel="noreferrer" style={{ flexShrink:0,fontSize:11,fontWeight:800,color:"#2563EB",textDecoration:"underline" }}>Open</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
            <Btn variant="outline" onClick={()=>setProductTableEditOpen(false)}>Cancel</Btn>
            <Btn onClick={saveProductTableEdit}>Save Products</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!productDetail} onClose={()=>{ setProductDetail(null); setProductEdit(null); }} title="Product Details" width={520}>
        {productDetail&&productEdit&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ padding:12,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10 }}>
              <p style={{ margin:"0 0 4px",fontSize:13,fontWeight:800,color:C.text }}>{productDetail.product || productDetail.skuCode}</p>
              <p style={{ margin:0,fontSize:12,color:C.muted }}>{productDetail.brand || "No brand"} · {productDetail.collection || "No collection/category"} · {productDetail.skuCode || "No SKU"}</p>
            </div>
            <Field label="Brand">
              <Select value={productEdit.brandId||""} onChange={(v:any)=>setProductEdit((p:any)=>({...p,brandId:v}))}>
                <option value="">No brand</option>
                {(brands||[]).map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Collection / Category">
              <TI value={productEdit.collection||""} onChange={(v:any)=>setProductEdit((p:any)=>({...p,collection:v}))} placeholder="Collection or category" />
            </Field>
            <Field label="Product">
              <TI value={productEdit.productName||""} onChange={(v:any)=>setProductEdit((p:any)=>({...p,productName:v}))} placeholder="Product name" />
            </Field>
            <Field label="SKU">
              <TI value={productEdit.sku||""} onChange={(v:any)=>setProductEdit((p:any)=>({...p,sku:v}))} placeholder="SKU code" />
            </Field>
            <Field label="Image Link">
              <TI value={productEdit.imageLink||""} onChange={(v:any)=>setProductEdit((p:any)=>({...p,imageLink:v}))} placeholder="https://..." />
            </Field>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
              <Btn variant="outline" onClick={()=>{ setProductDetail(null); setProductEdit(null); }}>Cancel</Btn>
              <Btn onClick={saveProductDetail}>Save Product</Btn>
            </div>
          </div>
        )}
      </Modal>
      <StatusManagerModal open={statusModal} onClose={()=>setStatusModal(false)} statuses={statuses} onChange={saveStatuses} />
      <GroupEditModal open={groupEditModal} group={group} onClose={()=>setGroupEditModal(false)} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} events={events}
        onSave={(patch:any)=>{ if(onUpdateGroup) onUpdateGroup(patch); }} />
    </div>
  );
};

// ─── SKU SELECTOR ────────────────────────────────────────────────────────────
const SKUSelector = ({ onNext, skuStorage, brands, launchTypes, calendarTypes=DEFAULT_EVENT_TYPES, events=[], onApplyPhaseoutAssignments }) => {
  const [skuMode,setSkuMode]     = useState("manual");
  const [skus,setSkus]           = useState([{id:uid(),value:""}]);
  const [selType,setSelType]     = useState(()=>Object.keys(launchTypes||LAUNCH_TYPES)[0] || "introduction");
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
  const [dateMode,setDateMode] = useState("specific");
  const [monthOnlyMonths,setMonthOnlyMonths] = useState<any[]>([]);
  const defaultCalendarType = calendarTypes.find((t:any)=>t.id==="deadline") || calendarTypes[0] || { id:"deadline", label:"Deadline", color:"#8B5CF6" };
  const [calendarType,setCalendarType] = useState(defaultCalendarType.id);
  const [calendarColor,setCalendarColor] = useState(defaultCalendarType.color || "#8B5CF6");
  const [linkedEventIds,setLinkedEventIds] = useState<any[]>([]);
  const [pickedSkus,setPickedSkus] = useState([]);
  const [phaseoutHelperMsg,setPhaseoutHelperMsg] = useState("");
  const addSku=()=>setSkus(p=>[...p,{id:uid(),value:""}]);
  const remSku=id=>setSkus(p=>p.filter(s=>s.id!==id));
  const updSku=(id,v)=>setSkus(p=>p.map(s=>s.id===id?{...s,value:v}:s));
  const pickSku=s=>{ setPickedSkus((p:any[])=>p.find((x:any)=>x.id===s.id)?p.filter((x:any)=>x.id!==s.id):[...p,s]); };
  const toggleLinkedEvent = (id:any) => setLinkedEventIds((prev:any[])=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const finalSkus=skuMode==="storage"?pickedSkus.map((s:any)=>({
    id:uid(),
    sourceId:s.id,
    storageId:s.id,
    skuStorageId:s.id,
    value:s.sku,
    sku:s.sku,
    productName:s.productName,
    collection:s.collection||s.category||s.productCategory||"",
    category:s.collection||s.category||s.productCategory||"",
    productCategory:s.productCategory||s.category||s.collection||"",
    brandId:s.brandId,
    brand:s.brand,
    inventory:s.inventory,
    status:s.status,
    extraFields:s.extraFields||{},
    syncedFromSkuStorage:true,
  })):skus.filter(s=>s.value.trim());
  const phaseoutSourceSkus:any[] = skuMode==="storage"
    ? pickedSkus
    : skus.filter((s:any)=>s.value.trim()).map((s:any)=>({ id:s.id, value:s.value.trim(), sku:s.value.trim(), productName:s.value.trim() }));
  const isPhaseoutType = selType==="phaseout" || (launchTypes?.[selType]?.label || "").toLowerCase().includes("phase-out");
  const selectedCalendarType = calendarTypes.find((t:any)=>t.id===calendarType) || defaultCalendarType;
  const onCalendarTypeChange = (id:any) => {
    const selected = calendarTypes.find((t:any)=>t.id===id) || defaultCalendarType;
    setCalendarType(selected.id);
    if(selected.useColor) setCalendarColor(selected.color || "#8B5CF6");
  };

  const runPhaseoutHelper = async () => {
    if (!phaseoutSourceSkus.length) {
      setPhaseoutHelperMsg("Select at least one SKU first.");
      return;
    }
    if (!events.length) {
      setPhaseoutHelperMsg("No events or seasons available yet.");
      return;
    }

    setPhaseoutHelperMsg("AI is thinking and matching SKUs to the best campaigns...");

    const result = await getPhaseoutAssignmentsSmart(phaseoutSourceSkus,events,brands);
    const assignments = result.assignments || {};
    const ids = Object.keys(assignments);

    if (!ids.length) {
      setPhaseoutHelperMsg("No aligned event found. You can still manually select events below.");
      return;
    }

    setLinkedEventIds((prev:any[])=>Array.from(new Set([...prev,...ids])));
    if (onApplyPhaseoutAssignments) onApplyPhaseoutAssignments(assignments);

    const totalProducts = ids.reduce((sum:number,id:string)=>sum+(assignments[id]?.length||0),0);
    setPhaseoutHelperMsg(`${result.usedAi?"Gemini AI":"Fallback helper"} matched ${totalProducts} phase-out SKU${totalProducts>1?"s":""} to ${ids.length} high-sales event/season card${ids.length>1?"s":""}.`);
  };

  const canNext=finalSkus.length>0&&selType&&groupName.trim();
  return (
    <div>
      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
        <Field label="Group Name"><TI value={groupName} onChange={setGroupName} placeholder="e.g. Quencha Horizon Collection Q3" /></Field>
        <Field label="Operational Type" hint="choose this before SKU/date">
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {Object.entries(launchTypes||LAUNCH_TYPES).map(([k,v]:any)=>(
              <button key={k} onClick={()=>setSelType(k)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",border:`2px solid ${selType===k?C.accent:C.border}`,background:selType===k?C.surfaceAlt:C.surface,transition:"border-color .15s" }}>
                <div><p style={{ margin:0,fontSize:13,fontWeight:700,color:C.text }}>{v.label}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>{v.tag}</p></div>
                <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${selType===k?C.accent:C.border}`,background:selType===k?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{selType===k&&<span style={{ color:"#fff",fontSize:10 }}>&#10003;</span>}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Month Only" hint="optional, no specific date needed">
          <MonthOnlyPicker value={monthOnlyMonths} onChange={(months:any[])=>{ setMonthOnlyMonths(months); setDateMode(months.length?"months":"specific"); if(months.length){ setDeadline(""); setDeadlineEnd(""); } }} />
        </Field>
        <Field label="Calendar Date">
          <DateInput value={deadline} onChange={v=>{ setDeadline(v); if(v){ setDateMode("specific"); setMonthOnlyMonths([]); } }} />
        </Field>
        <Field label="Calendar End Date">
          <DateInput value={deadlineEnd} onChange={v=>{ setDeadlineEnd(v); if(v){ setDateMode("specific"); setMonthOnlyMonths([]); } }} />
        </Field>
        <Field label="Tag / Filter Type">
          <Select value={calendarType} onChange={onCalendarTypeChange}>
            {calendarTypes.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Color">
          <ColorPicker value={calendarColor} onChange={setCalendarColor} palette={EVENT_COLORS} />
        </Field>
        <Field label="SKU Source">
          <div style={{ display:"flex",gap:8 }}>
            {["manual","storage"].map(m=>(<button key={m} onClick={()=>setSkuMode(m)} style={{ flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:skuMode===m?C.accent:C.surface,color:skuMode===m?"#fff":C.muted,border:`1.5px solid ${skuMode===m?C.accent:C.border}` }}>{m==="manual"?"Enter Manually":"From SKU Storage"}</button>))}
          </div>
        </Field>
        {skuMode==="manual"?(
          <Field label="SKU(s)">
            {skus.map((s,i)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={v=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}><button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button><button type="button" onClick={()=>setSkus([{id:uid(),value:""}])} style={{ padding:"7px 14px",fontSize:12,fontWeight:700,borderRadius:7,border:`1px solid #FECACA`,background:"#FEF2F2",cursor:"pointer",color:"#DC2626" }}>Clear SKU</button></div>
          </Field>
        ):(
          <Field label="Search SKU Storage">
            {skuStorage.length===0
              ? <div style={{ padding:"14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No SKUs in storage yet. Go to SKU Storage tab first.</div>
              : <>
                  <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickSku} placeholder="Search by product, SKU, or brand..." multiSelect selectedIds={pickedSkus.map((s:any)=>s.id)} />
                  {pickedSkus.length>0&&(<div style={{ marginTop:8 }}><div style={{ marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}><div style={{ fontSize:11,color:C.muted,fontWeight:700 }}>{pickedSkus.length} selected SKU{pickedSkus.length!==1?"s":""}</div><button type="button" onClick={()=>setPickedSkus([])} style={{ border:`1px solid #FECACA`,background:"#FEF2F2",color:"#DC2626",borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:800,cursor:"pointer",lineHeight:1 }}>Clear SKU</button></div><div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:96,overflowY:"auto",paddingRight:4,alignContent:"flex-start" }}>{pickedSkus.map(s=>(<div key={s.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"3px 7px",background:C.surfaceAlt,borderRadius:6,border:`1px solid ${C.border}`,lineHeight:1 }}><span style={{ fontSize:10,fontFamily:"monospace",fontWeight:800,color:C.text,whiteSpace:"nowrap" }}>{s.sku}</span><button onClick={()=>setPickedSkus(p=>p.filter(x=>x.id!==s.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:12,lineHeight:1,padding:0 }}>&#215;</button></div>))}</div></div>)}
                </>
            }
          </Field>
        )}
        {isPhaseoutType&&(
          <div style={{ padding:14,background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <div>
                <p style={{ margin:0,fontSize:12,fontWeight:800,color:"#92400E" }}>AI Phase-Out Helper</p>
                <p style={{ margin:"3px 0 0",fontSize:11,color:"#B45309" }}>
                  Uses sales potential, brand, product type, category, campaign intent, and seasonality to choose high-sales event matches.
                </p>
              </div>
              <Btn sm onClick={runPhaseoutHelper} disabled={phaseoutSourceSkus.length===0 || events.length===0}>AI Match SKUs</Btn>
            </div>
            {phaseoutHelperMsg&&<p style={{ margin:0,fontSize:12,color:"#92400E",fontWeight:700 }}>{phaseoutHelperMsg}</p>}
          </div>
        )}

        <Field label="Link Events / Seasons" hint="optional">
          {events.length===0 ? (
            <div style={{ padding:"12px 14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No events or seasons available yet.</div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,220px),1fr))",gap:8 }}>
              {events.map((ev:any)=>{ const active=linkedEventIds.includes(ev.id); return (
                <button key={ev.id} type="button" onClick={()=>toggleLinkedEvent(ev.id)}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,textAlign:"left",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${active?(ev.color||C.accent):C.border}`,background:active?(ev.color||C.accent)+"12":C.surface,cursor:"pointer" }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0,fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.name}</p>
                    <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>{ev.date || ev.type}</p>
                  </div>
                  <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${active?(ev.color||C.accent):C.border}`,background:active?(ev.color||C.accent):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{active&&<span style={{ color:"#fff",fontSize:9 }}>&#10003;</span>}</div>
                </button>
              );})}
            </div>
          )}
        </Field>

        <Btn full onClick={()=>onNext({skus:finalSkus,launchType:selType,groupName,deadline:monthOnlyMonths.length?"":deadline,deadlineEnd:monthOnlyMonths.length?"":deadlineEnd,dateMode:monthOnlyMonths.length?"months":"specific",monthOnlyMonths:monthOnlyMonths.length?monthOnlyMonths:[],calendarType,calendarColor,linkedEventIds})} disabled={!canNext}>Generate Checklists &#8250;</Btn>
      </div>
    </div>
  );
};

// ─── GROUP EDIT MODAL ────────────────────────────────────────────────────────
const GroupEditModal = ({ open, group, onClose, onSave, skuStorage, brands, launchTypes, calendarTypes=DEFAULT_EVENT_TYPES, events=[], onApplyPhaseoutAssignments }: any) => {
  const [skuMode,setSkuMode]     = useState("manual");
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
  const [dateMode,setDateMode] = useState("specific");
  const [monthOnlyMonths,setMonthOnlyMonths] = useState<any[]>([]);
  const defaultCalendarType = calendarTypes.find((t:any)=>t.id==="deadline") || calendarTypes[0] || { id:"deadline", label:"Deadline", color:"#8B5CF6" };
  const [calendarType,setCalendarType] = useState(defaultCalendarType.id);
  const [calendarColor,setCalendarColor] = useState(defaultCalendarType.color || "#8B5CF6");
  const [launchType,setLaunchType] = useState("introduction");
  const [linkedEventIds,setLinkedEventIds] = useState<any[]>([]);
  const [skus,setSkus] = useState<any[]>([]);
  const [pickedSkus,setPickedSkus] = useState<any[]>([]);
  const [phaseoutHelperMsg,setPhaseoutHelperMsg] = useState("");
  const originalSkuIds = useMemo(()=>new Set((group?.skus || []).map((item:any)=>item.id || item.value || item.sku).filter(Boolean)),[group]);

  useEffect(()=>{
    if(group){
      const existingSkus = group.skus?.length ? group.skus : [{id:uid(),value:""}];
      const storageMatches = (group.skus||[])
        .map((g:any)=>skuStorage.find((s:any)=>s.id===g.id || s.sku===g.value))
        .filter(Boolean);
      const useStorageMode = !!group.skus?.length && storageMatches.length === group.skus.length;

      setGroupName(group.groupName||"");
      setDeadline(group.deadline||"");
      setDeadlineEnd(group.deadlineEnd||"");
      const existingMonths = Array.isArray(group.monthOnlyMonths) ? group.monthOnlyMonths : (Array.isArray(group.months) ? group.months : []);
      setMonthOnlyMonths(existingMonths);
      setDateMode(group.dateMode || (existingMonths.length && !group.deadline ? "months" : "specific"));
      const loadedCalendarType = group.calendarType || group.eventType || "deadline";
      const matchedCalendarType = calendarTypes.find((t:any)=>t.id===loadedCalendarType) || defaultCalendarType;
      setCalendarType(loadedCalendarType || matchedCalendarType.id);
      setCalendarColor(group.calendarColor || group.color || matchedCalendarType.color || "#8B5CF6");
      setLinkedEventIds(Array.isArray(group.linkedEventIds)?group.linkedEventIds:[]);
      const availableTypes = Object.keys(launchTypes||LAUNCH_TYPES); setLaunchType((group.launchType&&availableTypes.includes(group.launchType)) ? group.launchType : (availableTypes[0]||"introduction"));
      setSkus(existingSkus);
      setPickedSkus(useStorageMode ? storageMatches : []);
      setSkuMode(useStorageMode ? "storage" : "manual");
      setPhaseoutHelperMsg("");
    }
  },[group,skuStorage]);

  const addSku=()=>setSkus((p:any)=>[...p,{id:uid(),value:""}]);
  const remSku=(id:string)=>setSkus((p:any)=>p.filter((s:any)=>s.id!==id));
  const updSku=(id:string,v:string)=>setSkus((p:any)=>p.map((s:any)=>s.id===id?{...s,value:v}:s));
  const pickSku=(s:any)=>{ setPickedSkus((p:any[])=>p.find((x:any)=>x.id===s.id)?p.filter((x:any)=>x.id!==s.id):[...p,s]); };
  const toggleLinkedEvent = (id:any) => setLinkedEventIds((prev:any[])=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const finalSkus = skuMode==="storage" ? pickedSkus.map((s:any)=>({id:s.id,value:s.sku,sku:s.sku,productName:s.productName,collection:s.collection||s.category||s.productCategory||"",category:s.collection||s.category||s.productCategory||"",brandId:s.brandId,inventory:s.inventory,status:s.status,extraFields:s.extraFields||{}})) : skus.filter((s:any)=>s.value.trim());
  const phaseoutSourceSkus:any[] = skuMode==="storage"
    ? pickedSkus
    : skus.filter((s:any)=>s.value.trim()).map((s:any)=>({ id:s.id, value:s.value.trim(), sku:s.value.trim(), productName:s.value.trim() }));
  const isPhaseoutType = launchType==="phaseout" || (launchTypes?.[launchType]?.label || "").toLowerCase().includes("phase-out");
  const canSave = finalSkus.length>0 && groupName.trim();
  const onCalendarTypeChange = (id:any) => {
    const selected = calendarTypes.find((t:any)=>t.id===id) || defaultCalendarType;
    setCalendarType(selected.id);
    if(selected.useColor) setCalendarColor(selected.color || "#8B5CF6");
  };

  const runPhaseoutHelper = async () => {
    if (!phaseoutSourceSkus.length) {
      setPhaseoutHelperMsg("Select at least one SKU first.");
      return;
    }
    if (!events.length) {
      setPhaseoutHelperMsg("No events or seasons available yet.");
      return;
    }

    setPhaseoutHelperMsg("AI is thinking and matching SKUs to the best campaigns...");

    const result = await getPhaseoutAssignmentsSmart(phaseoutSourceSkus,events,brands);
    const assignments = result.assignments || {};
    const ids = Object.keys(assignments);

    if (!ids.length) {
      setPhaseoutHelperMsg("No aligned event found. You can still manually select events below.");
      return;
    }

    setLinkedEventIds((prev:any[])=>Array.from(new Set([...prev,...ids])));
    if (onApplyPhaseoutAssignments) onApplyPhaseoutAssignments(assignments);

    const totalProducts = ids.reduce((sum:number,id:string)=>sum+(assignments[id]?.length||0),0);
    setPhaseoutHelperMsg(`${result.usedAi?"Gemini AI":"Fallback helper"} matched ${totalProducts} phase-out SKU${totalProducts>1?"s":""} to ${ids.length} high-sales event/season card${ids.length>1?"s":""}.`);
  };

  if(!group) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Group" width={520}>
      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
        <Field label="Group Name"><TI value={groupName} onChange={setGroupName} placeholder="e.g. Quencha Horizon Collection Q3" /></Field>
        <Field label="Month Only" hint="optional, no specific date needed">
          <MonthOnlyPicker value={monthOnlyMonths} onChange={(months:any[])=>{ setMonthOnlyMonths(months); setDateMode(months.length?"months":"specific"); if(months.length){ setDeadline(""); setDeadlineEnd(""); } }} />
        </Field>
        <Field label="Calendar Date">
          <DateInput value={deadline} onChange={v=>{ setDeadline(v); if(v){ setDateMode("specific"); setMonthOnlyMonths([]); } }} />
        </Field>
        <Field label="Calendar End Date">
          <DateInput value={deadlineEnd} onChange={v=>{ setDeadlineEnd(v); if(v){ setDateMode("specific"); setMonthOnlyMonths([]); } }} />
        </Field>
        <Field label="Tag / Filter Type">
          <Select value={calendarType} onChange={onCalendarTypeChange}>
            {calendarTypes.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Color">
          <ColorPicker value={calendarColor} onChange={setCalendarColor} palette={EVENT_COLORS} />
        </Field>
        <Field label="SKU Source">
          <div style={{ display:"flex",gap:8 }}>
            {["manual","storage"].map(m=>(<button key={m} onClick={()=>setSkuMode(m)} style={{ flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:skuMode===m?C.accent:C.surface,color:skuMode===m?"#fff":C.muted,border:`1.5px solid ${skuMode===m?C.accent:C.border}` }}>{m==="manual"?"Enter Manually":"From SKU Storage"}</button>))}
          </div>
        </Field>
        {skuMode==="manual"?(
          <Field label="SKU(s)">
            {skus.map((s:any,i:number)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={(v:string)=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}><button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button><button type="button" onClick={()=>setSkus([{id:uid(),value:""}])} style={{ padding:"7px 14px",fontSize:12,fontWeight:700,borderRadius:7,border:`1px solid #FECACA`,background:"#FEF2F2",cursor:"pointer",color:"#DC2626" }}>Clear SKU</button></div>
          </Field>
        ):(
          <Field label="Search SKU Storage">
            {skuStorage.length===0
              ? <div style={{ padding:"14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No SKUs in storage yet. Go to SKU Storage tab first.</div>
              : <>
                  <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickSku} placeholder="Search by product, SKU, or brand..." multiSelect selectedIds={pickedSkus.map((s:any)=>s.id)} />
                  {pickedSkus.length>0&&(<div style={{ marginTop:8 }}><div style={{ marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}><div style={{ fontSize:11,color:C.muted,fontWeight:700 }}>{pickedSkus.length} selected SKU{pickedSkus.length!==1?"s":""} · {pickedSkus.filter((s:any)=>!originalSkuIds.has(s.id)&&!originalSkuIds.has(s.sku)).length} new</div><button type="button" onClick={()=>setPickedSkus([])} style={{ border:`1px solid #FECACA`,background:"#FEF2F2",color:"#DC2626",borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:800,cursor:"pointer",lineHeight:1 }}>Clear SKU</button></div><div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:96,overflowY:"auto",paddingRight:4,alignContent:"flex-start" }}>{pickedSkus.map((s:any)=>{ const isNew=!originalSkuIds.has(s.id)&&!originalSkuIds.has(s.sku); return (<div key={s.id} title={`${isNew?"New SKU · ":""}${s.productName} · ${s.sku}`} style={{ display:"inline-flex",alignItems:"center",gap:5,maxWidth:"100%",padding:"3px 7px",background:isNew?"#ECFDF5":C.surfaceAlt,borderRadius:6,border:`1px solid ${isNew?"#86EFAC":C.border}`,lineHeight:1 }}><span style={{ fontSize:10,fontFamily:"monospace",fontWeight:800,color:C.text,whiteSpace:"nowrap" }}>{s.sku}</span>{isNew&&<span style={{ fontSize:9,fontWeight:900,color:"#047857",background:"#D1FAE5",border:"1px solid #A7F3D0",borderRadius:999,padding:"1px 5px",lineHeight:1 }}>NEW</span>}<button onClick={()=>setPickedSkus((p:any)=>p.filter((x:any)=>x.id!==s.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:12,lineHeight:1,padding:0 }}>&#215;</button></div>);})}</div></div>)}
                </>
            }
          </Field>
        )}
        {isPhaseoutType&&(
          <div style={{ padding:14,background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <div>
                <p style={{ margin:0,fontSize:12,fontWeight:800,color:"#92400E" }}>AI Phase-Out Helper</p>
                <p style={{ margin:"3px 0 0",fontSize:11,color:"#B45309" }}>
                  New SKUs show a green NEW badge. AI Match uses sales potential, brand, category, campaign intent, and seasonality. It will not force SKUs into unrelated events.
                </p>
              </div>
              <Btn sm onClick={runPhaseoutHelper} disabled={phaseoutSourceSkus.length===0 || events.length===0}>AI Match SKUs</Btn>
            </div>
            {phaseoutHelperMsg&&<p style={{ margin:0,fontSize:12,color:"#92400E",fontWeight:700 }}>{phaseoutHelperMsg}</p>}
          </div>
        )}

        <Field label="Linked Events / Seasons" hint="optional">
          {events.length===0 ? (
            <div style={{ padding:"10px 12px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No events or seasons available yet.</div>
          ) : (
            <div style={{
              maxHeight:240,
              overflowY:"auto",
              border:`1.5px solid ${C.border}`,
              borderRadius:10,
              background:C.surface,
              WebkitOverflowScrolling:"touch"
            }}>
              <div style={{ position:"sticky",top:0,zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"8px 10px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase",letterSpacing:".04em" }}>{linkedEventIds.length} selected</span>
                <span style={{ fontSize:11,color:C.faint }}>{events.length} events/seasons</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column" }}>
                {events.map((ev:any)=>{ const active=linkedEventIds.includes(ev.id); const evColor=ev.color||C.accent; return (
                  <button key={ev.id} type="button" onClick={()=>toggleLinkedEvent(ev.id)}
                    style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,textAlign:"left",padding:"8px 10px",border:"none",borderBottom:`1px solid ${C.border}`,background:active?evColor+"10":C.surface,cursor:"pointer" }}>
                    <div style={{ minWidth:0,display:"flex",alignItems:"center",gap:8,flex:1 }}>
                      <span style={{ width:6,height:26,borderRadius:999,background:active?evColor:C.border,flexShrink:0 }} />
                      <div style={{ minWidth:0,flex:1 }}>
                        <p style={{ margin:0,fontSize:12,fontWeight:750,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.name}</p>
                        <p style={{ margin:"1px 0 0",fontSize:10.5,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ev.date || ev.type || "No date"}</p>
                      </div>
                    </div>
                    <div style={{ width:17,height:17,borderRadius:"50%",border:`2px solid ${active?evColor:C.border}`,background:active?evColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{active&&<span style={{ color:"#fff",fontSize:9 }}>&#10003;</span>}</div>
                  </button>
                );})}
              </div>
            </div>
          )}
        </Field>

        <Field label="Operational Type" hint="changing this will load the default tasks for the selected type">
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {Object.entries(launchTypes||LAUNCH_TYPES).map(([k,v]:any)=>(
              <button key={k} onClick={()=>setLaunchType(k)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",border:`2px solid ${launchType===k?C.accent:C.border}`,background:launchType===k?C.surfaceAlt:C.surface,transition:"border-color .15s" }}>
                <div><p style={{ margin:0,fontSize:13,fontWeight:700,color:C.text }}>{v.label}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>{v.tag}</p></div>
                <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${launchType===k?C.accent:C.border}`,background:launchType===k?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{launchType===k&&<span style={{ color:"#fff",fontSize:10 }}>&#10003;</span>}</div>
              </button>
            ))}
          </div>
        </Field>
        {group?.launchType!==launchType&&(
          <div style={{ padding:"10px 12px",borderRadius:9,background:"#FFFBEB",border:"1px solid #FDE68A",fontSize:12,color:"#92400E",lineHeight:1.45 }}>
            Changing the operational type will replace this group's checklist items with the default tasks from the selected type.
          </div>
        )}
        <Btn full onClick={()=>{ onSave({groupName:groupName.trim(),deadline:monthOnlyMonths.length?"":deadline,deadlineEnd:monthOnlyMonths.length?"":deadlineEnd,dateMode:monthOnlyMonths.length?"months":"specific",monthOnlyMonths:monthOnlyMonths.length?monthOnlyMonths:[],calendarType,calendarColor,launchType,skus:finalSkus,linkedEventIds}); onClose(); }} disabled={!canSave}>Save Changes</Btn>
      </div>
    </Modal>
  );
};

// ─── TEMPLATE MANAGER ────────────────────────────────────────────────────────
const TemplateManagerModal = ({ open, onClose, templates, onChange, launchTypes, onLaunchTypesChange }) => {
  const [launchType,setLaunchType] = useState(()=>Object.keys(launchTypes||LAUNCH_TYPES)[0] || "introduction");
  const [dept,setDept]             = useState("ecommerce");
  const [editIdx,setEditIdx]       = useState(null);
  const [editText,setEditText]     = useState("");
  const [newText,setNewText]       = useState("");
  const [typeLabel,setTypeLabel]   = useState("");
  const [typeTag,setTypeTag]       = useState("");
  const [typeColor,setTypeColor]   = useState("#111827");
  const [draftTasks,setDraftTasks] = useState<any[]>([]);
  const [tasksDirty,setTasksDirty] = useState(false);

  const typeKeys = Object.keys(launchTypes||LAUNCH_TYPES);

  useEffect(()=>{
    const keys = Object.keys(launchTypes||LAUNCH_TYPES);
    if(!keys.length) return;
    if(!keys.includes(launchType)) setLaunchType(keys[0]);
  },[launchTypes]);

  useEffect(()=>{
    const current = (launchTypes||LAUNCH_TYPES)[launchType];
    if(current){
      setTypeLabel(current.label||"");
      setTypeTag(current.tag||"");
      setTypeColor(current.color||"#111827");
    }
  },[launchType,launchTypes]);

  useEffect(()=>{
    const currentList = templates?.[launchType]?.[dept] || [];
    setDraftTasks([...currentList]);
    setTasksDirty(false);
    setEditIdx(null);
    setNewText("");
  },[open,launchType,dept,templates]);

  const updateChecklistTypeField = (patch:any) => {
    onLaunchTypesChange((prev:any)=>({
      ...prev,
      [launchType]: {
        ...(prev[launchType] || {}),
        label:typeLabel || "Checklist Type",
        tag:typeTag || "Custom",
        color:typeColor || "#111827",
        ...patch,
      },
    }));
  };

  const makeEmptyTemplateSet = () => Object.keys(DEPTS).reduce((acc:any,deptKey:string)=>({ ...acc, [deptKey]:[] }),{});
  const list = draftTasks;

  const updateList = next => {
    setDraftTasks(next);
    setTasksDirty(true);
  };

  const saveDefaultTasksChanges = () => {
    onChange((prev:any) => ({
      ...prev,
      [launchType]: { ...(prev[launchType] || makeEmptyTemplateSet()), [dept]: draftTasks },
    }), launchType);
    setTasksDirty(false);
    setEditIdx(null);
  };

  const saveChecklistType = () => {
    if(!typeLabel.trim()) return;
    onLaunchTypesChange((prev:any)=>({
      ...prev,
      [launchType]: {
        ...(prev[launchType] || {}),
        label:typeLabel || "Checklist Type",
        tag:typeTag || "Custom",
        color:typeColor || "#111827",
      },
    }));
  };

  const addChecklistType = () => {
    const id = uid();
    const label = "New Checklist Type";
    onLaunchTypesChange((prev:any)=>({
      ...prev,
      [id]: { label, tag:"Custom", color:"#111827" },
    }));
    onChange((prev:any)=>({
      ...prev,
      [id]: makeEmptyTemplateSet(),
    }));
    setLaunchType(id);
    setEditIdx(null);
  };

  const duplicateChecklistType = () => {
    const id = uid();
    const current = (launchTypes||LAUNCH_TYPES)[launchType] || { label:"Checklist Type", tag:"Custom", color:"#111827" };
    onLaunchTypesChange((prev:any)=>({
      ...prev,
      [id]: { ...current, label:`${current.label} Copy` },
    }));
    onChange((prev:any)=>({
      ...prev,
      [id]: JSON.parse(JSON.stringify(prev[launchType] || makeEmptyTemplateSet())),
    }));
    setLaunchType(id);
    setEditIdx(null);
  };

  const deleteChecklistType = () => {
    const keys = Object.keys(launchTypes||LAUNCH_TYPES);
    if(keys.length<=1) return;
    const nextKey = keys.find(k=>k!==launchType) || keys[0];

    onLaunchTypesChange((prev:any)=>{
      const next = { ...prev };
      delete next[launchType];
      return next;
    });
    onChange((prev:any)=>{
      const next = { ...prev };
      delete next[launchType];
      return next;
    });
    setLaunchType(nextKey);
    setEditIdx(null);
  };

  const addItem = () => {
    if (!newText.trim()) return;
    updateList([...list, newText.trim()]);
    setNewText("");
  };
  const startEdit = (i) => { setEditIdx(i); setEditText(list[i]); };
  const saveEdit = () => {
    if (!editText.trim()) return;
    updateList(list.map((t,i)=>i===editIdx?editText.trim():t));
    setEditIdx(null);
  };
  const removeItem = i => updateList(list.filter((_,idx)=>idx!==i));
  const moveItem = (i,dir) => {
    const j = i+dir;
    if (j<0 || j>=list.length) return;
    const next = [...list];
    [next[i],next[j]] = [next[j],next[i]];
    updateList(next);
  };
  const resetToDefault = () => {
    const defaultLaunchType = launchType === "reactivation" ? "introduction" : launchType;
    updateList([...(TEMPLATES[defaultLaunchType]?.[dept] || [])]);
    setEditIdx(null);
  };

  return (
    <Modal open={open} onClose={()=>{onClose();setEditIdx(null);}} title="Manage Checklist Templates" width={660}>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <Field label="Checklist Type">
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <Select value={launchType} onChange={v=>{setLaunchType(v);setEditIdx(null);}}>
                {typeKeys.map(k=><option key={k} value={k}>{(launchTypes||LAUNCH_TYPES)[k]?.label || k}</option>)}
              </Select>
            </div>
            <Btn sm variant="outline" onClick={addChecklistType}>+ Add Type</Btn>
          </div>
        </Field>

        <div style={{ padding:12,background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}`,display:"flex",flexDirection:"column",gap:10 }}>
          <p style={{ margin:0,fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Checklist Type Settings</p>
          <Field label="Name">
            <TI value={typeLabel} onChange={v=>{ setTypeLabel(v); updateChecklistTypeField({ label:v || "Checklist Type" }); }} placeholder="e.g. Product Launch, Monthly Campaign, Clearance Sale" />
          </Field>
          <Field label="Tag">
            <TI value={typeTag} onChange={v=>{ setTypeTag(v); updateChecklistTypeField({ tag:v || "Custom" }); }} placeholder="e.g. New Launch, Relaunch, Custom" />
          </Field>
          <Field label="Color">
            <ColorPicker value={typeColor} onChange={v=>{ setTypeColor(v); updateChecklistTypeField({ color:v }); }} palette={STATUS_PALETTE} />
          </Field>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"#16A34A",fontWeight:700 }}>Type settings autosave</span>
            <Btn sm onClick={saveChecklistType}>Save Type</Btn>
            <Btn sm variant="outline" onClick={duplicateChecklistType}>Duplicate Type</Btn>
            <Btn sm variant="danger" onClick={deleteChecklistType} disabled={typeKeys.length<=1}>Delete Type</Btn>
          </div>
        </div>

        <Field label="Department">
          <Select value={dept} onChange={v=>{setDept(v);setEditIdx(null);}}>
            {Object.keys(DEPTS).map(k=><option key={k} value={k}>{DEPTS[k].label}</option>)}
          </Select>
        </Field>

        <Divider />

        <p style={{ margin:0,fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>
          Default Tasks ({list.length})
        </p>

        <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:320,overflowY:"auto" }}>
          {list.map((t,i)=>(
            <div key={i}>
              {editIdx===i ? (
                <div style={{ padding:10,background:C.bg,borderRadius:9,border:`1.5px solid ${C.border}` }}>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <textarea
                      value={editText}
                      onChange={e=>setEditText(e.target.value)}
                      onInput={(e:any)=>{ e.currentTarget.style.height="auto"; e.currentTarget.style.height=e.currentTarget.scrollHeight+"px"; }}
                      placeholder="Task description"
                      rows={3}
                      style={{
                        width:"100%",
                        minHeight:96,
                        resize:"vertical",
                        overflow:"hidden",
                        padding:"12px 14px",
                        fontSize:14,
                        lineHeight:1.5,
                        borderRadius:9,
                        border:`1.8px solid ${C.borderStrong}`,
                        background:C.surface,
                        color:C.text,
                        outline:"none",
                        whiteSpace:"pre-wrap",
                      }}
                    />
                    <div style={{ display:"flex",gap:8,justifyContent:"flex-start",flexWrap:"wrap" }}>
                      <Btn sm onClick={saveEdit} disabled={!editText.trim()}>Save</Btn>
                      <Btn sm variant="outline" onClick={()=>setEditIdx(null)}>Cancel</Btn>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"9px 10px",background:C.surfaceAlt,borderRadius:8,border:`1px solid ${C.border}` }}>
                  <span style={{ flex:1,fontSize:12.5,color:C.textSub,lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word" }}>{t}</span>
                  <div style={{ display:"flex",gap:3,flexShrink:0 }}>
                    <button onClick={()=>moveItem(i,-1)} disabled={i===0} style={{ width:22,height:22,borderRadius:5,background:"none",border:`1px solid ${C.border}`,cursor:i===0?"not-allowed":"pointer",color:C.muted,opacity:i===0 ? .4 : 1,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8593;</button>
                    <button onClick={()=>moveItem(i,1)} disabled={i===list.length-1} style={{ width:22,height:22,borderRadius:5,background:"none",border:`1px solid ${C.border}`,cursor:i===list.length-1?"not-allowed":"pointer",color:C.muted,opacity:i===list.length-1 ? .4 : 1,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8595;</button>
                    <button onClick={()=>startEdit(i)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.muted }}>Edit</button>
                    <button onClick={()=>removeItem(i)} style={{ width:22,height:22,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {list.length===0&&<p style={{ fontSize:12,color:C.faint,textAlign:"center",padding:"10px 0" }}>No default tasks for this combination.</p>}
        </div>

        <div style={{ padding:12,background:C.bg,borderRadius:10,border:`1.5px dashed ${C.border}` }}>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <textarea
              value={newText}
              onChange={e=>setNewText(e.target.value)}
              onInput={(e:any)=>{ e.currentTarget.style.height="auto"; e.currentTarget.style.height=e.currentTarget.scrollHeight+"px"; }}
              placeholder="Add a new default task..."
              rows={2}
              style={{
                width:"100%",
                minHeight:72,
                resize:"vertical",
                overflow:"hidden",
                padding:"12px 14px",
                fontSize:14,
                lineHeight:1.5,
                borderRadius:9,
                border:`1.5px solid ${C.border}`,
                background:C.surface,
                color:C.text,
                outline:"none",
                whiteSpace:"pre-wrap",
              }}
            />
            <div style={{ display:"flex",justifyContent:"flex-end" }}>
              <Btn sm onClick={addItem} disabled={!newText.trim()}>Add</Btn>
            </div>
          </div>
        </div>

        <Divider />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <span style={{ fontSize:11,color:tasksDirty?"#B45309":C.faint,fontWeight:tasksDirty?700:400 }}>
            {tasksDirty ? "Default task changes are pending. Click Save Changes to update existing checklist groups too." : "Default tasks are saved and synced to current checklist groups."}
          </span>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <Btn sm variant="outline" onClick={resetToDefault}>Reset Tasks to Default</Btn>
            <Btn sm onClick={saveDefaultTasksChanges} disabled={!tasksDirty}>Save Changes</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── CHECKLIST VIEW ──────────────────────────────────────────────────────────
const ChecklistView = ({ onGroupCreated, skuStorage, brands, seasonalEvents, setSeasonalEvents, calendarTypes=DEFAULT_EVENT_TYPES, navigateToGroupId, navigateToGroupTab="tasks", onGroupNavigated, onStateChange, onRouteChange, groups, setGroups, allGroupItems, setAllGroupItems, statuses, setStatuses }: any) => {
  const [active,setActive]     = useState(null);
  const [creating,setCreating] = useState(false);
  const [editingGroup,setEditingGroup] = useState(null);

  const persistChecklistItemsNow = (nextItems:any) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("emdc_app_state_v1");
      const parsed = raw ? parseEmdcJson(raw) : {};
      localStorage.setItem("emdc_app_state_v1", JSON.stringify({
        ...(parsed || {}),
        checklistItems:nextItems,
      }));
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const persistChecklistStatusesNow = (nextStatuses:any[]) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("emdc_app_state_v1");
      const parsed = raw ? parseEmdcJson(raw) : {};
      localStorage.setItem("emdc_app_state_v1", JSON.stringify({
        ...(parsed || {}),
        checklistStatuses:nextStatuses,
      }));
      markEmdcLocalStateUpdated();
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  };

  const updateGroupItems = (groupId:string, items:any) => {
    setAllGroupItems((p:any)=>{
      const next={...(p||{}),[groupId]:items};
      writeEmdcChecklistItemsBackup(groupId,items);
      persistChecklistItemsNow(next);
      if(onStateChange) onStateChange({checklistItems:next});
      return next;
    });
  };
  const updateStatuses = (s:any[]) => {
    setStatuses(s);
    persistChecklistStatusesNow(s);
    if(onStateChange) onStateChange({checklistStatuses:s});
  };
  const [launchTypes,setLaunchTypes] = useState<any>(() => {
    if (typeof window === "undefined") return mergeChecklistLaunchTypesWithDefaults(null);
    try {
      const raw = localStorage.getItem("emdc_checklist_launch_types_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      return mergeChecklistLaunchTypesWithDefaults(parsed);
    } catch {}
    return mergeChecklistLaunchTypesWithDefaults(null);
  });
  const [templates,setTemplates]   = useState<any>(() => {
    if (typeof window === "undefined") return mergeChecklistTemplatesWithDefaults(null);
    try {
      const raw = localStorage.getItem("emdc_checklist_templates_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      return mergeChecklistTemplatesWithDefaults(parsed);
    } catch {}
    return mergeChecklistTemplatesWithDefaults(null);
  });
  const [templatesModal,setTemplatesModal] = useState(false);
  const navRef = useRef(null);

  useEffect(()=>{
    if(!navigateToGroupId) return;
    const exists = (groups||[]).some((g:any)=>g.id===navigateToGroupId);
    if(exists) {
      setActive(navigateToGroupId);
      if(onGroupNavigated) onGroupNavigated();
    }
  },[navigateToGroupId,groups,onGroupNavigated]);

  const buildChecklistItemsFromTemplates = (launchTypeKey:string, nextTemplates:any, existingItems:any=null) => {
    const out:any = {};
    Object.keys(DEPTS).forEach((deptKey:string)=>{
      const templateList = nextTemplates?.[launchTypeKey]?.[deptKey] || [];
      const existingList = Array.isArray(existingItems?.[deptKey]) ? existingItems[deptKey] : [];
      const oldTemplateItems = existingList.filter((item:any)=>!item?.custom);

      out[deptKey] = templateList.map((text:string,idx:number)=>{
        const sameText = oldTemplateItems.find((item:any)=>String(item.text||"").trim()===String(text||"").trim());
        const sameIndex = oldTemplateItems[idx];
        const source = sameText || sameIndex || {};

        return {
          id: source.id || uid(),
          text,
          done: !!source.done,
          link: source.link || "",
          note: source.note || "",
          assignee: source.assignee || "",
          statusId: source.statusId || "",
          custom:false,
        };
      });

      // Leave only tasks that were added inside the checklist group unchanged.
      // Everything from the default template is replaced by the latest saved default task list.
      const customItems = existingList.filter((item:any)=>item?.custom);
      customItems.forEach((item:any)=>{
        if (!out[deptKey].some((nextItem:any)=>nextItem.id===item.id)) {
          out[deptKey].push({ ...item, custom:true });
        }
      });
    });
    return out;
  };

  const syncChecklistItemsForTemplates = (nextTemplates:any, targetLaunchType:any=null) => {
    setAllGroupItems((prev:any)=>{
      const nextItems:any = { ...(prev||{}) };
      (groups||[]).forEach((group:any)=>{
        if(!group?.id || !group?.launchType) return;
        if(targetLaunchType && group.launchType!==targetLaunchType) return;
        nextItems[group.id] = buildChecklistItemsFromTemplates(group.launchType,nextTemplates,nextItems[group.id] || prev?.[group.id]);
      });
      if(onStateChange) onStateChange({checklistItems:nextItems});
      try {
        window.dispatchEvent(new Event("emdc-local-sync"));
      } catch {}
      return nextItems;
    });
  };

  const updateTemplatesAndChecklistItems = (updater:any,targetLaunchType:any=null) => {
    setTemplates((prev:any)=>{
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Do the checklist-item sync from the same saved template payload.
      syncChecklistItemsForTemplates(next,targetLaunchType);
      return next;
    });
  };

  const updateLaunchTypesAndSync = (updater:any) => {
    setLaunchTypes((prev:any)=>{
      const next = typeof updater === "function" ? updater(prev) : updater;
      if(onStateChange) onStateChange({checklistLaunchTypes:next});
      return next;
    });
  };

  useEffect(()=>{
    try {
      localStorage.setItem("emdc_checklist_launch_types_v1", JSON.stringify(launchTypes));
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  },[launchTypes]);

  useEffect(()=>{
    try {
      localStorage.setItem("emdc_checklist_templates_v1", JSON.stringify(templates));
      window.dispatchEvent(new Event("emdc-local-sync"));
    } catch {}
  },[templates]);

  const applyPhaseoutAssignments = (assignments:any) => {
    if(!assignments || !setSeasonalEvents) return;
    setSeasonalEvents((prev:any[])=>{
      const next = (prev||[]).map((ev:any)=>{
        const matched = assignments[ev.id] || [];
        if(!matched.length) return ev;

        const existingProducts = Array.isArray(ev.products) ? ev.products : [];
        const additions = matched
          .map((sku:any)=>phaseoutProductLabel(sku,brands))
          .filter(Boolean)
          .filter((label:string)=>!existingProducts.some((p:any)=>String(p).toLowerCase()===label.toLowerCase()));

        return additions.length ? { ...ev, products:[...existingProducts,...additions] } : ev;
      });
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
  };

  const cleanupPhaseoutProductsForGroup = (group:any) => {
    if(!group || !setSeasonalEvents) return;

    const typeLabel = (launchTypes?.[group.launchType]?.label || group.launchType || "").toLowerCase();
    const isDeletedPhaseoutGroup = group.launchType==="phaseout" || typeLabel.includes("phase-out") || typeLabel.includes("phaseout");
    if(!isDeletedPhaseoutGroup) return;

    const labelsToRemove = new Set(
      (group.skus || [])
        .map((item:any)=>{
          const matchedSku = skuStorage.find((sku:any)=>sku.id===item.id || sku.sku===item.value || sku.sku===item.sku);
          return phaseoutProductLabel(matchedSku || { value:item.value || item.sku || item.productName }, brands).toLowerCase().trim();
        })
        .filter(Boolean)
    );

    if(!labelsToRemove.size) return;

    setSeasonalEvents((prev:any[])=>{
      const next = (prev||[]).map((ev:any)=>{
        const products = Array.isArray(ev.products) ? ev.products : [];
        const cleaned = products.filter((product:any)=>!labelsToRemove.has(String(product||"").toLowerCase().trim()));
        return cleaned.length === products.length ? ev : { ...ev, products:cleaned };
      });
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
  };

  const createGroup = cfg=>{
    const g={id:uid(),...cfg};
    const initialItems = buildChecklistItemsFromTemplates(g.launchType,templates,null);

    setGroups((p:any)=>{ const next=[...p,g]; if(onStateChange) onStateChange({checklistGroups:next}); return next; });
    setAllGroupItems((p:any)=>{ const next={...p,[g.id]:initialItems}; writeEmdcChecklistItemsBackup(g.id,initialItems); persistChecklistItemsNow(next); if(onStateChange) onStateChange({checklistItems:next}); return next; });

    if(onGroupCreated) onGroupCreated(g);
    setActive(g.id);
    if(onRouteChange) onRouteChange({ tab:"checklists", groupId:g.id, groupTab:"tasks" });
    setCreating(false);
  };
  const deleteGroup = id=>{
    const groupToDelete = groups.find((g:any)=>g.id===id);
    cleanupPhaseoutProductsForGroup(groupToDelete);

    setGroups((p:any)=>{
      const next=p.filter((g:any)=>g.id!==id);
      if(onStateChange) onStateChange({checklistGroups:next, deletedGroupIds:[id]});
      return next;
    });

    setAllGroupItems((prev:any)=>{
      if(!prev || !prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      try { if (typeof window !== "undefined") localStorage.removeItem(getEmdcChecklistItemsBackupKey(id)); } catch {}
      persistChecklistItemsNow(next);
      if(onStateChange) onStateChange({checklistItems:next});
      return next;
    });

    if(active===id) {
      setActive(null);
      if(onRouteChange) onRouteChange({ tab:"checklists", groupId:null, groupTab:"tasks" });
    }
  };

  const updateGroup = (id:string, patch:any) => {
    const currentGroup = groups.find((g:any)=>g.id===id);
    const typeChanged = !!patch?.launchType && currentGroup?.launchType !== patch.launchType;

    setGroups((p:any)=>{
      const next=p.map((g:any)=>g.id===id?{...g,...patch}:g);
      if (patch?.aiWorkspace) writeEmdcGroupWorkspaceBackup(id,patch.aiWorkspace);
      try {
        const raw = localStorage.getItem("emdc_app_state_v1");
        const parsed = raw ? parseEmdcJson(raw) : {};
        localStorage.setItem("emdc_app_state_v1", JSON.stringify({
          ...(parsed || {}),
          checklistGroups:mergeChecklistGroupsWithWorkspaceBackups(next),
        }));
        markEmdcLocalStateUpdated();
        window.dispatchEvent(new Event("emdc-local-sync"));
      } catch {}
      if(onStateChange) onStateChange({checklistGroups:next});
      return next;
    });

    if(typeChanged){
      cleanupPhaseoutProductsForGroup(currentGroup);

      const freshItems = buildChecklistItemsFromTemplates(patch.launchType,templates,null);
      setAllGroupItems((prev:any)=>{
        const next = { ...prev, [id]: freshItems };
        writeEmdcChecklistItemsBackup(id,freshItems);
        persistChecklistItemsNow(next);
        if(onStateChange) onStateChange({checklistItems:next});
        return next;
      });
    }
  };
  const activeGroup = groups.find((g:any)=>g.id===active);

  if(activeGroup) return <ChecklistBoard group={activeGroup} onBack={()=>{ setActive(null); if(onRouteChange) onRouteChange({ tab:"checklists", groupId:null, groupTab:"tasks" }); }} skuStorage={skuStorage} brands={brands} templates={templates} launchTypes={launchTypes} events={seasonalEvents||[]} onStateChange={onStateChange} initialGroupTab={navigateToGroupTab} onGroupTabChange={(groupTab:any)=>{ if(onRouteChange) onRouteChange({ tab:"checklists", groupId:activeGroup.id, groupTab }); }} initialItems={allGroupItems[activeGroup.id]||null} onItemsChange={(items:any)=>updateGroupItems(activeGroup.id,items)} statuses={statuses} setStatuses={updateStatuses} onUpdateGroup={(patch:any)=>updateGroup(activeGroup.id,patch)} />;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8 }}>
        <p style={{ margin:0,fontSize:13,color:C.muted }}>{groups.length===0?"No checklist groups yet.":`${groups.length} group${groups.length>1?"s":""}`}</p>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="outline" onClick={()=>setTemplatesModal(true)}>Manage Templates</Btn>
          {!creating&&<Btn onClick={()=>setCreating(true)}>+ New Group</Btn>}
        </div>
      </div>

      <TemplateManagerModal open={templatesModal} onClose={()=>setTemplatesModal(false)} templates={templates} onChange={updateTemplatesAndChecklistItems} launchTypes={launchTypes} onLaunchTypesChange={updateLaunchTypesAndSync} />
      <GroupEditModal open={!!editingGroup} group={editingGroup} onClose={()=>setEditingGroup(null)} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} calendarTypes={calendarTypes} events={seasonalEvents||[]} onApplyPhaseoutAssignments={applyPhaseoutAssignments}
        onSave={(patch:any)=>updateGroup(editingGroup.id,patch)} />

      {creating&&(
        <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>New Checklist Group</h3>
            <button onClick={()=>setCreating(false)} style={{ width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>&#215;</button>
          </div>
          <SKUSelector onNext={createGroup} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} calendarTypes={calendarTypes} events={seasonalEvents||[]} onApplyPhaseoutAssignments={applyPhaseoutAssignments} />
        </div>
      )}

      {groups.length===0&&!creating?(
        <div style={{ background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12 }}>
          <Empty title="No checklist groups" sub="Create a group by selecting SKUs and an operational type." action={<Btn onClick={()=>setCreating(true)}>+ New Group</Btn>} />
        </div>
      ):(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:12 }}>
          {groups.map(g=>{ const lt=launchTypes[g.launchType] || LAUNCH_TYPES[g.launchType] || { label:"Checklist", tag:"Custom", color:C.accent }; const groupColor=g.calendarColor||lt?.color||C.accent; const completedDeptBadges=(()=>{ const gItems=allGroupItems?.[g.id] || {}; const deptOrder=["ecommerce","marketing","digital"]; return deptOrder.filter((dept:string)=>Array.isArray(gItems[dept]) && gItems[dept].length>0 && gItems[dept].every((item:any)=>!!item.done)).map((dept:string)=>({ id:dept, label:(DEPTS as any)?.[dept]?.label || dept })); })(); return (
            <div key={g.id} className="emdc-card" style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,borderLeft:`4px solid ${groupColor}`,cursor:"pointer",transition:"box-shadow .2s",overflow:"hidden",minWidth:0 }} onClick={()=>{ setActive(g.id); if(onRouteChange) onRouteChange({ tab:"checklists", groupId:g.id, groupTab:"tasks" }); }}>
              <div style={{ padding:"16px",minWidth:0 }}>
                <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",alignItems:"flex-start",gap:8,marginBottom:10,minWidth:0 }}>
                  <p style={{ margin:0,fontSize:14,fontWeight:700,color:C.text,minWidth:0,lineHeight:1.25,overflowWrap:"anywhere",wordBreak:"break-word" }}>{g.groupName}</p>
                  <div style={{ display:"flex",gap:4,flexShrink:0,alignItems:"center",justifyContent:"flex-end" }}>
                    <button onClick={e=>{e.stopPropagation();setEditingGroup(g);}} style={{ padding:"3px 8px",borderRadius:5,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600,whiteSpace:"nowrap" }}>Edit</button>
                    <button onClick={e=>{e.stopPropagation();deleteGroup(g.id);}} style={{ width:24,height:24,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>&#215;</button>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <Tag color={groupColor} sm>{lt.label}</Tag>
                  {g.calendarType&&<Tag color={groupColor} sm>{(calendarTypes.find((t:any)=>t.id===g.calendarType)?.label)||g.calendarType}</Tag>}
                  {g.deadline&&<span style={{ fontSize:10,color:"#8B5CF6",fontWeight:600,background:"#F5F3FF",padding:"1px 7px",borderRadius:4,border:"1px solid #DDD6FE" }}>{g.deadlineEnd?`${g.deadline} → ${g.deadlineEnd}`:`Due ${g.deadline}`}</span>}
                  {!g.deadline&&Array.isArray(g.monthOnlyMonths)&&g.monthOnlyMonths.length>0&&<span style={{ fontSize:10,color:"#0F766E",fontWeight:600,background:"#CCFBF1",padding:"1px 7px",borderRadius:4,border:"1px solid #99F6E4" }}>{formatMonthOnlyLabel(g.monthOnlyMonths)}</span>}
                  {(g.linkedEventIds||[]).length>0&&<span style={{ fontSize:10,color:"#0F766E",fontWeight:600,background:"#CCFBF1",padding:"1px 7px",borderRadius:4,border:"1px solid #99F6E4" }}>{(g.linkedEventIds||[]).length} linked event{(g.linkedEventIds||[]).length>1?"s":""}</span>}
                </div>
                {completedDeptBadges.length>0&&(
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:8 }}>
                    {completedDeptBadges.map((dept:any)=>(
                      <span key={dept.id} title={`${dept.label} checklist completed`} style={{ fontSize:10,color:"#166534",fontWeight:800,background:"#DCFCE7",padding:"2px 7px",borderRadius:5,border:"1px solid #86EFAC",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:".01em" }}>
                        &#10003; {dept.label}
                      </span>
                    ))}
                  </div>
                )}
                {(()=>{ const gItems=allGroupItems[g.id]; if(gItems){ const all=Object.values(gItems).flat() as any[]; const done=all.filter((i:any)=>i.done).length; const pct=all.length?Math.round(done/all.length*100):0; return (<div style={{ marginTop:10 }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}><span style={{ fontSize:10,color:C.muted }}>Progress</span><span style={{ fontSize:10,fontWeight:700,color:C.accent }}>{done}/{all.length} · {pct}%</span></div><div style={{ height:4,background:C.border,borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:pct===100?"#22C55E":groupColor,borderRadius:2,transition:"width .3s" }} /></div></div>); } return <p style={{ margin:"10px 0 0",fontSize:11,color:C.faint }}>3 departments · tap to view</p>; })()}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

// ─── SKU STORAGE ─────────────────────────────────────────────────────────────
const DEFAULT_GLOBAL_SKU_TABLE_COLUMNS = [
  { key:"brand",       label:"Brand",      base:true },
  { key:"sku",         label:"SKU",        base:true },
  { key:"collection",  label:"Category",   base:true },
  { key:"tag",         label:"Tag",        base:true },
  { key:"productName", label:"Product",    base:true },
  { key:"srp",         label:"SRP",        base:true },
  { key:"imageLink",   label:"Image Link", base:true },
];

// Keep SKU Storage in the original/default table layout.
// This intentionally ignores any previously saved column arrangement that may have broken the UI.
const sanitizeSkuTableColumns = (columns:any[] = []) => DEFAULT_GLOBAL_SKU_TABLE_COLUMNS;

const SKUStorage = ({ brands, setBrands, skuStorage, setSkuStorage, onStateChange, skuTableColumns:controlledSkuTableColumns, setSkuTableColumns:controlledSetSkuTableColumns }) => {
  const { isMobile } = useBreakpoint();
  const [activeBrand,setActiveBrand]     = useState(null);
  const [skuModal,setSkuModal]           = useState(false);
  const [bulkModal,setBulkModal]         = useState(false);
  const [bulkMode,setBulkMode]           = useState<"paste"|"edit">("paste");
  const [bulkSearch,setBulkSearch]       = useState("");
  const [bulkEditBrandId,setBulkEditBrandId] = useState<any>(null);
  const [brandModal,setBrandModal]       = useState(false);
  const [editBrandModal,setEditBrandModal] = useState(false);
  const [editBrandForm,setEditBrandForm]   = useState(null);
  const [editSkuId,setEditSkuId]         = useState(null);
  const [showSidebar,setShowSidebar]     = useState(!isMobile);
  const [bForm,setBForm] = useState({name:"",color:"#111827"});
  const [sForm,setSForm] = useState({brandId:"",productName:"",collection:"",sku:"",inventory:"",status:"active",customStatus:"",tag:""});
  const DEFAULT_SKU_TABLE_COLUMNS = DEFAULT_GLOBAL_SKU_TABLE_COLUMNS;
  const SKU_TABLE_BASE_COLUMN_ALIASES:any = {
    product:{ key:"productName", label:"Product", base:true },
    productname:{ key:"productName", label:"Product", base:true },
    name:{ key:"productName", label:"Product", base:true },
    sku:{ key:"sku", label:"SKU", base:true },
    skucode:{ key:"sku", label:"SKU", base:true },
    brand:{ key:"brand", label:"Brand", base:true },
    collection:{ key:"collection", label:"Category", base:true },
    category:{ key:"collection", label:"Category", base:true },
    stock:{ key:"inventory", label:"Stock", base:true },
    inventory:{ key:"inventory", label:"Stock", base:true },
    qty:{ key:"inventory", label:"Stock", base:true },
    status:{ key:"status", label:"Status", base:true },
    tag:{ key:"tag", label:"Tag", base:true },
    tags:{ key:"tag", label:"Tag", base:true },
    srp:{ key:"srp", label:"SRP", base:true },
    price:{ key:"srp", label:"SRP", base:true },
    sellingprice:{ key:"srp", label:"SRP", base:true },
    imagelink:{ key:"imageLink", label:"Image Link", base:true },
    imageurl:{ key:"imageLink", label:"Image Link", base:true },
    image:{ key:"imageLink", label:"Image Link", base:true },
    link:{ key:"imageLink", label:"Image Link", base:true },
    url:{ key:"imageLink", label:"Image Link", base:true },
  };
  const [internalSkuTableColumns,setInternalSkuTableColumns] = useState<any[]>(DEFAULT_SKU_TABLE_COLUMNS);
  const skuTableColumns = DEFAULT_SKU_TABLE_COLUMNS;
  const setSkuTableColumns = controlledSetSkuTableColumns || setInternalSkuTableColumns;
  const [skuNewColumn,setSkuNewColumn] = useState("");
  const [skuColumnDragIndex,setSkuColumnDragIndex] = useState<number|null>(null);
  const [skuRowDragId,setSkuRowDragId] = useState<any>(null);
  const [skuTableEditMode,setSkuTableEditMode] = useState(false);
  const SKU_COLUMN_WIDTH_SETTINGS_KEY = "emdc_sku_column_width_settings_v1";
  const DEFAULT_SKU_COLUMN_WIDTHS:any = { brand:160, sku:170, collection:160, tag:150, productName:280, srp:110, imageLink:300, inventory:100, status:140 };
  const loadSkuColumnWidthSettings = () => {
    if(typeof window === "undefined") return { mode:"manual", widths:DEFAULT_SKU_COLUMN_WIDTHS };
    try {
      const parsed = JSON.parse(localStorage.getItem(SKU_COLUMN_WIDTH_SETTINGS_KEY) || "{}");
      return {
        mode:["manual","content","equal"].includes(parsed?.mode) ? parsed.mode : "manual",
        widths:{ ...DEFAULT_SKU_COLUMN_WIDTHS, ...(parsed?.widths || {}) },
      };
    } catch {
      return { mode:"manual", widths:DEFAULT_SKU_COLUMN_WIDTHS };
    }
  };
  const [skuColumnWidthMode,setSkuColumnWidthMode] = useState<any>(()=>loadSkuColumnWidthSettings().mode);
  const [skuColumnWidths,setSkuColumnWidths] = useState<any>(()=>loadSkuColumnWidthSettings().widths);
  useEffect(()=>{
    if(typeof window === "undefined") return;
    try { localStorage.setItem(SKU_COLUMN_WIDTH_SETTINGS_KEY, JSON.stringify({ mode:skuColumnWidthMode, widths:skuColumnWidths })); } catch {}
  },[skuColumnWidthMode,skuColumnWidths]);
  const [skuSearch,setSkuSearch] = useState("");
  const deferredSkuSearch = useDeferredValue(skuSearch);
  const [activeSkuTag,setActiveSkuTag] = useState("all");
  const DEFAULT_BULK_COLUMNS = [
    { key:"brand",       label:"Brand",      placeholder:"Quencha",                          locked:true },
    { key:"sku",         label:"SKU",        placeholder:"QNH-COOL12-TP",                    locked:true },
    { key:"collection",  label:"Category",   placeholder:"Cooler",                           locked:true },
    { key:"tag",         label:"Tag",        placeholder:"Phase Out",                        locked:true },
    { key:"productName", label:"Product",    placeholder:"12L,Sand",                         locked:true },
    { key:"srp",         label:"SRP",        placeholder:"1799",                             locked:true },
    { key:"imageLink",   label:"Image Link", placeholder:"https://ph-live.staticflickr.com/", locked:true },
  ];
  const [bulkColumns,setBulkColumns] = useState<any[]>(DEFAULT_BULK_COLUMNS);
  const [bulkNewColumn,setBulkNewColumn] = useState("");
  const [bulkEditColumnNames,setBulkEditColumnNames] = useState(false);
  const [bulkDragIndex,setBulkDragIndex] = useState<number|null>(null);
  const [bulkActiveCell,setBulkActiveCell] = useState<any>(null);
  const [bulkSelection,setBulkSelection] = useState<any>(null);
  const [bulkSelecting,setBulkSelecting] = useState(false);
  const [bulkSelectedRows,setBulkSelectedRows] = useState<any[]>([]);
  const [bulkLastSelectedRow,setBulkLastSelectedRow] = useState<number|null>(null);
  const bulkCellRefs = useRef<any>({});
  useEffect(()=>{
    const stop = () => setBulkSelecting(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  },[]);
  const BULK_COLUMNS = bulkColumns;
  const BULK_FIELDS = BULK_COLUMNS.map(c=>c.key);
  const newBulkRow = (data:any={}) => ({ id:uid(), productName:"", sku:"", brand:"", collection:"", inventory:"", status:"", ...data });
  const makeBulkRows = (count:number=8) => Array.from({length:count},()=>newBulkRow());
  const [bulkGridRows,setBulkGridRows] = useState<any[]>(()=>makeBulkRows(8));
  const [bulkError,setBulkError] = useState("");
  const [bulkRenderLimit,setBulkRenderLimit] = useState(80);
  const skuStorageSaveTimer = useRef<any>(null);
  const skuBrandsSaveTimer = useRef<any>(null);

  useEffect(()=>{
    return () => {
      if(skuStorageSaveTimer.current) clearTimeout(skuStorageSaveTimer.current);
      if(skuBrandsSaveTimer.current) clearTimeout(skuBrandsSaveTimer.current);
    };
  },[]);

  const scheduleSkuStorageSave = (next:any[]) => {
    if(!onStateChange) return;
    if(skuStorageSaveTimer.current) clearTimeout(skuStorageSaveTimer.current);
    skuStorageSaveTimer.current = setTimeout(()=>onStateChange({ skuItems: next }), 650);
  };

  const scheduleSkuBrandsSave = (next:any[]) => {
    if(!onStateChange) return;
    if(skuBrandsSaveTimer.current) clearTimeout(skuBrandsSaveTimer.current);
    skuBrandsSaveTimer.current = setTimeout(()=>onStateChange({ skuBrands: next }), 650);
  };

  const commitSkuStorage = (updater:any, immediate:boolean=false) => {
    setSkuStorage((prev:any[]) => {
      const nextRaw = typeof updater === "function" ? updater(prev) : updater;
      const next = Array.isArray(nextRaw) ? nextRaw : [];

      // Protect user-entered SKU Storage before any app/cloud save runs.
      // This separate key survives page/code updates and is used as the local source of truth.
      rememberProtectedSkuItems(next,"sku-storage-commit");

      if(onStateChange){
        if(immediate) {
          if(skuStorageSaveTimer.current) clearTimeout(skuStorageSaveTimer.current);
          onStateChange({ skuItems: next });
        } else {
          scheduleSkuStorageSave(next);
        }
      }
      try { window.dispatchEvent(new Event("emdc-local-sync")); } catch {}
      return next;
    });
  };
  const commitBrands = (updater:any, immediate:boolean=false) => {
    setBrands((prev:any[]) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if(onStateChange){
        if(immediate) {
          if(skuBrandsSaveTimer.current) clearTimeout(skuBrandsSaveTimer.current);
          onStateChange({ skuBrands: next });
        } else {
          scheduleSkuBrandsSave(next);
        }
      }
      return next;
    });
  };
  const brandById = useMemo(()=>{
    const map:any = {};
    (brands||[]).forEach((brand:any)=>{ map[brand.id] = brand; });
    return map;
  },[brands]);

  const skuCountByBrandId = useMemo(()=>{
    const counts:any = {};
    (skuStorage||[]).forEach((sku:any)=>{ counts[sku.brandId] = (counts[sku.brandId] || 0) + 1; });
    return counts;
  },[skuStorage]);

  const skuTagOptions = useMemo(()=>{
    const byKey:any = {};
    (skuStorage||[]).forEach((sku:any)=>{
      getSkuTags(sku).forEach((tag:string)=>{
        const key = normalizeSkuTagKey(tag);
        if(!key) return;
        if(!byKey[key]) byKey[key] = { key, label:prettySkuTagLabel(tag), count:0 };
        byKey[key].count += 1;
      });
    });
    return Object.values(byKey).sort((a:any,b:any)=>String(a.label).localeCompare(String(b.label)));
  },[skuStorage]);

  const filteredSkus = useMemo(() => {
    const brandFiltered = activeBrand ? skuStorage.filter((s:any)=>s.brandId===activeBrand) : skuStorage;
    const tagFiltered = activeSkuTag==="all" ? brandFiltered : brandFiltered.filter((s:any)=>hasSkuTag(s,activeSkuTag));
    const terms = deferredSkuSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if(!terms.length) return tagFiltered;

    return tagFiltered.filter((s:any)=>{
      const brandName = brandById[s.brandId]?.name || "";
      const statusLabel = s.status==="active" ? "active" : s.status==="nostocks" ? "no stocks out of stock sold out" : (s.customStatus || "custom");
      const tagText = getSkuTags(s).join(" ");
      const extraText = Object.values(s.extraFields || {}).join(" ");
      const searchable = [
        s.productName,
        s.sku,
        brandName,
        s.collection,
        s.category,
        s.inventory,
        s.srp,
        s.imageLink,
        s.imageUrl,
        s.status,
        statusLabel,
        tagText,
        extraText,
      ].filter(Boolean).join(" ").toLowerCase();

      return terms.every((term:string)=>searchable.includes(term));
    });
  }, [activeBrand,activeSkuTag,skuStorage,deferredSkuSearch,brandById]);
  const collectionOptions = useMemo(() => Array.from(new Set(
    skuStorage
      .filter(s => !sForm.brandId || s.brandId===sForm.brandId)
      .map(s => (s.collection||"").trim())
      .filter(Boolean)
  )).sort((a:any,b:any)=>a.localeCompare(b)), [skuStorage,sForm.brandId]);
  const getSkuGroupLabel = (s:any) => {
    const direct = [s.collection,s.category,s.productCategory].map(v=>String(v||"").trim()).find(Boolean);
    if(direct) return direct;

    const extra = s.extraFields || {};
    const norm = (value:any) => String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
    const matchedKey = Object.keys(extra).find((key:string)=>{
      const clean = norm(key);
      return clean==="collection" || clean==="category" || clean.includes("collection") || clean.includes("category");
    });
    const extraValue = matchedKey ? String(extra[matchedKey]||"").trim() : "";
    return extraValue || "Uncategorized";
  };

  const groupedSkus = useMemo(() => {
    const groups:any[] = [];
    const byKey:any = {};
    filteredSkus.forEach((s:any) => {
      const label = getSkuGroupLabel(s);
      if (!byKey[label]) { byKey[label] = { label, skus: [] }; groups.push(byKey[label]); }
      byKey[label].skus.push(s);
    });
    return groups.sort((a:any,b:any)=>{
      if(a.label==="Uncategorized") return 1;
      if(b.label==="Uncategorized") return -1;
      return a.label.localeCompare(b.label);
    });
  }, [filteredSkus]);
  const activeBrandObj = brandById[activeBrand];
  const bulkEditBrandObj = brandById[bulkEditBrandId];
  const addBrand  = ()=>{ if(!bForm.name.trim()) return; commitBrands((p:any[])=>[...p,{id:uid(),name:bForm.name.trim(),color:"#111827"}]); setBForm({name:"",color:"#111827"}); setBrandModal(false); };
  const openEditBrand = b=>{ setEditBrandForm({...b}); setEditBrandModal(true); };
  const saveEditBrand = ()=>{ if(!editBrandForm.name.trim()) return; commitBrands((p:any[])=>p.map((b:any)=>b.id===editBrandForm.id?{...editBrandForm}:b)); setEditBrandModal(false); setEditBrandForm(null); };
  const delBrand  = id=>{ commitBrands((p:any[])=>p.filter((b:any)=>b.id!==id)); if(activeBrand===id) setActiveBrand(null); };
  const openAdd   = ()=>{ setSForm({brandId:activeBrand||brands[0]?.id||"",productName:"",collection:"",sku:"",inventory:"",status:"active",customStatus:"",tag:""}); setEditSkuId(null); setSkuModal(true); };
  const openEdit  = s=>{ setSForm({brandId:s.brandId,productName:s.productName,collection:s.collection||"",sku:s.sku,inventory:String(s.inventory),status:s.status,customStatus:s.customStatus||"",tag:getSkuTags(s).join(", ")}); setEditSkuId(s.id); setSkuModal(true); };
  const saveSku   = ()=>{
    if(!sForm.productName.trim()||!sForm.sku.trim()) return;
    const baseSku={id:editSkuId||uid(),brandId:sForm.brandId||activeBrand||brands[0]?.id||"",productName:sForm.productName.trim(),collection:sForm.collection.trim(),sku:sForm.sku.trim(),inventory:parseInt(sForm.inventory)||0,status:sForm.status,customStatus:sForm.customStatus.trim()};
    const e=setSkuTagsOnItem(baseSku,sForm.tag);
    if(editSkuId) commitSkuStorage((p:any[])=>p.map((s:any)=>s.id===editSkuId?e:s), true); else commitSkuStorage((p:any[])=>[...p,e], true);
    setSkuModal(false);
  };
  const delSku = id=>commitSkuStorage((p:any[])=>p.filter((s:any)=>s.id!==id), true);
  const normalizeKey = (v:any) => String(v||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");

  const BULK_PLACEHOLDERS:any = {
    brand:"Quencha",
    sku:"QNH-COOL12-TP",
    collection:"Cooler",
    tag:"Phase Out",
    productName:"12L,Sand",
    srp:"1799",
    imageLink:"https://ph-live.staticflickr.com/",
    inventory:"50",
    status:"Active",
  };
  const buildBulkColumnsFromSkuTable = (cols:any[]=skuTableColumns) => cols.map((col:any)=>({
    key:col.key,
    label:col.label,
    placeholder:BULK_PLACEHOLDERS[col.key]||"",
    locked:!col.custom,
    custom:!!col.custom,
    base:!!col.base,
  }));
  const buildBulkRowsForColumns = (cols:any[], count:number=8) => Array.from({length:count},()=>{
    const row:any = { id:uid() };
    cols.forEach((col:any)=>{ row[col.key] = ""; });
    return row;
  });
  const syncBulkColumnsFromSkuTable = () => {
    const nextColumns = buildBulkColumnsFromSkuTable();
    setBulkColumns(nextColumns);
    setBulkGridRows(buildBulkRowsForColumns(nextColumns,8));
    setBulkError("");
    setBulkSelection(null);
    setBulkSelectedRows([]);
    setBulkActiveCell(null);
  };
  const toggleSkuTableEditMode = () => {
    if (skuTableEditMode) syncBulkColumnsFromSkuTable();
    setSkuTableEditMode(v=>!v);
  };

  const uniqueSkuTableColumnKey = (label:string, cols:any[]=skuTableColumns) => {
    const base=`extra_${normalizeKey(label)||"column"}`;
    const used=new Set(cols.map((c:any)=>c.key));
    let key=base, n=2;
    while(used.has(key)){ key=`${base}_${n}`; n++; }
    return key;
  };
  const addSkuTableColumn = () => {
    const label=skuNewColumn.trim()||`Extra Column ${skuTableColumns.filter((c:any)=>c.custom).length+1}`;
    const baseCol=SKU_TABLE_BASE_COLUMN_ALIASES[normalizeKey(label)];
    if(baseCol && !skuTableColumns.some((c:any)=>c.key===baseCol.key)){
      setSkuTableColumns((p:any[])=>[...p,baseCol]);
      setSkuNewColumn("");
      return;
    }
    const col={ key:uniqueSkuTableColumnKey(label), label, custom:true };
    setSkuTableColumns((p:any[])=>[...p,col]);
    setSkuNewColumn("");
  };
  const renameSkuTableColumn = (key:string, label:string) => {
    const clean=label;
    const oldCol=skuTableColumns.find((c:any)=>c.key===key);
    setSkuTableColumns((p:any[])=>p.map((c:any)=>c.key===key?{...c,label:clean}:c));
    if(oldCol?.custom && oldCol.label!==clean){
      commitSkuStorage((p:any[])=>p.map((s:any)=>{
        const extra={...(s.extraFields||{})};
        if(Object.prototype.hasOwnProperty.call(extra, oldCol.label)){
          extra[clean]=extra[oldCol.label];
          delete extra[oldCol.label];
        }
        return {...s,extraFields:extra};
      }));
    }
  };
  const removeSkuTableColumn = (col:any) => {
    setSkuTableColumns((p:any[])=>p.filter((c:any)=>c.key!==col.key));
    if(col.custom){
      commitSkuStorage((p:any[])=>p.map((s:any)=>{
        const extra={...(s.extraFields||{})};
        delete extra[col.label];
        delete extra[col.key];
        return {...s,extraFields:extra};
      }));
    }
  };
  const moveSkuTableColumn = (from:number, to:number) => {
    setSkuTableColumns((p:any[])=>{
      if(to<0||to>=p.length||from===to) return p;
      const next=[...p];
      const [moved]=next.splice(from,1);
      next.splice(to,0,moved);
      return next;
    });
  };
  const resetSkuTableColumns = () => setSkuTableColumns(DEFAULT_SKU_TABLE_COLUMNS);
  useEffect(()=>{
    const extraLabels=Array.from(new Set(skuStorage.flatMap((s:any)=>Object.keys(s.extraFields||{})))).filter(Boolean);
    if(!extraLabels.length) return;
    setSkuTableColumns((prev:any[])=>{
      const used=new Set(prev.map((c:any)=>String(c.label).toLowerCase()));
      const additions=extraLabels.filter((label:any)=>!used.has(String(label).toLowerCase())).map((label:any,idx:number)=>({
        key:uniqueSkuTableColumnKey(String(label),[...prev,...extraLabels.slice(0,idx).map((l:any)=>({key:`extra_${normalizeKey(l)}`}))]),
        label:String(label),
        custom:true,
      }));
      return additions.length?[...prev,...additions]:prev;
    });
  },[skuStorage]);
  const reorderSkuRows = (dragId:any, targetId:any, placement:"before"|"after"="before") => {
    if(!dragId||!targetId||dragId===targetId) return;
    commitSkuStorage((p:any[])=>{
      const moving=p.find((s:any)=>s.id===dragId);
      if(!moving) return p;
      const next=p.filter((s:any)=>s.id!==dragId);
      const targetIndex=next.findIndex((s:any)=>s.id===targetId);
      if(targetIndex<0) return p;
      next.splice(targetIndex+(placement==="after"?1:0),0,moving);
      return next;
    });
  };
  const moveSkuRow = (id:any, dir:number) => {
    const order=filteredSkus.map((s:any)=>s.id);
    const from=order.indexOf(id), to=from+dir;
    if(from<0||to<0||to>=order.length) return;
    reorderSkuRows(id,order[to],dir>0?"after":"before");
  };
  const isTagColumn = (col:any) => normalizeKey(col?.key)==="tag" || normalizeKey(col?.label)==="tag" || normalizeKey(col?.key)==="tags" || normalizeKey(col?.label)==="tags";
  const getSkuExtraValue = (s:any, col:any) => {
    if(isTagColumn(col)) return getSkuTags(s).join(", ");
    const extra=s.extraFields||{};
    return extra[col.label] ?? extra[col.key] ?? "";
  };
  const getSkuValueForBulkColumn = (s:any, col:any) => {
    const brand=brands.find((b:any)=>b.id===s.brandId);
    if(col.key==="productName") return s.productName||"";
    if(col.key==="sku") return s.sku||"";
    if(col.key==="brand") return brand?.name||"";
    if(col.key==="collection") return s.collection||"";
    if(col.key==="srp") return s.srp || s.extraFields?.SRP || s.extraFields?.srp || "";
    if(col.key==="imageLink") return s.imageLink || s.imageUrl || s.extraFields?.["Image Link"] || s.extraFields?.imageLink || s.extraFields?.imagelink || "";
    if(col.key==="inventory") return String(s.inventory ?? "");
    if(col.key==="status") {
      if(s.status==="active") return "Active";
      if(s.status==="nostocks") return "No Stocks";
      return s.customStatus||"Custom";
    }
    if(col.key==="tag" || normalizeKey(col.label)==="tag") return getSkuTags(s).join(", ");
    return getSkuExtraValue(s,col);
  };
  const skuToBulkRow = (s:any, columns:any[]=BULK_COLUMNS) => {
    const row:any = { id:s.id };
    columns.forEach((col:any)=>{ row[col.key]=getSkuValueForBulkColumn(s,col); });
    return newBulkRow(row);
  };
  const makeBulkRowsFromStorage = (items:any[]=skuStorage, columns:any[]=BULK_COLUMNS) => {
    const rows=(items||[]).map((s:any)=>skuToBulkRow(s,columns));
    return rows.length ? rows : makeBulkRows(8);
  };
  const setSkuExtraValue = (id:any, col:any, value:string) => {
    commitSkuStorage((p:any[])=>p.map((s:any)=>{
      if(s.id!==id) return s;
      if(isTagColumn(col)) return setSkuTagsOnItem(s,value);
      if(col?.key==="srp") return {...s,srp:value};
      if(col?.key==="imageLink") return {...s,imageLink:value};
      const extra={...(s.extraFields||{})};
      extra[col.label||col.key]=value;
      return {...s,extraFields:extra};
    }));
  };
  const isCollectionColumn = (col:any) => {
    const key = normalizeKey(col?.key);
    const label = normalizeKey(col?.label);
    return key==="collection" || label==="collection" || label==="category";
  };
  const setSkuCollectionValue = (id:any, value:string) => {
    commitSkuStorage((p:any[])=>p.map((s:any)=>s.id===id?{...s,collection:value}:s));
  };
  const parseStock = (v:any) => { const n=parseInt(String(v||"0").replace(/,/g,"")); return Number.isFinite(n)?n:0; };
  const parseStatusValue = (v:any) => {
    const raw=String(v||"").trim();
    const key=raw.toLowerCase().replace(/[\s_-]+/g,"");
    if(!raw||key==="active") return {status:"active",customStatus:""};
    if(["nostock","nostocks","outofstock","outofstocks","soldout","zerostock","zero"].includes(key)) return {status:"nostocks",customStatus:""};
    return {status:"custom",customStatus:raw};
  };
  const rowHasInput = (r:any) => BULK_FIELDS.some((f:any)=>String(r[f]||"").trim());
  const splitBulkLine = (line:string) => line.includes("\t") ? line.split("\t") : line.split(",");
  const baseHeaderMap:any = {
    productname:"productName", product:"productName", name:"productName", item:"productName",
    sku:"sku", skucode:"sku", code:"sku",
    brand:"brand", brandname:"brand",
    collection:"collection", collectionname:"collection", category:"collection",
    tag:"tag", tags:"tag",
    srp:"srp", price:"srp", sellingprice:"srp", regularprice:"srp",
    imagelink:"imageLink", imageurl:"imageLink", image:"imageLink", productimage:"imageLink", link:"imageLink", url:"imageLink",
    stock:"inventory", inventory:"inventory", qty:"inventory", quantity:"inventory",
    status:"status"
  };
  const uniqueBulkColumnKey = (label:string) => {
    const base=`extra_${normalizeKey(label)||"column"}`;
    const used=new Set(BULK_COLUMNS.map((c:any)=>c.key));
    let key=base, n=2;
    while(used.has(key)){ key=`${base}_${n}`; n++; }
    return key;
  };
  const addBulkColumn = () => {
    const label=bulkNewColumn.trim()||`Extra Column ${BULK_COLUMNS.filter((c:any)=>c.custom).length+1}`;
    const col={ key:uniqueBulkColumnKey(label), label, placeholder:"", custom:true };
    setBulkColumns((p:any[])=>[...p,col]);
    setBulkGridRows((p:any[])=>p.map((r:any)=>({...r,[col.key]:""})));
    setBulkNewColumn("");
  };
  const renameBulkColumn = (key:string, label:string) => setBulkColumns((p:any[])=>p.map((c:any)=>c.key===key?{...c,label}:c));
  const applyBulkColumnsToSkuTable = (columns:any[]=BULK_COLUMNS) => {
    setSkuTableColumns((prev:any[])=>{
      const previousByKey:any = {};
      (prev||[]).forEach((c:any)=>{ previousByKey[c.key]=c; });
      return (columns||[]).map((c:any)=>{
        const previous = previousByKey[c.key] || {};
        return {
          ...previous,
          key:c.key,
          label:String(c.label||previous.label||c.key||"Column").trim() || "Column",
          base:!!(previous.base || c.base || !c.custom),
          custom:!!(previous.custom || c.custom),
          hidden:false,
        };
      });
    });
  };
  const removeBulkColumn = (key:string) => {
    setBulkColumns((p:any[])=>p.filter((c:any)=>c.key!==key || !c.custom));
    setBulkGridRows((p:any[])=>p.map((r:any)=>{ const next={...r}; delete next[key]; return next; }));
  };
  const moveBulkColumn = (from:number, to:number) => {
    setBulkColumns((p:any[])=>{
      if(to<0||to>=p.length||from===to) return p;
      const next=[...p];
      const [moved]=next.splice(from,1);
      next.splice(to,0,moved);
      return next;
    });
  };
  const resetBulkColumns = () => { syncBulkColumnsFromSkuTable(); };
  const getBulkCellKey = (rowIndex:number, colIndex:number) => `${rowIndex}:${colIndex}`;
  const getBulkRange = (selection:any=bulkSelection) => {
    if(!selection) return null;
    return {
      startRow:Math.min(selection.startRow,selection.endRow),
      endRow:Math.max(selection.startRow,selection.endRow),
      startCol:Math.min(selection.startCol,selection.endCol),
      endCol:Math.max(selection.startCol,selection.endCol),
    };
  };
  const isBulkCellSelected = (rowIndex:number, colIndex:number) => {
    const rowId=bulkGridRows[rowIndex]?.id;
    if(rowId&&bulkSelectedRows.includes(rowId)) return true;
    const range=getBulkRange();
    if(!range) return false;
    return rowIndex>=range.startRow&&rowIndex<=range.endRow&&colIndex>=range.startCol&&colIndex<=range.endCol;
  };
  const isBulkRowSelected = (rowId:any) => bulkSelectedRows.includes(rowId);
  const focusBulkCell = (rowIndex:number, colIndex:number, selectCell=true) => {
    const safeRow=Math.max(0,Math.min(rowIndex,bulkGridRows.length-1));
    const safeCol=Math.max(0,Math.min(colIndex,BULK_COLUMNS.length-1));
    setBulkActiveCell({rowIndex:safeRow,colIndex:safeCol});
    if(selectCell){ setBulkSelection({startRow:safeRow,startCol:safeCol,endRow:safeRow,endCol:safeCol}); setBulkSelectedRows([]); }
    setTimeout(()=>bulkCellRefs.current[getBulkCellKey(safeRow,safeCol)]?.focus(),0);
  };
  const selectBulkCell = (rowIndex:number, colIndex:number, extend=false) => {
    if(extend&&bulkActiveCell){
      setBulkSelection({startRow:bulkActiveCell.rowIndex,startCol:bulkActiveCell.colIndex,endRow:rowIndex,endCol:colIndex});
    } else {
      setBulkActiveCell({rowIndex,colIndex});
      setBulkSelection({startRow:rowIndex,startCol:colIndex,endRow:rowIndex,endCol:colIndex});
    }
    setBulkSelectedRows([]);
  };
  const handleBulkCellMouseDown = (e:any, rowIndex:number, colIndex:number) => {
    selectBulkCell(rowIndex,colIndex,e.shiftKey);
    setBulkSelecting(true);
  };
  const handleBulkCellMouseEnter = (rowIndex:number, colIndex:number) => {
    if(!bulkSelecting||!bulkActiveCell) return;
    setBulkSelection({startRow:bulkActiveCell.rowIndex,startCol:bulkActiveCell.colIndex,endRow:rowIndex,endCol:colIndex});
  };
  const selectBulkRow = (rowIndex:number, e:any) => {
    const rowId=bulkGridRows[rowIndex]?.id;
    if(!rowId) return;
    setBulkSelection(null);
    setBulkActiveCell(null);
    if(e.shiftKey&&bulkLastSelectedRow!==null){
      const from=Math.min(bulkLastSelectedRow,rowIndex), to=Math.max(bulkLastSelectedRow,rowIndex);
      setBulkSelectedRows(bulkGridRows.slice(from,to+1).map((r:any)=>r.id));
    } else if(e.metaKey||e.ctrlKey){
      setBulkSelectedRows((p:any[])=>p.includes(rowId)?p.filter((id:any)=>id!==rowId):[...p,rowId]);
      setBulkLastSelectedRow(rowIndex);
    } else {
      setBulkSelectedRows([rowId]);
      setBulkLastSelectedRow(rowIndex);
    }
  };
  const buildBulkSelectionText = () => {
    if(bulkSelectedRows.length){
      const selected=new Set(bulkSelectedRows);
      return bulkGridRows.filter((r:any)=>selected.has(r.id)).map((r:any)=>BULK_COLUMNS.map((c:any)=>r[c.key]||"").join("\t")).join("\n");
    }
    const range=getBulkRange();
    if(!range) return "";
    const lines:string[]=[];
    for(let ri=range.startRow; ri<=range.endRow; ri++){
      const row=bulkGridRows[ri]||{};
      const vals:string[]=[];
      for(let ci=range.startCol; ci<=range.endCol; ci++){ vals.push(String(row[BULK_COLUMNS[ci]?.key]||"")); }
      lines.push(vals.join("\t"));
    }
    return lines.join("\n");
  };
  const clearBulkSelectedCells = () => {
    if(bulkSelectedRows.length){
      const selected=new Set(bulkSelectedRows);
      setBulkGridRows((p:any[])=>p.map((r:any)=>selected.has(r.id)?{...r,...Object.fromEntries(BULK_COLUMNS.map((c:any)=>[c.key,""]))}:r));
      return;
    }
    const range=getBulkRange();
    if(!range) return;
    setBulkGridRows((p:any[])=>p.map((r:any,ri:number)=>{
      if(ri<range.startRow||ri>range.endRow) return r;
      const next={...r};
      for(let ci=range.startCol; ci<=range.endCol; ci++){ const key=BULK_COLUMNS[ci]?.key; if(key) next[key]=""; }
      return next;
    }));
  };
  const deleteBulkSelectedRows = () => {
    if(!bulkSelectedRows.length) return;
    const selected=new Set(bulkSelectedRows);
    setBulkGridRows((p:any[])=>{
      const next=p.filter((r:any)=>!selected.has(r.id));
      return next.length ? next : makeBulkRows(8);
    });
    setBulkSelectedRows([]);
    setBulkLastSelectedRow(null);
    setBulkSelection(null);
  };
  const deleteBulkEmptyRows = () => {
    setBulkGridRows((p:any[])=>{
      const next=p.filter(rowHasInput);
      return next.length ? [...next,...makeBulkRows(3)] : makeBulkRows(8);
    });
    setBulkSelectedRows([]);
    setBulkSelection(null);
  };
  const handleBulkCopy = (e:any) => {
    const text=buildBulkSelectionText();
    if(!text) return;
    e.clipboardData.setData("text/plain",text);
    e.preventDefault();
  };
  const handleBulkCut = (e:any) => {
    const text=buildBulkSelectionText();
    if(!text) return;
    e.clipboardData.setData("text/plain",text);
    e.preventDefault();
    clearBulkSelectedCells();
  };
  const parsePastedGrid = (text:string, startField:string="productName") => {
    const lines=text.replace(/\r/g,"").split("\n").filter(l=>l.trim());
    if(!lines.length) return [];
    let rows=lines.map(splitBulkLine).map(r=>r.map(c=>c.trim()));
    const first=rows[0]||[];
    const detected:any = {};
    const dynamicHeaderMap:any = {...baseHeaderMap};
    BULK_COLUMNS.forEach((c:any)=>{ if(c.label) dynamicHeaderMap[normalizeKey(c.label)] = c.key; });
    first.forEach((h,i)=>{ const mapped=dynamicHeaderMap[normalizeKey(h)]; if(mapped) detected[mapped]=i; });
    const hasHeader=Object.keys(detected).length>=2 && (detected.productName!==undefined || detected.sku!==undefined);
    if(hasHeader){
      rows=rows.slice(1);
      return rows.map(cols=>{
        const obj:any = {};
        BULK_COLUMNS.forEach((c:any)=>{ obj[c.key] = detected[c.key]!==undefined ? (cols[detected[c.key]]||"").trim() : ""; });
        return obj;
      });
    }
    const startIndex=Math.max(0,BULK_FIELDS.indexOf(startField));
    return rows.map(cols=>{
      const obj:any = {};
      cols.forEach((v,i)=>{ const key=BULK_FIELDS[startIndex+i]; if(key) obj[key]=String(v||"").trim(); });
      return obj;
    });
  };
  const parseGridRows = (rows:any[]) => rows.map((r:any,idx:number)=>{
    const productName=String(r.productName||"").trim();
    const sku=String(r.sku||"").trim();
    const brand=String(r.brand||"").trim();
    const collection=String(r.collection||"").trim();
    const tag=String(r.tag||"").trim();
    const inventory=parseStock(r.inventory);
    const srp=String(r.srp||"").trim();
    const imageLink=String(r.imageLink||"").trim();
    const st=parseStatusValue(r.status);
    const extraFields:any = {};
    BULK_COLUMNS.filter((c:any)=>c.custom).forEach((c:any)=>{
      const label=String(c.label||c.key).trim();
      const value=String(r[c.key]||"").trim();
      if(label&&value) extraFields[label]=value;
    });
    const empty=!rowHasInput(r);
    const error=empty?"":!productName?"Missing product name":!sku?"Missing SKU":"";
    return { id:r.id||`bulk-${idx}`, productName, sku, brand, collection, tag, inventory, srp, imageLink, extraFields, ...st, error, valid:!empty&&!error, empty };
  }).filter((r:any)=>!r.empty);
  const deferredBulkGridRows = useDeferredValue(bulkGridRows);
  const bulkRows = useMemo(()=>parseGridRows(deferredBulkGridRows),[deferredBulkGridRows,bulkColumns]);
  const bulkVisibleRowsAll = useMemo(()=>{
    const terms = bulkSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const rows = bulkGridRows.map((row:any,idx:number)=>({ row, idx }));
    if(bulkMode!=="edit" || !terms.length) return rows;

    return rows.filter(({row}:any)=>{
      const text = [
        ...BULK_COLUMNS.map((c:any)=>row[c.key]),
        ...Object.values(row||{}),
      ].filter(Boolean).join(" ").toLowerCase();

      return terms.every((term:string)=>text.includes(term));
    });
  },[bulkGridRows,bulkSearch,bulkMode,bulkColumns]);

  const bulkVisibleRows = useMemo(()=>bulkVisibleRowsAll.slice(0,bulkRenderLimit),[bulkVisibleRowsAll,bulkRenderLimit]);
  useEffect(()=>{ setBulkRenderLimit(80); },[bulkSearch,bulkMode,bulkModal]);

  const updateBulkCell = (rowId:any, field:string, value:string) => {
    setBulkGridRows((p:any[])=>p.map((r:any)=>r.id===rowId?{...r,[field]:value}:r));

    if(bulkMode==="edit"){
      const col = BULK_COLUMNS.find((c:any)=>c.key===field);
      if(isCollectionColumn(col)){
        setSkuCollectionValue(rowId,value);
      }
    }
  };
  const addBulkRows = (count:number=10) => setBulkGridRows((p:any[])=>[...p,...makeBulkRows(count)]);
  const clearBulkRows = () => { setBulkGridRows(makeBulkRows(8)); setBulkError(""); setBulkSelection(null); setBulkSelectedRows([]); setBulkActiveCell(null); };
  const pasteBulkGrid = (text:string, rowIndex:number, colIndex:number) => {
    if(!text) return;
    const field=BULK_COLUMNS[colIndex]?.key || "productName";
    const range=getBulkRange();
    const isOneValue=!text.includes("\t")&&!text.includes("\n");
    if(isOneValue&&range&&(range.endRow>range.startRow||range.endCol>range.startCol)){
      setBulkGridRows((prev:any[])=>prev.map((r:any,ri:number)=>{
        if(ri<range.startRow||ri>range.endRow) return r;
        const next={...r};
        for(let ci=range.startCol; ci<=range.endCol; ci++){ const key=BULK_COLUMNS[ci]?.key; if(key) next[key]=text; }
        return next;
      }));
      setBulkError("");
      return;
    }
    const pasted=parsePastedGrid(text,field);
    if(!pasted.length){
      updateBulkCell(bulkGridRows[rowIndex]?.id,field,text);
      return;
    }
    setBulkGridRows((prev:any[])=>{
      const next=prev.map((r:any)=>({...r}));
      while(next.length<rowIndex+pasted.length) next.push(newBulkRow());
      pasted.forEach((data:any,i:number)=>{ next[rowIndex+i]={...next[rowIndex+i],...data}; });
      if(next.slice(-3).some(rowHasInput)) next.push(...makeBulkRows(5));
      return next;
    });
    setBulkError("");
  };
  const handleBulkPaste = (e:any, rowIndex:number, colIndex:number) => {
    const text=e.clipboardData?.getData("text/plain")||"";
    if(!text) return;
    e.preventDefault();
    pasteBulkGrid(text,rowIndex,colIndex);
  };
  const handleBulkKeyDown = (e:any, rowIndex:number, colIndex:number) => {
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="a"){
      e.preventDefault();
      setBulkSelectedRows([]);
      setBulkSelection({startRow:0,startCol:0,endRow:bulkGridRows.length-1,endCol:BULK_COLUMNS.length-1});
      setBulkActiveCell({rowIndex:0,colIndex:0});
      return;
    }
    if((e.key==="Delete"||e.key==="Backspace")&&(bulkSelectedRows.length||(getBulkRange()&&(getBulkRange().endRow>getBulkRange().startRow||getBulkRange().endCol>getBulkRange().startCol)))){
      e.preventDefault();
      clearBulkSelectedCells();
      return;
    }
    if(e.key==="Enter"){ e.preventDefault(); focusBulkCell(rowIndex+(e.shiftKey?-1:1),colIndex); return; }
    if(e.key==="Tab"){ e.preventDefault(); focusBulkCell(rowIndex,colIndex+(e.shiftKey?-1:1)); return; }
  };
  const resetBulkSheetSelection = () => {
    setBulkError("");
    setBulkSelection(null);
    setBulkSelectedRows([]);
    setBulkActiveCell(null);
    setBulkLastSelectedRow(null);
  };
  const openBulk = () => {
    const columns=buildBulkColumnsFromSkuTable();
    setBulkMode("paste");
    setBulkSearch("");
    setBulkEditColumnNames(false);
    setBulkColumns(columns);
    setBulkGridRows(makeBulkRows(8));
    setBulkRenderLimit(80);
    resetBulkSheetSelection();
    setBulkModal(true);
  };
  const openEditSheet = () => {
    const columns=buildBulkColumnsFromSkuTable();
    const scopedItems = activeBrand ? skuStorage.filter((s:any)=>s.brandId===activeBrand) : skuStorage;

    setBulkMode("edit");
    setBulkSearch("");
    setBulkEditColumnNames(false);
    setBulkEditBrandId(activeBrand || null);
    setBulkColumns(columns);
    setBulkGridRows(makeBulkRowsFromStorage(scopedItems,columns));
    setBulkRenderLimit(80);
    resetBulkSheetSelection();
    setBulkModal(true);
  };
  const saveBulkSkus = () => {
    const currentBulkRows = parseGridRows(bulkGridRows);
    const rows=currentBulkRows.filter((r:any)=>r.valid);

    // Paste/import mode still needs at least 1 valid SKU.
    // Edit Sheet mode must allow saving 0 rows after Clear Sheet so the user can intentionally empty the SKU sheet.
    if(!rows.length && bulkMode!=="edit"){
      setBulkError("No valid SKU rows to import.");
      return;
    }

    const nextBrands=[...brands];
    const getBrandId = (brandName:string) => {
      const clean=String(brandName||"").trim();
      const fallback=activeBrand||brands[0]?.id||"";
      if(!clean) return fallback;
      const existing=nextBrands.find((b:any)=>b.name.toLowerCase()===clean.toLowerCase());
      if(existing) return existing.id;
      const fresh={ id:uid(), name:clean, color:"#111827" };
      nextBrands.push(fresh);
      return fresh.id;
    };

    const buildSku = (r:any, existing?:any) => {
      const builtSkuBase = {
        id:existing?.id || r.id || uid(),
        brandId:getBrandId(r.brand),
        productName:r.productName.trim(),
        collection:r.collection.trim(),
        sku:r.sku.trim(),
        inventory:r.inventory,
        srp:r.srp || existing?.srp || "",
        imageLink:r.imageLink || existing?.imageLink || existing?.imageUrl || "",
        status:r.status,
        customStatus:r.customStatus||"",
        extraFields:r.extraFields||{},
      };
      const rowTag = r.tag || r.extraFields?.Tag || r.extraFields?.tag || existing?.tag || getSkuTagText(existing);
      return setSkuTagsOnItem(builtSkuBase,rowTag);
    };

    applyBulkColumnsToSkuTable(BULK_COLUMNS);

    if(bulkMode==="edit"){
      const editedSkus=rows.map((r:any)=>{
        const existing=skuStorage.find((s:any)=>s.id===r.id) || skuStorage.find((s:any)=>s.sku.toLowerCase()===r.sku.toLowerCase());
        return buildSku(r,existing);
      });

      const scopedOriginalIds = new Set(
        (bulkEditBrandId ? skuStorage.filter((s:any)=>s.brandId===bulkEditBrandId) : skuStorage).map((s:any)=>s.id)
      );

      const nextSkus = bulkEditBrandId
        ? [...skuStorage.filter((s:any)=>!scopedOriginalIds.has(s.id)), ...editedSkus]
        : editedSkus;

      commitBrands(nextBrands, true);
      commitSkuStorage(nextSkus, true);
      setBulkModal(false);
      setBulkError("");
      return;
    }

    const nextSkus=[...skuStorage];
    rows.forEach((r:any)=>{
      const e=buildSku(r);
      const existingIndex=nextSkus.findIndex((s:any)=>s.sku.toLowerCase()===e.sku.toLowerCase());
      if(existingIndex>=0) nextSkus[existingIndex]={...nextSkus[existingIndex],...e,id:nextSkus[existingIndex].id};
      else nextSkus.push(e);
    });
    commitBrands(nextBrands, true);
    commitSkuStorage(nextSkus, true);
    setBulkModal(false);
    setBulkGridRows(makeBulkRows(8));
    setBulkError("");
  };

  const STATUS_OPTS=[{value:"active",label:"Active",color:"#22C55E"},{value:"nostocks",label:"No Stocks",color:"#EF4444"},{value:"custom",label:"Custom",color:"#6B7280"}];
  const getSD = s=>{ if(s.status==="active") return{label:"Active",color:"#22C55E"}; if(s.status==="nostocks") return{label:"No Stocks",color:"#EF4444"}; return{label:s.customStatus||"Custom",color:"#6B7280"}; };
  const bulkColumnWidth = (key:string) => {
    if(isMobile){
      if(key==="productName") return "190px";
      if(key==="imageLink") return "220px";
      if(key==="sku") return "140px";
      if(key==="srp"||key==="inventory") return "90px";
      return "130px";
    }
    if(key==="productName") return "1.4fr";
    if(key==="imageLink") return "1.4fr";
    if(key==="srp"||key==="inventory") return ".7fr";
    if(key==="status") return ".9fr";
    return "1fr";
  };
  const bulkGridTemplate = `${isMobile?"36px":"42px"} ${BULK_COLUMNS.map((c:any)=>bulkColumnWidth(c.key)).join(" ")}`;
  const bulkTableMinWidth = isMobile ? Math.max(820,36+(BULK_COLUMNS.length*140)) : Math.max(760,42+(BULK_COLUMNS.length*120));
  const getSkuColumnCellText = (s:any, col:any) => {
    const brand=brandById[s.brandId];
    if(col.key==="brand") return brand?.name || "";
    if(col.key==="sku") return s.sku || "";
    if(col.key==="collection") return s.collection || "Uncategorized";
    if(col.key==="tag") return getSkuTags(s).join(", ");
    if(col.key==="productName") return s.productName || "";
    if(col.key==="srp") return s.srp || s.extraFields?.SRP || s.extraFields?.srp || "";
    if(col.key==="imageLink") return s.imageLink || s.imageUrl || s.extraFields?.["Image Link"] || s.extraFields?.imageLink || s.extraFields?.imagelink || "";
    if(col.key==="inventory") return String(s.inventory ?? "");
    if(col.key==="status") return getSD(s).label || "";
    return getSkuExtraValue(s,col);
  };
  const getSkuContentWidthPx = (col:any) => {
    const sample=(filteredSkus || []).slice(0,250);
    const maxChars=Math.max(
      String(col.label || "").length,
      ...sample.map((s:any)=>String(getSkuColumnCellText(s,col) || "").length)
    );
    const base=Math.ceil(maxChars * 7.2) + 34;
    const min:any={ brand:130, sku:140, collection:130, tag:120, productName:190, srp:90, imageLink:220, inventory:90, status:120 };
    const max:any={ brand:260, sku:240, collection:260, tag:230, productName:420, srp:150, imageLink:520, inventory:140, status:220 };
    return Math.max(min[col.key] || 130, Math.min(max[col.key] || 360, base));
  };
  const getSkuManualWidthPx = (key:string) => {
    const fallback:any = { brand:160, sku:170, collection:160, tag:150, productName:280, srp:110, imageLink:300, inventory:100, status:140 };
    const raw = Number(skuColumnWidths?.[key] ?? fallback[key] ?? 170);
    return Math.max(80, Math.min(640, Number.isFinite(raw) ? raw : (fallback[key] || 170)));
  };
  const getSkuColumnWidthPx = (col:any) => {
    if(skuColumnWidthMode==="equal") return 180;
    if(skuColumnWidthMode==="content") return getSkuContentWidthPx(col);
    return getSkuManualWidthPx(col.key);
  };
  const setSkuManualColumnWidth = (key:string, value:any) => {
    const n=Math.max(80,Math.min(640,parseInt(String(value || ""),10)||80));
    setSkuColumnWidthMode("manual");
    setSkuColumnWidths((prev:any)=>({ ...prev, [key]:n }));
  };
  const fitSkuColumnsByContent = () => {
    const next:any = {};
    skuTableColumns.forEach((col:any)=>{ next[col.key]=getSkuContentWidthPx(col); });
    setSkuColumnWidths((prev:any)=>({ ...prev, ...next }));
    setSkuColumnWidthMode("content");
  };
  const makeSkuColumnsEqual = () => {
    const next:any = {};
    skuTableColumns.forEach((col:any)=>{ next[col.key]=180; });
    setSkuColumnWidths((prev:any)=>({ ...prev, ...next }));
    setSkuColumnWidthMode("equal");
  };
  const resetSkuColumnWidths = () => {
    setSkuColumnWidths(DEFAULT_SKU_COLUMN_WIDTHS);
    setSkuColumnWidthMode("manual");
  };
  const skuActionsColumnWidth = "104px";
  const skuColumnWidthValues = skuTableColumns.map((c:any)=>getSkuColumnWidthPx(c));
  const skuGridTemplate = `${skuTableEditMode?"42px ":""}${skuColumnWidthValues.map((w:number)=>`${w}px`).join(" ")} ${skuActionsColumnWidth}`;
  const skuTableMinWidth = Math.max(760,(skuTableEditMode?42:0)+104+skuColumnWidthValues.reduce((sum:number,w:number)=>sum+w,0));

  const skuCellUrlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const normalizeSkuCellUrl = (url:any) => {
    const raw = String(url || "").trim();
    if(!raw) return "";
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  };
  const renderClickableSkuCellText = (value:any, emptyText="—", style:any={}) => {
    const textValue = String(value || "");
    if(!textValue.trim()) return <span style={{ ...style,color:C.faint }}>{emptyText}</span>;
    const parts:any[] = [];
    let lastIndex = 0;
    textValue.replace(skuCellUrlRegex,(match:string, ...args:any[])=>{
      const index = args[args.length-2];
      if(index>lastIndex) parts.push(textValue.slice(lastIndex,index));
      parts.push({ type:"link", text:match });
      lastIndex = index + match.length;
      return match;
    });
    if(lastIndex<textValue.length) parts.push(textValue.slice(lastIndex));
    return (
      <span style={{ ...style,display:style?.display || "block",maxWidth:"100%",minWidth:0,overflow:"hidden",textOverflow:"ellipsis" }}>
        {parts.map((part:any,idx:number)=>typeof part==="string" ? (
          <span key={`text-${idx}`} style={{ minWidth:0 }}>{part}</span>
        ) : (
          <a
            key={`link-${idx}`}
            href={normalizeSkuCellUrl(part.text)}
            target="_blank"
            rel="noreferrer"
            onClick={(e:any)=>e.stopPropagation()}
            style={{ color:C.accent,fontWeight:800,textDecoration:"underline",textUnderlineOffset:2,display:"inline-block",maxWidth:"100%",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",verticalAlign:"bottom" }}
            title={normalizeSkuCellUrl(part.text)}
          >
            {part.text}
          </a>
        ))}
      </span>
    );
  };

  const getFirstSkuCellUrl = (value:any) => {
    const match = String(value || "").match(skuCellUrlRegex);
    return match?.[0] || "";
  };

  const EditableSkuLinkInput = ({ value, onChange, placeholder="—" }: any) => {
    const firstUrl = getFirstSkuCellUrl(value);
    return (
      <div style={{ display:"flex",alignItems:"center",gap:5,width:"100%",minWidth:0,maxWidth:"100%",overflow:"hidden" }}>
        <input value={value || ""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{ width:"100%",height:28,padding:"4px 7px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:5,background:C.surface,color:C.text,outline:"none",minWidth:0 }} />
        {firstUrl&&(
          <button
            type="button"
            onClick={(e)=>{ e.stopPropagation(); window.open(normalizeSkuCellUrl(firstUrl),"_blank","noopener,noreferrer"); }}
            title="Open link"
            style={{ width:28,height:28,borderRadius:5,border:`1px solid ${C.border}`,background:C.surfaceAlt,color:C.accent,fontSize:12,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}
          >↗</button>
        )}
      </div>
    );
  };

  const renderSkuDesktopCell = (s:any, col:any, brand:any, st:any) => {
    if(col.key==="productName") return renderClickableSkuCellText(s.productName,"—",{ fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12 });
    if(col.key==="sku") return renderClickableSkuCellText(s.sku,"—",{ fontSize:12,color:C.muted,fontFamily:"monospace",background:C.surfaceAlt,padding:"2px 6px",borderRadius:4,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" });
    if(col.key==="brand") return <div style={{ width:"100%",minWidth:0,overflow:"hidden" }}>{brand&&<div style={{ display:"flex",alignItems:"center",gap:5,minWidth:0,overflow:"hidden" }}><div style={{ width:7,height:7,borderRadius:"50%",background:brand.color,flexShrink:0 }} />{renderClickableSkuCellText(brand.name,"—",{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" })}</div>}</div>;
    if(col.key==="collection") return skuTableEditMode
      ? <EditableSkuLinkInput value={s.collection||""} onChange={(value:string)=>setSkuCollectionValue(s.id,value)} placeholder="Uncategorized" />
      : renderClickableSkuCellText(s.collection||"Uncategorized","Uncategorized",{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" });
    if(col.key==="srp") return renderClickableSkuCellText(s.srp || s.extraFields?.SRP || s.extraFields?.srp || "—","—",{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" });
    if(col.key==="imageLink") return skuTableEditMode
      ? <EditableSkuLinkInput value={s.imageLink || s.imageUrl || s.extraFields?.["Image Link"] || s.extraFields?.imageLink || s.extraFields?.imagelink || ""} onChange={(value:string)=>commitSkuStorage((p:any[])=>p.map((item:any)=>item.id===s.id?{...item,imageLink:value}:item), true)} placeholder="Paste image link" />
      : renderClickableSkuCellText(s.imageLink || s.imageUrl || s.extraFields?.["Image Link"] || s.extraFields?.imageLink || s.extraFields?.imagelink || "—","—",{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" });
    if(col.key==="inventory") return <span style={{ fontSize:12,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:400,fontVariantNumeric:"tabular-nums" }}>{s.inventory.toLocaleString()}</span>;
    if(col.key==="status") return <span title={st.label} style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"3px 8px",borderRadius:5,border:`1px solid ${st.color}28`,display:"block",whiteSpace:"nowrap",maxWidth:"100%",minWidth:0,overflow:"hidden",textOverflow:"ellipsis" }}>{st.label}</span>;
    const extraValue = getSkuExtraValue(s,col);
    return skuTableEditMode
      ? <EditableSkuLinkInput value={extraValue} onChange={(value:string)=>setSkuExtraValue(s.id,col,value)} placeholder="—" />
      : renderClickableSkuCellText(extraValue,"—",{ fontSize:12,color:extraValue?C.textSub:C.faint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" });
  };

  const BrandSidebar = () => (
    <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surfaceAlt }}>
        <span style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em" }}>Brands</span>
        <button onClick={()=>setBrandModal(true)} style={{ width:28,height:28,borderRadius:6,background:C.accent,border:"none",cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
      </div>
      <button onClick={()=>{setActiveBrand(null);if(isMobile)setShowSidebar(false);}} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",background:activeBrand===null?"#F0FDF4":C.surface,border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left" }}>
        <div style={{ width:10,height:10,borderRadius:"50%",background:C.borderStrong,flexShrink:0 }} />
        <span style={{ fontSize:13,fontWeight:activeBrand===null?700:500,color:C.text,flex:1 }}>All Brands</span>
        <span style={{ fontSize:12,fontWeight:600,color:activeBrand===null?C.accent:C.faint,background:activeBrand===null?C.accent+"15":C.surfaceAlt,padding:"1px 7px",borderRadius:10 }}>{skuStorage.length}</span>
      </button>
      {brands.map(b=>{ const count=skuCountByBrandId[b.id] || 0; return (
        <div key={b.id} style={{ display:"flex",alignItems:"center",borderBottom:`1px solid ${C.border}`,background:activeBrand===b.id?"#F9FAFB":C.surface }}>
          <button onClick={()=>{setActiveBrand(b.id);if(isMobile)setShowSidebar(false);}} style={{ display:"flex",alignItems:"center",gap:10,flex:1,padding:"11px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",minWidth:0 }}>
            <div style={{ width:10,height:10,borderRadius:"50%",background:b.color,flexShrink:0 }} />
            <span style={{ fontSize:13,fontWeight:activeBrand===b.id?700:500,color:C.text,flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{b.name}</span>
            <span style={{ fontSize:12,fontWeight:600,color:activeBrand===b.id?C.accent:C.faint,background:activeBrand===b.id?C.accent+"15":C.surfaceAlt,padding:"1px 7px",borderRadius:10,flexShrink:0 }}>{count}</span>
          </button>
          <button onClick={()=>openEditBrand(b)} style={{ height:"100%",padding:"0 8px",background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
          <button onClick={()=>delBrand(b.id)} style={{ height:"100%",padding:"0 10px 0 4px",background:"none",border:"none",cursor:"pointer",color:"#FCA5A5",fontSize:16 }}>&#215;</button>
        </div>
      );})}
    </div>
  );

  return (
    <div>
      {/* Mobile: header with brand toggle + add SKU */}
      {isMobile&&(
        <div style={{ display:"flex",gap:8,marginBottom:16 }}>
          <button onClick={()=>setShowSidebar(!showSidebar)} style={{ flex:1,padding:"9px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:showSidebar?C.accent:C.surface,color:showSidebar?"#fff":C.textSub,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            {activeBrandObj?<><div style={{ width:8,height:8,borderRadius:"50%",background:showSidebar?"#fff":activeBrandObj.color }} />{activeBrandObj.name}</>:"All Brands"} &#8250;
          </button>
          <Btn sm variant={skuTableEditMode?"primary":"outline"} onClick={toggleSkuTableEditMode}>{skuTableEditMode?"Done":"Edit"}</Btn>
          <Btn sm onClick={openBulk} variant="outline">Paste</Btn>
          <Btn sm onClick={openAdd}>+ Add SKU</Btn>
        </div>
      )}

      <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
        {/* Sidebar */}
        {(showSidebar||!isMobile)&&(
          <div style={{ width:isMobile?"100%":220,flexShrink:0,...(isMobile?{}:{}) }}>
            <BrandSidebar />
          </div>
        )}

        {/* Table — hidden on mobile when sidebar is shown */}
        {(!isMobile||!showSidebar)&&(
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div>
                {activeBrandObj&&<div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}><div style={{ width:12,height:12,borderRadius:"50%",background:activeBrandObj.color }} /><span style={{ fontSize:15,fontWeight:700,color:C.text }}>{activeBrandObj.name}</span></div>}
                <span style={{ fontSize:12,color:C.muted }}>{filteredSkus.length} SKU{filteredSkus.length!==1?"s":""}</span>
              </div>
              {!isMobile&&(<div style={{ display:"flex",gap:8 }}><Btn sm variant={skuTableEditMode?"primary":"outline"} onClick={toggleSkuTableEditMode}>{skuTableEditMode?"Done Editing":"Edit Table"}</Btn><Btn sm variant="outline" onClick={openBulk}>Paste Sheet</Btn><Btn sm variant="outline" onClick={openEditSheet} disabled={!skuStorage.length}>Edit Sheet</Btn><Btn sm onClick={openAdd}>+ Add SKU</Btn></div>)}
            </div>

            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px" }}>
              <span style={{ fontSize:13,color:C.faint,flexShrink:0 }}>Search</span>
              <input
                value={skuSearch}
                onChange={e=>setSkuSearch(e.target.value)}
                placeholder="Search brand, SKU, category, tag, product, SRP, image link..."
                style={{ flex:1,minWidth:0,height:30,border:"none",outline:"none",background:"transparent",fontSize:13,color:C.text }}
              />
              {skuSearch.trim()&&(
                <button type="button" onClick={()=>setSkuSearch("")}
                  style={{ border:"none",background:C.surfaceAlt,borderRadius:6,padding:"5px 8px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer",flexShrink:0 }}>
                  Clear
                </button>
              )}
            </div>

            {skuTagOptions.length>0&&(
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                <button type="button" onClick={()=>setActiveSkuTag("all")}
                  style={{ height:28,padding:"0 10px",borderRadius:999,border:`1.5px solid ${activeSkuTag==="all"?C.accent:C.border}`,background:activeSkuTag==="all"?C.accent:C.surface,color:activeSkuTag==="all"?"#fff":C.textSub,fontSize:11,fontWeight:800,cursor:"pointer" }}>
                  All Tags
                </button>
                {skuTagOptions.map((tag:any)=>(
                  <button key={tag.key} type="button" onClick={()=>setActiveSkuTag(tag.label)}
                    style={{ height:28,padding:"0 10px",borderRadius:999,border:`1.5px solid ${normalizeSkuTagKey(activeSkuTag)===tag.key?C.accent:C.border}`,background:normalizeSkuTagKey(activeSkuTag)===tag.key?C.accent:C.surface,color:normalizeSkuTagKey(activeSkuTag)===tag.key?"#fff":C.textSub,fontSize:11,fontWeight:800,cursor:"pointer" }}>
                    {tag.label} <span style={{ opacity:.72 }}>({tag.count})</span>
                  </button>
                ))}
              </div>
            )}

            {!isMobile&&skuTableEditMode&&(
              <div style={{ display:"flex",flexDirection:"column",gap:10,padding:"10px 12px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <span style={{ fontSize:12,color:C.muted }}>Preview columns follow the pasted sheet format. Adjust column widths here, then click Done Editing to continue.</span>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                    <button type="button" onClick={()=>setSkuColumnWidthMode("manual")} style={{ height:28,padding:"0 10px",borderRadius:7,border:`1.5px solid ${skuColumnWidthMode==="manual"?C.accent:C.border}`,background:skuColumnWidthMode==="manual"?C.accent:C.surface,color:skuColumnWidthMode==="manual"?"#fff":C.textSub,fontSize:11,fontWeight:800,cursor:"pointer" }}>Manual</button>
                    <button type="button" onClick={fitSkuColumnsByContent} style={{ height:28,padding:"0 10px",borderRadius:7,border:`1.5px solid ${skuColumnWidthMode==="content"?C.accent:C.border}`,background:skuColumnWidthMode==="content"?C.accent:C.surface,color:skuColumnWidthMode==="content"?"#fff":C.textSub,fontSize:11,fontWeight:800,cursor:"pointer" }}>Fit by Content</button>
                    <button type="button" onClick={makeSkuColumnsEqual} style={{ height:28,padding:"0 10px",borderRadius:7,border:`1.5px solid ${skuColumnWidthMode==="equal"?C.accent:C.border}`,background:skuColumnWidthMode==="equal"?C.accent:C.surface,color:skuColumnWidthMode==="equal"?"#fff":C.textSub,fontSize:11,fontWeight:800,cursor:"pointer" }}>Equal Widths</button>
                    <button type="button" onClick={resetSkuColumnWidths} style={{ height:28,padding:"0 10px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surfaceAlt,color:C.muted,fontSize:11,fontWeight:800,cursor:"pointer" }}>Reset</button>
                  </div>
                </div>
                {skuColumnWidthMode==="manual"&&(
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8 }}>
                    {skuTableColumns.map((col:any)=>(
                      <label key={col.key} style={{ display:"flex",flexDirection:"column",gap:4,fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".04em" }}>
                        {col.label}
                        <input type="number" min={80} max={640} value={getSkuManualWidthPx(col.key)} onChange={e=>setSkuManualColumnWidth(col.key,e.target.value)}
                          style={{ height:30,padding:"5px 8px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:12,color:C.text,outline:"none",background:C.surface }} />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredSkus.length===0?(
              <div style={{ background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12 }}>
                <Empty
                  title={skuSearch.trim()?"No matching SKUs":"No SKUs yet"}
                  sub={skuSearch.trim()?`No SKU matched "${skuSearch.trim()}". Try another keyword or clear search.`:`Add your first SKU${activeBrandObj?` for ${activeBrandObj.name}`:""}.`}
                  action={skuSearch.trim()?<Btn sm variant="outline" onClick={()=>setSkuSearch("")}>Clear Search</Btn>:<div style={{ display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center" }}><Btn sm variant="outline" onClick={openBulk}>Paste Sheet</Btn><Btn sm onClick={openAdd}>+ Add SKU</Btn></div>}
                />
              </div>
            ):(
              <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                {!isMobile&&(
                  <div style={{ overflowX:"auto",maxWidth:"100%" }}>
                    <div style={{ minWidth:skuTableMinWidth,width:"max-content",maxWidth:"none" }}>
                      <div style={{ display:"grid",gridTemplateColumns:skuGridTemplate,background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                        {skuTableEditMode&&<span style={{ padding:"9px 10px",fontSize:12,fontWeight:700,color:C.faint,letterSpacing:".02em",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8942;&#8942;</span>}
                        {skuTableColumns.map((col:any)=>(
                          <div key={col.key}
                            style={{ padding:"7px 10px",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:6,minWidth:0,overflow:"hidden" }}>
                            <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{col.label}</span>
                          </div>
                        ))}
                        <span style={{ padding:"9px 10px",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".06em",textAlign:"right",borderLeft:`1px solid ${C.border}` }}>Actions</span>
                      </div>
                      <div style={{ maxHeight:"calc(100vh - 330px)",overflowY:"auto" }}>
                      {groupedSkus.map(group=>(
                        <div key={group.label}>
                          <div style={{ display:"grid",gridTemplateColumns:skuGridTemplate,alignItems:"center",background:C.bg,borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ gridColumn:"1 / -1",fontSize:11,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em",display:"flex",alignItems:"center",gap:8,padding:"8px 16px" }}>
                              {group.label}
                              <span style={{ fontSize:10,fontWeight:700,color:C.faint,background:C.surfaceAlt,padding:"1px 7px",borderRadius:10,textTransform:"none",letterSpacing:0 }}>{group.skus.length} SKU{group.skus.length!==1?"s":""}</span>
                            </span>
                          </div>
                          {group.skus.slice(0,PERF_SKU_STORAGE_GROUP_LIMIT).map((s:any,i:number)=>{
                            const brand=brandById[s.brandId], st=getSD(s);
                            const flatIndex=filteredSkus.findIndex((x:any)=>x.id===s.id);
                            return (
                              <div key={s.id} className="emdc-row"
                                draggable={skuTableEditMode}
                                onDragStart={()=>skuTableEditMode&&setSkuRowDragId(s.id)}
                                onDragOver={e=>{ if(skuTableEditMode) e.preventDefault(); }}
                                onDrop={e=>{ if(!skuTableEditMode) return; e.preventDefault(); if(skuRowDragId&&skuRowDragId!==s.id) reorderSkuRows(skuRowDragId,s.id); setSkuRowDragId(null); }}
                                onDragEnd={()=>setSkuRowDragId(null)}
                                style={{ display:"grid",gridTemplateColumns:skuGridTemplate,borderBottom:`1px solid ${C.border}`,alignItems:"center",background:skuTableEditMode&&skuRowDragId===s.id?C.surfaceAlt:C.surface }}>
                                {skuTableEditMode&&<div title="Drag the 6-dot handle to reorder this row" style={{ minHeight:48,padding:"8px 10px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",color:C.faint }}>
                                  <span style={{ fontSize:13,lineHeight:1 }}>&#8942;&#8942;</span>
                                </div>}
                                {skuTableColumns.map((col:any)=>(
                                  <div key={col.key} style={{ minHeight:48,padding:"10px 10px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",minWidth:0,overflow:"hidden",maxWidth:"100%" }}>
                                    {renderSkuDesktopCell(s,col,brand,st)}
                                  </div>
                                ))}
                                <div style={{ minHeight:48,padding:"8px 10px",borderLeft:`1px solid ${C.border}`,display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center",background:C.surface }}>
                                  <button type="button" onClick={()=>openEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:700,padding:"4px 7px",borderRadius:5 }}>Edit</button>
                                  <button type="button" onClick={()=>delSku(s.id)} title="Delete this product row" aria-label="Delete this product row" style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"1px solid #FECACA",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800 }}>&#215;</button>
                                </div>
                              </div>
                            );
                          })}
                          {group.skus.length>PERF_SKU_STORAGE_GROUP_LIMIT&&(
                            <div style={{ display:"grid",gridTemplateColumns:skuGridTemplate,borderBottom:`1px solid ${C.border}`,background:C.surfaceAlt }}>
                              <div style={{ gridColumn:"1 / -1",padding:"10px 16px",fontSize:12,fontWeight:800,color:C.muted }}>
                                Showing first {PERF_SKU_STORAGE_GROUP_LIMIT} of {group.skus.length} SKUs in this category. Use search to narrow results.
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                )}
                {isMobile&&groupedSkus.map(group=>(
                  <div key={group.label}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 16px",background:C.bg,borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:11,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em",display:"flex",alignItems:"center",gap:8 }}>
                        {group.label}
                        <span style={{ fontSize:10,fontWeight:700,color:C.faint,background:C.surfaceAlt,padding:"1px 7px",borderRadius:10,textTransform:"none",letterSpacing:0 }}>{group.skus.length} SKU{group.skus.length!==1?"s":""}</span>
                      </span>
                    </div>
                    {group.skus.slice(0,PERF_SKU_STORAGE_GROUP_LIMIT).map((s:any,i:number)=>{
                      const brand=brandById[s.brandId], st=getSD(s);
                      const flatIndex=filteredSkus.findIndex((x:any)=>x.id===s.id);
                      return (
                        <div key={s.id} className="emdc-row" style={{ padding:"14px 16px",borderBottom:i<group.skus.length-1?`1px solid ${C.border}`:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                            <div style={{ minWidth:0,flex:1 }}>
                              <p style={{ margin:"0 0 2px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{renderClickableSkuCellText(s.productName,"—",{ color:C.text })}</p>
                              {renderClickableSkuCellText(s.sku,"—",{ fontSize:11,fontFamily:"monospace",color:C.muted,background:C.surfaceAlt,padding:"2px 7px",borderRadius:4,display:"inline-block" })}
                            </div>
                            <div style={{ display:"flex",gap:6,marginLeft:10,flexShrink:0,alignItems:"center" }}>
                              {skuTableEditMode&&<span title="Drag rows on desktop using the 6-dot handle" style={{ width:28,height:28,borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.faint }}>&#8942;&#8942;</span>}
                              <button onClick={()=>openEdit(s)} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                              <button onClick={()=>delSku(s.id)} style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                            </div>
                          </div>
                          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                            {brand&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:6,height:6,borderRadius:"50%",background:brand.color }} /><span style={{ fontSize:11,color:C.muted }}>{brand.name}</span></div>}
                            <span style={{ fontSize:11,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:500 }}>{s.inventory.toLocaleString()} units</span>
                            <span style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"2px 8px",borderRadius:4,border:`1px solid ${st.color}28` }}>{st.label}</span>
                            {getSkuTags(s).map((tag:string)=><span key={tag} style={{ fontSize:11,fontWeight:700,color:"#92400E",background:"#FEF3C7",padding:"2px 8px",borderRadius:4,border:"1px solid #FDE68A" }}>{tag}</span>)}
                          </div>
                        </div>
                      );
                    })}
                    {group.skus.length>PERF_SKU_STORAGE_GROUP_LIMIT&&(
                      <div style={{ padding:"10px 16px",fontSize:12,fontWeight:800,color:C.muted,background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                        Showing first {PERF_SKU_STORAGE_GROUP_LIMIT} of {group.skus.length} SKUs in this category. Use search to narrow results.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={brandModal} onClose={()=>setBrandModal(false)} title="Add Brand" width={360}>
        <div style={{ display:"flex",flexDirection:"column",gap:16,minWidth:0 }}>
          <Field label="Brand Name"><TI value={bForm.name} onChange={v=>setBForm(f=>({...f,name:v}))} placeholder="e.g. My Brand" /></Field>
          {bForm.name&&<div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.surfaceAlt,borderRadius:9 }}><div style={{ width:12,height:12,borderRadius:"50%",background:"#111827" }} /><span style={{ fontSize:14,fontWeight:600,color:C.text }}>{bForm.name}</span></div>}
          <Btn full onClick={addBrand} disabled={!bForm.name.trim()}>Add Brand</Btn>
        </div>
      </Modal>

      <Modal open={editBrandModal&&!!editBrandForm} onClose={()=>{setEditBrandModal(false);setEditBrandForm(null);}} title="Edit Brand" width={360}>
        {editBrandForm&&(
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <Field label="Brand Name"><TI value={editBrandForm.name} onChange={v=>setEditBrandForm(f=>({...f,name:v}))} /></Field>
            <Field label="Brand Color"><ColorPicker value={editBrandForm.color||"#111827"} onChange={v=>setEditBrandForm(f=>({...f,color:v}))} palette={STATUS_PALETTE} /></Field>
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.surfaceAlt,borderRadius:9 }}><div style={{ width:12,height:12,borderRadius:"50%",background:editBrandForm.color||"#111827" }} /><span style={{ fontSize:14,fontWeight:600,color:C.text }}>{editBrandForm.name||"Preview"}</span></div>
            <Btn full onClick={saveEditBrand} disabled={!editBrandForm.name.trim()}>Save Changes</Btn>
            <Btn full variant="danger" onClick={()=>{ delBrand(editBrandForm.id); setEditBrandModal(false); setEditBrandForm(null); }}>Delete Brand</Btn>
          </div>
        )}
      </Modal>

      <Modal open={bulkModal} onClose={()=>setBulkModal(false)} title={bulkMode==="edit"?`Edit SKU Sheet${bulkEditBrandObj?` - ${bulkEditBrandObj.name}`:" - All Brands"}`:"Paste SKUs from Sheet"} width={860}>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ padding:"12px 14px",background:C.surfaceAlt,borderRadius:10,border:`1px solid ${C.border}` }}>
            <p style={{ margin:"0 0 6px",fontSize:13,fontWeight:700,color:C.text }}>{bulkMode==="edit"?"Edit all existing SKU Storage rows in one sheet.":"Copy from Excel or Google Sheets, then paste here."}</p>
            <p style={{ margin:0,fontSize:12,color:C.muted,lineHeight:1.5 }}>{bulkMode==="edit"?`Editing scope: ${bulkEditBrandObj?.name || "All Brands"}. Collection changes autosave while typing. Other sheet changes are applied when you click Save. Deleting rows in this sheet and saving will remove SKUs only from this scope.`:"This sheet follows the current SKU Storage table columns and order. Header row is optional. Existing SKUs with the same SKU code will be updated."}</p>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            <p style={{ margin:0,fontSize:12,color:C.muted }}>Use this like a mini spreadsheet. For smoother editing, the sheet loads rows in batches. Use search or Load more rows when needed.</p>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
              <input value={bulkNewColumn} placeholder="New column name" onChange={e=>setBulkNewColumn(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addBulkColumn(); } }}
                style={{ height:30,width:150,padding:"6px 9px",fontSize:12,borderRadius:7,border:`1.5px solid ${C.border}`,outline:"none",background:C.surface,color:C.text }} />
              <Btn xs variant="outline" onClick={addBulkColumn}>+ Column</Btn>
              <Btn xs variant={bulkEditColumnNames?"primary":"outline"} onClick={()=>setBulkEditColumnNames(v=>!v)}>{bulkEditColumnNames?"Done Columns":"Edit Column Names"}</Btn>
              <Btn xs variant="outline" onClick={()=>addBulkRows(10)}>+ 10 Rows</Btn>
              <Btn xs variant="outline" onClick={clearBulkSelectedCells} disabled={!bulkSelection&&!bulkSelectedRows.length}>Clear Selected</Btn>
              <Btn xs variant="danger" onClick={deleteBulkSelectedRows} disabled={!bulkSelectedRows.length}>Delete Row{bulkSelectedRows.length!==1?"s":""}</Btn>
              <Btn xs variant="outline" onClick={deleteBulkEmptyRows}>Remove Empty Rows</Btn>
              <Btn xs variant="outline" onClick={resetBulkColumns}>Reset Columns</Btn>
              <Btn xs variant="outline" onClick={clearBulkRows}>{bulkMode==="edit"?"Clear Sheet":"Clear All"}</Btn>
            </div>
          </div>
          {bulkEditColumnNames&&(
            <div style={{ padding:"8px 10px",background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:9,fontSize:12,color:"#1D4ED8",fontWeight:700 }}>
              Rename the column headers directly in the sheet. Click Save to apply the updated names.
            </div>
          )}
          {bulkMode==="edit"&&(
            <div style={{ display:"flex",alignItems:"center",gap:8,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px" }}>
              <span style={{ fontSize:13,color:C.faint,flexShrink:0 }}>Search</span>
              <input
                value={bulkSearch}
                onChange={e=>setBulkSearch(e.target.value)}
                placeholder="Search brand, SKU, category, tag, product, SRP, image link..."
                style={{ flex:1,minWidth:0,height:30,border:"none",outline:"none",background:"transparent",fontSize:13,color:C.text }}
              />
              <span style={{ fontSize:11,color:C.muted,whiteSpace:"nowrap",flexShrink:0 }}>
                {bulkVisibleRows.length} / {bulkGridRows.length}
              </span>
              {bulkSearch.trim()&&(
                <button type="button" onClick={()=>setBulkSearch("")}
                  style={{ border:"none",background:C.surfaceAlt,borderRadius:6,padding:"5px 8px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer",flexShrink:0 }}>
                  Clear
                </button>
              )}
            </div>
          )}

          <div onCopy={handleBulkCopy} onCut={handleBulkCut} style={{ border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden",background:C.surface }}>
            <div style={{ overflowX:"auto" }}>
              <div style={{ minWidth:bulkTableMinWidth }}>
                <div style={{ display:"grid",gridTemplateColumns:bulkGridTemplate,background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                  <button type="button" onClick={()=>{ setBulkSelection(null); setBulkSelectedRows(bulkGridRows.map((r:any)=>r.id)); }} title="Select all rows" style={{ padding:"8px 8px",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em",border:"none",borderRight:`1px solid ${C.border}`,background:C.surfaceAlt,cursor:"pointer",textAlign:"left" }}>#</button>
                  {BULK_COLUMNS.map((c:any,colIdx:number)=>(
                    <div key={c.key}
                      draggable
                      onDragStart={()=>setBulkDragIndex(colIdx)}
                      onDragOver={e=>e.preventDefault()}
                      onDrop={e=>{ e.preventDefault(); if(bulkDragIndex!==null) moveBulkColumn(bulkDragIndex,colIdx); setBulkDragIndex(null); }}
                      onDragEnd={()=>setBulkDragIndex(null)}
                      title="Drag to rearrange this column"
                      style={{ padding:"6px 7px",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em",borderRight:`1px solid ${C.border}`,cursor:"grab",display:"flex",alignItems:"center",gap:4,minWidth:0 }}>
                      <span style={{ color:C.faint,fontSize:11,lineHeight:1,flexShrink:0 }}>&#8942;&#8942;</span>
                      {bulkEditColumnNames ? (
                        <input value={c.label} onChange={e=>renameBulkColumn(c.key,e.target.value)} placeholder="Column name"
                          onClick={e=>e.stopPropagation()}
                          onMouseDown={e=>e.stopPropagation()}
                          style={{ minWidth:0,width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,outline:"none",fontSize:10,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em",padding:"4px 6px" }} />
                      ) : (
                        <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{c.label}</span>
                      )}
                      {c.custom&&<button type="button" onClick={()=>removeBulkColumn(c.key)} title="Remove custom column"
                        style={{ width:18,height:18,borderRadius:4,border:"none",background:"#FEF2F2",color:"#DC2626",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0 }}>&#215;</button>}
                    </div>
                  ))}
                </div>
                <div style={{ maxHeight:390,overflowY:"auto" }}>
                  {bulkVisibleRowsAll.length===0 ? (
                    <div style={{ padding:18,fontSize:12,color:C.muted,textAlign:"center",borderBottom:`1px solid ${C.border}` }}>
                      No matching SKU rows. Try another keyword or clear search.
                    </div>
                  ) : bulkVisibleRows.map(({row:r,idx}:any)=>{
                    const hasAny=rowHasInput(r);
                    const productMissing=hasAny&&!String(r.productName||"").trim();
                    const skuMissing=hasAny&&!String(r.sku||"").trim();
                    return (
                      <div key={r.id} style={{ display:"grid",gridTemplateColumns:bulkGridTemplate,borderBottom:`1px solid ${C.border}`,background:isBulkRowSelected(r.id)?"#EFF6FF":(productMissing||skuMissing)?"#FEF2F2":C.surface }}>
                        <button type="button" onClick={e=>selectBulkRow(idx,e)} title="Click to select row. Ctrl/Shift click for multiple rows."
                          style={{ padding:"9px 8px",fontSize:11,color:isBulkRowSelected(r.id)?C.accent:C.faint,border:"none",borderRight:`1px solid ${C.border}`,background:isBulkRowSelected(r.id)?"#DBEAFE":C.bg,display:"flex",alignItems:"center",cursor:"pointer",fontWeight:isBulkRowSelected(r.id)?700:400,textAlign:"left" }}>{idx+1}</button>
                        {BULK_COLUMNS.map((c:any,colIdx:number)=>{
                          const missing=(c.key==="productName"&&productMissing)||(c.key==="sku"&&skuMissing);
                          const selected=isBulkCellSelected(idx,colIdx);
                          const active=bulkActiveCell?.rowIndex===idx&&bulkActiveCell?.colIndex===colIdx;
                          return <input key={c.key} ref={(el:any)=>{ bulkCellRefs.current[getBulkCellKey(idx,colIdx)] = el; }} value={r[c.key]||""} placeholder={idx===0?c.placeholder:""}
                            onFocus={()=>{ if(!bulkSelecting) selectBulkCell(idx,colIdx,false); }}
                            onMouseDown={e=>handleBulkCellMouseDown(e,idx,colIdx)}
                            onMouseEnter={()=>handleBulkCellMouseEnter(idx,colIdx)}
                            onChange={e=>updateBulkCell(r.id,c.key,e.target.value)}
                            onPaste={e=>handleBulkPaste(e,idx,colIdx)}
                            onKeyDown={e=>handleBulkKeyDown(e,idx,colIdx)}
                            inputMode={c.key==="inventory"?"numeric":"text"}
                            style={{ width:"100%",height:38,padding:"8px 9px",fontSize:12,border:"none",borderRight:`1px solid ${C.border}`,boxShadow:active?`inset 0 0 0 2px ${C.accent}`:selected?`inset 0 0 0 2px #93C5FD`:"none",background:selected?"#EFF6FF":missing?"#FEF2F2":"transparent",color:C.text,outline:"none",fontFamily:c.key==="sku"?"ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace":"inherit",fontWeight:c.key==="productName"?600:400 }} />;
                        })}
                      </div>
                    );
                  })}
                  {bulkVisibleRows.length<bulkVisibleRowsAll.length&&(
                    <div style={{ padding:10,borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",justifyContent:"center" }}>
                      <button type="button" onClick={()=>setBulkRenderLimit((n:number)=>n+80)}
                        style={{ height:32,padding:"0 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,fontSize:12,fontWeight:800,cursor:"pointer" }}>
                        Load more rows ({bulkVisibleRows.length} / {bulkVisibleRowsAll.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {bulkError&&<p style={{ margin:0,fontSize:12,color:C.muted }}>{bulkError}</p>}
          {(bulkRows.length>0 || bulkMode==="edit")&&(
            <p style={{ margin:0,fontSize:12,color:bulkRows.some((r:any)=>r.error)?"#DC2626":C.muted,fontWeight:bulkRows.some((r:any)=>r.error)?700:400 }}>
              {bulkRows.filter((r:any)=>r.valid).length} valid SKU{bulkRows.filter((r:any)=>r.valid).length!==1?"s":""}{bulkRows.some((r:any)=>r.error) ? ` · Fix highlighted rows before ${bulkMode==="edit"?"saving":"importing"} invalid items.` : (bulkMode==="edit" ? (bulkRows.filter((r:any)=>r.valid).length===0 ? " ready to save as an empty sheet." : " ready to save.") : " ready to import.")}{bulkMode==="edit"?(bulkSearch.trim()?` · Showing ${bulkVisibleRows.length}/${bulkVisibleRowsAll.length} matching row${bulkVisibleRowsAll.length!==1?"s":""}. Save still applies to the full sheet.`:bulkVisibleRowsAll.length>bulkVisibleRows.length?` · Showing ${bulkVisibleRows.length}/${bulkVisibleRowsAll.length} rows for smoother editing.`:""):""}
            </p>
          )}
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
            <Btn variant="outline" onClick={()=>setBulkModal(false)}>Cancel</Btn>
            <Btn onClick={saveBulkSkus} disabled={bulkMode!=="edit" && bulkRows.filter(r=>r.valid).length===0}>{bulkMode==="edit" ? `Save ${bulkRows.filter(r=>r.valid).length} SKU${bulkRows.filter(r=>r.valid).length!==1?"s":""}` : `Import ${bulkRows.filter(r=>r.valid).length} SKU${bulkRows.filter(r=>r.valid).length!==1?"s":""}`}</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={skuModal} onClose={()=>setSkuModal(false)} title={editSkuId?"Edit SKU":"Add SKU"} width={440}>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <Field label="Brand">
            <Select value={sForm.brandId} onChange={v=>setSForm(f=>({...f,brandId:v}))}>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Product Name"><TI value={sForm.productName} onChange={v=>setSForm(f=>({...f,productName:v}))} placeholder="e.g. Quencha 750ml Tumbler Horizon" /></Field>
          <Field label="Collection" hint="select existing or type new">
            <input list="sku-collection-options" value={sForm.collection} placeholder="e.g. Horizon Collection" onChange={e=>setSForm(f=>({...f,collection:e.target.value}))}
              style={{ width:"100%",height:38,padding:"9px 12px",fontSize:14,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",boxSizing:"border-box" }} />
            <datalist id="sku-collection-options">
              {collectionOptions.map((c:any)=><option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="SKU Code"><TI value={sForm.sku} onChange={v=>setSForm(f=>({...f,sku:v}))} placeholder="e.g. QNC-TBL-750-HRZ" /></Field>
          <Field label="Inventory"><TI value={sForm.inventory} onChange={v=>setSForm(f=>({...f,inventory:v}))} placeholder="0" type="number" /></Field>
          <Field label="Status">
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {STATUS_OPTS.map(opt=>(
                <label key={opt.value} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:9,border:`2px solid ${sForm.status===opt.value?opt.color:C.border}`,cursor:"pointer",background:sForm.status===opt.value?opt.color+"08":C.surface,transition:"border-color .15s" }}>
                  <input type="radio" value={opt.value} checked={sForm.status===opt.value} onChange={e=>setSForm(f=>({...f,status:e.target.value}))} style={{ accentColor:opt.color,width:16,height:16 }} />
                  <span style={{ fontSize:13,fontWeight:600,color:sForm.status===opt.value?opt.color:C.textSub }}>{opt.label}</span>
                </label>
              ))}
              {sForm.status==="custom"&&<TI value={sForm.customStatus} onChange={v=>setSForm(f=>({...f,customStatus:v}))} placeholder="Custom status label" />}
            </div>
          </Field>
          <Btn full onClick={saveSku} disabled={!sForm.productName.trim()||!sForm.sku.trim()}>{editSkuId?"Save Changes":"Add SKU"}</Btn>
          {editSkuId&&<Btn full variant="danger" onClick={()=>{ delSku(editSkuId); setSkuModal(false); setEditSkuId(null); }}>Delete Product Row</Btn>}
        </div>
      </Modal>
    </div>
  );
};

// ─── AI TEXT GENERATOR ────────────────────────────────────────────────────────
const compressTextReferenceImage = (file: File) => new Promise<any>((resolve,reject)=>{
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Could not read image file."));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not load image file."));
    img.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not prepare image file."));
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({
        id: uid(),
        name: file.name,
        type: "image/jpeg",
        originalSize: file.size,
        compressedBytes: Math.round((dataUrl.length * 3) / 4),
        dataUrl,
      });
    };
    img.src = String(reader.result || "");
  };
  reader.readAsDataURL(file);
});

const DEFAULT_TEXT_OUTPUT_TYPES = [
  {
    id: "product_description",
    label: "Product Description",
    instruction: "Write a marketplace-ready product description. Make it clear, benefit-led, SEO-friendly, and easy to understand.",
  },
  {
    id: "marketplace_title",
    label: "Shopee/Lazada Title",
    instruction: "Create 5 Shopee/Lazada-ready product title options. Keep them searchable, concise, and keyword-rich without sounding spammy.",
  },
  {
    id: "tiktok_caption",
    label: "TikTok Caption",
    instruction: "Write 5 TikTok caption options. Keep them scroll-stopping, natural, and conversion-focused. Add light emojis only when useful.",
  },
  {
    id: "ad_copy",
    label: "Ad Copy",
    instruction: "Write paid ad copy for Meta/TikTok. Include hook, benefit, and CTA. Provide 5 options.",
  },
  {
    id: "selling_points",
    label: "Selling Points",
    instruction: "Extract and improve the strongest product selling points. Write them as short bullet points for live selling or product listing use.",
  },
  {
    id: "hashtags",
    label: "Hashtags",
    instruction: "Generate relevant hashtags for the product. Group them into branded, product, marketplace, and lifestyle hashtags.",
  },
  {
    id: "image_prompt",
    label: "Image Prompt Improver",
    instruction: "Improve this into a detailed image generation prompt for realistic commercial product photography. Keep product accuracy, scene, lighting, camera, and composition clear.",
  },
  {
    id: "video_prompt",
    label: "Video Prompt Improver",
    instruction: "Improve this into a cinematic image-to-video or text-to-video prompt. Include camera motion, subject action, pacing, lighting, and product hero focus.",
  },
];

const AITextGenerator = () => {
  const { isMobile } = useBreakpoint();
  const [taskOptions,setTaskOptions] = useState<any[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TEXT_OUTPUT_TYPES;
    try {
      const raw = localStorage.getItem("emdc_text_output_types_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return DEFAULT_TEXT_OUTPUT_TYPES;
  });
  const [task,setTask] = useState("product_description");
  const [tone,setTone] = useState("professional");
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [output,setOutput] = useState("");
  const [savedTextOutputs,setSavedTextOutputs] = useState<any[]>([]);
  const [savedTextOutputsHydrated,setSavedTextOutputsHydrated] = useState(false);
  const [referenceImages,setReferenceImages] = useState<any[]>([]);
  const [manageTypesOpen,setManageTypesOpen] = useState(false);
  const [draftTaskOptions,setDraftTaskOptions] = useState<any[]>([]);
  const [dragTaskId,setDragTaskId] = useState<string | null>(null);
  const importTypesInputRef = useRef<HTMLInputElement | null>(null);

  const toneOptions = [
    { id:"professional", label:"Professional" },
    { id:"premium", label:"Premium" },
    { id:"casual", label:"Casual" },
    { id:"taglish", label:"Taglish" },
    { id:"short", label:"Short & Direct" },
  ];

  useEffect(() => {
    cloudClientIdRef.current = uid();
    setCloudSyncStatus("Loading cloud...");
    setAppStateHydrated(true);
  }, []);

  useEffect(() => {
    if (!appStateHydrated) return;
    (async()=>{
      const cloud = await fetchCloudState("initial");
      if (cloud?.updatedAt) cloudLastUpdatedAtRef.current = cloud.updatedAt;
      setCloudHydrated(true);
    })();
  }, [appStateHydrated]);

  useEffect(() => {
    if (!cloudHydrated) return;
    const timer = setInterval(()=>fetchCloudState("poll"), PERF_CLOUD_POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [cloudHydrated]);

  useEffect(() => {
    const fn = () => setLocalSyncTick(v=>v+1);
    window.addEventListener("emdc-local-sync", fn);
    return () => window.removeEventListener("emdc-local-sync", fn);
  }, []);





  useEffect(() => {
    if (!appStateHydrated || !cloudHydrated || cloudApplyingRef.current) return;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(()=>saveCloudState(), PERF_CLOUD_SAVE_DELAY);
    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [
    appStateHydrated,
    cloudHydrated,
    localSyncTick,
    brands,
    skuStorage,
    skuTableColumns,
    checklistGroups,
    checklistAllItems,
    checklistStatuses,
    calendarManualEvents,
    calendarEventTypes,
    seasonalEvents,
  ]);

  useEffect(() => { if (onStateChange) onStateChange({ skuBrands: brands }); }, [brands]);
  useEffect(() => { if (onStateChange) onStateChange({ skuItems: skuStorage }); }, [skuStorage]);
  useEffect(() => { if (onStateChange) onStateChange({ skuTableColumns: sanitizeSkuTableColumns(skuTableColumns) }); }, [skuTableColumns]);
  useEffect(() => {
    setCalendarEventTypes((prev:any[])=>{
      const next = ensureRequiredCalendarTypes(prev);
      if(next.length===prev.length) return prev;
      return next;
    });
  },[]);

  useEffect(() => { if (onStateChange) onStateChange({ seasonalEvents }); }, [seasonalEvents]);

  const applyRoute = (next:any={}) => {
    const nextTab = safeRouteTab(next.tab ?? tab);
    const nextGroupId = next.groupId === undefined ? routeGroupId : next.groupId;
    const nextGroupTab = safeChecklistInnerTab(next.groupTab ?? routeGroupTab ?? "tasks");
    setTab(nextTab);
    setRouteGroupId(nextTab==="checklists" ? nextGroupId : null);
    setRouteGroupTab(nextTab==="checklists" ? nextGroupTab : "tasks");
    setNavigateToGroupId(nextTab==="checklists" ? nextGroupId : null);
  };

  const navigateMainTab = (nextTab:any) => {
    const safeTab = safeRouteTab(nextTab);
    applyRoute({ tab:safeTab, groupId:null, groupTab:"tasks" });
  };

  useEffect(()=>{
    if (typeof window === "undefined") return;
    const nextHash = buildEmdcRouteHash(tab,routeGroupId,routeGroupTab);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null,"",nextHash);
    }
  },[tab,routeGroupId,routeGroupTab]);

  useEffect(()=>{
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      const next = parseEmdcRoute();
      setTab(next.tab);
      setRouteGroupId(next.tab==="checklists" ? next.groupId : null);
      setRouteGroupTab(next.tab==="checklists" ? next.groupTab : "tasks");
      setNavigateToGroupId(next.tab==="checklists" ? next.groupId : null);
    };
    window.addEventListener("hashchange",onHashChange);
    return () => window.removeEventListener("hashchange",onHashChange);
  },[]);

  const copyCurrentPageLink = async () => {
    const url = getCurrentShareUrl(tab,routeGroupId,routeGroupTab);
    try {
      await navigator.clipboard.writeText(url);
      setCopyLinkStatus("Copied");
      setTimeout(()=>setCopyLinkStatus(""),1400);
    } catch {
      try {
        const box = document.createElement("textarea");
        box.value = url;
        document.body.appendChild(box);
        box.select();
        document.execCommand("copy");
        document.body.removeChild(box);
        setCopyLinkStatus("Copied");
        setTimeout(()=>setCopyLinkStatus(""),1400);
      } catch {
        setCopyLinkStatus("Copy failed");
        setTimeout(()=>setCopyLinkStatus(""),1600);
      }
    }
  };

  const handleGroupCreated = (_g:any)=>{
    // Calendar checklist events are derived from checklistGroups,
    // so new and edited group dates reflect on the Calendar automatically.
  };
  const handleNavigateToGroup = target=>{
    // target can be a groupId string OR "events" to go to Events & Seasons tab
    if(target==="events"){
      applyRoute({ tab:"events", groupId:null, groupTab:"tasks" });
    } else {
      applyRoute({ tab:"checklists", groupId:target, groupTab:"tasks" });
    }
  };
  const allCalExtra = useMemo(()=>[...seasonalCalEvents,...checklistCalEvents],[seasonalCalEvents,checklistCalEvents]);
  const pageMaxWidth = !isMobile && tab==="calendar" ? 1760 : 1280;
  const pagePadding = isMobile ? "16px 16px 90px" : tab==="calendar" ? "28px 32px" : "28px 28px";

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",background:C.bg,fontFamily:C.font,color:C.text,width:"100%",maxWidth:"100%",overflowX:"hidden" }}>
        {/* ── Top nav ─────────────────────────────────────────────────────── */}
        <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100 }}>
          <div style={{ maxWidth:1280,margin:"0 auto",padding:isMobile?"0 12px":"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,width:"100%",minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:9 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.5c2.8 1.6 4.6 4.6 4.6 8.9 0 2.1-.5 3.9-1.2 5.4h-6.8c-.7-1.5-1.2-3.3-1.2-5.4 0-4.3 1.8-7.3 4.6-8.9z" fill="#fff"/>
                  <circle cx="12" cy="10" r="1.7" fill={C.accent}/>
                  <path d="M8.6 16.8 6 21.5l3.6-1.6c.3-1 .5-2 .6-3.1h-1.6z" fill="#fff"/>
                  <path d="M15.4 16.8 18 21.5l-3.6-1.6c-.3-1-.5-2-.6-3.1h1.6z" fill="#fff"/>
                  <path d="M9.4 18.7c.3.9.9 1.7 1.6 2.3.3.2.7.2 1 0 .7-.6 1.3-1.4 1.6-2.3h-4.2z" fill="#fff" opacity=".7"/>
                </svg>
              </div>
              <span style={{ fontSize:15,fontWeight:800,color:C.text,letterSpacing:"-.02em" }}>EMDC</span>
            </div>
            {/* Desktop nav */}
            {!isMobile&&(
              <nav style={{ display:"flex",height:"100%",alignItems:"stretch" }}>
                {TABS.map(t=>(<button key={t.id} onClick={()=>navigateMainTab(t.id)} style={{ padding:"0 16px",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?C.text:C.muted,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",transition:"color .15s",letterSpacing:"-.01em",whiteSpace:"nowrap" }}>{t.label}</button>))}
              </nav>
            )}
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              {!isMobile&&<button onClick={copyCurrentPageLink} style={{ height:28,padding:"0 10px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surfaceAlt,color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:800,whiteSpace:"nowrap" }}>{copyLinkStatus || "Copy Link"}</button>}
              {isMobile&&<button onClick={copyCurrentPageLink} title="Copy page link" style={{ width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:C.surfaceAlt,color:C.textSub,cursor:"pointer",fontSize:13,fontWeight:900 }}>↗</button>}
              <span style={{ fontSize:11,color:C.faint,fontVariantNumeric:"tabular-nums" }}>{today.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</span>
            </div>
          </div>
        </div>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth:pageMaxWidth,margin:"0 auto",padding:pagePadding,width:"100%",minWidth:0,overflowX:"hidden" }}>
          <div style={{ marginBottom:isMobile?16:20 }}>
            <h1 style={{ margin:"0 0 2px",fontSize:isMobile?16:18,fontWeight:700,color:C.text,letterSpacing:"-.02em" }}>{TABS.find(t=>t.id===tab)?.label}</h1>
            <p style={{ margin:0,fontSize:12,color:C.faint }}>
              {tab==="calendar"   && "Track all events across campaigns, launches, and deadlines."}
              {tab==="events"     && "Seasonal events and campaigns with product recommendations."}
              {tab==="checklists" && "Operational checklists by SKU, launch type, and department."}
              {tab==="skus"       && "Product catalog by brand, SKU, inventory, and status."}
              {tab==="ai"         && "AI tools, prompt builders, generators, and workflow automations."}
            </p>
            <p style={{ margin:"6px 0 0",fontSize:11,color:cloudSyncStatus==="Sync save failed" ? "#DC2626" : C.faint }}>
              Shared Sync: {cloudSyncStatus}
            </p>
          </div>
          {tab==="calendar"   && <CalendarView extraEvents={allCalExtra} seasonalEvents={seasonalEvents} setSeasonalEvents={setSeasonalEvents} brands={brands} skuStorage={skuStorage} setSkuStorage={setSkuStorage} onNavigateToGroup={handleNavigateToGroup} onStateChange={onStateChange} manualEvents={calendarManualEvents} setManualEvents={setCalendarManualEvents} eventTypes={calendarEventTypes} setEventTypes={setCalendarEventTypes} />}
          {tab==="events"     && <EventsView skuStorage={skuStorage} brands={brands} onStateChange={onStateChange} events={seasonalEvents} setEvents={setSeasonalEvents} eventTypes={calendarEventTypes} setEventTypes={setCalendarEventTypes} />}
          {tab==="checklists" && <ChecklistView onGroupCreated={handleGroupCreated} skuStorage={skuStorage} brands={brands} seasonalEvents={seasonalEvents} setSeasonalEvents={setSeasonalEvents} calendarTypes={calendarEventTypes} navigateToGroupId={navigateToGroupId} navigateToGroupTab={routeGroupTab} onGroupNavigated={()=>setNavigateToGroupId(null)} onRouteChange={applyRoute} onStateChange={onStateChange} groups={checklistGroups} setGroups={setChecklistGroups} allGroupItems={checklistAllItems} setAllGroupItems={setChecklistAllItems} statuses={checklistStatuses} setStatuses={setChecklistStatuses} />}
          {tab==="skus"       && <SKUStorage brands={brands} setBrands={setBrands} skuStorage={skuStorage} setSkuStorage={setSkuStorage} skuTableColumns={skuTableColumns} setSkuTableColumns={setSkuTableColumns} onStateChange={onStateChange} />}
          <div style={{ display: tab==="ai" ? "block" : "none" }}><AIEngineView skuStorage={skuStorage} brands={brands} /></div>
        </div>

        {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
        {isMobile&&(
          <div style={{ position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>navigateMainTab(t.id)} style={{ flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <span style={{ fontSize:18,lineHeight:1 }}>{TAB_ICONS[t.id]}</span>
                <span style={{ fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?C.accent:C.faint }}>{TAB_SHORT[t.id]}</span>
                {tab===t.id&&<div style={{ width:4,height:4,borderRadius:"50%",background:C.accent }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
