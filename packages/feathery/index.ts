import { accountRouter, defineApp, defineProvider, object, router, secrets, string, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const regions: Record<string, string> = {
  us: "api.feathery.io",
  ca: "api-ca.feathery.io",
  eu: "api-eu.feathery.io",
  jp: "api-jp.feathery.io",
  au: "api-au.feathery.io",
};

function url(region: string): string {
  const host = regions[region.trim().toLowerCase()];
  if (!host) throw new Error(`Unknown Feathery region "${region}". Use one of: ${Object.keys(regions).join(", ")}.`);
  return `https://${host}/api/mcp/`;
}

// Feathery expects the admin API key as "Token <key>", not a bearer token.
const feathery = defineProvider({
  name: "Feathery",
  hosts: Object.values(regions),
  auth: {
    apiKey: secrets({
      label: "Admin API key and region (us, ca, eu, jp or au)",
      fields: object({ token: string({ minLength: 1 }), region: string({ minLength: 1 }) }),
    }),
  },
  health: (check) =>
    mcpHealth(check, {
      url: url(check.account.fields.region),
      headers: { Authorization: `Token ${check.account.fields.token}` },
    }),
});

export default defineApp(
  { user: { accounts: { feathery: feathery.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.feathery ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url: url(account.fields.region),
              account,
              headers: { Authorization: `Token ${account.fields.token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Feathery",
        description: "Forms, submissions, users, hidden fields, document extractions, team accounts and logs in Feathery.",
        icons,
      },
    ),
  }),
);
