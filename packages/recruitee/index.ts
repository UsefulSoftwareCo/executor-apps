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

const base = "https://api.recruitee.com";

const recruitee = defineProvider({
  name: "Recruitee",
  hosts: ["api.recruitee.com"],
  auth: {
    // OAuth clients are registered by Recruitee for integration partners (Partners API); a personal API token plus the company ID is the self-serve route.
    apiKey: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }), companyId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/c/${encodeURIComponent(account.fields.companyId)}/admin`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: { token: string; companyId: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const prefix = `${base}/c/${encodeURIComponent(fields.companyId)}`;
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${prefix}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${fields.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

// Paths use {name} placeholders for numeric ids. Every tool takes those ids, optional `query` parameters and, for writes, a JSON `body`.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, number()])), query: filters }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(
  call: Call,
  method: Exclude<Method, "GET">,
  path: string,
  description: string,
  ids: readonly string[] = [],
  body: boolean | "optional" = true,
) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, number()])),
        query: filters,
        ...(body === "optional" ? { body: optionalPayload } : body ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, ids, input), (input.query as Params | undefined) ?? {}, body ? ((input.body as Params | undefined) ?? {}) : undefined),
  );
}

function fill(path: string, ids: readonly string[], input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function build(call: Call) {
  return router({
    request: mutation(
      {
        description:
          "Escape hatch for any Recruitee ATS endpoint not covered by a dedicated tool (see https://apidocs.recruitee.com). path is relative to /c/{company_id}, for example /interview/events. Always requires approval.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: filters,
          body: optionalPayload,
        }),
      },
      async (_ctx, input) => {
        const method = input.method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error(`Unsupported method ${input.method}`);
        if (!input.path.startsWith("/") || input.path.includes("..")) throw new Error("path must start with / and stay inside the company");
        return call(method as Method, input.path, input.query ?? {}, input.body);
      },
    ),
    account: router(
      {
        me: read(call, "/admin", "The authenticated user's profile and company settings."),
        admins: read(call, "/admins", "List team members (admins) of the company."),
      },
      { title: "Account", description: "Current user, company and team members." },
    ),
    candidates: router(
      {
        list: read(
          call,
          "/candidates",
          "List candidates. Query: limit, page, offset, query (text), sort, offer_id, qualified, disqualify_reason_id, created_after, ...",
        ),
        get: read(call, "/candidates/{id}", "Retrieve one candidate with placements, notes counts and custom fields.", ["id"]),
        search: read(
          call,
          "/search/new/candidates",
          "Full candidate search. Query: filters_json (JSON-encoded FilterGroup array as documented by Recruitee), sort_by, limit, page.",
        ),
        create: write(
          call,
          "POST",
          "/candidates",
          'Add a candidate. body: { candidate: { name, emails: [..], phones: [..], sources: [..], social_links, links, cover_letter, remote_cv_url }, offers: [offerId] } (or offer_id).',
        ),
        update: write(call, "PATCH", "/candidates/{id}", "Update a candidate. body: { candidate: {fields to change} }.", ["id"]),
        delete: write(call, "DELETE", "/candidates/{id}", "Delete a candidate permanently.", ["id"], false),
        duplicates: read(call, "/candidates/{id}/duplicates", "List possible duplicates of a candidate.", ["id"]),
        merge: write(call, "PATCH", "/candidates/{id}/merge", "Merge candidates into this one. body: { candidate_ids: [..] } as documented.", ["id"]),
        follow: write(call, "PATCH", "/candidates/{id}/follow", "Follow a candidate to receive notifications.", ["id"], false),
        unfollow: write(call, "PATCH", "/candidates/{id}/unfollow", "Stop following a candidate.", ["id"], false),
        notes: read(call, "/candidates/{candidate_id}/notes", "List notes on a candidate.", ["candidate_id"]),
        addNote: write(call, "POST", "/candidates/{candidate_id}/notes", "Add a note. body: { note: { body, visibility } }.", ["candidate_id"]),
        tasks: read(call, "/candidates/{candidate_id}/tasks", "List tasks for a candidate.", ["candidate_id"]),
        addTag: write(call, "POST", "/candidates/{candidate_id}/tags", "Tag a candidate. body: { tags: [name] }.", ["candidate_id"]),
        removeTag: write(call, "DELETE", "/candidates/{candidate_id}/tags", "Untag a candidate. body: { tags: [name] }.", ["candidate_id"]),
        addSource: write(call, "POST", "/candidates/{candidate_id}/sources", "Add a source to a candidate. body: { sources: [name] }.", ["candidate_id"]),
        addCustomField: write(
          call,
          "POST",
          "/custom_fields/candidates/{candidate_id}/fields",
          "Add a profile field to a candidate. body: { field: { kind, name, values } }.",
          ["candidate_id"],
        ),
        mailbox: read(call, "/mailbox/candidate/{id}", "Emails exchanged with a candidate.", ["id"]),
      },
      { title: "Candidates", description: "Candidates: search, create, update, notes, tags, sources and tasks." },
    ),
    offers: router(
      {
        list: read(call, "/offers", "List jobs and talent pools. Query: include, view_mode (default, brief), limit. The scope and kind query params are deprecated by Recruitee; avoid them."),
        get: read(call, "/offers/{id}", "Retrieve a job or talent pool by id or slug.", ["id"]),
        create: write(call, "POST", "/offers", "Create a job or talent pool. body: { offer: { title, kind, department_id, description, requirements, ... } }."),
        update: write(call, "PATCH", "/offers/{id}", "Update an offer. body: { offer: {fields to change} }.", ["id"]),
        delete: write(call, "DELETE", "/offers/{id}", "Delete an offer.", ["id"], false),
        publish: write(call, "PATCH", "/offers/{id}/publish", "Publish an offer to the careers site.", ["id"], "optional"),
        unpublish: write(call, "PATCH", "/offers/{id}/unpublish", "Unpublish an offer.", ["id"], "optional"),
        close: write(call, "PATCH", "/offers/{id}/close", "Close an offer.", ["id"], "optional"),
        archive: write(call, "PATCH", "/offers/{id}/archive", "Archive an offer.", ["id"], "optional"),
        unarchive: write(call, "PATCH", "/offers/{id}/unarchive", "Unarchive an offer.", ["id"], "optional"),
        duplicate: write(call, "PATCH", "/offers/{id}/duplicate", "Duplicate an offer.", ["id"], "optional"),
        notes: read(call, "/offers/{offer_id}/notes", "List notes on an offer.", ["offer_id"]),
        addNote: write(call, "POST", "/offers/{offer_id}/notes", "Add a note to an offer. body: { note: { body } }.", ["offer_id"]),
        pipeline: read(call, "/offers/{offer_id}/pipeline_templates", "Pipeline templates assigned to an offer.", ["offer_id"]),
        addCandidate: write(
          call,
          "POST",
          "/offers/{offer_id}/candidates",
          "Create a candidate directly in an offer. body: { candidate: { name, emails, ... } }.",
          ["offer_id"],
        ),
      },
      { title: "Offers", description: "Jobs and talent pools." },
    ),
    placements: router(
      {
        forOffer: read(call, "/offers/{offer_id}/placements", "List candidate placements (applications) in an offer's pipeline.", ["offer_id"]),
        forStage: read(call, "/offers/{offer_id}/stages/{stage_id}/placements", "List placements in one pipeline stage.", ["offer_id", "stage_id"]),
        get: read(call, "/offers/{offer_id}/candidates/{candidate_id}/placement", "A candidate's placement in an offer.", ["offer_id", "candidate_id"]),
        create: write(call, "POST", "/placements", "Add an existing candidate to an offer. body: { candidate_id, offer_id | talent_pool_id }."),
        changeStage: write(call, "PATCH", "/placements/{id}/change_stage", "Move a placement to another stage. body: { stage_id }.", ["id"]),
        disqualify: write(call, "PATCH", "/placements/{id}/disqualify", "Disqualify a placement. body: { disqualify_reason_id, reason_text? }.", ["id"]),
        requalify: write(call, "PATCH", "/placements/{id}/requalify", "Requalify a disqualified placement.", ["id"], "optional"),
        hiringDetails: read(call, "/placements/{id}/hiring_details", "Hiring details (start date, work location) of a placement.", ["id"]),
        delete: write(call, "DELETE", "/placements/{id}", "Remove a placement from an offer.", ["id"], false),
      },
      { title: "Placements", description: "Candidate applications in job pipelines: stages, disqualification." },
    ),
    organization: router(
      {
        departments: read(call, "/departments", "List departments."),
        createDepartment: write(call, "POST", "/departments", "Create a department. body: { department: { name } }."),
        locations: read(call, "/locations", "List locations."),
        createLocation: write(call, "POST", "/locations", "Create a location. body: { location: { name, city, country_code, ... } }."),
        tags: read(call, "/tags", "List tags."),
        createTag: write(call, "POST", "/tags", "Create a tag. body: { tag: { name } }."),
        sources: read(call, "/sources", "List candidate sources."),
        talentPools: read(call, "/talent_pools", "List talent pools."),
        pipelineTemplates: read(call, "/pipeline_templates", "List pipeline templates and their stages."),
        disqualifyReasons: read(call, "/disqualify_reasons", "List disqualification reasons."),
        emailTemplates: read(call, "/email_templates", "List email templates."),
        customFieldsets: read(call, "/custom_fields/fieldsets", "List custom field sets."),
      },
      { title: "Organization", description: "Departments, locations, tags, sources, pipelines and other company configuration." },
    ),
    tasks: router(
      {
        list: read(call, "/tasks", "List tasks. Query: completed, admin_id, candidate_id, offer_id."),
        get: read(call, "/tasks/{id}", "Retrieve a task.", ["id"]),
        create: write(call, "POST", "/tasks", "Create a task. body: { task: { title, due_date, candidate_id, admin_ids } }."),
        update: write(call, "PATCH", "/tasks/{id}", "Update a task.", ["id"]),
        complete: write(call, "PATCH", "/tasks/{id}/completion", "Mark a task completed or open. body: { completed: boolean }.", ["id"]),
        delete: write(call, "DELETE", "/tasks/{id}", "Delete a task.", ["id"], false),
      },
      { title: "Tasks", description: "Recruiting to-dos assigned to team members." },
    ),
    interviews: router(
      {
        events: read(call, "/interview/events", "List interview events. Query: start_date, end_date, candidate_id, offer_id."),
        event: read(call, "/interview/events/{id}", "Retrieve an interview event.", ["id"]),
        schedule: write(call, "POST", "/interview/candidates/{candidate_id}/events", "Create an interview event for a candidate.", ["candidate_id"]),
        updateEvent: write(call, "PATCH", "/interview/events/{id}", "Update an interview event.", ["id"]),
        templates: read(call, "/interview/templates", "List interview kits (templates)."),
        results: read(call, "/interview/results", "List interview results (scorecards)."),
        candidateResults: read(call, "/interview/candidates/{candidate_id}/results/aggregated", "Aggregated interview results for a candidate.", ["candidate_id"]),
      },
      { title: "Interviews", description: "Interview events, kits and evaluation results." },
    ),
    audit: router(
      { log: read(call, "/audit_log", "Account audit log. Query: page, limit, filters.") },
      { title: "Audit", description: "Audit log." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { recruitee: recruitee.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.recruitee ?? [],
        (account) => withApprovals(build(client(account.fields, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Recruitee",
        description:
          "Recruitee applicant tracking: candidates, jobs (offers), pipeline placements, tasks, interviews, notes, tags and company setup. Pass path ids as numbers, filters in query and fields in body.",
        icons,
      },
    ),
  }),
);
