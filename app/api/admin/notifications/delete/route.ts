import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_ENTITY_TYPES = ["auth", "system", "profile", "user"];
const SYSTEM_ACTIONS = [
  "signed in",
  "signed out",
  "changed display name",
  "requested password reset",
  "changed password",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body?.password || "");
    const mode = body?.mode === "all" ? "all" : "selected";
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (mode === "selected" && ids.length === 0) {
      return NextResponse.json({ error: "Select at least one notification." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server environment variables are incomplete." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: "You are not signed in." }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Your session is no longer valid." }, { status: 401 });
    }

    const verifyClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: passwordError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (passwordError) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRow, error: adminError } = await adminClient
      .from("emdc_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      return NextResponse.json(
        { error: "Only an EMDC administrator can delete notifications for everyone." },
        { status: 403 }
      );
    }

    let deleteIds = ids;

    if (mode === "all") {
      const { data: activityRows, error: activityError } = await adminClient
        .from("activity_logs")
        .select("id,entity_type,action")
        .order("created_at", { ascending: false });

      if (activityError) throw activityError;

      deleteIds = (activityRows || [])
        .filter((row: any) => {
          const entityType = String(row.entity_type || "").toLowerCase();
          const action = String(row.action || "").toLowerCase();
          return (
            !SYSTEM_ENTITY_TYPES.includes(entityType) &&
            !SYSTEM_ACTIONS.includes(action)
          );
        })
        .map((row: any) => String(row.id));
    }

    if (deleteIds.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    let deleted = 0;
    const chunkSize = 200;

    for (let index = 0; index < deleteIds.length; index += chunkSize) {
      const chunk = deleteIds.slice(index, index + chunkSize);
      const { error: deleteError } = await adminClient
        .from("activity_logs")
        .delete()
        .in("id", chunk);

      if (deleteError) throw deleteError;
      deleted += chunk.length;
    }

    return NextResponse.json({ deleted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to delete notifications." },
      { status: 500 }
    );
  }
}
