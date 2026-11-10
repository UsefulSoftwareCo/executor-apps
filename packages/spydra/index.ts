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

const spydra = defineProvider({
  name: "Spydra",
  hosts: ["api.openrwa.io"],
  auth: {
    apiKey: secrets({
      label: "API key and store ID",
      fields: object({
        apiKey: string({ minLength: 1 }),
        storeId: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.openrwa.io/api/v/1/assets/meta", {
      signal,
      headers: { "x-api-key": account.fields.apiKey, "x-store-id": account.fields.storeId },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { spydra: spydra.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.spydra ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              // Always send x-store-id: the spec lists it as a security alternative to x-api-key, and whether it
              // is required alongside the key is unverified, so sending it is the safe choice.
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("x-store-id", account.fields.storeId);
                return fetch(input, { ...init, headers });
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Spydra",
        description:
          "Manage Spydra OpenRWA public-chain token stores: assets, tokens, token sales, investors, investments, payouts and chains.",
        icons,
      },
    ),
  }),
);
