import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTenants, type TenantType } from "@/api/tenants";

const BADGE_COLOR: Record<TenantType, string> = {
  business: "#0ea5e9",
  household: "#10b981",
  platform: "#a855f7",
};

// The real tenant-identity API has no server-side text search.
// type/state are server-side filters; display_name search is client-side.
export function TenantsListPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants({ limit: 50 }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.tenants;
    return data.tenants.filter((t) =>
      t.display_name.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <h1>Tenants</h1>
      <input
        type="search"
        placeholder="Search tenants…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading && <p>Loading…</p>}
      {error && <p role="alert">Failed to load tenants.</p>}
      {data && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Name</th>
              <th style={{ textAlign: "left" }}>Type</th>
              <th style={{ textAlign: "left" }}>State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td>
                  <Link to={`/tenants/${t.id}`}>{t.display_name}</Link>
                </td>
                <td>
                  <span
                    style={{
                      background: BADGE_COLOR[t.type],
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {t.type}
                  </span>
                </td>
                <td>{t.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
