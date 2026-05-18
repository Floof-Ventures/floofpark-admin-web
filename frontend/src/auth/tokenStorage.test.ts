import { afterEach, beforeEach, expect, test } from "vitest";
import { clearToken, getToken, setToken } from "./tokenStorage";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

test("getToken returns null when absent", () => {
  expect(getToken()).toBeNull();
});

test("setToken + getToken round-trip", () => {
  setToken("abc.def.ghi");
  expect(getToken()).toBe("abc.def.ghi");
});

test("clearToken removes the entry", () => {
  setToken("abc.def.ghi");
  clearToken();
  expect(getToken()).toBeNull();
});
