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
import { datasetsOptions, graphOptions, recommendationsOptions } from "./openapi.js";

const semanticscholar = defineProvider({
  name: "Semantic Scholar",
  hosts: ["api.semanticscholar.org"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Semantic Scholar has no current-user endpoint; any non-2xx response fails the health check.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.semanticscholar.org/graph/v1/paper/autocomplete?query=attention", {
      signal,
      headers: { "x-api-key": account.fields.apiKey },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { semanticscholar: semanticscholar.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.semanticscholar ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              graph: mount(graphOptions),
              recommendations: mount(recommendationsOptions),
              datasets: mount(datasetsOptions),
            },
            { title: "Semantic Scholar", description: "Semantic Scholar account." },
          );
        },
        { signal },
      ),
      {
        title: "Semantic Scholar",
        description:
          "Semantic Scholar. graph: search papers and authors, paper details, citations, references, text snippets. recommendations: similar papers. datasets: bulk dataset releases and diffs.",
        icons,
      },
    ),
  }),
);
