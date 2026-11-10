import { accountRouter, defineApp, defineProvider, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Ceramic exposes only POST /search, a mutation to the framework that spends credits, so it asks approval.
// There is no current-account endpoint, so the provider has no health check.
const ceramic = defineProvider({
  name: "Ceramic",
  hosts: ["api.ceramic.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

export default defineApp(
  { user: { accounts: { ceramic: ceramic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ceramic ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ceramic",
        description: "Search the web with Ceramic's search API for AI agents.",
        icons,
      },
    ),
  }),
);
