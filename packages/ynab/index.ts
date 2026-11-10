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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const ynab = defineProvider({
  name: "YNAB",
  hosts: ["api.ynab.com", "app.ynab.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // YNAB has no client registration: the connect page asks for an OAuth app's client.
    // No scope requested means full read/write; the only scope YNAB defines is "read-only".
    oauth: oauth2({
      authorizationUrl: "https://app.ynab.com/oauth/authorize",
      tokenUrl: "https://app.ynab.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.ynab.com/v1/user", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data } = await decodeJson(response, object({ data: object({ user: object({ id: string() }) }) }));
    return { accountInfo: { externalId: data.user.id } };
  },
});

export default defineApp(
  { user: { accounts: { ynab: ynab.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ynab ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "YNAB",
        description:
          "YNAB budgets: plans, accounts, categories, payees, transactions, scheduled transactions and months.",
        icons,
      },
    ),
  }),
);
