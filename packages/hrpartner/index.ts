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
  boolean,
  array,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.hrpartner.io";

const hrpartner = defineProvider({
  name: "HR Partner",
  hosts: ["api.hrpartner.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /company returns the company profile; it is read-only and cheap.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/company`, { signal, headers: { "x-api-key": account.fields.token } });
    const company = await decodeJson(response, object({ name: string(), slug: string() }));
    return { accountInfo: { externalId: company.slug, displayName: company.name } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "x-api-key": account.fields.token, Accept: "application/json" });

const search = (params: Readonly<Record<string, string>> | undefined) => new URLSearchParams(params ?? {}).toString();

const filters = record(string());

const hrpartnerTools = (account: Account, signal: AbortSignal) => {
  const list = (path: string, description: string) =>
    query(
      { description, input: object({ filters: filters.optional() }) },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}${path}?${search(input.filters)}`, { signal, headers: headers(account) }), json()),
    );
  return router({
    employees: list("/employees", "List employees. Filters include search, department, location, group, position, employment_status, gender_identity, pay_point, tag, reports_to (employee code), is_active, is_terminated, can_logon, eligible_for_rehire, and birth_date_from/to, start_date_from/to, end_date_from/to (yyyy-mm-dd). Department and location accept comma-separated names. Pass extra query parameters in filters."),
    contacts: list("/contacts", "List employee emergency and other contacts. Accepts the same employee filters as employees (employee code, department, location...). Pass extra query parameters in filters."),
    addresses: list("/addresses", "List employee addresses. Accepts the same employee filters as employees. Pass extra query parameters in filters."),
    goals: list("/goals", "List goals. Filters include employee (code), goal_scope, goal_is_active, goal_is_completed, goal_type (comma-separated), description, due_date_from/to. Pass extra query parameters in filters."),
    checklists: list("/checklist", "List onboarding and other checklists. Filters include employee, checklist_status (complete/incomplete), checklist_template, assigned_date_from/to, show_details=1. Pass extra query parameters in filters."),
    absences: list("/absences", "List employee absences. Filters include employee, physician, absence_reason, absence_status, absence_date_from/to, type (added/taken), location, show_linked_request. Pass extra query parameters in filters."),
    assets: list("/assets", "List company assets assigned to employees. Filters include department, description, asset_type, in_date_from/to. Pass extra query parameters in filters."),
    attachments: list("/attachments", "List employee attachment metadata. Filters include employee, description, module, uploaded_date_from/to. Pass extra query parameters in filters."),
    benefits: list("/benefits", "List employee benefits. Filters include department, benefit_status, description, benefit_value_from/to, benefit_value_period, start_date_from/to. Pass extra query parameters in filters."),
    dependents: list("/dependents", "List employee dependents. Filters include employee, name. Pass extra query parameters in filters."),
    education: list("/education", "List employee education records. Filters include employee, education_type, education_status, department, commence_date_from/to. Pass extra query parameters in filters."),
    grievances: list("/grievances", "List grievances. Filters include grievance_type, grievance_status, department, actioned_by, reported_date_from/to. Pass extra query parameters in filters."),
    interviews: list("/interviews", "List employee interviews. Filters include interview_type, department, interviewer, description, interview_date_from/to. Pass extra query parameters in filters."),
    notes: list("/notes", "List employee notes. Filters include employee, note, tags (comma-separated), include_events, created_date_from/to, updated_date_from/to. Pass extra query parameters in filters."),
    positions: list("/positions", "List employee position history. Filters include department, position, remuneration_from/to, commence_date_from/to, completion_date_from/to. Pass extra query parameters in filters."),
    renewables: list("/renewables", "List renewable items such as licences and certificates. Filters include renewable_type, department, description, renewal_date_from/to. Pass extra query parameters in filters."),
    reviews: list("/reviews", "List employee reviews. Filters include department, review_type, review_status, reviewer, score_from/to, review_date_from/to. Pass extra query parameters in filters."),
    skills: list("/skills", "List employee skills. Filters include department, skill_name, skill_rating, skill_rating_from/to. Pass extra query parameters in filters."),
    training: list("/training", "List employee training records. Filters include department, training_type, training_status, cost_from/to, reimbursement_from/to, commence_date_from/to. Pass extra query parameters in filters."),
    birthdays: list("/birthdays", "List upcoming employee birthdays. Filters include department, location, start_month, end_month (1-12). Pass extra query parameters in filters."),
    anniversaries: list("/anniversaries", "List employee work anniversaries. Filters include department, location, position, start_month, end_month (1-12), selected_year. Pass extra query parameters in filters."),
    libraryDocuments: list("/library", "List documents in the company document library. Pass extra query parameters in filters."),
    libraryCategories: list("/library_categories", "List library categories. Pass extra query parameters in filters."),
    reminders: list("/reminders", "List reminders. Filters include employee, user (admin email), department, module, notification_sent. Pass extra query parameters in filters."),
    jobs: list("/jobs", "List job listings. Filters include search, department, location (comma-separated), is_active, publish_on_internet, response_email, publish_at_from/to. Pass extra query parameters in filters."),
    applicants: list("/applicants", "List recruitment applicants. Filter: search (first name, last name or email text). Pass extra query parameters in filters."),
    stageTracking: list("/stage/track", "List application stage movements (capped at 500 records, so always filter). Filters include job, applicant (email or id), from_stage, to_stage, changed_at_from/to. Pass extra query parameters in filters."),
    timesheets: list("/timesheets", "List timesheets grouped by template, sequence, employee and entries. Large; filter by date range or employee. Filters include employee, department, location, group, timesheet_name, timesheet_date_from/to (both required together), sequence_start_date, sequence_end_date, status (new/submitted/accepted/rejected/processed), project, activity, is_approved, is_exported, is_locked. Pass extra query parameters in filters."),
    projects: list("/projects", "List projects and activities. Filters include employee, project, activity, currency. Pass extra query parameters in filters."),
    leaveRequests: list("/leave_requests", "List leave requests. Filters include employee, absence_reason, reason, leave_request_type (added/taken), leave_start_date_from/to. Pass extra query parameters in filters."),
    leaveBalances: list("/leave_balances", "List leave balances. Filters include employee, absence_reason, department, is_terminated. Pass extra query parameters in filters."),
    performances: list("/performances", "List performance management reviews. Filters include location, review_status, assigned_date_from/to, review_date_from/to, form_data (employee,manager), include_answers. Pass extra query parameters in filters."),
    company: query(
      {
        description:
          "Get basic company data: name, subscription expiry, employee limits and counts, timezone and SMS credits. Set customFields to include custom field definitions and activeModules to include enabled modules and feature flags.",
        input: object({ customFields: boolean().optional(), activeModules: boolean().optional() }),
      },
      async ({ fetch }, input) => {
        const params = new URLSearchParams();
        if (input.customFields === true) params.set("custom_fields", "true");
        if (input.activeModules === true) params.set("active_modules", "true");
        return decodeJson(await fetch(`${base}/company?${params}`, { signal, headers: headers(account) }), json());
      },
    ),
    employee: query(
      {
        description: "Get one employee by employee code, including custom data and full details.",
        input: object({ employeeCode: string() }),
      },
      async ({ fetch }, { employeeCode }) =>
        decodeJson(
          await fetch(`${base}/employee/${encodeURIComponent(employeeCode)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    lookup: query(
      {
        description:
          "Get a lookup list by name, for example asset_types, positions or tags. These are the valid values for fields on other endpoints.",
        input: object({ lookupName: string() }),
      },
      async ({ fetch }, { lookupName }) =>
        decodeJson(
          await fetch(`${base}/lookups/${encodeURIComponent(lookupName)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    libraryCategoryDocuments: query(
      {
        description: "List library documents within one category, by category slug.",
        input: object({ categorySlug: string() }),
      },
      async ({ fetch }, { categorySlug }) =>
        decodeJson(
          await fetch(`${base}/library/${encodeURIComponent(categorySlug)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    reminder: query(
      { description: "Get one reminder by id.", input: object({ reminderId: string() }) },
      async ({ fetch }, { reminderId }) =>
        decodeJson(
          await fetch(`${base}/reminder/${encodeURIComponent(reminderId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    job: query(
      {
        description: "Get one job listing by its slug id, including custom form question fields.",
        input: object({ jobId: string() }),
      },
      async ({ fetch }, { jobId }) =>
        decodeJson(await fetch(`${base}/job/${encodeURIComponent(jobId)}`, { signal, headers: headers(account) }), json()),
    ),
    applicant: query(
      {
        description: "Get one applicant by applicant id or email address, including their job applications.",
        input: object({ applicantId: string() }),
      },
      async ({ fetch }, { applicantId }) =>
        decodeJson(
          await fetch(`${base}/applicant/${encodeURIComponent(applicantId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    applications: query(
      {
        description:
          "List job applications for one job listing (a job id is required; there is no all-jobs list). Filters include source, stage, submitted_at_from/to, is_flagged, is_archived, is_hired, is_read.",
        input: object({ jobId: string(), filters: filters.optional() }),
      },
      async ({ fetch }, { jobId, filters: f }) =>
        decodeJson(
          await fetch(`${base}/applications/${encodeURIComponent(jobId)}?${search(f)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    application: query(
      { description: "Get one job application by application id.", input: object({ applicationId: string() }) },
      async ({ fetch }, { applicationId }) =>
        decodeJson(
          await fetch(`${base}/application/${encodeURIComponent(applicationId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    singleTimesheet: query(
      {
        description:
          "Get the timesheet for one employee and one sequence. sequence is the exact label, for example 'Mon, 01 Jan 2024 to Sun, 07 Jan 2024'.",
        input: object({ employee: string(), sequence: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/singletimesheet?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    expenses: query(
      {
        description:
          "List expense claims. reportType is detailed (headers with lines and attachments), summary (headers only) or transaction (expense lines only). Filters include employee, department, location (comma-separated), expense_date_from/to, submitted_date_from/to, is_paid, project.",
        input: object({ reportType: string(), filters: filters.optional() }),
      },
      async ({ fetch }, { reportType, filters: f }) =>
        decodeJson(
          await fetch(`${base}/expenses?${search({ ...f, report_type: reportType })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    leaveRequest: query(
      { description: "Get one leave request by id.", input: object({ leaveRequestId: string() }) },
      async ({ fetch }, { leaveRequestId }) =>
        decodeJson(
          await fetch(`${base}/leave_request/${encodeURIComponent(leaveRequestId)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    upsertEmployee: mutation(
      {
        description:
          "Add a new employee, or update the one whose code matches. employee is the JSON body: code (required), first_names, last_name, full_name, salutation, date_of_birth, gender_identity, pay_point, tax_number, started_at, finished_at, is_active, is_terminated, can_logon and more, mirroring the shape returned by employee.",
        input: object({ employee: record(json()) }),
        approval: always(),
      },
      async ({ fetch }, { employee }) =>
        decodeJson(
          await fetch(`${base}/employee`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(employee),
          }),
          json(),
        ),
    ),
    updateReminder: mutation(
      {
        description:
          "Update a reminder's description or flags. The employee, admin user and date cannot change. id is required in the body as well as the path.",
        input: object({
          id: number(),
          description: string().optional(),
          sendNotification: boolean().optional(),
          notificationSent: boolean().optional(),
          active: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/reminder/${input.id}`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({
              id: input.id,
              description: input.description,
              send_notification: input.sendNotification,
              notification_sent: input.notificationSent,
              active: input.active,
            }),
          }),
          json(),
        ),
    ),
    deleteReminder: mutation(
      {
        description: "Permanently delete a reminder. There is no undo.",
        input: object({ reminderId: number() }),
        approval: always(),
      },
      async ({ fetch }, { reminderId }) => {
        const response = await fetch(`${base}/reminder/${reminderId}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        if (!response.ok) throw new Error(`HR Partner returned ${response.status}`);
        return { deleted: true };
      },
    ),
    upsertApplicant: mutation(
      {
        description:
          "Add or update an applicant by email. jobApplications optionally moves them into a stage of a job: each entry has id (job listing slug) and stage (an existing stage name).",
        input: object({
          email: string(),
          firstNames: string().optional(),
          lastName: string().optional(),
          jobApplications: array(object({ id: string(), stage: string().optional() })).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/applicant`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({
              email: input.email,
              first_names: input.firstNames,
              last_name: input.lastName,
              job_applications: input.jobApplications,
            }),
          }),
          json(),
        ),
    ),
    upsertApplication: mutation(
      {
        description:
          "Create a job application (omit id) or update one (give its numeric id). applicant needs email (and optionally first_names, last_name); jobListing is the job slug; stage is an existing stage name (an unknown name falls back to the default stage); customFormAnswers maps custom form field names to answers. Creates the applicant when the email is new.",
        input: object({
          id: number().optional(),
          applicantEmail: string(),
          applicantFirstNames: string().optional(),
          applicantLastName: string().optional(),
          jobListing: string(),
          stage: string().optional(),
          customFormAnswers: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/application`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({
              id: input.id,
              applicant: {
                email: input.applicantEmail,
                first_names: input.applicantFirstNames,
                last_name: input.applicantLastName,
              },
              job_listing: { id: input.jobListing },
              stage: input.stage === undefined ? undefined : { name: input.stage },
              custom_form:
                input.customFormAnswers === undefined ? undefined : { answers: input.customFormAnswers },
            }),
          }),
          json(),
        ),
    ),
    addTimeclockEntry: mutation(
      {
        description:
          "Add a timesheet/timeclock entry for an employee on an open sequence. Give employeeCode or employeeEmail. startTime and endTime are local 'yyyy-mm-dd hh:mm'. duration and breakMinutes are optional numbers; projectName and activityName must already exist. Requires the timeclock module.",
        input: object({
          employeeCode: string().optional(),
          employeeEmail: string().optional(),
          startTime: string(),
          endTime: string(),
          duration: number().optional(),
          breakMinutes: number().optional(),
          notes: string().optional(),
          projectName: string().optional(),
          activityName: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const form = new FormData();
        const fields: Record<string, string | number | undefined> = {
          employee_code: input.employeeCode,
          employee_email: input.employeeEmail,
          start_time: input.startTime,
          end_time: input.endTime,
          duration: input.duration,
          break: input.breakMinutes,
          notes: input.notes,
          project_name: input.projectName,
          activity_name: input.activityName,
        };
        for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.set(key, String(value));
        return decodeJson(
          await fetch(`${base}/timeclock`, { method: "POST", signal, headers: headers(account), body: form }),
          json(),
        );
      },
    ),
  });
};

export default defineApp({ user: { accounts: { hrpartner: hrpartner.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.hrpartner ?? [], (account) => hrpartnerTools(account, signal), { signal }), {
    title: "HR Partner",
    description:
      "Read HR Partner employee records, leave, absences, recruitment, timesheets, expenses, goals, reviews and reminders, and write employees, applicants, applications, reminders and time entries.",
    icons,
  }),
}));
