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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fetch = typeof fetch;
type Fields = {
  reportingInstance: string;
  tenant: string;
  apiHost: string;
  clientId: string;
  clientSecret: string;
};
type Account = { fields: Fields };

// Medallia runs in several regions; every host a credential may reach ends in one of these domains.
const DOMAINS = ["medallia.com", "medallia.eu", "medallia.au", "medallia.ca"];

function hostOf(raw: string, label: string): string {
  const text = raw.trim().toLowerCase();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error(`Enter the ${label} as a host name such as instance.medallia.com.`);
  }
  if (url.protocol !== "https:" || url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error(`Enter only the ${label} host name, with no path.`);
  if (!DOMAINS.some((domain) => url.hostname.endsWith(`.${domain}`)))
    throw new Error(`The ${label} must be a Medallia host (${DOMAINS.map((d) => `*.${d}`).join(", ")}).`);
  return url.hostname;
}

function tenantOf(raw: string): string {
  const tenant = raw.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(tenant)) throw new Error("Enter the Medallia tenant name (letters, digits, . _ -).");
  return tenant;
}

const tokenUrl = (f: Fields) =>
  `https://${hostOf(f.reportingInstance, "reporting instance")}/oauth/${encodeURIComponent(tenantOf(f.tenant))}/token`;
const apiOrigin = (f: Fields) => `https://${hostOf(f.apiHost, "API gateway host")}`;

