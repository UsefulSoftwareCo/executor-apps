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

const Profile = object({ gotrue_id: string(), primary_email: string(), username: string() });

const supabase = defineProvider({
  name: "Supabase",
  hosts: ["api.supabase.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Supabase has no dynamic registration for this flow: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://api.supabase.com/v1/oauth/authorize",
      tokenUrl: "https://api.supabase.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "analytics:read",
        "analytics:write",
        "analytics_config:read",
        "analytics_config:write",
        "auth:read",
        "auth:write",
        "database:read",
        "database:write",
        "domains:read",
        "domains:write",
        "edge_functions:read",
        "edge_functions:write",
        "environment:read",
        "environment:write",
        "organizations:read",
        "organizations:write",
        "projects:read",
        "projects:write",
        "rest:read",
        "rest:write",
        "secrets:read",
        "secrets:write",
        "storage:read",
        "storage:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.supabase.com/v1/profile", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await decodeJson(response, Profile);
    return { accountInfo: { externalId: profile.gotrue_id, username: profile.username } };
  },
});

export default defineApp(
  { user: { accounts: { supabase: supabase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.supabase ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Supabase",
        description:
          "Supabase Management API: projects, organizations, databases, branches, auth config, edge functions, secrets, storage and more.",
        icons,
      },
    ),
  }),
);
