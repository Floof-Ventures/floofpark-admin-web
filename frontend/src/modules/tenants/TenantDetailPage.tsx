import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTenant, type BusinessCategory } from "@/api/tenants";

const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  daycare: "Daycare",
  boarding: "Boarding",
  grooming: "Grooming",
  training: "Training",
  space_booking: "Space booking",
  retail: "Retail",
  rental: "Rental",
  custom: "Custom",
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  margin: "0 6px 6px 0",
  borderRadius: 999,
  background: "rgba(99, 102, 241, 0.12)",
  color: "#a5b4fc",
  fontSize: "0.85em",
  fontWeight: 500,
};

function formatCreatedAt(iso: string): string {
  // Show just the date portion; ISO strings always start "YYYY-MM-DD".
  return iso.slice(0, 10);
}

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

  const categories = data.metadata?.business_categories ?? [];

  return (
    <div>
      <p>
        <Link to="/tenants">← All tenants</Link>
      </p>
      <h1>{data.display_name}</h1>
      <p>
        id: <code>{data.id}</code> · slug: <code>{data.slug}</code> · type:{" "}
        <strong>{data.type}</strong> · state: <strong>{data.state}</strong>
      </p>
      {data.legal_name && (
        <p>Legal name: {data.legal_name}</p>
      )}
      <p style={{ opacity: 0.7 }}>Created: {formatCreatedAt(data.created_at)}</p>
      {categories.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "0.9em", opacity: 0.7 }}>
            Service offerings
          </h3>
          <div>
            {categories.map((slug) => (
              <span key={slug} style={chipStyle}>
                {CATEGORY_LABELS[slug] ?? slug}
              </span>
            ))}
          </div>
        </section>
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
