import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
import { options } from "./openapi.js";

// Every RepairShopr account lives on its own host: https://<subdomain>.repairshopr.com.
function normalizeSubdomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(?:\.repairshopr\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.repairshopr.com (letters, digits, hyphens).");
  return match[1]!;
}

const repairshopr = defineProvider({
  name: "RepairShopr",
  hosts: ["*.repairshopr.com"],
  auth: {
    // RepairShopr API tokens are per user (Profile > API Tokens) and sent as a Bearer token.
    // RepairShopr offers no OAuth for third-party apps.
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const subdomain = normalizeSubdomain(account.fields.subdomain);
    const response = await fetch(`https://${subdomain}.repairshopr.com/api/v1/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: subdomain, displayName: `${subdomain}.repairshopr.com` } };
  },
});

export default defineApp(
  { user: { accounts: { repairshopr: repairshopr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.repairshopr ?? [],
        (account) => {
          const origin = `https://${normalizeSubdomain(account.fields.subdomain)}.repairshopr.com`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v1`,
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
        title: "RepairShopr",
        description:
          "Repair shop management in RepairShopr: customers, tickets, invoices, estimates, assets, inventory, appointments, payments and more.",
        icons,
      },
    ),
  }),
);
