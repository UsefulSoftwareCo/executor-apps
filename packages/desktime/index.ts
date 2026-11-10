import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://desktime.com/api/v2/json";

const desktime = defineProvider({
  name: "DeskTime",
  hosts: ["desktime.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /ping is unauthenticated, so /company is used to check the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/company`, { signal, headers: { "X-API-Key": account.fields.token } });
    // Response fields are not guaranteed by public docs, so only a 2xx plus valid JSON is required;
    // the company name is used for the label when present.
    const body = await decodeJson(response, json());
    const name = typeof body === "object" && body !== null && "name" in body && typeof body.name === "string" && body.name ? body.name : "DeskTime";
    return { accountInfo: { externalId: name, displayName: name } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, params: Params = {}) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") url.searchParams.set(key, value);
    const response = await fetcher(url.toString(), {
      method: path === "create-project" ? "POST" : "GET",
      signal,
      headers: { "X-API-Key": token },
    });
    return decodeJson(response, json());
  };
}

const employeeInput = object({
  id: string().optional(),
  date: string().optional(),
});
const employeeNote =
  " id is the employee ID (omit for the user who owns the API key); date is Y-m-d (omit for today). Times are in seconds.";

function build(call: ReturnType<typeof client>) {
  const employee = (path: string) => async (_ctx: unknown, input: { id?: string; date?: string }) =>
    call(path, { id: input.id, date: input.date });
  return router({
    ping: query({ description: "Check that the DeskTime API server is responding.", input: object({}) }, async () => call("ping")),
    company: query(
      {
        description: "Company account details: name, work hours, working days, tracking window and timezone.",
        input: object({}),
      },
      async () => call("company"),
    ),
    employees: query(
      {
        description:
          "Tracking data for every employee, grouped by date then employee ID: group, arrival and departure, online, offline, at-work and productive time. date is Y-m-d (omit for today); period is day, week or month (default day), starting at date. Times are in seconds.",
        input: object({ date: string().optional(), period: string().optional() }),
      },
      async (_ctx, { date, period }) => call("employees", { date, period }),
    ),
    employee: router(
      {
        get: query(
          { description: "One employee's tracking data with tracked projects and apps." + employeeNote, input: employeeInput },
          employee("employee"),
        ),
        basic: query(
          { description: "One employee's tracking summary without project or app breakdowns." + employeeNote, input: employeeInput },
          employee("employee/basic"),
        ),
        projects: query(
          { description: "One employee's tracking data with tracked projects." + employeeNote, input: employeeInput },
          employee("employee/projects"),
        ),
        apps: query(
          { description: "One employee's tracking data with tracked apps." + employeeNote, input: employeeInput },
          employee("employee/apps"),
        ),
      },
      { title: "Employees", description: "Daily tracking data for a single employee." },
    ),
    projects: router(
      {
        list: query(
          { description: "Active (non-archived) projects with their tasks.", input: object({}) },
          async () => call("projects"),
        ),
        create: mutation(
          {
            description: "Create a project, optionally with a first task. Returns the new project and its tasks.",
            input: object({ project: string({ minLength: 1 }), task: string().optional() }),
          },
          async (_ctx, { project, task }) => call("create-project", { project, task }),
        ),
        start: mutation(
          {
            description:
              "Start tracking time on a project (and optionally a task) for the user who owns the API key. Projects and tasks are matched by name.",
            input: object({ project: string({ minLength: 1 }), task: string().optional() }),
          },
          async (_ctx, { project, task }) => call("start-project", { project, task }),
        ),
        stop: mutation(
          {
            description:
              "Stop tracking time on a project (and optionally a task) for the user who owns the API key. Projects and tasks are matched by name.",
            input: object({ project: string({ minLength: 1 }), task: string().optional() }),
          },
          async (_ctx, { project, task }) => call("stop-project", { project, task }),
        ),
      },
      { title: "Projects", description: "Projects, tasks and project timers." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { desktime: desktime.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.desktime ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "DeskTime",
        description: "DeskTime automatic time tracking: company settings, employees, daily tracking data, projects and tasks, and project timers.",
        icons,
      },
    ),
  }),
);
