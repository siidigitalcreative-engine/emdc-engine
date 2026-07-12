"use client";

import React, { useEffect, useState } from "react";

const ITEMS = [
  { id: "calendar", label: "Calendar", short: "Calendar", icon: "calendar" },
  { id: "events", label: "Events", short: "Events", icon: "events" },
  { id: "checklists", label: "Checklists", short: "Checklists", icon: "checklists" },
  { id: "skus", label: "SKUs", short: "SKUs", icon: "skus" },
  { id: "ai", label: "AI", short: "AI", icon: "ai" },
];

const iconPath: Record<string, React.ReactNode> = {
  calendar: <path d="M6 2v2M18 2v2M3.5 8h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>,
  events: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>,
  checklists: <path d="m4 7 2 2 4-4M12 7h8m-16 7 2 2 4-4m2 2h8"/>,
  skus: <path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>,
  ai: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8m8.6 8.6 2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.6-8.6 2.8-2.8M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>,
};

export default function AppBottomNav() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 760);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mobile) return null;

  return (
    <>
      <div aria-hidden="true" style={{ height: "calc(76px + env(safe-area-inset-bottom))" }} />
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
        {ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              window.location.href = `/?tab=${item.id}`;
            }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "9px 2px 10px",
              border: "none",
              background: "transparent",
              color: "#6B7280",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {iconPath[item.icon]}
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
              {item.short}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
