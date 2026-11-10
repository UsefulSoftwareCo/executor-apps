import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ id: string() });

const todo = defineProvider({
  name: "Microsoft To Do",
  hosts: ["graph.microsoft.com"],
  auth: {
    // Microsoft Entra v2 delegated flow. The multi-tenant "common" authority's discovery document
    // advertises a templated issuer ({tenantid}), so the endpoints are declared instead of discovered.
    // The connect page asks for the app registration's client, which must be multi-tenant.
    oauth: oauth2({
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline_access",
        "User.Read",
        "Tasks.ReadWrite",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { todo: todo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.todo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Microsoft To Do",
        description:
          "Microsoft To Do task lists, tasks, checklist items, attachments and linked resources through Microsoft Graph, for the signed-in user. List the task lists first, then the tasks in a list; ids are opaque strings. Dates are dateTimeTimeZone objects ({ dateTime, timeZone }). Works with personal Microsoft accounts and work or school accounts.",
        icons,
      },
    ),
  }),
);
