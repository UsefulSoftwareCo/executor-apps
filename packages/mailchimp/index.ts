import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
import { oauthOptions, tokenOptions } from "./openapi.js";

// The spec declares no required properties on GET /, so decode them leniently.
const Root = object({ account_id: json(), account_name: json() });
const text = (value: unknown) => (typeof value === "string" && value !== "" && value.length <= 255 ? value : undefined);
const Metadata = object({ dc: string() });

type Fetch = typeof fetch;

// Mailchimp OAuth tokens carry no data center; the metadata endpoint reports it.
async function oauthDc(accessToken: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher("https://login.mailchimp.com/oauth2/metadata", {
    signal,
    headers: { Authorization: `OAuth ${accessToken}`, Accept: "application/json" },
  });
  return (await decodeJson(response, Metadata)).dc;
}

const mailchimp = defineProvider({
  name: "Mailchimp",
  hosts: ["*.api.mailchimp.com", "login.mailchimp.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        // The part of the key after the dash, for example us6.
        dc: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
    // The user registers an OAuth app under Account > Extras > Registered apps.
    oauth: oauth2({
      authorizationUrl: "https://login.mailchimp.com/oauth2/authorize",
      tokenUrl: "https://login.mailchimp.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const dc = account.method === "oauth" ? await oauthDc(account.fields.access_token, fetch, signal) : account.fields.dc;
    const auth =
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.dc}:${account.fields.apiKey}`)}`;
    const response = await fetch(`${tokenOptions(dc).baseUrl}/`, {
      signal,
      headers: { Authorization: auth, Accept: "application/json" },
    });
    const me = await decodeJson(response, Root);
    const externalId = text(me.account_id);
    const displayName = text(me.account_name);
    return {
      accountInfo: {
        ...(externalId === undefined ? {} : { externalId }),
        ...(displayName === undefined ? {} : { displayName }),
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { mailchimp: mailchimp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mailchimp ?? [],
        async (account) =>
          withApprovals(
            liveOpenapiRouter(
              account.method === "oauth"
                ? { ...oauthOptions(await oauthDc(account.fields.access_token, fetch, signal)), cache, fetch, signal, account }
                : { ...tokenOptions(account.fields.dc), cache, fetch, signal, account },
            ),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Mailchimp",
        description:
          "Audiences, members, segments, campaigns, templates, automations, reports, ecommerce stores and the rest of the Mailchimp Marketing API.",
        icons,
        instructions:
          "Audiences are called lists in the API (list_id). Member ids are the MD5 hash of the lowercased email address. List endpoints take count and offset; use fields or exclude_fields to trim responses.",
      },
    ),
  }),
);
