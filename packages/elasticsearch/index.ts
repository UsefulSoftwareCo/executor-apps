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

// Elasticsearch is addressed per cluster, so the cluster URL is part of the account. The provider declares
// no static `hosts` (cluster domains are arbitrary), so credentials are not host-restricted by the framework.
// Mitigations: tool calls pin allowedOrigin to the account's own cluster origin and https is required.
function clusterBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Elasticsearch endpoint, for example https://my-deployment.es.us-east-1.aws.elastic.cloud.");
  }
  if (url.protocol !== "https:") throw new Error("The Elasticsearch endpoint must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The Elasticsearch endpoint must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const root = object({ cluster_name: string() });

const elasticsearch = defineProvider({
  name: "Elasticsearch",
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        endpoint: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
    basic: secrets({
      label: "Username and password",
      fields: object({
        endpoint: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = clusterBase(account.fields.endpoint);
    const fields = account.fields as Record<string, string>;
    const authorization =
      "apiKey" in fields
        ? `ApiKey ${fields.apiKey}`
        : `Basic ${btoa(`${fields.username}:${fields.password}`)}`;
    const response = await fetch(`${base}/`, {
      signal,
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    const info = await decodeJson(response, root);
    return { accountInfo: { externalId: `${base}:${info.cluster_name}`, displayName: base } };
  },
});

export default defineApp(
  { user: { accounts: { elasticsearch: elasticsearch.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.elasticsearch ?? [],
        (account) => {
          const base = clusterBase(account.fields.endpoint);
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
        title: "Elasticsearch",
        description:
          "Search, index and manage data on an Elasticsearch cluster: documents, indices, search, aggregations, cluster, ingest and security APIs.",
        icons,
      },
    ),
  }),
);
