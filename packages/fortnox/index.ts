import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Company = object({
  CompanyInformation: object({ CompanyName: string(), DatabaseNumber: number() }),
});

// Fortnox scopes grant read and write; the company needs the matching license for each resource.
const scopes = [
  "companyinformation",
  "customer",
  "article",
  "invoice",
  "order",
  "offer",
  "payment",
  "price",
  "project",
  "supplier",
  "supplierinvoice",
  "bookkeeping",
  "costcenter",
  "currency",
  "settings",
  "archive",
  "inbox",
  "connectfile",
  "profile",
];

const fortnox = defineProvider({
  name: "Fortnox",
  hosts: ["api.fortnox.se", "apps.fortnox.se"],
  auth: {
    // Each integration is registered in the Fortnox developer portal, so the connect page asks for its client.
    oauth: oauth2({
      authorizationUrl: "https://apps.fortnox.se/oauth-v1/auth",
      tokenUrl: "https://apps.fortnox.se/oauth-v1/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes,
      authorizationParams: { access_type: "offline" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.fortnox.se/3/companyinformation", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { CompanyInformation: company } = await decodeJson(response, Company);
    return { accountInfo: { externalId: String(company.DatabaseNumber), username: company.CompanyName } };
  },
});

export default defineApp(
  { user: { accounts: { fortnox: fortnox.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fortnox ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fortnox",
        description:
          "Customers, invoices, orders, offers, suppliers, vouchers, accounts, articles, projects and the rest of the Fortnox accounting API.",
        icons,
      },
    ),
  }),
);
