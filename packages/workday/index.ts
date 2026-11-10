import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

// Workday has no shared endpoint: each tenant lives on a data-center host such as
// wd2-impl-services1.workday.com and is addressed by its tenant name.
const hostPattern = /^[a-z0-9][a-z0-9.-]*\.(workday|myworkday|workdaysuv)\.com$/;
const tenantPattern = /^[A-Za-z0-9_-]+$/;

type Fields = { host: string; tenant: string; clientId: string; clientSecret: string; refreshToken: string };

function target(fields: Fields) {
  const host = fields.host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const tenant = fields.tenant.trim();
  if (!hostPattern.test(host))
    throw new Error("Enter the Workday host from View API Clients, for example wd2-impl-services1.workday.com.");
  if (!tenantPattern.test(tenant)) throw new Error("Enter the bare Workday tenant name, for example acme.");
  return { host, tenant };
}

const workday = defineProvider({
  name: "Workday",
  hosts: ["*.workday.com", "*.myworkday.com", "*.workdaysuv.com"],
  auth: {
    // Authorization and token URLs are per tenant, which a static oauth2 declaration cannot express.
    // The documented non-expiring refresh token of an API client is exchanged for access tokens in code.
    refreshToken: secrets({
      label: "API client with refresh token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        tenant: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        refreshToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { host, tenant } = target(account.fields);
    const token = await accessToken(fetch, signal, account.fields);
    const response = await fetch(`https://${host}/ccx/api/v1/${tenant}/workers?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${host}/${tenant}`, displayName: tenant } };
  },
});

type Fetch = typeof fetch;

async function accessToken(fetcher: Fetch, signal: AbortSignal | undefined, fields: Fields): Promise<string> {
  const { host, tenant } = target(fields);
  const response = await fetcher(`https://${host}/ccx/oauth2/${tenant}/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: fields.refreshToken }).toString(),
  });
  const { access_token } = await decodeJson(response, object({ access_token: string() }));
  return access_token;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const { host, tenant } = target(fields);
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    cached = { token: await accessToken(fetcher, signal, fields), expires: Date.now() + 50 * 60_000 };
    return cached.token;
  };
  const call = async (method: Method, url: string, search: Params = {}, body?: unknown) => {
    const u = new URL(url);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(u.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // 204 No Content and other empty 2xx bodies (common for PUT and DELETE) report success as null.
    if (response.status === 204) {
      if (!response.ok) return decodeJson(response, json());
      return null;
    }
    if (response.ok) {
      const text = await response.text();
      return text === "" ? null : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
  const api = (path: string, service = "v1") => `https://${host}/ccx/api/${service}/${tenant}${path}`;
  return { call, api, host, tenant };
}

type Client = ReturnType<typeof client>;

const filters = record(json()).optional();
const paging = "Filters go in query (limit up to 100, offset for the next page, search).";

function read(c: Client, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, string({ minLength: 1 })])), query: filters }) },
    async (_ctx, input: Params) => {
      let resolved = path;
      for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
      return c.call("GET", c.api(resolved), (input.query as Params | undefined) ?? {});
    },
  );
}

const servicePath = string({ minLength: 1 });

function build(c: Client) {
  // `path` is everything after the tenant, for example /workers or /workers/{id}/history.
  const pathDoc =
    "path is what follows the tenant in https://{host}/ccx/api/{service}/{tenant}, for example /workers/{id}/history. " +
    "service defaults to v1; use a versioned service such as staffing/v6 when the API Directory in your tenant lists one.";
  return router({
    workers: router(
      {
        list: read(c, "/workers", `List workers (summary records). ${paging}`),
        get: read(c, "/workers/{id}", "Retrieve one worker by Workday ID or WID.", ["id"]),
        directReports: read(c, "/workers/{id}/directReports", "List a worker's direct reports.", ["id"]),
        history: read(c, "/workers/{id}/history", "Retrieve a worker's history. Path /workers/{id}/history is unverified against a tenant API Directory; use api.get if it 404s.", ["id"]),
        timeOffEntries: read(c, "/workers/{id}/timeOffEntries", "List a worker's time off entries.", ["id"]),
        paySlips: read(c, "/workers/{id}/paySlips", "List a worker's pay slips.", ["id"]),
      },
      { title: "Workers", description: "Employees and contingent workers." },
    ),
    organizations: router(
      {
        supervisoryOrganizations: read(c, "/supervisoryOrganizations", `List supervisory organizations. ${paging}`),
        supervisoryOrganization: read(c, "/supervisoryOrganizations/{id}", "Retrieve one supervisory organization.", ["id"]),
      },
      { title: "Organizations", description: "Supervisory organizations." },
    ),
    api: router(
      {
        get: query(
          {
            description: `Call any Workday REST API GET endpoint. ${pathDoc}`,
            input: object({ path: servicePath, service: string().default("v1"), query: filters }),
          },
          async (_ctx, input) => c.call("GET", c.api(input.path.startsWith("/") ? input.path : `/${input.path}`, input.service), input.query),
        ),
        send: mutation(
          {
            description: `Call any Workday REST API endpoint that changes data. ${pathDoc}`,
            input: object({
              method: string().default("POST"),
              path: servicePath,
              service: string().default("v1"),
              query: filters,
              body: json().optional(),
            }),
          },
          async (_ctx, input) => {
            const method = input.method.toUpperCase();
            if (method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE")
              throw new Error("method must be POST, PUT, PATCH or DELETE.");
            return c.call(method, c.api(input.path.startsWith("/") ? input.path : `/${input.path}`, input.service), input.query, input.body);
          },
        ),
      },
      { title: "Generic REST", description: "Any REST endpoint your API client is authorized for." },
    ),
    reports: router(
      {
        run: query(
          {
            description:
              "Run a Report-as-a-Service custom report. owner is the report owner's Workday username, report its name (spaces are replaced with underscores, as in the URL from the report's Web Service > View URLs action).",
            input: object({ owner: string({ minLength: 1 }), report: string({ minLength: 1 }), query: filters }),
          },
          async (_ctx, input) =>
            c.call(
              "GET",
              `https://${c.host}/ccx/service/customreport2/${c.tenant}/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.report.trim().replace(/\s+/g, "_"))}`,
              { format: "json", ...(input.query ?? {}) },
            ),
        ),
      },
      { title: "Reports", description: "Custom reports exposed as web services." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { workday: workday.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.workday ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Workday",
        description: "Workers, supervisory organizations, custom reports and any Workday REST endpoint for one tenant.",
        instructions:
          "Workday's REST surface differs per tenant. Use workers.* for common reads, reports.run for custom reports, and api.get or api.send for any other endpoint listed in your tenant's API Directory.",
        icons,
      },
    ),
  }),
);
