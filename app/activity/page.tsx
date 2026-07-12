"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppTopBar from "@/components/AppTopBar";
import AppBottomNav from "@/components/AppBottomNav";

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

const timeAgo = (value: string) => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TAB_LABELS: Record<ActivityTab, string> = {
  all: "All",
  work: "Work",
  system: "System",
};

function ActivityPageContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<ActivityTab>(
    requestedTab === "work" || requestedTab === "system" ? requestedTab : "all"
  );
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (requestedTab === "work" || requestedTab === "system" || requestedTab === "all") {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const { data, error: loadError } = await supabase
        .from("activity_logs")
        .select(
          "id,display_name,email,action,entity_type,entity_name,description,href,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (loadError) {
        setError(loadError.message);
        setRows([]);
      } else {
        setRows((data || []) as ActivityRow[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "system") return rows.filter(isSystemActivity);
    return rows.filter((row) => !isSystemActivity(row));
  }, [activeTab, rows]);

  const changeTab = (tab: ActivityTab) => {
    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <>
      <AppTopBar />
      <main
      style={{
        minHeight: "100vh",
        background: "#F8F9FA",
        fontFamily: "Inter,system-ui,sans-serif",
        padding: "28px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        <div style={{ marginTop: 24 }}>
          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "clamp(26px, 6vw, 34px)",
              lineHeight: 1.1,
            }}
          >
            Activity Center
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#6B7280",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Review work updates and system activity from EMDC Engine users.
          </p>
        </div>

        <section
          style={{
            marginTop: 22,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            boxShadow: "0 12px 32px rgba(15,23,42,.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 16px 0",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <div
              style={{
                color: "#111827",
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              Activity Log
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 14,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {(Object.keys(TAB_LABELS) as ActivityTab[]).map((tab) => {
                const active = activeTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => changeTab(tab)}
                    style={{
                      height: 38,
                      minWidth: 76,
                      padding: "0 16px",
                      border: "none",
                      borderBottom: active
                        ? "3px solid #111827"
                        : "3px solid transparent",
                      background: "transparent",
                      color: active ? "#111827" : "#6B7280",
                      fontSize: 12,
                      fontWeight: active ? 900 : 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div style={{ padding: 26, color: "#6B7280", fontSize: 13 }}>
              Loading activity…
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 26, color: "#DC2626", fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && filteredRows.length === 0 && (
            <div
              style={{
                padding: "42px 24px",
                color: "#6B7280",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No {activeTab === "all" ? "" : `${activeTab} `}activity yet.
            </div>
          )}

          {!loading &&
            !error &&
            filteredRows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "15px 16px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    background: isSystemActivity(row) ? "#6B7280" : "#111827",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {(row.display_name || row.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color: "#111827",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>
                      {row.display_name || row.email || "EMDC User"}
                    </strong>{" "}
                    {row.action}
                    {row.entity_name ? (
                      <>
                        {" "}
                        <strong>{row.entity_name}</strong>
                      </>
                    ) : null}
                  </div>

                  {row.description && (
                    <div
                      style={{
                        marginTop: 4,
                        color: "#6B7280",
                        fontSize: 12,
                        lineHeight: 1.4,
                      }}
                    >
                      {row.description}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 6,
                      color: "#9CA3AF",
                      fontSize: 11,
                    }}
                  >
                    {timeAgo(row.created_at)}
                    {" · "}
                    {new Date(row.created_at).toLocaleString("en-PH")}
                  </div>
                </div>

                {row.href && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = row.href as string;
                    }}
                    style={{
                      alignSelf: "center",
                      height: 34,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      background: "#F3F4F6",
                      color: "#374151",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Open
                  </button>
                )}
              </div>
            ))}
        </section>
      </div>
      </main>
      <AppBottomNav />
    </>
  );
}


export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#F8F9FA",
            fontFamily: "Inter,system-ui,sans-serif",
            padding: "28px 14px 48px",
          }}
        >
          <div
            style={{
              maxWidth: 920,
              margin: "0 auto",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 26,
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Loading Activity Center…
          </div>
        </main>
      }
    >
      <ActivityPageContent />
    </Suspense>
  );
}
