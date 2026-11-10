import {
  accountRouter,
  array,
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

// Each Falcon cloud has its own API origin. Credentials only ever go to one of these.
const clouds = [
  "api.crowdstrike.com",
  "api.us-2.crowdstrike.com",
  "api.eu-1.crowdstrike.com",
  "api.laggar.gcw.crowdstrike.com",
  "api.us-gov-2.crowdstrike.mil",
] as const;

function normalizeHost(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  if (!(clouds as readonly string[]).includes(host))
    throw new Error(`Enter your Falcon API host, one of: ${clouds.join(", ")}.`);
  return host;
}

type Account = { fields: { baseUrl: string; clientId: string; clientSecret: string } };

const originOf = (account: Account) => `https://${normalizeHost(account.fields.baseUrl)}`;

const TokenResponse = object({ access_token: string() });

// An API client signs in with its client id and secret (form body) and receives a bearer token valid for 30 minutes.
async function mintToken(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  const response = await fetcher(`${originOf(account)}/oauth2/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: account.fields.clientId,
      client_secret: account.fields.clientSecret,
    }).toString(),
  });
  const parsed = await decodeJson(response, TokenResponse);
  return parsed.access_token;
}

const crowdstrike = defineProvider({
  name: "CrowdStrike",
  hosts: [...clouds],
  auth: {
    // Falcon console > Support and resources > API clients and keys. The client credentials grant is the only
    // way to call the Falcon API; the client's scopes decide which tools work.
    apiClient: secrets({
      label: "API client",
      fields: object({
        baseUrl: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = normalizeHost(account.fields.baseUrl);
    await mintToken(account as unknown as Account, fetch, signal);
    return {
      accountInfo: {
        externalId: `${host}:${account.fields.clientId}`,
        displayName: `${host} (${account.fields.clientId})`,
      },
    };
  },
});

type Type = "string" | "number" | "strings" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const ids = (name = "ids"): Field => [name, "strings", true, "query"];

const page: Field[] = [s("filter"), n("limit"), n("offset"), s("sort")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  options?: { body?: boolean; readOnly?: boolean },
];

const fql =
  "filter takes a Falcon Query Language expression such as platform_name:'Windows'+status:'normal'; limit and offset page the results; sort is field.asc or field.desc.";
const body = { body: true };
const read = { body: true, readOnly: true };

const rows: Row[] = [
  // Hosts
  ["hosts", "queryIds", "GET", "/devices/queries/devices/v1", `Search for host IDs (agent IDs). Returns IDs only; pass them to hosts.get. ${fql}`, page],
  ["hosts", "queryIdsScroll", "GET", "/devices/queries/devices-scroll/v1", "Search for host IDs with a scroll cursor, for walking more than 10,000 hosts. Pass the returned meta.pagination.offset as offset on the next call.", [s("filter"), n("limit"), s("offset"), s("sort")]],
  ["hosts", "queryHiddenIds", "GET", "/devices/queries/devices-hidden/v1", `Search for IDs of hidden hosts. ${fql}`, page],
  ["hosts", "get", "GET", "/devices/entities/devices/v2", "Get host details (hostname, platform, OS, IPs, containment status, tags, policies) for host IDs from hosts.queryIds.", [ids()]],
  ["hosts", "loginHistory", "POST", "/devices/combined/devices/login-history/v1", "Recent logins for host IDs. body is {\"ids\": [...]}.", [], read],
  ["hosts", "performAction", "POST", "/devices/entities/devices-actions/v2", "Act on hosts: action_name is contain (network containment), lift_containment, hide_host or unhide_host. body is {\"ids\": [...]}.", [["action_name", "string", true, "query"]], body],
  ["hosts", "updateTags", "PATCH", "/devices/entities/devices/tags/v1", "Add or remove Falcon grouping tags on hosts. body is {\"action\": \"add\" | \"remove\", \"device_ids\": [...], \"tags\": [\"FalconGroupingTags/example\"]}.", [], body],

  // Host groups
  ["hostGroups", "queryIds", "GET", "/devices/queries/host-groups/v1", `Search for host group IDs. ${fql}`, page],
  ["hostGroups", "get", "GET", "/devices/entities/host-groups/v1", "Get host groups by ID.", [ids()]],
  ["hostGroups", "queryMemberIds", "GET", "/devices/queries/host-group-members/v1", `Search for the host IDs in a group; set id to the group ID. ${fql}`, [s("id"), ...page]],
  ["hostGroups", "create", "POST", "/devices/entities/host-groups/v1", "Create host groups. body is {\"resources\": [{\"name\", \"group_type\": \"static\" | \"dynamic\", \"description\", \"assignment_rule\"}]}.", [], body],
  ["hostGroups", "update", "PATCH", "/devices/entities/host-groups/v1", "Update host groups. body is {\"resources\": [{\"id\", \"name\", \"description\", \"assignment_rule\"}]}.", [], body],
  ["hostGroups", "delete", "DELETE", "/devices/entities/host-groups/v1", "Delete host groups by ID.", [ids()]],
  ["hostGroups", "performAction", "POST", "/devices/entities/host-group-actions/v1", "Add or remove hosts of a static group: action_name is add-hosts or remove-hosts. body is {\"action_parameters\": [{\"name\": \"filter\", \"value\": \"(device_id:['id'])\"}], \"ids\": [\"<group id>\"]}.", [["action_name", "string", true, "query"]], body],

  // Alerts (the current detection model)
  ["alerts", "queryIds", "GET", "/alerts/queries/alerts/v2", `Search for alert composite IDs. ${fql}`, [...page, s("q")]],
  ["alerts", "get", "POST", "/alerts/entities/alerts/v2", "Get alerts by composite ID. body is {\"composite_ids\": [...]}.", [], read],
  ["alerts", "update", "PATCH", "/alerts/entities/alerts/v3", "Update alerts: assign, set status, add comments or tags. body is {\"composite_ids\": [...], \"action_parameters\": [{\"name\": \"update_status\", \"value\": \"in_progress\"}]}. Other action names: assign_to_name, assign_to_uuid, add_tag, remove_tag, append_comment, unassign.", [], body],

  // Detections (legacy detect model)
  ["detections", "queryIds", "GET", "/detects/queries/detects/v1", `Search for detection IDs (legacy detections API; alerts is the current one). ${fql}`, [...page, s("q")]],
  ["detections", "get", "POST", "/detects/entities/summaries/GET/v1", "Get detection summaries by ID. body is {\"ids\": [...]}.", [], read],
  ["detections", "update", "PATCH", "/detects/entities/detects/v2", "Update detections. body is {\"ids\": [...], \"status\": \"new\" | \"in_progress\" | \"true_positive\" | \"false_positive\" | \"ignored\" | \"closed\" | \"reopened\", \"assigned_to_uuid\", \"comment\", \"show_in_ui\"}.", [], body],

  // Incidents
  ["incidents", "queryIds", "GET", "/incidents/queries/incidents/v1", `Search for incident IDs. ${fql}`, page],
  ["incidents", "get", "POST", "/incidents/entities/incidents/GET/v1", "Get incidents by ID. body is {\"ids\": [...]}.", [], read],
  ["incidents", "queryBehaviorIds", "GET", "/incidents/queries/behaviors/v1", `Search for behavior IDs. ${fql}`, page],
  ["incidents", "getBehaviors", "POST", "/incidents/entities/behaviors/GET/v1", "Get behaviors by ID. body is {\"ids\": [...]}.", [], read],
  ["incidents", "performAction", "POST", "/incidents/entities/incident-actions/v1", "Act on incidents: set status, assign, add tags or comments. body is {\"ids\": [...], \"action_parameters\": [{\"name\": \"update_status\", \"value\": \"20\"}]}. Optional query parameter update_detects also updates the incident's detections.", [["update_detects", "string", false, "query"], ["overwrite_detects", "string", false, "query"]], body],

  // Custom IOCs
  ["iocs", "queryIds", "GET", "/iocs/queries/indicators/v1", `Search for custom indicator IDs. ${fql}`, [...page, s("after")]],
  ["iocs", "get", "GET", "/iocs/entities/indicators/v1", "Get custom indicators by ID.", [ids()]],
  ["iocs", "create", "POST", "/iocs/entities/indicators/v1", "Create custom indicators. body is {\"indicators\": [{\"type\": \"sha256\" | \"md5\" | \"domain\" | \"ipv4\" | \"ipv6\", \"value\", \"action\": \"detect\" | \"prevent\" | \"allow\" | \"no_action\", \"severity\", \"platforms\": [\"windows\"], \"applied_globally\": true, \"description\", \"expiration\"}], \"comment\": \"\"}.", [], body],
  ["iocs", "update", "PATCH", "/iocs/entities/indicators/v1", "Update custom indicators. body is {\"indicators\": [{\"id\", ...fields}], \"bulk_update\": {...}, \"comment\": \"\"}.", [], body],
  ["iocs", "delete", "DELETE", "/iocs/entities/indicators/v1", "Delete custom indicators by ID (ids) or by FQL filter (filter).", [["ids", "strings", false, "query"], s("filter"), s("comment")]],
  ["iocs", "queryActionIds", "GET", "/iocs/queries/actions/v1", `Search for IOC action IDs. ${fql}`, page],

  // Threat intelligence (Falcon Intelligence subscription)
  ["intel", "queryActorIds", "GET", "/intel/queries/actors/v1", `Search for adversary actor IDs. ${fql} q does a free-text search.`, [...page, s("q")]],
  ["intel", "getActors", "GET", "/intel/entities/actors/v1", "Get adversary actor profiles by ID. fields selects extra detail such as __full__.", [ids(), s("fields")]],
  ["intel", "queryIndicatorIds", "GET", "/intel/queries/indicators/v1", `Search for intelligence indicator IDs. ${fql} q does a free-text search; include_deleted includes withdrawn indicators.`, [...page, s("q"), s("include_deleted")]],
  ["intel", "getIndicators", "POST", "/intel/entities/indicators/GET/v1", "Get intelligence indicators by ID. body is {\"ids\": [...]}.", [], read],
  ["intel", "queryReportIds", "GET", "/intel/queries/reports/v1", `Search for intelligence report IDs. ${fql} q does a free-text search.`, [...page, s("q")]],
  ["intel", "getReports", "GET", "/intel/entities/reports/v1", "Get intelligence reports by ID. fields selects extra detail such as __full__.", [ids(), s("fields")]],
  ["intel", "queryRuleIds", "GET", "/intel/queries/rules/v1", `Search for intelligence rule IDs (YARA, Snort). type is required, for example snort-suricata-master. ${fql}`, [s("type", true), ...page, s("q")]],

  // Spotlight vulnerabilities
  ["vulnerabilities", "queryIds", "GET", "/spotlight/queries/vulnerabilities/v1", "Search for vulnerability IDs. filter is required and takes FQL, for example status:'open'+cve.severity:'CRITICAL'. limit (max 5000) and after page the results with the returned cursor.", [s("filter", true), n("limit"), s("after"), s("sort")]],
  ["vulnerabilities", "get", "GET", "/spotlight/entities/vulnerabilities/v2", "Get vulnerabilities by ID, with CVE details, host info and remediation. Use vulnerabilities.queryIds for the IDs.", [ids()]],
  ["vulnerabilities", "getRemediations", "GET", "/spotlight/entities/remediations/v2", "Get remediation details by remediation ID.", [ids()]],

  // Discover (assets)
  ["discover", "queryHostIds", "GET", "/discover/queries/hosts/v1", `Search for discovered asset IDs, including unmanaged hosts. ${fql}`, page],
  ["discover", "getHosts", "GET", "/discover/entities/hosts/v1", "Get discovered assets by ID.", [ids()]],
  ["discover", "queryApplicationIds", "GET", "/discover/queries/applications/v1", `Search for application IDs. ${fql}`, page],
  ["discover", "getApplications", "GET", "/discover/entities/applications/v1", "Get applications by ID.", [ids()]],
  ["discover", "queryAccountIds", "GET", "/discover/queries/accounts/v1", `Search for account IDs seen on assets. ${fql}`, page],
  ["discover", "getAccounts", "GET", "/discover/entities/accounts/v1", "Get accounts by ID.", [ids()]],
  ["discover", "queryLoginIds", "GET", "/discover/queries/logins/v1", `Search for login event IDs. ${fql}`, page],
  ["discover", "getLogins", "GET", "/discover/entities/logins/v1", "Get login events by ID.", [ids()]],

  // Zero Trust Assessment
  ["zeroTrust", "getAssessments", "GET", "/zero-trust-assessment/entities/assessments/v1", "Get Zero Trust Assessment scores for host (agent) IDs.", [ids()]],

  // Prevention, sensor update, response policies
  ["policies", "queryPreventionIds", "GET", "/policy/queries/prevention/v1", `Search for prevention policy IDs. ${fql}`, page],
  ["policies", "getPrevention", "GET", "/policy/entities/prevention/v1", "Get prevention policies by ID.", [ids()]],
  ["policies", "queryPreventionMemberIds", "GET", "/policy/queries/prevention-members/v1", `Search for host IDs in a prevention policy; set id to the policy ID. ${fql}`, [s("id"), ...page]],
  ["policies", "performPreventionAction", "POST", "/policy/entities/prevention-actions/v1", "Act on a prevention policy: action_name is add-host-group, remove-host-group, enable or disable. body is {\"action_parameters\": [{\"name\": \"group_id\", \"value\": \"...\"}], \"ids\": [\"<policy id>\"]}.", [["action_name", "string", true, "query"]], body],
  ["policies", "querySensorUpdateIds", "GET", "/policy/queries/sensor-update/v1", `Search for sensor update policy IDs. ${fql}`, page],
  ["policies", "getSensorUpdate", "GET", "/policy/entities/sensor-update/v2", "Get sensor update policies by ID.", [ids()]],
  ["policies", "queryResponseIds", "GET", "/policy/queries/response/v1", `Search for response policy IDs. ${fql}`, page],
  ["policies", "getResponse", "GET", "/policy/entities/response/v1", "Get response policies by ID.", [ids()]],

  // Sensor installers
  ["sensors", "listInstallers", "GET", "/sensors/combined/installers/v2", `List sensor installers with versions, platforms and SHA256s. ${fql}`, page],
  ["sensors", "getCustomerId", "GET", "/sensors/queries/installers/ccid/v1", "Get the customer ID checksum (CCID) used when installing sensors.", []],

  // Quarantine
  ["quarantine", "queryFileIds", "GET", "/quarantine/queries/quarantined-files/v1", `Search for quarantined file IDs. ${fql}`, [...page, s("q")]],
  ["quarantine", "getFiles", "POST", "/quarantine/entities/quarantined-files/GET/v1", "Get quarantined file metadata by ID. body is {\"ids\": [...]}.", [], read],
  ["quarantine", "updateFiles", "PATCH", "/quarantine/entities/quarantined-files/v1", "Release, unrelease or delete quarantined files. body is {\"action\": \"release\" | \"unrelease\" | \"delete\", \"comment\", \"ids\": [...]} (or a filter/q instead of ids).", [], body],

  // Real Time Response
  ["rtr", "initSession", "POST", "/real-time-response/entities/sessions/v1", "Open a Real Time Response session on a host. body is {\"device_id\": \"<host id>\", \"origin\": \"\", \"queue_offline\": false}. Returns resources[].session_id.", [], body],
  ["rtr", "deleteSession", "DELETE", "/real-time-response/entities/sessions/v1", "Close a Real Time Response session.", [s("session_id", true)]],
  ["rtr", "runCommand", "POST", "/real-time-response/entities/command/v1", "Run a read-only RTR command (ls, cat, ps, netstat, ipconfig, getsid, ...). body is {\"base_command\": \"ls\", \"command_string\": \"ls C:\\\\\", \"session_id\", \"device_id\"}. Returns a cloud_request_id; poll rtr.checkCommand.", [], body],
  ["rtr", "checkCommand", "GET", "/real-time-response/entities/command/v1", "Get the output of a read-only RTR command. sequence_id starts at 0; request the next one while complete is false.", [s("cloud_request_id", true), n("sequence_id")]],
  ["rtr", "runActiveResponderCommand", "POST", "/real-time-response/entities/active-responder-command/v1", "Run an active-responder RTR command (cp, kill, mkdir, mv, reg query/set, restart, rm, ...). Same body as rtr.runCommand. Poll rtr.checkActiveResponderCommand.", [], body],
  ["rtr", "checkActiveResponderCommand", "GET", "/real-time-response/entities/active-responder-command/v1", "Get the output of an active-responder RTR command.", [s("cloud_request_id", true), n("sequence_id")]],
  ["rtr", "runAdminCommand", "POST", "/real-time-response/entities/admin-command/v1", "Run a Real Time Response administrator command (put, get, run, runscript, put-and-run, ...). Same body as rtr.runCommand. Poll rtr.checkAdminCommand.", [], body],
  ["rtr", "checkAdminCommand", "GET", "/real-time-response/entities/admin-command/v1", "Get the output of an administrator RTR command.", [s("cloud_request_id", true), n("sequence_id")]],
  ["rtr", "listSessions", "POST", "/real-time-response/entities/sessions/GET/v1", "Get RTR session metadata by session ID. body is {\"ids\": [...]}.", [], read],
  ["rtr", "listScripts", "GET", "/real-time-response/queries/scripts/v1", `Search for RTR script IDs (scripts uploaded by your organization). ${fql}`, page],

  // Users and roles
  ["users", "queryIds", "GET", "/user-management/queries/users/v1", `Search for user UUIDs. ${fql}`, page],
  ["users", "get", "POST", "/user-management/entities/users/GET/v1", "Get users by UUID. body is {\"ids\": [...]}.", [], read],
  ["users", "queryRoleIds", "GET", "/user-management/queries/roles/v1", "Search for role IDs, optionally for one user (user_uuid) or customer ID (cid).", [s("user_uuid"), s("cid"), s("action"), s("direct_only")]],
  ["users", "getRoles", "GET", "/user-management/entities/roles/v1", "Get roles by ID.", [ids()]],
  ["users", "listUserRoles", "GET", "/user-management/combined/user-roles/v1", "List the roles granted to a user: user_uuid is required.", [s("user_uuid", true), s("filter"), n("limit"), n("offset"), s("sort")]],

  // Identity Protection
  ["identityProtection", "graphql", "POST", "/identity-protection/combined/graphql/v1", "Run a GraphQL query or mutation against Falcon Identity Protection (entities, risk scores, incidents, sensors). body is {\"query\": \"{ entities(first: 5) { nodes { entityId primaryDisplayName } } }\", \"variables\": {}}. Always sent as a write because a document can contain a mutation.", [], body],
];

function fieldsOf(path: string, extra: Field[], options: Row[6]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .filter((name) => !extra.some(([known]) => known === name))
    .map((name) => [name, "string", true, "path"]);
  const bodyField: Field[] = options?.body === true ? [["body", "json", true, "query"]] : [];
  return [...pathFields, ...extra, ...bodyField];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "json" ? json() : type === "strings" ? array(string()) : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type === "strings" ? "string[]" : type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}


function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  let token: Promise<string> | undefined;
  const bearer = () => (token ??= mintToken(account, fetcher, signal));

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, type, , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (type === "strings") for (const item of value as unknown[]) params.append(name, String(item));
      else params.set(name, String(value));
    }
    const hasBody = input.body !== undefined && input.body !== null;
    const url = `${originOf(account)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`CrowdStrike answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, rawAction, method, path, description, extra, options] of rows) {
    const action = rawAction;
    const fields = fieldsOf(path, extra, options);
    const input = schemaFor(fields);
    const spec = { description: describe(description, fields), input };
    const handler = async (_ctx: unknown, value: Record<string, unknown>) => call(method, path, fields, value);
    const isRead = method === "GET" || options?.readOnly === true;
    const tool = isRead ? query(spec, handler as never) : mutation(spec, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }

  // Escape hatch for the many other Falcon endpoints (the API has well over 1,000 operations).
  const requestSpec = {
    description:
      "Call any Falcon API endpoint by path, for operations without their own tool. path starts with / (for example /cloud-security-assets/queries/resources/v1); query takes the query-string parameters (arrays repeat the key); body is sent as JSON. Non-GET methods are writes and need approval.",
    input: object({
      method: string(),
      path: string({ minLength: 1 }),
      query: json().optional(),
      body: json().optional(),
    }),
  };
  const raw = mutation(requestSpec, (async (_ctx: unknown, value: { method: string; path: string; query?: unknown; body?: unknown }) => {
    const method = value.method.toUpperCase();
    if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) throw new Error("method must be GET, POST, PATCH, PUT or DELETE.");
    if (!value.path.startsWith("/") || value.path.startsWith("//") || value.path.includes("://"))
      throw new Error("path must start with a single / and contain no host.");
    const params = new URLSearchParams();
    if (typeof value.query === "object" && value.query !== null) {
      for (const [key, item] of Object.entries(value.query as Record<string, unknown>)) {
        if (item === undefined || item === null) continue;
        if (Array.isArray(item)) for (const entry of item) params.append(key, String(entry));
        else params.set(key, String(item));
      }
    }
    const hasBody = value.body !== undefined && value.body !== null;
    const response = await fetcher(`${originOf(account)}${value.path}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(value.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`CrowdStrike answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  }) as never);

  return router({
    ...Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])),
    request: raw,
  } as never);
}

export default defineApp(
  { user: { accounts: { crowdstrike: crowdstrike.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.crowdstrike ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CrowdStrike",
        description:
          "CrowdStrike Falcon: hosts and host groups, alerts, detections, incidents, custom IOCs, threat intelligence, Spotlight vulnerabilities, Discover assets, policies, quarantine, Real Time Response, users and Identity Protection.",
        instructions:
          "Falcon APIs are two-step: a query tool returns IDs (filter with FQL, page with limit and offset), then a get tool returns details for up to a few hundred IDs. Tools take what the API client's scopes allow; a 403 names the missing scope. Write tools take body exactly as the Falcon API documents. Use request for endpoints without a dedicated tool.",
        icons,
      },
    ),
  }),
);
