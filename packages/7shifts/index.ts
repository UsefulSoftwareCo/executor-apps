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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.7shifts.com";
// Pinned to the current published version so behavior does not drift with the token's default (7shifts recommends sending it explicitly).
const apiVersion = "2026-01-01";

const sevenshifts = defineProvider({
  name: "7shifts",
  hosts: ["api.7shifts.com"],
  auth: {
    // 7shifts OAuth clients are issued only to vetted partners, so the access token is the one user-completable method.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/whoami`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "x-api-version": apiVersion },
    });
    await decodeJson(response, object({ data: object({ identity_id: number() }) }));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-version": apiVersion,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  // Most paths are scoped to a company. When the caller omits companyId, use the token's only company.
  let cached: number | undefined;
  const companyId = async (given: number | undefined): Promise<number> => {
    if (given !== undefined) return given;
    if (cached !== undefined) return cached;
    const who = (await call("GET", "/v2/whoami")) as { data?: { users?: { company_id?: number }[] } };
    const ids = [...new Set((who.data?.users ?? []).map((user) => user.company_id).filter((id): id is number => typeof id === "number"))];
    if (ids.length !== 1) throw new Error(`Pass companyId: this token resolves to ${ids.length} companies (${ids.join(", ")}).`);
    cached = ids[0];
    return ids[0]!;
  };
  return { call, companyId };
}

type Client = ReturnType<typeof client>;

const companyInput = number().optional();
const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

// Every tool takes an optional companyId, any path ids, `query` filters and (for writes) a JSON `body`.
// Paths use {company_id} and named ids; paths outside /company/{id}/ take company_id as a query parameter.
function read(c: Client, method: "GET", path: string, description: string, ids: readonly string[] = [], companyQuery = false, stringIds: readonly string[] = []) {
  return query(
    {
      description,
      input: object({
        companyId: companyInput,
        ...Object.fromEntries(ids.map((id) => [id, stringIds.includes(id) ? string() : number()])),
        query: filters,
      }),
    },
    async (_ctx, input: Params) => run(c, method, path, input, ids, companyQuery, false),
  );
}

function write(c: Client, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], companyQuery = false, hasBody: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        companyId: companyInput,
        ...Object.fromEntries(ids.map((id) => [id, number()])),
        query: filters,
        ...(hasBody === "optional" ? { body: optionalPayload } : hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) => run(c, method, path, input, ids, companyQuery, hasBody),
  );
}

async function run(c: Client, method: Method, path: string, input: Params, ids: readonly string[], companyQuery: boolean, hasBody: boolean | "optional") {
  // Only resolve a company when the path or query needs one (some endpoints take none).
  const needsCompany = companyQuery || path.includes("{company_id}");
  const company = needsCompany ? await c.companyId(input.companyId as number | undefined) : undefined;
  let resolved = path.replace("{company_id}", String(company));
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  const search = { ...((input.query as Params | undefined) ?? {}), ...(companyQuery && company !== undefined ? { company_id: company } : {}) };
  return c.call(method, resolved, search, hasBody ? (input.body as Params | undefined) : undefined);
}

