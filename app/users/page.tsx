import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import AppTopBar from "@/components/AppTopBar";
import AppBottomNav from "@/components/AppBottomNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function loadUsers(): Promise<{ users: SimpleUser[]; error: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return {
        users: [],
        error: "NEXT_PUBLIC_SUPABASE_URL is missing from Vercel.",
      };
    }

    if (!adminKey) {
      return {
        users: [],
        error: "SUPABASE_SERVICE_ROLE_KEY is missing from the Production environment in Vercel.",
      };
    }

    const admin = createClient(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const users: SimpleUser[] = [];
    const perPage = 200;
    let page = 1;

    while (page <= 50) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

      if (error) {
        return { users: [], error: error.message || "Unable to list users." };
      }

      const batch = Array.isArray(data?.users) ? data.users : [];

      users.push(
        ...batch.map((user: any) => ({
          id: String(user.id || user.email || Math.random()),
          email: user.email || "No email",
          displayName: getDisplayName(user),
        }))
      );

      if (batch.length < perPage) break;
      page += 1;
    }

    users.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      })
    );

    return { users, error: "" };
  } catch (error: any) {
    return {
      users: [],
      error: error?.message || "Unable to load users.",
    };
  }
}

export default async function UsersPage() {
  const { users, error } = await loadUsers();

  return (
    <>
      <AppTopBar />
      <main
      style={{
        minHeight: "100vh",
        background: "#F8F9FA",
        color: "#111827",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "32px 18px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 820, margin: "0 auto" }}>

        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Users
          </h1>
          <p style={{ margin: "7px 0 0", color: "#6B7280", fontSize: 14 }}>
            {error
              ? "Unable to load users"
              : `${users.length} user${users.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 6px 24px rgba(17, 24, 39, 0.05)",
          }}
        >
          {error ? (
            <div style={{ padding: 28 }}>
              <div style={{ color: "#B91C1C", fontSize: 14, fontWeight: 800 }}>
                {error}
              </div>
              <div style={{ color: "#6B7280", fontSize: 13, marginTop: 8 }}>
                Confirm the server key is saved for Production in Vercel, then
                redeploy the project.
              </div>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 28, color: "#6B7280", fontSize: 14 }}>
              No users found.
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "17px 20px",
                  borderTop: index === 0 ? "none" : "1px solid #F0F1F3",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "#111827",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    fontSize: 15,
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  {user.displayName.trim().charAt(0) || "U"}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.displayName}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 13,
                      color: "#6B7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      </main>
      <AppBottomNav />
    </>
  );
}
