import { createClient } from "@/lib/supabase/client";

export type FeedPost = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export type FeedLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type FeedComment = {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  email: string;
  body: string;
  created_at: string;
};

export async function loadFeedData() {
  const supabase = createClient();

  const [postsResult, likesResult, commentsResult] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("feed_likes").select("*"),
    supabase
      .from("feed_comments")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;

  return {
    posts: (postsResult.data || []) as FeedPost[],
    likes: (likesResult.data || []) as FeedLike[],
    comments: (commentsResult.data || []) as FeedComment[],
  };
}
