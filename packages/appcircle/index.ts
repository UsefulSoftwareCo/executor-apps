import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  number,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const authUrl = "https://auth.appcircle.io/auth/v3/token";

type Fetch = typeof globalThis.fetch;

// Appcircle's APIs take a short-lived token, minted from the long-lived Personal Access Key.
async function exchange(fetch: Fetch, personalAccessKey: string, signal: AbortSignal | undefined) {
  const response = await fetch(authUrl, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ personalAccessKey }).toString(),
  });
  return decodeJson(response, object({ access_token: string({ minLength: 1 }), expires_in: number() }));
}

const appcircle = defineProvider({
  name: "Appcircle",
  hosts: ["api.appcircle.io", "auth.appcircle.io"],
  auth: {
    apiKey: secrets({
      label: "Personal Access Key",
      fields: object({ personalAccessKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { access_token } = await exchange(fetch as Fetch, account.fields.personalAccessKey, signal);
    const response = await fetch("https://api.appcircle.io/distribution/v2/profiles", {
      signal,
      headers: { Authorization: `Bearer ${access_token}`, accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Appcircle rejected the token (${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { appcircle: appcircle.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    // Tokens are minted per key per app instance (expires_in is 4 hours) and replace the placeholder
    // Authorization header. Re-minted shortly before expiry, and once more after a 401.
    const marginMs = 60_000;
    const tokens = new Map<string, Promise<{ token: string; expiresAt: number }>>();
    const mint = (key: string, force: boolean) => {
      let pending = tokens.get(key);
      if (force || !pending) {
        const fresh = exchange(fetch as Fetch, key, signal).then((r) => ({
          token: r.access_token,
          expiresAt: Date.now() + r.expires_in * 1000,
        }));
        pending = fresh;
        tokens.set(key, fresh);
        fresh.catch(() => {
          if (tokens.get(key) === fresh) tokens.delete(key);
        });
      }
      return pending;
    };
    const withToken = (key: string): Fetch => async (input, init) => {
      let entry = await mint(key, false);
      if (entry.expiresAt - Date.now() < marginMs) entry = await mint(key, true);
      const attempt = (token: string) => {
        const request = new Request(input, init);
        request.headers.set("Authorization", `Bearer ${token}`);
        return (fetch as Fetch)(request);
      };
      const response = await attempt(entry.token);
      if (response.status !== 401) return response;
      return attempt((await mint(key, true)).token);
    };
    return {
      tools: router(
        await accountRouter(
          user?.accounts.appcircle ?? [],
          (account) =>
            router(
              Object.fromEntries(
                Object.entries(apis).map(([name, options]) => [
                  name,
                  withApprovals(
                    liveOpenapiRouter({
                      ...options,
                      cache,
                      fetch: withToken(account.fields.personalAccessKey) as typeof fetch,
                      signal,
                      account,
                    }),
                    (tool) => (tool.kind === "mutation" ? always() : undefined),
                  ),
                ]),
              ),
              { title: "Appcircle", description: "Appcircle organization." },
            ),
          { signal },
        ),
        {
          title: "Appcircle",
          description:
            "Appcircle mobile CI/CD. build: profiles, branches, workflows, builds. distribution: testing distribution profiles and testers. publish: publish flows and store submissions. signing-identity: certificates and provisioning profiles. store-credential: store connections. store: Enterprise App Store. report, webhook, task, license, identity.",
          icons,
        },
      ),
    };
  },
);
