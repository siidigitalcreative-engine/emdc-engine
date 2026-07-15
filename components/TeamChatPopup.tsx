"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
};

const CHAT_POLL_MS = 30000;
const MAX_VISIBLE_MESSAGES = 30;

const formatChatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function TeamChatPopup() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sender, setSender] = useState("EMDC User");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessageIdRef = useRef("");

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("emdc-team-chat-name");
      if (savedName?.trim()) setSender(savedName.trim());
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("emdc-team-chat-name", sender.trim() || "EMDC User");
    } catch {}
  }, [sender]);

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await fetch(
        `/api/team-chat?limit=${MAX_VISIBLE_MESSAGES}&t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to load team chat.");
      }

      const nextMessages = Array.isArray(json.messages)
        ? json.messages
        : [];

      const latestId = nextMessages[nextMessages.length - 1]?.id || "";

      if (
        !open &&
        latestMessageIdRef.current &&
        latestId &&
        latestId !== latestMessageIdRef.current
      ) {
        const previousIndex = nextMessages.findIndex(
          (message: ChatMessage) => message.id === latestMessageIdRef.current
        );

        const addedCount =
          previousIndex >= 0
            ? nextMessages.length - previousIndex - 1
            : 1;

        setUnread((value) => value + Math.max(addedCount, 1));
      }

      latestMessageIdRef.current = latestId;
      setMessages(nextMessages);
      setError("");
    } catch (loadError: any) {
      if (!silent) {
        setError(loadError?.message || "Unable to load team chat.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setUnread(0);
    loadMessages();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadMessages(true);
      }
    }, CHAT_POLL_MS);

    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages.length]);

  const sendMessage = async () => {
    const cleanText = draft.trim();
    const cleanSender = sender.trim() || "EMDC User";

    if (!cleanText || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: cleanSender,
          text: cleanText,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to send message.");
      }

      setDraft("");
      await loadMessages(true);
    } catch (sendError: any) {
      setError(sendError?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
      ),
    [messages]
  );

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 88,
            zIndex: 9998,
            width: "min(390px, calc(100vw - 24px))",
            height: "min(590px, calc(100vh - 130px))",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(15,23,42,.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 14px 12px",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>
                EMDC Team Chat
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                Refreshes only while open
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close team chat"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                color: "#374151",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #E5E7EB",
              background: "#F9FAFB",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 800,
                color: "#6B7280",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Your display name
            </label>
            <input
              value={sender}
              onChange={(event) => setSender(event.target.value)}
              maxLength={60}
              style={{
                width: "100%",
                border: "1px solid #D1D5DB",
                borderRadius: 9,
                padding: "8px 10px",
                fontSize: 13,
                outline: "none",
                background: "#FFFFFF",
                color: "#111827",
              }}
            />
          </div>

          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              background: "#F8FAFC",
            }}
          >
            {loading && !sortedMessages.length ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#6B7280",
                  fontSize: 13,
                }}
              >
                Loading messages…
              </div>
            ) : !sortedMessages.length ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#6B7280",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                No messages yet.
                <br />
                Start the team conversation.
              </div>
            ) : (
              sortedMessages.map((message) => {
                const mine =
                  message.sender.trim().toLowerCase() ===
                  (sender.trim() || "EMDC User").toLowerCase();

                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "84%",
                        borderRadius: mine
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        padding: "9px 11px",
                        background: mine ? "#111827" : "#FFFFFF",
                        border: mine ? "1px solid #111827" : "1px solid #E5E7EB",
                        color: mine ? "#FFFFFF" : "#111827",
                        boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                      }}
                    >
                      {!mine && (
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            marginBottom: 4,
                            color: "#374151",
                          }}
                        >
                          {message.sender}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.45,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {message.text}
                      </div>

                      <div
                        style={{
                          fontSize: 9,
                          marginTop: 5,
                          opacity: 0.68,
                          textAlign: "right",
                        }}
                      >
                        {formatChatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderTop: "1px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#B91C1C",
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              padding: 12,
              borderTop: "1px solid #E5E7EB",
              background: "#FFFFFF",
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder="Write a message…"
              style={{
                width: "100%",
                resize: "none",
                border: "1px solid #D1D5DB",
                borderRadius: 10,
                padding: "9px 10px",
                fontSize: 13,
                outline: "none",
                color: "#111827",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                Enter to send · Shift+Enter for a new line
              </span>

              <button
                type="button"
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                style={{
                  border: 0,
                  borderRadius: 9,
                  padding: "9px 15px",
                  background:
                    !draft.trim() || sending ? "#D1D5DB" : "#111827",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor:
                    !draft.trim() || sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setUnread(0);
        }}
        aria-label="Open EMDC team chat"
        style={{
          position: "fixed",
          right: 18,
          bottom: 20,
          zIndex: 9997,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,.18)",
          background: "#111827",
          color: "#FFFFFF",
          boxShadow: "0 12px 30px rgba(15,23,42,.25)",
          cursor: "pointer",
          fontSize: 23,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? "×" : "💬"}

        {!open && unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 20,
              height: 20,
              borderRadius: 999,
              padding: "0 5px",
              background: "#EF4444",
              color: "#FFFFFF",
              border: "2px solid #FFFFFF",
              fontSize: 10,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
