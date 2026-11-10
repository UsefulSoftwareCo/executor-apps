import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ id: number(), name: string() });

const arena = defineProvider({
  name: "Are.na",
  hosts: ["api.are.na"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Are.na's authorize page is on www.are.na; the token endpoint is on api.are.na.
    oauth: oauth2({
      authorizationUrl: "https://www.are.na/oauth/authorize",
      tokenUrl: "https://api.are.na/v3/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.are.na/v3/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.id), username: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { arena: arena.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.arena ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Are.na",
        description: "Collect and organize ideas on Are.na: channels, blocks, connections, comments, groups, users, feeds and search.",
        icons,
      },
    ),
  }),
);
