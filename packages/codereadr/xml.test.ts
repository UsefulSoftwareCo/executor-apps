import assert from "node:assert/strict";
import { test } from "node:test";
import { formatFailure, parseXml, plain } from "./xml.ts";

test("parses a service list", () => {
  const root = parseXml(
    '<?xml version="1.0" encoding="UTF-8"?><xml><status>1</status><service id="120"><name>A &amp; B</name><user id="123"/></service></xml>',
  );
  assert.equal(root.name, "xml");
  assert.equal(root.children[0]?.text, "1");
  const service = plain(root).children?.[1];
  assert.equal(service?.attributes?.id, "120");
  assert.equal(service?.children?.[0]?.text, "A & B");
  assert.equal(service?.children?.[1]?.attributes?.id, "123");
});

test("reads error codes", () => {
  const root = parseXml('<xml><status>0</status><error code="100">The API key is invalid.</error></xml>');
  assert.equal(root.children[1]?.attributes.code, "100");
  assert.equal(formatFailure(plain(root)), "CodeREADr error 100: The API key is invalid.");
});