// Medallia's token endpoint takes the client id and secret as HTTP Basic and issues a one-hour bearer token.
async function mintToken(f: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(tokenUrl(f), {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${f.clientId}:${f.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

const medallia = defineProvider({
  name: "Medallia",
  hosts: DOMAINS.flatMap((d) => [`*.${d}`, `*.apis.${d}`]),
  auth: {
    // Medallia only offers the OAuth 2.0 client credentials grant, and its token URL is per reporting instance
    // and tenant, so the client credentials are collected as fields and exchanged by this package.
    apiClient: secrets({
      label: "API client credentials",
      fields: object({
        reportingInstance: plain(string({ minLength: 1 })),
        tenant: plain(string({ minLength: 1 })),
        apiHost: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    await mintToken(account.fields, fetch, signal);
    const tenant = tenantOf(account.fields.tenant);
    const host = hostOf(account.fields.reportingInstance, "reporting instance");
    return { accountInfo: { externalId: `${host}/${tenant}`, displayName: tenant, profileUrl: `https://${host}` } };
  },
});

type Type = "string" | "number" | "json";
type Where = "path" | "query" | "header";
type Field = [name: string, type: Type, required: boolean, where: Where];
type Body = "json" | "csv" | "raw";

const s = (name: string, required = false, where: Where = "query"): Field => [name, "string", required, where];
const n = (name: string): Field => [name, "number", false, "query"];
const j = (name: string, required = true): Field => [name, "json", required, "query"];

type Row = [
  group: string,
  action: string,
  method: "GET" | "POST" | "PUT",
  path: string,
  description: string,
  fields: Field[],
  body?: Body,
];

const pageNote = "Pages with limit and cursor; pass the cursor from the previous response's _next link to get the next page.";
const userNote =
  "user holds the Medallia user object: username, first_name, last_name, roles { primary_role: { role }, extra_roles: [{ role }] } are required; email, phone, automatic_update, excluded_from_user_activity, company_account_id, login_blocked and data-access { organization, segments } are optional.";
const importNote =
  "The importer must already be configured in Medallia (Data Import). Values in each record are strings keyed by the importer's field names.";

const rows: Row[] = [
  // Users and roles (Admin API)
  ["users", "list", "GET", "/admin/v1/users", `List users. Filter by companyAccountId or username (comma separated), role and status (active or inactive). ${pageNote}`, [s("companyAccountId"), s("username"), s("role"), s("status"), n("limit"), s("cursor")]],
  ["users", "get", "GET", "/admin/v1/users/{username}", "Retrieve one user with roles and data access.", [s("username", true, "path")]],
  ["users", "create", "POST", "/admin/v1/users", `Create a user. ${userNote}`, [s("X-Medallia-Send-New-User-Email", false, "header"), j("user")], "json"],
  ["users", "upsert", "PUT", "/admin/v1/users/{username}", `Create the user, or update it when it exists. ${userNote}`, [s("username", true, "path"), s("X-Medallia-Send-New-User-Email", false, "header"), j("user")], "json"],
  ["users", "setDataAccess", "PUT", "/admin/v1/users/{username}/data-access", "Replace a user's data access. user holds { organization: [{ role, unit_group, data_view?, unit_group_display_name? }], segments: [{ role, field, data_view?, field_display_name?, option? }] }.", [s("username", true, "path"), j("user")], "json"],
  ["users", "action", "POST", "/admin/v1/users/{username}/actions/{action}", "Run an account action: reset-password, activate or inactive.", [s("username", true, "path"), s("action", true, "path")]],
  ["users", "bulkDownload", "GET", "/admin/v1/users-bulk-download", "Download users as CSV text. Filter by role and id (comma separated), q (free text) and status (active or inactive).", [s("role"), s("id"), s("q"), s("status")]],
  ["roles", "list", "GET", "/admin/v1/roles", `List roles. ${pageNote}`, [n("limit"), s("cursor")]],
  ["roles", "get", "GET", "/admin/v1/roles/{role}", "Retrieve one role by name.", [s("role", true, "path")]],

  // Query API (GraphQL)
  ["query", "run", "POST", "/data/v0/query", "Run a GraphQL query against the Query API (survey responses, invitations, CX profiles, metadata). query is the GraphQL text; variables is an optional object. The OAuth client's role must have the Query API capability.", [s("query", true), j("variables", false)], "json"],

  // Import API
  ["import", "listImporters", "GET", "/inbound/v2", "Introspect the Import API: an OpenAPI document of every importer the client may use (beta).", []],
  ["import", "describeImporter", "GET", "/inbound/v2/{importer}", "Introspect one importer: the OpenAPI document with its required input fields (beta).", [s("importer", true, "path")]],
  ["import", "send", "POST", "/inbound/v1/{importer}", `Import records synchronously as JSON; answers { records, duplicates, rejects }. ${importNote}`, [s("importer", true, "path"), j("records")], "raw"],
  ["import", "sendCsv", "POST", "/inbound/v1/{importer}", `Import records synchronously from CSV text with a header row. ${importNote}`, [s("importer", true, "path"), s("csv", true)], "csv"],
  ["import", "sendAsync", "POST", "/inbound/v2/async/{importer}", `Queue an import of JSON records and receive a feed_file_id (opt-in feature: ask your Medallia contact to enable it). ${importNote}`, [s("importer", true, "path"), j("records")], "raw"],
  ["import", "feedFileSummary", "GET", "/inbound/v2/feedfiles/{id}", "Status and counts of an asynchronous import (opt-in feature).", [s("id", true, "path")]],
  ["import", "feedFileDetails", "GET", "/inbound/v2/feedfiles/{id}/detailed-results", "Per-record results of an asynchronous import (opt-in feature).", [s("id", true, "path")]],
];

// Mutations are the methods that change Medallia data; introspection, user actions and the Query API are read or POST-as-read.
const readOnlyPosts = new Set(["query.run"]);

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : type === "json" ? json() : string();
    shape[propertyName(name)] = required ? base : base.optional();
  }
  return object(shape);
}

// Header names are not valid identifiers; tools expose them in camelCase.
const propertyName = (name: string) =>
  name === "X-Medallia-Send-New-User-Email" ? "sendNewUserEmail" : name;

function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${propertyName(name)} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const f = account.fields;
  let cached: { token: string; expires: number } | undefined;
  const bearer = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await mintToken(f, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };

  const call = async (method: string, path: string, fields: Field[], body: Body | undefined, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    const headers: Record<string, string> = { Accept: "application/json" };
    for (const [name, , , where] of fields) {
      const value = input[propertyName(name)];
      if (value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "header") headers[name] = String(value);
      else if (body === undefined) params.set(name, String(value));
    }
    let payload: string | undefined;
    if (body === "json") {
      // Either the whole body is one named object (user), or it is built from the query-style fields (GraphQL).
      const named = fields.find(([name, type, , where]) => name === "user" && type === "json" && where === "query");
      payload = JSON.stringify(
        named !== undefined ? input.user : { query: input.query, ...(input.variables !== undefined ? { variables: input.variables } : {}) },
      );
      headers["Content-Type"] = "application/json";
    } else if (body === "raw") {
      payload = JSON.stringify(input.records);
      headers["Content-Type"] = "application/json";
    } else if (body === "csv") {
      payload = String(input.csv);
      headers["Content-Type"] = "text/csv";
    }
    const url = `${apiOrigin(f)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: { ...headers, Authorization: `Bearer ${await bearer()}` },
      body: payload,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Medallia answered ${response.status}: ${text.slice(0, 1000)}`);
    if (text === "") return { ok: true, status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { status: response.status, text };
    }
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, action, method, path, description, fields, body] of rows) {
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, body, input);
    const isRead = method === "GET" || readOnlyPosts.has(`${group}.${action}`);
    const tool = isRead ? query(options, handler as never) : mutation(options, handler as never);
    const entry = groups.get(group) ?? {};
    entry[action] = tool;
    groups.set(group, entry);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { medallia: medallia.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.medallia ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Medallia",
        description:
          "Medallia Experience Cloud: manage users and roles, run Query API (GraphQL) requests over feedback data, and import survey and CX records.",
        instructions:
          "Each account is one Medallia tenant. Query API requests go through query.run with GraphQL text. Imports need an importer configured in Medallia; use import.listImporters to see what the client may import into.",
        icons,
      },
    ),
  }),
);
