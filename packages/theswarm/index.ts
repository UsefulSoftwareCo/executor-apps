import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const theswarm = defineProvider({
  name: "The Swarm",
  hosts: ["bee.theswarm.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://bee.theswarm.com/credits/usage", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ usage: number() }));
  },
});

export default defineApp(
  { user: { accounts: { theswarm: theswarm.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.theswarm ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "The Swarm",
        description:
          "Search and enrich professional profiles and companies, map warm-intro relationships, and read social posts and credit usage with The Swarm.",
        icons,
      },
    ),
  }),
);
