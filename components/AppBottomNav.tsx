"use client";

import React, { useEffect, useState } from "react";
import MaterialIcon from "@/components/MaterialIcon";

const ITEMS = [
  { id: "calendar", label: "Calendar", icon: "calendar_month" },
  { id: "events", label: "Events", icon: "event_note" },
  { id: "checklists", label: "Checklists", icon: "checklist" },
  { id: "skus", label: "SKUs", icon: "inventory_2" },
  { id: "ai", label: "AI", icon: "auto_awesome" },
];

export default function AppBottomNav() {
  const [mobile, setMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 760);

    const updateActiveTab = () => {
      const rawHash = String(window.location.hash || "").replace(/^#\/?/, "");
      const tabFromHash = rawHash.split("?")[0] || "calendar";
      const allowed = ["calendar", "events", "checklists", "skus", "ai"];
      setActiveTab(allowed.includes(tabFromHash) ? tabFromHash : "calendar");
    };

    updateMobile();
    updateActiveTab();

    window.addEventListener("resize", updateMobile);
    window.addEventListener("hashchange", updateActiveTab);

    return () => {
      window.removeEventListener("resize", updateMobile);
      window.removeEventListener("hashchange", updateActiveTab);
    };
  }, []);

  if (!mobile) return null;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          height: "calc(76px + env(safe-area-inset-bottom))",
        }}
      />

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9000,
          display: "flex",
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -8px 24px rgba(15,23,42,.08)",
        }}
      >
        {ITEMS.map((item) => {
          const active = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                window.location.href = `/#/${item.id}`;
              }}
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                padding: "9px 1px 10px",
                border: "none",
                background: "transparent",
                color: "#111827",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MaterialIcon
                name={item.icon}
                size={21}
                fill={true}
                weight={600}
                style={{ opacity: active ? 1 : 0.42 }}
              />

              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: active ? 800 : 700,
                  opacity: active ? 1 : 0.52,
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>

              {active && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: "#111827",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
