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

const Session = object({ id: string(), name: string() });

const onshape = defineProvider({
  name: "Onshape",
  hosts: ["cad.onshape.com"],
  auth: {
    apiKey: secrets({
      label: "API key (access key and secret key from the Onshape developer portal)",
      fields: object({ accessKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
    // Onshape has no dynamic registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://oauth.onshape.com/oauth/authorize",
      tokenUrl: "https://oauth.onshape.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["OAuth2Read", "OAuth2Write", "OAuth2Delete", "OAuth2ReadPII"],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.accessKey}:${account.fields.secretKey}`)}`;
    const response = await fetch("https://cad.onshape.com/api/v17/users/sessioninfo", {
      signal,
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    const me = await decodeJson(response, Session);
    return { accountInfo: { externalId: me.id, username: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { onshape: onshape.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onshape ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Onshape",
        description:
          "Cloud CAD documents, workspaces, versions, part studios, assemblies, drawings, exports, translations and teams.",
        icons,
      },
    ),
  }),
);
