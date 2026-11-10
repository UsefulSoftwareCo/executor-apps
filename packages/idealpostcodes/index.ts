import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  object,
  router,
  secrets,
  string,
  renameTools,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const idealpostcodes = defineProvider({
  name: "Ideal Postcodes",
  hosts: ["api.ideal-postcodes.co.uk"],
  auth: {
    apiKey: secrets({
      label: "API key (lookups only)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    managementKey: secrets({
      label: "API key and management key (lookups and key management)",
      fields: object({ token: string({ minLength: 1 }), managementKey: string({ minLength: 1 }) }),
    }),
  },
  // GET /keys/{key} is public and read-only; the API key sits in the path by the vendor's design,
  // so it can reach access logs. Only `code` is always present in the body. The managementKey
  // method also reads the key details with the uk_ bearer, which fails for a wrong or revoked key.
  async health({ account, fetch, signal }) {
    const token = encodeURIComponent(account.fields.token);
    const base = `https://api.ideal-postcodes.co.uk/v1/keys/${token}`;
    if (account.method === "managementKey") {
      const response = await fetch(`${base}/details`, {
        headers: { Authorization: `Bearer ${account.fields.managementKey}` },
        signal,
      });
      await decodeJson(response, object({ code: number() }));
      return;
    }
    const response = await fetch(base, { signal });
    await decodeJson(response, object({ code: number() }));
  },
});

export default defineApp(
  { user: { accounts: { idealpostcodes: idealpostcodes.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.idealpostcodes ?? [],
        // POST cleanse bills per match but writes nothing; it is still a mutation by HTTP method, so it asks.
        (account) =>
          withApprovals(
            // Sign-up mints a new account and returns its API key once; that is a human onboarding
            // flow, not an agent tool, so both sign-up operations are left out.
            renameTools(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (name) =>
              name.startsWith("signUp.") ? undefined : name,
            ),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Ideal Postcodes",
        description:
          "UK and international address search with Ideal Postcodes: postcode lookup, autocomplete, UDPRN/UMPRN lookup, address cleansing, places, email and phone validation, and API key management.",
        instructions:
          "Autocomplete is not billed, but keys that autocomplete without resolving suggestions are rate-limited and then suspended: always resolve the chosen suggestion with the resolve address or place tools. Key management tools need an account with a management key (uk_...).",
        icons,
      },
    ),
  }),
);
