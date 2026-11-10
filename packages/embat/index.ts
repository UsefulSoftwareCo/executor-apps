import {
  accountRouter,
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

const TOKEN_URL = "https://api.embat.io/authentication/token";
const Token = object({ idToken: string({ minLength: 1 }) });

const embat = defineProvider({
  name: "Embat",
  hosts: ["api.embat.io"],
  auth: {
    login: secrets({
      label: "Service user email and password",
      fields: object({ email: plain(string({ minLength: 1 })), password: string({ minLength: 1 }) }),
    }),
  },
  // The token endpoint is the only read that needs nothing but the credentials.
  async health({ account, fetch, signal }) {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: account.fields.email, password: account.fields.password }),
    });
    await decodeJson(response, Token);
  },
});

export default defineApp(
  { user: { accounts: { embat: embat.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.embat ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          // Embat tokens last 60 minutes and there is no refresh endpoint; sign in again.
          const idToken = () =>
            sessions.get({
              key: ["idToken"],
              schema: string(),
              freshFor: "50 minutes",
              load: async ({ fetch: loadFetch, signal: loadSignal }) => {
                const response = await loadFetch(TOKEN_URL, {
                  method: "POST",
                  signal: loadSignal,
                  headers: { "content-type": "application/json", accept: "application/json" },
                  body: JSON.stringify({ email: account.fields.email, password: account.fields.password }),
                });
                return (await decodeJson(response, Token)).idToken;
              },
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await idToken()}`);
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["idToken"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Embat",
        description:
          "Treasury management with Embat: bank connections, accounts, balances, transactions, payments, operations, accounting entries, budgets and categories.",
        icons,
      },
    ),
  }),
);
