"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReactionMap = Record<string, string[]>;

type ChatMessage = {
  id: string;
  roomId: string;
  sender: string;
  senderEmail: string;
  text: string;
  createdAt: string;
  reactions: ReactionMap;
  mentions: string[];
  readBy: string[];
};

type ChatUser = {
  name: string;
  email: string;
};

type ChatRoom = {
  id: string;
  name: string;
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];
const POLL_MS = 30000;
const LIMIT = 30;

const normalizeEmail = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export default function TeamChatPopup() {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [sender, setSender] = useState("EMDC User");
  const [senderEmail, setSenderEmail] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([
    { id: "general", name: "General" },
  ]);
  const [roomId, setRoomId] = useState("general");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState("");
  const [reactionDetailsKey, setReactionDetailsKey] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 760);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    const savedRoom = localStorage.getItem("emdc-chat-room");
    if (savedRoom) setRoomId(savedRoom);
  }, []);

  useEffect(() => {
    localStorage.setItem("emdc-chat-room", roomId);
  }, [roomId]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const applyUser = (user: any) => {
      if (!active || !user) return;
      const metadata = user?.user_metadata || {};
      setSender(
        String(
          metadata?.display_name ||
            metadata?.full_name ||
            metadata?.name ||
            user?.email ||
            "EMDC User"
        ).trim()
      );
      setSenderEmail(String(user?.email || "").trim());
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) applyUser(data.user);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) applyUser(session.user);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await fetch(
        `/api/team-chat?roomId=${encodeURIComponent(roomId)}&limit=${LIMIT}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to load chat.");
      }

      setRooms(Array.isArray(json.rooms) ? json.rooms : []);
      setUsers(Array.isArray(json.users) ? json.users : []);
      setMessages(Array.isArray(json.messages) ? json.messages : []);
      setError("");
    } catch (loadError: any) {
      if (!silent) setError(loadError?.message || "Unable to load chat.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    loadMessages();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadMessages(true);
      }
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [open, roomId]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, open]);

  const mentionQuery = useMemo(() => {
    const match = draft.match(/(?:^|\s)@([^\n@]*)$/);
    return match ? String(match[1] || "").trim().toLowerCase() : "";
  }, [draft]);

  const mentionOptions = useMemo(() => {
    return users
      .filter((user) => {
        if (!mentionQuery) return true;
        return (
          user.name.toLowerCase().includes(mentionQuery) ||
          user.email.toLowerCase().includes(mentionQuery)
        );
      })
      .slice(0, 10);
  }, [mentionQuery, users]);

  const userNameByEmail = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => map.set(normalizeEmail(user.email), user.name));
    messages.forEach((message) =>
      map.set(normalizeEmail(message.senderEmail), message.sender)
    );
    return map;
  }, [users, messages]);

  const addMention = (user: ChatUser) => {
    setDraft((current) =>
      current.replace(
        /(?:^|\s)@([^\n@]*)$/,
        (matched) =>
          `${matched.startsWith(" ") ? " " : ""}@${user.name} `
      )
    );
    setMentionOpen(false);
  };

  const createRoom = async () => {
    const name = window.prompt("Enter the new group chat name:");
    if (!name?.trim()) return;

    const response = await fetch("/api/team-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-room",
        name: name.trim(),
        requesterEmail: senderEmail,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.ok) {
      setError(json?.error || "Unable to create group chat.");
      return;
    }

    setRooms(json.rooms);
    setRoomId(json.room.id);
    setMessages([]);
  };

  const sendMessage = async () => {
    const clean = draft.trim();
    if (!clean || !senderEmail || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          sender,
          senderEmail,
          text: clean,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to send message.");
      }

      setDraft("");
      setMentionOpen(false);
      setMessages(json.messages || []);
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
    const response = await fetch("/api/team-chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle-reaction",
        roomId,
        messageId: message.id,
        emoji,
        requesterEmail: senderEmail,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.ok) {
      setError(json?.error || "Unable to update reaction.");
      return;
    }

    setMessages(json.messages || []);
    setReactionPickerId("");
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected message(s)?`)) {
      return;
    }

    const response = await fetch("/api/team-chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete-selected",
        roomId,
        messageIds: selectedIds,
        requesterEmail: senderEmail,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.ok) {
      setError(json?.error || "Unable to delete messages.");
      return;
    }

    setMessages(json.messages || []);
    setSelectedIds([]);
    setSelectionMode(false);
  };

  const clearRoom = async () => {
    const password = window.prompt("Enter the chat administrator password:");
    if (password === null) return;
    if (!window.confirm("Clear all messages in this group chat?")) return;

    setClearing(true);

    try {
      const response = await fetch("/api/team-chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear-chat",
          roomId,
          adminPassword: password,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to clear chat.");
      }

      setMessages([]);
    } catch (clearError: any) {
      setError(clearError?.message || "Unable to clear chat.");
    } finally {
      setClearing(false);
    }
  };

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
              : "min(410px, calc(100vw - 24px))",
            height: mobile
              ? "min(620px, calc(100vh - 110px - env(safe-area-inset-bottom)))"
              : "min(620px, calc(100vh - 130px))",
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
              padding: 10,
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <select
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value);
                setMessages([]);
                setSelectedIds([]);
                setSelectionMode(false);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                height: 36,
                border: "1px solid #D1D5DB",
                borderRadius: 9,
                padding: "0 8px",
                fontWeight: 900,
              }}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={createRoom}
              title="Create group chat"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              +
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectionMode((value) => !value);
                setSelectedIds([]);
              }}
              style={{
                height: 36,
                padding: "0 9px",
                borderRadius: 9,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {selectionMode ? "Cancel" : "Select"}
            </button>

            <button
              type="button"
              onClick={clearRoom}
              disabled={clearing}
              style={{
                height: 36,
                padding: "0 9px",
                borderRadius: 9,
                border: "1px solid #FCA5A5",
                background: "#FFFFFF",
                color: "#B91C1C",
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {clearing ? "..." : "Clear"}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid #D1D5DB",
                background: "#F9FAFB",
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>

          {selectionMode && (
            <div
              style={{
                padding: "7px 10px",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900 }}>
                Selected: {selectedIds.length}
              </span>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={!selectedIds.length}
                style={{
                  border: 0,
                  borderRadius: 8,
                  padding: "7px 10px",
                  background: selectedIds.length ? "#B91C1C" : "#D1D5DB",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                Delete Selected
              </button>
            </div>
          )}

          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid #E5E7EB",
              background: "#F9FAFB",
              fontSize: 10,
            }}
          >
            <strong>{sender}</strong>
            <div style={{ color: "#6B7280" }}>{senderEmail}</div>
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
            {loading && !messages.length ? (
              <div style={{ textAlign: "center", color: "#6B7280" }}>
                Loading…
              </div>
            ) : !messages.length ? (
              <div style={{ textAlign: "center", color: "#6B7280" }}>
                No messages in this group yet.
              </div>
            ) : (
              messages.map((message) => {
                const mine =
                  normalizeEmail(message.senderEmail) ===
                  normalizeEmail(senderEmail);
                const selected = selectedIds.includes(message.id);
                const entries = Object.entries(message.reactions || {}).filter(
                  ([, emails]) => Array.isArray(emails) && emails.length > 0
                );

                return (
                  <div
                    key={message.id}
                    onClick={() => {
                      if (!selectionMode || !mine) return;
                      setSelectedIds((current) =>
                        current.includes(message.id)
                          ? current.filter((id) => id !== message.id)
                          : [...current, message.id]
                      );
                    }}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        maxWidth: "86%",
                        padding: "9px 11px",
                        borderRadius: mine
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        background: mine ? "#111827" : "#FFFFFF",
                        color: mine ? "#FFFFFF" : "#111827",
                        border: selected
                          ? "2px solid #3B82F6"
                          : mine
                            ? "1px solid #111827"
                            : "1px solid #E5E7EB",
                      }}
                    >
                      {!mine && (
                        <div
                          style={{
                            marginBottom: 4,
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          {message.sender}
                        </div>
                      )}

                      {(message.mentions || [])
                        .map(normalizeEmail)
                        .includes(normalizeEmail(senderEmail)) && (
                        <div
                          style={{
                            display: "inline-block",
                            marginBottom: 6,
                            padding: "3px 7px",
                            borderRadius: 999,
                            background: "#FEF3C7",
                            color: "#92400E",
                            fontSize: 9,
                            fontWeight: 900,
                          }}
                        >
                          @ Mentioned you
                        </div>
                      )}

                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          fontSize: 13,
                          lineHeight: 1.45,
                        }}
                      >
                        {message.text}
                      </div>

                      {entries.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 5,
                            marginTop: 8,
                          }}
                        >
                          {entries.map(([emoji, emails]) => {
                            const key = `${message.id}:${emoji}`;
                            const reacted = emails
                              .map(normalizeEmail)
                              .includes(normalizeEmail(senderEmail));

                            return (
                              <div key={emoji} style={{ position: "relative" }}>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setReactionDetailsKey(
                                      reactionDetailsKey === key ? "" : key
                                    );
                                  }}
                                  style={{
                                    border: reacted
                                      ? "1px solid #60A5FA"
                                      : "1px solid #D1D5DB",
                                    borderRadius: 999,
                                    padding: "4px 9px",
                                    background: reacted ? "#EFF6FF" : "#FFFFFF",
                                    color: "#111827",
                                    fontSize: 13,
                                    cursor: "pointer",
                                  }}
                                >
                                  {emoji} {emails.length}
                                </button>

                                {reactionDetailsKey === key && (
                                  <div
                                    onClick={(event) => event.stopPropagation()}
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      bottom: "calc(100% + 6px)",
                                      zIndex: 60,
                                      minWidth: 220,
                                      padding: 9,
                                      borderRadius: 10,
                                      border: "1px solid #D1D5DB",
                                      background: "#FFFFFF",
                                      color: "#111827",
                                      boxShadow:
                                        "0 14px 35px rgba(15,23,42,.18)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        marginBottom: 6,
                                        fontSize: 10,
                                        fontWeight: 900,
                                      }}
                                    >
                                      {emoji} Reacted by
                                    </div>

                                    {emails.map((email) => {
                                      const normalized = normalizeEmail(email);
                                      return (
                                        <div
                                          key={normalized}
                                          style={{
                                            padding: "6px 0",
                                            borderTop: "1px solid #F3F4F6",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 900,
                                            }}
                                          >
                                            {userNameByEmail.get(normalized) ||
                                              normalized}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 9,
                                              color: "#6B7280",
                                            }}
                                          >
                                            {normalized}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleReaction(message, emoji)
                                      }
                                      style={{
                                        width: "100%",
                                        marginTop: 7,
                                        padding: "7px 8px",
                                        borderRadius: 8,
                                        border: "1px solid #D1D5DB",
                                        background: reacted
                                          ? "#FEF2F2"
                                          : "#F9FAFB",
                                        color: reacted ? "#B91C1C" : "#111827",
                                        fontSize: 9,
                                        fontWeight: 900,
                                      }}
                                    >
                                      {reacted
                                        ? "Remove my reaction"
                                        : "Add my reaction"}
                                    </button>
                                  </div>
                                )}
                              </div>
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
                          gap: 7,
                        }}
                      >
                        <span style={{ fontSize: 8.5, opacity: 0.68 }}>
                          {formatTime(message.createdAt)}
                        </span>

                        {!selectionMode && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReactionPickerId(
                                reactionPickerId === message.id
                                  ? ""
                                  : message.id
                              );
                            }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 999,
                              border: mine
                                ? "1px solid rgba(255,255,255,.35)"
                                : "1px solid #D1D5DB",
                              background: mine
                                ? "rgba(255,255,255,.12)"
                                : "#FFFFFF",
                              fontSize: 18,
                            }}
                          >
                            😊
                          </button>
                        )}
                      </div>

                      {reactionPickerId === message.id && (
                        <div
                          style={{
                            marginTop: 7,
                            display: "flex",
                            gap: 4,
                            padding: 5,
                            borderRadius: 12,
                            border: "1px solid #D1D5DB",
                            background: "#FFFFFF",
                          }}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleReaction(message, emoji)}
                              style={{
                                width: 34,
                                height: 34,
                                border: 0,
                                borderRadius: 999,
                                background: "#FFFFFF",
                                fontSize: 23,
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
                padding: "7px 10px",
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
                padding: 10,
                borderTop: "1px solid #E5E7EB",
              }}
            >
              {mentionOpen && (
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    right: 10,
                    bottom: "100%",
                    zIndex: 50,
                    maxHeight: 210,
                    overflowY: "auto",
                    border: "1px solid #D1D5DB",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    boxShadow: "0 12px 30px rgba(15,23,42,.15)",
                  }}
                >
                  {mentionOptions.map((user) => (
                    <button
                      key={user.email}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addMention(user)}
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
                        {user.name}
                      </div>
                      <div style={{ fontSize: 9, color: "#6B7280" }}>
                        {user.email}
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
                  setMentionOpen(/(?:^|\s)@[^\n@]*$/i.test(value));
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
                placeholder="Write a message… Use @ to mention"
                style={{
                  width: "100%",
                  resize: "none",
                  border: "1px solid #D1D5DB",
                  borderRadius: 10,
                  padding: "9px 10px",
                  fontSize: 13,
                }}
              />

              <div
                style={{
                  marginTop: 7,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
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
        onClick={() => setOpen((value) => !value)}
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
          fontSize: 23,
        }}
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}
