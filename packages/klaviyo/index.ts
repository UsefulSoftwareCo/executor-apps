import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const AccountList = object({ data: array(object({ id: string() })) });

const klaviyo = defineProvider({
  name: "Klaviyo",
  hosts: ["a.klaviyo.com"],
  auth: {
    apiKey: secrets({
      label: "Private API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Klaviyo offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://www.klaviyo.com/oauth/authorize",
      tokenUrl: "https://a.klaviyo.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "accounts:read",
        "campaigns:read",
        "campaigns:write",
        "catalogs:read",
        "catalogs:write",
        "conversations:read",
        "conversations:write",
        "coupon-codes:read",
        "coupon-codes:write",
        "coupons:read",
        "coupons:write",
        "custom-objects:read",
        "custom-objects:write",
        "data-privacy:write",
        "events:read",
        "events:write",
        "flows:read",
        "flows:write",
        "forms:read",
        "forms:write",
        "images:read",
        "images:write",
        "lists:read",
        "lists:write",
        "metrics:read",
        "metrics:write",
        "profiles:read",
        "profiles:write",
        "push-tokens:read",
        "push-tokens:write",
        "reviews:read",
        "reviews:write",
        "segments:read",
        "segments:write",
        "subscriptions:read",
        "subscriptions:write",
        "tags:read",
        "tags:write",
        "templates:read",
        "templates:write",
        "tracking-settings:read",
        "tracking-settings:write",
        "web-feeds:read",
        "web-feeds:write",
        "webhooks:read",
        "webhooks:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Klaviyo-API-Key ${account.fields.apiKey}`;
    const response = await fetch("https://a.klaviyo.com/api/accounts", {
      signal,
      headers: { Authorization: authorization, revision: "2026-07-15", Accept: "application/vnd.api+json" },
    });
    const body = await decodeJson(response, AccountList);
    const first = body.data[0];
    if (first === undefined || first.id.length === 0) {
      throw new Error("Klaviyo /api/accounts returned no account");
    }
    return { accountInfo: { externalId: first.id } };
  },
});

export default defineApp(
  { user: { accounts: { klaviyo: klaviyo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.klaviyo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Klaviyo",
        description:
          "Profiles, lists, segments, campaigns, flows, events, metrics, catalogs and the rest of the Klaviyo REST API.",
        icons,
      },
    ),
  }),
);
