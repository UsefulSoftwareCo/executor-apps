import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.hibob.com/mcp/public";

const api = "https://api.hibob.com/v1";

type OAuthFields = { access_token: string };
type ServiceFields = { serviceUserId: string; token: string };

const headers = (fields: OAuthFields) => ({ Authorization: `Bearer ${fields.access_token}` });
const basic = (fields: ServiceFields) => ({
  Authorization: `Basic ${btoa(`${fields.serviceUserId}:${fields.token}`)}`,
});

const hibob = defineProvider({
  name: "HiBob",
  hosts: ["mcp.hibob.com", "api.hibob.com"],
  auth: {
    // Bob > Settings > Integrations > Service users: create a service user, grant it permissions, copy its ID and token.
    serviceUser: secrets({
      label: "Service user ID and token",
      fields: object({ serviceUserId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
    // The Bob MCP server publishes RFC 8414 metadata and supports dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    if (check.account.method === "oauth") {
      return mcpHealth(check as never, { url, headers: headers(check.account.fields as OAuthFields) });
    }
    const fields = check.account.fields as ServiceFields;
    const response = await check.fetch(`${api}/company/named-lists`, {
      signal: check.signal,
      headers: { ...basic(fields), Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: fields.serviceUserId, displayName: `Service user ${fields.serviceUserId}` } };
  },
});

type Params = Record<string, unknown>;
type Op = { name: string; group: string; method: "GET" | "POST" | "PUT" | "DELETE"; path: string; description: string; write?: boolean };

const ops: Op[] = [
  { group: "people", name: "search", method: "POST", path: "/people/search", write: false, description: "Search employees. Body: fields (array of field paths, e.g. root.id, root.fullName, work.department), filters (array of {fieldPath, operator, values}), showInactive (boolean)." },
  { group: "people", name: "read", method: "POST", path: "/people/{identifier}", write: false, description: "Read fields of one employee by ID or email. Body: fields (array of field paths), humanReadable (APPEND or REPLACE)." },
  { group: "people", name: "update", method: "PUT", path: "/people/{identifier}", description: "Update fields of one employee. Body contains only the fields to change (nested like work.title)." },
  { group: "people", name: "create", method: "POST", path: "/people", description: "Create an employee. Body requires email, firstName, surname and work (site, startDate)." },
  { group: "people", name: "listProfiles", method: "GET", path: "/profiles", description: "Read the public profile section of all active employees." },
  { group: "people", name: "listFields", method: "GET", path: "/company/people/fields", description: "List all employee field definitions (metadata)." },
  { group: "company", name: "listNamedLists", method: "GET", path: "/company/named-lists", description: "List all company lists (departments, sites, etc.)." },
  { group: "company", name: "getNamedList", method: "GET", path: "/company/named-lists/{listName}", description: "Get one company list by name." },
  { group: "timeOff", name: "whosOut", method: "GET", path: "/timeoff/whosout", description: "Who is out in a date range. Query: from, to (yyyy-MM-dd), includeHourly, includePrivate." },
  { group: "timeOff", name: "outToday", method: "GET", path: "/timeoff/outtoday", description: "Who is out today or on the date in query.date." },
  { group: "timeOff", name: "listRequestChanges", method: "GET", path: "/timeoff/requests/changes", description: "Time off request changes. Query: since (ISO datetime, required), to, employeeId." },
  { group: "timeOff", name: "getRequest", method: "GET", path: "/timeoff/employees/{employeeId}/requests/{requestId}", description: "Get one time off request." },
  { group: "timeOff", name: "getBalance", method: "GET", path: "/timeoff/employees/{employeeId}/balance", description: "Time off balance of an employee. Query: policyType (required), date." },
  { group: "timeOff", name: "listPolicyTypes", method: "GET", path: "/timeoff/policy-types", description: "List all time off policy type names." },
  { group: "timeOff", name: "createRequest", method: "POST", path: "/timeoff/employees/{employeeId}/requests", description: "Submit a time off request. Body: policyType, requestRangeType (days, hours, ...), startDate, endDate, etc." },
  { group: "timeOff", name: "cancelRequest", method: "DELETE", path: "/timeoff/employees/{employeeId}/requests/{requestId}", description: "Cancel a time off request." },
  { group: "tasks", name: "listOpen", method: "GET", path: "/tasks", description: "Read all open tasks (max 5,000)." },
  { group: "tasks", name: "listForEmployee", method: "GET", path: "/tasks/people/{employeeId}", description: "Read tasks of one employee." },
  { group: "tasks", name: "complete", method: "POST", path: "/tasks/{taskId}/complete", description: "Mark a task as complete." },
  { group: "reports", name: "list", method: "GET", path: "/company/reports", description: "List company reports visible to the service user." },
  { group: "reports", name: "download", method: "GET", path: "/company/reports/{reportId}/download", description: "Download a report by ID. Query: format (csv or json), includeInfo, humanReadable." },
];

const pathParams = (path: string) => [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]!);

function restTools(fields: ServiceFields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const groups: Record<string, Record<string, ReturnType<typeof query>>> = {};
  for (const op of ops) {
    const ids = pathParams(op.path);
    const hasBody = op.method !== "GET" && op.method !== "DELETE";
    const input = object({
      ...Object.fromEntries(ids.map((id) => [id, string()])),
      query: record(json()).optional(),
      ...(hasBody ? { body: record(json()).optional() } : {}),
    });
    const run = async (_ctx: unknown, args: Params) => {
      let path = op.path;
      for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
      const url = new URL(`${api}${path}`);
      for (const [k, v] of Object.entries((args.query as Params | undefined) ?? {})) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
      const response = await fetcher(url.toString(), {
        method: op.method,
        signal,
        headers: { ...basic(fields), Accept: "application/json", ...(hasBody ? { "Content-Type": "application/json" } : {}) },
        ...(hasBody ? { body: JSON.stringify((args.body as Params | undefined) ?? {}) } : {}),
      });
      if (response.status === 204) return { ok: true };
      return decodeJson(response, json());
    };
    const readOnly = op.write === false || op.method === "GET";
    (groups[op.group] ??= {})[op.name] = (readOnly
      ? query({ description: op.description, input }, run)
      : mutation({ description: op.description, input }, run)) as never;
  }
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}


export default defineApp(
  { user: { accounts: { hibob: hibob.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hibob ?? [],
        async (account) => {
          if (account.method === "serviceUser") {
            return withApprovals(restTools(account.fields as ServiceFields, fetch, signal), (t) =>
              t.kind === "mutation" ? always() : undefined,
            );
          }
          return withApprovals(
            await mcpRouter({ url, account, headers: headers(account.fields as OAuthFields), signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "HiBob",
        description: "Employees, time off, tasks and reports in HiBob (Bob), via OAuth (MCP) or a service user (REST).",
        icons,
      },
    ),
  }),
);
