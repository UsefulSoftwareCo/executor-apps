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
import { siteOptions, siteUrl } from "./openapi.js";

const maxio = defineProvider({
  name: "Maxio",
  hosts: ["*.chargify.com", "*.ebilling.maxio.com"],
  auth: {
    // Maxio sends the API key as the basic-auth username with the fixed password "x".
    apiKey: secrets({
      label: "API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("authorization", t`Basic ${base64(t`${apiKey}:x`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.site)}/site.json`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { maxio: maxio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.maxio ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({ ...siteOptions(account.fields.site), cache, fetch: signed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Maxio",
        description:
          "Maxio Advanced Billing (formerly Chargify): customers, subscriptions, products, components, invoices, coupons, payments and reporting.",
        icons,
      },
    ),
  }),
);
