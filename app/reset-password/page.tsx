"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Checking your recovery link…");
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function prepareRecoverySession() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !error.message.toLowerCase().includes("code verifier")) {
            throw error;
          }

          url.searchParams.delete("code");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!active) return;

        if (data.session) {
          setReady(true);
          setMessage("");
          return;
        }

        const timeout = window.setTimeout(async () => {
          const { data: delayedData } = await supabase.auth.getSession();
          if (!active) return;

          if (delayedData.session) {
            setReady(true);
            setMessage("");
          } else {
            setMessageType("error");
            setMessage("This recovery link is invalid or expired. Request a new reset email from the sign-in page.");
          }
        }, 1200);

        return () => window.clearTimeout(timeout);
      } catch (error: any) {
        if (!active) return;
        setMessageType("error");
        setMessage(error?.message || "Unable to verify the recovery link.");
      }
    }

    const cleanupPromise = prepareRecoverySession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setReady(true);
        setMessage("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      void cleanupPromise;
    };
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessageType("error");
      setMessage("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessageType("success");
      setMessage("Password updated. Redirecting to EMDC Engine…");
      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 900);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error?.message || "Unable to update the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>EMDC</div>
        <p style={styles.eyebrow}>EMDC ENGINE</p>
        <h1 style={styles.title}>Set a new password</h1>
        <p style={styles.subtitle}>Create a new password for your EMDC account.</p>

        {ready ? (
          <form onSubmit={updatePassword} style={styles.form}>
            <label style={styles.label}>
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={styles.input}
              />
            </label>

            {message ? <div style={messageType === "success" ? styles.success : styles.error}>{message}</div> : null}

            <button type="submit" disabled={loading} style={styles.primaryButton}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        ) : (
          <>
            <div style={messageType === "error" ? styles.error : styles.info}>{message}</div>
            {messageType === "error" ? (
              <button type="button" onClick={() => router.replace("/login")} style={styles.secondaryButton}>
                Back to sign in
              </button>
            ) : null}
          </>
        )}
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
  info: { padding: "10px 12px", borderRadius: 9, background: "#F8FAFC", color: "#475569", fontSize: 13, lineHeight: 1.45 },
  error: { padding: "10px 12px", borderRadius: 9, background: "#FEF2F2", color: "#B91C1C", fontSize: 13, lineHeight: 1.45 },
  success: { padding: "10px 12px", borderRadius: 9, background: "#F0FDF4", color: "#166534", fontSize: 13, lineHeight: 1.45 },
  primaryButton: {
    width: "100%",
    padding: "12px 14px",
    border: 0,
    borderRadius: 10,
    background: "#111827",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    background: "#FFFFFF",
    color: "#111827",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
