import { accountRouter, defineApp, defineProvider, oauth2, object, router, secrets, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const scopes = [
  "analytics:read", "attachments:read", "attachments:write", "billing:read", "broadcasts:read", "broadcasts:write",
  "broadcasts-recurring:read", "broadcasts-recurring:write", "call-history:read", "contact-imports:read",
  "contact-imports:write", "contacts:read", "contacts:write", "conversations:read", "conversations:write",
  "custom-fields:read", "custom-fields:write", "groups:read", "groups:write", "keywords:read", "keywords:write",
  "messages:read", "messages:write", "numbers:read", "numbers:write", "organizations:read", "saved-replies:read",
  "saved-replies:write", "tags:read", "tags:write", "teams:read", "triggers:read", "triggers:write", "users:read",
  "voice:read", "website-chat:read",
];

const salesmsg = defineProvider({
  name: "Salesmsg",
  hosts: ["api.salesmessage.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Salesmsg offers no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://app.salesmessage.com/auth/oauth",
      tokenUrl: "https://api.salesmessage.com/pub/v2.3/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes,
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.salesmessage.com/pub/v2.3/users/me", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Salesmsg health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { salesmsg: salesmsg.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.salesmsg ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Salesmsg",
        description:
          "Business SMS and MMS: contacts, conversations, messages, broadcasts, tags, custom fields, numbers and teams.",
        icons,
      },
    ),
  }),
);
