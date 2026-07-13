"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";
import AppTopBar from "@/components/AppTopBar";
import AppBottomNav from "@/components/AppBottomNav";
import {
  FeedComment,
  FeedLike,
  FeedPost,
  loadFeedData,
} from "@/lib/feed";

const COLORS = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  textSub: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
};

const timeAgo = (value: string) => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const displayNameFromUser = (user: any) =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email ||
  "EMDC User";


const normalizeImageUrl = (value: string) => {
  const url = String(value || "").trim();
  if (!url) return "";

  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?id=([^&#]+)/i,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/i,
    /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
        match[1]
      )}&sz=w1600`;
    }
  }

  return url;
};

const ImagePreview = ({
  value,
  alt,
  compact = false,
}: {
  value: string;
  alt: string;
  compact?: boolean;
}) => {
  const src = normalizeImageUrl(value);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src) return null;

  return (
    <div
      style={{
        marginTop: compact ? 9 : 0,
        border: `1px solid ${COLORS.border}`,
        borderRadius: compact ? 10 : 0,
        overflow: "hidden",
        background: COLORS.surfaceAlt,
      }}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            display: "block",
            width: "100%",
            maxHeight: compact ? 280 : 540,
            objectFit: "contain",
            background: COLORS.surfaceAlt,
          }}
        />
      ) : (
        <div
          style={{
            padding: 14,
            color: COLORS.muted,
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          Image preview could not load. Make sure the Google Drive file is set to
          <strong> Anyone with the link — Viewer</strong>.
        </div>
      )}
    </div>
  );
};

export default function FeedPage() {
  const supabase = useMemo(() => createClient(), []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likes, setLikes] = useState<FeedLike[]>([]);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [postBody, setPostBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    setError("");
    try {
      const data = await loadFeedData();
      setPosts(data.posts);
      setLikes(data.likes);
      setComments(data.comments);
    } catch (err: any) {
      setError(err?.message || "Unable to load the feed.");
    }
  };

  useEffect(() => {
    const start = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login?next=%2Ffeed";
        return;
      }

      setCurrentUser(user);
      await refresh();
      setLoading(false);
    };

    start();
  }, [supabase]);

  const createPost = async () => {
    const body = postBody.trim();
    const cleanImageUrl = imageUrl.trim();

    if (!currentUser || !body || posting) return;

    setPosting(true);
    setError("");

    const displayName = displayNameFromUser(currentUser);

    const { data, error: insertError } = await supabase
      .from("feed_posts")
      .insert({
        user_id: currentUser.id,
        display_name: displayName,
        email: currentUser.email || "",
        body,
        image_url: cleanImageUrl || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setPosting(false);
      return;
    }

    setPosts((previous) => [data as FeedPost, ...previous]);
    setPostBody("");
    setImageUrl("");
    setPosting(false);

    await logActivity({
      action: "created a feed post",
      entityType: "feed",
      entityName: body.slice(0, 70),
      description: "Team Feed",
      href: "/feed",
      metadata: { postId: data.id },
    });
  };

  const startEditPost = (post: FeedPost) => {
    if (!currentUser || post.user_id !== currentUser.id) return;
    setEditingPostId(post.id);
    setEditBody(post.body);
    setEditImageUrl(post.image_url || "");
    setError("");
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditBody("");
    setEditImageUrl("");
    setSavingEdit(false);
  };

  const saveEditedPost = async (post: FeedPost) => {
    if (!currentUser || post.user_id !== currentUser.id || savingEdit) return;

    const body = editBody.trim();
    const cleanImageUrl = editImageUrl.trim();

    if (!body) {
      setError("Post text cannot be empty.");
      return;
    }

    setSavingEdit(true);
    setError("");

    const { data: updatedRows, error: updateError } = await supabase
      .from("feed_posts")
      .update({
        body,
        image_url: cleanImageUrl || null,
      })
      .eq("id", post.id)
      .eq("user_id", currentUser.id)
      .select();

    if (updateError) {
      setError(updateError.message);
      setSavingEdit(false);
      return;
    }

    const updatedPost = Array.isArray(updatedRows)
      ? (updatedRows[0] as FeedPost | undefined)
      : undefined;

    if (!updatedPost) {
      setError("The post was not updated. Please refresh and try again.");
      setSavingEdit(false);
      return;
    }

    setPosts((previous) =>
      previous.map((item) =>
        item.id === post.id ? updatedPost : item
      )
    );

    cancelEditPost();

    await logActivity({
      action: "edited a feed post",
      entityType: "feed",
      entityName: body.slice(0, 70),
      description: "Team Feed",
      href: "/feed",
      metadata: { postId: post.id },
    });
  };

  const deletePost = async (post: FeedPost) => {
    if (!currentUser || post.user_id !== currentUser.id) return;
    if (!window.confirm("Delete this post and all of its comments?")) return;

    const { error: deleteError } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPosts((previous) => previous.filter((item) => item.id !== post.id));
    setLikes((previous) => previous.filter((item) => item.post_id !== post.id));
    setComments((previous) =>
      previous.filter((item) => item.post_id !== post.id)
    );

    await logActivity({
      action: "deleted a feed post",
      entityType: "feed",
      entityName: post.body.slice(0, 70),
      description: "Team Feed",
      href: "/feed",
    });
  };

  const toggleLike = async (post: FeedPost) => {
    if (!currentUser) return;

    const existing = likes.find(
      (like) =>
        like.post_id === post.id && like.user_id === currentUser.id
    );

    if (existing) {
      const { error: unlikeError } = await supabase
        .from("feed_likes")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", currentUser.id);

      if (unlikeError) {
        setError(unlikeError.message);
        return;
      }

      setLikes((previous) =>
        previous.filter((like) => like.id !== existing.id)
      );
      return;
    }

    const { data, error: likeError } = await supabase
      .from("feed_likes")
      .insert({
        post_id: post.id,
        user_id: currentUser.id,
      })
      .select()
      .single();

    if (likeError) {
      setError(likeError.message);
      return;
    }

    setLikes((previous) => [...previous, data as FeedLike]);
  };

  const addComment = async (post: FeedPost) => {
    if (!currentUser) return;

    const body = String(commentDrafts[post.id] || "").trim();
    if (!body) return;

    const displayName = displayNameFromUser(currentUser);

    const { data, error: commentError } = await supabase
      .from("feed_comments")
      .insert({
        post_id: post.id,
        user_id: currentUser.id,
        display_name: displayName,
        email: currentUser.email || "",
        body,
      })
      .select()
      .single();

    if (commentError) {
      setError(commentError.message);
      return;
    }

    setComments((previous) => [...previous, data as FeedComment]);
    setCommentDrafts((previous) => ({ ...previous, [post.id]: "" }));
    setExpandedComments((previous) => ({ ...previous, [post.id]: true }));

    await logActivity({
      action: "commented on a feed post",
      entityType: "feed",
      entityName: post.body.slice(0, 70),
      description: body.slice(0, 120),
      href: "/feed",
      metadata: { postId: post.id, commentId: data.id },
    });
  };

  const deleteComment = async (comment: FeedComment) => {
    if (!currentUser || comment.user_id !== currentUser.id) return;

    const { error: deleteError } = await supabase
      .from("feed_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setComments((previous) =>
      previous.filter((item) => item.id !== comment.id)
    );
  };

  return (
    <>
      <AppTopBar />
      <main
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "Inter,system-ui,sans-serif",
        padding: "20px 12px 56px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.1 }}>Team Feed</h1>
          <p style={{ margin: "6px 0 0", color: COLORS.muted, fontSize: 12 }}>
            Share updates, images, likes, and comments with the team.
          </p>
        </div>

        <section
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 10px 30px rgba(15,23,42,.05)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: COLORS.text,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {displayNameFromUser(currentUser).charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                value={postBody}
                onChange={(event) => setPostBody(event.target.value)}
                placeholder="Share an update with your team..."
                rows={4}
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: 96,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 12,
                  color: COLORS.text,
                  font: "inherit",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Optional image URL or Google Drive link"
                style={{
                  width: "100%",
                  height: 40,
                  marginTop: 9,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "0 12px",
                  color: COLORS.text,
                  font: "inherit",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {imageUrl.trim() && (
                <ImagePreview
                  value={imageUrl}
                  alt="New post image preview"
                  compact
                />
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  onClick={createPost}
                  disabled={!postBody.trim() || posting}
                  style={{
                    height: 40,
                    padding: "0 20px",
                    border: "none",
                    borderRadius: 10,
                    background: COLORS.text,
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 900,
                    cursor:
                      !postBody.trim() || posting ? "not-allowed" : "pointer",
                    opacity: !postBody.trim() || posting ? 0.45 : 1,
                  }}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: COLORS.muted,
              fontSize: 13,
            }}
          >
            Loading feed…
          </div>
        ) : posts.length === 0 ? (
          <div
            style={{
              marginTop: 14,
              padding: 36,
              textAlign: "center",
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              color: COLORS.muted,
              fontSize: 13,
            }}
          >
            No posts yet. Share the first team update.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            {posts.map((post) => {
              const postLikes = likes.filter(
                (like) => like.post_id === post.id
              );
              const postComments = comments.filter(
                (comment) => comment.post_id === post.id
              );
              const likedByCurrentUser = postLikes.some(
                (like) => like.user_id === currentUser?.id
              );
              const showComments =
                expandedComments[post.id] || postComments.length <= 2;
              const visibleComments = showComments
                ? postComments
                : postComments.slice(-2);

              return (
                <article
                  key={post.id}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(15,23,42,.04)",
                  }}
                >
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: COLORS.text,
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {(post.display_name || post.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: COLORS.text,
                          }}
                        >
                          {post.display_name || post.email || "EMDC User"}
                        </div>
                        <div
                          title={new Date(post.created_at).toLocaleString(
                            "en-PH"
                          )}
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: COLORS.faint,
                          }}
                        >
                          {timeAgo(post.created_at)}
                        </div>
                      </div>

                      {post.user_id === currentUser?.id && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => startEditPost(post)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: COLORS.textSub,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePost(post)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#DC2626",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {editingPostId === post.id ? (
                      <div style={{ marginTop: 13 }}>
                        <textarea
                          value={editBody}
                          onChange={(event) => setEditBody(event.target.value)}
                          rows={4}
                          style={{
                            width: "100%",
                            resize: "vertical",
                            minHeight: 96,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: 12,
                            color: COLORS.text,
                            font: "inherit",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />

                        <input
                          value={editImageUrl}
                          onChange={(event) => setEditImageUrl(event.target.value)}
                          placeholder="Optional image URL or Google Drive link"
                          style={{
                            width: "100%",
                            height: 40,
                            marginTop: 9,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "0 12px",
                            color: COLORS.text,
                            font: "inherit",
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />

                        {editImageUrl.trim() && (
                          <ImagePreview
                            value={editImageUrl}
                            alt="Edited post image preview"
                            compact
                          />
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            marginTop: 10,
                          }}
                        >
                          <button
                            type="button"
                            onClick={cancelEditPost}
                            disabled={savingEdit}
                            style={{
                              height: 36,
                              padding: "0 14px",
                              borderRadius: 9,
                              border: `1px solid ${COLORS.border}`,
                              background: COLORS.surface,
                              color: COLORS.textSub,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: savingEdit ? "not-allowed" : "pointer",
                            }}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => saveEditedPost(post)}
                            disabled={!editBody.trim() || savingEdit}
                            style={{
                              height: 36,
                              padding: "0 14px",
                              borderRadius: 9,
                              border: "none",
                              background: COLORS.text,
                              color: "#FFFFFF",
                              fontSize: 11,
                              fontWeight: 900,
                              cursor:
                                !editBody.trim() || savingEdit
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: !editBody.trim() || savingEdit ? 0.45 : 1,
                            }}
                          >
                            {savingEdit ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 13,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          fontSize: 14,
                          lineHeight: 1.55,
                          color: COLORS.textSub,
                        }}
                      >
                        {post.body}
                      </div>
                    )}
                  </div>

                  {post.image_url && editingPostId !== post.id && (
                    <div
                      style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <ImagePreview
                        value={post.image_url}
                        alt="Feed attachment"
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      color: COLORS.muted,
                      fontSize: 11,
                    }}
                  >
                    <span>
                      {postLikes.length}{" "}
                      {postLikes.length === 1 ? "like" : "likes"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((previous) => ({
                          ...previous,
                          [post.id]: true,
                        }))
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        color: COLORS.muted,
                        font: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {postComments.length}{" "}
                      {postComments.length === 1 ? "comment" : "comments"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      borderTop: `1px solid ${COLORS.border}`,
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLike(post)}
                      style={{
                        height: 42,
                        border: "none",
                        borderRight: `1px solid ${COLORS.border}`,
                        background: likedByCurrentUser
                          ? "#F3F4F6"
                          : COLORS.surface,
                        color: likedByCurrentUser
                          ? "#DC2626"
                          : COLORS.textSub,
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {likedByCurrentUser ? "♥ Liked" : "♡ Like"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((previous) => ({
                          ...previous,
                          [post.id]: true,
                        }))
                      }
                      style={{
                        height: 42,
                        border: "none",
                        background: COLORS.surface,
                        color: COLORS.textSub,
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Comment
                    </button>
                  </div>

                  <div style={{ padding: 14 }}>
                    {!showComments && postComments.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments((previous) => ({
                            ...previous,
                            [post.id]: true,
                          }))
                        }
                        style={{
                          marginBottom: 10,
                          border: "none",
                          background: "transparent",
                          color: COLORS.muted,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        View all {postComments.length} comments
                      </button>
                    )}

                    <div style={{ display: "grid", gap: 9 }}>
                      {visibleComments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              background: "#374151",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 900,
                              flexShrink: 0,
                            }}
                          >
                            {(comment.display_name || comment.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                              background: COLORS.surfaceAlt,
                              borderRadius: 12,
                              padding: "8px 10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 11,
                                  color: COLORS.text,
                                }}
                              >
                                {comment.display_name ||
                                  comment.email ||
                                  "EMDC User"}
                              </strong>

                              {comment.user_id === currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => deleteComment(comment)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#DC2626",
                                    fontSize: 10,
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                color: COLORS.textSub,
                                fontSize: 12,
                                lineHeight: 1.45,
                              }}
                            >
                              {comment.body}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: COLORS.faint,
                                fontSize: 9,
                              }}
                            >
                              {timeAgo(comment.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: postComments.length ? 12 : 0,
                      }}
                    >
                      <input
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((previous) => ({
                            ...previous,
                            [post.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            addComment(post);
                          }
                        }}
                        placeholder="Write a comment..."
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: 38,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 999,
                          padding: "0 13px",
                          font: "inherit",
                          fontSize: 12,
                          color: COLORS.text,
                          outline: "none",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => addComment(post)}
                        disabled={!String(commentDrafts[post.id] || "").trim()}
                        style={{
                          height: 38,
                          padding: "0 14px",
                          border: "none",
                          borderRadius: 999,
                          background: COLORS.text,
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: !String(
                            commentDrafts[post.id] || ""
                          ).trim()
                            ? "not-allowed"
                            : "pointer",
                          opacity: !String(
                            commentDrafts[post.id] || ""
                          ).trim()
                            ? 0.4
                            : 1,
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      </main>
      <AppBottomNav />
    </>
  );
}
