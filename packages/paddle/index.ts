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
import { options, origins } from "./openapi.js";

function originOf(environment: unknown) {
  return environment === "sandbox" ? origins.sandbox : origins.live;
}

const paddle = defineProvider({
  name: "Paddle",
  hosts: [new URL(origins.live).host, new URL(origins.sandbox).host],
  auth: {
    // Paddle API keys are created in Developer tools > Authentication; sandbox and live keys are separate.
    apiKey: secrets({
      label: "API key",
      fields: object({
        environment: plain(jsonSchema({ type: "string", enum: ["live", "sandbox"] })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${originOf(account.fields.environment)}/event-types`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { paddle: paddle.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.paddle ?? [],
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
        title: "Paddle",
        description:
          "Paddle Billing: products, prices, customers, subscriptions, transactions, discounts, adjustments, reports and notifications.",
        icons,
      },
    ),
  }),
);
