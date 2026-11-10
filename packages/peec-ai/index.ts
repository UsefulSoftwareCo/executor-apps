import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

// The framework derives kind from the HTTP method, so these read-only POST operations
// would otherwise need approval. actions/status and actions/steps/completion are writes
// and stay gated.
const readOnlyPosts = [
  "postReportsBrands",
  "postReportsDomains",
  "postReportsLinks",
  "postReportsUrls",
  "postSourcesUrlsContent",
  "postQueriesSearch",
  "postQueriesShopping",
  "postProductsList",
  "postProductsDetail",
  "postProductsAttributes",
  "postProductsSummary",
  "postProductsTrend",
  "postProductsPerformance",
  "postProductsDemand",
  "postProductsMerchants",
  "postActionsList",
  "postActionsDetail",
  "postActionsPlatforms",
];
const kinds = Object.fromEntries(readOnlyPosts.map((id) => [id, "query" as const]));

const peec = defineProvider({
  name: "Peec AI",
  hosts: ["api.peec.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.peec.ai/customer/v1/projects?limit=1", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { peec: peec.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.peec ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account, kinds }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Peec AI",
        description:
          "AI search analytics in Peec AI: brand visibility, sentiment, citations, sources, prompts, topics, competitors and project configuration.",
        icons,
      },
    ),
  }),
);
