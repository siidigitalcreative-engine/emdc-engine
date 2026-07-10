import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SimpleUser = {
  id: string;
  email: string;
  displayName: string;
};

function getDisplayName(user: any) {
  const metadata = user?.user_metadata || {};
  return (
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "Unnamed user"
  );
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server environment variables are incomplete." },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // This read-only route does not need to write refreshed cookies.
        },
      },
    });

    const {
      data: { user: signedInUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !signedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const users: SimpleUser[] = [];
    const perPage = 200;
    let page = 1;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const batch = data.users || [];
      users.push(
        ...batch.map((user) => ({
          id: user.id,
          email: user.email || "No email",
          displayName: getDisplayName(user),
        }))
      );

      if (batch.length < perPage) break;
      page += 1;
    }

    users.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
    );

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to load users." },
      { status: 500 }
    );
  }
}
