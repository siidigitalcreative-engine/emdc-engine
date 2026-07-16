"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReactionMap = Record<string, string[]>;

type ChatMessage = {
  id: string;
  sender: string;
  senderEmail?: string;
  text: string;
  createdAt: string;
  reactions?: ReactionMap;
  mentions?: string[];
  readBy?: string[];
};

const CHAT_POLL_MS = 30000;
const MAX_VISIBLE_MESSAGES = 30;
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

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

const normalizeEmail = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export default function TeamChatPopup() {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sender, setSender] = useState("EMDC User");
  const [senderEmail, setSenderEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState("");
  const [reactionBusyKey, setReactionBusyKey] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessageIdRef = useRef("");
  const lastMarkedReadRef = useRef("");

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
      } catch {}
    };

    loadCurrentUser();

    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) applyUser(session.user);
      });

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const markRead = async (
    nextMessages: ChatMessage[],
    silent = true
  ) => {
    const email = normalizeEmail(senderEmail);
    if (!email || !open || document.visibilityState !== "visible") return;

    const unreadIds = nextMessages
      .filter((message) => {
        const author = normalizeEmail(message.senderEmail);
        const readers = (message.readBy || []).map(normalizeEmail);
        return author && author !== email && !readers.includes(email);
      })
      .map((message) => message.id);

    if (!unreadIds.length) return;

    const signature = unreadIds.join(",");
    if (lastMarkedReadRef.current === signature) return;
    lastMarkedReadRef.current = signature;

    try {
      const response = await fetch("/api/team-chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-read",
          messageIds: unreadIds,
          requesterEmail: email,
        }),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to update read receipts.");
      }

      if (Array.isArray(json.messages)) {
        setMessages(json.messages);
      }
    } catch (readError: any) {
      if (!silent) {
        setError(
          readError?.message || "Unable to update read receipts."
        );
      }
    }
  };

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

      const latestId =
        nextMessages[nextMessages.length - 1]?.id || "";

      if (
        !open &&
        latestMessageIdRef.current &&
        latestId &&
        latestId !== latestMessageIdRef.current
      ) {
        const previousIndex = nextMessages.findIndex(
          (message: ChatMessage) =>
            message.id === latestMessageIdRef.current
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

      if (open) {
        void markRead(nextMessages);
      }
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
  }, [open, senderEmail]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages.length]);

  const participantSuggestions = useMemo(() => {
    const byEmail = new Map<string, string>();

    messages.forEach((message) => {
      const email = normalizeEmail(message.senderEmail);
      const name = String(message.sender || "").trim();

      if (email && name && email !== normalizeEmail(senderEmail)) {
        byEmail.set(email, name);
      }
    });

    return Array.from(byEmail.entries()).map(([email, name]) => ({
      email,
      name,
    }));
  }, [messages, senderEmail]);

  const mentionQuery = useMemo(() => {
    const match = draft.match(/(?:^|\s)@([^\s@]*)$/);
    return match ? String(match[1] || "").toLowerCase() : "";
  }, [draft]);

  const filteredMentions = useMemo(() => {
    if (!mentionOpen) return [];

    return participantSuggestions
      .filter((person) => {
        if (!mentionQuery) return true;
        return (
          person.name.toLowerCase().includes(mentionQuery) ||
          person.email.toLowerCase().includes(mentionQuery)
        );
      })
      .slice(0, 6);
  }, [mentionOpen, mentionQuery, participantSuggestions]);

  const addMention = (person: { name: string; email: string }) => {
    setDraft((current) =>
      current.replace(
        /(?:^|\s)@([^\s@]*)$/,
        (matched) => {
          const leading = matched.startsWith(" ") ? " " : "";
          return `${leading}@${person.name} `;
        }
      )
    );
    setMentionOpen(false);
  };

  const sendMessage = async () => {
    const cleanText = draft.trim();
    const cleanSender = sender.trim() || "EMDC User";
    const cleanEmail = normalizeEmail(senderEmail);

    if (!cleanText || !cleanEmail || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: cleanSender,
          senderEmail: cleanEmail,
          text: cleanText,
          mentionDirectory: participantSuggestions,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to send message.");
      }

      setDraft("");
      setMentionOpen(false);

      if (Array.isArray(json?.messages)) {
        setMessages(json.messages);
        latestMessageIdRef.current =
          json.messages[json.messages.length - 1]?.id || "";
      } else if (json?.message) {
        setMessages((current) =>
          [...current, json.message].slice(-MAX_VISIBLE_MESSAGES)
        );
      }
    } catch (sendError: any) {
      setError(sendError?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (
    message: ChatMessage,
    emoji: string
  ) => {
    const email = normalizeEmail(senderEmail);
    if (!email) return;

    const busyKey = `${message.id}:${emoji}`;
    setReactionBusyKey(busyKey);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-reaction",
          messageId: message.id,
          emoji,
          requesterEmail: email,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to update reaction.");
      }

      if (Array.isArray(json.messages)) {
        setMessages(json.messages);
      }
    } catch (reactionError: any) {
      setError(
        reactionError?.message || "Unable to update reaction."
      );
    } finally {
      setReactionBusyKey("");
      setReactionMessageId("");
    }
  };

  const toggleSelected = (message: ChatMessage) => {
    const mine =
      normalizeEmail(message.senderEmail) ===
      normalizeEmail(senderEmail);

    if (!mine) return;

    setSelectedIds((current) =>
      current.includes(message.id)
        ? current.filter((id) => id !== message.id)
        : [...current, message.id]
    );
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || deletingSelected) return;

    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected message${
          selectedIds.length === 1 ? "" : "s"
        }?`
      )
    ) {
      return;
    }

    setDeletingSelected(true);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-selected",
          messageIds: selectedIds,
          requesterEmail: normalizeEmail(senderEmail),
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(
          json?.error || "Unable to delete selected messages."
        );
      }

      setMessages(
        Array.isArray(json.messages) ? json.messages : []
      );
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (deleteError: any) {
      setError(
        deleteError?.message ||
          "Unable to delete selected messages."
      );
    } finally {
      setDeletingSelected(false);
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
        headers: { "Content-Type": "application/json" },
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
      setSelectedIds([]);
      setSelectionMode(false);
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
              padding: "12px 12px 10px",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {selectionMode ? (
              <>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>
                    Selected ({selectedIds.length})
                  </div>
                  <div style={{ fontSize: 10, color: "#6B7280" }}>
                    Only your own messages can be selected.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={!selectedIds.length || deletingSelected}
                    style={{
                      height: 34,
                      padding: "0 10px",
                      borderRadius: 9,
                      border: "1px solid #FCA5A5",
                      background: "#FEF2F2",
                      color: "#B91C1C",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {deletingSelected
                      ? "Deleting…"
                      : "Delete Selected"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds([]);
                    }}
                    style={{
                      height: 34,
                      padding: "0 10px",
                      borderRadius: 9,
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    EMDC Team Chat
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    Lazy mode · refreshes only while open
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    style={{
                      height: 34,
                      padding: "0 9px",
                      borderRadius: 9,
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                      color: "#374151",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    Select
                  </button>

                  <button
                    type="button"
                    onClick={clearEntireChat}
                    disabled={clearing}
                    title="Admin password required"
                    style={{
                      height: 34,
                      padding: "0 9px",
                      borderRadius: 9,
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                      color: "#B91C1C",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {clearing ? "Clearing…" : "Clear Chat"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close team chat"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                      fontSize: 20,
                      color: "#374151",
                    }}
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              padding: "9px 12px",
              borderBottom: "1px solid #E5E7EB",
              background: "#F9FAFB",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#6B7280",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Signed in as
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                border: "1px solid #D1D5DB",
                borderRadius: 10,
                padding: "8px 9px",
                background: "#FFFFFF",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "#111827",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
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
                    fontSize: 12,
                    fontWeight: 900,
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
                      fontSize: 9,
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
                const mine =
                  normalizeEmail(message.senderEmail) ===
                  normalizeEmail(senderEmail);

                const selected = selectedIds.includes(message.id);
                const reactionEntries = Object.entries(
                  message.reactions || {}
                ).filter(([, emails]) => emails.length > 0);

                const seenCount = unique(
                  (message.readBy || [])
                    .map(normalizeEmail)
                    .filter(
                      (email) =>
                        email &&
                        email !== normalizeEmail(message.senderEmail)
                    )
                ).length;

                return (
                  <div
                    key={message.id}
                    onClick={() => {
                      if (selectionMode && mine) toggleSelected(message);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      marginBottom: 10,
                      cursor:
                        selectionMode && mine ? "pointer" : "default",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        maxWidth: "84%",
                        borderRadius: mine
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        padding: "9px 11px",
                        background: mine ? "#111827" : "#FFFFFF",
                        border: selected
                          ? "2px solid #3B82F6"
                          : mine
                            ? "1px solid #111827"
                            : "1px solid #E5E7EB",
                        color: mine ? "#FFFFFF" : "#111827",
                        boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                      }}
                    >
                      {selectionMode && mine && (
                        <span
                          style={{
                            position: "absolute",
                            top: -7,
                            right: -7,
                            width: 19,
                            height: 19,
                            borderRadius: 999,
                            background: selected
                              ? "#3B82F6"
                              : "#FFFFFF",
                            border: "2px solid #3B82F6",
                            color: "#FFFFFF",
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selected ? "✓" : ""}
                        </span>
                      )}

                      {!mine && (
                        <div
                          style={{
                            fontSize: 10,
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

                      {reactionEntries.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            marginTop: 7,
                          }}
                        >
                          {reactionEntries.map(([emoji, emails]) => {
                            const reacted = emails
                              .map(normalizeEmail)
                              .includes(normalizeEmail(senderEmail));

                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleReaction(message, emoji);
                                }}
                                style={{
                                  border: reacted
                                    ? "1px solid #60A5FA"
                                    : "1px solid #D1D5DB",
                                  background: reacted
                                    ? "#EFF6FF"
                                    : "#FFFFFF",
                                  color: "#111827",
                                  borderRadius: 999,
                                  padding: "2px 7px",
                                  fontSize: 10,
                                }}
                              >
                                {emoji} {emails.length}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        {mine && (
                          <span
                            style={{
                              fontSize: 8.5,
                              opacity: 0.72,
                            }}
                          >
                            {seenCount > 0
                              ? `Seen by ${seenCount}`
                              : "Sent"}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 8.5,
                            opacity: 0.68,
                          }}
                        >
                          {formatChatTime(message.createdAt)}
                        </span>

                        {!selectionMode && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReactionMessageId(
                                reactionMessageId === message.id
                                  ? ""
                                  : message.id
                              );
                            }}
                            style={{
                              padding: 0,
                              border: 0,
                              background: "transparent",
                              color: mine ? "#FFFFFF" : "#374151",
                              fontSize: 12,
                              opacity: 0.8,
                            }}
                          >
                            ☺
                          </button>
                        )}
                      </div>

                      {reactionMessageId === message.id && (
                        <div
                          style={{
                            marginTop: 7,
                            display: "flex",
                            gap: 3,
                            padding: 4,
                            borderRadius: 10,
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                          }}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              disabled={
                                reactionBusyKey ===
                                `${message.id}:${emoji}`
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleReaction(message, emoji);
                              }}
                              style={{
                                border: 0,
                                background: "transparent",
                                fontSize: 17,
                                padding: 3,
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "7px 12px",
                borderTop: "1px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#B91C1C",
                fontSize: 10,
              }}
            >
              {error}
            </div>
          )}

          {!selectionMode && (
            <div
              style={{
                position: "relative",
                padding: 12,
                borderTop: "1px solid #E5E7EB",
                background: "#FFFFFF",
              }}
            >
              {mentionOpen && filteredMentions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    bottom: "100%",
                    maxHeight: 170,
                    overflowY: "auto",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    boxShadow: "0 10px 30px rgba(15,23,42,.12)",
                    zIndex: 3,
                  }}
                >
                  {filteredMentions.map((person) => (
                    <button
                      key={person.email}
                      type="button"
                      onClick={() => addMention(person)}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        border: 0,
                        borderBottom: "1px solid #F3F4F6",
                        background: "#FFFFFF",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 900 }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: 9, color: "#6B7280" }}>
                        {person.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={draft}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft(value);
                  setMentionOpen(
                    /(?:^|\s)@[^\s@]*$/.test(value)
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    !mentionOpen
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Write a message… Use @ to mention"
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
                <span style={{ fontSize: 9, color: "#9CA3AF" }}>
                  Enter to send · Shift+Enter for a new line
                </span>

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    !draft.trim() ||
                    !normalizeEmail(senderEmail) ||
                    sending
                  }
                  style={{
                    border: 0,
                    borderRadius: 9,
                    padding: "9px 15px",
                    background:
                      !draft.trim() ||
                      !normalizeEmail(senderEmail) ||
                      sending
                        ? "#D1D5DB"
                        : "#111827",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          )}
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
