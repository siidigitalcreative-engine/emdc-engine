import { createClient } from "@/lib/supabase/client";

export type ActivityInput = {
  action: string;
  entityType?: string;
  entityName?: string;
  description?: string;
  href?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "EMDC User";

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      display_name: displayName,
      email: user.email || "",
      action: input.action,
      entity_type: input.entityType || null,
      entity_name: input.entityName || null,
      description: input.description || null,
      href: input.href || null,
      metadata: input.metadata || {},
    });
  } catch {
    // Activity logging must never block the main EMDC workflow.
  }
}
