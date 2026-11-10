import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const TOKEN_URL = "https://auth.cradl.ai/oauth2/token";
const AUDIENCE = "https://api.cradl.ai/v1";
const API_HOST = "api.cradl.ai";
const Token = object({ access_token: string(), expires_in: number().optional() });

type Fetch = typeof fetch;
type Fields = { clientId: string; clientSecret: string };

// Cradl's token request must carry `audience`, which the generic oauth2 client-credentials grant
// cannot send, so the token is exchanged here. The token carries the permissions of the app client's roles.
function tokenSource(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: { token: string; expires: number } | undefined;
  return async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(TOKEN_URL, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        audience: AUDIENCE,
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
      }).toString(),
    });
    const t = await decodeJson(response, Token);
    // expires_in is seconds; * 900 is ms with a 10% refresh margin.
    cached = { token: t.access_token, expires: Date.now() + (t.expires_in ?? 3600) * 900 };
    return t.access_token;
  };
}

const cradl = defineProvider({
  name: "Cradl AI",
  hosts: ["api.cradl.ai", "files.api.cradl.ai", "auth.cradl.ai"],
  auth: {
    clientCredentials: secrets({
      label: "App client (client ID and secret)",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = await tokenSource(account.fields, fetch, signal)();
    const response = await fetch("https://api.cradl.ai/v1/agents?maxResults=1", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Cradl AI API returned ${response.status}.`);
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

export default defineApp(
  { user: { accounts: { cradlai: cradl.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cradlai ?? [],
        (account) => {
          const token = tokenSource(account.fields, fetch, signal);
          const authed: Fetch = async (input, init) => {
            const request = new Request(input, init);
            if (new URL(request.url).host.endsWith(API_HOST))
              request.headers.set("Authorization", `Bearer ${await token()}`);
            return fetch(request);
          };
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Cradl AI",
        description:
          "AI document extraction: agents and runs, documents, models, validations, hooks, actions, predictions, users and app clients.",
        icons,
      },
    ),
  }),
);
