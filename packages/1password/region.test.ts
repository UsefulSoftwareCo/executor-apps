import assert from "node:assert/strict";
import { test } from "node:test";
import { onepassword } from "./provider.ts";
import { host } from "./region.ts";

test("the region field reaches app code as its real value", () => {
  // An unmarked field arrives as a credential handle, which host() cannot look up.
  assert.deepEqual(onepassword.auth.apiKey.exposure, { region: "plain" });
});

test("maps regions, sign-in addresses and Events hosts to the regional Events host", () => {
  for (const [region, expected] of [
    ["1password.com", "events.1password.com"],
    ["acme.1password.com", "events.1password.com"],
    ["acme.1password.com:443", "events.1password.com"],
    ["ent.1password.com", "events.ent.1password.com"],
    ["acme.ent.1password.com", "events.ent.1password.com"],
    ["events.ent.1password.com", "events.ent.1password.com"],
    ["https://acme.1password.eu/", "events.1password.eu"],
    ["my.1password.ca/signin", "events.1password.ca"],
    ["  HTTPS://Acme.1Password.CA/signin?x=1  ", "events.1password.ca"],
    ["events.1password.ca", "events.1password.ca"],
  ])
    assert.equal(host(region), expected, region);
});

test("rejects values that are not a 1Password region, with what to enter instead", () => {
  for (const region of ["evil1password.com", "1password.com.example.com", "US", "", "exsec_token"])
    assert.throws(() => host(region), /is not a 1Password region\. Connect the account again with the domain of your sign-in address/, region);
});
