import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBusinessTenant, type BusinessCategory } from "@/api/tenants";

// users.id is VARCHAR(36) in tenant-identity — reject longer emails before
// hitting the server (see memory feedback_users_id_varchar36). The schema
// widening is tracked separately; this guard surfaces the cap clearly.
const MAX_OWNER_EMAIL_LEN = 36;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

const CATEGORY_OPTIONS: ReadonlyArray<{
  value: BusinessCategory;
  label: string;
  blurb: string;
}> = [
  { value: "daycare", label: "Daycare", blurb: "Day-only animal care" },
  { value: "boarding", label: "Boarding", blurb: "Overnight stays" },
  { value: "grooming", label: "Grooming", blurb: "Bath, full groom, nails" },
  { value: "training", label: "Training", blurb: "Group or 1-on-1 sessions" },
  {
    value: "space_booking",
    label: "Space booking",
    blurb: "Rents facility space to external customers",
  },
  { value: "retail", label: "Retail", blurb: "Sells physical goods" },
  { value: "rental", label: "Rental", blurb: "Loans items that return" },
  { value: "custom", label: "Custom", blurb: "Escape hatch for anything else" },
];

export interface CreateTenantFormProps {
  onClose: () => void;
  onCreated: (tenantDisplayName: string, ownerEmail: string) => void;
}

const inputClass =
  "block w-full rounded-md px-3 py-2 text-sm transition " +
  "border border-[var(--fp-border)] bg-[var(--fp-surface)] " +
  "text-[var(--fp-text)] placeholder-[var(--fp-text-faint)] " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--fp-accent)] " +
  "focus:border-[var(--fp-accent)]";

const labelClass =
  "block text-sm font-medium text-[var(--fp-text)] mb-1.5";

const helperClass = "text-xs text-[var(--fp-text-muted)] mt-1";

const errorClass = "text-xs text-[var(--fp-danger)] mt-1";

