import {
  accountRouter,
  array,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Official API hosts (https://api.jotform.com/docs/): standard, EU and HIPAA accounts.
const regions: Record<string, string> = {
  us: "api.jotform.com",
  eu: "eu-api.jotform.com",
  hipaa: "hipaa-api.jotform.com",
};

type Fields = { token: string; region: string };

function baseUrl(region: string): string {
  const key = region.trim().toLowerCase();
  const found = regions[key] ?? Object.values(regions).find((h) => h === key);
  if (!found) throw new Error(`Unknown Jotform region "${region}". Use one of: ${Object.keys(regions).join(", ")}.`);
  return `https://${found}`;
}

const jotform = defineProvider({
  name: "Jotform",
  hosts: Object.values(regions),
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), region: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseUrl(account.fields.region)}/user`, { signal, headers: { APIKEY: account.fields.token } });
    await decodeJson(response, object({ content: object({ username: string() }) }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Jotform takes bracketed form fields (`question[type]=...`). Nested objects become `a[b][c]`.
function flatten(prefix: string, value: unknown, out: URLSearchParams) {
  if (value === undefined || value === null) return;
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [key, inner] of Object.entries(value)) flatten(`${prefix}[${key}]`, inner, out);
  } else if (Array.isArray(value)) {
    value.forEach((inner, index) => flatten(`${prefix}[${index}]`, inner, out));
  } else out.set(prefix, String(value));
}

function form(wrapper: string | undefined, body: Params | undefined) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(body ?? {})) {
    if (wrapper === undefined) {
      flatten(key, value, out);
      continue;
    }
    // Keys are sent verbatim: submission sub-fields stay `submission[4_first]` as in the docs.
    flatten(`${wrapper}[${key}]`, value, out);
  }
  return out;
}

const client = (fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) =>
  async (method: "GET" | "POST" | "PUT" | "DELETE", path: string, search: Params = {}, body?: URLSearchParams | string) => {
    const url = new URL(`${baseUrl(fields.region)}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        APIKEY: fields.token,
        ...(typeof body === "string" ? { "content-type": "application/json" } : body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(body === undefined ? {} : { body: typeof body === "string" ? body : body.toString() }),
    });
    const decoded = (await decodeJson(response, object({ content: json() }))) as { content: unknown };
    return decoded.content;
  };

type Call = ReturnType<typeof client>;

const page = {
  offset: number().optional(),
  limit: number().optional(),
  filter: record(json()).optional(),
  orderby: string().optional(),
};
const paging = (input: Params) => ({ offset: input.offset, limit: input.limit, filter: input.filter, orderby: input.orderby });
const fields = record(json());

