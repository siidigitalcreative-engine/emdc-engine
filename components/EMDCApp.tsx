"use client";

import React, { useEffect, useState } from "react";
import { usePersist, loadAll } from "@/lib/use-persist";
import dynamic from "next/dynamic";

const App = dynamic(() => import("./emdc-engine"), { ssr: false });

export type LoadedData = {
  calendarEvents:    unknown[] | null;
  calendarTypes:     unknown[] | null;
  seasonalEvents:    unknown[] | null;
  checklistGroups:   unknown[] | null;
  checklistItems:    Record<string, unknown> | null;
  checklistStatuses: unknown[] | null;
  skuBrands:         unknown[] | null;
  skuItems:          unknown[] | null;
};

export default function EMDCApp() {
  const [ready, setReady] = useState(false);
  const [initialData, setInitialData] = useState<LoadedData | null>(null);
  const save = usePersist();

  useEffect(() => {
    loadAll().then((data) => {
      if (data) setInitialData(data);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        background:"#F8F9FA", fontFamily:"'Inter', system-ui, sans-serif", gap:14,
      }}>
        <div style={{
          width:36, height:36, borderRadius:9, background:"#111827",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5c2.8 1.6 4.6 4.6 4.6 8.9 0 2.1-.5 3.9-1.2 5.4h-6.8c-.7-1.5-1.2-3.3-1.2-5.4 0-4.3 1.8-7.3 4.6-8.9z" fill="#fff"/>
            <circle cx="12" cy="10" r="1.7" fill="#111827"/>
            <path d="M8.6 16.8 6 21.5l3.6-1.6c.3-1 .5-2 .6-3.1h-1.6z" fill="#fff"/>
            <path d="M15.4 16.8 18 21.5l-3.6-1.6c-.3-1-.5-2-.6-3.1h1.6z" fill="#fff"/>
          </svg>
        </div>
        <div style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#111827" }}>EMDC Engine</p>
          <p style={{ margin:0, fontSize:12, color:"#9CA3AF" }}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <App initialData={initialData} onStateChange={save} />;
}
