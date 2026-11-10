import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const pipedream = defineProvider({
  name: "Pipedream",
  hosts: ["api.pipedream.com"],
  auth: {
    // A user API key from https://pipedream.com/user; Pipedream supports it on a limited set of endpoints.
    apiKey: secrets({
      label: "User API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The client id and secret of an OAuth client in Pipedream workspace settings > API.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.pipedream.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: ["*"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const url =
      account.method === "oauth"
        ? "https://api.pipedream.com/v1/connect/projects"
        : "https://api.pipedream.com/v1/users/me";
    const response = await fetch(url, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "pipedream", displayName: "Pipedream workspace" } };
  },
});

export default defineApp(
  { user: { accounts: { pipedream: pipedream.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pipedream ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pipedream",
        description:
          "Pipedream Connect and REST API: projects, external users, connected accounts, apps, actions, triggers, deployed triggers, custom OAuth clients and the Connect proxy.",
        icons,
        instructions:
          "Most tools take a project_id and an x-pd-environment value (development or production). Find the project id with the projects tools.",
      },
    ),
  }),
);
