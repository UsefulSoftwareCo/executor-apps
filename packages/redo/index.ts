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

const redo = defineProvider({
  name: "Redo",
  hosts: ["api.getredo.com"],
  auth: {
    apiKey: secrets({
      label: "API secret",
      fields: object({ token: string({ minLength: 1 }), storeId: string({ minLength: 1 }) }),
    }),
  },
  // Redo has no current-user endpoint; list the store's webhooks (read-only) instead.
  async health({ account, fetch, signal }) {
    const response = await fetch(`https://api.getredo.com/v2.2/stores/${encodeURIComponent(account.fields.storeId)}/webhooks`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { redo: redo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.redo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Redo",
        instructions: "Most operations take a storeId path parameter: use the Store ID of the connected account.",
        description: "Manage Redo e-commerce stores: checkout experiences, coverage, customers, inventory, bundles, returns and events.",
        icons,
      },
    ),
  }),
);
