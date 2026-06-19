"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:"#F8F9FA", surface:"#FFFFFF", surfaceAlt:"#F3F4F6",
  border:"#E5E7EB", borderStrong:"#D1D5DB",
  text:"#111827", textSub:"#374151", muted:"#6B7280", faint:"#9CA3AF",
  accent:"#111827", font:"'Inter', system-ui, -apple-system, sans-serif",
};

// ─── RESPONSIVE HOOK ────────────────────────────────────────────────────────
const useBreakpoint = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 768);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
};

// ─── GLOBAL STYLES (injected once) ──────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    const id = "emdc-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
      body{margin:0;font-family:'Inter',system-ui,sans-serif;}
      input,select,button,textarea{font-family:inherit;}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-track{background:transparent;}
      ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
      .emdc-btn:hover{opacity:.85;}
      .emdc-row:hover{background:#F9FAFB;}
      .emdc-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.07);}
      .emdc-chip:hover{background:#F3F4F6;}
      @media(max-width:639px){
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
  reactivation:{ label:"Product Reactivation",  tag:"Relaunch",  color:"#374151" },
  phaseout:    { label:"Product Phase-Out",      tag:"Closeout",  color:"#9CA3AF" },
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
  reactivation:{
    ecommerce:["Audit and update existing listings — refresh titles, descriptions, images","Review historical pricing and set competitive relaunch price points","Reassess inventory levels and restock allocation per channel","Update product categorization and search keyword tags","Re-enable listings that were paused or delisted","Set up relaunch bundle or value-add promotional offer","Check and resolve any previous platform flags, reviews, or disputes","Sync updated product data via Ginee across all active channels","Configure flash deal or voucher mechanic for relaunch window","QA all updated listings before go-live"],
    marketing:["Define relaunch narrative — what has changed or improved","Develop new and improved or back by demand campaign angle","Plan content rollout to address previous customer pain points","Brief influencer or affiliate partners on updated product story","Schedule re-engagement email to past purchasers via Klaviyo","Set up retargeting campaign targeting previous product page visitors","Coordinate platform relaunch mechanics (featured listing, flash deal)","Draft announcement copy for social channels","Align relaunch timing with payday cycle or platform campaign window","Track relaunch uplift vs. previous performance baseline"],
    digital:["Produce updated product photography reflecting changes or new packaging","Redesign listing infographics to highlight product improvements","Create before vs after visual comparison asset","Develop refreshed social media content set (feed + Stories + Reels)","Produce short-form video communicating the relaunch story","Update Meta Ads creative set with revised messaging","Revise Shopify product page visuals and featured banner","Deliver updated Klaviyo email design for re-engagement send","Ensure all assets are consistent with updated product positioning","Archive revised files and deprecate outdated creative assets"],
  },
  phaseout:{
    ecommerce:["Flag SKU(s) internally as phase-out status — notify all stakeholders","Reduce inventory allocation to minimum across channels","Set clearance pricing to accelerate sell-through","Add bundle or bundle-with-replacement offer to redirect demand","Schedule listing deactivation date post-stock depletion","Disable replenishment and purchasing orders for this SKU","Update product title or description to reflect final stock status if needed","Coordinate with warehouse on remaining inventory disposition","Ensure replacement or successor product is ready before full delisting","Document final sales data and channel performance for records"],
    marketing:["Plan final stock clearance campaign with urgency messaging","Draft internal announcement to sales and support teams","Suppress SKU from ongoing paid media campaigns","Redirect any active campaigns toward replacement or alternative product","Create last-chance email send to past purchasers via Klaviyo","Communicate product discontinuation to key affiliates and partners","Update any active landing pages referencing the discontinued SKU","Monitor clearance sell-through rate and adjust promotions accordingly","Archive campaign and performance documentation","Brief team on transition messaging to maintain brand continuity"],
    digital:["Remove product from active featured placements on website and social","Create clearance sale asset set (banners, Stories, Reels)","Update Shopify product page to reflect clearance or final stock status","Suppress discontinued SKU from catalog and collection displays","Produce transition content introducing the replacement product if applicable","Archive all production files, raw assets, and final exports","Update Klaviyo template visuals for clearance email","Remove or replace ads featuring discontinued product","Notify design team to exclude SKU from future campaign briefs","Document asset archive location and update internal file index"],
  },
};

const uid = () => Math.random().toString(36).slice(2,9);
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
  { id:"task",     label:"Task",     color:"#374151" },
  { id:"campaign", label:"Campaign", color:"#F59E0B" },
  { id:"deadline", label:"Deadline", color:"#EF4444" },
  { id:"launch",   label:"Launch",   color:"#22C55E" },
  { id:"meeting",  label:"Meeting",  color:"#3B82F6" },
  { id:"holiday",  label:"Holiday",  color:"#9CA3AF" },
];
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
  const base = { display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:pad,fontSize:fs,fontWeight:600,borderRadius:7,border:"none",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.4:1,transition:"all .15s",whiteSpace:"nowrap",width:full?"100%":"auto",...style };
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
  const [mode,setMode]=useState(recurring?"monthly":"date");
  const monthlyDays = recurring ? value.replace("monthly:","").split(",").filter(Boolean) : ["15","30"];
  const [customDay,setCustomDay] = useState("");
  useEffect(()=>{ if(typeof value==="string") setMode(value.startsWith("monthly:")?"monthly":"date"); },[value]);

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
      <Select value={mode} onChange={v=>{setMode(v); onChange(v==="monthly"?`monthly:${monthlyDays.join(",")}`:"");}} style={{width:140,flexShrink:0}}>
        <option value="date">Specific date</option>
        <option value="monthly">Recurring monthly</option>
      </Select>
      {mode==="date" && (
        <input type="date" value={recurring?"":(value||"")} onChange={e=>onChange(e.target.value)}
        style={{ flex:1,height:38,padding:"9px 12px",fontSize:14,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",WebkitAppearance:"none",appearance:"none",colorScheme:"light",fontFamily:"inherit" }} />
      )}
    </div>
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
    lineHeight:"40px",
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

const ColorPicker = ({ value, onChange, palette=STATUS_PALETTE }) => (
  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
    {palette.map(c=>(
      <button key={c} onClick={()=>onChange(c)} style={{ width:28,height:28,borderRadius:6,background:c,border:value===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer",flexShrink:0,transition:"transform .1s",transform:value===c?"scale(1.1)":"scale(1)" }} />
    ))}
    <label style={{ width:28,height:28,borderRadius:6,border:`1.5px solid ${C.border}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.faint }} title="Custom">
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{ width:1,height:1,opacity:0,position:"absolute" }} />
      +
    </label>
  </div>
);

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
  const [query,setQuery] = useState("");
  const [open,setOpen]   = useState(false);
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

  const categoryOptions = useMemo(()=>{
    const set = new Set<string>();
    (skuStorage||[]).forEach((s:any)=>{
      const value = getPickerCollection(s);
      if(value) set.add(value);
    });
    return Array.from(set).sort((a:string,b:string)=>a.localeCompare(b));
  },[skuStorage]);

  useEffect(()=>{
    if(categoryFilter==="all") return;
    if(!categoryOptions.includes(categoryFilter)) setCategoryFilter("all");
  },[categoryFilter,categoryOptions]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (skuStorage||[]).filter((s:any) => {
      const brandName = brands.find((b:any)=>b.id===s.brandId)?.name || "";
      const collectionName = getPickerCollection(s);

      if(categoryFilter!=="all" && collectionName !== categoryFilter) return false;

      if(!q) return true;

      const searchable = [
        s.productName,
        s.sku,
        collectionName,
        s.collection,
        s.category,
        s.productCategory,
        s.inventory,
        s.status,
        brandName,
        Object.values(s.extraFields || {}).join(" "),
      ].filter(Boolean).join(" ").toLowerCase();

      return searchable.includes(q);
    });

    return list;
  }, [query,skuStorage,brands,categoryFilter]);

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
    results.forEach((s:any)=>{
      if (!selectedSet.has(s.id)) onSelect(s);
    });
  };

  return (
    <div ref={ref} style={{ position:"relative",display:"flex",flexDirection:"column",gap:8 }}>
      {categoryOptions.length>0&&(
        <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:8,alignItems:"center" }}>
          <Select value={categoryFilter} onChange={v=>{ setCategoryFilter(v); setOpen(true); }}>
            <option value="all">All Collections / Categories</option>
            {categoryOptions.map((option:string)=><option key={option} value={option}>{option}</option>)}
          </Select>
          {categoryFilter!=="all"&&(
            <button type="button" onClick={()=>setCategoryFilter("all")}
              style={{ height:40,border:`1.5px solid ${C.border}`,background:C.surfaceAlt,borderRadius:8,padding:"0 10px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer",whiteSpace:"nowrap" }}>
              Clear
            </button>
          )}
        </div>
      )}

      <TI value={query} onChange={v=>{setQuery(v);setOpen(true);}} placeholder={placeholder}
        style={{ paddingLeft:12 }}
        onFocus={()=>setOpen(true)}
      />
      {open&&(
        <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:400,maxHeight:420,overflowY:"auto" }}>
          <div style={{ position:"sticky",top:0,zIndex:1,background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:11,color:C.muted,fontWeight:700 }}>
              {results.length} SKU{results.length===1?"":"s"} found{categoryFilter!=="all"?` · ${categoryFilter}`:""}
            </span>
            {multiSelect&&results.length>0&&(
              <button type="button" onMouseDown={e=>{e.preventDefault();selectAllVisible();}} style={{ border:`1px solid ${C.border}`,background:C.surfaceAlt,borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:700,color:C.textSub,cursor:"pointer" }}>
                Select all visible
              </button>
            )}
          </div>

          {results.length===0&&(
            <div style={{ padding:16,fontSize:12,color:C.muted,textAlign:"center" }}>No matching SKUs found.</div>
          )}

          {results.map((s:any)=>{ const brand=brands.find((b:any)=>b.id===s.brandId); const checked=selectedSet.has(s.id); const collectionName=getPickerCollection(s); return (
            <div key={s.id} onMouseDown={e=>{ e.preventDefault(); handlePick(s); }}
              className="emdc-row"
              style={{ padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,background:checked?C.surfaceAlt:C.surface }}>
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
  const [newLabel,setNewLabel] = useState("");
  const [newColor,setNewColor] = useState("#3B82F6");

  const startEdit = t => { setEditId(t.id); setEditLabel(t.label); setEditColor(t.color); };
  const saveEdit  = () => {
    if (!editLabel.trim()) return;
    onChange(eventTypes.map(t => t.id===editId ? {...t, label:editLabel.trim(), color:editColor} : t));
    setEditId(null);
  };
  const addType = () => {
    if (!newLabel.trim()) return;
    onChange([...eventTypes, { id:uid(), label:newLabel.trim(), color:newColor }]);
    setNewLabel(""); setNewColor("#3B82F6");
  };
  const removeType = id => onChange(eventTypes.filter(t => t.id!==id));

  return (
    <Modal open={open} onClose={()=>{onClose();setEditId(null);}} title="Manage Event Types" width={460}>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <p style={{ margin:"0 0 4px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em" }}>Current Types</p>
        {eventTypes.map(t => (
          <div key={t.id}>
            {editId===t.id ? (
              <div style={{ padding:14,background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}` }}>
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <Field label="Label"><TI value={editLabel} onChange={setEditLabel} placeholder="Type name" /></Field>
                  <Field label="Color"><ColorPicker value={editColor} onChange={setEditColor} palette={EVENT_COLORS} /></Field>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Btn sm onClick={saveEdit} disabled={!editLabel.trim()}>Save</Btn>
                    <Btn sm variant="outline" onClick={()=>setEditId(null)}>Cancel</Btn>
                    <span style={{ padding:"3px 10px",borderRadius:5,background:editColor+"18",border:`1px solid ${editColor}28`,fontSize:12,fontWeight:600,color:editColor }}>{editLabel||"Preview"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.surfaceAlt,borderRadius:9,border:`1px solid ${C.border}` }}>
                <div style={{ width:12,height:12,borderRadius:3,background:t.color,flexShrink:0 }} />
                <span style={{ flex:1,fontSize:13,fontWeight:600,color:C.text }}>{t.label}</span>
                <span style={{ padding:"2px 8px",borderRadius:4,background:t.color+"18",color:t.color,border:`1px solid ${t.color}28`,fontSize:11,fontWeight:700 }}>{t.label}</span>
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
            <Field label="Color"><ColorPicker value={newColor} onChange={setNewColor} palette={EVENT_COLORS} /></Field>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <Btn sm onClick={addType} disabled={!newLabel.trim()}>Add Type</Btn>
              {newLabel&&<span style={{ padding:"3px 10px",borderRadius:5,background:newColor+"18",border:`1px solid ${newColor}28`,fontSize:12,fontWeight:600,color:newColor }}>{newLabel}</span>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── CALENDAR ────────────────────────────────────────────────────────────────
const CalendarView = ({ extraEvents=[], seasonalEvents=[], setSeasonalEvents, brands=[], onNavigateToGroup, onStateChange, manualEvents, setManualEvents, eventTypes, setEventTypes }: any) => {
  const { isMobile } = useBreakpoint();
  const [year,setYear]   = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth());
  const saveEventTypes = (types: any[]) => { setEventTypes(types); if(onStateChange) onStateChange({calendarTypes:types}); };
  const [filter,setFilter]       = useState("all");
  const [addModal,setAddModal]   = useState(false);
  const [editModal,setEditModal] = useState(false);
  const [typesModal,setTypesModal] = useState(false);
  const [detailEv,setDetailEv]   = useState(null);
  const [editForm,setEditForm]   = useState(null);
  const [yearOverview,setYearOverview] = useState<any>(null);
  const [seasonalEditForm,setSeasonalEditForm] = useState<any>(null);
  const [phaseoutBrandFilter,setPhaseoutBrandFilter] = useState("all");
  const [addForm,setAddForm]     = useState({ title:"",type:"task",date:"",color:"#374151" });
  const [dayView,setDayView]     = useState(null); // { date, label }
  const [prevDayView,setPrevDayView] = useState(null); // to go back from detail to day list

  // Helper: look up type color from live eventTypes
  const typeColor = id => eventTypes.find(t=>t.id===id)?.color || "#9CA3AF";
  const typeLabel = id => eventTypes.find(t=>t.id===id)?.label || id;

  const allEvents = useMemo(()=>[...manualEvents,...extraEvents],[manualEvents,extraEvents]);

  // Date helpers must be defined before yearly list memo uses them during prerender.
  const dateKey = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;
  const parseDate = s => s ? new Date(s+"T00:00:00") : null;
  const formatDate = s => {
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
        color:ev.color,
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
      color:ev.color || typeColor(ev.type),
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
      color:ev.color,
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

  const phaseoutSkuLinks = useMemo(()=>{
    const knownBrands = (brands||[]).map((b:any)=>String(b.name||"").trim()).filter(Boolean);
    const byProduct:any = {};

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

        const brandName = detectBrand(label);
        const key = `${brandName}__${label}`;

        if(!byProduct[key]) byProduct[key] = { label, brandName, events:[] };
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
  },[seasonalEvents,brands]);

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
      color: ev.color,
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
      <Field label="Type">
        <Select value={seasonalEditForm.type||"seasonal"} onChange={v=>setSeasonalEditForm((f:any)=>({...f,type:v}))}>
          <option value="holiday">Holiday</option>
          <option value="seasonal">Seasonal</option>
          <option value="campaign">Campaign</option>
        </Select>
      </Field>
      <Field label="Color">
        <ColorPicker value={seasonalEditForm.color||"#374151"} onChange={v=>setSeasonalEditForm((f:any)=>({...f,color:v}))} palette={EVENT_COLORS} />
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
            <button onClick={()=>setTypesModal(true)} style={{ height:32,padding:"0 12px",borderRadius:7,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textSub,whiteSpace:"nowrap" }}>Types</button>
            <button onClick={()=>setAddModal(true)} style={{ height:32,padding:"0 14px",borderRadius:7,border:"none",background:C.accent,cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap" }}>+ Add</button>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:10,WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none" }}>
        {[{id:"all",label:"All",color:C.accent},...eventTypes].map(t=>(
          <button key={t.id} onClick={()=>setFilter(t.id)}
            style={{ padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
              background:filter===t.id?t.color:C.surface,
              color:filter===t.id?"#fff":C.muted,
              border:`1.5px solid ${filter===t.id?t.color:C.border}`,
              whiteSpace:"nowrap",flexShrink:0,letterSpacing:".01em" }}>
            {t.label}
          </button>
        ))}
      </div>

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
                  const rs=getRangeStyle(ev,d), ec=ev.color||"#9CA3AF";
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
                  const ec = ev.color || typeColor(ev.type);
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

      {/* Legend */}
      <div style={{ display:"flex",gap:8,marginTop:12,flexWrap:"wrap" }}>
        {eventTypes.map(t=>(
          <div key={t.id} style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ width:8,height:8,borderRadius:2,background:t.color,flexShrink:0 }} />
            <span style={{ fontSize:11,color:C.muted }}>{t.label}</span>
          </div>
        ))}
        <div style={{ width:1,background:C.border,margin:"0 4px",alignSelf:"stretch" }} />
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <div style={{ width:8,height:8,borderRadius:2,background:"#8B5CF6",flexShrink:0 }} />
          <span style={{ fontSize:11,color:C.muted }}>Checklist Deadline</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <div style={{ width:8,height:8,borderRadius:2,background:"#14B8A6",flexShrink:0 }} />
          <span style={{ fontSize:11,color:C.muted }}>Seasonal Event</span>
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
                            <span style={{ fontSize:10,color:item.color||C.faint,background:(item.color||C.faint)+"14",border:`1px solid ${(item.color||C.faint)}28`,borderRadius:5,padding:"1px 6px",fontWeight:700 }}>{item.type}</span>
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
            <p style={{ margin:0,fontSize:12,color:C.muted }}>Filter by brand to see which phase-out SKUs are linked to each event/season.</p>
          </div>
          <span style={{ fontSize:11,fontWeight:800,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"4px 9px" }}>
            ⚑ {filteredPhaseoutSkuLinks.length} / {phaseoutSkuLinks.length} SKU{phaseoutSkuLinks.length!==1?"s":""}
          </span>
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
          <p style={{ margin:0,fontSize:12,color:C.muted }}>No phase-out SKUs linked to events/seasons yet. Use the Product Phase-Out AI Helper from Checklists.</p>
        ) : filteredPhaseoutSkuLinks.length===0 ? (
          <p style={{ margin:0,fontSize:12,color:C.muted }}>No phase-out SKUs found for this brand.</p>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
            {filteredPhaseoutSkuLinks.map((item:any)=>(
              <div key={`${item.brandName}-${item.label}`} style={{ border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,overflow:"hidden" }}>
                <div style={{ padding:"9px 10px",background:"#FFFBEB",borderBottom:"1px solid #FDE68A",display:"flex",gap:8,alignItems:"center" }}>
                  <span style={{ width:22,height:22,borderRadius:999,background:"#F59E0B",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0 }}>⚑</span>
                  <div style={{ minWidth:0,flex:1 }}>
                    <p style={{ margin:0,fontSize:12,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{String(item.label||"").startsWith(String(item.brandName||"")+" - ")?String(item.label||"").slice(String(item.brandName||"").length+3):item.label}</p>
                    <p style={{ margin:"2px 0 0",fontSize:10,color:"#B45309",fontWeight:800,textTransform:"uppercase",letterSpacing:".04em" }}>{item.brandName}</p>
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column" }}>
                  {item.events.map((ev:any)=>(
                    <button key={ev.id} type="button" onClick={()=>openSeasonalEdit(ev.id)}
                      style={{ textAlign:"left",border:"none",borderBottom:`1px solid ${C.border}`,background:C.surface,padding:"8px 10px",cursor:"pointer" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                        <span style={{ minWidth:0,fontSize:12,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.name}</span>
                        <span style={{ flexShrink:0,fontSize:10,color:ev.color||C.faint,background:(ev.color||C.faint)+"14",border:`1px solid ${(ev.color||C.faint)}28`,borderRadius:5,padding:"1px 6px",fontWeight:700 }}>{ev.type}</span>
                      </div>
                      <div style={{ marginTop:3,fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                        {ev.date || "No specific date"} · Click to edit event
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Year list overview */}
      <Modal open={!!yearOverview} onClose={()=>setYearOverview(null)} title={yearOverview?.event?.name || yearOverview?.event?.title || yearOverview?.item?.title || "Overview"} width={560}>
        {yearOverview&&(()=>{
          const ev:any = yearOverview.event || {};
          const item:any = yearOverview.item || {};
          const color = ev.color || item.color || C.accent;
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
          const SEASONAL_TYPE_MAP = { holiday:{label:"Holiday",color:"#F97316"}, seasonal:{label:"Seasonal",color:"#22C55E"}, campaign:{label:"Campaign",color:"#F59E0B"} };
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
                  const tLabel = isSeasonal?(SEASONAL_TYPE_MAP[ev.seasonalType]?.label||"Seasonal"):isChecklist?"Deadline":typeLabel(ev.type);
                  const tColor = isSeasonal?(SEASONAL_TYPE_MAP[ev.seasonalType]?.color||"#14B8A6"):isChecklist?"#8B5CF6":typeColor(ev.type);
                  return (
                    <div key={ev.id} style={{ padding:"12px 14px",background:C.surfaceAlt,borderRadius:10,borderLeft:`4px solid ${ev.color||tColor}`,cursor:"pointer" }}
                      onClick={()=>{ setPrevDayView(dayView); setDayView(null); setDetailEv(ev); }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:"0 0 4px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.title}</p>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                            <Tag color={tColor} sm>{tLabel}</Tag>
                            {ev.dateEnd&&<span style={{ fontSize:10,color:C.muted }}>{ev.date} → {ev.dateEnd}</span>}
                            {isSeasonal&&<Tag color="#14B8A6" sm>Seasonal</Tag>}
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
        title="Event Details">
        {detailEv&&(()=>{
          const SEASONAL_TYPE_MAP = {
            holiday:  { label:"Holiday",  color:"#F97316" },
            seasonal: { label:"Seasonal", color:"#22C55E" },
            campaign: { label:"Campaign", color:"#F59E0B" },
          };
          const isChecklist = !!detailEv.fromChecklist;
          const isSeasonal  = !!detailEv.fromSeasonal;
          const isManual    = !isChecklist && !isSeasonal;
          const tLabel = isSeasonal ? (SEASONAL_TYPE_MAP[detailEv.seasonalType]?.label||"Seasonal") : isChecklist ? "Deadline" : typeLabel(detailEv.type);
          const tColor = isSeasonal ? (SEASONAL_TYPE_MAP[detailEv.seasonalType]?.color||"#14B8A6") : isChecklist ? "#8B5CF6" : typeColor(detailEv.type);

          return (
            <div>
              <div style={{ padding:"14px 16px",background:C.surfaceAlt,borderRadius:12,borderLeft:`4px solid ${detailEv.color||tColor}`,marginBottom:16 }}>
                <p style={{ margin:"0 0 4px",fontSize:16,fontWeight:700,color:C.text }}>{detailEv.title}</p>
                <p style={{ margin:"0 0 8px",fontSize:12,color:C.muted }}>
                  {formatDate(detailEv.date)}{detailEv.dateEnd&&<span> → {detailEv.dateEnd}</span>}
                </p>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <Tag color={tColor}>{tLabel}</Tag>
                  {isSeasonal&&<Tag color="#14B8A6">Seasonal Event</Tag>}
                  {isChecklist&&<Tag color="#8B5CF6">Checklist Deadline</Tag>}
                  {detailEv.dateEnd&&<Tag color={C.muted}>Multi-day</Tag>}
                </div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {isManual&&<Btn full onClick={()=>openEdit(detailEv)}>Edit Event</Btn>}
                {isManual&&<Btn full variant="danger" onClick={()=>{ setManualEvents((p:any)=>{ const next=p.filter((e:any)=>e.id!==detailEv.id); if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setDetailEv(null); }}>Delete Event</Btn>}
                {isSeasonal&&onNavigateToGroup&&<Btn full variant="outline" onClick={()=>{ onNavigateToGroup("events"); setDetailEv(null); }}>Edit in Events &amp; Seasons &#8250;</Btn>}
                {isChecklist&&onNavigateToGroup&&<Btn full variant="outline" onClick={()=>{ onNavigateToGroup(detailEv.groupId); setDetailEv(null); }}>Open Checklist Group &#8250;</Btn>}
                <Btn full variant="ghost" onClick={()=>setDetailEv(null)}>Close</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};


// ─── EVENTS & SEASONS ────────────────────────────────────────────────────────
const EventsView = ({ skuStorage, brands, onStateChange, events, setEvents }: any) => {
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
  const [dragEventId,setDragEventId]       = useState<any>(null);
  const [evForm,setEvForm] = useState({ name:"",date:"",type:"holiday",color:"#374151",desc:"",calDate:"",calDateEnd:"",months:[] });

  const TYPE_COLORS = { holiday:"#374151",seasonal:"#111827",campaign:"#6B7280" };
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
    if (ev.calDate && /^\d{4}-\d{2}-\d{2}$/.test(String(ev.calDate))) {
      const d = new Date(ev.calDate+"T00:00:00");
      if (!Number.isNaN(d.getTime())) return { index:d.getMonth(), label:MONTHS[d.getMonth()], day:d.getDate() };
    }
    const txt = String(ev.date || "").toLowerCase();
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

  const sortedFiltered = useMemo(()=>[...filtered].sort((a:any,b:any)=>{
    const am=getEventMonthInfo(a), bm=getEventMonthInfo(b);
    const ao = a.manualOrder ?? am.day;
    const bo = b.manualOrder ?? bm.day;
    return (am.index-bm.index) || (ao-bo) || (am.day-bm.day) || String(a.name).localeCompare(String(b.name));
  }),[filtered]);

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

  const reorderEventCards = (fromId:any,toId:any) => {
    if (!fromId || !toId || fromId===toId) return;
    const ids = sortedFiltered.map((e:any)=>e.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex<0 || toIndex<0) return;
    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIndex,1);
    nextIds.splice(toIndex,0,moved);
    setEvents((prev:any[])=>{
      const next = prev.map((ev:any)=>nextIds.includes(ev.id)?{...ev,manualOrder:nextIds.indexOf(ev.id)}:ev);
      if(onStateChange) onStateChange({seasonalEvents:next});
      return next;
    });
  };

  const resetEventSortToDate = () => {
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
      <Field label="Type">
        <Select value={form.type} onChange={v=>setForm(f=>({...f,type:v}))}>
          <option value="holiday">Holiday</option><option value="seasonal">Seasonal</option><option value="campaign">Campaign</option>
        </Select>
      </Field>
      <Field label="Color"><ColorPicker value={form.color} onChange={v=>setForm(f=>({...f,color:v}))} palette={EVENT_COLORS} /></Field>
      <Field label="Description" hint="(optional)"><TI value={form.desc||""} onChange={v=>setForm(f=>({...f,desc:v}))} placeholder="Brief description" /></Field>
      <Btn full onClick={onSave} disabled={!form.name.trim()}>{saveLabel}</Btn>
      {onDelete&&<Btn full variant="danger" onClick={onDelete}>Delete Event</Btn>}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10 }}>
        <div style={{ display:"flex",gap:6,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:2 }}>
          {["all","holiday","seasonal","campaign"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"capitalize",background:filter===f?C.accent:C.surface,color:filter===f?"#fff":C.muted,border:`1.5px solid ${filter===f?C.accent:C.border}`,whiteSpace:"nowrap",flexShrink:0 }}>{f==="all"?"All":f}</button>))}
        </div>
        <Btn sm onClick={()=>setAddEventModal(true)}>+ Add Event</Btn>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <p style={{ margin:0,fontSize:12,color:C.muted }}>
            Sorted from start to end of year, grouped by month. Drag cards to manually rearrange within the list.
          </p>
          <Btn xs variant="outline" onClick={resetEventSortToDate}>Sort by Date</Btn>
        </div>

        {groupedEvents.map((group:any)=>(
          <section key={group.label} style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <h3 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>{group.label}</h3>
              <span style={{ fontSize:11,color:C.faint,fontWeight:700 }}>{group.events.length}</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,340px),1fr))",gap:12 }}>
              {group.events.map((ev:any)=>{
          const isOpen=expanded===ev.id, tc=TYPE_COLORS[ev.type]||C.muted;
          const evProducts = Array.isArray(ev.products) ? ev.products : [];
          const phaseoutCount = evProducts.filter(isPhaseoutProduct).length;
          return (
            <div key={ev.id}
              draggable
              onDragStart={()=>setDragEventId(ev.id)}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); reorderEventCards(dragEventId,ev.id); setDragEventId(null); }}
              onDragEnd={()=>setDragEventId(null)}
              className="emdc-card"
              style={{ background:C.surface,borderRadius:12,border:`1.5px solid ${dragEventId===ev.id?C.accent:C.border}`,borderLeft:`4px solid ${ev.color||tc}`,overflow:"hidden",transition:"box-shadow .2s",opacity:dragEventId===ev.id?.75:1,cursor:"grab" }}>
              <div style={{ padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }} onClick={()=>setExpanded(isOpen?null:ev.id)}>
                <div style={{ minWidth:0,marginRight:8 }}>
                  <p style={{ margin:"0 0 5px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.name}</p>
                  <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                    <Tag color={ev.color||tc} sm>{ev.type}</Tag>
                    <span style={{ fontSize:11,color:C.faint }}>{ev.date}</span>
                    {phaseoutCount>0&&(
                      <span style={{ fontSize:10,fontWeight:800,color:"#B45309",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:999,padding:"2px 7px" }}>
                        {phaseoutCount} phase-out SKU{phaseoutCount>1?"s":""}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex",gap:4,alignItems:"center",flexShrink:0 }}>
                  <button onClick={e=>{e.stopPropagation();setEditEvForm({...ev});setEditEvModal(true);}} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                  <button onClick={e=>{e.stopPropagation();setExpanded(isOpen?null:ev.id);}}
                    style={{ height:28,padding:"0 10px",borderRadius:6,border:`1px solid ${isOpen?C.accent:C.border}`,background:isOpen?C.accent:C.surfaceAlt,cursor:"pointer",color:isOpen?"#fff":C.muted,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>
                    {isOpen?"Done":"View"}
                  </button>
                </div>
              </div>

              {isOpen&&(
                <div style={{ borderTop:`1px solid ${C.border}` }}>
                  {ev.desc&&<p style={{ margin:0,padding:"12px 16px",fontSize:13,color:C.muted,lineHeight:1.6,borderBottom:`1px solid ${C.border}` }}>{ev.desc}</p>}
                  <div style={{ padding:"14px 16px" }}>
                    <p style={{ margin:"0 0 10px",fontSize:11,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>Recommended Products</p>
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      {evProducts.map((p,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isPhaseoutProduct(p)?"#FFFBEB":C.bg,borderRadius:8,borderLeft:`2px solid ${isPhaseoutProduct(p)?"#F59E0B":(ev.color||C.borderStrong)}` }}>
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

      <Modal open={addEventModal} onClose={()=>setAddEventModal(false)} title="Add Custom Event" width={500}>
        {renderEvForm({
          form: evForm,
          setForm: setEvForm,
          saveLabel: "Add Event",
          onSave: ()=>{ if(!evForm.name.trim()) return; setEvents((p:any)=>{ const next=[...p,{id:uid(),...evForm,calDate:evForm.calDate||null,calDateEnd:evForm.calDateEnd||null,products:[]}]; if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEvForm({name:"",date:"",type:"holiday",color:"#374151",desc:"",calDate:"",calDateEnd:"",months:[]}); setAddEventModal(false); },
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
    <div style={{ background:item.done?C.bg:C.surface,borderRadius:8,border:`1.5px solid ${item.done?"#E5E7EB":C.border}`,borderLeft:`3px solid ${item.done?"#D1D5DB":color}`,marginBottom:8,overflow:"hidden",opacity:item.done?.6:1,transition:"all .2s" }}>
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
const ChecklistBoard = ({ group, onBack, skuStorage, brands, templates, launchTypes, events, onStateChange, initialItems, onItemsChange, statuses, setStatuses, onUpdateGroup }: any) => {
  const { isMobile } = useBreakpoint();
  const saveStatuses = (s:any[]) => { setStatuses(s); };
  const [statusModal,setStatusModal] = useState(false);
  const [groupEditModal,setGroupEditModal] = useState(false);
  const [items,setItems] = useState(()=>{ if(initialItems) return initialItems; const out:any={}; Object.keys(DEPTS).forEach(dept=>{ out[dept]=(templates[group.launchType]?.[dept]||[]).map((t:string)=>({id:uid(),text:t,done:false,link:"",note:"",assignee:"",statusId:""})); }); return out; });
  const [newText,setNewText]         = useState({ecommerce:"",marketing:"",digital:""});
  const [activeDept,setActiveDept]   = useState("all");
  const [skuPickDept,setSkuPickDept] = useState(null);

  useEffect(()=>{
    if(!initialItems) return;
    setItems(initialItems);
  },[initialItems]);

  const upd    = (dept:string,item:any) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].map((i:any)=>i.id===item.id?item:i)}; if(onItemsChange) onItemsChange(next); return next; });
  const del    = (dept:string,id:string) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].filter((i:any)=>i.id!==id)}; if(onItemsChange) onItemsChange(next); return next; });
  const addItem= (dept:string)=>{ if(!newText[dept].trim()) return; setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text:newText[dept],done:false,link:"",note:"",assignee:"",statusId:"",custom:true}]}; if(onItemsChange) onItemsChange(next); return next; }); setNewText((p:any)=>({...p,[dept]:""})); };
  const addFromSKU=(dept,s)=>{ const b=brands.find(x=>x.id===s.brandId); const text=[b?.name,s.productName,s.sku].filter(Boolean).join(" - "); setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text,done:false,link:"",note:"",assignee:"",statusId:"",custom:true}]}; if(onItemsChange) onItemsChange(next); return next; }); setSkuPickDept(null); };
  const depts=activeDept==="all"?Object.keys(DEPTS):[activeDept];
  const lt=launchTypes?.[group.launchType] || LAUNCH_TYPES[group.launchType] || { label:"Checklist", tag:"Custom", color:C.accent };
  const linkedEvents = (events||[]).filter((ev:any)=>(group.linkedEventIds||[]).includes(ev.id));
  const allItems = Object.values(items).flat();
  const overallDone = allItems.filter(i=>i.done).length;
  const overallPct  = allItems.length ? Math.round(overallDone/allItems.length*100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,fontWeight:600,padding:"0 0 10px",display:"flex",alignItems:"center",gap:5 }}>&#8249; All Groups</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
          <div>
            <h2 style={{ margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.text }}>{group.groupName}</h2>
            <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
              <Tag color={C.accent}>{lt.label}</Tag>
              {group.deadline&&<span style={{ fontSize:11,color:"#8B5CF6",fontWeight:600,background:"#F5F3FF",padding:"2px 8px",borderRadius:4,border:"1px solid #DDD6FE" }}>{group.deadlineEnd?`${group.deadline} → ${group.deadlineEnd}`:`Due ${group.deadline}`}</span>}
              {group.skus.slice(0,3).map(s=>(<span key={s.id} style={{ fontSize:11,color:C.muted,background:C.surfaceAlt,padding:"2px 8px",borderRadius:4,border:`1px solid ${C.border}`,fontFamily:"monospace" }}>{s.value}</span>))}
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
        <div style={{ marginTop:14,padding:"12px 14px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <span style={{ fontSize:12,fontWeight:700,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Overall Progress</span>
            <span style={{ fontSize:13,fontWeight:800,color:C.accent,fontVariantNumeric:"tabular-nums" }}>{overallPct}%</span>
          </div>
          <div style={{ height:6,background:C.border,borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${overallPct}%`,background:C.accent,borderRadius:3,transition:"width .4s" }} /></div>
        </div>
      </div>

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
                {skuPickDept===dept&&skuStorage.length>0&&(<div style={{ marginBottom:8 }}><SKUPicker skuStorage={skuStorage} brands={brands} onSelect={s=>addFromSKU(dept,s)} placeholder="Pick from SKU storage..." /></div>)}
                <div style={{ display:"flex",gap:6 }}>
                  <TI value={newText[dept]} onChange={v=>setNewText(p=>({...p,[dept]:v}))} placeholder="Add task..." style={{ flex:1,padding:"8px 10px",fontSize:13 }} />
                  <button onClick={()=>addItem(dept)} style={{ width:36,height:36,background:C.accent,color:"#fff",border:"none",borderRadius:7,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>+</button>
                  {skuStorage.length>0&&<button onClick={()=>setSkuPickDept(skuPickDept===dept?null:dept)} style={{ height:36,padding:"0 10px",background:skuPickDept===dept?C.accent:C.surface,color:skuPickDept===dept?"#fff":C.muted,border:`1.5px solid ${skuPickDept===dept?C.accent:C.border}`,borderRadius:7,fontSize:11,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap" }}>SKU</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <StatusManagerModal open={statusModal} onClose={()=>setStatusModal(false)} statuses={statuses} onChange={saveStatuses} />
      <GroupEditModal open={groupEditModal} group={group} onClose={()=>setGroupEditModal(false)} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} events={events}
        onSave={(patch:any)=>{ if(onUpdateGroup) onUpdateGroup(patch); }} />
    </div>
  );
};

// ─── SKU SELECTOR ────────────────────────────────────────────────────────────
const SKUSelector = ({ onNext, skuStorage, brands, launchTypes, events=[], onApplyPhaseoutAssignments }) => {
  const [skuMode,setSkuMode]     = useState("manual");
  const [skus,setSkus]           = useState([{id:uid(),value:""}]);
  const [selType,setSelType]     = useState(()=>Object.keys(launchTypes||LAUNCH_TYPES)[0] || "introduction");
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
  const [linkedEventIds,setLinkedEventIds] = useState<any[]>([]);
  const [pickedSkus,setPickedSkus] = useState([]);
  const [phaseoutHelperMsg,setPhaseoutHelperMsg] = useState("");
  const addSku=()=>setSkus(p=>[...p,{id:uid(),value:""}]);
  const remSku=id=>setSkus(p=>p.filter(s=>s.id!==id));
  const updSku=(id,v)=>setSkus(p=>p.map(s=>s.id===id?{...s,value:v}:s));
  const pickSku=s=>{ setPickedSkus((p:any[])=>p.find((x:any)=>x.id===s.id)?p.filter((x:any)=>x.id!==s.id):[...p,s]); };
  const toggleLinkedEvent = (id:any) => setLinkedEventIds((prev:any[])=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const finalSkus=skuMode==="storage"?pickedSkus.map((s:any)=>({id:s.id,value:s.sku})):skus.filter(s=>s.value.trim());
  const phaseoutSourceSkus:any[] = skuMode==="storage"
    ? pickedSkus
    : skus.filter((s:any)=>s.value.trim()).map((s:any)=>({ id:s.id, value:s.value.trim(), sku:s.value.trim(), productName:s.value.trim() }));
  const isPhaseoutType = selType==="phaseout" || (launchTypes?.[selType]?.label || "").toLowerCase().includes("phase-out");

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
        <Field label="Start Date"><DateInput value={deadline} onChange={setDeadline} /></Field>
        <Field label="End Date"><DateInput value={deadlineEnd} onChange={setDeadlineEnd} /></Field>
        <Field label="SKU Source">
          <div style={{ display:"flex",gap:8 }}>
            {["manual","storage"].map(m=>(<button key={m} onClick={()=>setSkuMode(m)} style={{ flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:skuMode===m?C.accent:C.surface,color:skuMode===m?"#fff":C.muted,border:`1.5px solid ${skuMode===m?C.accent:C.border}` }}>{m==="manual"?"Enter Manually":"From SKU Storage"}</button>))}
          </div>
        </Field>
        {skuMode==="manual"?(
          <Field label="SKU(s)">
            {skus.map((s,i)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={v=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
            <button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button>
          </Field>
        ):(
          <Field label="Search SKU Storage">
            {skuStorage.length===0
              ? <div style={{ padding:"14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No SKUs in storage yet. Go to SKU Storage tab first.</div>
              : <>
                  <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickSku} placeholder="Search by product, SKU, or brand..." multiSelect selectedIds={pickedSkus.map((s:any)=>s.id)} />
                  {pickedSkus.length>0&&(<div style={{ marginTop:8 }}><div style={{ marginBottom:5,fontSize:11,color:C.muted,fontWeight:700 }}>{pickedSkus.length} selected SKU{pickedSkus.length!==1?"s":""}</div><div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:96,overflowY:"auto",paddingRight:4,alignContent:"flex-start" }}>{pickedSkus.map(s=>(<div key={s.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"3px 7px",background:C.surfaceAlt,borderRadius:6,border:`1px solid ${C.border}`,lineHeight:1 }}><span style={{ fontSize:10,fontFamily:"monospace",fontWeight:800,color:C.text,whiteSpace:"nowrap" }}>{s.sku}</span><button onClick={()=>setPickedSkus(p=>p.filter(x=>x.id!==s.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:12,lineHeight:1,padding:0 }}>&#215;</button></div>))}</div></div>)}
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

        <Btn full onClick={()=>onNext({skus:finalSkus,launchType:selType,groupName,deadline,deadlineEnd,linkedEventIds})} disabled={!canNext}>Generate Checklists &#8250;</Btn>
      </div>
    </div>
  );
};

// ─── GROUP EDIT MODAL ────────────────────────────────────────────────────────
const GroupEditModal = ({ open, group, onClose, onSave, skuStorage, brands, launchTypes, events=[], onApplyPhaseoutAssignments }: any) => {
  const [skuMode,setSkuMode]     = useState("manual");
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
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
  const finalSkus = skuMode==="storage" ? pickedSkus.map((s:any)=>({id:s.id,value:s.sku})) : skus.filter((s:any)=>s.value.trim());
  const phaseoutSourceSkus:any[] = skuMode==="storage"
    ? pickedSkus
    : skus.filter((s:any)=>s.value.trim()).map((s:any)=>({ id:s.id, value:s.value.trim(), sku:s.value.trim(), productName:s.value.trim() }));
  const isPhaseoutType = launchType==="phaseout" || (launchTypes?.[launchType]?.label || "").toLowerCase().includes("phase-out");
  const canSave = finalSkus.length>0 && groupName.trim();

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
        <Field label="Start Date"><DateInput value={deadline} onChange={setDeadline} /></Field>
        <Field label="End Date"><DateInput value={deadlineEnd} onChange={setDeadlineEnd} /></Field>
        <Field label="SKU Source">
          <div style={{ display:"flex",gap:8 }}>
            {["manual","storage"].map(m=>(<button key={m} onClick={()=>setSkuMode(m)} style={{ flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:skuMode===m?C.accent:C.surface,color:skuMode===m?"#fff":C.muted,border:`1.5px solid ${skuMode===m?C.accent:C.border}` }}>{m==="manual"?"Enter Manually":"From SKU Storage"}</button>))}
          </div>
        </Field>
        {skuMode==="manual"?(
          <Field label="SKU(s)">
            {skus.map((s:any,i:number)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={(v:string)=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
            <button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button>
          </Field>
        ):(
          <Field label="Search SKU Storage">
            {skuStorage.length===0
              ? <div style={{ padding:"14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No SKUs in storage yet. Go to SKU Storage tab first.</div>
              : <>
                  <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickSku} placeholder="Search by product, SKU, or brand..." multiSelect selectedIds={pickedSkus.map((s:any)=>s.id)} />
                  {pickedSkus.length>0&&(<div style={{ marginTop:8 }}><div style={{ marginBottom:5,fontSize:11,color:C.muted,fontWeight:700 }}>{pickedSkus.length} selected SKU{pickedSkus.length!==1?"s":""} · {pickedSkus.filter((s:any)=>!originalSkuIds.has(s.id)&&!originalSkuIds.has(s.sku)).length} new</div><div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:96,overflowY:"auto",paddingRight:4,alignContent:"flex-start" }}>{pickedSkus.map((s:any)=>{ const isNew=!originalSkuIds.has(s.id)&&!originalSkuIds.has(s.sku); return (<div key={s.id} title={`${isNew?"New SKU · ":""}${s.productName} · ${s.sku}`} style={{ display:"inline-flex",alignItems:"center",gap:5,maxWidth:"100%",padding:"3px 7px",background:isNew?"#ECFDF5":C.surfaceAlt,borderRadius:6,border:`1px solid ${isNew?"#86EFAC":C.border}`,lineHeight:1 }}><span style={{ fontSize:10,fontFamily:"monospace",fontWeight:800,color:C.text,whiteSpace:"nowrap" }}>{s.sku}</span>{isNew&&<span style={{ fontSize:9,fontWeight:900,color:"#047857",background:"#D1FAE5",border:"1px solid #A7F3D0",borderRadius:999,padding:"1px 5px",lineHeight:1 }}>NEW</span>}<button onClick={()=>setPickedSkus((p:any)=>p.filter((x:any)=>x.id!==s.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:12,lineHeight:1,padding:0 }}>&#215;</button></div>);})}</div></div>)}
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
        <Btn full onClick={()=>{ onSave({groupName:groupName.trim(),deadline,deadlineEnd,launchType,skus:finalSkus,linkedEventIds}); onClose(); }} disabled={!canSave}>Save Changes</Btn>
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
  const list = templates[launchType]?.[dept] || [];

  const updateList = next => {
    onChange(prev => ({
      ...prev,
      [launchType]: { ...(prev[launchType] || makeEmptyTemplateSet()), [dept]: next },
    }));
  };

  const saveChecklistType = () => {
    if(!typeLabel.trim()) return;
    onLaunchTypesChange((prev:any)=>({
      ...prev,
      [launchType]: {
        ...(prev[launchType] || {}),
        label:typeLabel.trim(),
        tag:typeTag.trim() || "Custom",
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
    updateList([...(TEMPLATES[launchType]?.[dept] || [])]);
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
            <TI value={typeLabel} onChange={v=>{ setTypeLabel(v); updateChecklistTypeField({ label:v.trim() || "Checklist Type" }); }} placeholder="e.g. Product Launch, Monthly Campaign, Clearance Sale" />
          </Field>
          <Field label="Tag">
            <TI value={typeTag} onChange={v=>{ setTypeTag(v); updateChecklistTypeField({ tag:v.trim() || "Custom" }); }} placeholder="e.g. New Launch, Relaunch, Custom" />
          </Field>
          <Field label="Color">
            <ColorPicker value={typeColor} onChange={v=>{ setTypeColor(v); updateChecklistTypeField({ color:v }); }} palette={STATUS_PALETTE} />
          </Field>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"#16A34A",fontWeight:700 }}>Autosaved</span>
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
                    <TI value={editText} onChange={setEditText} placeholder="Task description" />
                    <div style={{ display:"flex",gap:8 }}>
                      <Btn sm onClick={saveEdit} disabled={!editText.trim()}>Save</Btn>
                      <Btn sm variant="outline" onClick={()=>setEditIdx(null)}>Cancel</Btn>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"9px 10px",background:C.surfaceAlt,borderRadius:8,border:`1px solid ${C.border}` }}>
                  <span style={{ flex:1,fontSize:12.5,color:C.textSub,lineHeight:1.5 }}>{t}</span>
                  <div style={{ display:"flex",gap:3,flexShrink:0 }}>
                    <button onClick={()=>moveItem(i,-1)} disabled={i===0} style={{ width:22,height:22,borderRadius:5,background:"none",border:`1px solid ${C.border}`,cursor:i===0?"not-allowed":"pointer",color:C.muted,opacity:i===0?.4:1,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8593;</button>
                    <button onClick={()=>moveItem(i,1)} disabled={i===list.length-1} style={{ width:22,height:22,borderRadius:5,background:"none",border:`1px solid ${C.border}`,cursor:i===list.length-1?"not-allowed":"pointer",color:C.muted,opacity:i===list.length-1?.4:1,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8595;</button>
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
          <div style={{ display:"flex",gap:8 }}>
            <TI value={newText} onChange={setNewText} placeholder="Add a new default task..." />
            <Btn sm onClick={addItem} disabled={!newText.trim()}>Add</Btn>
          </div>
        </div>

        <Divider />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <span style={{ fontSize:11,color:C.faint }}>Checklist types and default tasks autosave and update matching checklist groups.</span>
          <Btn sm variant="outline" onClick={resetToDefault}>Reset Tasks to Default</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── CHECKLIST VIEW ──────────────────────────────────────────────────────────
const ChecklistView = ({ onGroupCreated, skuStorage, brands, seasonalEvents, setSeasonalEvents, navigateToGroupId, onGroupNavigated, onStateChange, groups, setGroups, allGroupItems, setAllGroupItems, statuses, setStatuses }: any) => {
  const [active,setActive]     = useState(null);
  const [creating,setCreating] = useState(false);
  const [editingGroup,setEditingGroup] = useState(null);

  const updateGroupItems = (groupId:string, items:any) => {
    setAllGroupItems((p:any)=>{ const next={...p,[groupId]:items}; if(onStateChange) onStateChange({checklistItems:{[groupId]:items}}); return next; });
  };
  const updateStatuses = (s:any[]) => { setStatuses(s); if(onStateChange) onStateChange({checklistStatuses:s}); };
  const [launchTypes,setLaunchTypes] = useState<any>(() => {
    if (typeof window === "undefined") return LAUNCH_TYPES;
    try {
      const raw = localStorage.getItem("emdc_checklist_launch_types_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length) return parsed;
    } catch {}
    return LAUNCH_TYPES;
  });
  const [templates,setTemplates]   = useState<any>(() => {
    if (typeof window === "undefined") return TEMPLATES;
    try {
      const raw = localStorage.getItem("emdc_checklist_templates_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
    return TEMPLATES;
  });
  const [templatesModal,setTemplatesModal] = useState(false);
  const navRef = useRef(null);

  const buildChecklistItemsFromTemplates = (launchTypeKey:string, nextTemplates:any, existingItems:any=null) => {
    const out:any = {};
    Object.keys(DEPTS).forEach((deptKey:string)=>{
      const templateList = nextTemplates?.[launchTypeKey]?.[deptKey] || [];
      const existingList = Array.isArray(existingItems?.[deptKey]) ? existingItems[deptKey] : [];

      out[deptKey] = templateList.map((text:string,idx:number)=>{
        const sameText = existingList.find((item:any)=>String(item.text||"").trim()===String(text||"").trim());
        const sameIndex = existingList[idx];
        const source = sameText || sameIndex || {};
        return {
          id: source.id || uid(),
          text,
          done: sameText ? !!sameText.done : false,
          link: sameText ? (sameText.link||"") : "",
          note: sameText ? (sameText.note||"") : "",
          assignee: sameText ? (sameText.assignee||"") : "",
          statusId: sameText ? (sameText.statusId||"") : "",
        };
      });

      const customItems = existingList.filter((item:any)=>
        item?.custom ||
        !templateList.some((templateText:string)=>String(templateText||"").trim()===String(item.text||"").trim())
      ).filter((item:any)=>{
        const matchedBySameIndex = templateList.some((templateText:string,idx:number)=>
          existingList[idx]?.id===item.id && String(existingList[idx]?.text||"").trim()!==String(templateText||"").trim()
        );
        return item?.custom || !matchedBySameIndex;
      });

      // Keep manually added checklist items that were not part of the old template.
      customItems.forEach((item:any)=>{
        if (!out[deptKey].some((nextItem:any)=>nextItem.id===item.id || nextItem.text===item.text)) {
          out[deptKey].push({ ...item, custom:true });
        }
      });
    });
    return out;
  };

  const syncChecklistItemsForTemplates = (nextTemplates:any) => {
    setAllGroupItems((prev:any)=>{
      const nextItems:any = { ...prev };
      (groups||[]).forEach((group:any)=>{
        if(!group?.id || !group?.launchType) return;
        nextItems[group.id] = buildChecklistItemsFromTemplates(group.launchType,nextTemplates,prev[group.id]);
      });
      if(onStateChange) onStateChange({checklistItems:nextItems});
      return nextItems;
    });
  };

  const updateTemplatesAndChecklistItems = (updater:any) => {
    setTemplates((prev:any)=>{
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncChecklistItemsForTemplates(next);
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
    setAllGroupItems((p:any)=>{ const next={...p,[g.id]:initialItems}; if(onStateChange) onStateChange({checklistItems:next}); return next; });

    if(onGroupCreated) onGroupCreated(g);
    setActive(g.id);
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
      if(onStateChange) onStateChange({checklistItems:next});
      return next;
    });

    if(active===id) setActive(null);
  };

  const updateGroup = (id:string, patch:any) => {
    const currentGroup = groups.find((g:any)=>g.id===id);
    const typeChanged = !!patch?.launchType && currentGroup?.launchType !== patch.launchType;

    setGroups((p:any)=>{
      const next=p.map((g:any)=>g.id===id?{...g,...patch}:g);
      if(onStateChange) onStateChange({checklistGroups:next});
      return next;
    });

    if(typeChanged){
      cleanupPhaseoutProductsForGroup(currentGroup);

      const freshItems = buildChecklistItemsFromTemplates(patch.launchType,templates,null);
      setAllGroupItems((prev:any)=>{
        const next = { ...prev, [id]: freshItems };
        if(onStateChange) onStateChange({checklistItems:next});
        return next;
      });
    }
  };
  const activeGroup = groups.find((g:any)=>g.id===active);

  if(activeGroup) return <ChecklistBoard group={activeGroup} onBack={()=>setActive(null)} skuStorage={skuStorage} brands={brands} templates={templates} launchTypes={launchTypes} events={seasonalEvents||[]} onStateChange={onStateChange} initialItems={allGroupItems[activeGroup.id]||null} onItemsChange={(items:any)=>updateGroupItems(activeGroup.id,items)} statuses={statuses} setStatuses={updateStatuses} onUpdateGroup={(patch:any)=>updateGroup(activeGroup.id,patch)} />;

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
      <GroupEditModal open={!!editingGroup} group={editingGroup} onClose={()=>setEditingGroup(null)} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} events={seasonalEvents||[]} onApplyPhaseoutAssignments={applyPhaseoutAssignments}
        onSave={(patch:any)=>updateGroup(editingGroup.id,patch)} />

      {creating&&(
        <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>New Checklist Group</h3>
            <button onClick={()=>setCreating(false)} style={{ width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>&#215;</button>
          </div>
          <SKUSelector onNext={createGroup} skuStorage={skuStorage} brands={brands} launchTypes={launchTypes} events={seasonalEvents||[]} onApplyPhaseoutAssignments={applyPhaseoutAssignments} />
        </div>
      )}

      {groups.length===0&&!creating?(
        <div style={{ background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12 }}>
          <Empty title="No checklist groups" sub="Create a group by selecting SKUs and an operational type." action={<Btn onClick={()=>setCreating(true)}>+ New Group</Btn>} />
        </div>
      ):(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:12 }}>
          {groups.map(g=>{ const lt=launchTypes[g.launchType] || LAUNCH_TYPES[g.launchType] || { label:"Checklist", tag:"Custom", color:C.accent }; return (
            <div key={g.id} className="emdc-card" style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,borderLeft:`4px solid ${lt?.color||C.accent}`,cursor:"pointer",transition:"box-shadow .2s" }} onClick={()=>setActive(g.id)}>
              <div style={{ padding:"16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <p style={{ margin:0,fontSize:14,fontWeight:700,color:C.text,flex:1,marginRight:8 }}>{g.groupName}</p>
                  <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                    <button onClick={e=>{e.stopPropagation();setEditingGroup(g);}} style={{ padding:"3px 8px",borderRadius:5,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                    <button onClick={e=>{e.stopPropagation();deleteGroup(g.id);}} style={{ width:24,height:24,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>&#215;</button>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <Tag color={C.accent} sm>{lt.label}</Tag>
                  {g.deadline&&<span style={{ fontSize:10,color:"#8B5CF6",fontWeight:600,background:"#F5F3FF",padding:"1px 7px",borderRadius:4,border:"1px solid #DDD6FE" }}>{g.deadlineEnd?`${g.deadline} → ${g.deadlineEnd}`:`Due ${g.deadline}`}</span>}
                  {(g.linkedEventIds||[]).length>0&&<span style={{ fontSize:10,color:"#0F766E",fontWeight:600,background:"#CCFBF1",padding:"1px 7px",borderRadius:4,border:"1px solid #99F6E4" }}>{(g.linkedEventIds||[]).length} linked event{(g.linkedEventIds||[]).length>1?"s":""}</span>}
                </div>
                {g.skus.length>0&&(
                  <div style={{ marginTop:8,display:"flex",gap:4,flexWrap:"wrap" }}>
                    {g.skus.slice(0,4).map(s=>(<span key={s.id} style={{ fontSize:10,color:C.muted,background:C.surfaceAlt,padding:"2px 7px",borderRadius:4,border:`1px solid ${C.border}`,fontFamily:"monospace" }}>{s.value}</span>))}
                    {g.skus.length>4&&<span style={{ fontSize:10,color:C.faint }}>+{g.skus.length-4}</span>}
                  </div>
                )}
                {(()=>{ const gItems=allGroupItems[g.id]; if(gItems){ const all=Object.values(gItems).flat() as any[]; const done=all.filter((i:any)=>i.done).length; const pct=all.length?Math.round(done/all.length*100):0; return (<div style={{ marginTop:10 }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}><span style={{ fontSize:10,color:C.muted }}>Progress</span><span style={{ fontSize:10,fontWeight:700,color:C.accent }}>{done}/{all.length} · {pct}%</span></div><div style={{ height:4,background:C.border,borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:pct===100?"#22C55E":C.accent,borderRadius:2,transition:"width .3s" }} /></div></div>); } return <p style={{ margin:"10px 0 0",fontSize:11,color:C.faint }}>3 departments · tap to view</p>; })()}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

// ─── SKU STORAGE ─────────────────────────────────────────────────────────────
const SKUStorage = ({ brands, setBrands, skuStorage, setSkuStorage, onStateChange }) => {
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
  const [sForm,setSForm] = useState({brandId:"",productName:"",collection:"",sku:"",inventory:"",status:"active",customStatus:""});
  const DEFAULT_SKU_TABLE_COLUMNS = [
    { key:"productName", label:"Product",    base:true },
    { key:"sku",         label:"SKU",        base:true },
    { key:"brand",       label:"Brand",      base:true },
    { key:"inventory",   label:"Stock",      base:true },
    { key:"status",      label:"Status",     base:true },
  ];
  const SKU_TABLE_BASE_COLUMN_ALIASES:any = {
    product:{ key:"productName", label:"Product", base:true },
    productname:{ key:"productName", label:"Product", base:true },
    name:{ key:"productName", label:"Product", base:true },
    sku:{ key:"sku", label:"SKU", base:true },
    skucode:{ key:"sku", label:"SKU", base:true },
    brand:{ key:"brand", label:"Brand", base:true },
    collection:{ key:"collection", label:"Collection", base:true },
    category:{ key:"collection", label:"Collection", base:true },
    stock:{ key:"inventory", label:"Stock", base:true },
    inventory:{ key:"inventory", label:"Stock", base:true },
    qty:{ key:"inventory", label:"Stock", base:true },
    status:{ key:"status", label:"Status", base:true },
  };
  const [skuTableColumns,setSkuTableColumns] = useState<any[]>(DEFAULT_SKU_TABLE_COLUMNS);
  const [skuNewColumn,setSkuNewColumn] = useState("");
  const [skuColumnDragIndex,setSkuColumnDragIndex] = useState<number|null>(null);
  const [skuRowDragId,setSkuRowDragId] = useState<any>(null);
  const [skuTableEditMode,setSkuTableEditMode] = useState(false);
  const [skuSearch,setSkuSearch] = useState("");
  const DEFAULT_BULK_COLUMNS = [
    { key:"productName", label:"Product Name", placeholder:"Desk Organizer", locked:true },
    { key:"sku",         label:"SKU",          placeholder:"GL-DO001",        locked:true },
    { key:"brand",       label:"Brand",        placeholder:"Gray Label",      locked:true },
    { key:"collection",  label:"Collection",   placeholder:"Workspace",       locked:true },
    { key:"inventory",   label:"Stock",        placeholder:"50",              locked:true },
    { key:"status",      label:"Status",       placeholder:"Active",          locked:true },
  ];
  const [bulkColumns,setBulkColumns] = useState<any[]>(DEFAULT_BULK_COLUMNS);
  const [bulkNewColumn,setBulkNewColumn] = useState("");
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
  const commitSkuStorage = (updater:any) => {
    setSkuStorage((prev:any[]) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if(onStateChange) onStateChange({ skuItems: next });
      return next;
    });
  };
  const commitBrands = (updater:any) => {
    setBrands((prev:any[]) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if(onStateChange) onStateChange({ skuBrands: next });
      return next;
    });
  };
  const filteredSkus = useMemo(() => {
    const brandFiltered = activeBrand ? skuStorage.filter((s:any)=>s.brandId===activeBrand) : skuStorage;
    const terms = skuSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if(!terms.length) return brandFiltered;

    return brandFiltered.filter((s:any)=>{
      const brandName = brands.find((b:any)=>b.id===s.brandId)?.name || "";
      const statusLabel = s.status==="active" ? "active" : s.status==="nostocks" ? "no stocks out of stock sold out" : (s.customStatus || "custom");
      const extraText = Object.values(s.extraFields || {}).join(" ");
      const searchable = [
        s.productName,
        s.sku,
        brandName,
        s.collection,
        s.category,
        s.inventory,
        s.srp,
        s.status,
        statusLabel,
        extraText,
      ].filter(Boolean).join(" ").toLowerCase();

      return terms.every((term:string)=>searchable.includes(term));
    });
  }, [activeBrand,skuStorage,skuSearch,brands]);
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
  const activeBrandObj = brands.find(b=>b.id===activeBrand);
  const bulkEditBrandObj = brands.find((b:any)=>b.id===bulkEditBrandId);
  const addBrand  = ()=>{ if(!bForm.name.trim()) return; commitBrands((p:any[])=>[...p,{id:uid(),name:bForm.name.trim(),color:"#111827"}]); setBForm({name:"",color:"#111827"}); setBrandModal(false); };
  const openEditBrand = b=>{ setEditBrandForm({...b}); setEditBrandModal(true); };
  const saveEditBrand = ()=>{ if(!editBrandForm.name.trim()) return; commitBrands((p:any[])=>p.map((b:any)=>b.id===editBrandForm.id?{...editBrandForm}:b)); setEditBrandModal(false); setEditBrandForm(null); };
  const delBrand  = id=>{ commitBrands((p:any[])=>p.filter((b:any)=>b.id!==id)); if(activeBrand===id) setActiveBrand(null); };
  const openAdd   = ()=>{ setSForm({brandId:activeBrand||brands[0]?.id||"",productName:"",collection:"",sku:"",inventory:"",status:"active",customStatus:""}); setEditSkuId(null); setSkuModal(true); };
  const openEdit  = s=>{ setSForm({brandId:s.brandId,productName:s.productName,collection:s.collection||"",sku:s.sku,inventory:String(s.inventory),status:s.status,customStatus:s.customStatus||""}); setEditSkuId(s.id); setSkuModal(true); };
  const saveSku   = ()=>{
    if(!sForm.productName.trim()||!sForm.sku.trim()) return;
    const e={id:editSkuId||uid(),brandId:sForm.brandId||activeBrand||brands[0]?.id||"",productName:sForm.productName.trim(),collection:sForm.collection.trim(),sku:sForm.sku.trim(),inventory:parseInt(sForm.inventory)||0,status:sForm.status,customStatus:sForm.customStatus.trim()};
    if(editSkuId) commitSkuStorage((p:any[])=>p.map((s:any)=>s.id===editSkuId?e:s)); else commitSkuStorage((p:any[])=>[...p,e]);
    setSkuModal(false);
  };
  const delSku = id=>commitSkuStorage((p:any[])=>p.filter((s:any)=>s.id!==id));
  const normalizeKey = (v:any) => String(v||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");

  const BULK_PLACEHOLDERS:any = {
    productName:"Desk Organizer",
    sku:"GL-DO001",
    brand:"Gray Label",
    collection:"Workspace",
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
  const getSkuExtraValue = (s:any, col:any) => {
    const extra=s.extraFields||{};
    return extra[col.label] ?? extra[col.key] ?? "";
  };
  const getSkuValueForBulkColumn = (s:any, col:any) => {
    const brand=brands.find((b:any)=>b.id===s.brandId);
    if(col.key==="productName") return s.productName||"";
    if(col.key==="sku") return s.sku||"";
    if(col.key==="brand") return brand?.name||"";
    if(col.key==="collection") return s.collection||"";
    if(col.key==="inventory") return String(s.inventory ?? "");
    if(col.key==="status") {
      if(s.status==="active") return "Active";
      if(s.status==="nostocks") return "No Stocks";
      return s.customStatus||"Custom";
    }
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
    const inventory=parseStock(r.inventory);
    const st=parseStatusValue(r.status);
    const extraFields:any = {};
    BULK_COLUMNS.filter((c:any)=>c.custom).forEach((c:any)=>{
      const label=String(c.label||c.key).trim();
      const value=String(r[c.key]||"").trim();
      if(label&&value) extraFields[label]=value;
    });
    const empty=!rowHasInput(r);
    const error=empty?"":!productName?"Missing product name":!sku?"Missing SKU":"";
    return { id:r.id||`bulk-${idx}`, productName, sku, brand, collection, inventory, extraFields, ...st, error, valid:!empty&&!error, empty };
  }).filter((r:any)=>!r.empty);
  const bulkRows = useMemo(()=>parseGridRows(bulkGridRows),[bulkGridRows,bulkColumns]);
  const bulkVisibleRows = useMemo(()=>{
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
    setBulkColumns(columns);
    setBulkGridRows(makeBulkRows(8));
    resetBulkSheetSelection();
    setBulkModal(true);
  };
  const openEditSheet = () => {
    const columns=buildBulkColumnsFromSkuTable();
    const scopedItems = activeBrand ? skuStorage.filter((s:any)=>s.brandId===activeBrand) : skuStorage;

    setBulkMode("edit");
    setBulkSearch("");
    setBulkEditBrandId(activeBrand || null);
    setBulkColumns(columns);
    setBulkGridRows(makeBulkRowsFromStorage(scopedItems,columns));
    resetBulkSheetSelection();
    setBulkModal(true);
  };
  const saveBulkSkus = () => {
    const rows=bulkRows.filter(r=>r.valid);
    if(!rows.length){ setBulkError(bulkMode==="edit" ? "No valid SKU rows to save." : "No valid SKU rows to import."); return; }

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

    const buildSku = (r:any, existing?:any) => ({
      id:existing?.id || r.id || uid(),
      brandId:getBrandId(r.brand),
      productName:r.productName.trim(),
      collection:r.collection.trim(),
      sku:r.sku.trim(),
      inventory:r.inventory,
      status:r.status,
      customStatus:r.customStatus||"",
      extraFields:r.extraFields||{},
    });

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

      commitBrands(nextBrands);
      commitSkuStorage(nextSkus);
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
    commitBrands(nextBrands);
    commitSkuStorage(nextSkus);
    setBulkModal(false);
    setBulkGridRows(makeBulkRows(8));
    setBulkError("");
  };

  const STATUS_OPTS=[{value:"active",label:"Active",color:"#22C55E"},{value:"nostocks",label:"No Stocks",color:"#EF4444"},{value:"custom",label:"Custom",color:"#6B7280"}];
  const getSD = s=>{ if(s.status==="active") return{label:"Active",color:"#22C55E"}; if(s.status==="nostocks") return{label:"No Stocks",color:"#EF4444"}; return{label:s.customStatus||"Custom",color:"#6B7280"}; };
  const bulkColumnWidth = (key:string) => {
    if(isMobile){
      if(key==="productName") return "180px";
      if(key==="sku") return "140px";
      if(key==="inventory") return "90px";
      return "130px";
    }
    if(key==="productName") return "1.5fr";
    if(key==="inventory") return ".7fr";
    if(key==="status") return ".9fr";
    return "1fr";
  };
  const bulkGridTemplate = `${isMobile?"36px":"42px"} ${BULK_COLUMNS.map((c:any)=>bulkColumnWidth(c.key)).join(" ")}`;
  const bulkTableMinWidth = isMobile ? Math.max(820,36+(BULK_COLUMNS.length*140)) : Math.max(760,42+(BULK_COLUMNS.length*120));
  const skuTableColumnWidth = (key:string) => {
    if(key==="productName") return "minmax(220px,1.6fr)";
    if(key==="sku") return "minmax(150px,.9fr)";
    if(key==="brand") return "minmax(130px,.8fr)";
    if(key==="collection") return "minmax(140px,.8fr)";
    if(key==="inventory") return "minmax(90px,.5fr)";
    if(key==="status") return "minmax(120px,.7fr)";
    return "minmax(140px,.9fr)";
  };
  const skuGridTemplate = `${skuTableEditMode?"42px ":""}${skuTableColumns.map((c:any)=>skuTableColumnWidth(c.key)).join(" ")}${skuTableEditMode?" 90px":""}`;
  const skuTableMinWidth = Math.max(760,(skuTableEditMode?132:0)+(skuTableColumns.length*140));
  const renderSkuDesktopCell = (s:any, col:any, brand:any, st:any) => {
    if(col.key==="productName") return <span style={{ fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12 }}>{s.productName}</span>;
    if(col.key==="sku") return <span style={{ fontSize:12,color:C.muted,fontFamily:"monospace",background:C.surfaceAlt,padding:"2px 6px",borderRadius:4,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.sku}</span>;
    if(col.key==="brand") return <div>{brand&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:7,height:7,borderRadius:"50%",background:brand.color,flexShrink:0 }} /><span style={{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{brand.name}</span></div>}</div>;
    if(col.key==="collection") return skuTableEditMode
      ? <input value={s.collection||""} onChange={e=>setSkuCollectionValue(s.id,e.target.value)} placeholder="Uncategorized"
          style={{ width:"100%",height:28,padding:"4px 7px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:5,background:C.surface,color:C.text,outline:"none" }} />
      : <span style={{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.collection||"Uncategorized"}</span>;
    if(col.key==="inventory") return <span style={{ fontSize:12,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:400,fontVariantNumeric:"tabular-nums" }}>{s.inventory.toLocaleString()}</span>;
    if(col.key==="status") return <span style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"3px 8px",borderRadius:5,border:`1px solid ${st.color}28`,display:"inline-block",whiteSpace:"nowrap" }}>{st.label}</span>;
    const extraValue = getSkuExtraValue(s,col);
    return skuTableEditMode
      ? <input value={extraValue} onChange={e=>setSkuExtraValue(s.id,col,e.target.value)} placeholder="—"
          style={{ width:"100%",height:28,padding:"4px 7px",fontSize:12,border:`1px solid ${C.border}`,borderRadius:5,background:C.surface,color:C.text,outline:"none" }} />
      : <span style={{ fontSize:12,color:extraValue?C.textSub:C.faint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{extraValue||"—"}</span>;
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
      {brands.map(b=>{ const count=skuStorage.filter(s=>s.brandId===b.id).length; return (
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
                placeholder="Search SKU, product, brand, collection, category, stock, status..."
                style={{ flex:1,minWidth:0,height:30,border:"none",outline:"none",background:"transparent",fontSize:13,color:C.text }}
              />
              {skuSearch.trim()&&(
                <button type="button" onClick={()=>setSkuSearch("")}
                  style={{ border:"none",background:C.surfaceAlt,borderRadius:6,padding:"5px 8px",fontSize:11,fontWeight:700,color:C.muted,cursor:"pointer",flexShrink:0 }}>
                  Clear
                </button>
              )}
            </div>

            {!isMobile&&skuTableEditMode&&(
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",padding:"10px 12px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,marginBottom:12 }}>
                <span style={{ fontSize:12,color:C.muted }}>Edit mode: use the 6-dot handles to drag columns or product rows, rename headers, hide columns, or add columns.</span>
                <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                  <input value={skuNewColumn} placeholder="New column name" onChange={e=>setSkuNewColumn(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addSkuTableColumn(); } }}
                    style={{ height:30,width:150,padding:"6px 9px",fontSize:12,borderRadius:7,border:`1.5px solid ${C.border}`,outline:"none",background:C.surface,color:C.text }} />
                  <Btn xs variant="outline" onClick={addSkuTableColumn}>+ Column</Btn>
                  <Btn xs variant="outline" onClick={resetSkuTableColumns}>Reset Columns</Btn>
                </div>
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
                  <div style={{ overflowX:"auto" }}>
                    <div style={{ minWidth:skuTableMinWidth }}>
                      <div style={{ display:"grid",gridTemplateColumns:skuGridTemplate,background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                        {skuTableEditMode&&<span style={{ padding:"9px 10px",fontSize:12,fontWeight:700,color:C.faint,letterSpacing:".02em",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center" }}>&#8942;&#8942;</span>}
                        {skuTableColumns.map((col:any,colIdx:number)=>(
                          <div key={col.key}
                            draggable={skuTableEditMode}
                            onDragStart={()=>skuTableEditMode&&setSkuColumnDragIndex(colIdx)}
                            onDragOver={e=>{ if(skuTableEditMode) e.preventDefault(); }}
                            onDrop={e=>{ if(!skuTableEditMode) return; e.preventDefault(); if(skuColumnDragIndex!==null) moveSkuTableColumn(skuColumnDragIndex,colIdx); setSkuColumnDragIndex(null); }}
                            onDragEnd={()=>setSkuColumnDragIndex(null)}
                            title={skuTableEditMode?"Drag the 6-dot handle to rearrange this column":""}
                            style={{ padding:"7px 10px",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em",borderRight:`1px solid ${C.border}`,cursor:skuTableEditMode?"grab":"default",display:"flex",alignItems:"center",gap:6,minWidth:0 }}>
                            {skuTableEditMode&&<span style={{ color:C.faint,fontSize:12,lineHeight:1,flexShrink:0 }}>&#8942;&#8942;</span>}
                            {skuTableEditMode?
                              <input value={col.label} onChange={e=>renameSkuTableColumn(col.key,e.target.value)} placeholder="Column"
                                style={{ minWidth:0,width:"100%",background:"transparent",border:"none",outline:"none",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }} />
                              : <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{col.label}</span>}
                            {skuTableEditMode&&<button type="button" onClick={()=>removeSkuTableColumn(col)} title={col.custom?"Delete custom column":"Hide column"}
                              style={{ width:18,height:18,borderRadius:4,border:"none",background:"#FEF2F2",color:"#DC2626",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0 }}>&#215;</button>}
                          </div>
                        ))}
                        {skuTableEditMode&&<span style={{ padding:"9px 10px",fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em",textAlign:"right" }}>Actions</span>}
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
                          {group.skus.map((s:any,i:number)=>{
                            const brand=brands.find(b=>b.id===s.brandId), st=getSD(s);
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
                                  <div key={col.key} style={{ minHeight:48,padding:"10px 10px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",minWidth:0 }}>
                                    {renderSkuDesktopCell(s,col,brand,st)}
                                  </div>
                                ))}
                                {skuTableEditMode&&<div style={{ minHeight:48,padding:"8px 10px",display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center" }}>
                                  <button onClick={()=>openEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:600,padding:"3px 6px",borderRadius:4 }}>Edit</button>
                                  <button onClick={()=>delSku(s.id)} style={{ width:26,height:26,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>&#215;</button>
                                </div>}
                              </div>
                            );
                          })}
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
                    {group.skus.map((s:any,i:number)=>{
                      const brand=brands.find(b=>b.id===s.brandId), st=getSD(s);
                      const flatIndex=filteredSkus.findIndex((x:any)=>x.id===s.id);
                      return (
                        <div key={s.id} className="emdc-row" style={{ padding:"14px 16px",borderBottom:i<group.skus.length-1?`1px solid ${C.border}`:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                            <div style={{ minWidth:0,flex:1 }}>
                              <p style={{ margin:"0 0 2px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.productName}</p>
                              <span style={{ fontSize:11,fontFamily:"monospace",color:C.muted,background:C.surfaceAlt,padding:"2px 7px",borderRadius:4 }}>{s.sku}</span>
                            </div>
                            {skuTableEditMode&&<div style={{ display:"flex",gap:6,marginLeft:10,flexShrink:0,alignItems:"center" }}>
                              <span title="Drag rows on desktop using the 6-dot handle" style={{ width:28,height:28,borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.faint }}>&#8942;&#8942;</span>
                              <button onClick={()=>openEdit(s)} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                              <button onClick={()=>delSku(s.id)} style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                            </div>}
                          </div>
                          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                            {brand&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:6,height:6,borderRadius:"50%",background:brand.color }} /><span style={{ fontSize:11,color:C.muted }}>{brand.name}</span></div>}
                            <span style={{ fontSize:11,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:500 }}>{s.inventory.toLocaleString()} units</span>
                            <span style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"2px 8px",borderRadius:4,border:`1px solid ${st.color}28` }}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
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
            <p style={{ margin:0,fontSize:12,color:C.muted }}>Use this like a mini spreadsheet. Click and drag cells to select, copy/paste ranges, press Delete to clear selected cells, or click row numbers to select and delete rows.</p>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
              <input value={bulkNewColumn} placeholder="New column name" onChange={e=>setBulkNewColumn(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addBulkColumn(); } }}
                style={{ height:30,width:150,padding:"6px 9px",fontSize:12,borderRadius:7,border:`1.5px solid ${C.border}`,outline:"none",background:C.surface,color:C.text }} />
              <Btn xs variant="outline" onClick={addBulkColumn}>+ Column</Btn>
              <Btn xs variant="outline" onClick={()=>addBulkRows(10)}>+ 10 Rows</Btn>
              <Btn xs variant="outline" onClick={clearBulkSelectedCells} disabled={!bulkSelection&&!bulkSelectedRows.length}>Clear Selected</Btn>
              <Btn xs variant="danger" onClick={deleteBulkSelectedRows} disabled={!bulkSelectedRows.length}>Delete Row{bulkSelectedRows.length!==1?"s":""}</Btn>
              <Btn xs variant="outline" onClick={deleteBulkEmptyRows}>Remove Empty Rows</Btn>
              <Btn xs variant="outline" onClick={resetBulkColumns}>Reset Columns</Btn>
              <Btn xs variant="outline" onClick={clearBulkRows}>{bulkMode==="edit"?"Clear Sheet":"Clear All"}</Btn>
            </div>
          </div>
          {bulkMode==="edit"&&(
            <div style={{ display:"flex",alignItems:"center",gap:8,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px" }}>
              <span style={{ fontSize:13,color:C.faint,flexShrink:0 }}>Search</span>
              <input
                value={bulkSearch}
                onChange={e=>setBulkSearch(e.target.value)}
                placeholder="Search product, SKU, brand, collection, category, status, stock, SRP..."
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
                      {c.custom ? (
                        <input value={c.label} onChange={e=>renameBulkColumn(c.key,e.target.value)} placeholder="Column name"
                          style={{ minWidth:0,width:"100%",background:"transparent",border:"none",outline:"none",fontSize:10,fontWeight:800,color:C.faint,textTransform:"uppercase",letterSpacing:".05em" }} />
                      ) : (
                        <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{c.label}</span>
                      )}
                      {c.custom&&<button type="button" onClick={()=>removeBulkColumn(c.key)} title="Remove custom column"
                        style={{ width:18,height:18,borderRadius:4,border:"none",background:"#FEF2F2",color:"#DC2626",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0 }}>&#215;</button>}
                    </div>
                  ))}
                </div>
                <div style={{ maxHeight:390,overflowY:"auto" }}>
                  {bulkVisibleRows.length===0 ? (
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
                </div>
              </div>
            </div>
          </div>
          {bulkError&&<p style={{ margin:0,fontSize:12,color:C.muted }}>{bulkError}</p>}
          {bulkRows.length>0&&(
            <p style={{ margin:0,fontSize:12,color:bulkRows.some((r:any)=>r.error)?"#DC2626":C.muted,fontWeight:bulkRows.some((r:any)=>r.error)?700:400 }}>
              {bulkRows.filter((r:any)=>r.valid).length} valid SKU{bulkRows.filter((r:any)=>r.valid).length!==1?"s":""}{bulkRows.some((r:any)=>r.error) ? ` · Fix highlighted rows before ${bulkMode==="edit"?"saving":"importing"} invalid items.` : (bulkMode==="edit" ? " ready to save." : " ready to import.")}{bulkMode==="edit"&&bulkSearch.trim()?` · Showing ${bulkVisibleRows.length} matching row${bulkVisibleRows.length!==1?"s":""}. Save still applies to the full sheet.`:""}
            </p>
          )}
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
            <Btn variant="outline" onClick={()=>setBulkModal(false)}>Cancel</Btn>
            <Btn onClick={saveBulkSkus} disabled={bulkRows.filter(r=>r.valid).length===0}>{bulkMode==="edit" ? `Save ${bulkRows.filter(r=>r.valid).length} SKU${bulkRows.filter(r=>r.valid).length!==1?"s":""}` : `Import ${bulkRows.filter(r=>r.valid).length} SKU${bulkRows.filter(r=>r.valid).length!==1?"s":""}`}</Btn>
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
    try {
      localStorage.setItem("emdc_text_output_types_v1", JSON.stringify(taskOptions));
    } catch {}
  }, [taskOptions]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("emdc_text_saved_outputs_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setSavedTextOutputs(parsed);
    } catch {}
    setSavedTextOutputsHydrated(true);
  }, []);

  useEffect(() => {
    if (!savedTextOutputsHydrated) return;
    try {
      localStorage.setItem("emdc_text_saved_outputs_v1", JSON.stringify(savedTextOutputs));
    } catch {}
  }, [savedTextOutputs, savedTextOutputsHydrated]);

  useEffect(() => {
    if (!taskOptions.length) return;
    if (!taskOptions.some((item:any) => item.id === task)) {
      setTask(taskOptions[0].id);
    }
  }, [taskOptions, task]);

  const selectedTask = taskOptions.find((item:any) => item.id === task) || taskOptions[0];

  const openManageTypes = () => {
    setDraftTaskOptions(taskOptions.map((item:any) => ({ ...item })));
    setManageTypesOpen(true);
  };

  const addDraftTaskType = () => {
    setDraftTaskOptions((prev:any[]) => [
      ...prev,
      {
        id: uid(),
        label: `New Output Type ${prev.length + 1}`,
        instruction: "Write clear, useful output based on the user input.",
      },
    ]);
  };

  const updateDraftTaskType = (id:string, patch:any) => {
    setDraftTaskOptions((prev:any[]) => prev.map((item:any) => item.id === id ? { ...item, ...patch } : item));
  };

  const deleteDraftTaskType = (id:string) => {
    setDraftTaskOptions((prev:any[]) => prev.length <= 1 ? prev : prev.filter((item:any) => item.id !== id));
  };

  const saveTaskTypes = () => {
    const cleaned = draftTaskOptions
      .map((item:any) => ({
        ...item,
        label: String(item?.label || "").trim(),
        instruction: String(item?.instruction || "").trim(),
      }))
      .filter((item:any) => item.label);

    if (!cleaned.length) {
      setError("At least one output type is required.");
      return;
    }

    const normalized = cleaned.map((item:any, index:number) => ({
      id: item.id || uid(),
      label: item.label || `Output Type ${index + 1}`,
      instruction: item.instruction || "Write clear, useful output based on the user input.",
    }));

    setTaskOptions(normalized);
    if (!normalized.some((item:any) => item.id === task)) setTask(normalized[0].id);
    setManageTypesOpen(false);
  };

  const resetDefaultTaskTypes = () => {
    setDraftTaskOptions(DEFAULT_TEXT_OUTPUT_TYPES.map((item:any) => ({ ...item })));
  };

  const moveDraftTaskType = (fromId:string, toId:string) => {
    setDraftTaskOptions((prev:any[]) => {
      const fromIndex = prev.findIndex((item:any) => item.id === fromId);
      const toIndex = prev.findIndex((item:any) => item.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const duplicateDraftTaskType = (id:string) => {
    setDraftTaskOptions((prev:any[]) => {
      const index = prev.findIndex((item:any) => item.id === id);
      if (index < 0) return prev;
      const item = prev[index];
      const copy = {
        ...item,
        id: uid(),
        label: `${item.label} Copy`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const exportTaskTypePresets = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        outputTypes: draftTaskOptions,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "emdc-text-output-types.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export presets.");
    }
  };

  const importTaskTypePresets = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => setError("Could not read preset file.");
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.outputTypes)
            ? parsed.outputTypes
            : [];

        if (!list.length) throw new Error("No output types found in the preset file.");

        const normalized = list.map((item:any, index:number) => ({
          id: item?.id || uid(),
          label: String(item?.label || `Output Type ${index + 1}`).trim(),
          instruction: String(item?.instruction || "Write clear, useful output based on the user input.").trim(),
        })).filter((item:any) => item.label);

        if (!normalized.length) throw new Error("Preset file is empty.");

        setDraftTaskOptions(normalized);
        setError("");
      } catch (err:any) {
        setError(err?.message || "Invalid preset file.");
      }
    };
    reader.readAsText(file);
  };

  const handleReferenceUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    try {
      const validFiles = Array.from(files).filter(file=>file.type.startsWith("image/")).slice(0, 4);
      const prepared = await Promise.all(validFiles.map(file=>compressTextReferenceImage(file)));
      setReferenceImages(prev => [...prev, ...prepared].slice(0, 4));
    } catch (err:any) {
      setError(err?.message || "Could not prepare reference image.");
    }
  };

  const removeReferenceImage = (id:string) => {
    setReferenceImages(prev => prev.filter((img:any) => img.id !== id));
  };

  const generateText = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await fetch("/api/ai/generate-text", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          task,
          taskLabel: selectedTask?.label || "Output",
          instruction: selectedTask?.instruction || "",
          tone,
          input:input.trim(),
          referenceImages: referenceImages.map((img:any)=>({
            name: img.name,
            type: img.type || "image/jpeg",
            dataUrl: img.dataUrl,
          })),
        }),
      });

      const raw = await res.text();
      let data:any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(raw || "Text generation failed.");
      }

      if (!res.ok) {
        const msg = data?.error || data?.message || "Text generation failed.";
        throw new Error(typeof msg === "string" ? msg : "Text generation failed.");
      }

      setOutput(data?.text || "");
    } catch (err:any) {
      setError(err?.message || "Text generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async (textToCopy = output) => {
    if (!textToCopy) return;
    try { await navigator.clipboard.writeText(textToCopy); } catch {}
  };

  const saveTextOutput = () => {
    if (!output.trim()) return;
    const item = {
      id: uid(),
      text: output,
      input,
      task,
      taskLabel: selectedTask?.label || "Output",
      instruction: selectedTask?.instruction || "",
      tone,
      createdAt: new Date().toISOString(),
    };
    setSavedTextOutputs((prev:any[]) => [item, ...prev]);
  };

  const openSavedTextOutput = (item:any) => {
    setOutput(item.text || "");
    if (item.input) setInput(item.input);
    if (item.tone) setTone(item.tone);
    if (item.task && taskOptions.some((t:any)=>t.id===item.task)) setTask(item.task);
  };

  const deleteSavedTextOutput = (id:string) => {
    setSavedTextOutputs((prev:any[]) => prev.filter((item:any) => item.id !== id));
  };

  return (
    <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?14:20,maxWidth:"100%",overflow:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:18,flexWrap:"wrap" }}>
        <div>
          <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:800,color:C.text }}>Text Generator</h3>
          <p style={{ margin:0,fontSize:13,color:C.muted }}>Generate product copy, captions, prompts, titles, selling points, and hashtags using Gemini.</p>
        </div>
        <Tag color="#14B8A6">Gemini</Tag>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"minmax(0,360px) minmax(0,1fr)",gap:14,alignItems:"start",width:"100%" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <Field label="Output Type">
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr) auto":"minmax(0,1fr) auto",gap:8,alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <Select value={task} onChange={setTask}>
                  {taskOptions.map((t:any)=><option key={t.id} value={t.id}>{t.label}</option>)}
                </Select>
              </div>
              <button
                type="button"
                onClick={openManageTypes}
                style={{ height:42,padding:"0 12px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}
              >
                Manage
              </button>
            </div>
          </Field>

          <Field label="Tone">
            <Select value={tone} onChange={setTone}>
              {toneOptions.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </Field>

          <Field label="Product / Instruction Input">
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              placeholder="Paste product details, features, target platform, or the draft text you want improved..."
              rows={9}
              style={{ width:"100%",padding:"12px 14px",fontSize:14,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
              onFocus={e=>e.currentTarget.style.borderColor=C.accent}
              onBlur={e=>e.currentTarget.style.borderColor=C.border}
            />
          </Field>

          <Field label="Reference Images">
            <div style={{ display:"flex",flexDirection:"column",gap:10,padding:10,borderRadius:10,border:`1.5px dashed ${C.borderStrong}`,background:C.bg }}>
              <label style={{ display:"inline-flex",justifyContent:"center",alignItems:"center",height:40,padding:"0 14px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,fontSize:14,fontWeight:700,cursor:"pointer" }}>
                + Upload Reference Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display:"none" }}
                  onChange={e=>{
                    handleReferenceUpload(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              <p style={{ margin:0,fontSize:11,color:C.muted }}>
                Optional. Add up to 4 images so Gemini can use the visible product details as context. These are temporary only and are not saved.
              </p>

              {referenceImages.length>0 && (
                <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
                  {referenceImages.map((img:any)=>(
                    <div key={img.id} style={{ width:88,border:`1px solid ${C.border}`,borderRadius:10,background:C.surface,overflow:"hidden",position:"relative" }}>
                      <button
                        type="button"
                        onClick={()=>removeReferenceImage(img.id)}
                        style={{ position:"absolute",top:4,right:4,width:18,height:18,borderRadius:999,border:"none",background:"rgba(255,255,255,.92)",color:"#DC2626",fontSize:12,fontWeight:800,cursor:"pointer",lineHeight:1 }}
                      >
                        ×
                      </button>
                      <img src={img.dataUrl} alt={img.name} style={{ display:"block",width:"100%",height:70,objectFit:"cover",background:"#fff" }} />
                      <div style={{ padding:"5px 6px",fontSize:10,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{img.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {error&&(
            <div style={{ padding:"10px 12px",borderRadius:9,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:13,fontWeight:600 }}>
              {error}
            </div>
          )}

          <Btn full onClick={generateText} disabled={loading||!input.trim()}>
            {loading ? "Generating Text..." : "Generate Text"}
          </Btn>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
            <h4 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Text Result</h4>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {output&&<Btn xs variant="outline" onClick={saveTextOutput}>Save Output</Btn>}
              {output&&<Btn xs variant="outline" onClick={()=>copyOutput(output)}>Copy</Btn>}
              {output&&<Btn xs variant="ghost" onClick={()=>setOutput("")}>Clear</Btn>}
            </div>
          </div>

          <div style={{ minHeight:isMobile?180:260,padding:14,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.bg,whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.55,color:output?C.textSub:C.muted,overflowY:"auto",maxWidth:"100%" }}>
            {loading ? "Generating..." : output || "Your generated text will appear here."}
          </div>

          <div style={{ marginTop:10,padding:14,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10 }}>
              <h4 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Saved Text Outputs</h4>
              {savedTextOutputs.length>0&&(
                <button
                  type="button"
                  onClick={()=>setSavedTextOutputs([])}
                  style={{ border:"none",background:"transparent",color:"#DC2626",fontSize:11,fontWeight:700,cursor:"pointer" }}
                >
                  Clear All
                </button>
              )}
            </div>

            {savedTextOutputs.length===0 ? (
              <p style={{ margin:0,fontSize:12,color:C.muted }}>
                Nothing saved yet. Click Save Output after generating text to keep it in this browser.
              </p>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:260,overflowY:"auto" }}>
                {savedTextOutputs.map((item:any)=>(
                  <div
                    key={item.id}
                    onClick={()=>openSavedTextOutput(item)}
                    style={{ padding:10,borderRadius:9,background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start" }}
                  >
                    <div style={{ minWidth:0,flex:1 }}>
                      <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4 }}>
                        <span style={{ fontSize:11,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".04em" }}>{item.taskLabel || "Output"}</span>
                        <span style={{ fontSize:11,color:C.muted }}>{item.tone || ""}</span>
                      </div>
                      <p style={{ margin:"0 0 4px",fontSize:12,color:C.textSub,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
                        {item.text}
                      </p>
                      {item.input&&<p style={{ margin:0,fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>Input: {item.input}</p>}
                    </div>
                    <div style={{ display:"flex",gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={()=>copyOutput(item.text)}
                        style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:C.textSub,cursor:"pointer" }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={()=>deleteSavedTextOutput(item.id)}
                        style={{ border:"none",background:"#FEF2F2",borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:"#DC2626",cursor:"pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:639px){
          textarea,input,select,button{max-width:100%;}
          img{max-width:100%;}
        }
        @media(max-width:1023px){
          div[style*="grid-template-columns: minmax(0, 360px) minmax(0, 1fr)"]{
            grid-template-columns:1fr!important;
          }
        }
      `}</style>

      <Modal open={manageTypesOpen} onClose={()=>setManageTypesOpen(false)} title="Manage Output Types" width={860}>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            <p style={{ margin:0,fontSize:13,color:C.muted }}>
              Add, edit, delete, duplicate, reorder, import, and export output types. These settings are saved in this browser.
            </p>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <input
                ref={importTypesInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display:"none" }}
                onChange={e=>{
                  importTaskTypePresets(e.currentTarget.files?.[0] || null);
                  e.currentTarget.value = "";
                }}
              />
              <Btn sm variant="outline" onClick={exportTaskTypePresets}>Export Presets</Btn>
              <Btn sm variant="outline" onClick={()=>importTypesInputRef.current?.click()}>Import Presets</Btn>
              <Btn sm variant="outline" onClick={resetDefaultTaskTypes}>Reset Default</Btn>
              <Btn sm variant="outline" onClick={addDraftTaskType}>+ Add Output Type</Btn>
            </div>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:12,maxHeight:"65vh",overflowY:"auto",paddingRight:4 }}>
            {draftTaskOptions.map((item:any, index:number)=>(
              <div
                key={item.id}
                draggable
                onDragStart={()=>setDragTaskId(item.id)}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{
                  e.preventDefault();
                  if (dragTaskId && dragTaskId !== item.id) moveDraftTaskType(dragTaskId, item.id);
                  setDragTaskId(null);
                }}
                onDragEnd={()=>setDragTaskId(null)}
                style={{
                  border:`1px solid ${dragTaskId === item.id ? C.accent : C.border}`,
                  borderRadius:12,
                  padding:12,
                  background:dragTaskId === item.id ? "#F0F9FF" : C.bg,
                  display:"flex",
                  flexDirection:"column",
                  gap:10
                }}
              >
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div
                      title="Drag to reorder"
                      style={{ width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",color:C.muted,fontSize:15,fontWeight:700,flexShrink:0 }}
                    >
                      ⋮⋮
                    </div>
                    <div>
                      <div style={{ fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".04em" }}>
                        Output Type {index + 1}
                      </div>
                      <div style={{ fontSize:11,color:C.muted }}>Drag this card to reorder in the dropdown.</div>
                    </div>
                  </div>

                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    <button
                      type="button"
                      onClick={()=>duplicateDraftTaskType(item.id)}
                      style={{ height:32,padding:"0 10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,fontSize:12,fontWeight:700,cursor:"pointer" }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={()=>deleteDraftTaskType(item.id)}
                      disabled={draftTaskOptions.length <= 1}
                      style={{ height:32,padding:"0 10px",borderRadius:8,border:"1px solid #FECACA",background:draftTaskOptions.length <= 1 ? "#F9FAFB" : "#FEF2F2",color:draftTaskOptions.length <= 1 ? "#9CA3AF" : "#DC2626",fontSize:12,fontWeight:700,cursor:draftTaskOptions.length <= 1 ? "not-allowed" : "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <Field label="Label">
                  <input
                    value={item.label}
                    onChange={e=>updateDraftTaskType(item.id, { label: e.target.value })}
                    placeholder="e.g. Product Description"
                    style={{ width:"100%",height:42,padding:"0 12px",fontSize:14,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                  />
                </Field>

                <Field label="Instruction">
                  <textarea
                    value={item.instruction}
                    onChange={e=>updateDraftTaskType(item.id, { instruction: e.target.value })}
                    placeholder="Tell Gemini exactly what to generate for this output type..."
                    rows={4}
                    style={{ width:"100%",padding:"12px 14px",fontSize:14,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
                  />
                </Field>
              </div>
            ))}
          </div>

          <div style={{ display:"flex",justifyContent:"flex-end",gap:8 }}>
            <Btn sm variant="ghost" onClick={()=>setManageTypesOpen(false)}>Cancel</Btn>
            <Btn sm onClick={saveTaskTypes}>Save Output Types</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── AD TEMPLATE BUILDER ──────────────────────────────────────────────────────
const DEFAULT_AD_TEMPLATE_PLATFORMS = [
  {
    id: "meta",
    name: "Meta",
    formats: [
      {
        id: "meta-single-image",
        name: "Single Image Ad",
        templates: [
          {
            id: "meta-single-image-template-1",
            name: "Benefit Hook Template",
            body: "Hook: [Main customer problem]\nPrimary Text: [Introduce product + key benefit]\nCreative Direction: Clean lifestyle product image with clear hero product focus.\nHeadline: [Short benefit headline]\nCTA: Shop Now",
          },
        ],
      },
      {
        id: "meta-carousel",
        name: "Carousel Ad",
        templates: [
          {
            id: "meta-carousel-template-1",
            name: "Feature Breakdown Carousel",
            body: "Card 1: Hero product + main hook\nCard 2: Feature 1 + benefit\nCard 3: Feature 2 + benefit\nCard 4: Lifestyle use case\nCard 5: Offer or CTA\nPrimary Text: [Short product intro]\nCTA: Shop Now",
          },
        ],
      },
      {
        id: "meta-reels-stories",
        name: "Reels / Stories Ad",
        templates: [
          {
            id: "meta-reels-template-1",
            name: "Problem to Solution Reel",
            body: "Scene 1: Show everyday problem\nScene 2: Product appears as the simple solution\nScene 3: Quick feature demo\nScene 4: Lifestyle result\nEnd Frame: Product + offer + CTA",
          },
        ],
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    formats: [
      {
        id: "tiktok-in-feed",
        name: "In-Feed Video Ad",
        templates: [
          {
            id: "tiktok-in-feed-template-1",
            name: "UGC Hook Template",
            body: "0-2s Hook: [Relatable problem or bold claim]\n3-6s Demo: Show the product solving the problem\n7-10s Proof: Feature or benefit close-up\n11-15s CTA: [Shop now / Try it today]\nTone: Natural, fast-paced, not too scripted.",
          },
        ],
      },
      {
        id: "tiktok-spark",
        name: "Spark Ad",
        templates: [
          {
            id: "tiktok-spark-template-1",
            name: "Creator Testimonial Template",
            body: "Opening: Creator shows product in real use\nMiddle: 2-3 honest benefits\nClose-up: Product detail shot\nEnding: Personal recommendation + CTA",
          },
        ],
      },
      {
        id: "tiktok-live",
        name: "LIVE Shopping Ad",
        templates: [
          {
            id: "tiktok-live-template-1",
            name: "Live Selling Push Template",
            body: "Opening Line: [Introduce product + deal]\nDemo: Show product function clearly\nSelling Points: [3 quick benefits]\nUrgency: [Limited stock / live-only offer]\nCTA: Tap the yellow cart now",
          },
        ],
      },
    ],
  },
  {
    id: "google",
    name: "Google",
    formats: [
      {
        id: "google-search",
        name: "Search Ad",
        templates: [
          {
            id: "google-search-template-1",
            name: "Responsive Search Ad Template",
            body: "Headlines:\n1. [Product Name]\n2. [Key Benefit]\n3. Shop Online Today\n4. [Brand Name]\nDescriptions:\n1. Discover [product] designed for [main benefit]. Shop now.\n2. Quality, style, and everyday function in one product.",
          },
        ],
      },
      {
        id: "google-pmax",
        name: "Performance Max",
        templates: [
          {
            id: "google-pmax-template-1",
            name: "Asset Group Template",
            body: "Final URL: [Product URL]\nHeadlines: [5 short headlines]\nLong Headline: [Main product promise]\nDescriptions: [4 benefit-led descriptions]\nImage Direction: Clean product hero + lifestyle use case\nAudience Signal: [Target audience]",
          },
        ],
      },
      {
        id: "google-youtube",
        name: "YouTube Video Ad",
        templates: [
          {
            id: "google-youtube-template-1",
            name: "15-Second Video Template",
            body: "0-3s: Product/problem hook\n4-8s: Show product in use\n9-12s: Main benefit and proof\n13-15s: Logo/product end frame + CTA",
          },
        ],
      },
      {
        id: "google-display",
        name: "Display Ad",
        templates: [
          {
            id: "google-display-template-1",
            name: "Banner Ad Template",
            body: "Visual: Product hero image\nHeadline: [Short benefit]\nSubtext: [Offer or feature]\nCTA Button: Shop Now\nLayout: Clean, high contrast, readable at small sizes.",
          },
        ],
      },
    ],
  },
];

const AIAdTemplates = () => {
  const { isMobile } = useBreakpoint();
  const [platforms,setPlatforms] = useState<any[]>(() => {
    if (typeof window === "undefined") return DEFAULT_AD_TEMPLATE_PLATFORMS;
    try {
      const raw = localStorage.getItem("emdc_ad_template_platforms_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return DEFAULT_AD_TEMPLATE_PLATFORMS;
  });
  const [selectedPlatformId,setSelectedPlatformId] = useState("meta");
  const [selectedFormatId,setSelectedFormatId] = useState("meta-single-image");
  const [selectedTemplateId,setSelectedTemplateId] = useState("");
  const [adBrief,setAdBrief] = useState("");
  const [adGenerating,setAdGenerating] = useState(false);
  const [adError,setAdError] = useState("");
  const [generatedAdText,setGeneratedAdText] = useState("");
  const [generatedAdCards,setGeneratedAdCards] = useState<any[]>([]);
  const [savedAdTemplates,setSavedAdTemplates] = useState<any[]>([]);
  const [savedAdTemplatesHydrated,setSavedAdTemplatesHydrated] = useState(false);

  useEffect(()=>{
    try {
      localStorage.setItem("emdc_ad_template_platforms_v1", JSON.stringify(platforms));
    } catch {}
  },[platforms]);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem("emdc_saved_ad_templates_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setSavedAdTemplates(parsed);
    } catch {}
    setSavedAdTemplatesHydrated(true);
  },[]);

  useEffect(()=>{
    if (!savedAdTemplatesHydrated) return;
    try {
      localStorage.setItem("emdc_saved_ad_templates_v1", JSON.stringify(savedAdTemplates));
    } catch {}
  },[savedAdTemplates,savedAdTemplatesHydrated]);

  const selectedPlatform = platforms.find((p:any)=>p.id===selectedPlatformId) || platforms[0];
  const selectedFormat = selectedPlatform?.formats?.find((f:any)=>f.id===selectedFormatId) || selectedPlatform?.formats?.[0];
  const selectedTemplate = selectedFormat?.templates?.find((t:any)=>t.id===selectedTemplateId) || selectedFormat?.templates?.[0];
  const isCarouselFormat = (selectedFormat?.name || "").toLowerCase().includes("carousel");

  const makeEmptyCarouselCards = () => Array.from({ length:10 }, (_,i)=>({
    id: uid(),
    cardNumber: i + 1,
    headline: "",
    copy: "",
    visual: "",
    cta: "",
  }));

  useEffect(()=>{
    if (!selectedPlatform) return;
    if (!selectedPlatform.formats?.some((f:any)=>f.id===selectedFormatId)) {
      setSelectedFormatId(selectedPlatform.formats?.[0]?.id || "");
    }
  },[selectedPlatformId, platforms]);

  useEffect(()=>{
    if (!selectedFormat) return;
    if (!selectedFormat.templates?.some((t:any)=>t.id===selectedTemplateId)) {
      setSelectedTemplateId(selectedFormat.templates?.[0]?.id || "");
    }
    setGeneratedAdText("");
    setAdError("");
    setGeneratedAdCards((selectedFormat.name || "").toLowerCase().includes("carousel") ? makeEmptyCarouselCards() : []);
  },[selectedFormatId]);

  const updateAdCard = (index:number, patch:any) => {
    setGeneratedAdCards((prev:any[]) => prev.map((card:any, i:number)=>i===index ? { ...card, ...patch } : card));
  };

  const formatCarouselCardsForCopy = (cards:any[]) => cards.map((card:any, i:number)=>[
    `Card ${i + 1}`,
    `Headline: ${card.headline || ""}`,
    `Copy: ${card.copy || ""}`,
    `Visual: ${card.visual || ""}`,
    `CTA: ${card.cta || ""}`,
  ].join("\n")).join("\n\n");

  const parseCarouselCards = (raw:string) => {
    const clean = (value:any) => String(value || "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^\*+|\*+$/g, "")
      .trim();

    try {
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        const cards = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cards) ? parsed.cards : [];
        if (cards.length) {
          return Array.from({ length:10 }, (_,i)=>{
            const card = cards[i] || {};
            return {
              id: uid(),
              cardNumber: i + 1,
              headline: clean(card.headline || card.title),
              copy: clean(card.copy || card.text || card.primaryText),
              visual: clean(card.visual || card.visualDirection || card.image),
              cta: clean(card.cta || card.callToAction),
            };
          });
        }
      }
    } catch {}

    const blocks = raw
      .split(/(?=(?:\*\*)?\s*Card\s*\d+\s*(?:[:\-]|\*\*))/i)
      .map(block=>block.trim())
      .filter(Boolean);

    return Array.from({ length:10 }, (_,i)=>{
      const block = blocks.find(b=>new RegExp(`(?:\\*\\*)?\\s*Card\\s*${i+1}\\s*(?:[:\\-]|\\*\\*)`, "i").test(b)) || blocks[i] || "";
      const pick = (labels:string[]) => {
        for (const label of labels) {
          const pattern = new RegExp(`(?:\\*\\*)?\\s*${label}\\s*(?:\\*\\*)?\\s*[:\\-]\\s*([^\\n]+)`, "i");
          const match = block.match(pattern);
          if (match?.[1]) return clean(match[1]);
        }
        return "";
      };
      const fallbackLines = block
        .split("\n")
        .map(line=>clean(line.replace(/^(?:\*\s*)?(?:Card\s*\d+\s*[:\-]?)?/i, "")))
        .filter(Boolean);

      return {
        id: uid(),
        cardNumber: i + 1,
        headline: pick(["Headline","Title"]) || fallbackLines[0] || "",
        copy: pick(["Copy","Primary Text","Text","Caption"]) || fallbackLines[1] || "",
        visual: pick(["Visual Direction","Visual","Image Direction","Image"]) || fallbackLines[2] || "",
        cta: pick(["CTA","Call to Action"]) || fallbackLines[3] || "",
      };
    });
  };

  const fillMissingCarouselCards = async (currentCards:any[]) => {
    const missingIndexes = currentCards
      .map((card:any, index:number)=>({ card, index }))
      .filter(({ card }:any)=>!(card?.headline || card?.copy || card?.visual || card?.cta))
      .map(({ index }:any)=>index);

    if (!isCarouselFormat || !missingIndexes.length || !adBrief.trim()) return currentCards;

    const instruction = [
      `Generate only the missing carousel cards for ${selectedPlatform?.name || "Meta"} ${selectedFormat?.name || "Carousel Ad"}.`,
      `Missing card numbers: ${missingIndexes.map(i=>i+1).join(", ")}.`,
      "Return compact valid JSON only, no markdown, using this exact structure: { \"cards\": [ { \"cardNumber\": 2, \"headline\": \"...\", \"copy\": \"...\", \"visual\": \"...\", \"cta\": \"...\" } ] }.",
      "Keep each field short and ecommerce-ready.",
      selectedTemplate?.body ? `Use this custom template as the structure and inspiration:\n${selectedTemplate.body}` : "",
    ].filter(Boolean).join("\n\n");

    const res = await fetch("/api/ai/generate-text", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        task:"ad_template_generator_repair",
        taskLabel:`${selectedPlatform?.name || "Platform"} ${selectedFormat?.name || "Ad Format"} Missing Cards`,
        instruction,
        tone:"professional",
        input:adBrief.trim(),
        referenceImages:[],
      }),
    });

    const raw = await res.text();
    let data:any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return currentCards;
    }

    if (!res.ok || !data?.text) return currentCards;

    const repaired = parseCarouselCards(data.text);
    const next = [...currentCards];

    missingIndexes.forEach((missingIndex:number)=>{
      const byNumber = repaired.find((card:any)=>Number(card.cardNumber) === missingIndex + 1);
      const fallback = repaired.find((card:any)=>card.headline || card.copy || card.visual || card.cta);
      const picked = byNumber || fallback;
      if (picked) {
        next[missingIndex] = {
          ...next[missingIndex],
          headline:picked.headline || next[missingIndex]?.headline || "",
          copy:picked.copy || next[missingIndex]?.copy || "",
          visual:picked.visual || next[missingIndex]?.visual || "",
          cta:picked.cta || next[missingIndex]?.cta || "",
        };
      }
    });

    return next;
  };

  const generateAdForFormat = async () => {
    if (!selectedPlatform || !selectedFormat) return;
    if (!adBrief.trim()) {
      setAdError("Please enter a product, offer, or campaign brief first.");
      return;
    }

    setAdGenerating(true);
    setAdError("");
    setGeneratedAdText("");

    try {
      const carouselInstruction = isCarouselFormat
        ? "Because this is a carousel ad format, generate exactly 10 carousel cards. Return compact valid JSON only, no markdown, no explanation. Use this structure: { \"cards\": [ { \"headline\": \"...\", \"copy\": \"...\", \"visual\": \"...\", \"cta\": \"...\" } ] }. The cards array must contain exactly 10 items. Keep each field short so all 10 cards are completed."
        : "Generate one complete ad output for this selected ad format.";

      const instruction = [
        `Generate a ${selectedPlatform.name} ad for the selected format: ${selectedFormat.name}.`,
        carouselInstruction,
        selectedTemplate?.body ? `Use this custom template as the structure and inspiration:\n${selectedTemplate.body}` : "",
        "Keep it clear, ecommerce-ready, and easy to copy.",
        "Avoid em dashes.",
        "Do not invent technical specs that are not provided.",
      ].filter(Boolean).join("\n\n");

      const res = await fetch("/api/ai/generate-text", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          task:"ad_template_generator",
          taskLabel:`${selectedPlatform.name} ${selectedFormat.name}`,
          instruction,
          tone:"professional",
          input:adBrief.trim(),
          referenceImages:[],
        }),
      });

      const raw = await res.text();
      let data:any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(raw || "Ad generation failed.");
      }

      if (!res.ok) {
        const msg = data?.error || data?.message || "Ad generation failed.";
        throw new Error(typeof msg === "string" ? msg : "Ad generation failed.");
      }

      const textOutput = data?.text || "";
      setGeneratedAdText(textOutput);

      if (isCarouselFormat) {
        const parsedCards = parseCarouselCards(textOutput);
        setGeneratedAdCards(parsedCards);

        const hasMissing = parsedCards.some((card:any)=>!(card.headline || card.copy || card.visual || card.cta));
        if (hasMissing) {
          const completedCards = await fillMissingCarouselCards(parsedCards);
          setGeneratedAdCards(completedCards);
        }
      }
    } catch (err:any) {
      setAdError(err?.message || "Ad generation failed.");
    } finally {
      setAdGenerating(false);
    }
  };

  const copyGeneratedAd = async () => {
    try {
      await navigator.clipboard.writeText(isCarouselFormat ? formatCarouselCardsForCopy(generatedAdCards) : generatedAdText);
    } catch {}
  };

  const saveGeneratedAdTemplate = () => {
    const hasCarousel = isCarouselFormat && generatedAdCards.some((card:any)=>card.headline || card.copy || card.visual || card.cta);
    const hasText = !isCarouselFormat && generatedAdText.trim();

    if (!hasCarousel && !hasText) {
      setAdError("Generate an ad first before saving.");
      return;
    }

    const item = {
      id: uid(),
      name: `${selectedPlatform?.name || "Platform"} ${selectedFormat?.name || "Ad"} - ${new Date().toLocaleDateString()}`,
      platformId:selectedPlatform?.id || "",
      platformName:selectedPlatform?.name || "",
      formatId:selectedFormat?.id || "",
      formatName:selectedFormat?.name || "",
      templateId:selectedTemplate?.id || "",
      templateName:selectedTemplate?.name || "",
      brief:adBrief,
      isCarousel:isCarouselFormat,
      cards:isCarouselFormat ? generatedAdCards : [],
      text:isCarouselFormat ? formatCarouselCardsForCopy(generatedAdCards) : generatedAdText,
      createdAt:new Date().toISOString(),
    };

    setSavedAdTemplates((prev:any[]) => [item, ...prev]);
    setAdError("");
  };

  const openSavedAdTemplate = (item:any) => {
    if (item.platformId && platforms.some((p:any)=>p.id===item.platformId)) {
      setSelectedPlatformId(item.platformId);
    }
    if (item.formatId) setSelectedFormatId(item.formatId);
    if (item.templateId) setSelectedTemplateId(item.templateId);
    setAdBrief(item.brief || "");
    setGeneratedAdText(item.text || "");
    setGeneratedAdCards(Array.isArray(item.cards) && item.cards.length ? item.cards : (item.isCarousel ? parseCarouselCards(item.text || "") : []));
    setAdError("");
  };

  const deleteSavedAdTemplate = (id:string) => {
    setSavedAdTemplates((prev:any[]) => prev.filter((item:any)=>item.id!==id));
  };

  const copySavedAdTemplate = async (item:any) => {
    try { await navigator.clipboard.writeText(item?.text || ""); } catch {}
  };

  const updatePlatform = (platformId:string, updater:(platform:any)=>any) => {
    setPlatforms((prev:any[]) => prev.map((platform:any)=>platform.id===platformId ? updater(platform) : platform));
  };

  const addFormat = () => {
    if (!selectedPlatform) return;
    const newFormat = {
      id: uid(),
      name: "New Ad Format",
      templates: [],
    };
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:[...(platform.formats || []), newFormat],
    }));
    setSelectedFormatId(newFormat.id);
  };

  const updateFormatName = (formatId:string, name:string) => {
    if (!selectedPlatform) return;
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).map((format:any)=>format.id===formatId ? { ...format, name } : format),
    }));
  };

  const deleteFormat = (formatId:string) => {
    if (!selectedPlatform) return;
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).filter((format:any)=>format.id!==formatId),
    }));
  };

  const duplicateFormat = (format:any) => {
    if (!selectedPlatform || !format) return;
    const copy = {
      ...format,
      id: uid(),
      name: `${format.name} Copy`,
      templates:(format.templates || []).map((template:any)=>({ ...template, id:uid(), name:`${template.name} Copy` })),
    };
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:[...(platform.formats || []), copy],
    }));
    setSelectedFormatId(copy.id);
  };

  const addTemplate = () => {
    if (!selectedPlatform || !selectedFormat) return;
    const newTemplate = {
      id: uid(),
      name: "New Template",
      body: "Hook: [Write your opening hook here]\nBody: [Main ad message]\nCreative Direction: [Visual idea]\nCTA: [Call to action]",
    };
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).map((format:any)=>format.id===selectedFormat.id
        ? { ...format, templates:[...(format.templates || []), newTemplate] }
        : format
      ),
    }));
  };

  const updateTemplate = (templateId:string, patch:any) => {
    if (!selectedPlatform || !selectedFormat) return;
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).map((format:any)=>format.id===selectedFormat.id
        ? {
            ...format,
            templates:(format.templates || []).map((template:any)=>template.id===templateId ? { ...template, ...patch } : template),
          }
        : format
      ),
    }));
  };

  const deleteTemplate = (templateId:string) => {
    if (!selectedPlatform || !selectedFormat) return;
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).map((format:any)=>format.id===selectedFormat.id
        ? { ...format, templates:(format.templates || []).filter((template:any)=>template.id!==templateId) }
        : format
      ),
    }));
  };

  const duplicateTemplate = (template:any) => {
    if (!selectedPlatform || !selectedFormat || !template) return;
    const copy = { ...template, id:uid(), name:`${template.name} Copy` };
    updatePlatform(selectedPlatform.id, (platform:any)=>({
      ...platform,
      formats:(platform.formats || []).map((format:any)=>format.id===selectedFormat.id
        ? { ...format, templates:[...(format.templates || []), copy] }
        : format
      ),
    }));
  };

  const copyTemplate = async (template:any) => {
    try { await navigator.clipboard.writeText(template?.body || ""); } catch {}
  };

  const resetAdTemplates = () => {
    setPlatforms(DEFAULT_AD_TEMPLATE_PLATFORMS);
    setSelectedPlatformId("meta");
    setSelectedFormatId("meta-single-image");
  };

  return (
    <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?14:20,maxWidth:"100%",overflow:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:18,flexWrap:"wrap" }}>
        <div>
          <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:800,color:C.text }}>Ad Template Builder</h3>
          <p style={{ margin:0,fontSize:13,color:C.muted }}>Create and manage custom ad templates by platform and ad format.</p>
        </div>
        <Btn sm variant="outline" onClick={resetAdTemplates}>Reset Default</Btn>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"220px 300px minmax(0,1fr)",gap:14,alignItems:"start",width:"100%" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Platforms</h4>
          {platforms.map((platform:any)=>(
            <button
              key={platform.id}
              type="button"
              onClick={()=>{ setSelectedPlatformId(platform.id); setSelectedFormatId(platform.formats?.[0]?.id || ""); }}
              style={{ textAlign:"left",height:44,padding:"0 14px",borderRadius:10,border:`1.5px solid ${selectedPlatformId===platform.id ? C.accent : C.border}`,background:selectedPlatformId===platform.id ? C.accent : C.surface,color:selectedPlatformId===platform.id ? "#fff" : C.text,fontSize:14,fontWeight:800,cursor:"pointer" }}
            >
              {platform.name}
            </button>
          ))}
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
            <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Ad Formats</h4>
            <Btn xs variant="outline" onClick={addFormat}>+ Add</Btn>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {(selectedPlatform?.formats || []).map((format:any)=>(
              <div
                key={format.id}
                onClick={()=>setSelectedFormatId(format.id)}
                style={{ padding:10,borderRadius:10,border:`1.5px solid ${selectedFormat?.id===format.id ? C.accent : C.border}`,background:selectedFormat?.id===format.id ? "#F9FAFB" : C.surface,cursor:"pointer",display:"flex",flexDirection:"column",gap:8 }}
              >
                <input
                  value={format.name}
                  onChange={e=>updateFormatName(format.id, e.target.value)}
                  onClick={e=>e.stopPropagation()}
                  style={{ width:"100%",height:34,padding:"0 10px",fontSize:13,fontWeight:700,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                />
                <div style={{ display:"flex",gap:6,justifyContent:"flex-end" }} onClick={e=>e.stopPropagation()}>
                  <button type="button" onClick={()=>duplicateFormat(format)} style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:C.textSub,cursor:"pointer" }}>Duplicate</button>
                  <button type="button" onClick={()=>deleteFormat(format.id)} style={{ border:"none",background:"#FEF2F2",borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:"#DC2626",cursor:"pointer" }}>Delete</button>
                </div>
              </div>
            ))}

            {(!selectedPlatform?.formats || selectedPlatform.formats.length===0) && (
              <p style={{ margin:0,fontSize:12,color:C.muted }}>No ad formats yet. Add one to start creating templates.</p>
            )}
          </div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,background:C.bg,display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <div>
                <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Generate Ad</h4>
                <p style={{ margin:"2px 0 0",fontSize:12,color:C.muted }}>{selectedPlatform?.name || "Platform"} · {selectedFormat?.name || "No format selected"}</p>
              </div>
              <Btn xs onClick={generateAdForFormat} disabled={!selectedFormat || adGenerating}>
                {adGenerating ? "Generating All..." : "Generate Ad"}
              </Btn>
            </div>

            <Field label="Campaign / Product Brief">
              <textarea
                value={adBrief}
                onChange={e=>setAdBrief(e.target.value)}
                placeholder="Paste the product, offer, target audience, selling points, or campaign direction..."
                rows={4}
                style={{ width:"100%",padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
              />
            </Field>

            {selectedFormat && (selectedFormat.templates || []).length>0 && (
              <Field label="Use Template">
                <Select value={selectedTemplate?.id || ""} onChange={setSelectedTemplateId}>
                  {(selectedFormat.templates || []).map((template:any)=>(
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </Select>
              </Field>
            )}

            {adError && (
              <div style={{ padding:"10px 12px",borderRadius:9,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:13,fontWeight:600 }}>
                {adError}
              </div>
            )}

            {selectedFormat && isCarouselFormat && (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                  <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>10 Carousel Cards</h4>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    <Btn xs variant="outline" onClick={saveGeneratedAdTemplate}>Save Output</Btn>
                    <Btn xs variant="outline" onClick={copyGeneratedAd}>Copy All</Btn>
                  </div>
                </div>

                <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"repeat(2,minmax(0,1fr))",gap:10 }}>
                  {(generatedAdCards.length ? generatedAdCards : makeEmptyCarouselCards()).map((card:any, index:number)=>(
                    <div key={card.id || index} style={{ border:`1px solid ${C.border}`,borderRadius:10,padding:10,background:C.surface,display:"flex",flexDirection:"column",gap:8 }}>
                      <div style={{ fontSize:12,fontWeight:800,color:C.text }}>Card {index + 1}</div>
                      <input
                        value={card.headline || ""}
                        onChange={e=>updateAdCard(index, { headline:e.target.value })}
                        placeholder="Headline"
                        style={{ width:"100%",height:34,padding:"0 10px",fontSize:12,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                      />
                      <textarea
                        value={card.copy || ""}
                        onChange={e=>updateAdCard(index, { copy:e.target.value })}
                        placeholder="Copy"
                        rows={3}
                        style={{ width:"100%",padding:"8px 10px",fontSize:12,lineHeight:1.4,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
                      />
                      <input
                        value={card.visual || ""}
                        onChange={e=>updateAdCard(index, { visual:e.target.value })}
                        placeholder="Visual direction"
                        style={{ width:"100%",height:34,padding:"0 10px",fontSize:12,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                      />
                      <input
                        value={card.cta || ""}
                        onChange={e=>updateAdCard(index, { cta:e.target.value })}
                        placeholder="CTA"
                        style={{ width:"100%",height:34,padding:"0 10px",fontSize:12,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFormat && !isCarouselFormat && (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                  <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Generated Output</h4>
                  {generatedAdText&&(
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      <Btn xs variant="outline" onClick={saveGeneratedAdTemplate}>Save Output</Btn>
                      <Btn xs variant="outline" onClick={copyGeneratedAd}>Copy</Btn>
                    </div>
                  )}
                </div>
                <div style={{ minHeight:180,padding:12,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.5,color:generatedAdText?C.textSub:C.muted }}>
                  {adGenerating ? "Generating..." : generatedAdText || "Your generated ad will appear here."}
                </div>
              </div>
            )}
          </div>

          <div style={{ border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,background:C.surface,display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <div>
                <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Saved Ad Templates</h4>
                <p style={{ margin:"2px 0 0",fontSize:12,color:C.muted }}>Saved generated ads stay in this browser.</p>
              </div>
              {savedAdTemplates.length>0&&(
                <button
                  type="button"
                  onClick={()=>setSavedAdTemplates([])}
                  style={{ border:"none",background:"transparent",color:"#DC2626",fontSize:11,fontWeight:700,cursor:"pointer" }}
                >
                  Clear All
                </button>
              )}
            </div>

            {savedAdTemplates.length===0 ? (
              <p style={{ margin:0,fontSize:12,color:C.muted }}>Nothing saved yet. Generate an ad, then click Save Output.</p>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:260,overflowY:"auto" }}>
                {savedAdTemplates.map((item:any)=>(
                  <div
                    key={item.id}
                    onClick={()=>openSavedAdTemplate(item)}
                    style={{ padding:10,borderRadius:9,background:C.bg,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start" }}
                  >
                    <div style={{ minWidth:0,flex:1 }}>
                      <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4 }}>
                        <span style={{ fontSize:11,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".04em" }}>{item.platformName || "Platform"}</span>
                        <span style={{ fontSize:11,color:C.muted }}>{item.formatName || "Ad Format"}</span>
                        {item.isCarousel&&<span style={{ fontSize:11,color:C.muted }}>10 cards</span>}
                      </div>
                      <p style={{ margin:"0 0 4px",fontSize:12,color:C.textSub,lineHeight:1.35,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
                        {item.text}
                      </p>
                      {item.brief&&<p style={{ margin:0,fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>Brief: {item.brief}</p>}
                    </div>
                    <div style={{ display:"flex",gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={()=>copySavedAdTemplate(item)}
                        style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:C.textSub,cursor:"pointer" }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={()=>deleteSavedAdTemplate(item.id)}
                        style={{ border:"none",background:"#FEF2F2",borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:"#DC2626",cursor:"pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <div>
                <h4 style={{ margin:0,fontSize:12,fontWeight:800,color:C.textSub,textTransform:"uppercase",letterSpacing:".05em" }}>Custom Templates</h4>
                <p style={{ margin:"2px 0 0",fontSize:12,color:C.muted }}>{selectedPlatform?.name || "Platform"} · {selectedFormat?.name || "No format selected"}</p>
              </div>
              <Btn xs variant="outline" onClick={addTemplate} disabled={!selectedFormat}>+ Add Template</Btn>
            </div>

            {!selectedFormat && (
              <div style={{ minHeight:240,borderRadius:10,border:`1.5px dashed ${C.border}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center" }}>
                <p style={{ margin:0,fontSize:13,color:C.muted }}>Select or add an ad format first.</p>
              </div>
            )}

            {selectedFormat && (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {(selectedFormat.templates || []).map((template:any)=>(
                  <div key={template.id} style={{ border:`1.5px solid ${C.border}`,borderRadius:12,padding:12,background:C.bg,display:"flex",flexDirection:"column",gap:10 }}>
                    <Field label="Template Name">
                      <input
                        value={template.name}
                        onChange={e=>updateTemplate(template.id, { name:e.target.value })}
                        placeholder="Template name"
                        style={{ width:"100%",height:40,padding:"0 12px",fontSize:14,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none" }}
                      />
                    </Field>

                    <Field label="Template">
                      <textarea
                        value={template.body}
                        onChange={e=>updateTemplate(template.id, { body:e.target.value })}
                        placeholder="Write your custom ad template here..."
                        rows={7}
                        style={{ width:"100%",padding:"12px 14px",fontSize:13,lineHeight:1.5,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
                      />
                    </Field>

                    <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                      <Btn xs variant="outline" onClick={()=>copyTemplate(template)}>Copy</Btn>
                      <Btn xs variant="outline" onClick={()=>duplicateTemplate(template)}>Duplicate</Btn>
                      <Btn xs variant="danger" onClick={()=>deleteTemplate(template.id)}>Delete</Btn>
                    </div>
                  </div>
                ))}

                {(!selectedFormat.templates || selectedFormat.templates.length===0) && (
                  <div style={{ minHeight:220,borderRadius:10,border:`1.5px dashed ${C.border}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center" }}>
                    <p style={{ margin:0,fontSize:13,color:C.muted }}>No templates yet. Add a custom template for this ad format.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1100px){
          div[style*="grid-template-columns: 220px 300px minmax(0, 1fr)"]{
            grid-template-columns:1fr!important;
          }
        }
      `}</style>
    </div>
  );
};

const AIEngineView = () => {
  const { isMobile } = useBreakpoint();
  const [prompt,setPrompt] = useState("");
  const [size,setSize] = useState("2K");
  const [aspectRatio,setAspectRatio] = useState("3:4");
  const [watermark,setWatermark] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [result,setResult] = useState<any>(null);
  const [savedOutputs,setSavedOutputs] = useState<any[]>([]);
  const [savedOutputsHydrated,setSavedOutputsHydrated] = useState(false);
  const [referenceImages,setReferenceImages] = useState<any[]>([]);
  const outputCount = 1;
  const [previewOutput,setPreviewOutput] = useState<any>(null);
  const [aiPage,setAiPage] = useState("image");

  useEffect(()=>{
    try {
      const raw = localStorage.getItem("emdc_ai_saved_outputs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedOutputs(parsed);
      }
    } catch {}
    setSavedOutputsHydrated(true);
  },[]);

  useEffect(()=>{
    if (!savedOutputsHydrated) return;
    try {
      localStorage.setItem("emdc_ai_saved_outputs", JSON.stringify(savedOutputs));
    } catch {}
  },[savedOutputs,savedOutputsHydrated]);

  const generatedUrls = useMemo(()=>{
    const list:any[] = [];
    const add = (v:any) => {
      if (!v) return;
      if (typeof v === "string") list.push(v);
      else if (typeof v?.url === "string") list.push(v.url);
      else if (typeof v?.image_url === "string") list.push(v.image_url);
    };
    if (Array.isArray(result?.data)) result.data.forEach(add);
    if (Array.isArray(result?.images)) result.images.forEach(add);
    if (Array.isArray(result?.output)) result.output.forEach(add);
    add(result?.url);
    return [...new Set(list.filter(Boolean))];
  },[result]);

  const ratioOptions = [
    { value:"16:9", label:"16:9" },
    { value:"4:3", label:"4:3" },
    { value:"1:1", label:"1:1" },
    { value:"3:4", label:"3:4" },
    { value:"9:16", label:"9:16" },
  ];

  const imageUrl = generatedUrls[0] || "";

  const compressReferenceImage = (file: File) => new Promise<any>((resolve,reject)=>{
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        resolve({
          id:uid(),
          name:file.name,
          size:file.size,
          type:"image/jpeg",
          originalSize:file.size,
          compressedBytes:Math.round((dataUrl.length * 3) / 4),
          dataUrl,
        });
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });

  const handleReferenceUpload = async (files: FileList|null) => {
    if (!files?.length) return;
    setError("");
    try {
      const validFiles = Array.from(files).filter(file=>file.type.startsWith("image/"));
      const compressed = await Promise.all(validFiles.map(file=>compressReferenceImage(file)));
      setReferenceImages(p=>[...p,...compressed].slice(0,6));
    } catch (err:any) {
      setError(err?.message || "Could not prepare reference image.");
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const references = referenceImages.map(img=>img.dataUrl).filter(Boolean);
      const res = await fetch("/api/ai/generate-image", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          prompt:prompt.trim(),
          size,
          watermark,
          aspectRatio,
          referenceImages:references,
          outputCount,
        }),
      });

      const raw = await res.text();
      let data:any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        const clean = raw || "Generation request failed.";
        throw new Error(clean.length > 180 ? clean.slice(0,180) + "..." : clean);
      }

      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : data?.error?.message || data?.message || "Image generation failed.";
        throw new Error(msg);
      }

      setResult(data);
    } catch (err:any) {
      setError(err?.message || "Image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (url:string, name="emdc-generated-image.png") => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const saveOutput = (url:string) => {
    if (!url) return;
    if (savedOutputs.some(o=>o.url===url)) return;
    const saved = {
      id:uid(),
      prompt:prompt.trim(),
      size,
      aspectRatio,
      watermark,
      url,
      createdAt:new Date().toISOString(),
    };
    setSavedOutputs(p=>[saved,...p]);
  };

  const saveAllOutputs = () => {
    generatedUrls.forEach(url=>saveOutput(url));
  };

  const deleteGeneratedOutput = (targetUrl:string) => {
    setPreviewOutput((prev:any)=>prev?.url === targetUrl ? null : prev);
    setResult((prev:any)=>{
      if (!prev) return prev;

      const cleanEntry = (entry:any) => {
        if (!entry) return false;
        if (typeof entry === "string") return entry !== targetUrl;
        if (typeof entry?.url === "string") return entry.url !== targetUrl;
        if (typeof entry?.image_url === "string") return entry.image_url !== targetUrl;
        return true;
      };

      const next = { ...prev };

      if (Array.isArray(next.data)) next.data = next.data.filter(cleanEntry);
      if (Array.isArray(next.images)) next.images = next.images.filter(cleanEntry);
      if (Array.isArray(next.output)) next.output = next.output.filter(cleanEntry);
      if (next.url === targetUrl) next.url = "";

      const hasAny =
        (Array.isArray(next.data) && next.data.length > 0) ||
        (Array.isArray(next.images) && next.images.length > 0) ||
        (Array.isArray(next.output) && next.output.length > 0) ||
        !!next.url;

      return hasAny ? next : null;
    });
  };

  const promptExamples = [
    "Hyper-realistic product lifestyle image of a premium insulated tumbler on a clean modern desk, soft morning sunlight, minimal props, elegant commercial photography, 4k detail.",
    "Modern Filipino home kitchen scene featuring a premium lunch box as the hero product, clean countertop, warm natural light, realistic textures, commercial product ad style.",
    "Luxury glassware collection on a black stone bar counter at midnight, crisp reflections, realistic transparent glass, cinematic lighting, premium lifestyle product photography.",
  ];

  const togglePill = (active:boolean) => ({
    height:42,
    borderRadius:12,
    border:`1px solid ${active ? C.accent : C.border}`,
    background:active ? C.accent : C.surface,
    color:active ? '#fff' : C.textSub,
    fontSize:13,
    fontWeight:800,
    cursor:'pointer' as const,
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:isMobile?"grid":"flex",gridTemplateColumns:isMobile?"repeat(3,minmax(0,1fr))":undefined,gap:10,flexWrap:"wrap",justifyContent:"flex-start",width:"100%" }}>
        <button
          type="button"
          onClick={()=>setAiPage("image")}
          style={{ height:42,padding:isMobile?"0 8px":"0 16px",borderRadius:10,border:`1.5px solid ${aiPage==="image" ? C.accent : C.border}`,background:aiPage==="image" ? C.accent : C.surface,color:aiPage==="image" ? "#fff" : C.textSub,fontSize:isMobile?11:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap" }}
        >
          Image Generation
        </button>
        <button
          type="button"
          onClick={()=>setAiPage("text")}
          style={{ height:42,padding:isMobile?"0 8px":"0 16px",borderRadius:10,border:`1.5px solid ${aiPage==="text" ? C.accent : C.border}`,background:aiPage==="text" ? C.accent : C.surface,color:aiPage==="text" ? "#fff" : C.textSub,fontSize:isMobile?11:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap" }}
        >
          Text Generation
        </button>
        <button
          type="button"
          onClick={()=>setAiPage("ads")}
          style={{ height:42,padding:isMobile?"0 8px":"0 16px",borderRadius:10,border:`1.5px solid ${aiPage==="ads" ? C.accent : C.border}`,background:aiPage==="ads" ? C.accent : C.surface,color:aiPage==="ads" ? "#fff" : C.textSub,fontSize:isMobile?11:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap" }}
        >
          Ad Templates
        </button>
      </div>

      {aiPage==="image" && (
      <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"minmax(0,1fr) minmax(320px,420px)",gap:16,alignItems:"start",width:"100%" }}>
      <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?14:20,maxWidth:"100%",overflow:"hidden" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:18,flexWrap:"wrap" }}>
          <div>
            <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:800,color:C.text }}>Image Generator</h3>
            <p style={{ margin:0,fontSize:13,color:C.muted }}>Generate product images using BytePlus Seedream 4.5.</p>
          </div>
          <Tag color="#8B5CF6">Seedream 4.5</Tag>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8 }}>
            <button type="button" style={togglePill(true)}>Image</button>
            <button type="button" disabled style={{ ...togglePill(false), opacity:.5, cursor:'not-allowed' }}>Video</button>
          </div>

          <Field label="Output Ratio">
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:isMobile?5:8 }}>
              {ratioOptions.map(r=>(
                <button key={r.value} type="button" onClick={()=>setAspectRatio(r.value)} style={{ ...togglePill(aspectRatio===r.value), padding:'6px 4px' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={e=>setPrompt(e.target.value)}
              placeholder="Describe the product image you want to generate..."
              rows={8}
              style={{ width:"100%",padding:"12px 14px",fontSize:14,lineHeight:1.55,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box" }}
              onFocus={e=>e.currentTarget.style.borderColor=C.accent}
              onBlur={e=>e.currentTarget.style.borderColor=C.border}
            />
          </Field>

          <Field label="Reference Images" hint="temporary only, not saved">
            <div style={{ border:`1.5px dashed ${C.borderStrong}`,borderRadius:10,padding:14,background:C.bg }}>
              <input
                id="emdc-ref-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={e=>{ handleReferenceUpload(e.target.files); e.currentTarget.value=""; }}
                style={{ display:"none" }}
              />
              <label htmlFor="emdc-ref-upload"
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,height:42,borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,cursor:"pointer",fontSize:13,fontWeight:700,color:C.textSub }}>
                + Upload Reference Image
              </label>
              <p style={{ margin:"8px 0 0",fontSize:11,color:C.muted }}>
                References are compressed before sending, used only for the generation request, and are not stored in Saved Outputs.
              </p>

              {referenceImages.length>0&&(
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8,marginTop:12 }}>
                  {referenceImages.map(img=>(
                    <div key={img.id} style={{ position:"relative",borderRadius:9,overflow:"hidden",border:`1px solid ${C.border}`,background:C.surface }}>
                      <img src={img.dataUrl} alt={img.name} style={{ width:"100%",height:82,objectFit:"cover",display:"block" }} />
                      <button onClick={()=>setReferenceImages(p=>p.filter(x=>x.id!==img.id))}
                        style={{ position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.9)",color:"#DC2626",fontSize:14,fontWeight:800,cursor:"pointer" }}>
                        ×
                      </button>
                      <div style={{ padding:"5px 6px",fontSize:10,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{img.name}</div>
                      {img.compressedBytes&&<div style={{ padding:"0 6px 5px",fontSize:9,color:C.faint }}>{Math.max(1,Math.round(img.compressedBytes/1024))} KB</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"repeat(2,minmax(0,1fr))",gap:12 }}>
            <Field label="Size">
              <Select value={size} onChange={setSize}>
                <option value="1K">1K</option>
                <option value="2K">2K</option>
              </Select>
            </Field>
            <Field label="Watermark">
              <button type="button" onClick={()=>setWatermark(v=>!v)}
                style={{ height:38,borderRadius:8,border:`1.5px solid ${watermark?C.accent:C.border}`,background:watermark?C.accent:C.surface,color:watermark?"#fff":C.textSub,fontSize:13,fontWeight:700,cursor:"pointer" }}>
                {watermark ? "On" : "Off"}
              </button>
            </Field>
          </div>

          {error&&(
            <div style={{ padding:"10px 12px",borderRadius:9,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:13,fontWeight:600 }}>
              {error}
            </div>
          )}

          <Btn full onClick={generateImage} disabled={loading||!prompt.trim()}>
            {loading ? "Generating Image..." : "Generate Image"}
          </Btn>

          <p style={{ margin:"-4px 0 0",fontSize:11,color:C.muted }}>
            Generated images are not saved automatically. Use <b>Save Output</b> only when you want to keep a result in this browser.
          </p>
          <p style={{ margin:"-6px 0 0",fontSize:11,color:C.muted }}>
            Use <b>Regenerate</b> to create a fresh result using the same prompt, same reference images, and the same current settings. Output count is fixed to 1 for now.
          </p>
          <p style={{ margin:"-6px 0 0",fontSize:11,color:C.muted }}>
            Generation keeps running while you switch to other EMDC tabs, as long as you stay on this same browser session.
          </p>

          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {promptExamples.map((p,i)=>(
              <button key={i} onClick={()=>setPrompt(p)}
                style={{ padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surfaceAlt,color:C.textSub,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                Use sample {i+1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?14:16,minHeight:isMobile?240:320,maxWidth:"100%",overflow:"hidden" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:12 }}>
            <h4 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Result</h4>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              {result && !loading && (
                <Btn sm variant="outline" onClick={generateImage}>Regenerate</Btn>
              )}
            </div>
          </div>

          {loading&&(
            <div style={{ height:260,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,background:C.surfaceAlt,border:`1px dashed ${C.border}` }}>
              <span style={{ fontSize:13,fontWeight:700,color:C.muted }}>Generating...</span>
            </div>
          )}

          {!loading&&generatedUrls.length>0&&(
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {generatedUrls.map((url,i)=>{
                const isSaved = savedOutputs.some(o=>o.url===url);
                return (
                  <div key={url} style={{ display:"flex",flexDirection:"column",gap:10,padding:8,borderRadius:12,border:`1px solid ${C.border}`,background:C.bg }}>
                    <img onClick={()=>setPreviewOutput({ id:"current-"+i, url, prompt:prompt.trim(), size, aspectRatio, watermark })}
                      src={url} alt={`Generated image ${i+1}`} style={{ width:"100%",borderRadius:9,border:`1px solid ${C.border}`,display:"block",cursor:"zoom-in" }} />
                    <div style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr)":"repeat(3,minmax(0,1fr))",gap:8 }}>
                      <Btn sm variant="outline" onClick={()=>downloadImage(url, `emdc-image-${Date.now()}-${i+1}.png`)}>Download</Btn>
                      <Btn sm onClick={()=>saveOutput(url)} disabled={isSaved}>{isSaved ? "Saved" : "Save Output"}</Btn>
                      <button
                        type="button"
                        onClick={()=>deleteGeneratedOutput(url)}
                        style={{ height:32,borderRadius:8,border:"1px solid #FECACA",background:"#FEF2F2",color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading&&generatedUrls.length===0&&(
            <div style={{ height:260,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",borderRadius:10,background:C.surfaceAlt,border:`1px dashed ${C.border}`,padding:20 }}>
              <div>
                <div style={{ fontSize:28,marginBottom:8,opacity:.5 }}>✦</div>
                <p style={{ margin:"0 0 4px",fontSize:14,fontWeight:700,color:C.textSub }}>No image yet</p>
                <p style={{ margin:0,fontSize:12,color:C.muted }}>Enter a prompt and generate your first image.</p>
              </div>
            </div>
          )}

          {!loading&&result&&generatedUrls.length===0&&(
            <pre style={{ margin:"12px 0 0",padding:12,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,fontSize:11,color:C.textSub,overflow:"auto",maxHeight:180 }}>
              {JSON.stringify(result,null,2)}
            </pre>
          )}
        </div>

        <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:isMobile?14:16,maxWidth:"100%",overflow:"hidden" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:12 }}>
            <h4 style={{ margin:0,fontSize:13,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Saved Outputs</h4>
            {savedOutputs.length>0&&<button onClick={()=>setSavedOutputs([])} style={{ border:"none",background:"transparent",color:"#DC2626",fontSize:11,fontWeight:700,cursor:"pointer" }}>Clear All</button>}
          </div>
          {savedOutputs.length===0&&<p style={{ margin:0,fontSize:12,color:C.muted }}>Nothing saved yet. Generated images only appear here after clicking Save Output.</p>}
          {savedOutputs.length>0&&<p style={{ margin:"0 0 10px",fontSize:11,color:C.muted }}>Click a saved output to preview. Saved in this browser only.</p>}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {savedOutputs.map(h=>(
              <div key={h.id} onClick={()=>setPreviewOutput(h)} style={{ display:"flex",gap:10,alignItems:"center",padding:8,borderRadius:9,background:C.surfaceAlt,cursor:"pointer" }}>
                <img src={h.url} alt="" style={{ width:54,height:54,objectFit:"cover",borderRadius:7,border:`1px solid ${C.border}`,flexShrink:0 }} />
                <div style={{ minWidth:0,flex:1 }}>
                  <p style={{ margin:"0 0 2px",fontSize:12,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.prompt}</p>
                  <p style={{ margin:0,fontSize:11,color:C.muted }}>{h.aspectRatio || '—'} · {h.size} · {h.watermark?"Watermark on":"Watermark off"}</p>
                </div>
                <div style={{ display:"flex",gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>downloadImage(h.url, `emdc-saved-${h.id}.png`)} style={{ border:`1px solid ${C.border}`,background:C.surface,borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:C.textSub,cursor:"pointer" }}>Download</button>
                  <button onClick={()=>setSavedOutputs(p=>p.filter(x=>x.id!==h.id))} style={{ border:"none",background:"#FEF2F2",borderRadius:6,padding:"5px 7px",fontSize:10,fontWeight:700,color:"#DC2626",cursor:"pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>
      )}

      {aiPage==="text" && (
        <AITextGenerator />
      )}

      {aiPage==="ads" && (
        <AIAdTemplates />
      )}

      <Modal open={!!previewOutput} onClose={()=>setPreviewOutput(null)} title="Output Preview" width={820}>
        {previewOutput&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <img src={previewOutput.url} alt="Saved output preview" style={{ width:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg }} />
            <div style={{ padding:12,borderRadius:10,background:C.surfaceAlt,display:'grid',gap:8 }}>
              <div>
                <p style={{ margin:"0 0 6px",fontSize:12,fontWeight:800,color:C.text,textTransform:"uppercase",letterSpacing:".05em" }}>Prompt</p>
                <p style={{ margin:0,fontSize:13,color:C.textSub,lineHeight:1.45 }}>{previewOutput.prompt || "No prompt saved."}</p>
              </div>
              <p style={{ margin:0,fontSize:11,color:C.muted }}>Ratio: {previewOutput.aspectRatio || aspectRatio} · Size: {previewOutput.size || size} · {previewOutput.watermark ? 'Watermark on' : 'Watermark off'}</p>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
              <Btn variant="outline" onClick={()=>window.open(previewOutput.url,"_blank","noopener,noreferrer")}>Open in New Tab</Btn>
              <Btn onClick={()=>downloadImage(previewOutput.url, `emdc-output-${previewOutput.id||Date.now()}.png`)}>Download</Btn>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @media(max-width:1023px){
          div[style*="grid-template-columns: minmax(0, 1fr) minmax(320px, 420px)"]{
            grid-template-columns:1fr!important;
          }
        }
      `}</style>
    </div>
  );
};

// ─── APP SHELL ───────────────────────────────────────────────────────────────
const TABS = [
  { id:"calendar",   label:"Calendar"         },
  { id:"events",     label:"Events & Seasons" },
  { id:"checklists", label:"Checklists"       },
  { id:"skus",       label:"SKU Storage"      },
  { id:"ai",         label:"AI Engine"        },
];
const TAB_ICONS = { calendar:"📅", events:"🗓", checklists:"✓", skus:"📦", ai:"✦" };
const TAB_SHORT = { calendar:"Calendar", events:"Events", checklists:"Checklists", skus:"SKUs", ai:"AI" };

export default function App({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (patch: Record<string, unknown>) => void;
}) {
  const { isMobile } = useBreakpoint();
  const [tab,setTab] = useState("calendar");
  const [brands,setBrands]     = useState<any[]>(initialData?.skuBrands ?? INITIAL_BRANDS);
  const [skuStorage,setSkuStorage] = useState<any[]>(initialData?.skuItems ?? []);
  const [navigateToGroupId,setNavigateToGroupId]   = useState(null);

  // Lifted checklist state — owned by App so it survives switching away from and back to the Checklists tab
  const [checklistGroups,setChecklistGroups] = useState<any[]>(initialData?.checklistGroups ?? []);
  const [checklistAllItems,setChecklistAllItems] = useState<Record<string,any>>(initialData?.checklistItems ?? {});
  const [checklistStatuses,setChecklistStatuses] = useState<any[]>(initialData?.checklistStatuses ?? DEFAULT_STATUSES);

  const checklistCalEvents = useMemo(()=>
    (checklistGroups || []).filter((g:any)=>g.deadline).map((g:any)=>({
      id:"cl-"+g.id,
      date:g.deadline,
      ...(g.deadlineEnd ? { dateEnd:g.deadlineEnd } : {}),
      title:g.groupName + (g.deadlineEnd ? " - Date Range" : " - Deadline"),
      type:"deadline",
      color:"#8B5CF6",
      fromChecklist:true,
      groupId:g.id,
    })),
    [checklistGroups]
  );

  // Lifted calendar state — owned by App so it survives switching away from and back to the Calendar tab
  const DEFAULT_MANUAL_EVENTS = useMemo(()=>[
    { id:uid(), date:`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`, title:"TikTok Production - Quencha Poply", type:"task", color:"#374151" },
    { id:uid(), date:`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(Math.min(today.getDate()+4,28))}`, title:"11.11 Campaign Go-Live", type:"launch", color:"#22C55E" },
    { id:uid(), date:`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(Math.min(today.getDate()+1,28))}`, title:"Shopee Flash Deal Deadline", type:"deadline", color:"#EF4444" },
  ],[]);
  const [calendarManualEvents,setCalendarManualEvents] = useState<any[]>(initialData?.calendarEvents?.length ? initialData.calendarEvents : DEFAULT_MANUAL_EVENTS);
  const [calendarEventTypes,setCalendarEventTypes] = useState<any[]>(initialData?.calendarTypes?.length ? initialData.calendarTypes : DEFAULT_EVENT_TYPES);

  // Lifted seasonal events state (Events & Seasons tab) — owned by App so edits survive tab switches
  const [seasonalEvents,setSeasonalEvents] = useState<any[]>(initialData?.seasonalEvents?.length ? initialData.seasonalEvents : INITIAL_SEASONAL);

  const seasonalCalEvents = useMemo(()=>
    (seasonalEvents || []).filter((e:any)=>e.calDate).map((e:any)=>({
      id:"sea-"+e.id,
      date:e.calDate,
      // Pass dateEnd for multi-day/multi-month seasonal ranges
      ...(e.calDateEnd ? { dateEnd:e.calDateEnd } : {}),
      title:e.name,
      // Map seasonal type to closest DEFAULT_EVENT_TYPES id for filter
      type: e.type==="holiday" ? "holiday" : e.type==="campaign" ? "campaign" : "task",
      seasonalType:e.type,
      color:e.color,
      fromSeasonal:true,
      sourceEventId:e.id,
      phaseoutCount:(e.products||[]).filter(isPhaseoutProduct).length,
    })),
    [seasonalEvents]
  );

  const [appStateHydrated,setAppStateHydrated] = useState(false);
  const [cloudHydrated,setCloudHydrated] = useState(false);
  const [cloudSyncStatus,setCloudSyncStatus] = useState("Local");
  const [localSyncTick,setLocalSyncTick] = useState(0);
  const cloudLastUpdatedAtRef = useRef("");
  const cloudApplyingRef = useRef(false);
  const cloudSaveTimerRef = useRef<any>(null);
  const cloudClientIdRef = useRef("");

  const EMDC_SYNC_LOCAL_KEYS = [
    "emdc_app_state_v1",
    "emdc_ai_saved_outputs",
    "emdc_text_output_types_v1",
    "emdc_text_saved_outputs_v1",
    "emdc_ad_template_platforms_v1",
    "emdc_saved_ad_templates_v1",
    "emdc_checklist_launch_types_v1",
    "emdc_checklist_templates_v1",
  ];

  const makeAppStatePayload = () => ({
    skuBrands: brands,
    skuItems: skuStorage,
    checklistGroups,
    checklistItems: checklistAllItems,
    checklistStatuses,
    calendarEvents: calendarManualEvents,
    calendarTypes: calendarEventTypes,
    seasonalEvents,
  });

  const readLocalSnapshot = () => {
    const snapshot:any = {};
    try {
      EMDC_SYNC_LOCAL_KEYS.forEach(key=>{
        const value = localStorage.getItem(key);
        if (value !== null) snapshot[key] = value;
      });
    } catch {}
    return snapshot;
  };

  const writeLocalSnapshot = (snapshot:any) => {
    if (!snapshot || typeof snapshot !== "object") return;
    try {
      Object.entries(snapshot).forEach(([key,value]:any)=>{
        if (EMDC_SYNC_LOCAL_KEYS.includes(key) && typeof value === "string") {
          localStorage.setItem(key, value);
        }
      });
    } catch {}
  };

  const applyAppState = (parsed:any) => {
    if (!parsed || typeof parsed !== "object") return;
    if (Array.isArray(parsed?.skuBrands)) setBrands(parsed.skuBrands);
    if (Array.isArray(parsed?.skuItems)) setSkuStorage(parsed.skuItems);
    if (Array.isArray(parsed?.checklistGroups)) setChecklistGroups(parsed.checklistGroups);
    if (parsed?.checklistItems && typeof parsed.checklistItems === "object") setChecklistAllItems(parsed.checklistItems);
    if (Array.isArray(parsed?.checklistStatuses)) setChecklistStatuses(parsed.checklistStatuses);
    if (Array.isArray(parsed?.calendarEvents)) setCalendarManualEvents(parsed.calendarEvents);
    if (Array.isArray(parsed?.calendarTypes)) setCalendarEventTypes(parsed.calendarTypes);
    if (Array.isArray(parsed?.seasonalEvents)) setSeasonalEvents(parsed.seasonalEvents);
  };

  const applyCloudState = (cloud:any) => {
    if (!cloud || typeof cloud !== "object") return;
    cloudApplyingRef.current = true;
    try {
      writeLocalSnapshot(cloud.localStorage || {});
      applyAppState(cloud.appState || cloud);
      if (cloud.updatedAt) cloudLastUpdatedAtRef.current = cloud.updatedAt;
      setCloudSyncStatus("Synced");
    } finally {
      setTimeout(()=>{ cloudApplyingRef.current = false; }, 350);
    }
  };

  const fetchCloudState = async (mode:"initial"|"poll"="poll") => {
    try {
      const res = await fetch("/api/emdc-state", { cache:"no-store" });
      if (!res.ok) throw new Error("Cloud sync unavailable");
      const payload = await res.json();
      const cloud = payload?.data;
      if (cloud?.updatedAt && cloud.updatedAt !== cloudLastUpdatedAtRef.current) {
        applyCloudState(cloud);
      }
      if (mode==="initial") setCloudSyncStatus(cloud ? "Synced" : "Ready");
      return cloud;
    } catch {
      if (mode==="initial") setCloudSyncStatus("Local fallback");
      return null;
    }
  };

  const saveCloudState = async () => {
    if (!appStateHydrated || !cloudHydrated || cloudApplyingRef.current) return;

    const updatedAt = new Date().toISOString();
    const payload = {
      version: 1,
      clientId: cloudClientIdRef.current,
      updatedAt,
      appState: makeAppStatePayload(),
      localStorage: readLocalSnapshot(),
    };

    try {
      setCloudSyncStatus("Saving...");
      const res = await fetch("/api/emdc-state", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json().catch(()=>({}));
      cloudLastUpdatedAtRef.current = data?.data?.updatedAt || updatedAt;
      setCloudSyncStatus("Synced");
    } catch {
      setCloudSyncStatus("Sync save failed");
    }
  };

  useEffect(() => {
    try {
      let clientId = localStorage.getItem("emdc_cloud_client_id");
      if (!clientId) {
        clientId = uid();
        localStorage.setItem("emdc_cloud_client_id", clientId);
      }
      cloudClientIdRef.current = clientId;

      const raw = localStorage.getItem("emdc_app_state_v1");
      if (raw) applyAppState(JSON.parse(raw));
    } catch {}

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
    const timer = setInterval(()=>fetchCloudState("poll"), 3000);
    return () => clearInterval(timer);
  }, [cloudHydrated]);

  useEffect(() => {
    const fn = () => setLocalSyncTick(v=>v+1);
    window.addEventListener("emdc-local-sync", fn);
    return () => window.removeEventListener("emdc-local-sync", fn);
  }, []);

  useEffect(() => {
    if (!appStateHydrated) return;
    try {
      localStorage.setItem("emdc_app_state_v1", JSON.stringify(makeAppStatePayload()));
    } catch {}
  }, [
    appStateHydrated,
    brands,
    skuStorage,
    checklistGroups,
    checklistAllItems,
    checklistStatuses,
    calendarManualEvents,
    calendarEventTypes,
    seasonalEvents,
  ]);

  useEffect(() => {
    if (!appStateHydrated || !cloudHydrated || cloudApplyingRef.current) return;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(()=>saveCloudState(), 600);
    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [
    appStateHydrated,
    cloudHydrated,
    localSyncTick,
    brands,
    skuStorage,
    checklistGroups,
    checklistAllItems,
    checklistStatuses,
    calendarManualEvents,
    calendarEventTypes,
    seasonalEvents,
  ]);

  useEffect(() => { if (onStateChange) onStateChange({ skuBrands: brands }); }, [brands]);
  useEffect(() => { if (onStateChange) onStateChange({ skuItems: skuStorage }); }, [skuStorage]);
  useEffect(() => { if (onStateChange) onStateChange({ seasonalEvents }); }, [seasonalEvents]);

  const handleGroupCreated = (_g:any)=>{
    // Calendar checklist events are derived from checklistGroups,
    // so new and edited group dates reflect on the Calendar automatically.
  };
  const handleNavigateToGroup = target=>{
    // target can be a groupId string OR "events" to go to Events & Seasons tab
    if(target==="events"){
      setTab("events");
    } else {
      setTab("checklists");
      setNavigateToGroupId(target);
    }
  };
  const allCalExtra = useMemo(()=>[...seasonalCalEvents,...checklistCalEvents],[seasonalCalEvents,checklistCalEvents]);
  const pageMaxWidth = !isMobile && tab==="calendar" ? 1760 : 1280;
  const pagePadding = isMobile ? "16px 16px 90px" : tab==="calendar" ? "28px 32px" : "28px 28px";

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",background:C.bg,fontFamily:C.font,color:C.text }}>
        {/* ── Top nav ─────────────────────────────────────────────────────── */}
        <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100 }}>
          <div style={{ maxWidth:1280,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52 }}>
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
                {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"0 16px",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?C.text:C.muted,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",transition:"color .15s",letterSpacing:"-.01em",whiteSpace:"nowrap" }}>{t.label}</button>))}
              </nav>
            )}
            <span style={{ fontSize:11,color:C.faint,fontVariantNumeric:"tabular-nums" }}>{today.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</span>
          </div>
        </div>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth:pageMaxWidth,margin:"0 auto",padding:pagePadding }}>
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
          {tab==="calendar"   && <CalendarView extraEvents={allCalExtra} seasonalEvents={seasonalEvents} setSeasonalEvents={setSeasonalEvents} brands={brands} onNavigateToGroup={handleNavigateToGroup} onStateChange={onStateChange} manualEvents={calendarManualEvents} setManualEvents={setCalendarManualEvents} eventTypes={calendarEventTypes} setEventTypes={setCalendarEventTypes} />}
          {tab==="events"     && <EventsView skuStorage={skuStorage} brands={brands} onStateChange={onStateChange} events={seasonalEvents} setEvents={setSeasonalEvents} />}
          {tab==="checklists" && <ChecklistView onGroupCreated={handleGroupCreated} skuStorage={skuStorage} brands={brands} seasonalEvents={seasonalEvents} setSeasonalEvents={setSeasonalEvents} navigateToGroupId={navigateToGroupId} onGroupNavigated={()=>setNavigateToGroupId(null)} onStateChange={onStateChange} groups={checklistGroups} setGroups={setChecklistGroups} allGroupItems={checklistAllItems} setAllGroupItems={setChecklistAllItems} statuses={checklistStatuses} setStatuses={setChecklistStatuses} />}
          {tab==="skus"       && <SKUStorage brands={brands} setBrands={setBrands} skuStorage={skuStorage} setSkuStorage={setSkuStorage} onStateChange={onStateChange} />}
          <div style={{ display: tab==="ai" ? "block" : "none" }}><AIEngineView /></div>
        </div>

        {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
        {isMobile&&(
          <div style={{ position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
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
