import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const globalHost = "https://api.central.sophos.com";

const sophos = defineProvider({
  name: "Sophos Central",
  // The global API host plus every regional host (api-us01, api-eu01, ...). Tenant calls go to the region in whoami.
  hosts: ["*.central.sophos.com"],
  auth: {
    // Sophos Central > Global Settings > API Credentials Management (tenant), Partner or Organization credentials
    // in Sophos Central Partner/Enterprise. The client ID and secret are exchanged for a one-hour bearer token.
    credentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://id.sophos.com/api/v2/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["token"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${globalHost}/whoami/v1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string(), idType: string() }));
    return { accountInfo: { externalId: me.id, displayName: `Sophos Central ${me.idType}` } };
  },
});

type Account = { fields: { access_token: string } };
type Scope = "global" | "tenant" | "partner" | "organization";
type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];
type Row = [
  group: string,
  action: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  scope: Scope,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const b = (name: string): Field => [name, "boolean", false, "query"];

const keyPage: Field[] = [s("pageFromKey"), n("pageSize"), b("pageTotal")];
const numPage: Field[] = [n("page"), n("pageSize"), b("pageTotal")];
const fieldsParam = s("fields");

const arrayNote = "Array filters are comma-separated strings.";
const bodyNote = "body is the JSON request body exactly as Sophos documents it (https://developer.sophos.com/apis).";

const rows: Row[] = [
  // Identity
  ["account", "whoami", "GET", "/whoami/v1", "global", "Identify the credentials: returns the ID, idType (tenant, partner or organization) and API hosts (global and, for tenants, the data region host).", []],
  ["account", "healthCheck", "GET", "/account-health-check/v1/health-check", "tenant", `Run the account health check (protection, policy, exclusions, tamperProtection). ${arrayNote}`, [s("checks"), s("products")]],
  ["account", "licenses", "GET", "/licenses/v1/licenses", "tenant", "List the tenant's licenses with usage.", []],
  ["account", "auditEvents", "GET", "/audit/v1/audit-events", "tenant", "List audit events of the last 90 days (startDate is required, ISO 8601).", [s("startDate", true), s("endDate"), s("originIpAddress"), s("modifiedBy"), s("modifierAccountId"), s("resourceOwnerId"), s("pageFromKey"), n("pageSize"), fieldsParam]],

  // Partner and organization
  ["partner", "listTenants", "GET", "/partner/v1/tenants", "partner", `List the tenants of a partner (needs partner credentials). Each tenant carries its id, dataRegion and apiHost. ${arrayNote}`, [fieldsParam, s("billingType"), s("status"), s("ids"), ...numPage]],
  ["partner", "getTenant", "GET", "/partner/v1/tenants/{tenantId}", "partner", "Get one tenant of a partner.", []],
  ["organization", "listTenants", "GET", "/organization/v1/tenants", "organization", `List the tenants of an organization (needs organization credentials). ${arrayNote}`, [s("ids"), b("managed"), ...numPage]],
  ["organization", "getTenant", "GET", "/organization/v1/tenants/{tenantId}", "organization", "Get one tenant of an organization.", []],

  // Alerts and cases
  ["alerts", "list", "GET", "/common/v1/alerts", "tenant", `List alerts. from and to are ISO 8601 datetimes. ${arrayNote}`, [s("groupKey"), s("from"), s("to"), s("sort"), s("product"), s("category"), s("severity"), s("ids"), fieldsParam, ...keyPage]],
  ["alerts", "get", "GET", "/common/v1/alerts/{alertId}", "tenant", "Get one alert.", []],
  ["alerts", "search", "POST", "/common/v1/alerts/search", "tenant", `Search alerts with a JSON body (category, product, severity, groupKey, from, to, ids and more) for filters too long for a query string. ${bodyNote}`, [fieldsParam, ...keyPage], true],
  ["alerts", "act", "POST", "/common/v1/alerts/{alertId}/actions", "tenant", `Take an action on an alert. body is { action, message? } where action is one of acknowledge, cleanPua, cleanVirus, authPua, clearThreat, clearHmpa, sendMsgPua, sendMsgThreat.`, [], true],
  ["cases", "list", "GET", "/cases/v1/cases", "tenant", `List cases. ${arrayNote}`, [s("managedBy"), s("type"), s("severity"), s("status"), s("assignee"), s("sort"), ...numPage]],
  ["cases", "get", "GET", "/cases/v1/cases/{caseId}", "tenant", "Get one case.", []],
  ["cases", "update", "PATCH", "/cases/v1/cases/{caseId}", "tenant", `Update a case. ${bodyNote}`, [], true],

  // SIEM
  ["siem", "events", "GET", "/siem/v1/events", "tenant", "SIEM feed of events from the last 24 hours. Pass the returned next_cursor as cursor to continue; limit is 200 to 1000; from_date is a Unix timestamp.", [n("limit"), s("cursor"), n("from_date"), s("exclude_types"), n("from_date_offset_minutes")]],
  ["siem", "alerts", "GET", "/siem/v1/alerts", "tenant", "SIEM feed of alerts from the last 24 hours. Pass the returned next_cursor as cursor to continue; limit is 200 to 1000; from_date is a Unix timestamp.", [n("limit"), s("cursor"), n("from_date"), n("from_date_offset_minutes")]],

  // Endpoints
  ["endpoints", "list", "GET", "/endpoint/v1/endpoints", "tenant", `List endpoints. Dates are ISO 8601 or relative durations such as -P7D. ${arrayNote}`, [
    ...keyPage, s("sort"), s("healthStatus"), s("type"), b("tamperProtectionEnabled"), b("tamperProtectionSupported"), s("lockdownStatus"),
    s("overallEncryptionStatus"), s("lastSeenBefore"), s("lastSeenAfter"), s("isolationStatus"), s("hostnameContains"), s("ipAddresses"),
    s("macAddresses"), s("search"), s("searchFields"), s("groupIds"), s("ids"), fieldsParam, s("view"),
  ]],
  ["endpoints", "get", "GET", "/endpoint/v1/endpoints/{endpointId}", "tenant", "Get one endpoint.", [fieldsParam, s("view")]],
  ["endpoints", "delete", "DELETE", "/endpoint/v1/endpoints/{endpointId}", "tenant", "Delete an endpoint from Sophos Central.", []],
  ["endpoints", "deleteMany", "POST", "/endpoint/v1/endpoints/delete", "tenant", `Delete several endpoints. body is { ids: [...] }.`, [], true],
  ["endpoints", "scan", "POST", "/endpoint/v1/endpoints/{endpointId}/scans", "tenant", "Ask an endpoint to run a scan. body is {} unless Sophos documents options.", [], true],
  ["endpoints", "checkForUpdates", "POST", "/endpoint/v1/endpoints/{endpointId}/update-checks", "tenant", "Ask an endpoint to check for updates. body is {}.", [], true],
  ["endpoints", "getIsolation", "GET", "/endpoint/v1/endpoints/{endpointId}/isolation", "tenant", "Get an endpoint's isolation status.", []],
  ["endpoints", "setIsolation", "PATCH", "/endpoint/v1/endpoints/{endpointId}/isolation", "tenant", "Isolate or release an endpoint. body is { enabled: boolean, comment?: string (max 400) }.", [], true],
  ["endpoints", "setIsolationMany", "POST", "/endpoint/v1/endpoints/isolation", "tenant", "Isolate or release 1 to 500 endpoints. body is { enabled, comment?, ids: [...] }.", [], true],
  ["endpoints", "getTamperProtection", "GET", "/endpoint/v1/endpoints/{endpointId}/tamper-protection", "tenant", "Get an endpoint's Tamper Protection settings, including the tamper password.", []],
  ["endpoints", "setTamperProtection", "POST", "/endpoint/v1/endpoints/{endpointId}/tamper-protection", "tenant", "Turn Tamper Protection on or off for an endpoint. body is { enabled?: boolean, regeneratePassword?: boolean }.", [], true],
  ["endpoints", "installers", "GET", "/endpoint/v1/downloads", "tenant", `List installer download links. ${arrayNote}`, [s("requestedProducts"), s("platforms")]],

  // Endpoint groups
  ["groups", "list", "GET", "/endpoint/v1/endpoint-groups", "tenant", `List endpoint groups. ${arrayNote}`, [s("groupType"), s("sort"), fieldsParam, s("ids"), s("search"), s("searchFields"), ...numPage]],
  ["groups", "get", "GET", "/endpoint/v1/endpoint-groups/{groupId}", "tenant", "Get an endpoint group.", [fieldsParam]],
  ["groups", "create", "POST", "/endpoint/v1/endpoint-groups", "tenant", "Create an endpoint group. body is { name, type: computer|server, description?, endpointIds? }.", [fieldsParam], true],
  ["groups", "update", "PATCH", "/endpoint/v1/endpoint-groups/{groupId}", "tenant", "Rename or re-describe an endpoint group. body is { name?, description? }.", [fieldsParam], true],
  ["groups", "delete", "DELETE", "/endpoint/v1/endpoint-groups/{groupId}", "tenant", "Delete an endpoint group.", []],
  ["groups", "listEndpoints", "GET", "/endpoint/v1/endpoint-groups/{groupId}/endpoints", "tenant", "List the endpoints in a group.", [...keyPage, fieldsParam]],
  ["groups", "addEndpoints", "POST", "/endpoint/v1/endpoint-groups/{groupId}/endpoints", "tenant", "Add endpoints to a group. body is { ids: [...] }.", [], true],
  ["groups", "removeEndpoints", "DELETE", "/endpoint/v1/endpoint-groups/{groupId}/endpoints", "tenant", "Remove endpoints from a group. ids is a comma-separated list of endpoint IDs (at most 50).", [s("ids")]],

  // Endpoint settings
  ["settings", "getTamperProtection", "GET", "/endpoint/v1/settings/tamper-protection", "tenant", "Whether Tamper Protection is turned on globally for the tenant.", []],
  ["settings", "listAllowedItems", "GET", "/endpoint/v1/settings/allowed-items", "tenant", "List allowed items.", numPage],
  ["settings", "allowItem", "POST", "/endpoint/v1/settings/allowed-items", "tenant", "Allow an item. body is { type: path|sha256|certificateSigner|posixPath, properties: { fileName?, path?, sha256?, certificateSigner? }, comment, originPersonId?, originEndpointId? }.", [], true],
  ["settings", "deleteAllowedItem", "DELETE", "/endpoint/v1/settings/allowed-items/{allowedItemId}", "tenant", "Delete an allowed item.", []],
  ["settings", "listBlockedItems", "GET", "/endpoint/v1/settings/blocked-items", "tenant", "List blocked items.", numPage],
  ["settings", "blockItem", "POST", "/endpoint/v1/settings/blocked-items", "tenant", "Block an item. body is { type: sha256, properties: { fileName?, path?, sha256?, certificateSigner? }, comment }.", [], true],
  ["settings", "deleteBlockedItem", "DELETE", "/endpoint/v1/settings/blocked-items/{blockedItemId}", "tenant", "Delete a blocked item.", []],
  ["settings", "listScanningExclusions", "GET", "/endpoint/v1/settings/exclusions/scanning", "tenant", "List scanning exclusions. type is one of path, posixPath, virtualPath, process, web, pua, exploitMitigation, amsi, behavioral, journalHashingProcess, journalHashingPath.", [s("type"), ...numPage]],
  ["settings", "addScanningExclusion", "POST", "/endpoint/v1/settings/exclusions/scanning", "tenant", "Add a scanning exclusion. body is { value, type, scanMode?: onDemand|onAccess|onDemandAndOnAccess, comment? (max 100) }.", [], true],
  ["settings", "deleteScanningExclusion", "DELETE", "/endpoint/v1/settings/exclusions/scanning/{exclusionId}", "tenant", "Delete a scanning exclusion.", []],
  ["policies", "list", "GET", "/endpoint/v1/policies", "tenant", "List endpoint policies. policyType is one of threat-protection, peripheral-control, application-control, data-collection-and-investigation, device-encryption, web-control, agent-updating, windows-firewall, endpoint-dns-protection, server-threat-protection and the other server-* types.", [s("policyType"), fieldsParam, ...numPage]],
  ["policies", "get", "GET", "/endpoint/v1/policies/{policyId}", "tenant", "Get one endpoint policy.", [fieldsParam]],

  // Directory, admins, firewalls
  ["directory", "listUsers", "GET", "/common/v1/directory/users", "tenant", `List directory users. ${arrayNote}`, [s("sort"), fieldsParam, s("ids"), s("search"), s("searchFields"), s("groupId"), ...numPage]],
  ["directory", "listUserGroups", "GET", "/common/v1/directory/user-groups", "tenant", `List directory user groups. ${arrayNote}`, [s("sort"), fieldsParam, s("ids"), s("search"), s("searchFields"), ...numPage]],
  ["admins", "list", "GET", "/common/v1/admins", "tenant", `List the tenant's Sophos Central admins. ${arrayNote}`, [s("sort"), fieldsParam, s("search"), s("searchFields"), s("roleId"), ...numPage]],
  ["firewalls", "list", "GET", "/firewall/v1/firewalls", "tenant", "List the tenant's firewalls. groupId may be 'ungrouped'.", [s("groupId"), s("search"), ...numPage]],

  // XDR data lake queries
  ["xdr", "listQueries", "GET", "/xdr-query/v1/queries", "tenant", `List saved XDR queries. ${arrayNote}`, [s("categoryId"), s("search"), s("searchFields"), fieldsParam, ...numPage]],
  ["xdr", "startQueryRun", "POST", "/xdr-query/v1/queries/runs", "tenant", `Start a query run against the data lake. body is { savedQuery: { queryId, categoryId? } } or { adHocQuery: { template, name?, variables? }, from?, to? }. Poll xdr.getQueryRun, then read xdr.getQueryResults.`, [], true],
  ["xdr", "getQueryRun", "GET", "/xdr-query/v1/queries/runs/{runId}", "tenant", "Get the status of a query run.", []],
  ["xdr", "getQueryResults", "GET", "/xdr-query/v1/queries/runs/{runId}/results", "tenant", "Get the results of a finished query run.", [s("pageFromKey"), n("pageSize"), n("page")]],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined, scope: Scope): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .filter((name) => !extra.some(([known]) => known === name))
    .map((name) => [name, "string", true, "path"]);
  const body: Field[] = hasBody === true ? [["body", "json", true, "query"]] : [];
  // Tenant credentials resolve their own tenant and region; partner and organization credentials name them.
  const target: Field[] = scope === "tenant" ? [["tenantId", "string", false, "query"], ["apiHost", "string", false, "query"]] : [];
  return [...pathFields, ...extra, ...body, ...target];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

const targetNote =
  "tenantId and apiHost are only for partner or organization credentials: pass a tenant's id and its apiHost (from partner.listTenants or organization.listTenants). Tenant credentials fill both in themselves.";

function describe(description: string, fields: Field[], scope: Scope): string {
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  const note = scope === "tenant" ? `\n\n${targetNote}` : "";
  return `${description}${params.length > 0 ? `\n\nParameters:\n${params.join("\n")}` : ""}${note}`;
}

const idHeader: Record<string, string> = { tenant: "X-Tenant-ID", partner: "X-Partner-ID", organization: "X-Organization-ID" };

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const auth = { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" };
  let me: Promise<{ id: string; idType: string; apiHosts: { global: string; dataRegion?: string } }> | undefined;
  const whoami = () =>
    (me ??= fetcher(`${globalHost}/whoami/v1`, { signal, headers: auth }).then(async (response) => {
      const text = await response.text();
      if (!response.ok) throw new Error(`Sophos Central whoami answered ${response.status}: ${text.slice(0, 500)}`);
      return JSON.parse(text);
    }));

  const call = async (
    method: string,
    path: string,
    scope: Scope,
    fields: Field[],
    hasBody: boolean,
    input: Record<string, unknown>,
  ) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || name === "tenantId" || name === "apiHost" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const headers: Record<string, string> = { ...auth };
    let origin = globalHost;
    if (scope !== "global") {
      const identity = await whoami();
      if (scope === "tenant") {
        const tenantId = typeof input.tenantId === "string" ? input.tenantId : identity.idType === "tenant" ? identity.id : undefined;
        const host = typeof input.apiHost === "string" ? input.apiHost : identity.apiHosts.dataRegion;
        if (tenantId === undefined || host === undefined)
          throw new Error("These credentials are not tenant credentials: pass tenantId and apiHost of the tenant to act on.");
        if (!/^https:\/\/[a-z0-9-]+\.central\.sophos\.com\/?$/.test(host)) throw new Error("apiHost must be an https://api-<region>.central.sophos.com URL.");
        origin = host.replace(/\/$/, "");
        headers[idHeader.tenant!] = tenantId;
        // Partner and organization credentials may also call tenant APIs on behalf of the tenant.
      } else {
        if (identity.idType !== scope) throw new Error(`This tool needs ${scope} credentials; these are ${identity.idType} credentials.`);
        headers[idHeader[scope]!] = identity.id;
      }
    }
    if (hasBody) headers["Content-Type"] = "application/json";
    const url = `${origin}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers,
      body: hasBody ? JSON.stringify(input.body ?? {}) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Sophos Central answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, action, method, path, scope, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody, scope);
    const options = { description: describe(description, fields, scope), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) =>
      call(method, path, scope, fields, hasBody === true, input);
    // The alert search POST and XDR runs only read or start read-only queries, but POST is a mutation here.
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const entry = groups.get(group) ?? {};
    entry[action] = tool;
    groups.set(group, entry);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { sophos: sophos.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sophos ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Sophos Central",
        description:
          "Sophos Central: endpoints, isolation, scans, tamper protection, endpoint groups, allow/block lists and exclusions, policies, alerts, cases, SIEM feeds, XDR data lake queries, directory, admins, firewalls, licenses and partner/organization tenants.",
        instructions:
          "Call account.whoami first. Tenant credentials fill in their own tenant and region automatically. Partner or organization credentials list tenants with partner.listTenants or organization.listTenants, then pass the tenant's id as tenantId and its apiHost on every tenant tool. Lists page with page/pageSize or pageFromKey (use the response's nextKey). Array filters are comma-separated strings.",
        icons,
      },
    ),
  }),
);
