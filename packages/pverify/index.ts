import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const production = "api.pverify.com";
const test = "testapi.pverify.com";

const pverify = defineProvider({
  name: "pVerify",
  hosts: [production, test],
  auth: {
    // pVerify issues a Client ID and Client Secret in its API management portal; the app trades them
    // for a bearer token at /Token and sends the Client ID as Client-Api-Id on every call.
    apiKey: secrets({
      label: "Client credentials",
      fields: object({
        apiHost: plain(string({ minLength: 1 })), // api.pverify.com, or testapi.pverify.com for the test environment
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    host(account.fields.apiHost);
    const token = await requestToken(account.fields, fetch, signal);
    const response = await fetch(`https://${account.fields.apiHost}/API/GetAllPayers`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, "Client-Api-Id": account.fields.clientId },
    });
    await decodeJson(response, json());
  },
});

type Fields = { apiHost: string; clientId: string; clientSecret: string };

function host(value: string) {
  if (value !== production && value !== test) throw new Error(`apiHost must be ${production} or ${test}.`);
  return value;
}

async function requestToken(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`https://${host(fields.apiHost)}/Token`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded", "Client-Api-Id": fields.clientId },
    body: new URLSearchParams({
      Client_Id: fields.clientId,
      Client_Secret: fields.clientSecret,
      grant_type: "client_credentials",
    }).toString(),
  });
  const { access_token } = await decodeJson(
    response,
    object({ access_token: string({ minLength: 1 }) }),
  );
  return access_token;
}

// The document declares Authorization and Client-Api-Id as header parameters of every operation.
// The app supplies them from the account, so they are removed, along with the /Token operation.
function strip(document: Record<string, unknown>) {
  const paths = { ...(document.paths as Record<string, Record<string, unknown>>) };
  delete paths["/Token"];
  for (const [path, item] of Object.entries(paths)) {
    const next: Record<string, unknown> = {};
    for (const [method, operation] of Object.entries(item)) {
      const op = operation as { parameters?: { name: string; in: string }[] };
      next[method] = Array.isArray(op.parameters)
        ? {
            ...op,
            parameters: op.parameters.filter(
              (p) => !(p.in === "header" && (p.name.toLowerCase() === "authorization" || p.name.toLowerCase() === "client-api-id")),
            ),
          }
        : operation;
    }
    paths[path] = next;
  }
  // Round-trips through JSON so the result is a plain JSON value the cache accepts.
  return JSON.parse(JSON.stringify({ ...document, paths }));
}

export default defineApp(
  { user: { accounts: { pverify: pverify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pverify ?? [],
        async (account) => {
          const apiHost = host(account.fields.apiHost);
          const origin = `https://${apiHost}`;
          const sessions = cache.forAccount(account);
          const token = () =>
            sessions.get({
              key: ["token"],
              schema: string(),
              freshFor: "10 minutes",
              load: async ({ fetch: loadFetch, signal: loadSignal }) =>
                requestToken(account.fields, loadFetch, loadSignal),
            });
          const document = await cache.get({
            key: ["pverify-swagger"],
            schema: record(json()),
            freshFor: "1 day",
            load: async ({ fetch: loadFetch, signal: loadSignal }) =>
              strip(
                await decodeJson(await loadFetch(String(options.source.url), { signal: loadSignal }), record(json())),
              ),
          });
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              source: { document },
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("authorization", `Bearer ${await token()}`);
                headers.set("client-api-id", account.fields.clientId);
                const response = await fetch(input, { ...init, headers });
                // An expired token is replaced on the next call.
                if (response.status === 401) await sessions.invalidate(["token"]);
                return response;
              },
            }),
            // Inquiry endpoints are POSTs that run billable payer transactions; require approval for all mutations.
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "pVerify",
        description:
          "pVerify insurance eligibility and benefits verification, claim status, insurance discovery, patient finder, MBI lookup and payer lists.",
        instructions:
          "Eligibility and several other inquiries are asynchronous: submit the inquiry, then call the matching Get...Response tool with the returned request id until the result is complete. Use apiHost testapi.pverify.com for test credentials. Payer codes come from the GetAllPayers tool.",
        icons,
      },
    ),
  }),
);
