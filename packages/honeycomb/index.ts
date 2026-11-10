import {
  accountRouter,
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

type Region = keyof typeof regions;

const regionOf = (value: string): Region => {
  const region = value.trim().toLowerCase();
  if (region === "us" || region === "eu") return region;
  throw new Error('Region must be "us" or "eu".');
};

const honeycomb = defineProvider({
  name: "Honeycomb",
  hosts: ["api.honeycomb.io", "api.eu1.honeycomb.io"],
  auth: {
    // A Configuration Key from Environment Settings > API Keys. Its permissions decide which tools work.
    configurationKey: secrets({
      label: "Configuration key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // A team Management Key from Team Settings > API Keys, as "<key id>:<secret>".
    managementKey: secrets({
      label: "Management key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = regions[regionOf(account.fields.region)];
    if (account.method === "managementKey") {
      const response = await fetch(`${origin}/2/auth`, {
        signal,
        headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
      });
      const body = await decodeJson(response, object({ data: object({ id: string() }) }));
      return { accountInfo: { externalId: body.data.id, displayName: `Management key (${account.fields.region})` } };
    }
    const response = await fetch(`${origin}/1/auth`, {
      signal,
      headers: { "X-Honeycomb-Team": account.fields.token, Accept: "application/json" },
    });
    const body = await decodeJson(
      response,
      object({ id: string(), team: object({ name: string(), slug: string() }) }),
    );
    return { accountInfo: { externalId: body.id, displayName: `${body.team.name} (${account.fields.region})` } };
  },
});

const mcpUrl = "https://mcp.honeycomb.io/mcp";

// Honeycomb's hosted MCP server uses OAuth with dynamic client registration.
const honeycombMcp = defineProvider({
  name: "Honeycomb MCP",
  hosts: ["mcp.honeycomb.io"],
  auth: {
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { honeycomb: honeycomb.many(), honeycombMcp: honeycombMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.honeycomb ?? [],
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
            title: "Honeycomb API",
            description: "Datasets, queries, boards, SLOs, triggers, markers, recipients and API keys from the Honeycomb REST API.",
            instructions:
              "Configuration keys reach one environment's data (/1 endpoints); management keys reach team-level resources such as API keys (/2 endpoints). Mutations ask for approval.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.honeycombMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Honeycomb MCP",
            description: "Honeycomb's remote MCP server: run queries, explore datasets and inspect telemetry.",
          },
        ),
      },
      {
        title: "Honeycomb",
        description:
          "Honeycomb observability through its REST API (api) and its hosted MCP server (mcp) for querying and analyzing telemetry.",
        icons,
      },
    ),
  }),
);
