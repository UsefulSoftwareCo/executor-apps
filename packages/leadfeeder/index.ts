import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// POST operations that only query data (scope `*:read` in the spec, no side effects), so they do not need approval.
const readOnlyPosts = new Set([
  "companies.estimateCompanyEnrichmentJob",
  "companies.matchCompanies",
  "companies.searchCompanies",
  "companies.searchCompaniesSignals",
  "contacts.estimateFindContactDataJob",
  "contacts.searchContacts",
  "idealCustomerProfiles.getCompanyIcpMatches",
  "lists.getCompanyListMemberships",
  "lists.getContactListMemberships",
  "webVisits.searchWebVisits",
]);

const leadfeeder = defineProvider({
  name: "Leadfeeder",
  hosts: ["api.leadfeeder.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Leadfeeder uses authorization code with PKCE; the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://api.leadfeeder.com/v1/oauth/authorize",
      tokenUrl: "https://api.leadfeeder.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "accounts:read",
        "buyer_personas:read",
        "buyer_personas:write",
        "campaigns:read",
        "campaigns:write",
        "companies:read",
        "companies:write",
        "contacts:read",
        "contacts:write",
        "crm_records:read",
        "custom_fields:read",
        "icps:read",
        "icps:write",
        "ip:read",
        "lists:read",
        "lists:write",
        "tags:read",
        "tags:write",
        "usage:read",
        "users:read",
        "web_visits:read",
        "web_visits:write",
        "workflows:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Api-Key": `${account.fields.token}` };
    const response = await fetch("https://api.leadfeeder.com/v1/accounts", { signal, headers });
    await decodeJson(response, object({ data: array(object({ id: string() })) }));
  },
});

export default defineApp(
  { user: { accounts: { leadfeeder: leadfeeder.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leadfeeder ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" && !readOnlyPosts.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Leadfeeder",
        description:
          "Website visitors, companies, contacts, lists, tags, campaigns, custom fields and workflows from the Leadfeeder (Dealfront) public API.",
        icons,
      },
    ),
  }),
);
