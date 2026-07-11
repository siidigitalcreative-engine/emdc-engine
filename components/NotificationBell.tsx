"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";

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

const isNotificationActivity = (row: ActivityRow) => {
  const entityType = String(row.entity_type || "").toLowerCase();
  const action = String(row.action || "").toLowerCase();
  return !SYSTEM_ENTITY_TYPES.has(entityType) && !SYSTEM_ACTIONS.has(action);
};

const timeAgo = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: activity }, { data: readRow }] = await Promise.all([
      supabase
        .from("activity_logs")
        .select("id,display_name,email,action,entity_type,entity_name,description,href,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_reads")
        .select("last_read_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const workRows = ((activity || []) as ActivityRow[]).filter(isNotificationActivity).slice(0, 20);
    setRows(workRows);
    setLastReadAt(readRow?.last_read_at || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);

    // Sign-ins are still retained in the Activity Center under the System tab,
    // but they are filtered out of the notification bell.
    const key = "emdc_login_activity_logged_v1";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      logActivity({ action: "signed in", entityType: "auth", href: "/activity?tab=system" }).then(load);
    }

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  const unread = useMemo(() => {
    if (!lastReadAt) return rows.length;
    const readTime = new Date(lastReadAt).getTime();
    return rows.filter(row => new Date(row.created_at).getTime() > readTime).length;
  }, [rows, lastReadAt]);

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from("notification_reads").upsert(
      { user_id: user.id, last_read_at: now },
      { onConflict: "user_id" }
    );
    setLastReadAt(now);
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
      await markAllRead();
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        style={{
          width: isMobile ? 30 : 34,
          height: 30,
          borderRadius: 8,
          border: "1px solid #E5E7EB",
          background: "#F3F4F6",
          color: "#374151",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 900,
          position: "relative",
        }}
      >
        ♢
        {unread > 0 && (
          <span style={{
            position: "absolute",
            right: -5,
            top: -6,
            minWidth: 17,
            height: 17,
            padding: "0 4px",
            borderRadius: 999,
            background: "#DC2626",
            color: "#fff",
            fontSize: 9,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: isMobile ? "fixed" : "absolute",
          right: isMobile ? 12 : 0,
          left: isMobile ? 12 : "auto",
          top: isMobile ? 76 : 38,
          width: isMobile ? "auto" : 380,
          maxWidth: isMobile ? "none" : "calc(100vw - 24px)",
          maxHeight: isMobile ? "calc(100dvh - 170px)" : 480,
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid #E5E7EB",
          background: "#fff",
          boxShadow: "0 18px 50px rgba(15,23,42,.18)",
          zIndex: 9500,
        }}>
          <div style={{ padding: "13px 14px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>Notifications</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>Work updates only</div>
            </div>
            <button onClick={() => { window.location.href = "/activity?tab=work"; }} style={{ border: "none", background: "transparent", color: "#374151", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>View all</button>
          </div>

          <div style={{ maxHeight: isMobile ? "calc(100dvh - 250px)" : 390, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {loading && <div style={{ padding: 18, color: "#6B7280", fontSize: 12 }}>Loading…</div>}
            {!loading && rows.length === 0 && <div style={{ padding: 22, color: "#6B7280", fontSize: 12, textAlign: "center" }}>No work notifications yet.</div>}
            {rows.map(row => (
              <button
                key={row.id}
                onClick={() => { if (row.href) window.location.href = row.href; }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom: "1px solid #F3F4F6",
                  background: "#fff",
                  textAlign: "left",
                  cursor: row.href ? "pointer" : "default",
                  display: "flex",
                  gap: 10,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 999, background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                  {(row.display_name || row.email || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.35 }}>
                    <strong>{row.display_name || row.email || "EMDC User"}</strong> {row.action}
                    {row.entity_name ? <> <strong>{row.entity_name}</strong></> : null}
                  </div>
                  {row.description && <div style={{ marginTop: 3, fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</div>}
                  <div style={{ marginTop: 4, fontSize: 10, color: "#9CA3AF" }}>{timeAgo(row.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
