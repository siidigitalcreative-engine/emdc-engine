"use client";

import { useCallback, useRef } from "react";

export function usePersist() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, unknown>>({});

  const save = useCallback((patch: Record<string, unknown>) => {
    pending.current = { ...pending.current, ...patch };

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      const payload = pending.current;
      pending.current = {};
      try {
        await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("[EMDC] Auto-save failed:", err);
      }
    }, 800);
  }, []);

  return save;
}

export async function loadAll() {
  try {
    const res = await fetch("/api/load");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[EMDC] Initial load failed:", err);
    return null;
  }
}
