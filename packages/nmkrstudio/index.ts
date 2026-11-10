import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
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

const nmkrstudio = defineProvider({
  name: "NMKR Studio",
  hosts: ["studio-api.nmkr.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://studio-api.nmkr.io/v2/ListProjects", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { nmkrstudio: nmkrstudio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nmkrstudio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "NMKR Studio",
        description: "Create and sell Cardano NFT projects with NMKR Studio: projects, NFTs, uploads, minting, sales, payouts, wallets and payment transactions.",
        icons,
      },
    ),
  }),
);
