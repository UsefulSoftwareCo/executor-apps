import {
  accountRouter,
  base64,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { kintoneOptions, siteUrl } from "./openapi.js";

const hostCheck = async (
  fetch: typeof globalThis.fetch,
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
) => {
  const response = await fetch(url, { signal, headers: { ...headers, Accept: "application/json" } });
  await decodeJson(response, object({}));
};

const kintone = defineProvider({
  name: "Kintone",
  hosts: ["*.cybozu.com", "*.kintone.com", "*.cybozu.cn"],
  auth: {
    // OAuth is not declared: Kintone's authorize and token endpoints are per-site
    // (https://<subdomain>.cybozu.com/oauth2/...) and the framework only takes static endpoint strings.
    apiToken: secrets({
      label: "API token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        appId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("x-cybozu-api-token", t`${token}`),
    }),
    password: secrets({
      label: "Login name and password",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        login: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
      request: ({ login, password }) =>
        header("x-cybozu-authorization", t`${base64(t`${login}:${password}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const site = siteUrl(account.fields.domain);
    if (account.method === "apiToken") {
      await hostCheck(
        fetch,
        account.url(`${site}/k/v1/app.json?id=${encodeURIComponent(account.fields.appId)}`),
        account.headers(),
        signal,
      );
    } else {
      await hostCheck(fetch, account.url(`${site}/k/v1/apps.json?limit=1`), account.headers(), signal);
    }
  },
});

export default defineApp(
  { user: { accounts: { kintone: kintone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kintone ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({
              ...kintoneOptions(account.fields.domain),
              cache,
              fetch: signed,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Kintone",
        description:
          "Kintone no-code business apps: records, app settings and forms, spaces, files, comments, statuses and bulk requests.",
        icons,
      },
    ),
  }),
);
