import {
  accountRouter,
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
import { options } from "./openapi.js";

const Organization = object({ id: string(), name: string() });

const candis = defineProvider({
  name: "Candis",
  hosts: ["api.candis.io"],
  auth: {
    // Credentials come from Settings > Candis API in the Candis app; the Keycloak realm publishes OIDC metadata.
    oauth: oauth2({
      discover: "https://id.my.candis.io/auth/realms/candis",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["offline_access", "core_data", "exports"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.candis.io/v1/organizations/info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const organization = await decodeJson(response, Organization);
    return { accountInfo: { externalId: organization.id, username: organization.name } };
  },
});

export default defineApp(
  { user: { accounts: { candis: candis.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.candis ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Candis",
        description:
          "Candis accounts payable: exports and postings, core data imports (ledger accounts, cost centers, tax codes, contacts, purchase orders), invoices, purchase requests and reimbursements.",
        icons,
      },
    ),
  }),
);
