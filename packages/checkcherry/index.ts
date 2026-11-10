import {
  accountRouter,
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

const checkcherry = defineProvider({
  name: "Check Cherry",
  hosts: ["api.checkcherry.com", "www.checkcherry.com"],
  auth: {
    apiKey: secrets({
      label: "Integration key",
      fields: object({ key: string({ minLength: 1 }) }),
    }),
    // Public client: authorization code with PKCE (S256) and no client secret.
    oauth: oauth2({
      authorizationUrl: "https://www.checkcherry.com/oauth/authorize",
      tokenUrl: "https://www.checkcherry.com/oauth/token",
      tokenEndpointAuthMethod: "none",
      scopes: [
        "event_create",
        "unassigned_event_read",
        "unassigned_event_read_pricing",
        "unassigned_event_write",
        "proposal_create",
        "proposal_read",
        "proposal_write",
        "lead_create",
        "lead_read",
        "lead_write",
        "appointment_create",
        "unassigned_appointment_read",
        "unassigned_appointment_write",
        "expense_read",
        "expense_create",
        "expense_write",
        "offerings_read",
        "offerings_write",
        "employee_read",
        "user_read",
        "reports_read",
        "availability_read",
        "planning_read",
        "design_template_read",
        "design_template_select",
        "user_appointment_calendar_read",
      ],
    }),
  },
  // OAuth tokens only carry the requested scopes, so check against a GET that needs a declared one
  // (offerings_read). The help-center endpoint needs "global" permission, which OAuth cannot grant.
  async health({ account, fetch, signal }) {
    const oauth = account.method === "oauth";
    const headers: Record<string, string> = oauth
      ? { Authorization: `Bearer ${account.fields.access_token}` }
      : { "Api-Key": account.fields.key };
    const url = oauth
      ? "https://api.checkcherry.com/api/v1/add_on_categories"
      : "https://api.checkcherry.com/api/v1/support_articles?per=1";
    const response = await fetch(url, { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { checkcherry: checkcherry.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.checkcherry ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Check Cherry",
        description:
          "Photography and event business management: leads, bookings, appointments, proposals, payments, packages, add-ons, questionnaires, staff and reports.",
        icons,
      },
    ),
  }),
);
