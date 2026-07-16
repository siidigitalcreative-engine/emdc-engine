"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = {
  id: string;
  sender: string;
  senderEmail?: string;
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
  const [mobile, setMobile] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sender, setSender] = useState("Signed-in EMDC User");
  const [senderEmail, setSenderEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessageIdRef = useRef("");

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 760);

    updateMobile();
    window.addEventListener("resize", updateMobile);

    return () => {
      window.removeEventListener("resize", updateMobile);
    };
  }, []);


  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const applyUser = (user: any) => {
      if (!active || !user) return;

      const metadata =
        user?.user_metadata ||
        user?.raw_user_meta_data ||
        {};

      const resolvedName = String(
        metadata?.display_name ||
        metadata?.full_name ||
        metadata?.name ||
        metadata?.preferred_username ||
        user?.email ||
        "EMDC User"
      ).trim();

      setSender(resolvedName || "EMDC User");
      setSenderEmail(String(user?.email || "").trim());
    };

    const loadCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) applyUser(user);
      } catch {
        // Keep the fallback only if Supabase cannot return the session.
      }
    };

    loadCurrentUser();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        applyUser(session.user);
      }
    });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
          senderEmail,
          text: cleanText,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to send message.");
      }

      setDraft("");

      const returnedMessages = Array.isArray(json?.messages)
        ? json.messages
        : [];

      if (returnedMessages.length) {
        const latestId =
          returnedMessages[returnedMessages.length - 1]?.id || "";

        latestMessageIdRef.current = latestId;
        setMessages(returnedMessages);
      } else if (json?.message) {
        latestMessageIdRef.current = json.message.id || "";
        setMessages((current) => {
          const withoutDuplicate = current.filter(
            (item) => item.id !== json.message.id
          );

          return [
            ...withoutDuplicate,
            json.message,
          ].slice(-MAX_VISIBLE_MESSAGES);
        });
      } else {
        await loadMessages(true);
      }
    } catch (sendError: any) {
      setError(sendError?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const deleteOwnMessage = async (message: ChatMessage) => {
    if (
      !senderEmail ||
      !message?.senderEmail ||
      message.senderEmail.toLowerCase() !== senderEmail.toLowerCase()
    ) {
      setError("You can delete only your own messages.");
      return;
    }

    if (!window.confirm("Delete this message?")) return;

    setDeletingId(message.id);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete-message",
          messageId: message.id,
          requesterEmail: senderEmail,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to delete message.");
      }

      setMessages(
        Array.isArray(json?.messages)
          ? json.messages
          : (current) =>
              current.filter((item) => item.id !== message.id)
      );
    } catch (deleteError: any) {
      setError(
        deleteError?.message || "Unable to delete message."
      );
    } finally {
      setDeletingId("");
    }
  };

  const clearEntireChat = async () => {
    const adminPassword = window.prompt(
      "Enter the Team Chat administrator password:"
    );

    if (adminPassword === null) return;
    if (!adminPassword) {
      setError("Administrator password is required.");
      return;
    }

    if (
      !window.confirm(
        "Clear the entire team chat? This cannot be undone."
      )
    ) {
      return;
    }

    setClearing(true);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "clear-chat",
          adminPassword,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to clear chat.");
      }

      setMessages([]);
      latestMessageIdRef.current = "";
      setUnread(0);
    } catch (clearError: any) {
      setError(clearError?.message || "Unable to clear chat.");
    } finally {
      setClearing(false);
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
            right: mobile ? 8 : 18,
            left: mobile ? 8 : "auto",
            bottom: mobile
              ? "calc(76px + env(safe-area-inset-bottom))"
              : 88,
            zIndex: 9998,
            width: mobile
              ? "auto"
              : "min(390px, calc(100vw - 24px))",
            height: mobile
              ? "min(590px, calc(100vh - 110px - env(safe-area-inset-bottom)))"
              : "min(590px, calc(100vh - 130px))",
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <button
                type="button"
                onClick={clearEntireChat}
                disabled={clearing}
                title="Admin only"
                style={{
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  color: "#B91C1C",
                  fontSize: 10,
                  fontWeight: 900,
                  cursor: clearing ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {clearing ? "Clearing…" : "Clear Chat"}
              </button>

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
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #E5E7EB",
              background: "#F9FAFB",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#6B7280",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Signed in as
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #D1D5DB",
                borderRadius: 10,
                padding: "9px 10px",
                background: "#FFFFFF",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#111827",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {sender
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("") || "EU"}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sender}
                </div>

                {senderEmail && (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      color: "#6B7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {senderEmail}
                  </div>
                )}
              </div>
            </div>
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
                const mine = Boolean(
                  senderEmail &&
                  message.senderEmail &&
                  message.senderEmail.toLowerCase() ===
                    senderEmail.toLowerCase()
                ) || (
                  !message.senderEmail &&
                  message.sender.trim().toLowerCase() ===
                    (sender.trim() || "EMDC User").toLowerCase()
                );

                const canDelete = Boolean(
                  senderEmail &&
                  message.senderEmail &&
                  message.senderEmail.toLowerCase() ===
                    senderEmail.toLowerCase()
                );

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
                          marginTop: 5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            opacity: 0.68,
                          }}
                        >
                          {formatChatTime(message.createdAt)}
                        </span>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteOwnMessage(message)}
                            disabled={deletingId === message.id}
                            style={{
                              padding: 0,
                              border: 0,
                              background: "transparent",
                              color: mine ? "#FCA5A5" : "#DC2626",
                              fontSize: 9,
                              fontWeight: 900,
                              cursor:
                                deletingId === message.id
                                  ? "wait"
                                  : "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {deletingId === message.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        )}
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
            bottom: mobile
              ? "calc(76px + 18px + env(safe-area-inset-bottom))"
              : 20,
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
