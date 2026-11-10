import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { environments, options } from "./openapi.js";

type Environment = keyof typeof environments;

const environmentOf = (value: string): Environment => {
  const environment = value.trim().toLowerCase();
  if (environment === "production" || environment === "integration") return environment;
  throw new Error('Environment must be "integration" or "production".');
};

// The spec requires this header on every call; the compiler drops its default, so bind it per account.
const acceptVersion = "v20250224";

const mx = defineProvider({
  name: "MX Technologies",
  hosts: ["api.mx.com", "int-api.mx.com"],
  auth: {
    apiKey: secrets({
      label: "Client ID and API key (MX Client Dashboard)",
      fields: object({ environment: plain(string({ minLength: 1 })), clientId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Listing users needs only the client credentials; 401 means they were rejected.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${environments[environmentOf(account.fields.environment)]}/users?records_per_page=1`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.clientId}:${account.fields.apiKey}`)}`,
        Accept: "application/json",
        "Accept-Version": acceptVersion,
      },
    });
    if (!response.ok) throw new Error(`MX health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { mx: mx.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mx ?? [],
        (account) => {
          const origin = environments[environmentOf(account.fields.environment)];
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              parameterDefaults: { headers: { "Accept-Version": acceptVersion } },
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "MX Technologies",
        instructions: "The account's environment (integration for developer keys, production for production keys) is fixed when it is connected. Mutations ask for approval.",
        description: "Aggregate and enhance financial data with the MX Platform API: users, members, institutions, accounts, transactions, categories, budgets, goals, holdings and ACH data.",
        icons,
      },
    ),
  }),
);
