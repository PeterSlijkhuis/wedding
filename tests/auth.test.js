import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signToken, verifyToken, safeEqual } from "../src/auth.js";

test("password hash verifies only the right password", async () => {
  const stored = await hashPassword("rings2027");
  assert.equal(await verifyPassword("rings2027", stored), true);
  assert.equal(await verifyPassword("rings2028", stored), false);
  assert.equal(await verifyPassword("rings2027", "garbage"), false);
});

test("token rejects tampering, wrong secret and expiry", async () => {
  const token = await signToken({ role: "guest", exp: 2000 }, "s3cret");
  assert.deepEqual(await verifyToken(token, "s3cret", 1000), { role: "guest", exp: 2000 });
  assert.equal(await verifyToken(token, "other", 1000), null);
  assert.equal(await verifyToken(token, "s3cret", 2000), null);
  const forged = (await signToken({ role: "admin", exp: 2000 }, "x")).split(".")[0] + "." + token.split(".")[1];
  assert.equal(await verifyToken(forged, "s3cret", 1000), null);
});

test("safeEqual", async () => {
  assert.equal(await safeEqual("a", "a"), true);
  assert.equal(await safeEqual("a", "ab"), false);
});
