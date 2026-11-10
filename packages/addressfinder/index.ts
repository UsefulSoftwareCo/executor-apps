import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
} from "apps";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const addressfinder = defineProvider({
  name: "Addressfinder",
  hosts: ["api.addressfinder.io"],
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({
        key: string({ minLength: 1 }),
        secret: string({ minLength: 1 }),
      }),
    }),
    // OAuth 2.0 client credentials (Business and Enterprise plans): the connect page asks for the
    // client id and secret created in the Portal; Executor exchanges them for bearer tokens.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.addressfinder.io/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: ["address", "phone", "email"],
    }),
  },
  // A one-result autocomplete is a cheap read and autocomplete suggestions are not billed.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.addressfinder.io/api/au/address/autocomplete");
    url.searchParams.set("q", "1 george st sydney");
    url.searchParams.set("max", "1");
    if (account.method === "apiKey") url.searchParams.set("key", account.fields.key);
    const response = await fetch(url.toString(), {
      signal,
      headers: {
        Authorization:
          account.method === "oauth" ? `Bearer ${account.fields.access_token}` : account.fields.secret,
      },
    });
    await decodeJson(response, object({}));
  },
});

// Every operation is a GET with no side effects, so no approvals are needed. Some lookups are billed
// by the vendor when they return a result: AU and NZ address metadata, AU address verification, NZ
// address verification and reverse geocoding, email and phone verification, and international
// metadata. Autocomplete suggestions are not billed.
export default defineApp(
  { user: { accounts: { addressfinder: addressfinder.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.addressfinder ?? [],
        (account) =>
          liveOpenapiRouter({
            ...options,
            cache,
            fetch,
            signal,
            account,
            // The `key` query parameter is only for key+secret; OAuth bearer tokens do not need it.
            ...(account.method === "apiKey"
              ? { parameterDefaults: { query: { key: String(account.fields.key) } } }
              : {}),
          }),
        { signal },
      ),
      {
        title: "Addressfinder",
        description:
          "Address autocomplete, metadata, verification and reverse geocoding for Australia and New Zealand, international address lookup, and email and phone verification.",
        icons,
      },
    ),
  }),
);
