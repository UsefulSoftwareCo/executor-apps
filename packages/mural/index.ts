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

const Me = object({
  value: object({ id: string(), firstName: string(), lastName: string(), avatar: string() }),
});

const mural = defineProvider({
  name: "Mural",
  hosts: ["app.mural.co"],
  auth: {
    // Mural apps are registered in the developer portal; the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://app.mural.co/api/public/v1/authorization/oauth2",
      tokenUrl: "https://app.mural.co/api/public/v1/authorization/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "identity:read",
        "workspaces:read",
        "workspaces:write",
        "rooms:read",
        "rooms:write",
        "murals:read",
        "murals:write",
        "templates:read",
        "templates:write",
        "users:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.mural.co/api/public/v1/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const { value } = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: value.id,
        displayName: `${value.firstName} ${value.lastName}`,
        avatarUrl: value.avatar,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { mural: mural.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mural ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mural",
        description:
          "Mural whiteboards: murals, widgets (sticky notes, shapes, text, files), rooms, workspaces, templates, tags and users.",
        icons,
      },
    ),
  }),
);
