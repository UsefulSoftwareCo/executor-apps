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

const mailsoftly = defineProvider({
  name: "Mailsoftly",
  hosts: ["app.mailsoftly.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Mailsoftly publishes OAuth 2.1 metadata and dynamic client registration (PKCE, public clients).
    oauth: oauth2({
      discover: "https://app.mailsoftly.com",
      scopes: [
        "contacts:read",
        "contacts:write",
        "campaigns:read",
        "campaigns:draft",
        "campaigns:send",
        "suppressions:write",
        "account:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth" ? `Bearer ${account.fields.access_token}` : account.fields.token;
    const response = await fetch("https://app.mailsoftly.com/api/v3/get_account", {
      signal,
      headers: { Authorization: authorization },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { mailsoftly: mailsoftly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailsoftly ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mailsoftly",
        description:
          "Email marketing with Mailsoftly: contacts, lists, tags, campaigns, templates, automations, forms and suppressions.",
        icons,
      },
    ),
  }),
);