function tools(call: Call) {
  const get = (description: string, path: (i: Params) => string, ids: Record<string, ReturnType<typeof string>> = {}, paged = false) =>
    query(
      { description, input: object({ ...ids, ...(paged ? page : {}) }) },
      async (_ctx, input: Params) => call("GET", path(input), paged ? paging(input) : {}),
    );
  const enc = (value: unknown) => encodeURIComponent(String(value));
  const formId = { formId: string() };

  return router({
    user: router(
      {
        get: get("Account details of the API key's owner: username, name, email, account type, status.", () => "/user"),
        usage: get("Monthly usage counters: submissions, SSL submissions, payments, uploads, and the plan's limits.", () => "/user/usage"),
        settings: get("Account settings (timezone, language, ...).", () => "/user/settings"),
        updateSettings: mutation(
          { description: "Update account settings. fields maps setting names (for example timezone, language) to values.", input: object({ fields }), approval: always() },
          async (_ctx, { fields: body }) => call("POST", "/user/settings", {}, form(undefined, body)),
        ),
        history: query(
          {
            description:
              "Account activity log. action is one of userLogin, formCreation, formUpdate, formDelete, formPurge, formRestore, formArchive, formUnarchive, formClone, formMove, formEmail, userUpdate, userLogout, all. date is lastWeek, lastMonth, last3Months, last6Months or all; sortBy is ASC or DESC; startDate and endDate are MM/DD/YYYY.",
            input: object({
              action: string().optional(),
              date: string().optional(),
              sortBy: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
            }),
          },
          async (_ctx, input: Params) => call("GET", "/user/history", input),
        ),
        subusers: get("List sub-users of the account.", () => "/user/subusers"),
        plan: get("Details of a Jotform plan by name (a plan name such as FREE).", (i) => `/system/plan/${enc(i.planName)}`, { planName: string() }),
      },
      { title: "User", description: "Account details, usage, settings and history." },
    ),
    forms: router(
      {
        list: get(
          "List forms in the account. filter is an object such as {\"status:ne\":\"DELETED\"}; orderby is a field name such as created_at; limit defaults to 20 (max 1000).",
          () => "/user/forms",
          {},
          true,
        ),
        get: get("Basic details of one form: title, status, URL, counts of submissions.", (i) => `/form/${enc(i.formId)}`, formId),
        create: mutation(
          {
            description:
              "Create a form. fields uses the API's nested shape, for example { properties: { title: \"Contact\" }, questions: { \"0\": { type: \"control_textbox\", text: \"Name\", order: \"1\", name: \"name\" } }, emails: { \"0\": { type: \"notification\", to: \"a@example.com\", from: \"default\", subject: \"New\" } } }.",
            input: object({ fields }),
            approval: always(),
          },
          async (_ctx, { fields: body }) => call("POST", "/user/forms", {}, form(undefined, body)),
        ),
        createMany: mutation(
          {
            description: "Create several forms at once. forms is an array of form objects shaped like the create tool's fields.",
            input: object({ forms: array(record(json())) }),
            approval: always(),
          },
          async (_ctx, { forms }) => call("PUT", "/user/forms", {}, JSON.stringify(forms)),
        ),
        clone: mutation(
          { description: "Clone a form and return the copy.", input: object(formId), approval: always() },
          async (_ctx, { formId: id }) => call("POST", `/form/${enc(id)}/clone`, {}, new URLSearchParams({ method: "post" })),
        ),
        delete: mutation(
          { description: "Delete a form (moves it to the trash).", input: object(formId), approval: always() },
          async (_ctx, { formId: id }) => call("DELETE", `/form/${enc(id)}`),
        ),
        files: get("List files uploaded to a form's submissions.", (i) => `/form/${enc(i.formId)}/files`, formId),
      },
      { title: "Forms", description: "List, create, clone and delete forms." },
    ),
    questions: router(
      {
        list: get("List a form's questions with their ids, types and properties.", (i) => `/form/${enc(i.formId)}/questions`, formId),
        get: get("One question's properties.", (i) => `/form/${enc(i.formId)}/question/${enc(i.questionId)}`, { ...formId, questionId: string() }),
        create: mutation(
          {
            description: "Add a question. fields holds its properties, for example { type: \"control_textbox\", text: \"Your name\", order: \"2\", name: \"yourName\" }.",
            input: object({ ...formId, fields }),
            approval: always(),
          },
          async (_ctx, { formId: id, fields: body }) => call("POST", `/form/${enc(id)}/questions`, {}, form("question", body)),
        ),
        createMany: mutation(
          {
            description: "Add several questions at once. questions is an array of question property objects (type, text, order, name, ...).",
            input: object({ ...formId, questions: array(record(json())) }),
            approval: always(),
          },
          async (_ctx, { formId: id, questions }) => call("PUT", `/form/${enc(id)}/questions`, {}, JSON.stringify(questions)),
        ),
        update: mutation(
          { description: "Edit properties of one question, for example { text: \"New label\", required: \"Yes\" }.", input: object({ ...formId, questionId: string(), fields }), approval: always() },
          async (_ctx, { formId: id, questionId, fields: body }) => call("POST", `/form/${enc(id)}/question/${enc(questionId)}`, {}, form("question", body)),
        ),
        delete: mutation(
          { description: "Delete a question from a form.", input: object({ ...formId, questionId: string() }), approval: always() },
          async (_ctx, { formId: id, questionId }) => call("DELETE", `/form/${enc(id)}/question/${enc(questionId)}`),
        ),
      },
      { title: "Questions", description: "The fields on a form." },
    ),
    properties: router(
      {
        list: get("All properties of a form (title, height, emails, thank-you page, ...).", (i) => `/form/${enc(i.formId)}/properties`, formId),
        get: get("One form property by key (for example title or activeRedirect).", (i) => `/form/${enc(i.formId)}/properties/${enc(i.key)}`, { ...formId, key: string() }),
        set: mutation(
          { description: "Set form properties, for example { title: \"New title\", height: \"600\" }.", input: object({ ...formId, fields }), approval: always() },
          async (_ctx, { formId: id, fields: body }) => call("POST", `/form/${enc(id)}/properties`, {}, form("properties", body)),
        ),
        setMany: mutation(
          { description: "Set form properties from a JSON object sent as one body (use for nested properties).", input: object({ ...formId, properties: record(json()) }), approval: always() },
          async (_ctx, { formId: id, properties }) => call("PUT", `/form/${enc(id)}/properties`, {}, JSON.stringify(properties)),
        ),
      },
      { title: "Properties", description: "Form-level settings." },
    ),
    submissions: router(
      {
        listAll: get(
          "List submissions across all forms. filter is an object such as {\"created_at:gt\":\"2026-01-01 00:00:00\"}; orderby is a field name like created_at.",
          () => "/user/submissions",
          {},
          true,
        ),
        listForForm: get(
          "List submissions of one form with answers keyed by question id. filter is an object such as {\"created_at:gt\":\"2026-01-01 00:00:00\"}; orderby is a field name like created_at.",
          (i) => `/form/${enc(i.formId)}/submissions`,
          formId,
          true,
        ),
        get: get("One submission with all answers.", (i) => `/submission/${enc(i.submissionId)}`, { submissionId: string() }),
        create: mutation(
          {
            description:
              "Submit answers to a form. fields maps question ids to answers; sub-fields use QID_sub, for example { \"3\": \"text\", \"4_first\": \"Ada\", \"4_last\": \"Lovelace\" }.",
            input: object({ ...formId, fields }),
            approval: always(),
          },
          async (_ctx, { formId: id, fields: body }) => call("POST", `/form/${enc(id)}/submissions`, {}, form("submission", body)),
        ),
        createMany: mutation(
          {
            description: "Submit several submissions at once. submissions is an array of objects mapping question ids to answers.",
            input: object({ ...formId, submissions: array(record(json())) }),
            approval: always(),
          },
          async (_ctx, { formId: id, submissions }) => call("PUT", `/form/${enc(id)}/submissions`, {}, JSON.stringify(submissions)),
        ),
        update: mutation(
          { description: "Edit a submission's answers (same field shape as create). Also accepts flag, new and status.", input: object({ submissionId: string(), fields }), approval: always() },
          async (_ctx, { submissionId, fields: body }) => call("POST", `/submission/${enc(submissionId)}`, {}, form("submission", body)),
        ),
        delete: mutation(
          { description: "Delete a submission.", input: object({ submissionId: string() }), approval: always() },
          async (_ctx, { submissionId }) => call("DELETE", `/submission/${enc(submissionId)}`),
        ),
      },
      { title: "Submissions", description: "Read, create, edit and delete form responses." },
    ),
    reports: router(
      {
        list: get("List reports across the account.", () => "/user/reports"),
        listForForm: get("List reports of one form.", (i) => `/form/${enc(i.formId)}/reports`, formId),
        get: get("One report, including its share URL.", (i) => `/report/${enc(i.reportId)}`, { reportId: string() }),
        create: mutation(
          {
            description: "Create a report on a form. fields: title, list_type (csv, excel, grid, table, rss), and optionally fields (comma-separated question ids).",
            input: object({ ...formId, fields }),
            approval: always(),
          },
          async (_ctx, { formId: id, fields: body }) => call("POST", `/form/${enc(id)}/reports`, {}, form(undefined, body)),
        ),
        delete: mutation(
          { description: "Delete a report.", input: object({ reportId: string() }), approval: always() },
          async (_ctx, { reportId }) => call("DELETE", `/report/${enc(reportId)}`),
        ),
      },
      { title: "Reports", description: "Report views and exports of submissions." },
    ),
    folders: router(
      {
        list: get("Folder tree with the forms inside each folder.", () => "/user/folders"),
        get: get("One folder with its forms and subfolders.", (i) => `/folder/${enc(i.folderId)}`, { folderId: string() }),
        create: mutation(
          { description: "Create a folder. fields: name, and optionally parent (folder id) and color (hex like #FF0000).", input: object({ fields }), approval: always() },
          async (_ctx, { fields: body }) => call("POST", "/folder", {}, form(undefined, body)),
        ),
        update: mutation(
          {
            description: "Update a folder from a JSON object: name, color, parent, and forms (array of form ids to put in it).",
            input: object({ folderId: string(), properties: record(json()) }),
            approval: always(),
          },
          async (_ctx, { folderId, properties }) => call("PUT", `/folder/${enc(folderId)}`, {}, JSON.stringify(properties)),
        ),
        delete: mutation(
          { description: "Delete a folder and its subfolders. Forms inside are not deleted.", input: object({ folderId: string() }), approval: always() },
          async (_ctx, { folderId }) => call("DELETE", `/folder/${enc(folderId)}`),
        ),
      },
      { title: "Folders", description: "Organise forms into folders." },
    ),
    webhooks: router(
      {
        list: get("List a form's webhook URLs.", (i) => `/form/${enc(i.formId)}/webhooks`, formId),
        create: mutation(
          { description: "Register a webhook URL that receives each new submission of the form.", input: object({ ...formId, webhookURL: string() }), approval: always() },
          async (_ctx, { formId: id, webhookURL }) => call("POST", `/form/${enc(id)}/webhooks`, {}, new URLSearchParams({ webhookURL })),
        ),
        delete: mutation(
          { description: "Remove a webhook from a form by its index from the list tool.", input: object({ ...formId, webhookId: string() }), approval: always() },
          async (_ctx, { formId: id, webhookId }) => call("DELETE", `/form/${enc(id)}/webhooks/${enc(webhookId)}`),
        ),
      },
      { title: "Webhooks", description: "Notify an HTTP endpoint on each submission." },
    ),
  });
}

export default defineApp({ user: { accounts: { jotform: jotform.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.jotform ?? [], (account) => tools(client(account.fields, fetch, signal)), { signal }),
    {
      title: "Jotform",
      description: "Build forms and read, create and manage their submissions, reports, folders and webhooks in Jotform.",
      icons,
    },
  ),
}));
