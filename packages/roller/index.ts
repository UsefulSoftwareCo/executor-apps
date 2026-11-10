import {
  accountRouter,
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
import { reportingOptions, restOptions } from "./openapi.js";

const TOKEN_URL = "https://api.roller.app/token";
const Token = object({ access_token: string(), expires_in: number().optional() });

type Fetch = typeof fetch;
type Fields = { clientId: string; clientSecret: string };

async function mintToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(TOKEN_URL, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: fields.clientId, client_secret: fields.clientSecret }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`ROLLER token request answered ${response.status}: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(text) as { access_token?: unknown; expires_in?: unknown };
  if (typeof parsed.access_token !== "string") throw new Error("ROLLER token response had no access_token.");
  return { token: parsed.access_token, expiresIn: typeof parsed.expires_in === "number" ? parsed.expires_in : 3600 };
}

// ROLLER asks callers to reuse one token (about 24 hours) and warns that minting one per call earns 429s.
function tokenSource(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: { token: string; expires: number } | undefined;
  return async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const { token, expiresIn } = await mintToken(fields, fetcher, signal);
    cached = { token, expires: Date.now() + expiresIn * 900 };
    return token;
  };
}

const roller = defineProvider({
  name: "ROLLER",
  hosts: ["api.roller.app"],
  auth: {
    clientCredentials: secrets({
      label: "API credentials (client ID and secret)",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting a token proves the credentials; the APIs expose no current-account endpoint to call afterwards.
  async health({ account, fetch, signal }) {
    await mintToken(account.fields, fetch, signal);
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

export default defineApp(
  { user: { accounts: { roller: roller.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.roller ?? [],
        async (account) => {
          const token = tokenSource(account.fields, fetch, signal);
          const authed: Fetch = async (input, init) => {
            const request = new Request(input, init);
            if (new URL(request.url).host === "api.roller.app")
              request.headers.set("Authorization", `Bearer ${await token()}`);
            return fetch(request);
          };
          const mount = (options: typeof restOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router({ rest: await mount(restOptions), reporting: await mount(reportingOptions) });
        },
        { signal },
      ),
      {
        title: "ROLLER",
        description:
          "ROLLER venue management: bookings, products, sessions and availability, guests, gift cards, discounts, modifiers, and the Reporting API for bookings, revenue and guest data.",
        instructions:
          "The rest group is the transactional REST API; the reporting group is the read-only Reporting API for analytics. Both run against the production environment.",
        icons,
      },
    ),
  }),
);
