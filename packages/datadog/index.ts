import {
  accountRouter,
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
import { icons } from "./icon.js";

// Datadog's remote MCP server runs on every commercial site at mcp.<site>; GovCloud sites
// (ddog-gov.com, us2.ddog-gov.com) do not offer it. `toolsets=all` enables every generally
// available toolset (without it the server exposes only `core`).
const sites = [
  "datadoghq.com",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
  "datadoghq.eu",
  "ap1.datadoghq.com",
  "ap2.datadoghq.com",
  "uk1.datadoghq.com",
] as const;
type Site = (typeof sites)[number];

const endpoint = (site: Site) => `https://mcp.${site}/api/unstable/mcp-server/mcp`;
const url = (site: Site) => `${endpoint(site)}?toolsets=all`;

const siteOf = (value: string): Site => {
  const site = value.trim().toLowerCase().replace(/^app\./, "");
  const match = sites.find((candidate) => candidate === site);
  if (match) return match;
  throw new Error(`Site must be one of: ${sites.join(", ")}.`);
};

// Each site has its own authorization server (published at mcp.<site>, with dynamic client
// registration, S256 PKCE, public clients and the single scope mcp_all), so OAuth is one method per site.
const oauthMethods = {
  oauthUs1: "datadoghq.com",
  oauthUs3: "us3.datadoghq.com",
  oauthUs5: "us5.datadoghq.com",
  oauthEu1: "datadoghq.eu",
  oauthAp1: "ap1.datadoghq.com",
  oauthAp2: "ap2.datadoghq.com",
  oauthUk1: "uk1.datadoghq.com",
} as const satisfies Record<string, Site>;
type OauthMethod = keyof typeof oauthMethods;
const oauth = (site: Site) => oauth2({ discover: endpoint(site), scopes: ["mcp_all"], tokenEndpointAuthMethod: "none" });

type Account =
  | { method: "keys"; fields: { site: string; apiKey: string; appKey: string } }
  | { method: "token"; fields: { site: string; token: string } }
  | { method: OauthMethod; fields: { access_token: string } };

const siteOfAccount = (account: Account): Site =>
  account.method === "keys" || account.method === "token" ? siteOf(account.fields.site) : oauthMethods[account.method];

const headers = (account: Account): Record<string, string> =>
  account.method === "keys"
    ? { DD_API_KEY: account.fields.apiKey, DD_APPLICATION_KEY: account.fields.appKey }
    : { Authorization: `Bearer ${account.method === "token" ? account.fields.token : account.fields.access_token}` };

const datadog = defineProvider({
  name: "Datadog",
  hosts: sites.flatMap((site) => [`mcp.${site}`, site, `app.${site}`]),
  auth: {
    // Organization Settings > API Keys and Application Keys.
    keys: secrets({
      label: "Site, API key and application key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
        appKey: string({ minLength: 1 }),
      }),
    }),
    // Personal Settings > Personal Access Tokens, or a service account's access token.
    token: secrets({
      label: "Site and personal or service access token",
      fields: object({
        site: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    oauthUs1: oauth("datadoghq.com"),
    oauthUs3: oauth("us3.datadoghq.com"),
    oauthUs5: oauth("us5.datadoghq.com"),
    oauthEu1: oauth("datadoghq.eu"),
    oauthAp1: oauth("ap1.datadoghq.com"),
    oauthAp2: oauth("ap2.datadoghq.com"),
    oauthUk1: oauth("uk1.datadoghq.com"),
  },
  health: (check) => mcpHealth(check, { url: url(siteOfAccount(check.account)), headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { datadog: datadog.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.datadog ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url: url(siteOfAccount(account)), account, headers: headers(account), cache, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Datadog",
        description:
          "Search and query Datadog logs, metrics, traces, spans, monitors, incidents, dashboards, notebooks, events, services, hosts, RUM, security signals, cases, synthetics and more through Datadog's MCP server.",
        icons,
      },
    ),
  }),
);
