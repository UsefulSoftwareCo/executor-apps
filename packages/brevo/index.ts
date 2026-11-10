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

const brevo = defineProvider({
  name: "Brevo",
  hosts: ["api.brevo.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // OAuth apps are created with the Brevo CLI; the connect page asks for the app's client.
    oauth: oauth2({
      discover: "https://oauth.brevo.com/realms/partner",
      scopes: [
        "account:read",
        "contacts:read",
        "contacts:write",
        "campaigns.email:read",
        "campaigns.email:write",
        "campaigns.sms:read",
        "campaigns.sms:write",
        "campaigns.whatsapp:read",
        "campaigns.whatsapp:write",
        "transactional.email:read",
        "transactional.email:write",
        "transactional.sms:read",
        "transactional.sms:write",
        "transactional.whatsapp:read",
        "transactional.whatsapp:write",
        "webhooks:read",
        "webhooks:write",
        "crm:read",
        "crm:write",
        "conversations:read",
        "conversations:write",
        "ecommerce:read",
        "ecommerce:write",
        "events:read",
        "events:write",
        "objects:read",
        "objects:write",
        "loyalty:read",
        "loyalty:write",
        "offline_access",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.brevo.com/v3/account", {
      signal,
      headers:
        account.method === "oauth"
          ? { Authorization: `Bearer ${token}` }
          : { "api-key": token },
    });
    const me = await decodeJson(response, object({ email: string() }));
    return { accountInfo: { externalId: me.email, username: me.email } };
  },
});

export default defineApp(
  { user: { accounts: { brevo: brevo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.brevo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Brevo",
        description:
          "Brevo email, SMS and WhatsApp marketing: contacts, lists, campaigns, transactional messaging, senders, webhooks, CRM and ecommerce.",
        icons,
      },
    ),
  }),
);
