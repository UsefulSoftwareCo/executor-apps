import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { hostOptions, originOf } from "./openapi.js";

const UserInfo = object({ sub: string(), name: string() });

const docusign = defineProvider({
  name: "DocuSign",
  hosts: ["*.docusign.net", "account.docusign.com", "account-d.docusign.com"],
  auth: {
    // A token from the developer console or another grant, with the pod it belongs to.
    token: secrets({
      label: "Access token",
      fields: object({ baseUri: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
    // Production authorization code grant. DocuSign has no client registration; the connect page
    // asks for an integration key (client ID) and secret.
    oauth: oauth2({
      authorizationUrl: "https://account.docusign.com/oauth/auth",
      tokenUrl: "https://account.docusign.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["signature", "extended"],
    }),
    // Developer (demo) environment, a separate identity provider and API host.
    sandbox: oauth2({
      authorizationUrl: "https://account-d.docusign.com/oauth/auth",
      tokenUrl: "https://account-d.docusign.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["signature", "extended"],
    }),
  },
  async health({ account, fetch, signal }) {
    const demo =
      account.method === "sandbox" || (account.method === "token" && /demo/i.test(account.fields.baseUri));
    const bearer = account.method === "token" ? account.fields.token : account.fields.access_token;
    const response = await fetch(`https://${demo ? "account-d" : "account"}.docusign.com/oauth/userinfo`, {
      signal,
      headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, UserInfo);
    return { accountInfo: { externalId: me.sub, displayName: me.name } };
  },
});

type Fetch = typeof fetch;

// DocuSign serves each account from its own pod. After sign-in, userinfo lists the user's accounts
// with their base_uri; the default account's pod hosts the API calls.
const podOrigin = async (userinfoHost: string, bearer: string, fetcher: Fetch, signal: AbortSignal) => {
  const response = await fetcher(`https://${userinfoHost}/oauth/userinfo`, {
    signal,
    headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`DocuSign userinfo failed with status ${response.status}.`);
  const body: unknown = await response.json();
  const accountList =
    typeof body === "object" && body !== null && "accounts" in body && Array.isArray(body.accounts)
      ? (body.accounts as { base_uri?: unknown; is_default?: unknown }[])
      : [];
  const chosen = accountList.find((entry) => entry?.is_default === true) ?? accountList[0];
  if (typeof chosen?.base_uri !== "string") throw new Error("DocuSign userinfo returned no account base_uri.");
  return originOf(chosen.base_uri);
};

const originFor = (
  account: { method: "token"; fields: { baseUri: string } } | { method: "oauth" | "sandbox"; fields: { access_token: string } },
  fetcher: Fetch,
  signal: AbortSignal,
) =>
  account.method === "token"
    ? originOf(account.fields.baseUri)
    : podOrigin(account.method === "sandbox" ? "account-d.docusign.com" : "account.docusign.com", account.fields.access_token, fetcher, signal);

const description =
  "DocuSign eSignature: envelopes, templates, recipients, documents, signing, folders, users, groups, brands and account settings.";

export default defineApp(
  { user: { accounts: { docusign: docusign.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docusign ?? [],
        async (account) => {
          const origin = await originFor(account, fetch, signal);
          return withApprovals(
            liveOpenapiRouter({ ...hostOptions(origin), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "DocuSign",
        description,
        icons,
        instructions:
          "Every tool takes an accountId. Get it from GET https://account.docusign.com/oauth/userinfo (accounts[].account_id, base_uri) or the developer console. OAuth accounts call the base_uri of the default account from userinfo; to use a different account or pod, connect with an access token and that base URI instead.",
      },
    ),
  }),
);
