import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getTenant,
  listMemberships,
  type BusinessCategory,
  type Membership,
  type MembershipState,
  type Tenant,
  type TenantState,
  type TenantType,
} from "@/api/tenants";

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

// Mirrors TenantsListPage so admin pages read with one visual language.
const TYPE_BADGE: Record<TenantType, { bg: string; fg: string }> = {
  business: { bg: "#0369a1", fg: "#f0f9ff" },
  household: { bg: "#047857", fg: "#ecfdf5" },
  platform: { bg: "#7e22ce", fg: "#faf5ff" },
};

const STATE_TONE: Record<TenantState | MembershipState, {
  fg: string;
  bg: string;
  ring: string;
}> = {
  active: {
    fg: "var(--fp-success-fg)",
    bg: "var(--fp-success-bg)",
    ring: "color-mix(in srgb, var(--fp-success-fg) 30%, transparent)",
  },
  suspended: {
    fg: "var(--fp-accent)",
    bg: "color-mix(in srgb, var(--fp-accent) 12%, transparent)",
    ring: "color-mix(in srgb, var(--fp-accent) 35%, transparent)",
  },
  archived: {
    fg: "var(--fp-text-faint)",
    bg: "var(--fp-surface-2)",
    ring: "var(--fp-border)",
  },
  purged: {
    fg: "var(--fp-danger)",
    bg: "color-mix(in srgb, var(--fp-danger) 12%, transparent)",
    ring: "color-mix(in srgb, var(--fp-danger) 30%, transparent)",
  },
  invited: {
    fg: "var(--fp-text-muted)",
    bg: "var(--fp-surface-2)",
    ring: "var(--fp-border)",
  },
  removed: {
    fg: "var(--fp-text-faint)",
    bg: "var(--fp-surface-2)",
    ring: "var(--fp-border)",
  },
};

