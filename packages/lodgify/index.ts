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

const lodgify = defineProvider({
  name: "Lodgify",
  hosts: ["api.lodgify.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.lodgify.com/v2/properties?page=1&size=1", {
      signal,
      headers: { "X-ApiKey": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { lodgify: lodgify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lodgify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Lodgify",
        description:
          "Manage vacation rentals with Lodgify: properties, rooms, availability, rates, quotes, bookings, messaging threads and webhooks.",
        icons,
      },
    ),
  }),
);
