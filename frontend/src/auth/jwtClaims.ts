export interface JwtClaims {
  sub: string;
  user_id: string;
  aud: string;
  exp: number;
}

export function decodeClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    const obj = JSON.parse(json) as Partial<JwtClaims>;
    if (typeof obj.sub !== "string" || typeof obj.user_id !== "string" || typeof obj.aud !== "string" || typeof obj.exp !== "number") {
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
