import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, regions, type Region } from "./openapi.js";

const Organizations = object({ data: array(object({ id: string() })) });

// Scope names come from the per-operation `security` lists in Zoho's own OpenAPI files
// (https://github.com/zoho/zohodesk-oas). Modules that define an ALL scope request it; the modules
// that only define per-operation scopes (search, organization, teams, permissions, featuresettings)
// list them explicitly. Bulk export/import (`Desk.exports.CUSTOM`, `Desk.imports.CUSTOM`) are not requested.
const allScopes = [
  "tickets", "contacts", "basic", "settings", "articles", "tasks", "products", "agents",
  "departments", "community", "forums", "contracts", "templates", "webhooks", "events", "fields",
  "layouts", "modules", "automations", "accounts", "custommodule", "integrations", "channels.email",
  "channels.helpcenter", "InstantMessages", "activities.calls", "activities.events", "activities.tasks",
].map((scope) => `Desk.${scope}.ALL`);
const scopes = [
  ...allScopes,
  "Desk.search.READ",
  "Desk.organization.READ", "Desk.organization.UPDATE",
  ...["READ", "CREATE", "UPDATE", "DELETE"].flatMap((op) => [`Desk.teams.${op}`, `Desk.permissions.${op}`]),
  "Desk.featuresettings.READ", "Desk.featuresettings.UPDATE",
];

// Zoho has no registration endpoint: the connect page asks for the client created in the API console.
// Zoho takes the client credentials in the token request body and returns a refresh token only for
// access_type=offline. Scopes are comma-separated.
const oauth = (region: Region) =>
  oauth2({
    authorizationUrl: `${regions[region].accounts}/oauth/v2/auth`,
    tokenUrl: `${regions[region].accounts}/oauth/v2/token`,
    revocationUrl: `${regions[region].accounts}/oauth/v2/token/revoke`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopes,
    scopeSeparator: ",",
    authorizationParams: { access_type: "offline", prompt: "consent" },
  });

const regionOfMethod = {
  oauthUs: "us",
  oauthEu: "eu",
  oauthIn: "in",
  oauthAu: "au",
  oauthJp: "jp",
  oauthCa: "ca",
  oauthSa: "sa",
  oauthAe: "ae",
  oauthSg: "sg",
  oauthCn: "cn",
} as const satisfies Record<string, Region>;

const zohoDesk = defineProvider({
  name: "Zoho Desk",
  hosts: Object.values(regions).flatMap((region) => [region.accounts.slice(8), region.api.slice(8)]),
  auth: {
    oauthUs: oauth("us"),
    oauthEu: oauth("eu"),
    oauthIn: oauth("in"),
    oauthAu: oauth("au"),
    oauthJp: oauth("jp"),
    oauthCa: oauth("ca"),
    oauthSa: oauth("sa"),
    oauthAe: oauth("ae"),
    oauthSg: oauth("sg"),
    oauthCn: oauth("cn"),
  },
  async health({ account, fetch, signal }) {
    const region = regionOfMethod[account.method];
    const response = await fetch(`${regions[region].api}/api/v1/organizations`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { data } = await decodeJson(response, Organizations);
    const org = data[0];
    if (!org) throw new Error("The account cannot see any Zoho Desk organization.");
    return { accountInfo: { externalId: `${region}:${org.id}`, displayName: `Zoho Desk (${region}, org ${org.id})` } };
  },
});

export default defineApp(
  { user: { accounts: { zohoDesk: zohoDesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zohoDesk ?? [],
        (account) => {
          const api = regions[regionOfMethod[account.method]].api;
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: api, baseUrl: api, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Zoho Desk",
        description:
          "Tickets, threads, contacts, accounts, agents, departments, help center articles, tasks, calls, events, time entries, products, webhooks, custom fields and the rest of the Zoho Desk REST API.",
        instructions:
          "The organization is bound to the access token, so the orgId header is optional; if you send it, it must match the token's organization (otherwise OAUTH_ORG_MISMATCH). Find it with GET /api/v1/organizations; it is also in the account name. List endpoints page with from and limit.",
        icons,
      },
    ),
  }),
);
