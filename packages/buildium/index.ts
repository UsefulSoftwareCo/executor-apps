import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const buildium = defineProvider({
  name: "Buildium",
  hosts: ["api.buildium.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        clientId: string({ minLength: 1 }),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.buildium.com/v1/rentals?limit=1", {
      signal,
      headers: {
        "x-buildium-client-id": account.fields.clientId,
        "x-buildium-client-secret": account.fields.clientSecret,
      },
    });
    await decodeJson(response, array(json()));
  },
});

export default defineApp(
  { user: { accounts: { buildium: buildium.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.buildium ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Buildium",
        description:
          "Property management with Buildium: rental properties, leases, tenants, owners, associations, work orders, accounting and files.",
        icons,
      },
    ),
  }),
);
