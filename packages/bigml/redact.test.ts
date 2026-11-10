import assert from "node:assert/strict";
import { test } from "node:test";
import { redactLink, redactMeta } from "./redact.ts";

const leaks = (text: string) => /alfred|SECRETKEY123/.test(decodeURIComponent(text));

test("strips credentials separated by ampersands", () => {
  const out = redactLink("/andromeda/source?limit=20&offset=20&username=alfred&api_key=SECRETKEY123");
  assert.equal(leaks(out), false);
  assert.equal(out, "/andromeda/source?limit=20&offset=20");
});

test("strips credentials separated by semicolons", () => {
  const out = redactLink("/andromeda/source?limit=20&offset=20;username=alfred;api_key=SECRETKEY123");
  assert.equal(leaks(out), false);
  assert.equal(out, "/andromeda/source?limit=20&offset=20");
});

test("strips credentials that come first or are mixed", () => {
  for (const link of [
    "/source?username=alfred;api_key=SECRETKEY123;offset=20",
    "/source?api_key=SECRETKEY123&username=alfred&offset=20",
    "https://bigml.io/andromeda/source?API_KEY=SECRETKEY123;limit=1",
  ]) assert.equal(leaks(redactLink(link)), false, link);
  assert.equal(redactLink("/source?username=alfred;api_key=SECRETKEY123;offset=20"), "/source?offset=20");
});

test("redactMeta cleans next and previous and keeps the rest", () => {
  const out = redactMeta({
    meta: { next: "/source?offset=20;username=alfred;api_key=SECRETKEY123", previous: null, total_count: 3 },
    objects: [{ name: "alfred" }],
  }) as { meta: { next: string; previous: null; total_count: number }; objects: unknown[] };
  assert.equal(leaks(out.meta.next), false);
  assert.equal(out.meta.previous, null);
  assert.equal(out.meta.total_count, 3);
  assert.equal(out.objects.length, 1);
});
