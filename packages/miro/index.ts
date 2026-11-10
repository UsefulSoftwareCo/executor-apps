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

const TokenContext = object({ user: object({ id: string(), name: string() }) });

const miro = defineProvider({
  name: "Miro",
  hosts: ["api.miro.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Miro has no client registration: the connect page asks for an app's client id and secret.
    oauth: oauth2({
      authorizationUrl: "https://miro.com/oauth/authorize",
      tokenUrl: "https://api.miro.com/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "boards:read",
        "boards:write",
        "organizations:read",
        "organizations:teams:read",
        "organizations:teams:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.miro.com/v1/oauth-token", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const context = await decodeJson(response, TokenContext);
    return {
      accountInfo: { externalId: context.user.id, username: context.user.name },
    };
  },
});

export default defineApp(
  { user: { accounts: { miro: miro.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.miro ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Miro",
        description:
          "Miro boards, items (sticky notes, shapes, cards, text, images, frames), connectors, tags, board members, teams and organization administration through the Miro REST API v2.",
        icons,
      },
    ),
  }),
);
