import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const podium = defineProvider({
  name: "Podium",
  hosts: ["api.podium.com"],
  auth: {
    // Podium issues a client id and secret when an app is registered in the developer portal.
    oauth: oauth2({
      authorizationUrl: "https://api.podium.com/oauth/authorize",
      tokenUrl: "https://api.podium.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopeSeparator: " ",
      // The 17 scopes on https://docs.podium.com/docs/oauth-scopes. Others used by some operations are undocumented there; see README.
      scopes: [
        "write_appointments",
        "read_campaigns",
        "write_campaign_messages",
        "read_contacts",
        "write_contacts",
        "write_data_feed_event",
        "read_feedback",
        "read_locations",
        "write_locations",
        "read_messages",
        "write_messages",
        "read_organizations",
        "read_payments",
        "write_payments",
        "read_reviews",
        "write_reviews",
        "read_users",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.podium.com/v4/locations?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { podium: podium.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.podium ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Podium",
        description:
          "Podium: contacts, conversations and messages, templates, campaigns, reviews and review invites, appointments, invoices and payments, locations, users and webhooks.",
        icons,
      },
    ),
  }),
);
