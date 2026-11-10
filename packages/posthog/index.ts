import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// PostHog's official remote MCP server. One endpoint serves US and EU Cloud: the authorization
// server (oauth.posthog.com) and the server itself route each account to its own region.
const url = "https://mcp.posthog.com/mcp";

// Scopes: the server's protected-resource scopes_supported, minus introspection and the admin
// scopes organization:write, user:write and access_control:write.
const scopes = [
  "access_control:read", "account:read", "account:write", "action:read", "action:write", "activity_log:read",
  "ai_observability_clusters:read", "ai_observability_clusters:write", "alert:read", "alert:write",
  "annotation:read", "annotation:write", "approvals:read", "approvals:write", "autoresearch:read",
  "autoresearch:write", "batch_export:read", "batch_export:write", "billing:read", "business_knowledge:read",
  "business_knowledge:write", "canvas:read", "canvas:write", "cohort:read", "cohort:write", "comment:read",
  "comment:write", "conversation:read", "cross_project_dashboard:read", "customer_analytics:read",
  "customer_analytics:write", "customer_task:read", "customer_task:write", "dashboard:read",
  "dashboard:write", "dashboard_template:read", "data_catalog:read", "data_catalog:write",
  "data_catalog_approval:write", "dataset:read", "dataset:write", "early_access_feature:read",
  "early_access_feature:write", "element:read", "email", "endpoint:read", "endpoint:write",
  "engineering_analytics:read", "error_tracking:read", "error_tracking:write", "evaluation:read",
  "evaluation:write", "event_definition:read", "event_definition:write", "experiment:read",
  "experiment:write", "experiment_holdout:read", "experiment_holdout:write", "experiment_saved_metric:read",
  "experiment_saved_metric:write", "external_data_source:read", "external_data_source:write",
  "feature_flag:read", "feature_flag:write", "field_note:read", "field_note:write", "group:read",
  "health_issue:read", "heatmap:read", "heatmap:write", "hog_flow:read", "hog_flow:write",
  "hog_function:read", "hog_function:write", "insight:read", "insight:write", "insight_variable:write",
  "integration:read", "integration:write", "llm_analytics:read", "llm_analytics:write", "llm_prompt:read",
  "llm_prompt:write", "llm_provider_key:read", "llm_skill:read", "llm_skill:write", "logs:read",
  "logs:write", "loop:read", "loop:write", "marketing_analytics:read", "marketing_analytics:write",
  "mcp_analytics:read", "mcp_analytics:write", "mcp_registry:read", "metrics:read", "notebook:read",
  "notebook:write", "offline_evaluation_ingestion:write", "openid", "organization:read",
  "organization_member:read", "person:read", "person:write", "product_enablement:write", "profile",
  "project:read", "project:write", "property_definition:read", "property_definition:write", "query:read",
  "replay_scanner:read", "replay_scanner:write", "review_hog:read", "review_hog:write",
  "session_recording:read", "session_recording:write", "session_recording_playlist:read",
  "session_recording_playlist:write", "signal_scout:read", "signal_scout:write", "stamphog:read",
  "stamphog:write", "streamlit_app:read", "streamlit_app:write", "subscription:read", "subscription:write",
  "survey:read", "survey:write", "tagger:read", "tagger:write", "task:read", "task:write", "ticket:read",
  "ticket:write", "today:read", "tracing:read", "uploaded_media:read", "uploaded_media:write",
  "usage_metric:read", "usage_metric:write", "user:read", "vision_alert:read", "vision_alert:write",
  "visual_review:read", "visual_review:write", "warehouse_objects:write", "warehouse_table:read",
  "warehouse_table:write", "warehouse_view:read", "warehouse_view:write", "web_analytics:read",
  "web_analytics:write",
];

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "apiKey" ? account.fields.token : account.fields.access_token}`,
});

const posthog = defineProvider({
  name: "PostHog",
  hosts: ["mcp.posthog.com", "oauth.posthog.com"],
  auth: {
    // A personal API key created with the "MCP Server" preset (Settings > User > Personal API keys),
    // sent as a Bearer token, per PostHog's MCP docs. The preset scopes the key to one project.
    apiKey: secrets({
      label: "Personal API key (MCP Server preset)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server advertises dynamic client registration, S256 PKCE and the token endpoint auth
    // methods none, client_secret_post and private_key_jwt, so Executor's client is a public PKCE client.
    oauth: oauth2({ discover: url, scopes, tokenEndpointAuthMethod: "none" }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { posthog: posthog.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.posthog ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "PostHog",
        description:
          "Product analytics, HogQL/SQL queries, insights, dashboards, feature flags, experiments, surveys, session replay, error tracking, logs, LLM analytics, data warehouse and more, through PostHog's MCP server.",
        instructions:
          "Most tools act on the active project. List organizations and projects with organizations-get and projects-get, and change the active project with switch-project before working in another one. Read-only tools run without approval; everything else asks.",
        icons,
      },
    ),
  }),
);
