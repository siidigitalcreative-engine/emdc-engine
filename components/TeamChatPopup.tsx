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
  const [showRoomList, setShowRoomList] = useState(true);
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
    setShowRoomList(false);
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

  const currentRoom =
    rooms.find((room) => room.id === roomId) ||
    rooms[0] ||
    { id: "general", name: "General" };

  const roomSummaries = useMemo(() => {
    return rooms.map((room) => {
      const roomMessages = messages.filter(
        (message) => message.roomId === room.id
      );

      const latest = roomMessages[roomMessages.length - 1];

      return {
        room,
        latest,
        preview: latest
          ? `${latest.sender}: ${latest.text}`
          : "No messages yet",
      };
    });
  }, [rooms, messages]);

  const roomInitials = (name: string) =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "GC";

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
          {showRoomList ? (
            <div
              style={{
                padding: "12px",
                borderBottom: "1px solid #E5E7EB",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  Group Chats
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: "#6B7280",
                  }}
                >
                  Select a group to open the conversation
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
                  onClick={createRoom}
                  title="Create group chat"
                  aria-label="Create group chat"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid #D1D5DB",
                    background: "#111827",
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close team chat"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: "1px solid #D1D5DB",
                    background: "#F9FAFB",
                    color: "#374151",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #E5E7EB",
                background: "#FFFFFF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomList(true);
                    setSelectionMode(false);
                    setSelectedIds([]);
                    setReactionDetailsKey("");
                    setReactionPickerId("");
                  }}
                  aria-label="Back to group chat list"
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 999,
                    border: "1px solid #D1D5DB",
                    background: "#F9FAFB",
                    color: "#111827",
                    fontSize: 20,
                    lineHeight: 1,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "block",
                      lineHeight: 1,
                      transform: "translateY(-1px)",
                    }}
                  >
                    ←
                  </span>
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentRoom.name}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      color: "#6B7280",
                    }}
                  >
                    Group conversation
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode((value) => !value);
                    setSelectedIds([]);
                  }}
                  style={{
                    height: 34,
                    padding: "0 9px",
                    borderRadius: 9,
                    border: "1px solid #D1D5DB",
                    background: selectionMode ? "#EFF6FF" : "#FFFFFF",
                    color: selectionMode ? "#1D4ED8" : "#374151",
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {selectionMode ? "Cancel" : "Select"}
                </button>

                <button
                  type="button"
                  onClick={clearRoom}
                  disabled={clearing}
                  title="Admin password required"
                  style={{
                    height: 34,
                    padding: "0 9px",
                    borderRadius: 9,
                    border: "1px solid #FCA5A5",
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: clearing ? "wait" : "pointer",
                  }}
                >
                  {clearing ? "..." : "Clear"}
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close team chat"
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: 999,
                    border: "1px solid #D1D5DB",
                    background: "#F9FAFB",
                    color: "#374151",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {showRoomList ? (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#FFFFFF",
                padding: "6px 0",
              }}
            >
              {roomSummaries.map(({ room, latest, preview }, index) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    setRoomId(room.id);
                    setShowRoomList(false);
                    setMessages([]);
                    setSelectedIds([]);
                    setSelectionMode(false);
                  }}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "46px minmax(0,1fr) auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    border: 0,
                    borderBottom: "1px solid #F3F4F6",
                    background:
                      room.id === roomId
                        ? "#F3F4F6"
                        : "#FFFFFF",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background:
                        index % 3 === 0
                          ? "linear-gradient(135deg,#FF8A65,#EF5350)"
                          : index % 3 === 1
                            ? "linear-gradient(135deg,#9CA3AF,#6B7280)"
                            : "linear-gradient(135deg,#60A5FA,#2563EB)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {roomInitials(room.name)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {room.name}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: "#6B7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {preview}
                    </div>
                  </div>

                  <div
                    style={{
                      alignSelf: "start",
                      paddingTop: 2,
                      color: "#9CA3AF",
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {latest ? formatTime(latest.createdAt) : "›"}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
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
              padding: "8px 12px",
              borderBottom: "1px solid #E5E7EB",
              background: "#F9FAFB",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 999,
                background: "#111827",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 900,
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
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sender}
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 9,
                  color: "#6B7280",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {senderEmail}
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
            {loading && !messages.length ? (
              <div style={{ textAlign: "center", color: "#6B7280" }}>
                Loading…
              </div>
            ) : !messages.length ? (
              <div
                style={{
                  minHeight: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#6B7280",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
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
                              position: "relative",
                              width: 30,
                              height: 30,
                              borderRadius: 999,
                              border: mine
                                ? "1px solid rgba(255,255,255,.35)"
                                : "1px solid #D1D5DB",
                              background: mine
                                ? "rgba(255,255,255,.12)"
                                : "#FFFFFF",
                              padding: 0,
                              cursor: "pointer",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                lineHeight: 1,
                                transform: "translate(-0.5px,-3.5px)",
                                fontFamily:
                                  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                                pointerEvents: "none",
                              }}
                            >
                              😊
                            </span>
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
                padding: 12,
                borderTop: "1px solid #E5E7EB",
                background: "#FFFFFF",
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
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#9CA3AF",
                  }}
                >
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
                    fontWeight: 900,
                  }}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          )}
            </>
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
