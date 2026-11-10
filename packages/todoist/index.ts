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

const User = object({ id: string(), full_name: string() });

const todoist = defineProvider({
  name: "Todoist",
  hosts: ["api.todoist.com"],
  auth: {
    token: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Todoist has no dynamic client registration: the connect page asks for an app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.todoist.com/oauth/authorize",
      tokenUrl: "https://api.todoist.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: ["data:read_write", "data:delete", "project:delete"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.todoist.com/api/v1/user", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.id, username: me.full_name } };
  },
});

export default defineApp(
  { user: { accounts: { todoist: todoist.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.todoist ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Todoist",
        description:
          "Tasks, projects, sections, labels, comments, reminders, filters, workspaces and the rest of the Todoist API.",
        icons,
      },
    ),
  }),
);
