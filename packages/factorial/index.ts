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

const Credentials = object({ data: array(object({ id: string(), company_id: string() })) });

const factorial = defineProvider({
  name: "Factorial",
  hosts: ["api.factorialhr.com", "id.factorialhr.com"],
  auth: {
    // Settings > API Keys in Factorial (admin only).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // An admin registers the app under Settings > Advanced configuration > OAuth applications.
    oauth2: oauth2({
      authorizationUrl: "https://id.factorialhr.com/oauth/authorize",
      tokenUrl: "https://id.factorialhr.com/api/oauth/token",
      revocationUrl: "https://id.factorialhr.com/api/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["approvals", "banking", "company_holidays", "company_legal_entities", "company_locations", "compensations", "contracts", "custom_fields", "documents", "employee_updates", "employees", "expenses", "finance", "integrations", "it_management", "job_catalog", "marketplace", "payroll", "payroll_supplements", "performance", "posts", "processes", "project_management_expenses", "project_management_projects", "project_management_time", "read", "recruitment", "shift_management", "tasks", "time_off", "time_tracking", "trainings", "write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth2"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "x-api-key": `${account.fields.token}` };
    const response = await fetch(
      "https://api.factorialhr.com/api/2026-10-01/resources/api_public/credentials",
      { signal, headers },
    );
    const body = await decodeJson(response, Credentials);
    const first = body.data[0];
    return { accountInfo: { externalId: first?.company_id ?? "factorial" } };
  },
});

export default defineApp(
  { user: { accounts: { factorial: factorial.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.factorial ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Factorial",
        description:
          "Employees, time off, time tracking, contracts, payroll, recruiting, documents and the rest of the Factorial HR API.",
        icons,
      },
    ),
  }),
);
