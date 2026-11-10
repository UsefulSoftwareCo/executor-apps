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

const beaconchain = defineProvider({
  name: "beaconcha.in",
  hosts: ["beaconcha.in"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://beaconcha.in/api/v2/ethereum/config", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chain: "mainnet" }),
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { beaconchain: beaconchain.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.beaconchain ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "beaconcha.in",
        description:
          "Ethereum staking data from beaconcha.in: validators, rewards, performance, slots, epochs, queues, MEV timing and entities.",
        icons,
      },
    ),
  }),
);
