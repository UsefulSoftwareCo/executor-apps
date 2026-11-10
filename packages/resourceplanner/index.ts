import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

// The apex domain 308-redirects to www, and a cross-origin redirect drops the Authorization header.
const base = "https://www.resourceplanner.io";
const mcpUrl = `${base}/api/mcp`;

type Account = { method: "apiKey" | "mcpKey"; fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}` });

const resourceplanner = defineProvider({
  name: "Resource Planner",
  hosts: ["www.resourceplanner.io"],
  auth: {
    // Resource Planner has no OAuth; workspace REST keys are the only method.
    apiKey: secrets({
      label: "REST API access key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Separate key generated in Settings, MCP section; shown once.
    mcpKey: secrets({
      label: "MCP key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    if (check.account.method === "mcpKey") return mcpHealth(check, { url: mcpUrl, headers: headers(check.account) });
    const { account, fetch, signal } = check;
    const response = await fetch(`${base}/api/projects`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const payload = record(json());
const filters = record(json()).optional();

function list(call: Call, path: string, description: string) {
  return query({ description, input: object({ query: filters }) }, async (_ctx, input: Params) =>
    call("GET", path, (input.query as Params | undefined) ?? {}),
  );
}

function create(call: Call, path: string, description: string) {
  return mutation({ description, input: object({ body: payload }) }, async (_ctx, input: Params) =>
    call("POST", path, {}, input.body as Params),
  );
}

function update(call: Call, path: string, description: string) {
  return mutation({ description, input: object({ id: string({ minLength: 1 }), body: payload }) }, async (_ctx, input: Params) =>
    call("PUT", `${path}/${encodeURIComponent(String(input.id))}`, {}, input.body as Params),
  );
}

function remove(call: Call, path: string, description: string) {
  return mutation({ description, input: object({ id: string({ minLength: 1 }) }) }, async (_ctx, input: Params) =>
    call("DELETE", `${path}/${encodeURIComponent(String(input.id))}`),
  );
}

function build(call: Call) {
  return router({
    resources: router(
      {
        list: list(call, "/api/resources", "List all resources (people) in the workspace."),
        create: create(call, "/api/resources", "Create a resource. body: name, email, invited, capacity, hourlyExpense, workDays ([1..5]), status, membership { role, memberSettings, managerSettings, customerSettings }. Omit invited and membership to create a resource without access."),
        update: update(call, "/api/resources", "Update a resource by id. body holds the fields to change (partial updates allowed)."),
        delete: remove(call, "/api/resources", "Delete a resource by id. Also deletes its assignments."),
      },
      { title: "Resources", description: "People who can be scheduled." },
    ),
    projects: router(
      {
        list: list(call, "/api/projects", "List projects. Returns { projects: [...] }."),
        create: create(call, "/api/projects", "Create a project. body: title, color, note, projectSize (hours or null), projectRate, resourceRates [{ resourceId, rate }]."),
        update: update(call, "/api/projects", "Update a project by id. Send null or [] to clear projectSize, projectRate or resourceRates."),
        delete: remove(call, "/api/projects", "Delete a project by id. Also deletes its assignments."),
      },
      { title: "Projects", description: "Projects that resources are assigned to." },
    ),
    assignments: router(
      {
        list: list(call, "/api/assignments", "List assignments. Optional query filters: projectId, resourceId, dateFrom (or from), dateTo (or to). One date gives an open-ended range; no filters returns everything."),
        create: create(call, "/api/assignments", "Create an assignment. body requires project, resource, dateFrom, dateTo, hoursPerDay, note; optional title, description (HTML) and comments [{ body }] create or update a linked task."),
        update: update(call, "/api/assignments", "Update an assignment by id: dates, hours, note, links or task details."),
        delete: remove(call, "/api/assignments", "Delete an assignment by id."),
      },
      { title: "Assignments", description: "Scheduled hours of a resource on a project." },
    ),
    timeEntries: router(
      {
        list: list(call, "/api/time-entries", "List time entries (read-only). Query: from, to (ISO 8601, half-open window), resourceId and projectId (repeatable as arrays; projectId 'unassigned' for none), limit (1-100, default 100), offset, sort (asc|desc by start), includeSummary (true adds summary.totalSeconds)."),
      },
      { title: "Time entries", description: "Tracked time (read-only through the REST API)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { resourceplanner: resourceplanner.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.resourceplanner ?? [],
        async (account) =>
          account.method === "mcpKey"
            ? router({
                mcp: withApprovals(await mcpRouter({ url: mcpUrl, account, headers: headers(account), signal }), (tool) =>
                  toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
                ),
              })
            : withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Resource Planner",
        description: "Schedule people: resources, projects, assignments and time entries in a Resource Planner workspace. REST-key accounts get CRUD tools; MCP-key accounts get the vendor's analysis tools under mcp.",
        icons,
      },
    ),
  }),
);
