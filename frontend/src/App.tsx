import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminRoutes } from "./routes/adminRoutes";

const queryClient = new QueryClient();

// Legacy localStorage key from the pre-Phase-4 Bearer-token flow. The whole
// tokenStorage module was deleted; this is just cleanup for browsers that
// visited the old bundle and still have a stale JWT sitting there. Drop the
// key once on app boot — nothing reads it anymore.
const LEGACY_LS_KEY = "floofpark_admin_access_token";

export function App() {
  // bfcache invalidation: when the page is restored from the back-forward
  // cache (e.persisted === true), the in-memory React Query state still
  // holds the prior /me + authz results. If the user just signed out, the
  // cookie is gone but the UI would briefly show the cached "allowed"
  // state. Drop every cached query on bfcache restore so SuperadminGate
  // re-fetches /me, which will 401 → redirectToLogin.
  useEffect(() => {
    try { localStorage.removeItem(LEGACY_LS_KEY); } catch { /* ignore */ }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) queryClient.clear();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
