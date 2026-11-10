import {
  accountRouter,
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

const beehiiv = defineProvider({
  name: "beehiiv",
  hosts: ["api.beehiiv.com", "app.beehiiv.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // beehiiv registers OAuth clients through support; the connect page asks for the client.
    // Scopes follow beehiiv's OAuth2 page (identify:read plus 12 resource scopes), not the full spec.
    oauth: oauth2({
      authorizationUrl: "https://app.beehiiv.com/oauth/authorize",
      tokenUrl: "https://app.beehiiv.com/oauth/token",
      revocationUrl: "https://app.beehiiv.com/oauth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "identify:read",
        "publications:read",
        "publications:write",
        "posts:read",
        "posts:write",
        "subscriptions:read",
        "subscriptions:write",
        "automations:read",
        "automations:write",
        "custom_fields:read",
        "custom_fields:write",
        "polls:read",
        "polls:write",
        "podcasts:read",
        "podcasts:write",
        "publication_fields:read",
        "publication_fields:write",
        "referral_program:read",
        "referral_program:write",
        "segments:read",
        "segments:write",
        "tiers:read",
        "tiers:write",
        "webhooks:read",
        "webhooks:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.beehiiv.com/v2/publications", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { beehiiv: beehiiv.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.beehiiv ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "beehiiv",
        description:
          "Manage beehiiv newsletters: publications, posts, subscriptions, segments, automations, polls, referral programs, webhooks and more.",
        icons,
      },
    ),
  }),
);
