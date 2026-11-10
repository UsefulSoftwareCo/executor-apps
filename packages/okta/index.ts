import {
  accountRouter,
  defineApp,
  defineProvider,
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

const SUFFIXES = [".okta.com", ".oktapreview.com", ".okta-emea.com", ".okta-gov.com", ".okta.mil", ".trex-govcloud.com"];

// Credentials only ever go to the account's own Okta org, which must be on an official Okta domain.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Okta domain, for example example.okta.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Okta org must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Okta domain, with no path.");
  if (!SUFFIXES.some((s) => url.hostname.endsWith(s)))
    throw new Error(
      `Enter an Okta domain ending in ${SUFFIXES.join(", ")}. Custom domains are not supported; use the org's okta.com domain.`,
    );
  return url.origin;
}

const okta = defineProvider({
  name: "Okta",
  hosts: SUFFIXES.map((s) => `*${s}`),
  auth: {
    // An API token created in the Admin Console under Security > API > Tokens.
    apiToken: secrets({
      label: "API token",
      fields: object({ domain: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
    // An OAuth 2.0 access token (for example from a service app) carrying okta.* scopes.
    accessToken: secrets({
      label: "OAuth access token",
      fields: object({ domain: plain(string({ minLength: 1 })), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const scheme = account.method === "apiToken" ? "SSWS" : "Bearer";
    const response = await fetch(`${origin}/api/v1/users?limit=1`, {
      signal,
      headers: { Authorization: `${scheme} ${account.fields.token}`, Accept: "application/json" },
    });
    // A 403 means the credential is valid but lacks users scopes (e.g. a token limited to other okta.* scopes).
    if (response.status !== 403) {
      if (!response.ok) throw new Error(`Okta rejected the credentials (${response.status}).`);
    }
    const host = new URL(origin).host;
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { okta: okta.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.okta ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
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
        title: "Okta",
        description:
          "Users, groups, applications, policies, authorization servers, authenticators, factors, network zones, system logs and the rest of the Okta Admin Management API.",
        instructions:
          "What a call may do depends on the API token owner's admin role, or the scopes granted to the OAuth access token. List endpoints paginate with limit and after (see the Link header).",
        icons,
      },
    ),
  }),
);
