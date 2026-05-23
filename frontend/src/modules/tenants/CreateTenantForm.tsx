import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BUSINESS_CATEGORIES,
  createBusinessTenant,
  type BusinessCategory,
} from "@/api/tenants";

// users.id is VARCHAR(36) in tenant-identity — reject longer emails before
// hitting the server (see memory feedback_users_id_varchar36).
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

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  daycare: "Daycare",
  boarding: "Boarding",
  grooming: "Grooming",
  training: "Training",
  space_booking: "Space booking",
  retail: "Retail",
  rental: "Rental",
  custom: "Custom",
};

export interface CreateTenantFormProps {
  onClose: () => void;
  onCreated: (tenantDisplayName: string, ownerEmail: string) => void;
}

export function CreateTenantForm({ onClose, onCreated }: CreateTenantFormProps) {
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
      errs.categories = "Pick at least one";
    if (!ownerEmail.trim()) errs.invite_owner_email = "Required";
    else if (!EMAIL_PATTERN.test(ownerEmail.trim()))
      errs.invite_owner_email = "Enter a valid email";
    else if (ownerEmail.trim().length > MAX_OWNER_EMAIL_LEN)
      errs.invite_owner_email =
        `Owner email must be ≤ ${MAX_OWNER_EMAIL_LEN} chars (users.id cap)`;
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

  const showErr = (k: string) => submitted && validation[k];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tenant-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 60,
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        style={{
          background: "white",
          padding: 24,
          borderRadius: 8,
          width: "min(560px, 90vw)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h2 id="create-tenant-title" style={{ marginTop: 0 }}>
          Create Business Tenant
        </h2>
        <p style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
          A magic-link invite will be sent to the owner email. A default
          "Main" location is auto-created.
        </p>

        <label style={{ display: "block", marginTop: 16 }}>
          Legal name *
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            maxLength={255}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {showErr("legal_name") && (
            <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
              {validation.legal_name}
            </span>
          )}
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Display name *
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={255}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {showErr("display_name") && (
            <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
              {validation.display_name}
            </span>
          )}
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Slug *
          <input
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            maxLength={100}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {showErr("slug") && (
            <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
              {validation.slug}
            </span>
          )}
        </label>

        <fieldset
          style={{
            marginTop: 12,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <legend style={{ fontSize: 13 }}>Business categories *</legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 6,
            }}
          >
            {BUSINESS_CATEGORIES.map((c) => (
              <label
                key={c}
                style={{ display: "flex", gap: 6, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(c)}
                  onChange={() => toggleCategory(c)}
                />
                {CATEGORY_LABEL[c]}
              </label>
            ))}
          </div>
          {showErr("categories") && (
            <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
              {validation.categories}
            </span>
          )}
        </fieldset>

        <label style={{ display: "block", marginTop: 12 }}>
          Owner email *{" "}
          <span style={{ fontSize: 11, color: "#64748b" }}>
            (max {MAX_OWNER_EMAIL_LEN} chars)
          </span>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            maxLength={MAX_OWNER_EMAIL_LEN}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {showErr("invite_owner_email") && (
            <span role="alert" style={{ color: "#dc2626", fontSize: 12 }}>
              {validation.invite_owner_email}
            </span>
          )}
        </label>

        {mutation.isError && (
          <p role="alert" style={{ color: "#dc2626", marginTop: 12 }}>
            Failed to create tenant: {(mutation.error as Error).message}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create tenant"}
          </button>
        </div>
      </form>
    </div>
  );
}
