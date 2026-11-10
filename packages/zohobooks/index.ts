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
    scopes: [
      "contacts", "settings", "estimates", "invoices", "customerpayments", "creditnotes", "projects", "expenses",
      "salesorders", "purchaseorders", "bills", "debitnotes", "vendorpayments", "banking", "accountants",
    ].map((module) => `ZohoBooks.${module}.ALL`),
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
  oauthCn: "cn",
} as const satisfies Record<string, Region>;

const zohoBooks = defineProvider({
  name: "Zoho Books",
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
    oauthCn: oauth("cn"),
  },
  async health({ account, fetch, signal }) {
    const region = regionOfMethod[account.method];
    const response = await fetch(`${regions[region].api}/books/v3/organizations`, {
      signal,
      headers: { Authorization: `Zoho-oauthtoken ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { organizations } = await decodeJson(response, Organizations);
    const org = organizations[0];
    if (!org) throw new Error("The account cannot see any Zoho Books organization.");
    return { accountInfo: { externalId: `${region}:${org.organization_id}`, displayName: `${org.name} (${region})` } };
  },
});

export default defineApp(
  { user: { accounts: { zohoBooks: zohoBooks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zohoBooks ?? [],
        (account) => {
          const api = regions[regionOfMethod[account.method]].api;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: api,
              baseUrl: `${api}/books/v3`,
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
        title: "Zoho Books",
        description:
          "Invoices, bills, estimates, sales and purchase orders, contacts, items, payments, expenses, banking, journals, projects, taxes and the rest of the Zoho Books REST API.",
        instructions:
          "Every call needs organization_id. Get it from organizations.listOrganizations (GET /organizations); it is also in the health check's account name. List endpoints page with page and per_page.",
        icons,
      },
    ),
  }),
);
