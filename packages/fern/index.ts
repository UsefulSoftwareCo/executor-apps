import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// A Fern docs site serves its own "Public API" under /api/fern-docs on the site's domain, so the
// docs URL is part of the account. Decision: the provider declares no `hosts` and no `request`
// placement, because docs domains are arbitrary (custom domains or <org>.docs.buildwithfern.com)
// and the framework only accepts static host lists. Every call is made against the account's own
// docs origin, so the key never leaves it.
function docsOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter the domain of your Fern docs site, for example docs.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Fern docs site must use https.");
  return url.origin;
}

const Jwt = object({ fern_token: string(), roles: array(string()) });

async function getJson(
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
  url: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const response = await fetcher(url, { signal, headers: { Accept: "application/json", ...headers } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Fern answered ${response.status}: ${text.slice(0, 1000)}`);
  return JSON.parse(text) as unknown;
}

const rolesHeader = (roles: string | undefined): Record<string, string> =>
  roles === undefined || roles === "" ? {} : { ROLES: roles };

const fern = defineProvider({
  name: "Fern",
  auth: {
    // Fern issues API keys from the CLI (`fern token`); it offers no OAuth apps.
    apiKey: secrets({
      label: "Fern API key",
      fields: object({
        docsUrl: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = docsOrigin(account.fields.docsUrl);
    const response = await fetch(`${origin}/api/fern-docs/get-jwt`, {
      signal,
      headers: { FERN_API_KEY: account.fields.apiKey, Accept: "application/json" },
    });
    await decodeJson(response, Jwt);
    return { accountInfo: { externalId: new URL(origin).host, displayName: new URL(origin).host } };
  },
});

type Account = { fields: { docsUrl: string; apiKey: string } };

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = docsOrigin(account.fields.docsUrl);
  const key = { FERN_API_KEY: account.fields.apiKey };

  const jwt = async (roles: string | undefined) =>
    (await getJson(fetcher, signal, `${origin}/api/fern-docs/get-jwt`, {
      ...key,
      ...rolesHeader(roles),
    })) as { fern_token: string; roles: string[] };

  return router({
    getJwt: query(
      {
        description:
          "Get a JWT for the docs site from the account's Fern API key, optionally scoped to roles. The JWT authenticates requests to protected docs endpoints (FERN_TOKEN header). Returns { fern_token, roles }.\n\nParameters:\n- roles (string, optional): comma-separated roles, for example \"botanist,seedling\". Empty when omitted.",
        input: object({ roles: string().optional() }),
      },
      async (_ctx, input) => jwt(input.roles),
    ),
    getSearchKey: query(
      {
        description:
          "Get short-lived Algolia search credentials (appId, apiKey, roles) for querying the docs site's search index.\n\nParameters:\n- roles (string, optional): comma-separated roles that scope the returned search key. Empty when omitted.",
        input: object({ roles: string().optional() }),
      },
      async (_ctx, input) =>
        getJson(fetcher, signal, `${origin}/api/fern-docs/search/v2/key`, { ...key, ...rolesHeader(input.roles) }),
    ),
    whoami: query(
      {
        description:
          "Get the authentication info (name, email, roles) the docs site holds for the current user. Mints a JWT from the account's API key first, so the result reflects the roles given.\n\nParameters:\n- roles (string, optional): comma-separated roles to mint the JWT with.",
        input: object({ roles: string().optional() }),
      },
      async (_ctx, input) => {
        const { fern_token } = await jwt(input.roles);
        return getJson(fetcher, signal, `${origin}/api/fern-docs/whoami`, { FERN_TOKEN: fern_token });
      },
    ),
  } as never);
}

export default defineApp(
  { user: { accounts: { fern: fern.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fern ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fern",
        description:
          "Fern docs site Public API: mint a JWT from a Fern API key, get Algolia search credentials, and read the current user's roles for a docs site.",
        icons,
      },
    ),
  }),
);
