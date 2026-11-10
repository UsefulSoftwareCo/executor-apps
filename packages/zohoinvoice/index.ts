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

const Organizations = object({
  organizations: array(object({ organization_id: string(), name: string() })),
});

// Zoho has no registration endpoint: the connect page asks for the client created in the API console.
// Zoho takes the client credentials in the token request body and returns a refresh token only for
// access_type=offline.
const oauth = (region: Region) =>
  oauth2({
    authorizationUrl: `${regions[region].accounts}/oauth/v2/auth`,
    tokenUrl: `${regions[region].accounts}/oauth/v2/token`,
    revocationUrl: `${regions[region].accounts}/oauth/v2/token/revoke`,
    tokenEndpointAuthMethod: "client_secret_post",
    scopes: ["ZohoInvoice.fullaccess.all"],
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

const zohoInvoice = defineProvider({
  name: "Zoho Invoice",
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
    const response = await fetch(`${regions[region].api}/invoice/v3/organizations`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { organizations } = await decodeJson(response, Organizations);
    const org = organizations[0];
    if (!org) throw new Error("The account cannot see any Zoho Invoice organization.");
    return { accountInfo: { externalId: `${region}:${org.organization_id}`, displayName: `${org.name} (${region})` } };
  },
});

export default defineApp(
  { user: { accounts: { zohoInvoice: zohoInvoice.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zohoInvoice ?? [],
        (account) => {
          const api = regions[regionOfMethod[account.method]].api;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: api,
              baseUrl: `${api}/invoice/v3`,
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
        title: "Zoho Invoice",
        description:
          "Invoices, recurring invoices, estimates, retainer invoices, credit notes, customer payments, expenses, time entries, projects, contacts, items, taxes and the rest of the Zoho Invoice REST API.",
        instructions:
          "Every call needs organization_id. Get it from organizations.listAllOrganizations (GET /organizations); it is also in the health check's account name. List endpoints page with page and per_page.",
        icons,
      },
    ),
  }),
);
