import {
  accountRouter,
  array,
  number,
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

// Back Market runs one stack per region, in production and preprod. Credentials only go to these hosts.
const platforms = [
  "www.backmarket.com",
  "www.backmarket.fr",
  "www.backmarket.co.jp",
  "preprod.backmarket.com",
  "preprod.backmarket.fr",
  "preprod.backmarket.co.jp",
];

function originOf(raw: string): string {
  const host = raw.trim().replace(/^https:\/\//i, "").replace(/\/+$/, "").toLowerCase();
  if (!platforms.includes(host)) {
    throw new Error(`Platform must be one of: ${platforms.join(", ")}.`);
  }
  return `https://${host}`;
}

// Back Market requires a User-Agent shaped BM-{CompanyName}-{IntegrationName};contact@domain and may refuse others.
const userAgent = "BM-ExecutorSh-Executor;support@executor.sh";

// Every request to the platform carries it.
function withUserAgent(fetcher: typeof fetch): typeof fetch {
  return ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const request = new Request(input, init);
    if (!request.headers.has("User-Agent")) request.headers.set("User-Agent", userAgent);
    return fetcher(request);
  }) as typeof fetch;
}

const backmarket = defineProvider({
  name: "Back Market",
  hosts: platforms,
  auth: {
    // The API token is created in the seller back office under Integrations.
    apiKey: secrets({
      label: "API token",
      fields: object({
        platform: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.platform);
    const response = await withUserAgent(fetch)(`${origin}/ws/listings?page-size=1`, {
      signal,
      headers: { Authorization: `Basic ${account.fields.token}`, Accept: "application/json", "Accept-Language": "en-us" },
    });
    await decodeJson(response, object({ count: number(), results: array(object({})) }));
    // A digest, so the account id never contains part of the credential.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(account.fields.token));
    const id = [...new Uint8Array(digest).slice(0, 6)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { accountInfo: { externalId: `${origin}:${id}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { backmarket: backmarket.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.backmarket ?? [],
        (account) => {
          const origin = originOf(account.fields.platform);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch: withUserAgent(fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Back Market",
        description:
          "Manage a Back Market seller account: category tree, listings, orders and orderlines, buyback orders and listings, shipping deliveries and returns, after-sales care folders and competitor pricing.",
        icons,
      },
    ),
  }),
);
