const REFRESH_URL = "https://auth.floofpark.app/api/v1/auth/refresh";

let inflight: Promise<boolean> | null = null;

export function tryRefresh(): Promise<boolean> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(REFRESH_URL, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Allow next refresh attempt after this one resolves
      setTimeout(() => { inflight = null; }, 0);
    }
  })();
  return inflight;
}
