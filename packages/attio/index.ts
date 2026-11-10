import {
  accountRouter,
  boolean,
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

const Self = object({ active: boolean(), sub: string(), workspace_name: string() });

const attio = defineProvider({
  name: "Attio",
  hosts: ["api.attio.com", "app.attio.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Attio has no dynamic client registration: the connect page asks for an OAuth app's client.
    // Scopes are configured on the app in Attio's developer settings, not in the authorize request.
    oauth: oauth2({
      authorizationUrl: "https://app.attio.com/authorize",
      tokenUrl: "https://app.attio.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.attio.com/v2/self", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Self);
    if (me.active !== true) throw new Error("Attio token is not active");
    return { accountInfo: { externalId: me.sub, username: me.workspace_name } };
  },
});

export default defineApp(
  { user: { accounts: { attio: attio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.attio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Attio",
        description:
          "Attio CRM: records, objects, lists, entries, notes, tasks, comments, meetings and workspace members.",
        icons,
      },
    ),
  }),
);
