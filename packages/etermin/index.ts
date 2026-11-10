import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  raw,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

type Fetch = typeof fetch;

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

// eTermin signs each request: `salt` is a fresh random string and `signature` is the standard
// base64 of HMAC-SHA256(privateKey, salt). `publickey` is placed by the OpenAPI credential binding.
const signingFetch =
  (privateKey: string, inner: Fetch): Fetch =>
  async (input, init) => {
    const salt = crypto.randomUUID();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(privateKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = base64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(salt))));
    const request = new Request(input, init);
    request.headers.set("salt", salt);
    request.headers.set("signature", signature);
    return inner(request);
  };

const etermin = defineProvider({
  name: "eTermin",
  hosts: ["www.etermin.net"],
  auth: {
    apiKey: secrets({
      label: "API keys",
      fields: object({
        publicKey: string({ minLength: 1 }),
        // Secret the app must read to sign requests.
        privateKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const signed = signingFetch(account.fields.privateKey, fetch);
    const response = await signed("https://www.etermin.net/api/calendar", {
      signal,
      headers: { publickey: account.fields.publicKey },
    });
    if (!response.ok) throw new Error(`eTermin rejected the API keys (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { etermin: etermin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.etermin ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch: signingFetch(account.fields.privateKey, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "eTermin",
        description:
          "Manage eTermin appointment scheduling: appointments, contacts, calendars, services, working times, ratings and message logs.",
        icons,
      },
    ),
  }),
);
