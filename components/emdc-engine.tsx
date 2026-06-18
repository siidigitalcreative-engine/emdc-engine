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

const Select = ({ value, onChange, children, style={} }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{ width:"100%",padding:"9px 12px",fontSize:14,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,outline:"none",cursor:"pointer",...style }}>
    {children}
  </select>
);

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
const SKUPicker = ({ skuStorage, brands, onSelect, placeholder="Search SKU storage..." }) => {
  const [query,setQuery] = useState("");
  const [open,setOpen]   = useState(false);
  const ref = useRef(null);
  const results = useMemo(() => {
    const list = query.trim() ? skuStorage.filter(s => {
      const q=query.toLowerCase();
      return s.productName.toLowerCase().includes(q)||s.sku.toLowerCase().includes(q)||(brands.find(b=>b.id===s.brandId)?.name||"").toLowerCase().includes(q);
    }) : skuStorage;
    return list.slice(0,8);
  }, [query,skuStorage,brands]);

  useEffect(()=>{
    const fn = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[]);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <TI value={query} onChange={v=>{setQuery(v);setOpen(true);}} placeholder={placeholder}
        style={{ paddingLeft:12 }}
      />
      {open&&results.length>0&&(
        <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:400,maxHeight:240,overflowY:"auto" }}>
          {results.map(s=>{ const brand=brands.find(b=>b.id===s.brandId); return (
            <div key={s.id} onMouseDown={()=>{ onSelect(s); setQuery(""); setOpen(false); }}
              className="emdc-row"
              style={{ padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.productName}</div>
                <div style={{ fontSize:11,color:C.muted,display:"flex",gap:8,marginTop:2,alignItems:"center" }}>
                  <span style={{ fontFamily:"monospace",background:C.surfaceAlt,padding:"1px 5px",borderRadius:3 }}>{s.sku}</span>
                  {brand&&<span style={{ display:"flex",alignItems:"center",gap:3 }}><span style={{ width:6,height:6,borderRadius:"50%",background:brand.color,display:"inline-block",flexShrink:0 }}></span>{brand.name}</span>}
                </div>
              </div>
              <span style={{ fontSize:11,fontWeight:600,color:s.inventory===0?"#EF4444":C.faint,flexShrink:0 }}>{s.inventory===0?"No stock":s.inventory+" u"}</span>
            </div>
          );})}
        </div>
      )}
    </div>
  );
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
const CalendarView = ({ extraEvents=[], onNavigateToGroup, onStateChange, manualEvents, setManualEvents, eventTypes, setEventTypes }: any) => {
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
  const [addForm,setAddForm]     = useState({ title:"",type:"task",date:"",color:"#374151" });
  const [dayView,setDayView]     = useState(null); // { date, label }
  const [prevDayView,setPrevDayView] = useState(null); // to go back from detail to day list

  // Helper: look up type color from live eventTypes
  const typeColor = id => eventTypes.find(t=>t.id===id)?.color || "#9CA3AF";
  const typeLabel = id => eventTypes.find(t=>t.id===id)?.label || id;

  const allEvents = useMemo(()=>[...manualEvents,...extraEvents],[manualEvents,extraEvents]);
  const days=getDaysInMonth(year,month), firstDay=getFirstDay(year,month);
  const prevMo=()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1);
  const nextMo=()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1);

  // For each day: point events (single date) + range events (multi-day spanning this date)
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

  // When a type is selected in form, auto-fill color
  const handleFormTypeChange = (f, setF, v) => {
    const t = eventTypes.find(x=>x.id===v);
    setF({...f, type:v, color: t?.color || f.color});
  };

  const EventForm = ({ form, setForm, onSave, saveLabel="Save Event", showDelete, onDelete }: any) => (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
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

  // Cell layout constants — consistent across all rows
  const BAND_H  = 14;   // unified height for ALL event rows (bands + chips same)
  const CHIP_H  = 14;   // same as BAND_H — all events identical height
  const GAP     = 1;    // px gap between rows
  const DATE_H  = 22;   // date number row — consistent on all sizes
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
          {dayLabels.map((d,i)=>(<div key={i} style={{ padding:isMobile?"7px 0":"9px 0",textAlign:"center",fontSize:11,fontWeight:700,color:C.faint,letterSpacing:".04em",textTransform:"uppercase" }}>{d}</div>))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gridAutoRows:"min-content" }}>
          {Array.from({length:firstDay}).map((_,i)=>(<div key={`b${i}`} style={{ minHeight:DATE_H+24,minWidth:0,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:C.bg }} />))}
          {Array.from({length:days}).map((_,i)=>{
            const d=i+1;
            const isToday=year===today.getFullYear()&&month===today.getMonth()&&d===today.getDate();
            const col=(firstDay+i)%7, dateStr=dateKey(year,month,d), dayEv=eventsFor(d);

            const rangeEvs = dayEv.filter(ev=>ev.dateEnd);
            const pointEvs = dayEv.filter(ev=>!ev.dateEnd);

            return (
              <div key={d}
                style={{
                  minHeight:DATE_H+24, minWidth:0, padding:0,
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
                    width:18, height:18, borderRadius:"50%",
                    fontSize:9, fontWeight:isToday?700:400,
                    background:isToday?C.accent:"transparent",
                    color:isToday?"#fff":C.textSub,
                  }}>{d}</span>
                </div>

                {/* Range bands — fixed height per band, flush to cell edges */}
                {rangeEvs.map(ev=>{
                  const rs=getRangeStyle(ev,d), ec=ev.color||"#9CA3AF";
                  return (
                    <div key={ev.id}
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
                        <span style={{ fontSize:8,fontWeight:700,color:ec,paddingLeft:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{ev.title}</span>
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
                      <span style={{ fontSize:8,fontWeight:700,color:ec,paddingLeft:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{ev.title}</span>
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

      {/* Add Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add Event">
        <EventForm form={addForm} setForm={setAddForm} onSave={saveNew} saveLabel="Save Event" />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal&&!!editForm} onClose={()=>{setEditModal(false);setEditForm(null);}} title="Edit Event">
        {editForm&&(
          <EventForm form={editForm} setForm={setEditForm} onSave={saveEdit} saveLabel="Save Changes"
            showDelete onDelete={()=>{ setManualEvents((p:any)=>{ const next=p.filter((e:any)=>e.id!==editForm.id); if(onStateChange) onStateChange({calendarEvents:next}); return next; }); setEditModal(false); setEditForm(null); }} />
        )}
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
  const [evForm,setEvForm] = useState({ name:"",date:"",type:"holiday",color:"#374151",desc:"",calDate:"",calDateEnd:"" });

  const TYPE_COLORS = { holiday:"#374151",seasonal:"#111827",campaign:"#6B7280" };
  const filtered = filter==="all" ? events : events.filter(e=>e.type===filter);
  const updProds = (id:any,fn:any) => setEvents((p:any)=>{ const next=p.map((e:any)=>e.id===id?{...e,products:fn(e.products)}:e); if(onStateChange) onStateChange({seasonalEvents:next}); return next; });

  const EvForm = ({ form, setForm, onSave, onDelete, saveLabel }) => (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <Field label="Event Name"><TI value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Brand Anniversary Sale" /></Field>
      <Field label="Display Date"><TI value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} placeholder="e.g. Oct 15 or Q4" /></Field>
      <Field label="Calendar Date"><DateInput value={form.calDate||""} onChange={v=>setForm(f=>({...f,calDate:v}))} /></Field>
      <Field label="Calendar End Date"><DateInput value={form.calDateEnd||""} onChange={v=>setForm(f=>({...f,calDateEnd:v}))} /></Field>
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

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,340px),1fr))",gap:12 }}>
        {filtered.map(ev=>{
          const isOpen=expanded===ev.id, tc=TYPE_COLORS[ev.type]||C.muted;
          return (
            <div key={ev.id} className="emdc-card" style={{ background:C.surface,borderRadius:12,border:`1.5px solid ${C.border}`,borderLeft:`4px solid ${ev.color||tc}`,overflow:"hidden",transition:"box-shadow .2s" }}>
              <div style={{ padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }} onClick={()=>setExpanded(isOpen?null:ev.id)}>
                <div style={{ minWidth:0,marginRight:8 }}>
                  <p style={{ margin:"0 0 5px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.name}</p>
                  <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                    <Tag color={ev.color||tc} sm>{ev.type}</Tag>
                    <span style={{ fontSize:11,color:C.faint }}>{ev.date}</span>
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
                      {ev.products.map((p,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.bg,borderRadius:8,borderLeft:`2px solid ${ev.color||C.borderStrong}` }}>
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
                      {ev.products.length===0&&<p style={{ fontSize:12,color:C.faint,margin:"4px 0" }}>No products added yet.</p>}
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

      <Modal open={addEventModal} onClose={()=>setAddEventModal(false)} title="Add Custom Event" width={500}>
        <EvForm form={evForm} setForm={setEvForm} saveLabel="Add Event"
          onSave={()=>{ if(!evForm.name.trim()) return; setEvents((p:any)=>{ const next=[...p,{id:uid(),...evForm,calDate:evForm.calDate||null,calDateEnd:evForm.calDateEnd||null,products:[]}]; if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEvForm({name:"",date:"",type:"holiday",color:"#374151",desc:"",calDate:"",calDateEnd:""}); setAddEventModal(false); }} />
      </Modal>
      <Modal open={editEvModal&&!!editEvForm} onClose={()=>{setEditEvModal(false);setEditEvForm(null);}} title="Edit Event" width={500}>
        {editEvForm&&<EvForm form={editEvForm} setForm={setEditEvForm} saveLabel="Save Changes"
          onSave={()=>{ setEvents((p:any)=>{ const next=p.map((e:any)=>e.id===editEvForm.id?editEvForm:e); if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEditEvModal(false); setEditEvForm(null); }}
          onDelete={()=>{ setEvents((p:any)=>{ const next=p.filter((e:any)=>e.id!==editEvForm.id); if(onStateChange) onStateChange({seasonalEvents:next}); return next; }); setEditEvModal(false); setEditEvForm(null); }} />}
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
const ChecklistBoard = ({ group, onBack, skuStorage, brands, templates, onStateChange, initialItems, onItemsChange, statuses, setStatuses, onUpdateGroup }: any) => {
  const { isMobile } = useBreakpoint();
  const saveStatuses = (s:any[]) => { setStatuses(s); };
  const [statusModal,setStatusModal] = useState(false);
  const [groupEditModal,setGroupEditModal] = useState(false);
  const [items,setItems] = useState(()=>{ if(initialItems) return initialItems; const out:any={}; Object.keys(DEPTS).forEach(dept=>{ out[dept]=(templates[group.launchType][dept]||[]).map((t:string)=>({id:uid(),text:t,done:false,link:"",note:"",assignee:"",statusId:""})); }); return out; });
  const [newText,setNewText]         = useState({ecommerce:"",marketing:"",digital:""});
  const [activeDept,setActiveDept]   = useState("all");
  const [skuPickDept,setSkuPickDept] = useState(null);
  const upd    = (dept:string,item:any) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].map((i:any)=>i.id===item.id?item:i)}; if(onItemsChange) onItemsChange(next); return next; });
  const del    = (dept:string,id:string) => setItems((p:any)=>{ const next={...p,[dept]:p[dept].filter((i:any)=>i.id!==id)}; if(onItemsChange) onItemsChange(next); return next; });
  const addItem= (dept:string)=>{ if(!newText[dept].trim()) return; setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text:newText[dept],done:false,link:"",note:"",assignee:"",statusId:""}]}; if(onItemsChange) onItemsChange(next); return next; }); setNewText((p:any)=>({...p,[dept]:""})); };
  const addFromSKU=(dept,s)=>{ const b=brands.find(x=>x.id===s.brandId); const text=[b?.name,s.productName,s.sku].filter(Boolean).join(" - "); setItems((p:any)=>{ const next={...p,[dept]:[...p[dept],{id:uid(),text,done:false,link:"",note:"",assignee:"",statusId:""}]}; if(onItemsChange) onItemsChange(next); return next; }); setSkuPickDept(null); };
  const depts=activeDept==="all"?Object.keys(DEPTS):[activeDept];
  const lt=LAUNCH_TYPES[group.launchType];
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
      <GroupEditModal open={groupEditModal} group={group} onClose={()=>setGroupEditModal(false)} skuStorage={skuStorage} brands={brands}
        onSave={(patch:any)=>{ if(onUpdateGroup) onUpdateGroup(patch); }} />
    </div>
  );
};

// ─── SKU SELECTOR ────────────────────────────────────────────────────────────
const SKUSelector = ({ onNext, skuStorage, brands }) => {
  const [skuMode,setSkuMode]     = useState("manual");
  const [skus,setSkus]           = useState([{id:uid(),value:""}]);
  const [selType,setSelType]     = useState(null);
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
  const [pickedSkus,setPickedSkus] = useState([]);
  const addSku=()=>setSkus(p=>[...p,{id:uid(),value:""}]);
  const remSku=id=>setSkus(p=>p.filter(s=>s.id!==id));
  const updSku=(id,v)=>setSkus(p=>p.map(s=>s.id===id?{...s,value:v}:s));
  const pickSku=s=>{ if(!pickedSkus.find(p=>p.id===s.id)) setPickedSkus(p=>[...p,s]); };
  const finalSkus=skuMode==="storage"?pickedSkus.map(s=>({id:s.id,value:s.sku})):skus.filter(s=>s.value.trim());
  const canNext=finalSkus.length>0&&selType&&groupName.trim();
  return (
    <div>
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
            {skus.map((s,i)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={v=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
            <button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button>
          </Field>
        ):(
          <Field label="Search SKU Storage">
            {skuStorage.length===0
              ? <div style={{ padding:"14px",background:C.surfaceAlt,borderRadius:8,fontSize:12,color:C.muted }}>No SKUs in storage yet. Go to SKU Storage tab first.</div>
              : <>
                  <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickSku} placeholder="Search by product, SKU, or brand..." />
                  {pickedSkus.length>0&&(<div style={{ marginTop:8,display:"flex",flexWrap:"wrap",gap:6 }}>{pickedSkus.map(s=>(<div key={s.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:C.surfaceAlt,borderRadius:6,border:`1px solid ${C.border}` }}><span style={{ fontSize:11,fontFamily:"monospace",fontWeight:600,color:C.text }}>{s.sku}</span><span style={{ fontSize:11,color:C.muted }}>{s.productName}</span><button onClick={()=>setPickedSkus(p=>p.filter(x=>x.id!==s.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:14,lineHeight:1,padding:"0 0 0 2px" }}>&#215;</button></div>))}</div>)}
                </>
            }
          </Field>
        )}
        <Field label="Operational Type">
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {Object.entries(LAUNCH_TYPES).map(([k,v])=>(
              <button key={k} onClick={()=>setSelType(k)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",border:`2px solid ${selType===k?C.accent:C.border}`,background:selType===k?C.surfaceAlt:C.surface,transition:"border-color .15s" }}>
                <div><p style={{ margin:0,fontSize:13,fontWeight:700,color:C.text }}>{v.label}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>{v.tag}</p></div>
                <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${selType===k?C.accent:C.border}`,background:selType===k?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{selType===k&&<span style={{ color:"#fff",fontSize:10 }}>&#10003;</span>}</div>
              </button>
            ))}
          </div>
        </Field>
        <Btn full onClick={()=>onNext({skus:finalSkus,launchType:selType,groupName,deadline,deadlineEnd})} disabled={!canNext}>Generate Checklists &#8250;</Btn>
      </div>
    </div>
  );
};

// ─── GROUP EDIT MODAL ────────────────────────────────────────────────────────
const GroupEditModal = ({ open, group, onClose, onSave, skuStorage, brands }: any) => {
  const [groupName,setGroupName] = useState("");
  const [deadline,setDeadline]   = useState("");
  const [deadlineEnd,setDeadlineEnd] = useState("");
  const [launchType,setLaunchType] = useState("introduction");
  const [skus,setSkus] = useState<any[]>([]);

  useEffect(()=>{
    if(group){
      setGroupName(group.groupName||"");
      setDeadline(group.deadline||"");
      setDeadlineEnd(group.deadlineEnd||"");
      setLaunchType(group.launchType||"introduction");
      setSkus(group.skus?.length ? group.skus : [{id:uid(),value:""}]);
    }
  },[group]);

  const addSku=()=>setSkus((p:any)=>[...p,{id:uid(),value:""}]);
  const remSku=(id:string)=>setSkus((p:any)=>p.filter((s:any)=>s.id!==id));
  const updSku=(id:string,v:string)=>setSkus((p:any)=>p.map((s:any)=>s.id===id?{...s,value:v}:s));
  const pickFromStorage=(s:any)=>{ if(!skus.find((x:any)=>x.value===s.sku)) setSkus((p:any)=>[...p.filter((x:any)=>x.value.trim()),{id:uid(),value:s.sku}]); };
  const finalSkus = skus.filter((s:any)=>s.value.trim());
  const canSave = finalSkus.length>0 && groupName.trim();

  if(!group) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Group" width={520}>
      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
        <Field label="Group Name"><TI value={groupName} onChange={setGroupName} placeholder="e.g. Quencha Horizon Collection Q3" /></Field>
        <Field label="Start Date"><DateInput value={deadline} onChange={setDeadline} /></Field>
        <Field label="End Date"><DateInput value={deadlineEnd} onChange={setDeadlineEnd} /></Field>
        <Field label="Operational Type" hint="(existing checklist items won't change)">
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {Object.entries(LAUNCH_TYPES).map(([k,v]:any)=>(
              <button key={k} onClick={()=>setLaunchType(k)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",border:`2px solid ${launchType===k?C.accent:C.border}`,background:launchType===k?C.surfaceAlt:C.surface,transition:"border-color .15s" }}>
                <div><p style={{ margin:0,fontSize:13,fontWeight:700,color:C.text }}>{v.label}</p><p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>{v.tag}</p></div>
                <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${launchType===k?C.accent:C.border}`,background:launchType===k?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{launchType===k&&<span style={{ color:"#fff",fontSize:10 }}>&#10003;</span>}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="SKU(s)">
          {skus.map((s:any,i:number)=>(<div key={s.id} style={{ display:"flex",gap:8,marginBottom:8 }}><TI value={s.value} onChange={(v:string)=>updSku(s.id,v)} placeholder={`SKU ${i+1}`} style={{ flex:1 }} />{skus.length>1&&<button onClick={()=>remSku(s.id)} style={{ width:40,height:40,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",color:C.faint,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>&#215;</button>}</div>))}
          <button onClick={addSku} style={{ padding:"7px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1.5px dashed ${C.borderStrong}`,background:"transparent",cursor:"pointer",color:C.muted }}>+ Add SKU</button>
        </Field>
        {skuStorage.length>0&&(
          <Field label="Add From SKU Storage">
            <SKUPicker skuStorage={skuStorage} brands={brands} onSelect={pickFromStorage} placeholder="Search by product, SKU, or brand..." />
          </Field>
        )}
        <Btn full onClick={()=>{ onSave({groupName:groupName.trim(),deadline,deadlineEnd,launchType,skus:finalSkus}); onClose(); }} disabled={!canSave}>Save Changes</Btn>
      </div>
    </Modal>
  );
};

// ─── TEMPLATE MANAGER ────────────────────────────────────────────────────────
const TemplateManagerModal = ({ open, onClose, templates, onChange }) => {
  const [launchType,setLaunchType] = useState("introduction");
  const [dept,setDept]             = useState("ecommerce");
  const [editIdx,setEditIdx]       = useState(null);
  const [editText,setEditText]     = useState("");
  const [newText,setNewText]       = useState("");

  const list = templates[launchType]?.[dept] || [];

  const updateList = next => {
    onChange(prev => ({
      ...prev,
      [launchType]: { ...prev[launchType], [dept]: next },
    }));
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
    <Modal open={open} onClose={()=>{onClose();setEditIdx(null);}} title="Manage Checklist Templates" width={560}>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <Field label="Checklist Type">
          <Select value={launchType} onChange={v=>{setLaunchType(v);setEditIdx(null);}}>
            {Object.keys(LAUNCH_TYPES).map(k=><option key={k} value={k}>{LAUNCH_TYPES[k].label}</option>)}
          </Select>
        </Field>
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
                    <button onClick={()=>startEdit(i)} style={{ height:22,padding:"0 7px",borderRadius:5,background:"none",border:`1px solid ${C.border}`,cursor:"pointer",color:C.muted,fontSize:10,fontWeight:600 }}>Edit</button>
                    <button onClick={()=>removeItem(i)} style={{ width:22,height:22,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>&#215;</button>
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
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontSize:11,color:C.faint }}>This only affects new checklist groups created after saving.</span>
          <Btn sm variant="outline" onClick={resetToDefault}>Reset to Default</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── CHECKLIST VIEW ──────────────────────────────────────────────────────────
const ChecklistView = ({ onGroupCreated, skuStorage, brands, navigateToGroupId, onGroupNavigated, onStateChange, groups, setGroups, allGroupItems, setAllGroupItems, statuses, setStatuses }: any) => {
  const [active,setActive]     = useState(null);
  const [creating,setCreating] = useState(false);
  const [editingGroup,setEditingGroup] = useState(null);

  const updateGroupItems = (groupId:string, items:any) => {
    setAllGroupItems((p:any)=>{ const next={...p,[groupId]:items}; if(onStateChange) onStateChange({checklistItems:{[groupId]:items}}); return next; });
  };
  const updateStatuses = (s:any[]) => { setStatuses(s); if(onStateChange) onStateChange({checklistStatuses:s}); };
  const [templates,setTemplates]   = useState(TEMPLATES);
  const [templatesModal,setTemplatesModal] = useState(false);
  const navRef = useRef(null);

  useEffect(()=>{
    if(navigateToGroupId&&navigateToGroupId!==navRef.current){
      navRef.current=navigateToGroupId;
      setActive(navigateToGroupId);
      if(onGroupNavigated) onGroupNavigated();
    }
  },[navigateToGroupId]);

  const createGroup = cfg=>{ const g={id:uid(),...cfg}; setGroups((p:any)=>{ const next=[...p,g]; if(onStateChange) onStateChange({checklistGroups:next}); return next; }); if(onGroupCreated) onGroupCreated(g); setActive(g.id); setCreating(false); };
  const deleteGroup = id=>{ setGroups((p:any)=>{ const next=p.filter((g:any)=>g.id!==id); if(onStateChange) onStateChange({checklistGroups:next, deletedGroupIds:[id]}); return next; }); if(active===id) setActive(null); };
  const updateGroup = (id:string, patch:any) => { setGroups((p:any)=>{ const next=p.map((g:any)=>g.id===id?{...g,...patch}:g); if(onStateChange) onStateChange({checklistGroups:next}); return next; }); };
  const activeGroup = groups.find((g:any)=>g.id===active);

  if(activeGroup) return <ChecklistBoard group={activeGroup} onBack={()=>setActive(null)} skuStorage={skuStorage} brands={brands} templates={templates} onStateChange={onStateChange} initialItems={allGroupItems[activeGroup.id]||null} onItemsChange={(items:any)=>updateGroupItems(activeGroup.id,items)} statuses={statuses} setStatuses={updateStatuses} onUpdateGroup={(patch:any)=>updateGroup(activeGroup.id,patch)} />;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8 }}>
        <p style={{ margin:0,fontSize:13,color:C.muted }}>{groups.length===0?"No checklist groups yet.":`${groups.length} group${groups.length>1?"s":""}`}</p>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="outline" onClick={()=>setTemplatesModal(true)}>Manage Templates</Btn>
          {!creating&&<Btn onClick={()=>setCreating(true)}>+ New Group</Btn>}
        </div>
      </div>

      <TemplateManagerModal open={templatesModal} onClose={()=>setTemplatesModal(false)} templates={templates} onChange={setTemplates} />
      <GroupEditModal open={!!editingGroup} group={editingGroup} onClose={()=>setEditingGroup(null)} skuStorage={skuStorage} brands={brands}
        onSave={(patch:any)=>updateGroup(editingGroup.id,patch)} />

      {creating&&(
        <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:C.text }}>New Checklist Group</h3>
            <button onClick={()=>setCreating(false)} style={{ width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>&#215;</button>
          </div>
          <SKUSelector onNext={createGroup} skuStorage={skuStorage} brands={brands} />
        </div>
      )}

      {groups.length===0&&!creating?(
        <div style={{ background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12 }}>
          <Empty title="No checklist groups" sub="Create a group by selecting SKUs and an operational type." action={<Btn onClick={()=>setCreating(true)}>+ New Group</Btn>} />
        </div>
      ):(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:12 }}>
          {groups.map(g=>{ const lt=LAUNCH_TYPES[g.launchType]; return (
            <div key={g.id} className="emdc-card" style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,borderLeft:`4px solid ${C.accent}`,cursor:"pointer",transition:"box-shadow .2s" }} onClick={()=>setActive(g.id)}>
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
const SKUStorage = ({ brands, setBrands, skuStorage, setSkuStorage }) => {
  const { isMobile } = useBreakpoint();
  const [activeBrand,setActiveBrand]     = useState(null);
  const [skuModal,setSkuModal]           = useState(false);
  const [brandModal,setBrandModal]       = useState(false);
  const [editBrandModal,setEditBrandModal] = useState(false);
  const [editBrandForm,setEditBrandForm]   = useState(null);
  const [editSkuId,setEditSkuId]         = useState(null);
  const [showSidebar,setShowSidebar]     = useState(!isMobile);
  const [bForm,setBForm] = useState({name:"",color:"#111827"});
  const [sForm,setSForm] = useState({brandId:"",productName:"",sku:"",inventory:"",status:"active",customStatus:""});
  const filteredSkus  = activeBrand ? skuStorage.filter(s=>s.brandId===activeBrand) : skuStorage;
  const activeBrandObj = brands.find(b=>b.id===activeBrand);
  const addBrand  = ()=>{ if(!bForm.name.trim()) return; setBrands(p=>[...p,{id:uid(),name:bForm.name.trim(),color:"#111827"}]); setBForm({name:"",color:"#111827"}); setBrandModal(false); };
  const openEditBrand = b=>{ setEditBrandForm({...b}); setEditBrandModal(true); };
  const saveEditBrand = ()=>{ if(!editBrandForm.name.trim()) return; setBrands(p=>p.map(b=>b.id===editBrandForm.id?{...editBrandForm}:b)); setEditBrandModal(false); setEditBrandForm(null); };
  const delBrand  = id=>{ setBrands(p=>p.filter(b=>b.id!==id)); if(activeBrand===id) setActiveBrand(null); };
  const openAdd   = ()=>{ setSForm({brandId:activeBrand||brands[0]?.id||"",productName:"",sku:"",inventory:"",status:"active",customStatus:""}); setEditSkuId(null); setSkuModal(true); };
  const openEdit  = s=>{ setSForm({brandId:s.brandId,productName:s.productName,sku:s.sku,inventory:String(s.inventory),status:s.status,customStatus:s.customStatus||""}); setEditSkuId(s.id); setSkuModal(true); };
  const saveSku   = ()=>{
    if(!sForm.productName.trim()||!sForm.sku.trim()) return;
    const e={id:editSkuId||uid(),brandId:sForm.brandId,productName:sForm.productName.trim(),sku:sForm.sku.trim(),inventory:parseInt(sForm.inventory)||0,status:sForm.status,customStatus:sForm.customStatus.trim()};
    if(editSkuId) setSkuStorage(p=>p.map(s=>s.id===editSkuId?e:s)); else setSkuStorage(p=>[...p,e]);
    setSkuModal(false);
  };
  const delSku = id=>setSkuStorage(p=>p.filter(s=>s.id!==id));
  const STATUS_OPTS=[{value:"active",label:"Active",color:"#22C55E"},{value:"nostocks",label:"No Stocks",color:"#EF4444"},{value:"custom",label:"Custom",color:"#6B7280"}];
  const getSD = s=>{ if(s.status==="active") return{label:"Active",color:"#22C55E"}; if(s.status==="nostocks") return{label:"No Stocks",color:"#EF4444"}; return{label:s.customStatus||"Custom",color:"#6B7280"}; };

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
              {!isMobile&&<Btn sm onClick={openAdd}>+ Add SKU</Btn>}
            </div>

            {filteredSkus.length===0?(
              <div style={{ background:C.surface,border:`1.5px dashed ${C.border}`,borderRadius:12 }}>
                <Empty title="No SKUs yet" sub={`Add your first SKU${activeBrandObj?` for ${activeBrandObj.name}`:""}.`} action={<Btn sm onClick={openAdd}>+ Add SKU</Btn>} />
              </div>
            ):(
              <div style={{ background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                {/* Desktop table header */}
                {!isMobile&&(
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 140px 120px 80px 110px 80px",padding:"9px 16px",background:C.surfaceAlt,borderBottom:`1px solid ${C.border}` }}>
                    {["Product","SKU","Brand","Stock","Status",""].map((h,i)=>(<span key={i} style={{ fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em" }}>{h}</span>))}
                  </div>
                )}
                {filteredSkus.map((s,i)=>{
                  const brand=brands.find(b=>b.id===s.brandId), st=getSD(s);
                  // Mobile: card layout
                  if(isMobile) return (
                    <div key={s.id} className="emdc-row" style={{ padding:"14px 16px",borderBottom:i<filteredSkus.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                        <div style={{ minWidth:0,flex:1 }}>
                          <p style={{ margin:"0 0 2px",fontSize:14,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.productName}</p>
                          <span style={{ fontSize:11,fontFamily:"monospace",color:C.muted,background:C.surfaceAlt,padding:"2px 7px",borderRadius:4 }}>{s.sku}</span>
                        </div>
                        <div style={{ display:"flex",gap:6,marginLeft:10,flexShrink:0 }}>
                          <button onClick={()=>openEdit(s)} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                          <button onClick={()=>delSku(s.id)} style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                        {brand&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:6,height:6,borderRadius:"50%",background:brand.color }} /><span style={{ fontSize:11,color:C.muted }}>{brand.name}</span></div>}
                        <span style={{ fontSize:11,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:500 }}>{s.inventory.toLocaleString()} units</span>
                        <span style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"2px 8px",borderRadius:4,border:`1px solid ${st.color}28` }}>{st.label}</span>
                      </div>
                    </div>
                  );
                  // Desktop: table row
                  return (
                    <div key={s.id} className="emdc-row" style={{ display:"grid",gridTemplateColumns:"1fr 140px 120px 80px 110px 80px",padding:"11px 16px",borderBottom:i<filteredSkus.length-1?`1px solid ${C.border}`:"none",alignItems:"center" }}>
                      <span style={{ fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12 }}>{s.productName}</span>
                      <span style={{ fontSize:12,color:C.muted,fontFamily:"monospace",background:C.surfaceAlt,padding:"2px 6px",borderRadius:4,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.sku}</span>
                      <div>{brand&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:7,height:7,borderRadius:"50%",background:brand.color,flexShrink:0 }} /><span style={{ fontSize:12,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{brand.name}</span></div>}</div>
                      <span style={{ fontSize:12,color:s.inventory===0?"#EF4444":C.textSub,fontWeight:s.inventory===0?700:400,fontVariantNumeric:"tabular-nums" }}>{s.inventory.toLocaleString()}</span>
                      <span style={{ fontSize:11,fontWeight:600,color:st.color,background:st.color+"16",padding:"3px 8px",borderRadius:5,border:`1px solid ${st.color}28`,display:"inline-block",whiteSpace:"nowrap" }}>{st.label}</span>
                      <div style={{ display:"flex",gap:6,justifyContent:"flex-end" }}>
                        <button onClick={()=>openEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:600,padding:"3px 6px",borderRadius:4 }}>Edit</button>
                        <button onClick={()=>delSku(s.id)} style={{ width:26,height:26,borderRadius:5,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>&#215;</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={brandModal} onClose={()=>setBrandModal(false)} title="Add Brand" width={360}>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
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

      <Modal open={skuModal} onClose={()=>setSkuModal(false)} title={editSkuId?"Edit SKU":"Add SKU"} width={440}>
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <Field label="Brand">
            <Select value={sForm.brandId} onChange={v=>setSForm(f=>({...f,brandId:v}))}>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Product Name"><TI value={sForm.productName} onChange={v=>setSForm(f=>({...f,productName:v}))} placeholder="e.g. Quencha 750ml Tumbler Horizon" /></Field>
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

// ─── APP SHELL ───────────────────────────────────────────────────────────────
const TABS = [
  { id:"calendar",   label:"Calendar"        },
  { id:"events",     label:"Events & Seasons" },
  { id:"checklists", label:"Checklists"       },
  { id:"skus",       label:"SKU Storage"      },
];
const TAB_ICONS = { calendar:"📅", events:"🗓", checklists:"✓", skus:"📦" };
const TAB_SHORT = { calendar:"Calendar", events:"Events", checklists:"Checklists", skus:"SKUs" };

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
  const [checklistCalEvents,setChecklistCalEvents] = useState<any[]>([]);
  const [navigateToGroupId,setNavigateToGroupId]   = useState(null);

  // Lifted checklist state — owned by App so it survives switching away from and back to the Checklists tab
  const [checklistGroups,setChecklistGroups] = useState<any[]>(initialData?.checklistGroups ?? []);
  const [checklistAllItems,setChecklistAllItems] = useState<Record<string,any>>(initialData?.checklistItems ?? {});
  const [checklistStatuses,setChecklistStatuses] = useState<any[]>(initialData?.checklistStatuses ?? DEFAULT_STATUSES);

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

  const [seasonalCalEvents] = useState(()=>
    INITIAL_SEASONAL.filter(e=>e.calDate).map(e=>({
      id:"sea-"+e.id, date:e.calDate,
      // Pass dateEnd for multi-day/multi-month seasonal ranges
      ...(e.calDateEnd ? { dateEnd:e.calDateEnd } : {}),
      title:e.name,
      // Map seasonal type to closest DEFAULT_EVENT_TYPES id for filter
      type: e.type==="holiday" ? "holiday" : e.type==="campaign" ? "campaign" : "task",
      seasonalType:e.type,
      color:e.color, fromSeasonal:true,
    }))
  );

  useEffect(() => { if (onStateChange) onStateChange({ skuBrands: brands }); }, [brands]);
  useEffect(() => { if (onStateChange) onStateChange({ skuItems: skuStorage }); }, [skuStorage]);

  const handleGroupCreated = (g:any)=>{
    if(!g.deadline) return;
    setChecklistCalEvents((p:any)=>{ const next=[...p,{id:"cl-"+g.id,date:g.deadline,...(g.deadlineEnd?{dateEnd:g.deadlineEnd}:{}),title:g.groupName+(g.deadlineEnd?" - Date Range":" - Deadline"),type:"deadline",color:"#8B5CF6",fromChecklist:true,groupId:g.id}]; if(onStateChange) onStateChange({calendarEvents:next}); return next; });
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
              <span style={{ fontSize:15,fontWeight:800,color:C.text,letterSpacing:"-.02em" }}>EMDC Engine</span>
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
        <div style={{ maxWidth:1280,margin:"0 auto",padding:isMobile?"16px 16px 90px":"28px 28px" }}>
          <div style={{ marginBottom:isMobile?16:20 }}>
            <h1 style={{ margin:"0 0 2px",fontSize:isMobile?16:18,fontWeight:700,color:C.text,letterSpacing:"-.02em" }}>{TABS.find(t=>t.id===tab)?.label}</h1>
            <p style={{ margin:0,fontSize:12,color:C.faint }}>
              {tab==="calendar"   && "Track all events across campaigns, launches, and deadlines."}
              {tab==="events"     && "Seasonal events and campaigns with product recommendations."}
              {tab==="checklists" && "Operational checklists by SKU, launch type, and department."}
              {tab==="skus"       && "Product catalog by brand, SKU, inventory, and status."}
            </p>
          </div>
          {tab==="calendar"   && <CalendarView extraEvents={allCalExtra} onNavigateToGroup={handleNavigateToGroup} onStateChange={onStateChange} manualEvents={calendarManualEvents} setManualEvents={setCalendarManualEvents} eventTypes={calendarEventTypes} setEventTypes={setCalendarEventTypes} />}
          {tab==="events"     && <EventsView skuStorage={skuStorage} brands={brands} onStateChange={onStateChange} events={seasonalEvents} setEvents={setSeasonalEvents} />}
          {tab==="checklists" && <ChecklistView onGroupCreated={handleGroupCreated} skuStorage={skuStorage} brands={brands} navigateToGroupId={navigateToGroupId} onGroupNavigated={()=>setNavigateToGroupId(null)} onStateChange={onStateChange} groups={checklistGroups} setGroups={setChecklistGroups} allGroupItems={checklistAllItems} setAllGroupItems={setChecklistAllItems} statuses={checklistStatuses} setStatuses={setChecklistStatuses} />}
          {tab==="skus"       && <SKUStorage brands={brands} setBrands={setBrands} skuStorage={skuStorage} setSkuStorage={setSkuStorage} />}
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
