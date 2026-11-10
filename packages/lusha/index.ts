import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

const lusha = defineProvider({
  name: "Lusha",
  hosts: ["api.lusha.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.lusha.com/v3/account/usage", {
      signal,
      headers: { api_key: account.fields.token },
    });
    // GET /v3/account/usage is limited to 5 requests per minute; Lusha documents no cheaper read-only endpoint.
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lusha: lusha.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lusha ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // getAccountSecret returns the account webhook signing secret, so it always needs approval.
            tool.kind === "mutation" || /getaccountsecret$/i.test(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lusha",
        description: "B2B contact and company enrichment, prospecting, lookalikes, signals, tables and webhook subscriptions with Lusha.",
        icons,
      },
    ),
  }),
);
