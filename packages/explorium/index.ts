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

const explorium = defineProvider({
  name: "Explorium",
  hosts: ["api.explorium.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.explorium.ai/v2/credits", {
      signal,
      headers: { api_key: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { explorium: explorium.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.explorium ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Explorium",
        description: "Match, search and enrich businesses and prospects, track company and prospect events, and run research jobs with Explorium AgentSource.",
        icons,
        instructions:
          "Tools under /v1 paths are deprecated by Explorium (still working, end of support around March 2027); prefer the /v2 equivalents. Enrich and fetch tools consume Explorium credits.",
      },
    ),
  }),
);
