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

const Account = object({ account_id: string(), email_address: string() });
const AccountResponse = object({ account: Account });

const dropboxsign = defineProvider({
  name: "Dropbox Sign",
  hosts: ["api.hellosign.com", "app.hellosign.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      authorizationUrl: "https://app.hellosign.com/oauth/authorize",
      tokenUrl: "https://app.hellosign.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "account_access",
        "signature_request_access",
        "template_access",
        "team_access",
        "api_app_access",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const headers: Record<string, string> =
      account.method === "oauth"
        ? { Authorization: `Bearer ${account.fields.access_token}` }
        : { Authorization: `Basic ${btoa(`${account.fields.apiKey}:`)}` };
    const response = await fetch("https://api.hellosign.com/v3/account", { signal, headers });
    const me = await decodeJson(response, AccountResponse);
    return {
      accountInfo: { externalId: me.account.account_id, username: me.account.email_address },
    };
  },
});

export default defineApp(
  { user: { accounts: { dropboxsign: dropboxsign.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dropboxsign ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dropbox Sign",
        description:
          "Signature requests, templates, embedded signing and requesting, accounts, teams, bulk send and API apps on the Dropbox Sign REST API.",
        icons,
      },
    ),
  }),
);
