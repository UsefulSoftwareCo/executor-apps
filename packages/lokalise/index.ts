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

const lokalise = defineProvider({
  name: "Lokalise",
  hosts: ["api.lokalise.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Lokalise has no client registration: the connect page asks for the OAuth 2 app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.lokalise.com/oauth2/auth",
      tokenUrl: "https://app.lokalise.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: ["delete_contributors", "delete_keys", "read_background_processes", "read_comments", "read_contributors", "read_custom_translation_statuses", "read_files", "read_glossary", "read_keys", "read_languages", "read_projects", "read_screenshots", "read_snapshots", "read_tasks", "read_team_groups", "read_team_users", "read_translations", "read_webhooks", "write_comments", "write_contributors", "write_custom_translation_statuses", "write_files", "write_glossary", "write_keys", "write_languages", "write_projects", "write_screenshots", "write_snapshots", "write_tasks", "write_team_groups", "write_team_users", "write_translations", "write_webhooks"],
    }),
  },
  // /users/me is unavailable to OAuth tokens, so check the projects list, which both accept.
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Api-Token": account.fields.token };
    const response = await fetch("https://api.lokalise.com/api2/projects?limit=1", { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lokalise: lokalise.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lokalise ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lokalise",
        description:
          "Manage Lokalise localization projects: keys, translations, files, tasks, contributors, languages, glossary, screenshots and webhooks.",
        icons,
      },
    ),
  }),
);
