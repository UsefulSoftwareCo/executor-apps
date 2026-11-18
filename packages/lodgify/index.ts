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
import { v1Options, v2Options } from "./openapi.js";

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
        (account) => {
          const mount = (options: typeof v1Options) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { v1: mount(v1Options), v2: mount(v2Options) },
            { title: "Lodgify", description: "Lodgify Public API v1 and v2." },
          );
        },
        { signal },
      ),
      {
        title: "Lodgify",
        description:
          "Manage vacation rentals with Lodgify. v2: properties, rooms, availability calendars, daily rates and rate settings, quotes, bookings (list, read, key codes, payment links, check-in and check-out) and messaging threads. v1: bookings and enquiries (create, update, delete, status changes, messages), availability updates, rates, add-ons, payment settings, countries, currencies and webhooks.",
        icons,
      },
    ),
  }),
);
