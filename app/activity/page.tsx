"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ActivityTab = "all" | "work" | "system";

type ActivityRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  action: string;
  entity_type: string | null;
  entity_name: string | null;
  description: string | null;
  href: string | null;
  created_at: string;
};

const SYSTEM_ENTITY_TYPES = new Set(["auth", "system", "profile", "user"]);
const SYSTEM_ACTIONS = new Set([
  "signed in",
  "signed out",
  "changed display name",
  "requested password reset",
  "changed password",
]);

const isSystemActivity = (row: ActivityRow) => {
  const entityType = String(row.entity_type || "").toLowerCase();
  const action = String(row.action || "").toLowerCase();
  return SYSTEM_ENTITY_TYPES.has(entityType) || SYSTEM_ACTIONS.has(action);
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  minWidth: 78,
  height: 36,
  padding: "0 16px",
  borderRadius: 9,
  border: active ? "1px solid #111827" : "1px solid #E5E7EB",
  background: active ? "#111827" : "#fff",
  color: active ? "#fff" : "#374151",
  fontWeight: 800,
  cursor: "pointer",
});

export default function ActivityPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: ActivityTab = requestedTab === "work" || requestedTab === "system" ? requestedTab : "all";

  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (nextTab === "all" || nextTab === "work" || nextTab === "system") setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,display_name,email,action,entity_type,entity_name,description,href,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) setError(error.message);
      else setRows((data || []) as ActivityRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "system") return rows.filter(isSystemActivity);
    return rows.filter(row => !isSystemActivity(row));
  }, [activeTab, rows]);

  const setTab = (tab: ActivityTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "Inter,system-ui,sans-serif", padding: "42px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={() => { window.location.href = "/"; }} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontWeight: 800, cursor: "pointer" }}>← Back to EMDC Engine</button>

        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 30, color: "#111827" }}>Activity Center</h1>
          <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 13 }}>Work updates and system audit history from EMDC Engine users.</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          <button onClick={() => setTab("all")} style={tabButtonStyle(activeTab === "all")}>All</button>
          <button onClick={() => setTab("work")} style={tabButtonStyle(activeTab === "work")}>Work</button>
          <button onClick={() => setTab("system")} style={tabButtonStyle(activeTab === "system")}>System</button>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 10px 30px rgba(15,23,42,.05)" }}>
          {loading && <div style={{ padding: 24, color: "#6B7280" }}>Loading activity…</div>}
          {error && <div style={{ padding: 24, color: "#DC2626" }}>{error}</div>}
          {!loading && !error && filteredRows.length === 0 && (
            <div style={{ padding: 30, color: "#6B7280", textAlign: "center" }}>
              No {activeTab === "all" ? "activity" : activeTab} activity yet.
            </div>
          )}

          {filteredRows.map(row => {
            const system = isSystemActivity(row);
            return (
              <div key={row.id} style={{ display: "flex", gap: 12, padding: "15px 18px", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ width: 38, height: 38, borderRadius: 999, background: system ? "#6B7280" : "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>
                  {(row.display_name || row.email || "U").charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 7px", borderRadius: 999, background: system ? "#F3F4F6" : "#EEF2FF", color: system ? "#6B7280" : "#374151", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {system ? "System" : "Work"}
                    </span>
                  </div>

                  <div style={{ marginTop: 5, fontSize: 13, color: "#111827", lineHeight: 1.45 }}>
                    <strong>{row.display_name || row.email || "EMDC User"}</strong> {row.action}
                    {row.entity_name ? <> <strong>{row.entity_name}</strong></> : null}
                  </div>

                  {row.description && <div style={{ marginTop: 4, color: "#6B7280", fontSize: 12 }}>{row.description}</div>}
                  <div style={{ marginTop: 5, color: "#9CA3AF", fontSize: 11 }}>{new Date(row.created_at).toLocaleString("en-PH")}</div>
                </div>

                {row.href && !system && (
                  <button onClick={() => { window.location.href = row.href!; }} style={{ alignSelf: "center", height: 32, padding: "0 11px", borderRadius: 7, border: "1px solid #E5E7EB", background: "#F3F4F6", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Open</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
