import {
  accountRouter,
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

const gamma = defineProvider({
  name: "Gamma",
  hosts: ["public-api.gamma.app", "auth.gamma.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Gamma publishes protected-resource metadata and dynamic client registration. Discovery from the
    // API origin finds the endpoints; the explicit resource sends the RFC 8707 indicator Gamma requires.
    oauth: oauth2({
      discover: "https://public-api.gamma.app",
      resource: "https://public-api.gamma.app",
      scopes: ["generate"],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-API-KEY": `${account.fields.token}` };
    const response = await fetch("https://public-api.gamma.app/v1.0/folders", { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { gamma: gamma.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gamma ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Gamma",
        description:
          "Generate, edit and export presentations, documents, websites and social posts in Gamma, and browse gammas, templates, themes, folders, comments and analytics.",
        icons,
      },
    ),
  }),
);
