"use client";

import dynamic from "next/dynamic";

const EMDCApp = dynamic(() => import("@/components/CalendarView"), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#111827",
      background: "#F9FAFB"
    }}>
      <div style={{
        width: "min(420px, 100%)",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 20,
        textAlign: "center",
        boxShadow: "0 12px 40px rgba(15,23,42,.08)"
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#111827",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          marginBottom: 12
        }}>
          EMDC
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900 }}>
          Loading EMDC Engine…
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.45 }}>
          Preparing the workspace.
        </p>
      </div>
    </div>
  )
});

export default function Page() {
  return <EMDCApp />;
}
