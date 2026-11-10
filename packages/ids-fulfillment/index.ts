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

const idsFulfillment = defineProvider({
  name: "IDS Fulfillment",
  hosts: ["api.idsfulfillment.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A one-row item listing is a cheap read that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.idsfulfillment.com/request/items?PageSize=1&PageNumber=1", {
      signal,
      headers: { ApiKey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

const description =
  "IDS Fulfillment 3PL warehouse API: ship requests, inventory receipts, stock adjustments, items, storer inventory and order status.";

export default defineApp(
  { user: { accounts: { idsFulfillment: idsFulfillment.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.idsFulfillment ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      { title: "IDS Fulfillment", description, icons },
    ),
  }),
);