function build(c: Client) {
  const company = "/v2/company/{company_id}";
  const crud = (
    noun: string,
    plural: string,
    segment: string,
    idName: string,
    opts: { get?: boolean; update?: "PUT" | "PATCH"; remove?: string } = {},
  ) => ({
    list: read(c, "GET", `${company}/${segment}`, `List ${plural}. Filters go in query (cursor, limit, modified_since, ...). Pages are cursor-based: pass meta.cursor.next as cursor.`),
    ...(opts.get === false ? {} : { get: read(c, "GET", `${company}/${segment}/{${idName}}`, `Retrieve one ${noun}.`, [idName]) }),
    create: write(c, "POST", `${company}/${segment}`, `Create a ${noun}. body is the ${noun} object from the 7shifts API reference.`),
    ...(opts.update === undefined ? {} : { update: write(c, opts.update, `${company}/${segment}/{${idName}}`, `Update a ${noun}. body holds the fields to change.`, [idName]) }),
    ...(opts.remove === undefined ? {} : { delete: write(c, "DELETE", `${company}/${segment}/{${idName}}`, opts.remove, [idName], false, false) }),
  });

  return router({
    whoami: query(
      { description: "Identity behind the access token, with the users and company ids it can reach.", input: object({}) },
      async () => c.call("GET", "/v2/whoami"),
    ),
    companies: router(
      {
        list: read(c, "GET", "/v2/companies", "List companies the token can access."),
        get: read(c, "GET", `/v2/company/{company_id}`, "Retrieve a company."),
        laborSettings: read(c, "GET", `/v2/company/{company_id}/labor_settings`, "Retrieve the company's labor settings (overtime rules, week start)."),
        inactiveReasons: read(c, "GET", `/v2/company/{company_id}/inactive_reasons`, "List valid reasons for deactivating a user."),
      },
      { title: "Companies", description: "Company details and settings." },
    ),
    locations: router(
      crud("location", "locations", "locations", "location_id", { update: "PUT", remove: "Delete a location." }),
      { title: "Locations", description: "Restaurant locations." },
    ),
    departments: router(
      crud("department", "departments", "departments", "department_id", {
        update: "PUT",
        remove: "Delete a department. Pass transfer_to in query to move its users and shifts to another department.",
      }),
      { title: "Departments", description: "Departments within a location." },
    ),
    roles: router(
      crud("role", "roles", "roles", "role_id", { update: "PUT", remove: "Delete a role." }),
      { title: "Roles", description: "Job roles employees can be scheduled for." },
    ),
    users: router(
      {
        list: read(c, "GET", `${company}/users`, "List users. Filters in query: location_id, department_id, role_id, status (active, inactive), name, sort_by, cursor, limit."),
        get: read(c, "GET", `${company}/users/{identifier}`, "Retrieve a user by id.", ["identifier"]),
        create: write(c, "POST", `${company}/users`, "Create a user. body needs first_name and last_name; see the 7shifts API reference for the rest."),
        update: write(c, "PUT", `${company}/users/{identifier}`, "Update a user. body holds the fields to change.", ["identifier"]),
        deactivate: write(c, "DELETE", `${company}/users/{identifier}`, "Deactivate a user. Optional body: inactive_reason, inactive_comments, would_rehire.", ["identifier"], false, "optional"),
        wages: read(c, "GET", `${company}/users/{user_id}/wages`, "List a user's wage history.", ["user_id"]),
        createWage: write(c, "POST", `${company}/users/{user_id}/wages`, "Add a wage for a user. body: effective_date (YYYY-MM-DD), role_id, wage_type, wage_cents.", ["user_id"]),
        contacts: read(c, "GET", `${company}/contacts`, "List company contacts. Filters in query: name, include_hidden_admins, cursor, limit."),
        authorizedLocations: read(c, "GET", `${company}/users/{user_id}/authorized_locations`, "List locations a user may access.", ["user_id"]),
        locationAssignments: read(c, "GET", `${company}/users/{user_id}/location_assignments`, "List a user's location assignments.", ["user_id"]),
        departmentAssignments: read(c, "GET", `${company}/users/{user_id}/department_assignments`, "List a user's department assignments.", ["user_id"]),
        roleAssignments: read(c, "GET", `${company}/users/{user_id}/role_assignments`, "List a user's role assignments.", ["user_id"]),
        employmentRecords: read(c, "GET", `${company}/employment_records`, "List employment records. Filters in query: user_id, user_ids, business_entity_uuid."),
      },
      { title: "Users", description: "Employees, their wages and assignments." },
    ),
    shifts: router(
      {
        ...crud("shift", "shifts", "shifts", "shift_id", { update: "PUT", remove: "Delete a shift." }),
        scheduled: read(c, "GET", `${company}/shifts_scheduled/{id}`, "List scheduled shifts for a schedule id, a string such as a numeric id or punch_id:003184. Filters in query: location_id, grace_period.", ["id"], false, ["id"]),
        feedback: read(c, "GET", `${company}/shift_feedback`, "List shift feedback. Filters in query: start_date, end_date, location_id, user_id, cursor, limit."),
      },
      { title: "Shifts", description: "Scheduled shifts. list filters: location_id, user_id, department_id, role_id, start[gte], start[lte], draft, open, cursor, limit." },
    ),
    timePunches: router(
      crud("time punch", "time punches", "time_punches", "time_punch_id", { update: "PUT", remove: "Delete a time punch." }),
      { title: "Time punches", description: "Clock in and out records." },
    ),
    payrollPeriods: router(
      {
        list: read(c, "GET", "/v2/time_clocking/payroll_periods", "List payroll periods. Filters in query: include_punches_status, cursor, limit.", [], true),
        get: read(c, "GET", `${company}/payroll_periods/{payroll_period_id}`, "Retrieve a payroll period.", ["payroll_period_id"]),
      },
      { title: "Payroll periods", description: "Pay period boundaries and punch status." },
    ),
    timeOff: router(
      {
        list: read(c, "GET", "/v2/time_off", "List time off requests. Filters in query: location_id, user_id, status, category, to_date_gte, sort_by, sort_dir, cursor, limit.", [], true),
        get: read(c, "GET", "/v2/time_off/{time_off_id}", "Retrieve a time off request.", ["time_off_id"]),
        create: write(c, "POST", "/v2/time_off", "Create a time off request. body: user_id, company_id, from_date, to_date, partial, category, comments.", [], false, true),
        approve: write(c, "POST", "/v2/time_off/{time_off_id}/approve", "Approve a time off request. Optional body.status_action_message.", ["time_off_id"], false, "optional"),
        decline: write(c, "POST", "/v2/time_off/{time_off_id}/decline", "Decline a time off request. Optional body.status_action_message.", ["time_off_id"], false, "optional"),
        delete: write(c, "DELETE", "/v2/time_off/{time_off_id}", "Delete a time off request.", ["time_off_id"], false, false),
        settings: read(c, "GET", "/v2/time_off_settings/{company_id}", "Retrieve time off settings."),
      },
      { title: "Time off", description: "Time off requests and approvals." },
    ),
    availabilities: router(
      {
        list: read(c, "GET", `${company}/availabilities`, "List availabilities. Filters in query: location_id, user_id, status, repeating, cursor, limit."),
        get: read(c, "GET", `${company}/availabilities/{availability_id}`, "Retrieve an availability.", ["availability_id"]),
        reasons: read(c, "GET", `${company}/availability_reasons`, "List availability reasons."),
      },
      { title: "Availabilities", description: "Employee availability." },
    ),
    events: router(
      {
        list: read(c, "GET", `${company}/events`, "List events. Filters in query: location_id, start_date, end_date, type, limit."),
        create: write(c, "POST", `${company}/events`, "Create an event. body: location_ids, start_date, start_time, end_date, end_time, title, ..."),
        update: write(c, "PATCH", `${company}/events/{event_id}`, "Update an event. body holds the fields to change.", ["event_id"]),
        delete: write(c, "DELETE", `${company}/events/{event_id}`, "Delete an event. Query: recurrence_target, start_date.", ["event_id"], false, false),
      },
      { title: "Events", description: "Location and company events." },
    ),
    reports: router(
      {
        hoursAndWages: read(c, "GET", "/v2/reports/hours_and_wages", "Worked hours and wages. Query: from, to (dates), location_id, department_id, role_id, user_id, punches, include_tips, include_qualified_ot.", [], true),
        dailySalesAndLabor: read(c, "GET", "/v2/reports/daily_sales_and_labor", "Daily sales and labor cost. Query: start_date and end_date (YYYY-MM-DD) and location_id are required; department_id is optional.", [], false),
        dailyStats: read(c, "GET", `${company}/location/{location_id}/daily_stats`, "Daily stats for a location. Query: date, department_id, include_future.", ["location_id"]),
      },
      { title: "Reports", description: "Labor and sales reports." },
    ),
    webhooks: router(
      {
        list: read(c, "GET", `${company}/webhooks`, "List webhooks."),
        create: write(c, "POST", `${company}/webhooks`, "Create a webhook subscription."),
        update: write(c, "PUT", `${company}/webhooks/{webhook_id}`, "Update a webhook.", ["webhook_id"]),
        delete: write(c, "DELETE", `${company}/webhooks/{webhook_id}`, "Delete a webhook.", ["webhook_id"], false, false),
      },
      { title: "Webhooks", description: "Company webhook subscriptions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { sevenshifts: sevenshifts.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sevenshifts ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "7shifts",
        description:
          "Restaurant scheduling and labor management: locations, departments, roles, users, shifts, time punches, time off, availability, events, payroll periods and reports. companyId is optional when the token reaches one company; pass filters in query and fields in body.",
        icons,
      },
    ),
  }),
);
