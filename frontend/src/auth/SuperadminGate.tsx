import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthRequiredError } from "@/api/client";
import { checkAuthz } from "@/api/authz";
import { whoami } from "@/api/whoami";
import { redirectToLogin } from "./loginRedirect";
import { NoAccessPage } from "./NoAccessPage";

export function SuperadminGate({ children }: { children: React.ReactNode }) {
  const me = useQuery({
    queryKey: ["whoami"],
    queryFn: whoami,
    retry: false,
  });

  const authz = useQuery({
    queryKey: ["authz", me.data?.email],
    enabled: !!me.data,
    retry: false,
    queryFn: () =>
      checkAuthz({
        user: `user:${me.data!.email}`,
        relation: "superadmin",
        object_type: "tenant",
        object_id: "platform",
      }),
  });

  useEffect(() => {
    if (me.error instanceof AuthRequiredError || authz.error instanceof AuthRequiredError) {
      redirectToLogin();
    }
  }, [me.error, authz.error]);

  if (me.isLoading || authz.isLoading) return <p>Loading…</p>;
  if (me.error || authz.error) return <p>Could not verify access. Try again.</p>;
  if (authz.data === false) return <NoAccessPage />;
  if (authz.data === true) return <>{children}</>;
  return null;
}
