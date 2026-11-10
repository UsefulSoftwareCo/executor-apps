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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.lever.co/v1";


// Scope names come from the "Scopes" list at https://hire.lever.co/developer/documentation
// (<resource>:read:admin / <resource>:write:admin). Lever allows at most 20 scopes per app and
// write:admin already includes read:admin, so each resource appears once: write where a tool
// mutates it, read otherwise. Tools for resources not listed here (feedback and form templates,
// requisition fields, referrals, audit events, EEO responses) need a larger custom app or an API key.
const scopes = [
  "offline_access",
  ...[
    "contact",
    "feedback",
    "interviews",
    "notes",
    "opportunities",
    "panels",
    "postings",
    "requisitions",
    "users",
    "webhooks",
  ].map((resource) => `${resource}:write:admin`),
  ...[
    "applications",
    "archive_reasons",
    "files",
    "forms",
    "offers",
    "resumes",
    "sources",
    "stages",
    "tags",
  ].map((resource) => `${resource}:read:admin`),
];

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys are HTTP Basic with the key as username and a blank password; OAuth tokens are bearer tokens.
function authorization(account: Account): string {
  return account.method === "oauth"
    ? `Bearer ${account.fields.access_token}`
    : `Basic ${btoa(`${account.fields.token}:`)}`;
}

const lever = defineProvider({
  name: "Lever",
  // Lever says EU customers are redirected automatically to their data center but publishes no
  // separate EU host, so api.lever.co and auth.lever.co are the only documented destinations.
  hosts: ["api.lever.co", "auth.lever.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Lever OAuth apps are registered with Lever; the connect page asks for that app's client.
    oauth: oauth2({
      authorizationUrl: "https://auth.lever.co/authorize",
      tokenUrl: "https://auth.lever.co/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes,
      // Hosts, form-body client_id/client_secret and the required audience are documented at
      // https://hire.lever.co/developer/documentation (Step 1 and Step 3 of the OAuth flow).
      authorizationParams: { audience: "https://api.lever.co/v1/" },
    }),
  },
  // Needs the users:read:admin permission on the key or app.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users?limit=1`, {
      signal,
      headers: { Authorization: authorization(account) },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
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
        Authorization: authorization(account),
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

const listHelp =
  " Filters go in query (limit 1-100, offset from the previous response's next, include, expand, plus the filters in the Lever reference).";

function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }),
    },
    async (_ctx, input: Params) => call("GET", fill(path, input, ids), (input.query as Params | undefined) ?? {}),
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
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(body === "optional" ? { body: optionalPayload } : body ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, input, ids), (input.query as Params | undefined) ?? {}, body ? (input.body as Params | undefined) ?? {} : undefined),
  );
}

