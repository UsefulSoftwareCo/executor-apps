import {
  accountRouter,
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

const helpdesk = defineProvider({
  name: "HelpDesk",
  hosts: ["api.helpdesk.com"],
  auth: {
    pat: secrets({
      label: "Personal Access Token (account ID and token)",
      fields: object({ accountId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
    // HelpDesk shares LiveChat's accounts service. It publishes no metadata or client registration,
    // and scopes are set on the app in the Developer Console rather than on the request.
    oauth: oauth2({
      authorizationUrl: "https://accounts.livechat.com/",
      tokenUrl: "https://accounts.livechat.com/v2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      // Its DELETE-based revocation is not RFC 7009, so no revocationUrl is declared.
      scopes: [],
    }),
  },
  // Only the status is checked: a token limited to other scopes still authenticates (403).
  async health({ account, fetch, signal }) {
    const authorization =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.accountId}:${account.fields.token}`)}`;
    const response = await fetch("https://api.helpdesk.com/v1/licenses", {
      signal,
      headers: { Authorization: authorization, "User-Agent": "executor-helpdesk" },
    });
    if (response.status === 401) throw new Error("HelpDesk rejected the credentials (401)");
    if (!response.ok && response.status !== 403) throw new Error(`HelpDesk health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { helpdesk: helpdesk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.helpdesk ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HelpDesk",
        description:
          "HelpDesk.com ticketing: tickets, agents, teams, tags, custom fields, macros, rules, mailboxes, templates, webhooks and reports.",
        icons,
      },
    ),
  }),
);
