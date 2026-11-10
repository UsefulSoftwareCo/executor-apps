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

// Meilisearch is self-hosted or on Meilisearch Cloud, so the instance URL is part of the account.
// The provider declares no `hosts` because instance domains are arbitrary; tool calls are confined
// to the account's own instance origin through liveOpenapiRouter's allowedOrigin.
function instanceBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Meilisearch instance URL, for example https://ms-1a2b3c4d5e6f.meilisearch.io.");
  }
  if (url.search !== "" || url.hash !== "") throw new Error("The Meilisearch instance URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const meilisearch = defineProvider({
  name: "Meilisearch",
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  // /version requires a valid key (unlike /health) and always returns pkgVersion.
  async health({ account, fetch, signal }) {
    const base = instanceBase(account.fields.instance);
    const response = await fetch(`${base}/version`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.apiKey}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ pkgVersion: string() }));
    return { accountInfo: { externalId: base, username: new URL(base).host } };
  },
});

export default defineApp(
  { user: { accounts: { meilisearch: meilisearch.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.meilisearch ?? [],
        (account) => {
          const base = instanceBase(account.fields.instance);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: new URL(base).origin,
              baseUrl: base,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Meilisearch",
        description: "Indexes, documents, search, settings, tasks, API keys, batches and dumps on Meilisearch Cloud or a self-hosted instance.",
        icons,
      },
    ),
  }),
);
