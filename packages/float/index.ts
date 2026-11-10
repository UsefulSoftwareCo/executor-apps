import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  type AppContext,
  withApprovals,
  type RouterDeclaration,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.float.com/v3";
// Float requires a User-Agent naming the app and a contact address.
const userAgent = "Executor Float integration (support@executor.sh)";

const float = defineProvider({
  name: "Float",
  hosts: ["api.float.com"],
  auth: {
    apiKey: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/accounts?per-page=1`, {
      signal,
      headers: headers(account.fields.token),
    });
    await decodeJson(response, json());
  },
});

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": userAgent,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    return target.toString();
  };
  const call = async (method: string, path: string, params?: Params, body?: unknown) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: headers(token),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    const data = await decodeJson(response, json());
    // Page-based lists report totals in headers; surface them so callers can page.
    const total = response.headers.get("X-Pagination-Total-Count");
    return total === null
      ? data
      : {
          data,
          pagination: {
            totalCount: Number(total),
            pageCount: Number(response.headers.get("X-Pagination-Page-Count")),
            currentPage: Number(response.headers.get("X-Pagination-Current-Page")),
            perPage: Number(response.headers.get("X-Pagination-Per-Page")),
          },
        };
  };
  return {
    get: (path: string, params?: Params) => call("GET", path, params),
    post: (path: string, body: unknown) => call("POST", path, undefined, body),
    patch: (path: string, body: unknown) => call("PATCH", path, undefined, body),
    del: (path: string) => call("DELETE", path),
  };
}

type Client = ReturnType<typeof client>;

const listInput = {
  page: number().optional(),
  perPage: number().optional(),
  fields: string().optional(),
  sort: string().optional(),
};
const listParams = (i: { page?: number; perPage?: number; fields?: string; sort?: string }) => ({
  page: i.page,
  "per-page": i.perPage,
  fields: i.fields,
  sort: i.sort,
});
const listHint =
  " Paginated: page starts at 1, perPage up to 200. fields is a comma-separated list; sort takes a field name, prefix with - for descending.";

type Resource = {
  key: string;
  path: string;
  noun: string;
  /** Extra list filters: tool input name -> query parameter name. */
  filters?: Record<string, string>;
  write?: "full" | "none";
  deletable?: boolean;
};

const resources: Resource[] = [
  { key: "accounts", path: "/accounts", noun: "account", write: "none" },
  { key: "departments", path: "/departments", noun: "department", write: "full", deletable: true },
  { key: "people", path: "/people", noun: "person", filters: { departmentId: "department_id", active: "active" }, write: "full", deletable: true },
  { key: "roles", path: "/roles", noun: "role", write: "full", deletable: true },
  { key: "statuses", path: "/status", noun: "status", write: "full", deletable: true },
  { key: "timeOff", path: "/timeoffs", noun: "time off entry", filters: { startDate: "start_date", endDate: "end_date" }, write: "full", deletable: true },
  { key: "timeOffTypes", path: "/timeoff-types", noun: "time off type", write: "full" },
  { key: "publicHolidays", path: "/public-holidays", noun: "public holiday", write: "none" },
  { key: "teamHolidays", path: "/holidays", noun: "team holiday", write: "full", deletable: true },
  { key: "clients", path: "/clients", noun: "client", write: "full", deletable: true },
  { key: "projects", path: "/projects", noun: "project", filters: { clientId: "client_id", active: "active" }, write: "full", deletable: true },
  { key: "phases", path: "/phases", noun: "phase", filters: { projectId: "project_id" }, write: "full", deletable: true },
  { key: "currencies", path: "/currencies", noun: "currency", write: "full", deletable: true },
  { key: "rateCards", path: "/rate-cards", noun: "rate card", write: "full", deletable: true },
  { key: "projectTemplates", path: "/project-templates", noun: "project template", write: "none" },
  { key: "projectStages", path: "/project-stages", noun: "project stage", write: "full", deletable: true },
  { key: "projectTasks", path: "/project-tasks", noun: "project task", filters: { projectId: "project_id" }, write: "full", deletable: true },
  { key: "projectExpenses", path: "/project-expenses", noun: "project expense", filters: { projectId: "project_id" }, write: "full", deletable: true },
  { key: "milestones", path: "/milestones", noun: "milestone", filters: { projectId: "project_id" }, write: "full", deletable: true },
  { key: "allocations", path: "/tasks", noun: "allocation (scheduled task)", filters: { peopleId: "people_id", projectId: "project_id", startDate: "start_date", endDate: "end_date" }, write: "full", deletable: true },
  { key: "loggedTime", path: "/logged-time", noun: "logged time entry", filters: { peopleId: "people_id", projectId: "project_id", startDate: "start_date", endDate: "end_date" }, write: "full", deletable: true },
];

const filterInput = (filters: Record<string, string> = {}) =>
  Object.fromEntries(Object.keys(filters).map((name) => [name, string().optional()]));

function resourceRouter(c: Client, r: Resource): RouterDeclaration<AppContext, AppContext> {
  const filters = r.filters ?? {};
  const tools: Record<string, any> = {
    list: query(
      {
        description: `List ${r.noun}s.${Object.keys(filters).length ? ` Filters: ${Object.keys(filters).join(", ")} (date filters are YYYY-MM-DD).` : ""}${listHint}`,
        input: object({ ...listInput, ...filterInput(r.filters) }),
      },
      async (_ctx, input) => {
        const extra = Object.fromEntries(
          Object.entries(filters).map(([name, param]) => [param, (input as Params)[name]]),
        );
        return c.get(r.path, { ...listParams(input), ...extra });
      },
    ),
    get: query(
      {
        description: `Get one ${r.noun} by id.`,
        input: object({ id: string({ minLength: 1 }), fields: string().optional() }),
      },
      async (_ctx, { id, fields }) => c.get(`${r.path}/${encodeURIComponent(id)}`, { fields }),
    ),
  };
  if (r.write === "full") {
    tools.create = mutation(
      {
        description: `Create a ${r.noun}. body holds the fields documented at https://developer.float.com for this resource.`,
        input: object({ body: record(json()) }),
      },
      async (_ctx, { body }) => c.post(r.path, body),
    );
    tools.update = mutation(
      {
        description: `Update a ${r.noun} by id. body holds only the fields to change.`,
        input: object({ id: string({ minLength: 1 }), body: record(json()) }),
      },
      async (_ctx, { id, body }) => c.patch(`${r.path}/${encodeURIComponent(id)}`, body),
    );
  }
  if (r.deletable) {
    tools.delete = mutation(
      {
        description: `Delete a ${r.noun} by id.`,
        input: object({ id: string({ minLength: 1 }) }),
      },
      async (_ctx, { id }) => c.del(`${r.path}/${encodeURIComponent(id)}`),
    );
  }
  return router(tools);
}

