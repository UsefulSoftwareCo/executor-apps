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

const webcrawlerapi = defineProvider({
  name: "WebCrawlerAPI",
  hosts: ["api.webcrawlerapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/auth verifies the key and is read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.webcrawlerapi.com/v1/auth", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`WebCrawlerAPI rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { webcrawlerapi: webcrawlerapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webcrawlerapi ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WebCrawlerAPI",
        description:
          "Crawl and scrape websites into LLM-ready markdown, run the crawling agent and manage monitored feeds with WebCrawlerAPI.",
        icons,
      },
    ),
  }),
);
