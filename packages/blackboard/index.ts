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

// Blackboard Learn is hosted per institution. Only the hosts the provider declares are allowed,
// because the application key and secret are sent to this host.
const hostPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/;
const allowedSuffixes = [".blackboard.com", ".blackboardcloud.com", ".blackboard.cn"];

function hostOf(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host) || !allowedSuffixes.some((suffix) => host.endsWith(suffix)))
    throw new Error(
      "Enter your Blackboard host, for example myschool.blackboard.com (*.blackboard.com, *.blackboardcloud.com or *.blackboard.cn).",
    );
  return host;
}

const Token = object({ access_token: string({ minLength: 1 }), expires_in: number().optional() });

type Fetch = typeof fetch;
type Fields = { host: string; key: string; secret: string };

// The OAuth endpoints are per institution, which a static oauth2 declaration cannot express, so
// the client credentials grant is performed in code. Blackboard takes the application key and
// secret as HTTP Basic credentials and returns a bearer token valid for about an hour.
async function exchange(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`https://${hostOf(fields.host)}/learn/api/public/v1/oauth2/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${fields.key}:${fields.secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  return decodeJson(response, Token);
}

const blackboard = defineProvider({
  name: "Blackboard",
  hosts: ["*.blackboard.com", "*.blackboardcloud.com", "*.blackboard.cn"],
  auth: {
    // Create the application at https://developer.anthology.com and register it in the
    // institution's Learn instance (System Admin > REST API Integrations).
    application: secrets({
      label: "REST application key and secret",
      fields: object({
        host: plain(string({ minLength: 1 })),
        key: plain(string({ minLength: 1 })),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = hostOf(account.fields.host);
    // Token exchange proves the key and secret; the system-version endpoint is read-only.
    const token = await exchange(account.fields, fetch, signal);
    const response = await fetch(`https://${host}/learn/api/public/v1/system/version`, {
      signal,
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    });
    // Swagger does not mark learn.major required, but every Learn release reports it; a response
    // without it is not a Learn system-version document.
    await decodeJson(response, object({ learn: object({ major: number() }) }));
    return { accountInfo: { externalId: `${host}:${account.fields.key}`, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { blackboard: blackboard.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.blackboard ?? [],
        (account) => {
          const origin = `https://${hostOf(account.fields.host)}`;
          // Persisted in the account-scoped app cache so the token survives across tool calls
          // regardless of how often this callback runs. Learn tokens last 3600 seconds.
          const scoped = cache.forAccount(account);
          const token = async () =>
            (
              await scoped.get({
                key: ["blackboard-token", origin],
                schema: Token,
                freshFor: "50 minutes",
                load: ({ fetch: loadFetch, signal: loadSignal }) =>
                  exchange(account.fields, loadFetch, loadSignal),
              })
            ).access_token;
          // Every tool call goes out with a freshly exchanged bearer token in place of the
          // application secret that authorizes the operation.
          const authorized: Fetch = async (input, init) => {
            const request = new Request(input, init);
            request.headers.set("Authorization", `Bearer ${await token()}`);
            return fetch(request);
          };
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch: authorized,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Blackboard",
        description:
          "Blackboard Learn courses, users, memberships, grades, content, announcements, terms and the rest of the Learn REST API.",
        instructions:
          "Ids can be given as external keys, for example `externalId:<id>`, `userName:<name>` or `courseId:<id>`. List endpoints return one page; follow `paging.nextPage` by passing its `offset`.",
        icons,
      },
    ),
  }),
);
