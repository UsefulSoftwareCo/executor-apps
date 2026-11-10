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

const webscrapingai = defineProvider({
  name: "WebScraping.AI",
  hosts: ["api.webscraping.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.webscraping.ai/account");
    url.searchParams.set("api_key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { webscrapingai: webscrapingai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webscrapingai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WebScraping.AI",
        description: "Scrape web pages with WebScraping.AI: HTML, text, selected elements, Google SERP, structured data, AI question answering and field extraction, and account credit usage.",
        icons,
      },
    ),
  }),
);
