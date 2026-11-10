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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Pinned to a published API version so behavior does not drift with the key's default.
const apiVersion = "20240404";

const teamtailor = defineProvider({
  name: "Teamtailor",
  // EU stack is api.teamtailor.com, NA stack is api.na.teamtailor.com.
  hosts: ["api.teamtailor.com", "api.na.teamtailor.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), region: string().optional() }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseUrl(account.fields.region)}/v1/company`, {
      signal,
      headers: headers(account.fields.token),
    });
    await decodeJson(response, object({}));
  },
});

function baseUrl(region: string | undefined): string {
  return region?.trim().toLowerCase() === "na" ? "https://api.na.teamtailor.com" : "https://api.teamtailor.com";
}

function headers(token: string, body = false): Record<string, string> {
  return {
    Authorization: `Token token=${token}`,
    "X-Api-Version": apiVersion,
    Accept: "application/vnd.api+json",
    ...(body ? { "Content-Type": "application/vnd.api+json" } : {}),
  };
}

type Params = Record<string, unknown>;
type Method = "GET" | "POST" | "PATCH" | "DELETE";

function client(token: string, region: string | undefined, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${baseUrl(region)}/v1${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: headers(token, body !== undefined),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());

const listHelp =
  "Pass JSON:API params in query, for example { 'filter[created-at][from]': '2024-01-01', 'page[size]': 30, 'page[number]': 1, sort: '-created-at', include: 'user' }. Page size is at most 30; follow links.next.";

function list(call: Call, path: string, noun: string, extra = "") {
  return query(
    { description: `List ${noun}. ${extra} ${listHelp}`.replace("  ", " "), input: object({ query: filters }) },
    async (_ctx, input: Params) => call("GET", path, (input.query as Params | undefined) ?? {}),
  );
}

function show(call: Call, path: string, noun: string) {
  return query(
    {
      description: `Retrieve one ${noun} by id. Use query.include for related resources.`,
      input: object({ id: string({ minLength: 1 }), query: filters }),
    },
    async (_ctx, input: Params) => call("GET", `${path}/${encodeURIComponent(String(input.id))}`, (input.query as Params | undefined) ?? {}),
  );
}

function create(call: Call, path: string, noun: string) {
  return mutation(
    {
      description: `Create a ${noun}. body is a JSON:API document: { data: { type, attributes, relationships } }.`,
      input: object({ body: payload }),
    },
    async (_ctx, input: Params) => call("POST", path, {}, input.body as Params),
  );
}

function update(call: Call, path: string, noun: string) {
  return mutation(
    {
      description: `Update a ${noun}. body is a JSON:API document { data: { id, type, attributes } } with only the fields to change.`,
      input: object({ id: string({ minLength: 1 }), body: payload }),
    },
    async (_ctx, input: Params) => call("PATCH", `${path}/${encodeURIComponent(String(input.id))}`, {}, input.body as Params),
  );
}

function remove(call: Call, path: string, noun: string) {
  return mutation(
    { description: `Delete a ${noun}.`, input: object({ id: string({ minLength: 1 }) }) },
    async (_ctx, input: Params) => call("DELETE", `${path}/${encodeURIComponent(String(input.id))}`),
  );
}

type Ops = { list?: boolean; show?: boolean; create?: boolean; update?: boolean; remove?: boolean };

function resource(call: Call, path: string, noun: string, plural: string, ops: Ops, title: string, description: string, extra = "") {
  return router(
    {
      ...(ops.list === false ? {} : { list: list(call, path, plural, extra) }),
      ...(ops.show === false ? {} : { get: show(call, path, noun) }),
      ...(ops.create ? { create: create(call, path, noun) } : {}),
      ...(ops.update ? { update: update(call, path, noun) } : {}),
      ...(ops.remove ? { delete: remove(call, path, noun) } : {}),
    },
    { title, description },
  );
}

const readOnly: Ops = {};
const crud: Ops = { create: true, update: true, remove: true };

function build(call: Call) {
  return router({
    company: router(
      {
        get: query({ description: "Retrieve the company: name, locale, career site settings.", input: object({ query: filters }) }, async (_ctx, input: Params) =>
          call("GET", "/company", (input.query as Params | undefined) ?? {}),
        ),
        update: mutation(
          { description: "Update the company. body is a JSON:API document.", input: object({ body: payload }) },
          async (_ctx, input: Params) => call("PATCH", "/company", {}, input.body as Params),
        ),
      },
      { title: "Company", description: "The company account." },
    ),
    jobs: resource(call, "/jobs", "job", "jobs", { create: true, update: true }, "Jobs", "Job postings.", "Filters include filter[status] (open, draft, archived, unlisted), filter[feed], filter[department], filter[locations]."),
    candidates: resource(call, "/candidates", "candidate", "candidates", { create: true, update: true }, "Candidates", "People in the talent pool.", "Filters include filter[email], filter[created-at][from], filter[updated-at][from], filter[connected], filter[sourced]."),
    jobApplications: resource(call, "/job-applications", "job application", "job applications", { create: true, update: true }, "Job applications", "A candidate's application to a job, with its stage and status.", "Filters include filter[job-id], filter[candidate-id], filter[created-at][from], filter[stage-type]."),
    notes: resource(call, "/notes", "note or review", "notes and reviews", crud, "Notes", "Comments and reviews on candidates."),
    stages: resource(call, "/stages", "stage", "stages", { create: true }, "Stages", "Recruitment pipeline stages."),
    stageTypes: resource(call, "/stage-types", "stage type", "stage types", readOnly, "Stage types", "Stage categories."),
    rejectReasons: resource(call, "/reject-reasons", "reject reason", "reject reasons", crud, "Reject reasons", "Reasons for rejecting candidates."),
    users: resource(call, "/users", "user", "users", crud, "Users", "Recruiters and hiring managers."),
    teams: resource(call, "/teams", "team", "teams", crud, "Teams", "Teams of users."),
    teamMemberships: resource(call, "/team-memberships", "team membership", "team memberships", { create: true, remove: true }, "Team memberships", "Hiring teams and their members."),
    departments: resource(call, "/departments", "department", "departments", crud, "Departments", "Company departments."),
    divisions: resource(call, "/divisions", "division", "divisions", readOnly, "Divisions", "Company divisions."),
    locations: resource(call, "/locations", "location", "locations", crud, "Locations", "Office locations."),
    regions: resource(call, "/regions", "region", "regions", { create: true }, "Regions", "Job regions."),
    roles: resource(call, "/roles", "role", "roles", crud, "Roles", "Job roles."),
    todos: resource(call, "/todos", "todo", "todos", crud, "Todos", "Tasks assigned to users."),
    requisitions: resource(call, "/requisitions", "requisition", "requisitions", { create: true, update: true }, "Requisitions", "Headcount requisitions."),
    requisitionStepVerdicts: router(
      {
        get: show(call, "/requisition-step-verdicts", "requisition step verdict"),
        update: update(call, "/requisitions", "requisition step verdict"),
      },
      { title: "Requisition step verdicts", description: "Approval verdicts on requisition steps." },
    ),
    interviews: resource(call, "/interviews", "interview", "interviews", readOnly, "Interviews", "Scheduled interviews."),
    jobOffers: resource(call, "/job-offers", "job offer", "job offers", readOnly, "Job offers", "Offers made to candidates."),
    referrals: resource(call, "/referrals", "referral", "referrals", readOnly, "Referrals", "Candidate referrals."),
    movements: resource(call, "/movements", "movement", "movements", readOnly, "Movements", "Candidates moving between stages."),
    activities: router({ get: show(call, "/activities", "activity") }, { title: "Activities", description: "Candidate activity records." }),
    onboardings: resource(call, "/onboardings", "onboarding", "onboardings", readOnly, "Onboardings", "Onboarding processes."),
    customFields: resource(call, "/custom-fields", "custom field", "custom fields", { create: true, update: true }, "Custom fields", "Custom field definitions."),
    customFieldOptions: router(
      {
        list: list(call, "/custom-field-options", "custom field options"),
        create: create(call, "/custom-field-options", "custom field option"),
        update: update(call, "/custom-field-options", "custom field option"),
      },
      { title: "Custom field options", description: "Options for select-type custom fields." },
    ),
    customFieldSelects: router(
      {
        create: create(call, "/custom-field-selects", "custom field select"),
        update: update(call, "/custom-field-selects", "custom field select"),
      },
      { title: "Custom field selects", description: "Select-type custom field values." },
    ),
    customFieldValues: resource(call, "/custom-field-values", "custom field value", "custom field values", { create: true, update: true }, "Custom field values", "Custom field values on candidates, jobs and other resources."),
    questions: router({ list: list(call, "/questions", "questions") }, { title: "Questions", description: "Application questions." }),
    pickedQuestions: router({ list: list(call, "/picked-questions", "picked questions") }, { title: "Picked questions", description: "Questions picked for jobs." }),
    answers: router(
      {
        list: list(call, "/answers", "answers"),
        get: show(call, "/answers", "answer"),
        create: create(call, "/answers", "answer"),
        authenticatedVideoUrl: query(
          { description: "Get an authenticated, time-limited URL for a video answer.", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, input: Params) => call("GET", `/answers/${encodeURIComponent(String(input.id))}/authenticated-video-url`),
        ),
      },
      { title: "Answers", description: "Candidate answers to questions." },
    ),
    forms: resource(call, "/forms", "form", "forms", readOnly, "Forms", "Application forms."),
    formQuestions: resource(call, "/form-questions", "form question", "form questions", readOnly, "Form questions", "Questions on forms."),
    formAnswers: resource(call, "/form-answers", "form answer", "form answers", readOnly, "Form answers", "Answers submitted on forms."),
    scorecardCriteria: resource(call, "/scorecard-criteria", "scorecard criterion", "scorecard criteria", readOnly, "Scorecard criteria", "Scorecard criteria."),
    scorecardPicks: resource(call, "/scorecard-picks", "scorecard pick", "scorecard picks", readOnly, "Scorecard picks", "Scorecards picked for jobs."),
    scorecardScores: resource(call, "/scorecard-scores", "scorecard score", "scorecard scores", readOnly, "Scorecard scores", "Scores given on scorecards."),
    triggers: router(
      { list: list(call, "/triggers", "triggers"), get: show(call, "/stages", "trigger (by stage id)") },
      { title: "Triggers", description: "Automation triggers on stages." },
    ),
    notificationSettings: router(
      {
        list: list(call, "/notification-settings", "notification settings"),
        get: show(call, "/notification-settings", "notification setting"),
        update: update(call, "/notification-settings", "notification setting"),
      },
      { title: "Notification settings", description: "User notification preferences." },
    ),
    npsResponses: router(
      { list: list(call, "/nps-responses", "NPS responses"), get: show(call, "/nps-response", "NPS response") },
      { title: "NPS responses", description: "Candidate experience scores." },
    ),
    auditEvents: resource(call, "/audit-events", "audit event", "audit events", readOnly, "Audit events", "Account audit log."),
    partnerResults: resource(call, "/partner-results", "partner result", "partner results", readOnly, "Partner results", "Results posted by integration partners."),
    uploads: router(
      {
        list: list(call, "/uploads", "uploads"),
        create: create(call, "/uploads", "upload (from a file URL)"),
        createTransient: create(call, "/files", "transient upload"),
      },
      { title: "Uploads", description: "Files attached to candidates." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { teamtailor: teamtailor.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.teamtailor ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, account.fields.region, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Teamtailor",
        description:
          "Applicant tracking with Teamtailor: jobs, candidates, job applications, notes, stages, interviews, users, teams, requisitions and custom fields. The API is JSON:API: filters and includes go in query, writes take a JSON:API document in body.",
        icons,
      },
    ),
  }),
);
