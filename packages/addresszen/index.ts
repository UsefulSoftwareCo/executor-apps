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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const addresszen = defineProvider({
  name: "AddressZen",
  hosts: ["api.addresszen.com"],
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
  // so it can reach access logs. Only `code` is always present in the body.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://api.addresszen.com/v1/keys/${encodeURIComponent(account.fields.token)}`, { signal });
    await decodeJson(response, object({ code: number() }));
  },
});

export default defineApp(
  { user: { accounts: { addresszen: addresszen.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.addresszen ?? [],
        // POST verify bills per match but writes nothing; it is still a mutation by HTTP method, so it asks.
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "AddressZen",
        description:
          "Address autocomplete and lookup, address verification, places, email and phone validation, and API key, licensee and config management with AddressZen.",
        instructions:
          "Autocomplete is not billed, but keys that autocomplete without resolving suggestions are rate-limited and then suspended: always resolve the chosen suggestion with the retrieve or place tools. Key management tools need an account with a management key (uk_...).",
        icons,
      },
    ),
  }),
);
