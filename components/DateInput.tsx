"use client";

import React, { useEffect, useRef, useState } from "react";

/*
PHASE 2:
Prepared extracted DateInput component.
Do not import this yet until CalendarView.tsx is patched in Phase 3.
*/

export const DateInput = ({ value, onChange, style={} }) => {
  const getModeFromValue = (v:any) =>
    String(v || "").startsWith("monthly:") ? "monthly" :
    String(v || "").startsWith("yearly:") ? "yearly" :
    "date";

  const mode = getModeFromValue(value);

  const yearlyRaw = mode === "yearly"
    ? String(value).replace("yearly:","")
    : (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value.slice(5)
        : `${pad(today.getMonth()+1)}-${pad(today.getDate())}`);

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

  const currentDateValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  const baseField:any = {
    height:48,
    minHeight:48,
    maxHeight:48,
    width:"100%",
    maxWidth:"100%",
    minWidth:0,
    boxSizing:"border-box",
    border:`1.5px solid ${C.border}`,
    borderRadius:10,
    background:C.surface,
    color:C.text,
    fontSize:14,
    fontWeight:700,
    padding:"0 8px",
    outline:"none",
    overflow:"hidden",
    textOverflow:"ellipsis",
    whiteSpace:"nowrap",
  };

  const selectStyle:any = {
    ...baseField,
    appearance:"auto",
    WebkitAppearance:"menulist",
  };

  return (
    <div
      className="emdc-date-compact-row emdc-date-align-right-v4"
      style={{
        display:"grid",
        gridTemplateColumns:"minmax(0,calc(50% - 5px)) minmax(0,calc(50% - 5px))",
        gap:10,
        alignItems:"stretch",
        width:"100%",
        maxWidth:"100%",
        minWidth:0,
        overflow:"hidden",
        boxSizing:"border-box",
        paddingRight:0,
        ...style,
      }}
    >
      <select
        value={mode}
        onChange={e=>{
          const v = e.target.value;
          if(v==="monthly") onChange(`monthly:15,30`);
          else if(v==="yearly") onChange(`yearly:${yearlyMonth}-${yearlyDay}`);
          else onChange(currentDateValue);
        }}
        style={selectStyle}
      >
        <option value="date">Specific date</option>
        <option value="yearly">Recurring yearly</option>
        <option value="monthly">Recurring monthly</option>
      </select>

      {mode === "date" && (
        <input
          type="date"
          value={currentDateValue}
          onChange={e=>onChange(e.target.value)}
          style={baseField}
        />
      )}

      {mode === "yearly" && (
        <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,.8fr)",gap:8,width:"100%",minWidth:0,maxWidth:"100%",overflow:"hidden" }}>
          <select value={yearlyMonth} onChange={e=>setYearlyPart(e.target.value, yearlyDay)} style={selectStyle}>
            {MONTHS.map((m,i)=><option key={m} value={pad(i+1)}>{m.slice(0,3)}</option>)}
          </select>
          <select value={yearlyDay} onChange={e=>setYearlyPart(yearlyMonth, e.target.value)} style={selectStyle}>
            {Array.from({length:yearlyDayMax},(_,i)=>pad(i+1)).map(d=><option key={d} value={d}>{Number(d)}</option>)}
          </select>
        </div>
      )}

      {mode === "monthly" && (
        <input
          value={String(value || "monthly:15,30").replace("monthly:","")}
          onChange={e=>onChange(`monthly:${e.target.value.replace(/[^0-9,]/g,"")}`)}
          placeholder="15,30"
          style={baseField}
        />
      )}
    </div>
  );
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
        <button className="emdc-date-display-v3" type="button" onClick={()=>onChange([])}
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
  const isSmall = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  return (
    <div
      className="emdc-modal-overlay"
      style={{
        position:"fixed",
        inset:0,
        zIndex:10000,
        background:"rgba(15,23,42,.48)",
        display:"flex",
        alignItems:isSmall?"flex-end":"center",
        justifyContent:"center",
        padding:isSmall?"0 10px calc(88px + env(safe-area-inset-bottom))":"20px",
        overflow:"hidden",
      }}
      onClick={onClose}
    >
      <div
        className="emdc-modal-sheet"
        style={{
          width:"100%",
          maxWidth:width,
          maxHeight:isSmall?"min(78dvh, 720px)":"min(88vh, 760px)",
          background:C.surface,
          border:`1px solid ${C.border}`,
          borderRadius:isSmall?"22px 22px 18px 18px":18,
          boxShadow:"0 24px 80px rgba(15,23,42,.28)",
          overflow:"hidden",
          display:"flex",
          flexDirection:"column",
        }}
        onClick={e=>e.stopPropagation()}
      >
        <div style={{ flex:"0 0 auto",padding:isSmall?"12px 20px 14px":"18px 22px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface }}>
          {isSmall&&<div style={{ width:44,height:5,borderRadius:999,background:C.border,margin:"0 auto 18px" }} />}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
              {onBack&&<button onClick={onBack} style={{ width:38,height:38,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:18,flexShrink:0 }}>&#8249;</button>}
              <h3 style={{ margin:0,fontSize:isSmall?18:17,fontWeight:900,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{title}</h3>
            </div>
            <button onClick={onClose} style={{ width:44,height:48,borderRadius:"50%",background:C.surfaceAlt,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:22,flexShrink:0 }}>&#215;</button>
          </div>
        </div>
        <div
          className="emdc-modal-body"
          style={{
            flex:"1 1 auto",
            minHeight:0,
            overflowY:"auto",
            WebkitOverflowScrolling:"touch",
            overscrollBehavior:"contain",
            touchAction:"pan-y",
            padding:isSmall?"18px 20px 28px":"22px",overflowX:"hidden",overflowX:"hidden",
            background:C.surface,
          }}
        >
          {children}
        </div>
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

export default DateInput;
