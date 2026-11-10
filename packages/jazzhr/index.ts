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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://api.resumatorapi.com/v1";

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const jazzhr = defineProvider({
  name: "JazzHR",
  hosts: ["api.resumatorapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`${BASE}/users`);
    url.searchParams.set("apikey", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, json());
  },
});

const stringFields = (names: readonly string[]) =>
  Object.fromEntries(names.map((name) => [name, string().optional()]));

// JazzHR filters are path segments: /applicants/city/Austin/page/2.
const listPath = (base: string, input: Params) => {
  const segments = Object.entries(input).flatMap(([key, value]) =>
    value === undefined || value === null || value === "" ? [] : [key, encodeURIComponent(String(value))],
  );
  return segments.length === 0 ? base : `${base}/${segments.join("/")}`;
};

function build(token: string, fetchFn: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: "GET" | "POST", path: string, body?: Params) => {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("apikey", token);
    const response = await fetchFn(url.toString(), {
      method,
      signal,
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const list = (path: string, description: string, filters: readonly string[]) =>
    query(
      {
        description: `${description} Returns at most 100 results per page; use page to read more.`,
        input: object({ ...stringFields(filters), page: number().optional() }),
      },
      async (_ctx, input: Params) => call("GET", listPath(path, input)),
    );

  const get = (path: string, idName: string, description: string) =>
    query(
      { description, input: object({ [idName]: string({ minLength: 1 }) }) },
      async (_ctx, input: Params) => call("GET", `${path}/${encodeURIComponent(String(input[idName]))}`),
    );

  const create = (path: string, description: string, required: readonly string[], optional: readonly string[]) =>
    mutation(
      {
        description,
        input: object({
          ...Object.fromEntries(required.map((name) => [name, string({ minLength: 1 })])),
          ...stringFields(optional),
        }),
      },
      async (_ctx, input: Params) => call("POST", path, input),
    );

  const dates = ["from_date", "to_date"] as const;

  return router({
    applicants: router(
      {
        list: list("/applicants", "Find applicants by name, city, job, recruiter, apply date range, status or rating.", [
          "name", "city", "job_id", "job_title", "recruiter_id", "apply_date", "from_apply_date", "to_apply_date", "status", "rating",
        ]),
        get: get("/applicants", "applicant_id", "Get one applicant by ID, including contact details, answers and attachments."),
        create: create(
          "/applicants",
          "Create an applicant. Setting job assigns the applicant to a job. JazzHR advises against using this to submit real candidate applications; it does not trigger workflow automation.",
          ["first_name", "last_name", "email"],
          [
            "apply_date", "address", "city", "state", "postal", "phone", "job", "workflow_step_id", "coverletter", "source", "referral",
            "license", "cdl", "relocate", "citizen", "college", "gpa", "over18", "flighthours", "flightgrade", "linkedin", "twitter",
            "website", "languages", "salary", "start", "weekends", "evenings", "overtime", "felony", "felonyexplain", "wmyu", "references",
            "eeo_gender", "eeo_race", "eeo_disability", "eeoc_veteran", "eeoc_disability", "eeoc_disability_signature", "eeoc_disability_date",
            "resumetext", "base64-resume",
          ],
        ),
      },
      { title: "Applicants", description: "Candidates who applied or were added as prospects." },
    ),
    applicantJobs: router(
      {
        list: list("/applicants2jobs", "List applicant-to-job mappings (an applicant's application to a job and its workflow step).", [
          "applicant_id", "job_id", "rating", "workflow_step_id",
        ]),
        get: get("/applicants2jobs", "appjob_id", "Get one applicant-to-job mapping by ID."),
        create: create("/applicants2jobs", "Attach an existing applicant to a job.", ["applicant_id", "job_id"], [
          "workflow_step_id", "rating", "submission_date",
        ]),
        hires: list("/hires", "List candidates who were hired.", []),
      },
      { title: "Applicant jobs", description: "Mappings between applicants and the jobs they applied to, and hires." },
    ),
    jobs: router(
      {
        list: list("/jobs", "Find jobs by title, recruiter, board code, department, hiring lead, location, open date range, status or visibility.", [
          "title", "recruiter", "board_code", "department", "hiring_lead", "state", "city", "from_open_date", "to_open_date", "status",
          "confidential", "private",
        ]),
        get: get("/jobs", "job_id", "Get one job by ID, including description, location and board code."),
        create: create(
          "/jobs",
          "Create a job.",
          ["title", "hiring_lead_id", "employment_type", "minimum_experience", "description", "country", "workflow_id"],
          [
            "confidential", "private", "department", "job_status", "state", "city", "postal_code", "syndication", "canned_address",
            "canned_cover_letter", "canned_references", "canned_wmyu", "canned_linked_in", "canned_website", "canned_twitter_username",
            "canned_start", "canned_weekends", "canned_evenings", "canned_overtime", "canned_languages", "canned_salary", "canned_referral",
            "canned_license", "canned_cdl", "canned_relocate", "canned_citizen", "canned_education", "canned_college", "canned_gpa",
            "canned_over18", "canned_flighthours", "canned_flightgrade", "canned_felony",
          ],
        ),
      },
      { title: "Jobs", description: "Job openings." },
    ),
    categories: router(
      {
        list: list("/categories", "List categories (applicant groupings) by user, name, status or creation date range.", [
          "user_id", "name", "status", "from_creation_date", "to_creation_date",
        ]),
        get: get("/categories", "category_id", "Get one category by ID."),
        create: create("/categories", "Create a category.", ["name"], ["status"]),
        listApplicants: list("/categories2applicants", "List category-to-applicant assignments.", ["applicant_id", "category_id"]),
        getApplicantAssignment: get("/categories2applicants", "pro2cat_id", "Get one category-to-applicant assignment by ID."),
        addApplicant: create("/categories2applicants", "Add an applicant to a category.", ["applicant_id", "category_id"], []),
      },
      { title: "Categories", description: "Categories used to group applicants." },
    ),
    contacts: router(
      {
        list: list("/contacts", "List contacts, optionally by date range.", dates),
        get: get("/contacts", "contact_id", "Get one contact by ID."),
      },
      { title: "Contacts", description: "Contacts stored in JazzHR." },
    ),
    activities: router(
      {
        list: list("/activities", "List activity log entries by user, object, or category.", ["user_id", "object_id", "category"]),
        get: get("/activities", "activity_id", "Get one activity by ID."),
      },
      { title: "Activities", description: "The account activity log." },
    ),
    notes: router(
      { create: create("/notes", "Add a note to an applicant.", ["applicant_id"], ["user_id", "contents", "security"]) },
      { title: "Notes", description: "Notes on applicants." },
    ),
    files: router(
      {
        list: list("/files", "List file records by user, applicant or creation date range. File contents cannot be downloaded through the API.", [
          "user_id", "applicant_id", "from_creation_date", "to_creation_date",
        ]),
        get: get("/files", "file_id", "Get file metadata by ID. File contents cannot be downloaded through the API."),
        upload: create("/files", "Attach a file to an applicant. file_data is the base64-encoded file content.", [
          "applicant_id", "filename", "file_data",
        ], ["user_id", "file_privacy"]),
      },
      { title: "Files", description: "Files attached to applicants." },
    ),
    questionnaires: router(
      {
        list: list("/questionnaires", "List questionnaires.", []),
        get: get("/questionnaires", "questionnaire_id", "Get one questionnaire by ID."),
        questions: query(
          {
            description: "List the questions of a questionnaire.",
            input: object({ questionnaire_id: string({ minLength: 1 }), question_status: string().optional() }),
          },
          async (_ctx, input: Params) => call("GET", listPath("/questionnaire_questions", input)),
        ),
        answers: list("/questionnaire_answers", "List questionnaire answers by questionnaire, applicant or job.", [
          "questionnaire_id", "applicant_id", "job_id",
        ]),
        submitAnswers: create(
          "/questionnaire_answers",
          "Submit questionnaire answers for an applicant (answer_value_01 to answer_value_20 in question order).",
          ["applicant_id", "questionnaire_id"],
          ["job_id", ...Array.from({ length: 20 }, (_, i) => `answer_value_${String(i + 1).padStart(2, "0")}`)],
        ),
      },
      { title: "Questionnaires", description: "Screening questionnaires, their questions and applicant answers." },
    ),
    tasks: router(
      {
        list: list("/tasks", "List tasks by date range or status.", [...dates, "status"]),
        get: get("/tasks", "task_id", "Get one task by ID."),
      },
      { title: "Tasks", description: "Recruiter tasks." },
    ),
    users: router(
      {
        list: list("/users", "List users by name, email or type.", ["name", "email", "type"]),
        get: get("/users", "user_id", "Get one user by ID."),
      },
      { title: "Users", description: "Users of the JazzHR account." },
    ),
    workflows: router(
      {
        list: list("/workflows", "List hiring workflows and their steps.", []),
        get: get("/workflows", "workflow_id", "Get one workflow by ID, including its steps."),
      },
      { title: "Workflows", description: "Hiring workflows (pipelines) and their steps." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { jazzhr: jazzhr.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.jazzhr ?? [], (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal }),
      {
        title: "JazzHR",
        description: "JazzHR applicant tracking: applicants, jobs, workflows, categories, notes, tasks, questionnaires and hires.",
        icons,
      },
    ),
  }),
);
