import {
  accountRouter,
  decodeJson,
  defineApp,
  json,
  mutation,
  record,
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
import {
  answersOptions,
  batchesOptions,
  billingOptions,
  crawlsOptions,
  filesOptions,
  mapsOptions,
  monitorsOptions,
  schedulesOptions,
  scrapesOptions,
  searchOptions,
  utilityOptions,
} from "./openapi.js";

// POST /v1/monitors is omitted from the OpenAPI router: the spec also declares a text/event-stream 200 response (used
// with ?stream), and the framework silently drops operations it flags as streaming. This tool calls it without
// `stream`, which returns the 202 JSON Monitor.
function createMonitorTool(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return mutation(
    {
      description:
        "Create a monitor (POST /v1/monitors). Pass the JSON request body as body: query (required, what to monitor in natural language), and optionally frequency (for example 'every day at 9am', UTC, minimum every 10 minutes), source_policy, notification, webhook, metadata and output_schema.",
      input: object({ body: record(json()) }),
    },
    async (_ctx, args) => {
      const response = await fetcher("https://api.olostep.com/v1/monitors", {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(args.body),
      });
      return decodeJson(response, json());
    },
  );
}

const olostep = defineProvider({
  name: "Olostep",
  hosts: ["api.olostep.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only credit balance of the key's team.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.olostep.com/user/credits/info", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { olostep: olostep.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.olostep ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              scrapes: mount(scrapesOptions),
              batches: mount(batchesOptions),
              crawls: mount(crawlsOptions),
              maps: mount(mapsOptions),
              answers: mount(answersOptions),
              search: mount(searchOptions),
              monitors: mount(monitorsOptions),
              createMonitor: withApprovals(
                router({ create: createMonitorTool(account.fields.token, fetch, signal) }),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              ),
              files: mount(filesOptions),
              schedules: mount(schedulesOptions),
              retrieve: mount(utilityOptions),
              billing: mount(billingOptions),
            },
            { title: "Olostep", description: "Olostep team account." },
          );
        },
        { signal },
      ),
      {
        title: "Olostep",
        description:
          "Olostep web data API. scrapes: scrape a URL to markdown, HTML, JSON or text. batches: scrape many URLs. crawls: crawl a site. maps: list a site's URLs. answers: web-grounded AI answers. search: web search. monitors: scheduled change monitors. files, schedules, retrieve, billing.",
        icons,
      },
    ),
  }),
);
