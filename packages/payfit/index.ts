import {
  accountRouter,
  boolean,
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

const Introspection = object({ active: boolean(), company_id: string() });

const payfit = defineProvider({
  name: "PayFit",
  hosts: ["partner-api.payfit.com", "oauth.payfit.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Partner OAuth apps are issued by PayFit when a partnership is established.
    oauth: oauth2({
      authorizationUrl: "https://oauth.payfit.com/authorize",
      tokenUrl: "https://oauth.payfit.com/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "collaborators:read",
        "collaborators:contracts:read",
        "collaborators:management:read",
        "collaborators:personal:read",
        "contracts:read",
        "contracts:payslips:read",
        "accounting:read",
        "payment-files:read",
        "time:read",
        "time:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://oauth.payfit.com/introspect", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const info = await decodeJson(response, Introspection);
    return { accountInfo: { externalId: info.company_id, username: info.company_id } };
  },
});

export default defineApp(
  { user: { accounts: { payfit: payfit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.payfit ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PayFit",
        description:
          "Company, collaborators, contracts, payslips, absences, accounting data and payment files from the PayFit payroll partner API.",
        instructions:
          "Most operations take a companyId path parameter: the id of the single company the connected credential belongs to, shown as the account's external id.",
        icons,
      },
    ),
  }),
);
