import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://charliehr.com/api/v1";

const charliehr = defineProvider({
  name: "CharlieHR",
  hosts: ["charliehr.com"],
  auth: {
    // CharlieHR issues a client ID and secret to Super Admins (Company > Integrations > API Access).
    apiKey: secrets({
      label: "API keys",
      fields: object({ clientId: string({ minLength: 1 }), clientSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/company`, { signal, headers: headers(account.fields) });
    await decodeJson(response, object({ id: string() }));
  },
});

type Fetch = typeof fetch;
type Keys = { clientId: string; clientSecret: string };

function headers(keys: Keys) {
  return { Authorization: `Token token=${keys.clientId}:${keys.clientSecret}`, Accept: "application/json" };
}

function client(keys: Keys, fetcher: Fetch, signal: AbortSignal | undefined) {
  return {
    get: async (path: string, search: Record<string, unknown> = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(search)) if (value !== undefined) url.searchParams.set(key, String(value));
      const response = await fetcher(url.toString(), { signal, headers: headers(keys) });
      return decodeJson(response, json());
    },
    post: async (path: string, body: Record<string, unknown>) => {
      const response = await fetcher(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(keys), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return decodeJson(response, json());
    },
  };
}

type Client = ReturnType<typeof client>;

const paging = { page: number().optional(), perPage: number().optional() };
const pageQuery = (input: { page?: number; perPage?: number }) => ({ page: input.page, per_page: input.perPage });
const pagingNote = " Paginated: pass page and perPage.";

function build(api: Client) {
  const get = api.get;
  const list = (description: string, path: string) =>
    query({ description: description + pagingNote, input: object(paging) }, async (_ctx, input) => get(path, pageQuery(input)));
  const byId = (description: string, path: (id: string) => string) =>
    query({ description, input: object({ id: string({ minLength: 1 }) }) }, async (_ctx, input) => get(path(encodeURIComponent(input.id))));
  const listById = (description: string, path: (id: string) => string) =>
    query(
      { description: description + pagingNote, input: object({ id: string({ minLength: 1 }), ...paging }) },
      async (_ctx, input) => get(path(encodeURIComponent(input.id)), pageQuery(input)),
    );

  return router({
    company: router(
      { get: query({ description: "Retrieve the company that owns the API keys.", input: object({}) }, async () => get("/company")) },
      { title: "Company", description: "The authenticated company." },
    ),
    offices: router(
      {
        list: list("List the company's offices.", "/offices"),
        get: byId("Retrieve an office by id.", (id) => `/offices/${id}`),
      },
      { title: "Offices", description: "Company offices." },
    ),
    teams: router(
      {
        list: list("List the company's teams.", "/teams"),
        get: byId("Retrieve a team by id.", (id) => `/teams/${id}`),
      },
      { title: "Teams", description: "Company teams." },
    ),
    teamMembers: router(
      {
        list: list("List team members (employees).", "/team_members"),
        get: byId("Retrieve a team member by id.", (id) => `/team_members/${id}`),
        notes: listById("List notes recorded on a team member. id is the team member id.", (id) => `/team_members/${id}/notes`),
        createNote: mutation(
          {
            description: "Create a note on a team member. teamMemberId is the team member id; noteTypeId is a note type id from noteTypes.list.",
            input: object({ teamMemberId: string({ minLength: 1 }), noteTypeId: string({ minLength: 1 }), content: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, input) =>
            api.post(`/team_members/${encodeURIComponent(input.teamMemberId)}/notes`, {
              team_member_note_type_id: input.noteTypeId,
              content: input.content,
            }),
        ),
        salaries: listById("List the salaries of one team member (sensitive pay data). id is the team member id.", (id) => `/team_members/${id}/salaries`),
        allowanceAdjustments: byId("List leave allowance adjustments for one team member across all leave periods. id is the team member id.", (id) => `/team_members/${id}/allowance_adjustments`),
        workingLocation: byId("Retrieve the working location of one team member. id is the team member id.", (id) => `/team_members/${id}/working_location`),
        workingWeeks: byId("List working week segments for one team member (company defaults and overrides; not paginated). id is the team member id.", (id) => `/team_members/${id}/working_weeks`),
        nonHolidayLeaveAllowances: byId("Days taken and limit for each non-holiday leave type for one team member. id is the team member id.", (id) => `/team_members/${id}/non_holiday_leave_allowances`),
      },
      { title: "Team members", description: "Employees and their notes." },
    ),
    leaveRequests: router(
      {
        list: list("List leave requests across the company.", "/leave_requests"),
        get: byId("Retrieve a leave request by id.", (id) => `/leave_requests/${id}`),
        forTeamMember: listById("List leave requests for one team member. id is the team member id.", (id) => `/team_members/${id}/leave_requests`),
      },
      { title: "Leave requests", description: "Time off and absence requests." },
    ),
    leaveTypes: router(
      {
        list: list("List the company's enabled leave types.", "/leave_types"),
        get: byId("Retrieve a leave type by id.", (id) => `/leave_types/${id}`),
      },
      { title: "Leave types", description: "Kinds of leave configured for the company." },
    ),
    calendar: router(
      {
        companyHolidays: list("List company holidays.", "/company_holidays"),
        restrictedDates: list("List restricted dates (periods when leave is restricted).", "/restricted_dates"),
      },
      { title: "Calendar", description: "Company holidays and restricted leave dates." },
    ),
    noteTypes: router(
      {
        list: list("List team member note types.", "/team_member_note_types"),
        get: byId("Retrieve a team member note type by id.", (id) => `/team_member_note_types/${id}`),
        create: mutation(
          {
            description:
              "Create a team member note type. type is Text, Number or Checklist (default Text). permissions optionally sets which roles can see it, as booleans for anyone, owners, team_leads, line_managers, payroll_admins and admins.",
            input: object({
              name: string({ minLength: 1 }),
              type: string().optional(),
              permissions: object({
                anyone: boolean().optional(),
                owners: boolean().optional(),
                team_leads: boolean().optional(),
                line_managers: boolean().optional(),
                payroll_admins: boolean().optional(),
                admins: boolean().optional(),
              }).optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => api.post("/team_member_note_types", input),
        ),
      },
      { title: "Note types", description: "Categories of team member notes." },
    ),
    workingLocations: router(
      {
        list: query(
          {
            description:
              "List active working locations. With date (YYYY-MM-DD), returns each active team member's resolved working location on that date instead." + pagingNote,
            input: object({ date: string().optional(), ...paging }),
          },
          async (_ctx, input) => get("/working_locations", { date: input.date, ...pageQuery(input) }),
        ),
      },
      { title: "Working locations", description: "Where the company and its people work." },
    ),
    payroll: router(
      {
        salaries: list("List salaries for every team member (sensitive pay data).", "/salaries"),
        bankAccounts: list("List team members' bank accounts (sensitive financial data).", "/bank_accounts"),
        bankAccount: byId("Retrieve the bank account of one team member (sensitive financial data). id is the team member id.", (id) => `/bank_accounts/${id}`),
      },
      { title: "Payroll", description: "Salaries and bank accounts. Sensitive: only read when the user asks for it." },
    ),
    leaveAllowances: router(
      {
        list: list("List current leave allowances for all team members.", "/leave_allowances"),
        forTeamMember: byId("Retrieve the leave allowance of one team member. id is the team member id.", (id) => `/team_members/${id}/leave_allowance`),
      },
      { title: "Leave allowances", description: "Remaining and total leave entitlements." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { charliehr: charliehr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.charliehr ?? [], (account) => build(client(account.fields, fetch, signal)), { signal }),
      {
        title: "CharlieHR",
        description:
          "CharlieHR people data: company, offices, teams, team members, notes, leave types, requests and allowances, holidays, working locations, working weeks, salaries and bank accounts. Two write tools (create note, create note type) require approval.",
        icons,
      },
    ),
  }),
);
