import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  jsonSchema,
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
import { options, productionOrigin, sandboxOrigin } from "./openapi.js";

function originOf(environment: unknown): string {
  return environment === "sandbox" ? sandboxOrigin : productionOrigin;
}

const shipbob = defineProvider({
  name: "ShipBob",
  hosts: ["api.shipbob.com", "sandbox-api.shipbob.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({
        environment: plain(jsonSchema({ type: "string", enum: ["production", "sandbox"] })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originOf(account.fields.environment)}/2026-07/channel`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { shipbob: shipbob.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shipbob ?? [],
        (account) => {
          const origin = originOf(account.fields.environment);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "ShipBob",
        description:
          "ShipBob fulfillment: orders, products, inventory, shipments, returns, receiving, channels, locations, invoices and webhooks.",
        icons,
      },
    ),
  }),
);
