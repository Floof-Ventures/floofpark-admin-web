import { useState } from "react";

const LOGOUT_URL = "https://auth.floofpark.app/api/v1/auth/logout";

export function Logout() {
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
    } finally {
      window.location.assign("/login");
    }
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        marginLeft: "auto",
        background: "transparent",
        color: "#555",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        padding: "4px 12px",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
