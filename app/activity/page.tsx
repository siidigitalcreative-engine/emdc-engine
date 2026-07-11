"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ActivityRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  action: string;
  entity_name: string | null;
  description: string | null;
  href: string | null;
  created_at: string;
};

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,display_name,email,action,entity_name,description,href,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) setError(error.message);
      else setRows((data || []) as ActivityRow[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "Inter,system-ui,sans-serif", padding: "42px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={() => { window.location.href = "/"; }} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontWeight: 800, cursor: "pointer" }}>← Back to EMDC Engine</button>
        <div style={{ marginTop: 24, marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 30, color: "#111827" }}>Activity Log</h1>
          <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 13 }}>Recent actions from EMDC Engine users.</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 10px 30px rgba(15,23,42,.05)" }}>
          {loading && <div style={{ padding: 24, color: "#6B7280" }}>Loading activity…</div>}
          {error && <div style={{ padding: 24, color: "#DC2626" }}>{error}</div>}
          {!loading && !error && rows.length === 0 && <div style={{ padding: 30, color: "#6B7280", textAlign: "center" }}>No activity yet.</div>}
          {rows.map(row => (
            <div key={row.id} style={{ display: "flex", gap: 12, padding: "15px 18px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>
                {(row.display_name || row.email || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.45 }}>
                  <strong>{row.display_name || row.email || "EMDC User"}</strong> {row.action}
                  {row.entity_name ? <> <strong>{row.entity_name}</strong></> : null}
                </div>
                {row.description && <div style={{ marginTop: 4, color: "#6B7280", fontSize: 12 }}>{row.description}</div>}
                <div style={{ marginTop: 5, color: "#9CA3AF", fontSize: 11 }}>{new Date(row.created_at).toLocaleString("en-PH")}</div>
              </div>
              {row.href && <button onClick={() => { window.location.href = row.href!; }} style={{ alignSelf: "center", height: 32, padding: "0 11px", borderRadius: 7, border: "1px solid #E5E7EB", background: "#F3F4F6", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Open</button>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
