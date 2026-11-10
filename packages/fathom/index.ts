import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const fathom = defineProvider({
  name: "Fathom",
  hosts: ["api.fathom.ai", "fathom.video"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Fathom offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://fathom.video/external/v1/oauth2/authorize",
      tokenUrl: "https://fathom.video/external/v1/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["public_api"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Api-Key": account.fields.token };
    const response = await fetch("https://api.fathom.ai/external/v1/teams", { signal, headers });
    await decodeJson(response, object({ items: array(object({ name: string() })) }));
  },
});

export default defineApp(
  { user: { accounts: { fathom: fathom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fathom ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fathom",
        description:
          "Fathom meeting recordings: meetings, summaries, transcripts, recording downloads, teams, team members, users, meeting types and webhooks.",
        icons,
      },
    ),
  }),
);
