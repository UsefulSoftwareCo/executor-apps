import type { OpenapiToolNamesOptions } from "apps/openapi";
import analytics from "./analytics.openapi.json" with { type: "json" };
import customerScores from "./customer-scores.openapi.json" with { type: "json" };
import entities from "./entities.openapi.json" with { type: "json" };
import jiraIntegrations from "./jira-integrations.openapi.json" with { type: "json" };
import members from "./members.openapi.json" with { type: "json" };
import notes from "./notes.openapi.json" with { type: "json" };
import pluginIntegrations from "./plugin-integrations.openapi.json" with { type: "json" };
import teams from "./teams.openapi.json" with { type: "json" };
import webhooks from "./webhooks.openapi.json" with { type: "json" };

// Productboard publishes one official OpenAPI 3.1 document per REST API v2 area at
// https://developer.productboard.com/v2.0.0/openapi/<name>.yaml (also bundled in
// https://github.com/productboard/pb-api/releases). The docs host sits behind a Cloudflare bot challenge that
// blocks automated fetches, so the documents are vendored here unmodified and index.ts mounts each under its
// own key. Every document declares https://api.productboard.com/v2, BearerAuth for API tokens and an OAuth2
// scheme; both carry a bearer token, so OAuth access tokens are sent through BearerAuth too.
const api = (document: unknown, kinds: Record<string, "query"> = {}) =>
  ({
    source: { document: document as never },
    allowedOrigin: "https://api.productboard.com",
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
    methods: {
      token: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
      oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
    kinds,
  }) satisfies OpenapiToolNamesOptions;

// POST search endpoints only read, so they run without an approval prompt.
export const entitiesOptions = api(entities, { performEntitiesSearch: "query" });
export const notesOptions = api(notes, { performNotesSearch: "query" });
export const membersOptions = api(members, { performMembersSearch: "query" });
export const teamsOptions = api(teams, { performTeamsSearch: "query" });
export const webhooksOptions = api(webhooks);
export const jiraIntegrationsOptions = api(jiraIntegrations);
export const pluginIntegrationsOptions = api(pluginIntegrations, {
  searchPluginIntegrationConnections: "query",
});
export const customerScoresOptions = api(customerScores);
export const analyticsOptions = api(analytics);

export const apis = {
  entities: entitiesOptions,
  notes: notesOptions,
  members: membersOptions,
  teams: teamsOptions,
  webhooks: webhooksOptions,
  jiraIntegrations: jiraIntegrationsOptions,
  pluginIntegrations: pluginIntegrationsOptions,
  customerScores: customerScoresOptions,
  analytics: analyticsOptions,
} as const;

// scripts/tools.ts reads `options`; entities is the main area.
export const options = entitiesOptions;
