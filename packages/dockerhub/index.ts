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

const Token = object({ access_token: string() });

// Docker Hub bearer tokens are short-lived JWTs obtained by exchanging a username (or
// organization name) and a personal or organization access token.
const exchange = async (
  fields: { identifier: string; secret: string },
  fetch: typeof globalThis.fetch,
  signal?: AbortSignal,
) => {
  const response = await fetch("https://hub.docker.com/v2/auth/token", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: fields.identifier, secret: fields.secret }),
  });
  return decodeJson(response, Token);
};

const dockerhub = defineProvider({
  name: "Docker Hub",
  hosts: ["hub.docker.com"],
  auth: {
    accessToken: secrets({
      label: "Username and access token (organization access tokens only work on /v2/namespaces/{namespace}/repositories/ routes)",
      fields: object({ identifier: string({ minLength: 1 }), secret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    await exchange(account.fields, fetch, signal);
    return {};
  },
});

export default defineApp(
  { user: { accounts: { dockerhub: dockerhub.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dockerhub ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "4 minutes",
              load: async ({ fetch, signal }) =>
                (await exchange(account.fields, fetch, signal)).access_token,
            });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await token()}`);
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
        title: "Docker Hub",
        description:
          "Docker Hub repositories, tags, organizations, teams, members, access tokens, audit logs and image scans.",
        icons,
      },
    ),
  }),
);
