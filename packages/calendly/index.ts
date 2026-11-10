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

const Me = object({ resource: object({ uri: string(), name: string(), email: string() }) });

const calendly = defineProvider({
  name: "Calendly",
  hosts: ["api.calendly.com"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Calendly OAuth apps are created in the developer portal; the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://auth.calendly.com/oauth/authorize",
      tokenUrl: "https://auth.calendly.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "availability:read",
        "availability:write",
        "contacts:read",
        "contacts:write",
        "event_types:read",
        "event_types:write",
        "groups:read",
        "locations:read",
        "meeting_recaps:read",
        "meeting_recaps:write",
        "organizations:read",
        "organizations:write",
        "outgoing_communications:read",
        "routing_forms:read",
        "scheduled_events:read",
        "scheduled_events:write",
        "scheduling_links:write",
        "shares:write",
        "users:read",
        "webhooks:read",
        "webhooks:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.calendly.com/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const { resource } = await decodeJson(response, Me);
    return { accountInfo: { externalId: resource.uri, displayName: resource.name, email: resource.email } };
  },
});

export default defineApp(
  { user: { accounts: { calendly: calendly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.calendly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Calendly",
        description:
          "Calendly scheduling: event types, scheduled events, invitees, availability, routing forms, webhooks and organizations.",
        icons,
      },
    ),
  }),
);
