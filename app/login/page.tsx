"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function signInWithPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (error: any) {
      setMessageType("error");
      setMessage(error?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!email.trim()) {
      setMessageType("error");
      setMessage("Enter your email address first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;

      setMessageType("success");
      setMessage("Password reset email sent. Open the newest email from Supabase.");
    } catch (error: any) {
      setMessageType("error");
      setMessage(error?.message || "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>EMDC</div>
        <p style={styles.eyebrow}>EMDC ENGINE</p>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Access SKU Storage, Product Hub, calendars, and internal tools.</p>


        <form onSubmit={signInWithPassword} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
            />
          </label>

          <button type="button" onClick={sendPasswordReset} disabled={loading} style={styles.forgotButton}>
            Forgot password?
          </button>

          {message ? (
            <div style={messageType === "success" ? styles.success : styles.error}>{message}</div>
          ) : null}

          <button type="submit" disabled={loading} style={styles.signInButton}>
            {loading ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <p style={styles.note}>Public QR product pages remain accessible without signing in.</p>
      </section>
    </main>
  );
}

function LoginLoading() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>EMDC</div>
        <p style={styles.eyebrow}>EMDC ENGINE</p>
        <h1 style={styles.title}>Loading…</h1>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "linear-gradient(145deg, #F8FAFC 0%, #EEF2F7 100%)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: "34px 32px",
    boxSizing: "border-box",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
  },
  logo: {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    borderRadius: 13,
    background: "#111827",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: ".04em",
  },
  eyebrow: { margin: "20px 0 6px", color: "#6B7280", fontSize: 11, fontWeight: 800, letterSpacing: ".12em" },
  title: { margin: 0, color: "#111827", fontSize: 30, lineHeight: 1.15 },
  subtitle: { margin: "10px 0 24px", color: "#6B7280", fontSize: 14, lineHeight: 1.55 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  label: { display: "flex", flexDirection: "column", gap: 7, color: "#374151", fontSize: 13, fontWeight: 700 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    background: "#FFFFFF",
    color: "#111827",
    fontSize: 14,
    outline: "none",
  },
  forgotButton: {
    alignSelf: "flex-end",
    padding: 0,
    border: 0,
    background: "transparent",
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: { padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", color: "#B91C1C", fontSize: 13, lineHeight: 1.45 },
  success: { padding: "10px 12px", borderRadius: 9, background: "#F0FDF4", color: "#166534", fontSize: 13, lineHeight: 1.45 },
  signInButton: {
    width: "100%",
    marginTop: 2,
    padding: "12px 14px",
    border: 0,
    borderRadius: 10,
    background: "#111827",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  note: { margin: "22px 0 0", color: "#9CA3AF", fontSize: 12, lineHeight: 1.5, textAlign: "center" },
};
