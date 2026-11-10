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

const production = "https://api.breathehr.com/v1";
const sandbox = "https://api.sandbox.breathehr.info/v1";

// Breathe issues separate keys per environment (production keys start "prod-", sandbox keys "sandbox-"),
// so each environment is its own auth method and picks the matching host.
const breathehr = defineProvider({
  name: "Breathe HR",
  hosts: ["api.breathehr.com", "api.sandbox.breathehr.info"],
  auth: {
    apiKey: secrets({
      label: "Production API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    sandboxKey: secrets({
      label: "Sandbox API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = account.method === "sandboxKey" ? sandbox : production;
    const response = await fetch(`${base}/account`, { signal, headers: { "X-API-KEY": account.fields.token, Accept: "application/json" } });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-API-KEY": token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    // Collections are paginated; the total and next-page links arrive in headers.
    const data = await decodeJson(response, json());
    const total = response.headers.get("Total");
    const link = response.headers.get("Link");
    return total === null && link === null ? data : { data, total: total === null ? null : Number(total), link };
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());

// Path ids are written {name}; every other input goes to the query string (reads) or the body (writes).
// `wrap` is the root key Breathe expects around a write body, such as {"employee": {...}}.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), query: filters }) },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], wrap?: string, hasBody = true) {
  return mutation(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), ...(hasBody ? { body: payload } : {}) }),
    },
    async (_ctx, input: Params) => {
      const body = hasBody ? (wrap === undefined ? (input.body as Params) : { [wrap]: input.body }) : undefined;
      return call(method, fill(path, ids, input), {}, body);
    },
  );
}

