import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, regions } from "./openapi.js";

const Organization = object({ id: string(), slug: string(), name: string() });

type Region = keyof typeof regions;
const regionOf = (value: string): Region => {
  const region = value.trim().toLowerCase();
  if (region === "us" || region === "de") return region;
  throw new Error('Region must be "us" or "de".');
};

// Sentry's official remote MCP server: natural-language issue and event search, traces and Seer
// root-cause analysis. It registers clients itself (dynamic client registration and Client ID
// Metadata Documents), so signing in needs no OAuth application of the user's own. Its tokens only
// work against mcp.sentry.dev.
const mcpUrl = "https://mcp.sentry.dev/mcp";

const sentry = defineProvider({
  name: "Sentry",
  hosts: ["mcp.sentry.dev", "us.sentry.io", "de.sentry.io"],
  auth: {
    // First, so the connect page starts with it.
    oauth: oauth2({ discover: mcpUrl }),
    // An auth token from Settings > Developer Settings (organization or personal token). Only the
    // REST API takes it.
    authToken: secrets({
      label: "Auth token",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth")
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    const region = regionOf(account.fields.region);
    const response = await fetch(`${regions[region]}/api/0/organizations/?per_page=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const org = (await decodeJson(response, array(Organization)))[0];
    if (!org) throw new Error("The token cannot see any organization.");
    return { accountInfo: { externalId: `${region}:${org.id}`, displayName: `${org.name} (${region})` } };
  },
});

export default defineApp(
  { user: { accounts: { sentry: sentry.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const accounts = user?.accounts.sentry ?? [];
    return {
      tools: router(
        {
          mcp: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "oauth" ? [account] : [])),
              async (account) =>
                withApprovals(
                  await mcpRouter({
                    url: mcpUrl,
                    account,
                    headers: { Authorization: `Bearer ${account.fields.access_token}` },
                    cache,
                    signal,
                  }),
                  (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                ),
              { signal },
            ),
            {
              title: "Sentry MCP",
              description:
                "Sentry's remote MCP server: natural-language issue and event search, traces and Seer root-cause analysis.",
            },
          ),
          api: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "authToken" ? [account] : [])),
              (account) => {
                const origin = regions[regionOf(account.fields.region)];
                return withApprovals(
                  liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
                  (tool) => (tool.kind === "mutation" ? always() : undefined),
                );
              },
              { signal },
            ),
            {
              title: "Sentry API",
              description:
                "Issues, events, projects, releases, alerts, organizations and the rest of the Sentry REST API, for accounts connected with an auth token.",
              instructions:
                "Most endpoints take organization_id_or_slug and project_id_or_slug path parameters. List organizations first, then projects. Mutations ask for approval.",
            },
          ),
        },
        {
          title: "Sentry",
          description:
            "Issues, events, traces and Seer root-cause analysis through Sentry's MCP server (mcp) for signed-in accounts, and the Sentry REST API (api) for auth-token accounts.",
          icons,
        },
      ),
    };
  },
);
