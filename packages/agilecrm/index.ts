import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Agile CRM account lives on https://<domain>.agilecrm.com (Admin Settings > API & Analytics).
const domainPattern = /^[a-z0-9][a-z0-9-]*$/;

type Fields = { domain: string; email: string; token: string };

function origin(account: { fields: Fields }) {
  const domain = account.fields.domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.agilecrm\.com.*$/, "")
    .replace(/\/.*$/, "");
  if (!domainPattern.test(domain))
    throw new Error("Enter your Agile CRM domain, for example mycompany (from mycompany.agilecrm.com).");
  return `https://${domain}.agilecrm.com`;
}

const authorization = (account: { fields: Fields }) =>
  `Basic ${btoa(`${account.fields.email}:${account.fields.token}`)}`;

const agilecrm = defineProvider({
  name: "Agile CRM",
  hosts: ["*.agilecrm.com"],
  auth: {
    apiKey: secrets({
      label: "REST API key",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/dev/api/contacts?page_size=1`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    await decodeJson(response, json());
    return {
      accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname, username: account.fields.email },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, auth: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (
    method: string,
    path: string,
    options: { params?: Params; json?: unknown; form?: Params } = {},
  ) => {
    const url = new URL(`${base}/dev/api${path}`);
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: auth, Accept: "application/json" };
    let body: string | undefined;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    } else if (options.form !== undefined) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(options.form)) if (value !== undefined) form.set(key, String(value));
      body = form.toString();
    }
    const response = await fetcher(url.toString(), { method, signal, headers, body });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Agile CRM ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    if (text.trim() === "") return { ok: true };
    try {
      return JSON.parse(text);
    } catch {
      return { ok: true, response: text };
    }
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const body = () => json();
const page = { page_size: number().optional(), cursor: string().optional() };
const pagingDoc = "Paging: the last item carries a cursor for the next page; pass it back as cursor.";

function build(call: Call) {
  const get = (description: string, path: (i: string) => string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const del = (description: string, path: (i: string) => string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const post = (description: string, path: string) =>
    mutation({ description, input: object({ body: body() }) }, (_c, { body: b }) => call("POST", path, { json: b }));
  const put = (description: string, path: string) =>
    mutation({ description, input: object({ body: body() }) }, (_c, { body: b }) => call("PUT", path, { json: b }));
  const forContact = (description: string, path: (i: string) => string) =>
    query(
      { description, input: object({ contactId: id() }) },
      (_c, { contactId }) => call("GET", path(contactId)),
    );

  return {
    contacts: router(
      {
        list: query(
          { description: `List contacts, oldest first. ${pagingDoc}`, input: object(page) },
          (_c, params) => call("GET", "/contacts", { params }),
        ),
        get: get("Get a contact or company by ID.", (i) => `/contacts/${seg(i)}`),
        searchByEmail: query(
          { description: "Find a contact by email address.", input: object({ email: id() }) },
          (_c, { email }) => call("GET", `/contacts/search/email/${seg(email)}`),
        ),
        searchByPhone: query(
          { description: "Find a contact by phone number.", input: object({ phone: id() }) },
          (_c, { phone }) => call("GET", `/contacts/search/phonenumber/${seg(phone)}`),
        ),
        search: query(
          {
            description: "Keyword search across contacts or companies.",
            input: object({ q: id(), type: string().default("PERSON"), page_size: number().default(10) }),
          },
          (_c, params) => call("GET", "/search", { params }),
        ),
        filter: mutation(
          {
            description:
              'Fetch contacts or companies matching a dynamic filter. filterJson is the filter as a JSON string, for example {"rules":[{"LHS":"tags","CONDITION":"EQUALS","RHS":"lead"}],"contact_type":"PERSON"}. Read-only despite using POST.',
            input: object({ filterJson: id(), page_size: number().default(25), global_sort_key: string().default("-created_time"), cursor: string().optional() }),
          },
          (_c, form) => call("POST", "/filters/filter/dynamic-filter", { form }),
        ),
        create: post(
          'Create a contact. Body is Agile contact JSON, for example {"properties":[{"type":"SYSTEM","name":"first_name","value":"Ada"},{"type":"SYSTEM","name":"email","subtype":"work","value":"ada@example.com"}],"tags":["lead"]}. Set "type":"COMPANY" to create a company; first_name is required for people.',
          "/contacts",
        ),
        updateProperties: put(
          'Add or update properties on a contact without touching other fields. Body: {"id":"<contactId>","properties":[{"type":"SYSTEM","name":"first_name","value":"Ada"}]}. Cannot change tags, score or star.',
          "/contacts/edit-properties",
        ),
        updateByEmail: mutation(
          {
            description:
              'Update one property of the contact with this email. Body is a single property: {"type":"SYSTEM","name":"title","value":"CTO"}.',
            input: object({ email: id(), body: body() }),
          },
          (_c, { email, body }) => call("POST", "/contacts/add/property", { params: { email }, json: body }),
        ),
        setLeadScore: put('Set a contact\'s lead score. Body: {"id":"<contactId>","lead_score":20}.', "/contacts/edit/lead-score"),
        setStarValue: put('Set a contact\'s star rating 0-5. Body: {"id":"<contactId>","star_value":3}.', "/contacts/edit/add-star"),
        addTags: put('Add tags to a contact by ID. Body: {"id":"<contactId>","tags":["a","b"]}.', "/contacts/edit/tags"),
        removeTags: put('Remove tags from a contact by ID. Body: {"id":"<contactId>","tags":["a"]}.', "/contacts/delete/tags"),
        addTagsByEmail: mutation(
          {
            description: "Add tags to a contact identified by email.",
            input: object({ email: id(), tags: json() }),
          },
          (_c, { email, tags }) =>
            call("POST", "/contacts/email/tags/add", {
              form: { email, tags: typeof tags === "string" ? tags : JSON.stringify(tags) },
            }),
        ),
        removeTagsByEmail: mutation(
          {
            description: "Remove tags from a contact identified by email.",
            input: object({ email: id(), tags: json() }),
          },
          (_c, { email, tags }) =>
            call("POST", "/contacts/email/tags/delete", {
              form: { email, tags: typeof tags === "string" ? tags : JSON.stringify(tags) },
            }),
        ),
        changeOwner: mutation(
          {
            description: "Change a contact's owner to the user with the given email.",
            input: object({ contactId: id(), ownerEmail: id() }),
          },
          (_c, { contactId, ownerEmail }) =>
            call("POST", "/contacts/change-owner", { form: { contact_id: contactId, owner_email: ownerEmail } }),
        ),
        delete: del("Delete a contact or company by ID.", (i) => `/contacts/${seg(i)}`),
      },
      { title: "Contacts", description: "People and companies in the CRM." },
    ),
    companies: router(
      {
        list: mutation(
          {
            description: `List companies. Read-only despite using POST. ${pagingDoc}`,
            input: object({ page_size: number().default(25), global_sort_key: string().default("-created_time"), cursor: string().optional() }),
          },
          (_c, form) => call("POST", "/contacts/companies/list", { form }),
        ),
      },
      { title: "Companies", description: "Listing companies; create, read, update and delete them through contacts with type COMPANY." },
    ),
    deals: router(
      {
        list: query({ description: "List all deals.", input: object({}) }, () => call("GET", "/opportunity")),
        get: get("Get a deal by ID.", (i) => `/opportunity/${seg(i)}`),
        mine: query({ description: "List deals owned by the current user.", input: object({}) }, () =>
          call("GET", "/opportunity/my/deals"),
        ),
        forContact: forContact("List deals related to a contact.", (i) => `/contacts/${seg(i)}/deals`),
        byMilestone: query(
          { description: "Deals in the default track, grouped by milestone.", input: object({}) },
          () => call("GET", "/opportunity/byMilestone"),
        ),
        create: post(
          'Create a deal. Body: {"name":"Deal","expected_value":"500","probability":"75","close_date":1455042600,"milestone":"Proposal","contact_ids":["<id>"],"custom_data":[{"name":"x","value":"y"}]}. expected_value is required; milestone is case sensitive. Do not send nulls.',
          "/opportunity",
        ),
        update: put(
          'Partially update a deal. Body must include "id", plus any fields to change (name, expected_value, probability, milestone, contact_ids, custom_data).',
          "/opportunity/partial-update",
        ),
        createByEmail: mutation(
          {
            description: "Create a deal for the contact with this email. Body is deal JSON as for deals.create.",
            input: object({ email: id(), body: body() }),
          },
          (_c, { email, body: b }) => call("POST", `/opportunity/email/${seg(email)}`, { json: b }),
        ),
        delete: del("Delete a deal by ID.", (i) => `/opportunity/${seg(i)}`),
        bulkDelete: mutation(
          {
            description: "Delete several deals at once. Pass the deal IDs.",
            input: object({ ids: json() }),
          },
          (_c, { ids }) =>
            call("POST", "/opportunity/bulk", { form: { ids: typeof ids === "string" ? ids : JSON.stringify(ids) } }),
        ),
        pipelines: query({ description: "List deal tracks (pipelines) and their milestones.", input: object({}) }, () =>
          call("GET", "/milestone/pipelines"),
        ),
        createPipeline: post('Create a track. Body: {"name":"Sales","milestones":"New,Won,Lost"}.', "/milestone/pipelines"),
        updatePipeline: put('Update a track. Body: {"id":"<id>","name":"Sales","milestones":"New,Won,Lost"}.', "/milestone/pipelines"),
        deletePipeline: del("Delete a track by ID.", (i) => `/milestone/pipelines/${seg(i)}`),
      },
      { title: "Deals", description: "Opportunities and sales tracks." },
    ),
    notes: router(
      {
        forContact: forContact("List notes on a contact.", (i) => `/contacts/${seg(i)}/notes`),
        create: post(
          'Create a note and attach it to contacts. Body: {"subject":"...","description":"...","contact_ids":["<id>"]}.',
          "/notes/",
        ),
        addByEmail: mutation(
          {
            description: 'Add a note to the contact with this email. Body: {"subject":"...","description":"..."}.',
            input: object({ email: id(), note: body() }),
          },
          (_c, { email, note }) =>
            call("POST", "/contacts/email/note/add", {
              form: { email, note: typeof note === "string" ? note : JSON.stringify(note) },
            }),
        ),
        createForDeal: post(
          'Create a note on deals. Body: {"subject":"...","description":"...","deal_ids":["<id>"]}.',
          "/opportunity/deals/notes",
        ),
        delete: mutation(
          { description: "Delete a note from a contact.", input: object({ contactId: id(), noteId: id() }) },
          (_c, { contactId, noteId }) => call("DELETE", `/contacts/${seg(contactId)}/notes/${seg(noteId)}`),
        ),
      },
      { title: "Notes", description: "Notes on contacts and deals." },
    ),
    tasks: router(
      {
        list: query({ description: "List all tasks.", input: object({}) }, () => call("GET", "/tasks")),
        get: get("Get a task by ID.", (i) => `/tasks/${seg(i)}`),
        pending: query(
          { description: "List pending tasks due within a number of days.", input: object({ days: number() }) },
          (_c, { days }) => call("GET", `/tasks/pending/${days}`),
        ),
        search: query(
          {
            description:
              "Filter tasks. criteria is CATEGORY (type EMAIL, CALL, FOLLOW_UP, MEETING, MILESTONE, SEND, TWEET, OTHER), STATUS (IN_PROGRESS, YET_TO_START, COMPLETED) or PRIORITY (HIGH, NORMAL, LOW). " +
              pagingDoc,
            input: object({
              criteria: string().optional(),
              type: string().optional(),
              owner: string().optional(),
              pending: string().optional(),
              ...page,
            }),
          },
          (_c, params) => call("GET", "/tasks/based", { params }),
        ),
        forContact: forContact("List tasks related to a contact.", (i) => `/contacts/${seg(i)}/tasks/sort`),
        create: post(
          'Create a task. Body: {"subject":"...","type":"CALL","due":1459319400,"priority_type":"HIGH","status":"YET_TO_START","taskDescription":"...","owner_id":"<id>","contacts":["<id>"],"deal_ids":["<id>"]}. due is epoch seconds.',
          "/tasks",
        ),
        createByEmail: mutation(
          { description: "Create a task for the contact with this email. Body is task JSON.", input: object({ email: id(), body: body() }) },
          (_c, { email, body: b }) => call("POST", `/tasks/email/${seg(email)}`, { json: b }),
        ),
        update: put('Partially update a task. Body must include "id" plus the fields to change.', "/tasks/partial-update"),
        delete: del("Delete a task by ID.", (i) => `/tasks/${seg(i)}`),
      },
      { title: "Tasks", description: "To-dos linked to contacts and deals." },
    ),
    events: router(
      {
        list: query(
          { description: "List events between two epoch-second timestamps.", input: object({ start: number(), end: number() }) },
          (_c, params) => call("GET", "/events", { params }),
        ),
        forContact: forContact("List events related to a contact.", (i) => `/contacts/${seg(i)}/events/sort`),
        create: post(
          'Create an event. Body: {"title":"...","allDay":false,"color":"red","start":1409682600,"end":1409768100,"contacts":["<id>"]}. start and end are epoch seconds.',
          "/events",
        ),
        update: put('Update an event. Body is event JSON including "id".', "/events"),
        delete: del("Delete an event by ID.", (i) => `/events/${seg(i)}`),
      },
      { title: "Events", description: "Calendar events." },
    ),
    campaigns: router(
      {
        list: query({ description: "List marketing automation campaigns (workflows) with their IDs.", input: object({}) }, () =>
          call("GET", "/workflows"),
        ),
        enroll: mutation(
          {
            description: "Enroll a contact, by email, in a campaign.",
            input: object({ email: id(), workflowId: id() }),
          },
          (_c, { email, workflowId }) =>
            call("POST", "/campaigns/enroll/email", { form: { email, "workflow-id": workflowId } }),
        ),
        unenroll: mutation(
          { description: "Remove a contact from a campaign.", input: object({ workflowId: id(), contactId: id() }) },
          (_c, { workflowId, contactId }) =>
            call("DELETE", `/workflows/remove-active-subscriber/${seg(workflowId)}/${seg(contactId)}`),
        ),
      },
      { title: "Campaigns", description: "Marketing automation campaigns." },
    ),
    documents: router(
      {
        forContact: forContact("List documents attached to a contact.", (i) => `/documents/contact/${seg(i)}/docs`),
        create: post("Create a document record linked to a contact. Body is document JSON.", "/documents"),
        update: put('Update a document. Body is document JSON including "id".', "/documents"),
      },
      { title: "Documents", description: "Documents attached to contacts." },
    ),
    tickets: router(
      {
        filters: query({ description: "List help desk ticket filters and their IDs.", input: object({}) }, () =>
          call("GET", "/tickets/filters"),
        ),
        list: query(
          {
            description: "List tickets under a filter.",
            input: object({ filter_id: id(), page_size: number().optional(), cursor: string().optional() }),
          },
          (_c, params) => call("GET", "/tickets/filter", { params }),
        ),
        messages: query(
          { description: "List the messages in a ticket.", input: object({ ticketId: id() }) },
          (_c, { ticketId }) => call("GET", `/tickets/notes/${seg(ticketId)}`),
        ),
        create: post(
          'Create a ticket. Body: {"requester_name":"...","requester_email":"...","subject":"...","priority":"LOW","status":"OPEN","groupID":"<id>","html_text":"...","cc_emails":[],"labels":null}. All fields are required.',
          "/tickets/new-ticket",
        ),
        addNote: mutation(
          {
            description: "Add a note to a ticket. noteType is PUBLIC or PRIVATE.",
            input: object({ ticketId: id(), htmlText: id(), noteType: string().default("PUBLIC") }),
          },
          (_c, { ticketId, htmlText, noteType }) =>
            call("POST", `/notes/${seg(ticketId)}`, {
              json: { ticket_id: ticketId, html_text: htmlText, note_type: noteType },
            }),
        ),
        delete: del("Delete a ticket by ID.", (i) => `/tickets/${seg(i)}`),
      },
      { title: "Tickets", description: "Help desk tickets." },
    ),
  };
}

export default defineApp({ user: { accounts: { agilecrm: agilecrm.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.agilecrm ?? [],
      (account) =>
        withApprovals(
          router(build(client(origin(account), authorization(account), fetch, signal))),
          (tool) => (tool.kind === "mutation" ? always() : undefined),
        ),
      { signal },
    ),
    {
      title: "Agile CRM",
      description: "Manage Agile CRM contacts, companies, deals, notes, tasks, events, campaigns, documents and help desk tickets.",
      instructions:
        "Ids are strings. Write bodies use Agile CRM's own JSON (see each tool). Tools named list, filter and search never change data; filter and companies.list use POST only because the API requires it.",
      icons,
    },
  ),
}));
