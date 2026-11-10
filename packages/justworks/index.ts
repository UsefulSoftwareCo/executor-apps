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

const Company = object({ id: string(), display_name: string() });

const justworks = defineProvider({
  name: "Justworks",
  hosts: ["public-api.justworks.com", "payroll.justworks.com"],
  auth: {
    // Justworks creates OAuth applications for approved partners only (partner-api@justworks.com).
    oauth: oauth2({
      authorizationUrl: "https://payroll.justworks.com/oauth/authorize",
      tokenUrl: "https://public-api.justworks.com/oauth/token",
      revocationUrl: "https://public-api.justworks.com/v1/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "company.basic:read",
        "company.detail:read",
        "company.bank_account:read",
        "member.basic:read",
        "member.detail:read",
        "member.dob:read",
        "member.employment:read",
        "member.pay:read",
        "member:write",
        "member.sex:read",
        "member.tax_id:read",
        "payroll:read",
        "paystub:read",
        "time_off:read",
        "time_off:write",
        "deductions:read",
        "deductions:write",
        "invoice:read",
        "benefits:read",
        "subscriptions:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://public-api.justworks.com/v1/company", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const company = await decodeJson(response, Company);
    return { accountInfo: { externalId: company.id, displayName: company.display_name } };
  },
});

export default defineApp(
  { user: { accounts: { justworks: justworks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.justworks ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Justworks",
        description:
          "Company, members, payroll, paystubs, deductions, time off and subscriptions from the Justworks partner API.",
        icons,
      },
    ),
  }),
);
