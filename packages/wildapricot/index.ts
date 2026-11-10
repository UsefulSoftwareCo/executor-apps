import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Accounts = array(object({ Id: number(), Name: string() }));

const wildapricot = defineProvider({
  name: "WildApricot",
  hosts: ["api.wildapricot.org", "oauth.wildapricot.org"],
  auth: {
    // Create an API key in the admin site authorized-applications settings. The client ID is
    // the literal text APIKEY and the client secret is the API key.
    apiKey: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://oauth.wildapricot.org/auth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["auto"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.wildapricot.org/v2.2/accounts", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const [first] = await decodeJson(response, Accounts);
    if (first === undefined) throw new Error("The API key can access no WildApricot account.");
    return { accountInfo: { externalId: String(first.Id), displayName: first.Name } };
  },
});

export default defineApp(
  { user: { accounts: { wildapricot: wildapricot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wildapricot ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WildApricot",
        description:
          "WildApricot contacts, membership levels, events, registrations, invoices, payments, email and the rest of the Admin API.",
        instructions:
          "Most operations take an accountId; list accounts first. Contact and event listings are asynchronous: they may return a ResultUrl to poll.",
        icons,
      },
    ),
  }),
);
