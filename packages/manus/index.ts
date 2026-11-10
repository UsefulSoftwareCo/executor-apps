import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  literal,
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

const manus = defineProvider({
  name: "Manus",
  hosts: ["api.manus.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Team-type Open Apps (any Team member can create one under Settings, Developers, Open Apps).
    oauth: oauth2({
      authorizationUrl: "https://manus.im/openapi/oauth",
      tokenUrl: "https://api.manus.ai/oauth/token",
      revocationUrl: "https://api.manus.ai/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["create_task", "manage_all_tasks", "create_project", "use_connectors", "use_my_browsers"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.manus.ai/v2/user.me", {
      signal,
      headers:
        account.method === "oauth"
          ? { Authorization: `Bearer ${account.fields.access_token}` }
          : { "x-manus-api-key": account.fields.token },
    });
    await decodeJson(response, object({ ok: literal(true) }));
  },
});

export default defineApp(
  { user: { accounts: { manus: manus.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.manus ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Manus",
        description: "Run Manus AI agent tasks and manage projects, files, webhooks, agents, artifacts, usage and websites.",
        icons,
      },
    ),
  }),
);
