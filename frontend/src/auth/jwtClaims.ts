export interface JwtClaims {
  sub: string;
  user_id?: string;
  aud: string;
  exp: number;
}

export function decodeClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    const obj = JSON.parse(json) as Partial<JwtClaims>;
    if (typeof obj.sub !== "string" || typeof obj.aud !== "string" || typeof obj.exp !== "number") {
      return null;
    }
    return obj as JwtClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: JwtClaims, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  return claims.exp < nowSeconds;
}

// Returns the OpenFGA tuple subject string for the current user.
// Prefers user_id when present; falls back to sub (email), matching the
// bootstrap_platform_superadmin and openfga_sync convention of writing
// tuples as `user:<email>`.
export function authzSubject(claims: JwtClaims): string {
  return `user:${claims.user_id ?? claims.sub}`;
}
