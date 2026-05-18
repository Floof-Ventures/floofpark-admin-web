import { expect, test } from "vitest";
import { authzSubject, decodeClaims, isExpired } from "./jwtClaims";

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  return `${header}.${body}.signature`;
}

test("decodeClaims returns null for malformed tokens", () => {
  expect(decodeClaims("not.a.token")).toBeNull();
  expect(decodeClaims("only.two")).toBeNull();
  expect(decodeClaims("")).toBeNull();
});

test("decodeClaims returns full claims when user_id is present", () => {
  const tok = makeToken({ sub: "z@floof.ventures", user_id: "u123", aud: "floofpark", exp: 9999999999 });
  expect(decodeClaims(tok)).toEqual({ sub: "z@floof.ventures", user_id: "u123", aud: "floofpark", exp: 9999999999 });
});

test("decodeClaims accepts tokens without user_id (auth currently omits it)", () => {
  const tok = makeToken({ sub: "z@floof.ventures", aud: "floofpark", exp: 9999999999 });
  expect(decodeClaims(tok)).toEqual({ sub: "z@floof.ventures", aud: "floofpark", exp: 9999999999 });
});

test("decodeClaims returns null when sub is missing", () => {
  const tok = makeToken({ aud: "floofpark", exp: 9999999999 });
  expect(decodeClaims(tok)).toBeNull();
});

test("isExpired compares exp against now", () => {
  expect(isExpired({ sub: "x", aud: "floofpark", exp: 100 }, 200)).toBe(true);
  expect(isExpired({ sub: "x", aud: "floofpark", exp: 300 }, 200)).toBe(false);
});

test("authzSubject prefers user_id when present, falls back to sub (email)", () => {
  expect(authzSubject({ sub: "z@floof.ventures", user_id: "u123", aud: "floofpark", exp: 9999999999 })).toBe("user:u123");
  expect(authzSubject({ sub: "z@floof.ventures", aud: "floofpark", exp: 9999999999 })).toBe("user:z@floof.ventures");
});
