import { expect, test } from "vitest";
import { decodeClaims, isExpired } from "./jwtClaims";

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

test("decodeClaims returns claims for valid tokens with required fields", () => {
  const tok = makeToken({ sub: "z@floof.ventures", user_id: "u123", aud: "floofpark", exp: 9999999999 });
  expect(decodeClaims(tok)).toEqual({ sub: "z@floof.ventures", user_id: "u123", aud: "floofpark", exp: 9999999999 });
});

test("decodeClaims returns null when required fields are missing", () => {
  const tok = makeToken({ sub: "z@floof.ventures", aud: "floofpark", exp: 9999999999 }); // no user_id
  expect(decodeClaims(tok)).toBeNull();
});

test("isExpired compares exp against now", () => {
  expect(isExpired({ sub: "x", user_id: "u", aud: "floofpark", exp: 100 }, 200)).toBe(true);
  expect(isExpired({ sub: "x", user_id: "u", aud: "floofpark", exp: 300 }, 200)).toBe(false);
});
