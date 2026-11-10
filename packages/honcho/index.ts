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

const honcho = defineProvider({
  name: "Honcho",
  hosts: ["api.honcho.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Honcho publishes RFC 8414 metadata with a registration_endpoint, so Executor registers a public PKCE client itself.
    oauth: oauth2({ discover: "https://api.honcho.dev" }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.honcho.dev/v3/workspaces/list", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { honcho: honcho.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.honcho ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Honcho",
        description: "Memory and reasoning for AI agents with Honcho: workspaces, peers, sessions, messages, conclusions, search, context and webhooks.",
        icons,
      },
    ),
  }),
);
