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

const Member = object({ id: string(), username: string(), url: string() });

const trello = defineProvider({
  name: "Trello",
  hosts: ["api.trello.com"],
  auth: {
    credentials: secrets({
      label: "API key and token",
      fields: object({ key: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
    // Trello has no client registration API: the connect page asks for the client created on the
    // OAuth 2.0 tab of the app at https://trello.com/apps/admin. Tokens come from Atlassian's
    // authorization server; the vendor sends client credentials in a JSON body.
    oauth: oauth2({
      authorizationUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      authorizationParams: { prompt: "consent" },
      scopes: [
        "read:board:trello",
        "write:board:trello",
        "write:board:membership:trello",
        "read:organization:trello",
        "write:organization:trello",
        "write:organization:membership:trello",
        "read:member:trello",
        "write:member:trello",
        "read:enterprise:trello",
        "write:enterprise:trello",
        "offline_access",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const query = new URLSearchParams({ fields: "username,url" });
    if (account.method === "credentials") {
      query.set("key", account.fields.key);
      query.set("token", account.fields.token);
    }
    const response = await fetch(`https://api.trello.com/1/members/me?${query}`, {
      signal,
      headers: account.method === "oauth" ? { Authorization: `Bearer ${account.fields.access_token}` } : {},
    });
    const me = await decodeJson(response, Member);
    return { accountInfo: { externalId: me.id, username: me.username, profileUrl: me.url } };
  },
});

export default defineApp(
  { user: { accounts: { trello: trello.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.trello ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Trello",
        description:
          "Boards, lists, cards, checklists, labels, members, workspaces and webhooks from the Trello REST API.",
        icons,
      },
    ),
  }),
);
