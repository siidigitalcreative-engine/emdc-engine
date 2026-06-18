"use client";
import dynamic from "next/dynamic";

const EMDCApp = dynamic(() => import("@/components/EMDCApp"), { ssr: false });

export default function Page() {
  return <EMDCApp />;
}
