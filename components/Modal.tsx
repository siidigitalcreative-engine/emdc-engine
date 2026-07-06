"use client";

import React from "react";

/*
PHASE 2:
Prepared extracted Modal component.
Do not import this yet until CalendarView.tsx is patched in Phase 3.
*/

export const Modal = ({ open, onClose, onBack, title, width=480, children }) => {
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

export default Modal;
