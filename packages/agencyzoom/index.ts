import {
  accountRouter,
  array,
  decodeJson,
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

const LOGIN_URL = "https://api.agencyzoom.com/v1/api/auth/login";
const Login = object({ jwt: string({ minLength: 1 }) });

const agencyzoom = defineProvider({
  name: "AgencyZoom",
  hosts: ["api.agencyzoom.com"],
  auth: {
    login: secrets({
      label: "Username and password",
      fields: object({ username: plain(string({ minLength: 1 })), password: string({ minLength: 1 }) }),
    }),
    token: secrets({
      label: "JWT",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The login endpoint is the only unauthenticated read; a pasted JWT is checked on the profile list.
  async health({ account, fetch, signal }) {
    if (account.method === "login") {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ username: account.fields.username, password: account.fields.password }),
      });
      await decodeJson(response, Login);
      return;
    }
    const response = await fetch("https://api.agencyzoom.com/v1/api/employees", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, accept: "application/json" },
    });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { agencyzoom: agencyzoom.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.agencyzoom ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          // The vendor documents no lifetime for the login JWT. The 10 minute window is our choice;
          // a 401 invalidates the cache so the next call signs in again.
          const jwt = () =>
            sessions.get({
              key: ["jwt"],
              schema: string(),
              freshFor: "10 minutes",
              load: async ({ fetch: loadFetch, signal: loadSignal }) => {
                if (account.method !== "login") throw new Error("Only username and password accounts sign in.");
                const response = await loadFetch(LOGIN_URL, {
                  method: "POST",
                  signal: loadSignal,
                  headers: { "content-type": "application/json", accept: "application/json" },
                  body: JSON.stringify({ username: account.fields.username, password: account.fields.password }),
                });
                return (await decodeJson(response, Login)).jwt;
              },
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                if (account.method !== "login") return fetch(input, init);
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await jwt()}`);
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["jwt"]);
                // A successful logout kills the server-side JWT, so drop the cached copy.
                if (response.ok && new URL(String(input instanceof Request ? input.url : input)).pathname.endsWith("/auth/logout"))
                  await sessions.invalidate(["jwt"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "AgencyZoom",
        description:
          "Manage insurance agency leads, customers, policies, tasks, service tickets and pipelines in AgencyZoom.",
        icons,
      },
    ),
  }),
);
