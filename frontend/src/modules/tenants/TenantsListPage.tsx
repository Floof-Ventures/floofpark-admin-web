import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTenants, type TenantType } from "@/api/tenants";
import { CreateTenantForm } from "./CreateTenantForm";

const BADGE_COLOR: Record<TenantType, string> = {
  business: "#0ea5e9",
  household: "#10b981",
  platform: "#a855f7",
};

// The real tenant-identity API has no server-side text search.
// type/state are server-side filters; display_name search is client-side.
export function TenantsListPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Tenants</h1>
        <button type="button" onClick={() => setShowCreate(true)}>
          Create Business Tenant
        </button>
      </div>
      {toast && (
        <div
          role="status"
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: 12,
            borderRadius: 6,
            marginTop: 12,
          }}
        >
          {toast}
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ marginLeft: 12 }}
          >
            Dismiss
          </button>
        </div>
      )}
      <input
        type="search"
        placeholder="Search tenants…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginTop: 12 }}
      />
      {isLoading && <p>Loading…</p>}
      {error && <p role="alert">Failed to load tenants.</p>}
      {showCreate && (
        <CreateTenantForm
          onClose={() => setShowCreate(false)}
          onCreated={(name, email) =>
            setToast(`Created ${name} — invite sent to ${email}`)
          }
        />
      )}
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
