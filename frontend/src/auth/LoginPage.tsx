import { useState } from "react";
import { apiFetch } from "@/api/client";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("https://auth.floofpark.com/api/v1/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect_to_host: "admin.floofpark.com" }),
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (sent) return <p>Check your inbox for a magic link.</p>;
  return (
    <form onSubmit={onSubmit}>
      <label>
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button type="submit">Send magic link</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
