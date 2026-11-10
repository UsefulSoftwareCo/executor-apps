import {
  accountRouter,
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

const ritekit = defineProvider({
  name: "RiteKit",
  hosts: ["api.ritekit.com"],
  auth: {
    apiKey: secrets({
      label: "Client ID",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // RiteKit has no account endpoint; a one-tag stats lookup is the cheapest authenticated read.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.ritekit.com/v1/stats/multiple-hashtags");
    url.searchParams.set("tags", "hello");
    url.searchParams.set("client_id", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    if (!response.ok) throw new Error(`RiteKit rejected the Client ID (HTTP ${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { ritekit: ritekit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ritekit ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "RiteKit",
        description: "Social media helpers from RiteKit: hashtag stats and suggestions, trending hashtags, emoji, link shortening, CTAs and image generation.",
        icons,
      },
    ),
  }),
);
