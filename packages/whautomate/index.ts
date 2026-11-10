import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, originOf, regions } from "./openapi.js";

const whautomate = defineProvider({
  name: "Whautomate",
  hosts: Object.values(regions).map((origin) => new URL(origin).host),
  auth: {
    apiKey: secrets({
      label: "Region (global or india) and REST API key",
      fields: object({ region: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originOf(account.fields.region)}/v1/locations?limit=1`, {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

export default defineApp(
  { user: { accounts: { whautomate: whautomate.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.whautomate ?? [],
        (account) => {
          const origin = originOf(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Whautomate",
        description:
          "Contacts, clients, appointments, classes, services, staff, segments, broadcasts and WhatsApp, Instagram, Messenger and Telegram messages in Whautomate.",
        icons,
        instructions:
          "Contacts are messaging-inbox people; clients are the appointment customers. They have separate ids and tags.",
      },
    ),
  }),
);
