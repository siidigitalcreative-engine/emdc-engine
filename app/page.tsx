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
      Loading EMDC Engine…
    </div>
  )
});

export default function Page() {
  return <EMDCApp />;
}
