import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthRequiredError } from "@/api/client";
import { checkAuthz } from "@/api/authz";
import { clearToken, getToken } from "./tokenStorage";
import { decodeClaims, isExpired } from "./jwtClaims";
import { redirectToLogin } from "./loginRedirect";
import { NoAccessPage } from "./NoAccessPage";

export function SuperadminGate({ children }: { children: React.ReactNode }) {
  const claims = useMemo(() => {
    const token = getToken();
    if (!token) return null;
    const c = decodeClaims(token);
    if (!c) return null;
    if (isExpired(c)) {
      clearToken();
      return null;
    }
    return c;
  }, []);

  const authz = useQuery({
    queryKey: ["authz", claims?.user_id],
    enabled: !!claims,
    retry: false,
    queryFn: () =>
      checkAuthz({
        user: `user:${claims!.user_id}`,
        relation: "superadmin",
        object_type: "tenant",
        object_id: "platform",
      }),
  });

  useEffect(() => {
    if (!claims) {
      redirectToLogin();
      return;
    }
    if (authz.error instanceof AuthRequiredError) {
      redirectToLogin();
    }
  }, [claims, authz.error]);

  if (!claims) return null;
  if (authz.isLoading) return <p>Loading…</p>;
  if (authz.error) return <p>Could not verify access. Try again.</p>;
  if (authz.data === false) return <NoAccessPage />;
  if (authz.data === true) return <>{children}</>;
  return null;
}
