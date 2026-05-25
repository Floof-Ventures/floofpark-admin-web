import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTenants, type TenantType } from "@/api/tenants";
import { CreateTenantForm } from "./CreateTenantForm";

const BADGE: Record<TenantType, { bg: string; fg: string }> = {
  business: { bg: "#0369a1", fg: "#f0f9ff" },
  household: { bg: "#047857", fg: "#ecfdf5" },
  platform: { bg: "#7e22ce", fg: "#faf5ff" },
};

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
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 24px 64px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <p
            className="fp-mono"
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "var(--fp-text-faint)",
            }}
          >
            Superadmin
          </p>
          <h1
            className="fp-display"
            style={{ margin: "2px 0 0", fontSize: 28 }}
          >
            Tenants
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            padding: "9px 16px",
            borderRadius: 6,
            border: "1px solid var(--fp-accent)",
            background: "var(--fp-accent)",
            color: "var(--fp-accent-fg)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 120ms",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--fp-accent-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--fp-accent)";
          }}
        >
          <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Create Business Tenant
        </button>
      </header>

      {toast && (
        <div
          role="status"
          style={{
            background: "var(--fp-success-bg)",
            color: "var(--fp-success-fg)",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid color-mix(in srgb, var(--fp-success-fg) 30%, transparent)",
          }}
        >
          <span style={{ fontSize: 13 }}>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <input
        type="search"
        placeholder="Search tenants by display name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid var(--fp-border)",
          background: "var(--fp-surface)",
          color: "var(--fp-text)",
          fontSize: 14,
          marginBottom: 16,
        }}
      />

      {isLoading && (
        <p style={{ color: "var(--fp-text-muted)", fontSize: 13 }}>Loading…</p>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--fp-danger)", fontSize: 13 }}>
          Failed to load tenants.
        </p>
      )}

      {showCreate && (
        <CreateTenantForm
          onClose={() => setShowCreate(false)}
          onCreated={(name, email) =>
            setToast(`Created ${name} — invite sent to ${email}`)
          }
        />
      )}

      {data && (
        <div
          style={{
            border: "1px solid var(--fp-border)",
            borderRadius: 8,
            overflow: "hidden",
            background: "var(--fp-surface)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "var(--fp-surface-2)" }}>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>State</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderTop: "1px solid var(--fp-border)" }}
                >
                  <Td>
                    <Link
                      to={`/tenants/${t.id}`}
                      style={{
                        color: "var(--fp-text)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {t.display_name}
                    </Link>
                  </Td>
                  <Td>
                    <span
                      style={{
                        background: BADGE[t.type].bg,
                        color: BADGE[t.type].fg,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 10.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      {t.type}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: "var(--fp-text-muted)" }}>
                      {t.state}
                    </span>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--fp-text-muted)",
                      fontSize: 13,
                    }}
                  >
                    No tenants match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 14px",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "var(--fp-text-muted)",
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 14px" }}>{children}</td>;
}
