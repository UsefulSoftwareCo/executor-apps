import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

// Hosted Grist: personal areas live on docs.getgrist.com, team sites on <team>.getgrist.com.
function siteOrigin(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]?)(?:\.getgrist\.com)?\/?$/.exec(
    raw.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter your Grist site: docs for personal areas, or your team name (<team>.getgrist.com).");
  return `https://${match[1]}.getgrist.com`;
}

// OAuth tokens are issued by, and accepted on the API of, login.getgrist.com (a curated endpoint subset);
// OAuth accounts therefore have no site field.
const oauthOrigin = "https://login.getgrist.com";

type GristAccount =
  | { method: "apiKey"; fields: { site: string; token: string } }
  | { method: "oauth"; fields: { access_token: string } };

function accountOrigin(account: GristAccount): string {
  return account.method === "oauth" ? oauthOrigin : siteOrigin(account.fields.site);
}

const grist = defineProvider({
  name: "Grist",
  hosts: ["*.getgrist.com"],
  auth: {
    // Profile > API Key in Grist's account settings.
    apiKey: secrets({
      label: "API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    // Account settings > Developer. Grist's login server issues tokens that only a curated subset
    // of site endpoints accepts; the rest return 403. offline_access needs prompt=consent.
    oauth: oauth2({
      discover: oauthOrigin,
      // Grist apps are always confidential clients; its docs authenticate with HTTP Basic.
      tokenEndpointAuthMethod: "client_secret_basic",
      authorizationParams: { prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${accountOrigin(account)}/api/orgs`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { grist: grist.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.grist ?? [],
        (account) => {
          const origin = accountOrigin(account);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api`,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Grist",
        description:
          "Grist relational spreadsheets: organizations, workspaces, documents, tables, records, columns, attachments, webhooks and access.",
        instructions:
          "Set the account's site to `docs` for personal areas or to your team name. Document ids are the 22-character ids from document URLs.",
        icons,
      },
    ),
  }),
);