function fill(path: string, input: Params, ids: readonly string[]): string {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

const performAs = " Pass perform_as (a user id) in query to attribute the change to a user (required with OAuth tokens that act on behalf of an app).";

function build(call: Call) {
  const opp = "/opportunities/{opportunity}";
  const oid = ["opportunity"] as const;
  return router({
    opportunities: router(
      {
        list: read(call, "/opportunities", `List opportunities (candidates in a pipeline). Filters in query: posting_id, stage_id, archived, archived_posting_id, tag, email, origin, source, confidentiality, contact_id, created_at_start, created_at_end, updated_at_start, expand (applications, stage, owner, followers, sourcedBy, contact).${listHelp}`),
        get: read(call, opp, "Retrieve one opportunity. Use query.expand for applications, stage, owner and contact.", oid),
        deleted: read(call, "/opportunities/deleted", `List deleted opportunities. Filters in query: deleted_at_start, deleted_at_end.${listHelp}`),
        create: write(call, "POST", "/opportunities", `Create an opportunity. body: name, headline, emails, phones, links, tags, sources, stage, owner, postings, origin, createdAt, and so on.${performAs} Set query.parse=true to parse an attached resume.`),
        updateStage: write(call, "PUT", `${opp}/stage`, `Move an opportunity to another stage. body: { stage: <stage id> }.${performAs}`, oid),
        archive: write(call, "PUT", `${opp}/archived`, `Archive or unarchive an opportunity. body: { reason: <archive reason id>, cleanInterviews?, requisitionId?, ... }; use { reason: null } to unarchive.${performAs}`, oid),
        addTags: write(call, "POST", `${opp}/addTags`, `Add tags. body: { tags: ["..."] }.${performAs}`, oid),
        removeTags: write(call, "POST", `${opp}/removeTags`, `Remove tags. body: { tags: ["..."] }.${performAs}`, oid),
        addLinks: write(call, "POST", `${opp}/addLinks`, `Add links. body: { links: ["..."] }.${performAs}`, oid),
        removeLinks: write(call, "POST", `${opp}/removeLinks`, `Remove links. body: { links: ["..."] }.${performAs}`, oid),
        addSources: write(call, "POST", `${opp}/addSources`, `Add sources. body: { sources: ["..."] }.${performAs}`, oid),
        removeSources: write(call, "POST", `${opp}/removeSources`, `Remove sources. body: { sources: ["..."] }.${performAs}`, oid),
        applications: read(call, `${opp}/applications`, "List an opportunity's applications.", oid),
        resumes: read(call, `${opp}/resumes`, "List an opportunity's parsed resumes.", oid),
        files: read(call, `${opp}/files`, "List files attached to an opportunity.", oid),
        deleteFile: write(call, "DELETE", `${opp}/files/{file}`, "Delete a file from an opportunity.", ["opportunity", "file"], false),
        forms: read(call, `${opp}/forms`, "List profile forms completed for an opportunity.", oid),
        referrals: read(call, `${opp}/referrals`, "List referrals for an opportunity.", oid),
      },
      { title: "Opportunities", description: "Candidates in the hiring pipeline, their stage, tags, sources and files." },
    ),
    contacts: router(
      {
        get: read(call, "/contacts/{contact}", "Retrieve a contact by id.", ["contact"]),
        update: write(call, "PUT", "/contacts/{contact}", "Update a contact. body: name, headline, emails, phones [{type, value}], location (string, or object with country required). Omitted location parts are cleared.", ["contact"]),
      },
      { title: "Contacts", description: "People behind opportunities." },
    ),
    notes: router(
      {
        list: read(call, `${opp}/notes`, `List notes on an opportunity.${listHelp}`, oid),
        get: read(call, `${opp}/notes/{note}`, "Retrieve a note.", ["opportunity", "note"]),
        create: write(call, "POST", `${opp}/notes`, `Add a note. body: { value: "text", secret?: boolean, score?, notifyFollowers? }.${performAs}`, oid),
        delete: write(call, "DELETE", `${opp}/notes/{note}`, "Delete a note.", ["opportunity", "note"], false),
      },
      { title: "Notes", description: "Notes on opportunities." },
    ),
    interviews: router(
      {
        list: read(call, `${opp}/interviews`, `List interviews for an opportunity.${listHelp}`, oid),
        get: read(call, `${opp}/interviews/{interview}`, "Retrieve an interview.", ["opportunity", "interview"]),
        create: write(call, "POST", `${opp}/interviews`, `Schedule an interview. body: panel id or interview details (date, duration, interviewers, location, feedbackTemplate, ...).${performAs}`, oid),
        update: write(call, "PUT", `${opp}/interviews/{interview}`, `Update an interview. body holds the fields to change.${performAs}`, ["opportunity", "interview"]),
        delete: write(call, "DELETE", `${opp}/interviews/{interview}`, `Delete an interview.${performAs}`, ["opportunity", "interview"], false),
      },
      { title: "Interviews", description: "Interviews scheduled for opportunities." },
    ),
    panels: router(
      {
        list: read(call, `${opp}/panels`, `List interview panels for an opportunity.${listHelp}`, oid),
        get: read(call, `${opp}/panels/{panel}`, "Retrieve a panel.", ["opportunity", "panel"]),
        create: write(call, "POST", `${opp}/panels`, `Create a panel with its interviews. body: timezone, interviews [...], applications, note, externallyManaged.${performAs}`, oid),
        update: write(call, "PUT", `${opp}/panels/{panel}`, `Update a panel.${performAs}`, ["opportunity", "panel"]),
        delete: write(call, "DELETE", `${opp}/panels/{panel}`, `Delete a panel.${performAs}`, ["opportunity", "panel"], false),
      },
      { title: "Panels", description: "Interview panels (groups of interviews)." },
    ),
    feedback: router(
      {
        list: read(call, `${opp}/feedback`, `List feedback on an opportunity.${listHelp}`, oid),
        get: read(call, `${opp}/feedback/{feedback}`, "Retrieve a feedback form.", ["opportunity", "feedback"]),
        create: write(call, "POST", `${opp}/feedback`, `Create feedback. body: baseTemplateId, fieldValues, panel, interview, completedAt, ...${performAs}`, oid),
        update: write(call, "PUT", `${opp}/feedback/{feedback}`, `Update a feedback form.${performAs}`, ["opportunity", "feedback"]),
        delete: write(call, "DELETE", `${opp}/feedback/{feedback}`, `Delete a feedback form.${performAs}`, ["opportunity", "feedback"], false),
        templates: read(call, "/feedback_templates", `List feedback templates.${listHelp}`),
        template: read(call, "/feedback_templates/{template}", "Retrieve a feedback template.", ["template"]),
        createTemplate: write(call, "POST", "/feedback_templates", "Create a feedback template."),
        updateTemplate: write(call, "PUT", "/feedback_templates/{template}", "Update a feedback template.", ["template"]),
        deleteTemplate: write(call, "DELETE", "/feedback_templates/{template}", "Delete a feedback template.", ["template"], false),
      },
      { title: "Feedback", description: "Interview feedback and feedback templates." },
    ),
    offers: router(
      {
        list: read(call, `${opp}/offers`, `List offers for an opportunity.${listHelp}`, oid),
      },
      { title: "Offers", description: "Offers extended to opportunities." },
    ),
    postings: router(
      {
        list: read(call, "/postings", `List job postings. Filters in query: state (published, internal, closed, draft, pending, rejected), team, department, location, commitment, level, tag, group.${listHelp}`),
        get: read(call, "/postings/{posting}", "Retrieve a posting.", ["posting"]),
        deleted: read(call, "/postings/deleted", `List deleted postings.${listHelp}`),
        create: write(call, "POST", "/postings", `Create a posting. body: text, state, categories, owner, hiringManager, requisitionCodes, tags, ...${performAs}`),
        update: write(call, "PUT", "/postings/{posting}", `Update a posting.${performAs}`, ["posting"]),
        applicationQuestions: read(call, "/postings/{posting}/apply", "Get the application questions for a posting.", ["posting"]),
        apply: write(call, "POST", "/postings/{posting}/apply", "Submit an application to a posting on a candidate's behalf. body: name, email, phone, org, urls, comments, resume, customQuestions, ...", ["posting"]),
      },
      { title: "Postings", description: "Job postings and applications." },
    ),
    requisitions: router(
      {
        list: read(call, "/requisitions", `List requisitions. Filters in query: created_at_start, created_at_end, status, requisition_code, confidentiality.${listHelp}`),
        get: read(call, "/requisitions/{requisition}", "Retrieve a requisition.", ["requisition"]),
        create: write(call, "POST", "/requisitions", "Create a requisition."),
        update: write(call, "PUT", "/requisitions/{requisition}", "Update a requisition.", ["requisition"]),
        delete: write(call, "DELETE", "/requisitions/{requisition}", "Delete a requisition.", ["requisition"], false),
        fields: read(call, "/requisition_fields", `List requisition fields.${listHelp}`),
        field: read(call, "/requisition_fields/{field}", "Retrieve a requisition field.", ["field"]),
        createField: write(call, "POST", "/requisition_fields", "Create a requisition field."),
        updateField: write(call, "PUT", "/requisition_fields/{field}", "Update a requisition field.", ["field"]),
        deleteField: write(call, "DELETE", "/requisition_fields/{field}", "Delete a requisition field.", ["field"], false),
      },
      { title: "Requisitions", description: "Headcount requisitions and their custom fields." },
    ),
    pipeline: router(
      {
        stages: read(call, "/stages", `List pipeline stages.${listHelp}`),
        stage: read(call, "/stages/{stage}", "Retrieve a stage.", ["stage"]),
        archiveReasons: read(call, "/archive_reasons", "List archive reasons. Optional query.type: hired or non-hired."),
        archiveReason: read(call, "/archive_reasons/{reason}", "Retrieve an archive reason.", ["reason"]),
        dispositionStages: read(call, "/disposition_stages", "List stages and archive reasons together."),
        sources: read(call, "/sources", `List sources in use.${listHelp}`),
        tags: read(call, "/tags", `List tags in use.${listHelp}`),
      },
      { title: "Pipeline", description: "Stages, archive reasons, sources and tags." },
    ),
    forms: router(
      {
        templates: read(call, "/profile_form_templates", `List profile form templates.${listHelp}`),
        template: read(call, "/profile_form_templates/{template}", "Retrieve a profile form template.", ["template"]),
        createTemplate: write(call, "POST", "/profile_form_templates", "Create a profile form template."),
        updateTemplate: write(call, "PUT", "/profile_form_templates/{template}", "Update a profile form template.", ["template"]),
        deleteTemplate: write(call, "DELETE", "/profile_form_templates/{template}", "Delete a profile form template.", ["template"], false),
      },
      { title: "Forms", description: "Profile form templates." },
    ),
    users: router(
      {
        list: read(call, "/users", `List users. Filters in query: email, includeDeactivated.${listHelp}`),
        get: read(call, "/users/{user}", "Retrieve a user.", ["user"]),
        create: write(call, "POST", "/users", "Create a user. body: name, email, accessRole, ..."),
        update: write(call, "PUT", "/users/{user}", "Update a user.", ["user"]),
        deactivate: write(call, "POST", "/users/{user}/deactivate", "Deactivate a user.", ["user"], "optional"),
        reactivate: write(call, "POST", "/users/{user}/reactivate", "Reactivate a user.", ["user"], "optional"),
      },
      { title: "Users", description: "Lever account users." },
    ),
    webhooks: router(
      {
        list: read(call, "/webhooks", `List webhook subscriptions.${listHelp}`),
        create: write(call, "POST", "/webhooks", "Create a webhook. body: url, event."),
        update: write(call, "PUT", "/webhooks/{webhook}", "Update a webhook.", ["webhook"]),
        delete: write(call, "DELETE", "/webhooks/{webhook}", "Delete a webhook.", ["webhook"], false),
      },
      { title: "Webhooks", description: "Event subscriptions." },
    ),
    reports: router(
      {
        auditEvents: read(call, "/audit_events", "List audit events (paid add-on), newest first. Query: type, user_id, target_type, target_id, created_at_start, created_at_end."),
        eeoResponses: read(call, "/eeo/responses", "List anonymous EEO responses. Query: fromDate, toDate."),
        eeoResponsesPii: read(call, "/eeo/responses/pii", "List EEO responses with personal data. Query: expand (contact, hiringManager, posting), created_at_start, created_at_end."),
        deletedApplications: read(call, "/applications/deleted", "List deleted applications. Query deleted_at_start and deleted_at_end (ms, window at most 30 days) are required."),
      },
      { title: "Reports", description: "Audit events, EEO responses and deleted records." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { lever: lever.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lever ?? [],
        (account) => withApprovals(build(client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Lever",
        description:
          "Applicant tracking with Lever: opportunities, postings, interviews, feedback, notes, offers, requisitions, stages, users and webhooks. Pass filters in query and fields in body; list responses page with the offset token in next.",
        icons,
      },
    ),
  }),
);
