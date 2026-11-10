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

const Org = object({ org: array(object({ id: string(), company_name: string() })) });

const scopes = [
  "ZohoCRM.modules.ALL",
  "ZohoCRM.settings.ALL",
  "ZohoCRM.users.ALL",
  "ZohoCRM.org.ALL",
  "ZohoCRM.bulk.ALL",
  "ZohoCRM.coql.READ",
  "ZohoCRM.notifications.READ",
  "ZohoCRM.notifications.CREATE",
  "ZohoCRM.notifications.UPDATE",
  "ZohoCRM.notifications.DELETE",
  "ZohoCRM.features.READ",
  "ZohoCRM.send_mail.all.CREATE",
  "ZohoCRM.Files.CREATE",
  "ZohoCRM.Files.READ",
];

// Zoho has no registration endpoint: the connect page asks for the client created in the API console.
// Zoho takes the client credentials in the token request body and returns a refresh token only for
// access_type=offline.
const oauth = (region: Region) =>
  oauth2({
    authorizationUrl: `${regions[region].accounts}/oauth/v2/auth`,
    tokenUrl: `${regions[region].accounts}/oauth/v2/token`,
    revocationUrl: `${regions[region].accounts}/oauth/v2/token/revoke`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopes,
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
  oauthCn: "cn",
} as const satisfies Record<string, Region>;

const zoho = defineProvider({
  name: "Zoho CRM",
  hosts: Object.values(regions).flatMap((region) => [region.accounts.slice(8), region.api.slice(8)]),
  auth: {
    oauthUs: oauth("us"),
    oauthEu: oauth("eu"),
    oauthIn: oauth("in"),
    oauthAu: oauth("au"),
    oauthJp: oauth("jp"),
    oauthCa: oauth("ca"),
    oauthSa: oauth("sa"),
    oauthCn: oauth("cn"),
  },
  async health({ account, fetch, signal }) {
    const region = regionOfMethod[account.method];
    const response = await fetch(`${regions[region].api}/crm/v8/org`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { org } = await decodeJson(response, Org);
    const first = org[0];
    if (!first) throw new Error("The account cannot see a Zoho CRM organization.");
    return { accountInfo: { externalId: `${region}:${first.id}`, displayName: `${first.company_name} (${region})` } };
  },
});

export default defineApp(
  { user: { accounts: { zoho: zoho.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zoho ?? [],
        (account) => {
          const api = regions[regionOfMethod[account.method]].api;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: api,
              baseUrl: `${api}/crm/v8`,
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
        title: "Zoho",
        description:
          "Zoho CRM: leads, contacts, accounts, deals, custom modules, COQL queries, bulk jobs, layouts, fields, workflows, users, roles and the rest of the Zoho CRM REST API v8.",
        instructions:
          "Record endpoints take the module API name (Leads, Contacts, Accounts, Deals) as the module path parameter; list modules with the modules tools. getRecords requires the fields parameter. Lists page with page and per_page (max 200).",
        icons,
      },
    ),
  }),
);
