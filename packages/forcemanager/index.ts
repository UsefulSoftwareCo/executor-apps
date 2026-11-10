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

const Login = object({ token: string({ minLength: 1 }) });

// The public and private API keys are exchanged for a session token, sent as X-Session-Key.
const login = async (
  fields: { public_key: string; private_key: string },
  fetch: typeof globalThis.fetch,
  signal?: AbortSignal,
) => {
  const response = await fetch("https://api.forcemanager.com/api/v4/login", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ username: fields.public_key, password: fields.private_key }),
  });
  return decodeJson(response, Login);
};

const forcemanager = defineProvider({
  name: "ForceManager",
  hosts: ["api.forcemanager.com"],
  auth: {
    apiKey: secrets({
      label: "Public and private API keys",
      fields: object({
        public_key: string({ minLength: 1 }),
        private_key: string({ minLength: 1 }),
      }),
    }),
  },
  // Every endpoint needs a session key and there is no current-user endpoint, so the login
  // exchange is the only way to validate the keys; it is the first step of any real call.
  async health({ account, fetch, signal }) {
    await login(account.fields, fetch, signal);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { forcemanager: forcemanager.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.forcemanager ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "20 minutes", // conservative; the docs state no session lifetime, and a 401 triggers a fresh login
              load: async ({ fetch, signal }) => (await login(account.fields, fetch, signal)).token,
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("x-session-key", await token());
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["token"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "ForceManager",
        description:
          "Sage Sales Management (ForceManager) CRM: accounts, contacts, opportunities, activities, calendar, sales orders, products, users and value lists.",
        icons,
      },
    ),
  }),
);
