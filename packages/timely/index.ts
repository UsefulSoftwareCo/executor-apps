import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  array,
  query,
  string,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const TokenInfo = object({ resource_owner_id: number() });

const Accounts = array(object({ id: number(), name: string().optional() }));

const timely = defineProvider({
  name: "Timely",
  hosts: ["api.timelyapp.com"],
  auth: {
    // Timely has no personal tokens: the connect page asks for an OAuth application's client.
    oauth: oauth2({
      authorizationUrl: "https://api.timelyapp.com/1.1/oauth/authorize",
      tokenUrl: "https://api.timelyapp.com/1.1/oauth/token",
      revocationUrl: "https://api.timelyapp.com/1.1/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["manage"],
      tokenRequestFormat: "json",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.timelyapp.com/1.1/oauth/token/info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const info = await decodeJson(response, TokenInfo);
    return { accountInfo: { externalId: String(info.resource_owner_id) } };
  },
});

type Account = { fields: { access_token: string } };

// The vendor's API text: "To get your account IDs, call GET /1.1/accounts after authentication."
// Only `id` (the account_id path parameter) is decoded as required; `name` is read when present.
const accountTools = (account: Account, signal: AbortSignal) =>
  router(
    {
      list: query(
        {
          description:
            "List the Timely workspaces (accounts) the connected user can access (GET /1.1/accounts). Use each id as the account_id path parameter of the other tools.",
          input: object({}),
        },
        async ({ fetch }) =>
          decodeJson(
            await fetch("https://api.timelyapp.com/1.1/accounts", {
              signal,
              headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
            }),
            Accounts,
          ),
      ),
    },
    { title: "Timely accounts", description: "Find the workspace ids that other Timely tools need." },
  );

export default defineApp(
  { user: { accounts: { timely: timely.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.timely ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        accounts: await accountRouter(user?.accounts.timely ?? [], (account) => accountTools(account, signal), { signal }),
      },
      {
        title: "Timely",
        description:
          "Time entries, projects, clients, labels, teams, forecasts, reports and the rest of the Timely time-tracking API. Call accounts.list first to get the account_id other tools need.",
        icons,
      },
    ),
  }),
);
