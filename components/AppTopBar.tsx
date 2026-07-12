"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import { logActivity } from "@/lib/activity";
import MaterialIcon from "@/components/MaterialIcon";

const C = {
  surface: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  textSub: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
  accent: "#111827",
};

const getWidth = () => {
  if (typeof window === "undefined") return 1024;
  return Math.min(window.innerWidth || 1024, window.screen?.width || 1024);
};

export default function AppTopBar() {
  const supabase = useMemo(() => createClient(), []);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setIsMobile(getWidth() < 760);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      setUser(currentUser);
      setNameInput(
        currentUser.user_metadata?.display_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        ""
      );
    };
    load();
  }, [supabase]);

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Account";

  const saveDisplayName = async () => {
    const clean = nameInput.trim();
    if (!clean || saving) return;

    setSaving(true);
    setSaveStatus("");

    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: clean,
        full_name: clean,
      },
    });

    if (error) {
      setSaveStatus(error.message);
      setSaving(false);
      return;
    }

    setUser(data.user);
    setSaveStatus("Name saved.");
    setSaving(false);

    await logActivity({
      action: "changed display name",
      entityType: "profile",
      entityName: clean,
      href: "/activity?tab=system",
    });
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    await logActivity({
      action: "signed out",
      entityType: "auth",
      href: "/activity?tab=system",
    });

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const iconButton = {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surfaceAlt,
    color: C.textSub,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  } as React.CSSProperties;

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9100,
          height: 52,
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            height: "100%",
            margin: "0 auto",
            padding: isMobile ? "0 12px" : "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => { window.location.href = "/"; }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2.5c2.8 1.6 4.6 4.6 4.6 8.9 0 2.1-.5 3.9-1.2 5.4h-6.8c-.7-1.5-1.2-3.3-1.2-5.4 0-4.3 1.8-7.3 4.6-8.9z" fill="#fff"/>
                <circle cx="12" cy="10" r="1.7" fill={C.accent}/>
                <path d="M8.6 16.8 6 21.5l3.6-1.6c.3-1 .5-2 .6-3.1h-1.6z" fill="#fff"/>
                <path d="M15.4 16.8 18 21.5l-3.6-1.6c-.3-1-.5-2-.6-3.1h1.6z" fill="#fff"/>
              </svg>
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>EMDC</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <>
                <button
                  type="button"
                  onClick={() => { window.location.href = "/feed"; }}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.surfaceAlt,
                    color: C.textSub,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <MaterialIcon name="view_stream" size={15} fill={true} weight={500} />
                  <span style={{ marginLeft: 5 }}>Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = "/users"; }}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.surfaceAlt,
                    color: C.textSub,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <MaterialIcon name="group" size={15} fill={true} weight={500} />
                  <span style={{ marginLeft: 5 }}>Users</span>
                </button>
              </>
            )}

            <NotificationBell isMobile={isMobile} />

            {isMobile && (
              <>
                <button
                  type="button"
                  onClick={() => { window.location.href = "/feed"; }}
                  title="Open team feed"
                  aria-label="Open team feed"
                  style={iconButton}
                >
                  <MaterialIcon name="view_stream" size={18} fill={true} weight={500} />
                </button>

                <button
                  type="button"
                  onClick={() => { window.location.href = "/users"; }}
                  title="Open users"
                  aria-label="Open users"
                  style={iconButton}
                >
                  <MaterialIcon name="group" size={18} fill={true} weight={500} />
                </button>
              </>
            )}

            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(value => !value);
                  setSaveStatus("");
                }}
                style={{
                  height: 30,
                  maxWidth: isMobile ? 110 : 220,
                  padding: isMobile ? "0 9px" : "0 11px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 7,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.textSub,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                <MaterialIcon name="account_circle" size={16} fill={true} weight={500} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isMobile ? "Account" : displayName}
                </span>
                <MaterialIcon name="arrow_drop_down" size={16} fill={false} style={{ color: C.faint }} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 36,
                    width: isMobile ? "min(310px,calc(100vw - 24px))" : 310,
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    boxShadow: "0 14px 40px rgba(15,23,42,.16)",
                    zIndex: 500,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>
                      {displayName}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 11, color: C.muted }}>
                      {user?.email || ""}
                    </div>
                  </div>

                  <label style={{ display: "block", marginBottom: 5, fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: C.muted }}>
                    Display name
                  </label>

                  <input
                    value={nameInput}
                    onChange={event => {
                      setNameInput(event.target.value);
                      setSaveStatus("");
                    }}
                    onKeyDown={event => {
                      if (event.key === "Enter") saveDisplayName();
                    }}
                    placeholder="Enter your name"
                    maxLength={80}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 11px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />

                  <button
                    type="button"
                    onClick={saveDisplayName}
                    disabled={saving || !nameInput.trim()}
                    style={{
                      width: "100%",
                      height: 36,
                      marginTop: 8,
                      borderRadius: 8,
                      border: "none",
                      background: C.accent,
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: saving || !nameInput.trim() ? "not-allowed" : "pointer",
                      opacity: saving || !nameInput.trim() ? 0.55 : 1,
                    }}
                  >
                    {saving ? "Saving…" : "Save display name"}
                  </button>

                  {saveStatus && (
                    <div style={{ marginTop: 7, fontSize: 11, color: saveStatus === "Name saved." ? "#15803D" : "#DC2626" }}>
                      {saveStatus}
                    </div>
                  )}

                  <div style={{ height: 1, background: C.border, margin: "12px 0" }} />

                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    style={{
                      width: "100%",
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surfaceAlt,
                      color: C.textSub,
                      cursor: loggingOut ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {loggingOut ? "Signing out…" : "Log out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div aria-hidden="true" style={{ height: 52 }} />
    </>
  );
}
