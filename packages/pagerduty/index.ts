import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
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

const Abilities = object({ abilities: array(string()) });

const pagerduty = defineProvider({
  name: "PagerDuty",
  hosts: ["api.pagerduty.com", "identity.pagerduty.com"],
  auth: {
    apiKey: secrets({
      label: "REST API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // PagerDuty has no client registration: the connect page asks for the client of an app
    // created under Integrations > App Registration.
    oauth: oauth2({
      authorizationUrl: "https://identity.pagerduty.com/oauth/authorize",
      tokenUrl: "https://identity.pagerduty.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["read", "write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const Authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Token token=${account.fields.token}`;
    const response = await fetch("https://api.pagerduty.com/abilities", {
      signal,
      headers: { Authorization, Accept: "application/vnd.pagerduty+json;version=2" },
    });
    await decodeJson(response, Abilities);
    // GET /abilities is account-level and returns no identifier. /users/me exists only for user
    // tokens, so account-level keys have no upstream identity to report.
    return { accountInfo: { externalId: "pagerduty", username: "PagerDuty account" } };
  },
});

export default defineApp(
  { user: { accounts: { pagerduty: pagerduty.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pagerduty ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PagerDuty",
        description:
          "Incidents, services, schedules, escalation policies, users, teams, on-calls and the rest of the PagerDuty REST API.",
        icons,
      },
    ),
  }),
);
