import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { domain: string; username: string; token: string };

// Every listmonk install has its own host. Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your listmonk domain, for example listmonk.example.com.");
  }
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the listmonk domain, with no path.");
  return url.origin;
}

// listmonk API users authenticate with `Authorization: token <api_user>:<token>`.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin === origin)
      request.headers.set("Authorization", `token ${fields.username}:${fields.token}`);
    return fetcher(request);
  }) as Fetch;
}

const listmonk = defineProvider({
  name: "listmonk",
  auth: {
    // An API user created under Admin > Users in listmonk. The domain is part of the account, so no static hosts.
    apiUser: secrets({
      label: "API user",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/lists?per_page=1`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${account.fields.username}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { listmonk: listmonk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.listmonk ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api`,
              cache,
              fetch: authorizedFetch(origin, account.fields, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "listmonk",
        description: "Manage a self-hosted listmonk newsletter server: subscribers, lists, campaigns, templates, media and bounces.",
        icons,
      },
    ),
  }),
);