function StatePill({ state }: { state: TenantState | MembershipState }) {
  const tone = STATE_TONE[state] ?? STATE_TONE.active;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
        border: `1px solid ${tone.ring}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5, height: 5, borderRadius: "50%", background: tone.fg,
        }}
      />
      {state.replace(/_/g, " ")}
    </span>
  );
}

function TypeBadge({ type }: { type: TenantType }) {
  const t = TYPE_BADGE[type] ?? TYPE_BADGE.business;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: 600,
      }}
    >
      {type}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="fp-mono"
      style={{
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: "var(--fp-text-faint)",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

function ServiceChip({ slug }: { slug: BusinessCategory | string }) {
  const label = CATEGORY_LABELS[slug as BusinessCategory] ?? slug;
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 11px",
        borderRadius: 999,
        background: "color-mix(in srgb, var(--fp-accent) 10%, transparent)",
        color: "var(--fp-accent)",
        border: "1px solid color-mix(in srgb, var(--fp-accent) 25%, transparent)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

function formatCreatedAt(iso: string): string {
  return iso.slice(0, 10);
}

function memberPrimary(m: Membership): string {
  return m.user?.display_name ?? m.user?.email ?? m.user_id;
}

function memberSecondary(m: Membership): string | null {
  if (!m.user) return null;
  // If display_name is missing, the email is already shown as primary.
  return m.user.display_name ? m.user.email : null;
}

function memberInitials(m: Membership): string {
  const name = m.user?.display_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const email = m.user?.email ?? m.user_id;
  return email.slice(0, 2).toUpperCase();
}

export function TenantDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const tenantQuery = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  });
  const membersQuery = useQuery({
    queryKey: ["tenant-memberships", id],
    queryFn: () => listMemberships(id),
    enabled: !!id,
  });

  if (tenantQuery.isLoading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ color: "var(--fp-text-muted)", fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (tenantQuery.error) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <p role="alert" style={{ color: "var(--fp-danger)", fontSize: 13 }}>
          Failed to load tenant.
        </p>
      </div>
    );
  }
  const data: Tenant | undefined = tenantQuery.data;
  if (!data) return null;

  const categories = data.metadata?.business_categories ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "28px 24px 80px",
      }}
    >
      {/* Eyebrow row */}
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
        <Link
          to="/tenants"
          style={{
            color: "inherit",
            textDecoration: "none",
            borderBottom: "1px solid color-mix(in srgb, var(--fp-text-faint) 40%, transparent)",
          }}
        >
          ← All tenants
        </Link>
      </p>

      {/* Identity card */}
      <section
        style={{
          marginTop: 18,
          border: "1px solid var(--fp-border)",
          borderRadius: 10,
          background: "var(--fp-surface)",
          padding: "26px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle accent stripe at top so the card has a definite anchor */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, var(--fp-accent), color-mix(in srgb, var(--fp-accent) 0%, transparent))",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 0", minWidth: 240 }}>
            <h1
              className="fp-display"
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.1,
                color: "var(--fp-text)",
              }}
            >
              {data.display_name}
            </h1>
            {data.legal_name && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "var(--fp-text-muted)",
                  fontStyle: "italic",
                }}
              >
                {data.legal_name}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <TypeBadge type={data.type} />
            <StatePill state={data.state} />
          </div>
        </div>

        {/* Definition grid */}
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px 28px",
          }}
        >
          <Definition label="ID">
            <code className="fp-mono" style={{ fontSize: 12 }}>{data.id}</code>
          </Definition>
          <Definition label="Slug">
            <code className="fp-mono" style={{ fontSize: 12 }}>{data.slug}</code>
          </Definition>
          <Definition label="Created">
            <span style={{ fontSize: 13 }}>{formatCreatedAt(data.created_at)}</span>
          </Definition>
        </div>

        {categories.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <Label>Service offerings</Label>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {categories.map((slug) => (
                <ServiceChip key={slug} slug={slug} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Members section */}
      <section
        style={{
          marginTop: 28,
          border: "1px solid var(--fp-border)",
          borderRadius: 10,
          background: "var(--fp-surface)",
          overflow: "hidden",
        }}
        aria-labelledby="members-heading"
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            background: "var(--fp-surface-2)",
            borderBottom: "1px solid var(--fp-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2
              id="members-heading"
              className="fp-display"
              style={{ margin: 0, fontSize: 16, fontWeight: 600 }}
            >
              Members
            </h2>
            <span
              className="fp-mono"
              style={{
                fontSize: 11,
                color: "var(--fp-text-faint)",
                letterSpacing: 0.4,
              }}
            >
              {membersQuery.isLoading ? "…" : `${members.length}`}
            </span>
          </div>
        </header>

        {membersQuery.error && (
          <p
            role="alert"
            style={{
              margin: 0,
              padding: "16px 22px",
              color: "var(--fp-danger)",
              fontSize: 13,
            }}
          >
            Failed to load members.
          </p>
        )}
        {membersQuery.isLoading && (
          <p
            style={{
              margin: 0,
              padding: "16px 22px",
              color: "var(--fp-text-muted)",
              fontSize: 13,
            }}
          >
            Loading…
          </p>
        )}
        {!membersQuery.isLoading && !membersQuery.error && members.length === 0 && (
          <p
            style={{
              margin: 0,
              padding: "20px 22px",
              color: "var(--fp-text-muted)",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            No members yet.
          </p>
        )}
        {members.length > 0 && (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {members.map((m, i) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 22px",
                  borderTop: i === 0 ? "none" : "1px solid var(--fp-border)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "var(--fp-surface-2)",
                    border: "1px solid var(--fp-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--fp-text-muted)",
                    letterSpacing: 0.5,
                    flexShrink: 0,
                  }}
                >
                  {memberInitials(m)}
                </span>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--fp-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {memberPrimary(m)}
                  </div>
                  {memberSecondary(m) && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fp-text-muted)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {memberSecondary(m)}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="fp-mono"
                    style={{
                      fontSize: 10.5,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: "var(--fp-text-faint)",
                      fontWeight: 600,
                    }}
                  >
                    {m.role}
                  </span>
                  <StatePill state={m.state} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity placeholder */}
      <section style={{ marginTop: 28 }}>
        <Label>Recent activity</Label>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: "var(--fp-text-muted)",
            fontStyle: "italic",
          }}
        >
          Audit timeline coming in Wave 0.5.
        </p>
      </section>
    </div>
  );
}

function Definition({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ marginTop: 4, color: "var(--fp-text)" }}>{children}</div>
    </div>
  );
}
