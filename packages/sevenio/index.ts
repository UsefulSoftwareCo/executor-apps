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

const sevenio = defineProvider({
  name: "Seven.io",
  hosts: ["gateway.seven.io", "oauth.seven.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The connect page asks for the client of an OAuth app created under Developer > OAuth apps (register all scopes listed in the README).
    oauth: oauth2({
      authorizationUrl: "https://oauth.seven.io/authorize",
      tokenUrl: "https://oauth.seven.io/token",
      revocationUrl: "https://oauth.seven.io/revoke",
      tokenEndpointAuthMethod: "client_secret_basic",
      tokenRequestFormat: "form",
      scopes: [
        "analytics",
        "balance",
        "contacts",
        "groups",
        "hooks",
        "journal",
        "lookup",
        "numbers",
        "pricing",
        "rcs",
        "sms",
        "status",
        "subaccounts",
        "validate_for_voice",
        "voice",
        "waba",
      ],
    }),
  },
  // /balance needs only the key (or the balance scope) and has no side effects.
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { "X-Api-Key": account.fields.token };
    const response = await fetch("https://gateway.seven.io/api/balance", {
      signal,
      headers: { ...headers, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { sevenio: sevenio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sevenio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Seven.io",
        description:
          "SMS, voice, RCS and WhatsApp messaging, contacts and groups, phone numbers, lookups, webhooks, pricing, analytics and subaccounts on Seven.io.",
        icons,
      },
    ),
  }),
);