export function CreateTenantForm({
  onClose,
  onCreated,
}: CreateTenantFormProps) {
  const queryClient = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const effectiveSlug = slugEdited ? slug : slugify(displayName);

  const validation = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!legalName.trim()) errs.legal_name = "Required";
    if (!displayName.trim()) errs.display_name = "Required";
    if (!effectiveSlug) errs.slug = "Required";
    else if (!SLUG_PATTERN.test(effectiveSlug))
      errs.slug = "Lowercase letters, digits, and dashes only";
    if (categories.length === 0)
      errs.categories = "Pick at least one category";
    if (!ownerEmail.trim()) errs.invite_owner_email = "Required";
    else if (!EMAIL_PATTERN.test(ownerEmail.trim()))
      errs.invite_owner_email = "Enter a valid email";
    else if (ownerEmail.trim().length > MAX_OWNER_EMAIL_LEN)
      errs.invite_owner_email = `Owner email must be ≤ ${MAX_OWNER_EMAIL_LEN} chars (users.id cap — widening pending)`;
    return errs;
  }, [legalName, displayName, effectiveSlug, categories, ownerEmail]);

  const mutation = useMutation({
    mutationFn: () =>
      createBusinessTenant({
        legal_name: legalName.trim(),
        display_name: displayName.trim(),
        slug: effectiveSlug,
        business_categories: categories,
        invite_owner_email: ownerEmail.trim(),
      }),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onCreated(tenant.display_name, ownerEmail.trim());
      onClose();
    },
  });

  function toggleCategory(c: BusinessCategory) {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validation).length > 0) return;
    mutation.mutate();
  }

  // Escape closes the modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const showErr = (k: string) => submitted && validation[k];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tenant-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--fp-overlay)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 56,
        paddingBottom: 32,
        zIndex: 50,
        overflowY: "auto",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        style={{
          background: "var(--fp-surface)",
          color: "var(--fp-text)",
          border: "1px solid var(--fp-border)",
          borderRadius: 12,
          padding: 28,
          width: "min(600px, 92vw)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <h2
            id="create-tenant-title"
            className="fp-display"
            style={{ margin: 0, fontSize: 22 }}
          >
            Create Business Tenant
          </h2>
          <span
            className="fp-mono"
            style={{
              fontSize: 11,
              color: "var(--fp-text-faint)",
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            superadmin onboarding
          </span>
        </div>
        <p
          style={{
            color: "var(--fp-text-muted)",
            fontSize: 13,
            marginTop: 4,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          We'll auto-provision a default <code>Main</code> location and
          email the owner a one-tap sign-in link to{" "}
          <code>business.floofpark.com</code>. They become the tenant's
          owner on link click.
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label htmlFor="ct-legal" className={labelClass}>
              Legal name <Req />
            </label>
            <input
              id="ct-legal"
              className={inputClass}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              maxLength={255}
              placeholder="Wolfie's Playland LLC"
              autoFocus
            />
            <p className={helperClass}>
              Registered legal entity name. Used on invoices and legal pages.
            </p>
            {showErr("legal_name") && (
              <p role="alert" className={errorClass}>
                {validation.legal_name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ct-display" className={labelClass}>
              Display name <Req />
            </label>
            <input
              id="ct-display"
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={255}
              placeholder="Wolfie's Playland"
            />
            <p className={helperClass}>
              What customers see. The slug is auto-derived from this.
            </p>
            {showErr("display_name") && (
              <p role="alert" className={errorClass}>
                {validation.display_name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ct-slug" className={labelClass}>
              Slug <Req />
            </label>
            <input
              id="ct-slug"
              className={`${inputClass} fp-mono`}
              value={effectiveSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              maxLength={100}
              placeholder="wolfies-playland"
            />
            <p className={helperClass}>
              URL-safe identifier. Letters, digits, dashes. Server returns 409
              if already taken — pick a variant if so.
            </p>
            {showErr("slug") && (
              <p role="alert" className={errorClass}>
                {validation.slug}
              </p>
            )}
          </div>

          <fieldset
            style={{
              border: "1px solid var(--fp-border)",
              borderRadius: 8,
              padding: "12px 14px 14px",
              margin: 0,
              background: "var(--fp-surface-2)",
            }}
          >
            <legend
              style={{
                padding: "0 6px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--fp-text)",
              }}
            >
              Business categories <Req />
            </legend>
            <p
              style={{
                fontSize: 12,
                color: "var(--fp-text-muted)",
                marginTop: 2,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              The kinds of offerings this business plans to run. Owner can
              add or remove later in Settings; this is just the seed list
              for sales context.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {CATEGORY_OPTIONS.map((opt) => {
                const active = categories.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: `1px solid ${
                        active ? "var(--fp-accent)" : "var(--fp-border)"
                      }`,
                      background: active
                        ? "color-mix(in srgb, var(--fp-accent) 12%, var(--fp-surface))"
                        : "var(--fp-surface)",
                      cursor: "pointer",
                      transition: "all 120ms",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCategory(opt.value)}
                      style={{ marginTop: 2, accentColor: "var(--fp-accent)" }}
                    />
                    <span style={{ display: "block" }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--fp-text)",
                        }}
                      >
                        {opt.label}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--fp-text-muted)",
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {opt.blurb}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {showErr("categories") && (
              <p role="alert" className={errorClass} style={{ marginTop: 10 }}>
                {validation.categories}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="ct-email" className={labelClass}>
              Owner email <Req />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--fp-text-faint)",
                  marginLeft: 6,
                  fontWeight: 400,
                }}
              >
                (max {MAX_OWNER_EMAIL_LEN} chars · widening pending)
              </span>
            </label>
            <input
              id="ct-email"
              type="email"
              className={inputClass}
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              maxLength={MAX_OWNER_EMAIL_LEN}
              placeholder="owner@wolfies.example"
            />
            <p className={helperClass}>
              Receives a magic-link invite. After clicking, lands on{" "}
              <code>business.floofpark.com</code> as the tenant owner.
            </p>
            {showErr("invite_owner_email") && (
              <p role="alert" className={errorClass}>
                {validation.invite_owner_email}
              </p>
            )}
          </div>
        </div>

        {mutation.isError && (
          <p
            role="alert"
            style={{
              color: "var(--fp-danger)",
              fontSize: 13,
              marginTop: 16,
              padding: "8px 12px",
              border: "1px solid var(--fp-danger)",
              borderRadius: 6,
              background: "color-mix(in srgb, var(--fp-danger) 8%, transparent)",
            }}
          >
            Failed to create tenant: {(mutation.error as Error).message}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid var(--fp-border)",
              background: "transparent",
              color: "var(--fp-text-muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--fp-accent)",
              background: "var(--fp-accent)",
              color: "var(--fp-accent-fg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: mutation.isPending ? "wait" : "pointer",
              opacity: mutation.isPending ? 0.7 : 1,
              transition: "background 120ms",
            }}
          >
            {mutation.isPending ? "Creating…" : "Create tenant + send invite"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Req() {
  return (
    <span
      aria-hidden
      style={{
        color: "var(--fp-accent)",
        fontWeight: 500,
        marginLeft: 2,
      }}
    >
      *
    </span>
  );
}
