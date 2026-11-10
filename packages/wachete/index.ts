import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Login = object({ token: string() });

const login = async (
  fields: { user_id: string; api_key: string },
  fetch: typeof globalThis.fetch,
  signal?: AbortSignal,
) => {
  const response = await fetch("https://api.wachete.com/thirdparty/v1/user/apilogin", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: fields.user_id, apiKey: fields.api_key }),
  });
  return decodeJson(response, Login);
};

const wachete = defineProvider({
  name: "Wachete",
  hosts: ["api.wachete.com"],
  auth: {
    // The user ID and API key (Wachete profile page) are exchanged for a short-lived bearer token.
    apiKey: secrets({
      label: "User ID and API key",
      fields: object({ user_id: string({ minLength: 1 }), api_key: string({ minLength: 1 }) }),
    }),
  },
  // apilogin is the only call that verifies a User ID and API key: every other endpoint needs the
  // bearer token it returns, and the health context has no access to the app's token cache.
  async health({ account, fetch, signal }) {
    await login(account.fields, fetch, signal);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { wachete: wachete.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wachete ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "30 minutes", // login reports expiresInSec: 3600 by default
              load: async ({ fetch, signal }) => (await login(account.fields, fetch, signal)).token,
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const send = async () => {
                  const headers = new Headers(init?.headers);
                  headers.set("authorization", `bearer ${await token()}`);
                  return fetch(input, { ...init, headers });
                };
                const response = await send();
                if (response.status !== 401) return response;
                // The token expired or was revoked: sign in again and retry once. Request bodies
                // from the OpenAPI router are strings (or absent), so they can be replayed.
                await sessions.invalidate(["token"]);
                const body = init?.body;
                if (body !== undefined && body !== null && typeof body !== "string") return response;
                return send();
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Wachete",
        description: "Monitor web pages for changes with Wachete: monitors, folders, change history and notifications.",
        icons,
      },
    ),
  }),
);
