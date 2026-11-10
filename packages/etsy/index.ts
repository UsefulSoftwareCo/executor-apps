import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ user_id: number() });

const etsy = defineProvider({
  name: "Etsy",
  hosts: ["openapi.etsy.com"],
  auth: {
    token: secrets({
      label: "API key and OAuth access token",
      fields: object({
        apiKey: string({ minLength: 1 }),
        accessToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openapi.etsy.com/v3/application/users/me", {
      signal,
      headers: {
        "x-api-key": account.fields.apiKey,
        Authorization: `Bearer ${account.fields.accessToken}`,
      },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.user_id), username: "Etsy user" } };
  },
});

export default defineApp(
  { user: { accounts: { etsy: etsy.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.etsy ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Etsy",
        description:
          "Etsy Open API v3: shops, listings, inventory, receipts, shipping profiles, reviews and taxonomy.",
        icons,
      },
    ),
  }),
);
