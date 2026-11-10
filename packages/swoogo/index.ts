import { accountRouter, defineApp, defineProvider, oauth2, router, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const swoogo = defineProvider({
  name: "Swoogo",
  hosts: ["api.swoogo.com"],
  auth: {
    // The consumer key and secret live under My Profile > API Credentials in Swoogo.
    oauth: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api.swoogo.com/api/v1/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // A client-credentials account has already exchanged its key and secret for a token, which proves them.
  async health() {
    return { accountInfo: { externalId: "swoogo", displayName: "Swoogo (API credentials)" } };
  },
});

export default defineApp(
  { user: { accounts: { swoogo: swoogo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.swoogo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Swoogo",
        description:
          "Swoogo event management: events, registrants, sessions, speakers, sponsors, contacts, packages, discount codes, transactions and webhooks.",
        icons,
      },
    ),
  }),
);
