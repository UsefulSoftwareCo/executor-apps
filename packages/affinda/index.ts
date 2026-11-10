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
import { options } from "./openapi.js";

const regions = ["api", "api.eu1", "api.us1"];

function originFor(raw: string): string {
  const region = raw.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error("Region must be one of: api, api.eu1, api.us1.");
  return `https://${region}.affinda.com`;
}

const affinda = defineProvider({
  name: "Affinda",
  hosts: ["api.affinda.com", "api.eu1.affinda.com", "api.us1.affinda.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originFor(account.fields.region)}/v3/organizations`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Affinda rejected the API key (HTTP ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { affinda: affinda.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.affinda ?? [],
        (account) => {
          const origin = originFor(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Affinda",
        description:
          "Affinda document AI: parse resumes, invoices, receipts and custom documents, manage workspaces, collections, data points, search and matching.",
        instructions:
          "The account's region (api, api.eu1 or api.us1) selects the Affinda instance; use the region shown in the Affinda web app URL.",
        icons,
      },
    ),
  }),
);
