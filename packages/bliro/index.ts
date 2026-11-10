import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

type Fetch = typeof fetch;
type ClientFields = { clientId: string; clientSecret: string };

const apiOrigin = "https://api.bliro.io";
const tokenUrl = "https://accounts.bliro.io/oauth/token";

async function accessToken(fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(tokenUrl, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      audience: apiOrigin,
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
    }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the Bliro API carry a token minted from the client application's credentials.
function authorizedFetch(fields: ClientFields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 86400) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== apiOrigin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const bliro = defineProvider({
  name: "Bliro",
  hosts: ["api.bliro.io", "accounts.bliro.io"],
  auth: {
    // An org admin creates a client application at app.bliro.io/orgs/settings/clients (needs the API Access plan).
    clientCredentials: secrets({
      label: "Client application",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const authed = authorizedFetch(account.fields, fetch);
    const response = await authed(`${apiOrigin}/v3/calls?limit=1`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
    return { accountInfo: { externalId: account.fields.clientId, displayName: "Bliro" } };
  },
});

export default defineApp(
  { user: { accounts: { bliro: bliro.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bliro ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: authorizedFetch(account.fields, fetch), signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Bliro",
        description: "Bliro AI sales assistant: list the calls recorded by everyone in your organization.",
        instructions:
          "A client application has the single scope org:calls:read, so only reading calls is available. Filter with startTimestamp and endTimestamp (milliseconds) and paginate with page and limit.",
        icons,
      },
    ),
  }),
);
