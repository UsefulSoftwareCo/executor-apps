import {
  accountRouter,
  base64,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { instanceHost, jamfOptions } from "./openapi.js";

type Fetch = typeof fetch;
type Token = { value: string; expires: number };

const provider = defineProvider({
  name: "Jamf Pro",
  hosts: ["*.jamfcloud.com"],
  auth: {
    // Jamf Pro API roles and clients: the OAuth client credentials grant. The token URL is per
    // instance, which a static oauth2 declaration cannot express, so the grant is made in code.
    clientCredentials: secrets({
      label: "API client (client credentials)",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
    // A Jamf Pro user account: Basic credentials are exchanged for a short-lived bearer token.
    password: secrets({
      label: "Username and password",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
      request: ({ username, password }) =>
        header("Authorization", t`Basic ${base64(t`${username}:${password}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const instance = account.fields.instance;
    const token = await exchange(account, fetch, signal);
    // Current-user endpoint; only the always-present top level is decoded.
    const response = await fetch(`https://${instanceHost(instance)}/api/v1/auth`, {
      signal,
      headers: { Authorization: `Bearer ${token.value}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    const who = account.method === "password" ? (account.fields as { username: string }).username : (account.fields as { clientId: string }).clientId;
    return { accountInfo: { externalId: `${instanceHost(instance)}:${who}`, displayName: instanceHost(instance) } };
  },
});


async function exchange(account: any, fetcher: Fetch, signal: AbortSignal | undefined): Promise<Token> {
  const base = `https://${instanceHost(account.fields.instance)}/api`;
  if (account.method === "password") {
    const response = await fetcher(account.url(`${base}/v1/auth/token`), {
      method: "POST",
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const body = await decodeJson(response, object({ token: string(), expires: string() }));
    const expires = Date.parse(body.expires);
    return { value: body.token, expires: Number.isNaN(expires) ? Date.now() + 20 * 60_000 : expires - 60_000 };
  }
  const response = await fetcher(account.url(`${base}/v1/oauth/token`), {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
      grant_type: "client_credentials",
    }).toString(),
  });
  const body = await decodeJson(response, object({ access_token: string() }));
  return { value: body.access_token, expires: Date.now() + 100_000 };
}

export default defineApp(
  { user: { accounts: { jamf: provider.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jamf ?? [],
        (account) => {
          let cached: Token | undefined;
          const signed: Fetch = async (input, init) => {
            if (cached === undefined || cached.expires <= Date.now()) cached = await exchange(account, fetch, signal);
            const headers = new Headers(init?.headers);
            headers.set("Authorization", `Bearer ${cached.value}`);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({ ...jamfOptions(account.fields.instance), cache, fetch: signed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Jamf Pro",
        description:
          "Manage Apple devices in Jamf Pro: computers and mobile device inventory, prestages and enrollment, groups, patch management, managed software updates, PKI, settings and more.",
        instructions:
          "The tools come from your Jamf Pro server's own OpenAPI document (/api/schema), so they match its version. The classic JSSResource API is not included. Access depends on the privileges of the API role or user; a 403 names the missing privilege.",
        icons,
      },
    ),
  }),
);