function fill(path: string, ids: readonly string[], input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

const page = "Filters go in query: page, per_page (default 25, max 100).";

function build(call: Call) {
  const listing = (path: string, noun: string, extra = "") => read(call, path, `List ${noun}. ${page}${extra}`);
  const scoped = (suffix: string, noun: string, extra = "") =>
    read(call, `/employees/{id}/${suffix}`, `List ${noun} for one employee. ${page}${extra}`, ["id"]);
  const department = (suffix: string, noun: string, extra = "") =>
    read(call, `/departments/{id}/${suffix}`, `List ${noun} for one department. ${page}${extra}`, ["id"]);

  return router({
    account: query(
      { description: "Retrieve the Breathe HR account the API key belongs to.", input: object({}) },
      async () => call("GET", "/account"),
    ),
    employees: router(
      {
        list: listing("/employees", "employees", " Also filter (hr, line_manager, either) and rotacloud (true/false)."),
        get: read(call, "/employees/{id}", "Retrieve one employee.", ["id"]),
        create: write(
          call,
          "POST",
          "/employees",
          "Create an employee. body needs first_name, last_name, email and join_date (or company_join_date); optional job_title, dob, gender, department, division, location, working_pattern, holiday_allowance, employee_ref and more.",
          [],
          "employee",
        ),
        listAbsences: scoped("absences", "absences", " Also type (Holiday, OtherLeave), start_date, end_date, exclude_cancelled_absences."),
        listBenefits: scoped("benefits", "benefits"),
        listBonuses: scoped("bonuses", "bonuses"),
        listChangeRequests: scoped("change_requests", "change requests"),
        listHolidayYears: scoped("holiday_years", "holiday years", " Also for_date."),
        listLeaveRequests: scoped("leave_requests", "leave requests", " Also exclude_cancelled_requests."),
        listSalaries: scoped("salaries", "salaries"),
        createChangeRequest: write(
          call,
          "POST",
          "/employees/{id}/change_requests",
          "Request a change to an employee field. body: field, value, and optional approved (true applies it immediately).",
          ["id"],
          "change_request",
        ),
        createSickness: write(
          call,
          "POST",
          "/employees/{id}/sicknesses",
          "Record a sickness absence. body: start_date, company_sicknesstype_id, optional end_date, reason, half_day, half_start, half_end, half_start_am_pm, half_end_am_pm, review_notes, status.",
          ["id"],
          "sickness",
        ),
        createExpense: write(
          call,
          "POST",
          "/employees/{employee_id}/employee_expenses",
          "Create an expense. body: amount, description, expense_date, payable_to_employee, company_expense_type_id; optional vat, miles, client_name, has_receipt, company_project_id, chargeable_to_client, company_mileage_rate_id.",
          ["employee_id"],
          "employee_expense",
        ),
        createExpenseClaim: write(
          call,
          "POST",
          "/employees/{employee_id}/employee_expense_claims",
          "Submit an expense claim. body: employee_expense_ids (array of expense ids to claim).",
          ["employee_id"],
          "employee_expense_claim",
        ),
      },
      { title: "Employees", description: "Employee records and the data attached to each employee." },
    ),
    leaveRequests: router(
      {
        list: listing("/leave_requests", "leave requests", " Also start_date, end_date, rotacloud, exclude_cancelled_requests."),
        get: read(call, "/leave_requests/{id}", "Retrieve one leave request.", ["id"]),
        getCancelling: read(call, "/leave_requests/{id}/cancelling", "Retrieve the cancellation request for a leave request.", ["id"]),
        approve: write(call, "POST", "/leave_requests/{id}/approve", "Approve a leave request.", ["id"], undefined, false),
        reject: write(call, "POST", "/leave_requests/{id}/reject", "Reject a leave request. body: rejection_reason.", ["id"]),
      },
      { title: "Leave requests", description: "Holiday and other-leave requests and their approval." },
    ),
    absences: router(
      {
        list: listing("/absences", "absences", " Also type (Holiday, OtherLeave), start_date, end_date, employee_id, department_id, other_leave_reason_id, exclude_cancelled_absences, rotacloud."),
      },
      { title: "Absences", description: "Approved absences across the company." },
    ),
    sicknesses: router(
      {
        list: listing("/sicknesses", "sickness records", " Also employee_id, start_date, end_date."),
        update: write(call, "PUT", "/sicknesses/{id}", "Update a sickness record. body holds the fields to change.", ["id"], "sickness"),
      },
      { title: "Sickness", description: "Sickness absence records." },
    ),
    expenses: router(
      {
        list: listing("/employee_expenses", "expenses", " Also employee_id, show_claimed."),
        get: read(call, "/employee_expenses/{id}", "Retrieve one expense.", ["id"]),
        delete: write(call, "DELETE", "/employee_expenses/{id}", "Delete an expense.", ["id"], undefined, false),
        listClaims: listing("/employee_expense_claims", "expense claims", " Also employee_id, state_filter (submitted, approved, completed)."),
        updateClaim: write(call, "PUT", "/employee_expense_claims/{id}", "Update an expense claim. body holds the fields to change.", ["id"], "employee_expense_claim"),
      },
      { title: "Expenses", description: "Employee expenses and expense claims." },
    ),
    training: router(
      {
        listCourses: listing("/employee_training_courses", "employee training courses", " Also employee_id."),
        updateCourse: write(call, "PUT", "/employee_training_courses/{id}", "Update an employee training course. body holds the fields to change.", ["id"], "employee_training_course"),
        deleteCourse: write(call, "DELETE", "/employee_training_courses/{id}", "Delete an employee training course.", ["id"], undefined, false),
        listTypes: listing("/company_training_types", "company training types"),
      },
      { title: "Training", description: "Training courses taken by employees and the company's training types." },
    ),
    pay: router(
      {
        listSalaries: listing("/salaries", "salaries"),
        listBenefits: listing("/employee_benefits", "employee benefits"),
        listBonuses: listing("/employee_bonuses", "employee bonuses"),
        listJobs: listing("/employee_jobs", "employee jobs", " Also employee_id."),
      },
      { title: "Pay and jobs", description: "Salaries, benefits, bonuses and job history across the company." },
    ),
    departments: router(
      {
        list: listing("/departments", "departments"),
        listAbsences: department("absences", "absences", " Also exclude_cancelled_absences."),
        listBenefits: department("benefits", "benefits"),
        listBonuses: department("bonuses", "bonuses"),
        listLeaveRequests: department("leave_requests", "leave requests", " Also exclude_cancelled_requests."),
        listSalaries: department("salaries", "salaries"),
      },
      { title: "Departments", description: "Departments and their absences, pay and leave requests." },
    ),
    company: router(
      {
        divisions: read(call, "/divisions", "List divisions."),
        locations: listing("/locations", "locations"),
        workingPatterns: listing("/working_patterns", "working patterns"),
        holidayAllowances: read(call, "/holiday_allowances", "List holiday allowances."),
        otherLeaveReasons: read(call, "/other_leave_reasons", "List other-leave reasons."),
        projects: listing("/company_projects", "company projects"),
        documents: listing("/company_documents", "company documents"),
        changeRequests: listing("/change_requests", "change requests"),
      },
      { title: "Company setup", description: "Divisions, locations, working patterns, allowances, projects, documents and change requests." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { breathehr: breathehr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.breathehr ?? [],
        (account) =>
          withApprovals(
            build(client(account.method === "sandboxKey" ? sandbox : production, account.fields.token, fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Breathe HR",
        description:
          "UK HR software for small businesses: employees, leave requests, absences, sickness, expenses, salaries, benefits, departments and company setup. Pass filters in query and fields in body; lists are paginated with page and per_page.",
        icons,
      },
    ),
  }),
);
