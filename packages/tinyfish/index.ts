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
import { browserOptions, fetchOptions, mainOptions, researchOptions, searchOptions } from "./openapi.js";

const tinyfish = defineProvider({
  name: "TinyFish",
  hosts: ["agent.tinyfish.ai", "api.search.tinyfish.ai", "api.fetch.tinyfish.ai", "api.browser.tinyfish.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://agent.tinyfish.ai/v1/runs?limit=1", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { tinyfish: tinyfish.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tinyfish ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer O ? Omit<O & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              agent: mount(mainOptions),
              research: mount(researchOptions),
              search: mount(searchOptions),
              fetch: mount(fetchOptions),
              browser: mount(browserOptions),
            },
            { title: "TinyFish", description: "TinyFish account." },
          );
        },
        { signal },
      ),
      {
        title: "TinyFish",
        description:
          "TinyFish web agents. agent: browser automation runs, run history, browser profiles, vault, wallet. research: deep research runs. search: web search. fetch: fetch and extract page content. browser: remote browser sessions.",
        icons,
      },
    ),
  }),
);
