import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const CONSUME_URL = "https://auth.floofpark.app/api/v1/auth/magic-link/consume";

export function MagicLinkConsumePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const returnTo = params.get("return_to") ?? "/tenants";
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing magic-link token.");
    }
  }, [token]);

  async function onClick() {
    if (!token) return;
    setStatus("loading");
    try {
      const body = new URLSearchParams({ token });
      const res = await fetch(CONSUME_URL, {
        method: "POST",
        credentials: "include",  // Set-Cookie lands in browser cookie jar
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });
      if (!res.ok) throw new Error(`consume failed: ${res.status}`);
      // The cookie is now set. Discard the JSON body (the token is also stored
      // server-side via the cookie). Navigate to the target.
      const target = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/tenants";
      navigate(target, { replace: true });
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sign in to FloofPark</h1>
      {status === "error" ? (
        <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>
      ) : (
        <>
          <p style={{ color: "#555", marginBottom: 24 }}>Click the button below to finish signing in.</p>
          <button
            onClick={onClick}
            disabled={!token || status === "loading"}
            style={{
              background: "#2563eb", color: "#fff", padding: "14px 32px", border: 0,
              borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%",
            }}
          >
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>
          <p style={{ fontSize: 12, color: "#999", marginTop: 24 }}>This link expires in 15 minutes.</p>
        </>
      )}
    </main>
  );
}
