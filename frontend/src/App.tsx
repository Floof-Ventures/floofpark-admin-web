import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminRoutes } from "./routes/adminRoutes";

const queryClient = new QueryClient();

export function App() {
  // bfcache invalidation: when the page is restored from the back-forward
  // cache (e.persisted === true), the in-memory React Query state still
  // holds the prior /me + authz results. If the user just signed out, the
  // cookie is gone but the UI would briefly show the cached "allowed"
  // state. Drop every cached query on bfcache restore so SuperadminGate
  // re-fetches /me, which will 401 → redirectToLogin.
  useEffect(() => {
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
