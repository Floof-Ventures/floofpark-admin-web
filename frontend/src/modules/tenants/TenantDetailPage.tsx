import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTenant } from "@/api/tenants";

export function TenantDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p role="alert">Failed to load tenant.</p>;
  if (!data) return null;

  return (
    <div>
      <p>
        <Link to="/tenants">← All tenants</Link>
      </p>
      <h1>{data.display_name}</h1>
      <p>
        id: <code>{data.id}</code> · type: <strong>{data.type}</strong> · state:{" "}
        <strong>{data.state}</strong>
      </p>
      {data.legal_name && (
        <p>Legal name: {data.legal_name}</p>
      )}
      <hr style={{ margin: "24px 0" }} />
      <section>
        <h2>Members</h2>
        <p>
          <em>
            Members coming in Wave 0.5 — requires GET /tenants/&#123;id&#125;/members in
            tenant-identity.
          </em>
        </p>
      </section>
      <section>
        <h2>Recent activity</h2>
        <p>
          <em>Audit timeline coming in Wave 0.5.</em>
        </p>
      </section>
    </div>
  );
}
