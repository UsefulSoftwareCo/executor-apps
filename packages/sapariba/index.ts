import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Ariba API gateways by data-center subdomain. The OAuth server is https://{subdomain}.ariba.com
// and the resource gateway is https://open{subdomain}.ariba.com (api -> openapi, api-eu -> openapi-eu).
const regions = ["api", "api-eu", "api.au.cloud"] as const;

function region(value: string): string {
  const v = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.ariba\.com.*$/, "");
  if (!(regions as readonly string[]).includes(v))
    throw new Error(`Enter your SAP Ariba API subdomain: ${regions.join(", ")}.`);
  return v;
}

const sapAriba = defineProvider({
  name: "SAP Ariba",
  hosts: ["*.ariba.com"],
  auth: {
    oauth2lo: secrets({
      label: "Application credentials (OAuth 2LO)",
      fields: object({
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        apiKey: string({ minLength: 1 }),
        anid: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    await accessToken(account.fields, fetch, signal);
    return { accountInfo: { externalId: account.fields.anid, displayName: account.fields.anid } };
  },
});

interface Fields {
  region: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  anid: string;
}

function base64Utf8(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function accessToken(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(`https://${region(fields.region)}.ariba.com/v2/oauth/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${base64Utf8(`${fields.clientId}:${fields.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "openapi_2lo" }).toString(),
  });
  const body = (await decodeJson(response, object({ access_token: string() }))) as { access_token: string };
  return body.access_token;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function client(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const host = `https://open${region(fields.region)}.ariba.com`;
  let token: Promise<string> | undefined;
  const call = async (method: Method, path: string, search: Record<string, unknown> = {}, body?: unknown) => {
    token ??= accessToken(fields, fetcher, signal);
    const url = new URL(`${host}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token}`,
        apiKey: fields.apiKey,
        "x-ariba-network-id": fields.anid,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) return {};
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const path = string({ minLength: 1 });
const queryParams = record(string()).optional();
const pathDoc =
  "path is relative to the gateway, e.g. /api/procurement-reporting-job/v2/prod/jobs. Ariba APIs are versioned per product and almost all take a realm query parameter.";

function build(c: Client) {
  return router(
    {
      get: query(
        {
          description: `GET any SAP Ariba open API resource. ${pathDoc} Pass query as an object of query parameters (realm, $top, $skip, filters).`,
          input: object({ path, query: queryParams }),
        },
        async (_ctx, input) => c.call("GET", input.path, input.query ?? {}),
      ),
      post: mutation(
        {
          description: `POST to a SAP Ariba API (create resources, submit reporting jobs, trigger actions). ${pathDoc}`,
          input: object({ path, query: queryParams, body: json().optional() }),
        },
        async (_ctx, input) => c.call("POST", input.path, input.query ?? {}, input.body),
      ),
      put: mutation(
        {
          description: `PUT to a SAP Ariba API. ${pathDoc}`,
          input: object({ path, query: queryParams, body: json().optional() }),
        },
        async (_ctx, input) => c.call("PUT", input.path, input.query ?? {}, input.body),
      ),
      patch: mutation(
        {
          description: `PATCH a SAP Ariba API resource. ${pathDoc}`,
          input: object({ path, query: queryParams, body: json().optional() }),
        },
        async (_ctx, input) => c.call("PATCH", input.path, input.query ?? {}, input.body),
      ),
      delete: mutation(
        {
          description: `DELETE a SAP Ariba API resource. ${pathDoc}`,
          input: object({ path, query: queryParams }),
        },
        async (_ctx, input) => c.call("DELETE", input.path, input.query ?? {}),
      ),
    },
    { title: "Open APIs", description: "Authenticated access to the SAP Ariba open API gateway." },
  );
}

export default defineApp(
  { user: { accounts: { sapAriba: sapAriba.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sapAriba ?? [],
        (account) =>
          withApprovals(build(client(account.fields as Fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SAP Ariba",
        description: "Call SAP Ariba open APIs (procurement, sourcing, reporting, supplier data) for one realm.",
        icons,
        instructions:
          "Generic gateway access: get/post/put/patch/delete take a path under the gateway such as /api/<api-name>/v<n>/prod/<resource> and a query object (include realm). Find API names and versions in the SAP Business Accelerator Hub. Writes require approval.",
      },
    ),
  }),
);
