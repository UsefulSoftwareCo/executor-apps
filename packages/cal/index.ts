import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ id: number(), email: string() });

const cal = defineProvider({
  name: "Cal.com",
  hosts: ["api.cal.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Cal.com has no dynamic registration: the connect page asks for the client of an OAuth
    // client created in Settings > Developer > OAuth clients (needs Cal.com approval).
    oauth: oauth2({
      authorizationUrl: "https://app.cal.com/auth/oauth2/authorize",
      tokenUrl: "https://api.cal.com/v2/auth/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "EVENT_TYPE_READ",
        "EVENT_TYPE_WRITE",
        "BOOKING_READ",
        "BOOKING_WRITE",
        "SCHEDULE_READ",
        "SCHEDULE_WRITE",
        "APPS_READ",
        "APPS_WRITE",
        "PROFILE_READ",
        "PROFILE_WRITE",
        "WEBHOOK_READ",
        "WEBHOOK_WRITE",
        "VERIFIED_RESOURCES_READ",
        "VERIFIED_RESOURCES_WRITE",
        "CREDITS_READ",
        "CREDITS_WRITE",
        "INSIGHTS_READ",
        "TEAM_EVENT_TYPE_READ",
        "TEAM_EVENT_TYPE_WRITE",
        "TEAM_BOOKING_READ",
        "TEAM_SCHEDULE_READ",
        "TEAM_SCHEDULE_WRITE",
        "TEAM_PROFILE_READ",
        "TEAM_PROFILE_WRITE",
        "TEAM_MEMBERSHIP_READ",
        "TEAM_MEMBERSHIP_WRITE",
        "TEAM_APPS_READ",
        "TEAM_APPS_WRITE",
        "TEAM_ROUTING_FORM_READ",
        "TEAM_ROUTING_FORM_WRITE",
        "TEAM_WORKFLOW_READ",
        "TEAM_WORKFLOW_WRITE",
        "TEAM_VERIFIED_RESOURCES_READ",
        "TEAM_VERIFIED_RESOURCES_WRITE",
        "TEAM_INSIGHTS_READ",
        "ORG_EVENT_TYPE_READ",
        "ORG_BOOKING_READ",
        "ORG_SCHEDULE_READ",
        "ORG_SCHEDULE_WRITE",
        "ORG_PROFILE_READ",
        "ORG_PROFILE_WRITE",
        "ORG_MEMBERSHIP_READ",
        "ORG_MEMBERSHIP_WRITE",
        "ORG_ROUTING_FORM_READ",
        "ORG_ROUTING_FORM_WRITE",
        "ORG_WEBHOOK_READ",
        "ORG_WEBHOOK_WRITE",
        "ORG_INSIGHTS_READ",
        "ORG_ATTRIBUTES_READ",
        "ORG_ATTRIBUTES_WRITE",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token =
      account.method === "oauth"
        ? account.fields.access_token
        : account.fields.token;
    const response = await fetch("https://api.cal.com/v2/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data } = await decodeJson(response, object({ data: Me }));
    return { accountInfo: { externalId: String(data.id), email: data.email } };
  },
});

export default defineApp(
  { user: { accounts: { cal: cal.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cal ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              // The document declares the bearer token as a required header parameter of every operation.
              parameterDefaults: {
                headers: {
                  Authorization: `Bearer ${String(account.method === "oauth" ? account.fields.access_token : account.fields.token)}`,
                },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Cal.com",
        description:
          "Cal.com scheduling: bookings, event types, schedules, availability, calendars, teams, organizations and webhooks.",
        icons,
        instructions:
          "Most operations require a `cal-api-version` header; use the example date shown in that parameter's description.",
      },
    ),
  }),
);
