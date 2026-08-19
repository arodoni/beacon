import { test } from "node:test";
import assert from "node:assert/strict";
import { isAuthorized } from "./dashboard-auth.ts";

const secret = "test-secret";

test("accepts the correct bearer header", () => {
  assert.equal(isAuthorized(`Bearer ${secret}`, secret), true);
});

test("rejects a missing header", () => {
  assert.equal(isAuthorized(undefined, secret), false);
});

test("rejects the wrong secret", () => {
  assert.equal(isAuthorized("Bearer wrong-secret", secret), false);
});

test("rejects a header missing the Bearer prefix", () => {
  assert.equal(isAuthorized(secret, secret), false);
});

test("rejects an empty string header", () => {
  assert.equal(isAuthorized("", secret), false);
});
