import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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

const shippo = defineProvider({
  name: "Shippo",
  hosts: ["api.goshippo.com", "goshippo.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Shippo issues OAuth partner credentials on request (https://docs.goshippo.com/o-auth-integrations/o-auth);
    // the connect page asks for the partner client ID and secret. Access tokens never expire.
    oauth: oauth2({
      authorizationUrl: "https://goshippo.com/oauth/authorize",
      tokenUrl: "https://goshippo.com/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["*"],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const authorization = account.method === "oauth" ? `Bearer ${token}` : `ShippoToken ${token}`;
    const response = await fetch("https://api.goshippo.com/parcel-templates?page=1&results=1", {
      signal,
      headers: { Authorization: authorization },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { shippo: shippo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shippo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            // The carrier sign-in initiator is a GET, but it starts a carrier authorization flow.
            tool.kind === "mutation" || /signin/i.test(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Shippo",
        description:
          "Multi-carrier shipping with Shippo: addresses, shipments, rates, labels, tracking, batches, pickups, manifests, orders and webhooks.",
        icons,
      },
    ),
  }),
);