function reports(c: Client) {
  const dates = {
    startDate: string({ minLength: 10 }),
    endDate: string({ minLength: 10 }),
  };
  const description = (what: string) =>
    `${what} Dates are YYYY-MM-DD. Not paginated. Reports endpoints are limited to 30 requests per minute.`;
  return router({
    people: query(
      {
        description: description("Utilization and scheduled/logged hours per person. Optionally filter to one person."),
        input: object({ ...dates, peopleId: string().optional() }),
      },
      async (_ctx, i) =>
        c.get("/reports/people", { start_date: i.startDate, end_date: i.endDate, people_id: i.peopleId }),
    ),
    projects: query(
      {
        description: description("Scheduled/logged hours and budget per project. Optionally filter to one project."),
        input: object({ ...dates, projectId: string().optional() }),
      },
      async (_ctx, i) =>
        c.get("/reports/projects", { start_date: i.startDate, end_date: i.endDate, project_id: i.projectId }),
    ),
  });
}

function deleted(c: Client) {
  const input = object({
    cursor: string().optional(),
    limit: number().optional(),
  });
  const run = (path: string) => async (_ctx: unknown, i: { cursor?: string; limit?: number }) =>
    c.get(path, { cursor: i.cursor, limit: i.limit });
  const description = (what: string) =>
    `List deleted ${what} for sync. Cursor-paginated: pass the X-Pagination-Next-Cursor value as cursor; limit up to 500.`;
  return router({
    allocations: query({ description: description("allocations"), input }, run("/deleted/tasks")),
    timeOff: query({ description: description("time off entries"), input }, run("/deleted/timeoffs")),
    loggedTime: query({ description: description("logged time entries"), input }, run("/deleted/logged-time")),
  });
}

export default defineApp(
  { user: { accounts: { float: float.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.float ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return withApprovals(
            router({
              ...Object.fromEntries(resources.map((r) => [r.key, resourceRouter(c, r)])),
              projectsFromTemplate: router({
                create: mutation(
                  {
                    description:
                      "Create a project from a project template (asynchronous). body overrides template project fields and must include project_code; poll projects.list with the same project_code until it appears, because validation errors are not reported.",
                    input: object({ templateId: string({ minLength: 1 }), body: record(json()) }),
                  },
                  async (_ctx, { templateId, body }) =>
                    c.post(`/projects/from-template/${encodeURIComponent(templateId)}`, body),
                ),
              }),
              reports: reports(c),
              deleted: deleted(c),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Float",
        description:
          "Float resource planning: people, projects, allocations, time off, logged time, clients, phases, milestones and reports.",
        icons,
      },
    ),
  }),
);
