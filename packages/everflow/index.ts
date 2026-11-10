import {
  accountRouter,
  decodeJson,
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
import { specOptions, specs } from "./openapi.js";

const clusters = { api: "https://api.eflow.team", "api-eu": "https://api-eu.eflow.team" } as const;

function origin(account: { fields: { subdomain: string } }) {
  const value = account.fields.subdomain.trim().toLowerCase();
  if (value !== "api" && value !== "api-eu") throw new Error("Enter your Everflow API subdomain: api or api-eu.");
  return clusters[value];
}

const everflow = defineProvider({
  name: "Everflow",
  hosts: ["api.eflow.team", "api-eu.eflow.team"],
  auth: {
    apiKey: secrets({
      label: "API subdomain (api, or api-eu for EU-hosted accounts) and Network API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin(account)}/v1/networks`, {
      signal,
      headers: { "X-Eflow-Api-Key": account.fields.token },
    });
    const network = await decodeJson(response, object({ name: string() }));
    return { accountInfo: { externalId: account.fields.subdomain.trim(), displayName: network.name } };
  },
});

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export default defineApp(
  { user: { accounts: { everflow: everflow.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.everflow ?? [],
        (account) => {
          const base = origin(account);
          return router(
            Object.fromEntries(
              specs.map((name) => [
                camel(name),
                withApprovals(
                  liveOpenapiRouter({
                    ...specOptions(name),
                    allowedOrigin: base,
                    baseUrl: `${base}/v1`,
                    cache,
                    fetch,
                    signal,
                    account,
                  }),
                  (tool) => (tool.kind === "mutation" ? always() : undefined),
                ),
              ]),
            ),
            { title: "Everflow", description: "Everflow Network API." },
          );
        },
        { signal },
      ),
      {
        title: "Everflow",
        description:
          "Everflow Network API: offers, partners (affiliates), advertisers, creatives, tracking domains, conversions, clicks, aggregated reporting, traffic controls, billing and webhooks.",
        icons,
      },
    ),
  }),
);
