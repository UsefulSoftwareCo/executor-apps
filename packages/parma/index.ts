import {
  accountRouter,
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


const parma = defineProvider({
  name: "Parma",
  hosts: ["app.parma.ai"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Parma issues OAuth clients by email (partner@parma.ai); the connect page asks for that client.
    oauth: oauth2({
      authorizationUrl: "https://app.parma.ai/oauth/authorize",
      tokenUrl: "https://app.parma.ai/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["full"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://app.parma.ai/api/v1/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Parma returned ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { parma: parma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.parma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Parma",
        description: "Relationships, notes, deals, groups and pipeline stages in Parma CRM.",
        icons,
      },
    ),
  }),
);
