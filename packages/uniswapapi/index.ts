import {
  accountRouter,
  array,
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

const uniswap = defineProvider({
  name: "Uniswap API",
  hosts: ["trade-api.gateway.uniswap.org"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://trade-api.gateway.uniswap.org/v1/supported_chains", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ requestId: string(), chains: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { uniswap: uniswap.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.uniswap ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Uniswap API",
        description: "Uniswap Trading API: quotes, swaps, limit orders, Permit2 approvals, supported chains and tokens.",
        icons,
      },
    ),
  }),
);
