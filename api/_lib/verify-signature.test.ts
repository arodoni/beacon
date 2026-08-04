import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySignature } from "./verify-signature.ts";

const secret = "test-secret";
const body = Buffer.from(JSON.stringify({ hello: "world" }));

function sign(payload: Buffer, key: string): string {
  return `sha256=${createHmac("sha256", key).update(payload).digest("hex")}`;
}

test("accepts a correctly signed payload", () => {
  const signature = sign(body, secret);
  assert.equal(verifySignature(body, signature, secret), true);
});

test("rejects a tampered payload", () => {
  const signature = sign(body, secret);
  const tamperedBody = Buffer.from(JSON.stringify({ hello: "wxrld" }));
  assert.equal(verifySignature(tamperedBody, signature, secret), false);
});

test("rejects a signature computed with the wrong secret", () => {
  const signature = sign(body, "wrong-secret");
  assert.equal(verifySignature(body, signature, secret), false);
});

test("rejects a missing signature header", () => {
  assert.equal(verifySignature(body, undefined, secret), false);
});

test("rejects a malformed/short signature header without throwing", () => {
  assert.equal(verifySignature(body, "sha256=deadbeef", secret), false);
});

test("rejects an empty string signature header", () => {
  assert.equal(verifySignature(body, "", secret), false);
});
