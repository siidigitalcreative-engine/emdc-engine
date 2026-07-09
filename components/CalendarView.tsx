UPDATE EXISTING FILE:
components/CalendarView.tsx

IMPORTANT:
Do not replace the full file.
Apply only the 3 small changes below.

============================================================
CHANGE 1 OF 3 - ADD PRODUCT HUB HELPERS
============================================================

Inside components/CalendarView.tsx, find this block inside const SKUStorage:

  const brandById = useMemo(()=>{
    const map:any = {};
    (brands||[]).forEach((brand:any)=>{ map[brand.id] = brand; });
    return map;
  },[brands]);

Immediately AFTER that block, paste this:

  const getProductHubUrl = (skuRow:any) => {
    const code = String(skuRow?.sku || "").trim();
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/p/${encodeURIComponent(code)}`;
  };

  const getProductHubQrUrl = (skuRow:any) => {
    const hubUrl = getProductHubUrl(skuRow);
    if (!hubUrl) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/qr?url=${encodeURIComponent(hubUrl)}`;
  };

  const openProductHub = (skuRow:any) => {
    const url = getProductHubUrl(skuRow);
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openProductHubQr = (skuRow:any) => {
    const url = getProductHubQrUrl(skuRow);
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyProductHubLink = async (skuRow:any) => {
    const url = getProductHubUrl(skuRow);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert(`Product Hub link copied:\n${url}`);
    } catch {
      if (typeof window !== "undefined") window.prompt("Copy Product Hub link", url);
    }
  };


============================================================
CHANGE 2 OF 3 - ADD DESKTOP BUTTONS
============================================================

Find this desktop actions block:

                                <div style={{ minHeight:48,padding:"8px 10px",borderLeft:`1px solid ${C.border}`,display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center",background:C.surface }}>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>openEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:700,padding:"4px 7px",borderRadius:5 }}>Edit</button>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>delSku(s.id)} title="Delete this product row" aria-label="Delete this product row" style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"1px solid #FECACA",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800 }}>&#215;</button>
                                </div>

Replace that block only with this:

                                <div style={{ minHeight:48,padding:"8px 10px",borderLeft:`1px solid ${C.border}`,display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center",background:C.surface,flexWrap:"wrap" }}>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>openProductHub(s)} title="Open public Product Hub page" style={{ background:C.accent,border:"none",cursor:"pointer",fontSize:11,color:"#fff",fontWeight:800,padding:"5px 8px",borderRadius:6 }}>Hub</button>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>openProductHubQr(s)} title="Open QR code" style={{ background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.textSub,fontWeight:800,padding:"5px 8px",borderRadius:6 }}>QR</button>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>copyProductHubLink(s)} title="Copy Product Hub link" style={{ background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.textSub,fontWeight:800,padding:"5px 8px",borderRadius:6 }}>Copy</button>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>openEdit(s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,fontWeight:700,padding:"4px 7px",borderRadius:5 }}>Edit</button>
                                  <button className="emdc-date-display-v3" type="button" onClick={()=>delSku(s.id)} title="Delete this product row" aria-label="Delete this product row" style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"1px solid #FECACA",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800 }}>&#215;</button>
                                </div>


============================================================
CHANGE 3 OF 3 - ADD MOBILE BUTTONS
============================================================

Find this mobile actions block:

                            <div style={{ display:"flex",gap:6,marginLeft:10,flexShrink:0,alignItems:"center" }}>
                              {skuTableEditMode&&<span title="Drag rows on desktop using the 6-dot handle" style={{ width:28,height:28,borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.faint }}>&#8942;&#8942;</span>}
                              <button onClick={()=>openEdit(s)} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                              <button onClick={()=>delSku(s.id)} style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                            </div>

Replace that block only with this:

                            <div style={{ display:"flex",gap:6,marginLeft:10,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end" }}>
                              {skuTableEditMode&&<span title="Drag rows on desktop using the 6-dot handle" style={{ width:28,height:28,borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.faint }}>&#8942;&#8942;</span>}
                              <button onClick={()=>openProductHub(s)} style={{ padding:"5px 9px",borderRadius:6,background:C.accent,border:"none",cursor:"pointer",fontSize:11,color:"#fff",fontWeight:800 }}>Hub</button>
                              <button onClick={()=>openProductHubQr(s)} style={{ padding:"5px 9px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.textSub,fontWeight:800 }}>QR</button>
                              <button onClick={()=>copyProductHubLink(s)} style={{ padding:"5px 9px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.textSub,fontWeight:800 }}>Copy</button>
                              <button onClick={()=>openEdit(s)} style={{ padding:"5px 10px",borderRadius:6,background:C.surfaceAlt,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.muted,fontWeight:600 }}>Edit</button>
                              <button onClick={()=>delSku(s.id)} style={{ width:28,height:28,borderRadius:6,background:"#FEF2F2",border:"none",cursor:"pointer",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center" }}>&#215;</button>
                            </div>

DONE.
