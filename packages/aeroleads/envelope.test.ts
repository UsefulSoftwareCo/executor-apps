import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAeroleadsBody } from "./envelope.ts";

test("throws on a 200 body with an error status", () => {
  assert.throws(
    () => assertAeroleadsBody({ message: "User not Found, Please Pass Valid Api Key", status: 400 }),
    /400.*Valid Api Key/,
  );
  assert.throws(() => assertAeroleadsBody({ status: 401 }), /401/);
});

test("throws on a message-only body", () => {
  assert.throws(() => assertAeroleadsBody({ message: "Pass your Api Key also as params" }), /Api Key/);
});

test("throws on an empty or non-object body", () => {
  assert.throws(() => assertAeroleadsBody({}), /empty/);
  assert.throws(() => assertAeroleadsBody(null), /not a JSON object/);
  assert.throws(() => assertAeroleadsBody([]), /not a JSON object/);
  assert.throws(() => assertAeroleadsBody("ok"), /not a JSON object/);
});

test("passes data bodies through", () => {
  const body = { email: "a@example.com", status: "valid", safe_to_send: true };
  assert.deepEqual(assertAeroleadsBody(body), body);
  assert.deepEqual(assertAeroleadsBody({ status: 200, name: "X" }), { status: 200, name: "X" });
});
