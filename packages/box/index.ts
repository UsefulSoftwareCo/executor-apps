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

const Me = object({ id: string(), name: string() });

const box = defineProvider({
  name: "Box",
  hosts: ["api.box.com"],
  auth: {
    token: secrets({
      label: "Developer token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Box has no dynamic client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://account.box.com/api/oauth2/authorize",
      tokenUrl: "https://api.box.com/oauth2/token",
      revocationUrl: "https://api.box.com/oauth2/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      // Box governs scopes on the Custom App; an empty list omits the `scope` parameter.
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.box.com/2.0/users/me?fields=id,name", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.id, username: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { box: box.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.box ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Box",
        description:
          "Files, folders, collaborations, comments, tasks, metadata, search, shared links and the rest of the Box Platform API.",
        icons,
      },
    ),
  }),
);
