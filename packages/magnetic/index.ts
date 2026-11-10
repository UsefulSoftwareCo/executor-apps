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

const base = "https://app.magnetichq.com/v2/rest";

const magnetic = defineProvider({
  name: "Magnetic",
  hosts: ["app.magnetichq.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // coreAPI/login validates the token and returns the User it belongs to.
  async health({ account, fetch, signal }) {
    // The token is a query parameter per the WADL; never echo this URL in errors.
    const response = await fetch(`${base}/coreAPI/login?token=${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ id: number() }));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | boolean | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const magneticTools = (account: Account, signal: AbortSignal) => {
  // The v2 WADL documents the API token only as a `token` query parameter, so it is added to every request.
  const headers = { Accept: "application/json" };
  const tokenParam = { token: account.fields.token };
  const get = (path: string, params: Params = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(await fetch(`${base}${path}${search({ ...params, ...tokenParam })}`, { signal, headers }), json());
  const read =
    (path: string) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }, input: Params) =>
      get(path, input)({ fetch });
  const send =
    (method: "POST" | "PUT" | "DELETE", path: string) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }, { body, ...params }: { body?: unknown; id?: number; contactId?: number; companyId?: number; deleteFuture?: boolean; authorWatch?: boolean; addToGroupingComment?: string }) => {
      const response = await fetch(`${base}${path}${search({ ...params, ...tokenParam })}`, {
        method,
        signal,
        headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Magnetic ${method} ${path} failed with ${response.status}: ${text}`);
      return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
    };

  const list = (description: string, path: string) =>
    query(
      {
        description,
        input: object({
          searchField: string().optional(),
          searchValue: string().optional(),
          pageSize: number().optional(),
        }),
      },
      read(path),
    );
  const multi = (description: string, path: string) =>
    query({ description, input: object({ search: string().optional(), pageSize: number().optional() }) }, read(path));
  const byId = (description: string, path: string) =>
    query({ description, input: object({ id: number() }) }, read(path));
  const tags = (description: string, path: string) =>
    query({ description, input: object({}) }, async ({ fetch }) => get(path, { token: account.fields.token })({ fetch }));
  const create = (description: string, path: string, extra: Record<string, never> = {}) =>
    mutation(
      { description: `${description} Pass the JSON object in body, shaped like the matching GET response.`, input: object({ body: json() }), approval: always() },
      async ({ fetch }, input) => send("POST", path)({ fetch }, { ...extra, ...input }),
    );
  const remove = (description: string, path: string) =>
    mutation(
      { description, input: object({ id: number() }), approval: always() },
      async ({ fetch }, input) => send("DELETE", path)({ fetch }, input),
    );

  return router({
    // Core
    currentUser: query(
      { description: "Validate the API token and return the Magnetic user it belongs to.", input: object({}) },
      async ({ fetch }) => get("/coreAPI/login", { token: account.fields.token })({ fetch }),
    ),
    getUser: byId("Get one Magnetic user by id.", "/coreAPI/user"),
    listUsers: query(
      {
        description:
          "List users in the company. searchField and searchValue filter by a user field; archive includes archived users.",
        input: object({ searchField: string().optional(), searchValue: string().optional(), archive: boolean().optional() }),
      },
      read("/coreAPI/users"),
    ),
    getCompanyProfile: byId("Get the Magnetic account's own company record by id.", "/coreAPI/company"),
    listFields: tags("List the custom field definitions configured in Magnetic.", "/coreAPI/fields"),
    listNotifications: query(
      {
        description:
          "List the current user's notifications. since is a millisecond timestamp, all includes read ones, exclusive limits to the current user only.",
        input: object({ since: number().optional(), all: boolean().optional(), exclusive: boolean().optional() }),
      },
      read("/coreAPI/notifications"),
    ),
    markNotificationRead: mutation(
      { description: "Mark one notification as read.", input: object({ id: number() }), approval: always() },
      async ({ fetch }, input) => send("PUT", "/coreAPI/readNotifications")({ fetch }, input),
    ),
    // Clients: companies
    listCompanies: list("List client companies, filtered by searchField and searchValue.", "/clientsAPI/companies"),
    searchCompanies: multi("Search client companies by free text across fields.", "/clientsAPI/companiesMulti"),
    getCompany: byId("Get one client company by id.", "/clientsAPI/company"),
    listCompaniesWithCustomFieldNames: list(
      "List client companies with custom fields keyed by name instead of id.",
      "/clientsAPI/companiesWithCustomFieldNames",
    ),
    getCompanyWithCustomFieldNames: byId(
      "Get one client company with custom fields keyed by name.",
      "/clientsAPI/companyWithCustomFieldNames",
    ),
    addCompany: create("Create or update a client company.", "/clientsAPI/company"),
    addCompanyWithCustomFieldNames: create(
      "Create or update a client company, with custom fields keyed by name.",
      "/clientsAPI/companyWithCustomFieldNames",
    ),
    removeCompany: remove("Delete a client company by id.", "/clientsAPI/company"),
    listCompanyTags: tags("List the tags available on client companies.", "/clientsAPI/companyTags"),
    // Clients: contacts
    listContacts: list("List contacts, filtered by searchField and searchValue.", "/clientsAPI/contacts"),
    searchContacts: multi("Search contacts by free text across fields.", "/clientsAPI/contactsMulti"),
    getContact: byId("Get one contact by id.", "/clientsAPI/contact"),
    listContactsWithCustomFieldNames: list(
      "List contacts with custom fields keyed by name instead of id.",
      "/clientsAPI/contactsWithCustomFieldNames",
    ),
    getContactWithCustomFieldNames: byId(
      "Get one contact with custom fields keyed by name.",
      "/clientsAPI/contactWithCustomFieldNames",
    ),
    addContact: create("Create or update a contact.", "/clientsAPI/contact"),
    addContactWithCustomFieldNames: create(
      "Create or update a contact, with custom fields keyed by name.",
      "/clientsAPI/contactWithCustomFieldNames",
    ),
    addContactCompany: create("Link a contact to a client company.", "/clientsAPI/contactCompany"),
    addOrFindContactAndCompany: create(
      "Find a contact and company by their details or create them when missing.",
      "/clientsAPI/addOrFindContactAndCompany",
    ),
    addOrFindContactAndCompanyWithCustomFieldNames: create(
      "Find or create a contact and company, with custom fields keyed by name.",
      "/clientsAPI/addOrFindContactAndCompanyWithCustomFieldNames",
    ),
    removeContact: remove("Delete a contact by id.", "/clientsAPI/contact"),
    listContactTags: tags("List the tags available on contacts.", "/clientsAPI/contactTags"),
    listCurrentFollowups: query(
      { description: "List the follow-ups due for a user (userId).", input: object({ userId: string().optional() }) },
      read("/clientsAPI/currentFollowups"),
    ),
    addContactRecord: mutation(
      {
        description:
          "Add a comment or record to a contact. Pass the record JSON in body; id is the optional existing record id to update.",
        input: object({ id: number().optional(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("POST", "/clientsAPI/contactComment")({ fetch }, input),
    ),
    removeContactRecord: mutation(
      {
        description: "Delete a record from a contact (id is the record id, contactId the contact).",
        input: object({ id: number(), contactId: number() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("DELETE", "/clientsAPI/contactComment")({ fetch }, input),
    ),
    addCompanyRecord: mutation(
      {
        description:
          "Add a comment or record to a client company. Pass the record JSON in body; id is the optional existing record id to update.",
        input: object({ id: number().optional(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("POST", "/clientsAPI/companyComment")({ fetch }, input),
    ),
    removeCompanyRecord: mutation(
      {
        description: "Delete a record from a client company (id is the record id, companyId the company).",
        input: object({ id: number(), companyId: number() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("DELETE", "/clientsAPI/companyComment")({ fetch }, input),
    ),
    // Tasks: groupings are projects and opportunities
    listGroupings: query(
      {
        description:
          "List groupings (projects and opportunities). searchOperator controls how searchValue matches, signed filters won or unsigned, archive includes archived ones.",
        input: object({
          searchField: string().optional(),
          searchValue: string().optional(),
          searchOperator: string().optional(),
          signed: string().optional(),
          archive: boolean().optional(),
        }),
      },
      read("/tasksAPI/groupings"),
    ),
    listGroupingsWithCustomFieldNames: query(
      {
        description: "List groupings (projects and opportunities) with custom fields keyed by name.",
        input: object({
          searchField: string().optional(),
          searchValue: string().optional(),
          searchOperator: string().optional(),
          signed: string().optional(),
          archive: boolean().optional(),
        }),
      },
      read("/tasksAPI/groupingsWithCustomFieldNames"),
    ),
    getGrouping: byId("Get one grouping (project or opportunity) by id.", "/tasksAPI/grouping"),
    getGroupingWithCustomFieldNames: byId(
      "Get one grouping with custom fields keyed by name.",
      "/tasksAPI/groupingWithCustomFieldNames",
    ),
    addGrouping: create("Create or update a grouping (project or opportunity).", "/tasksAPI/grouping"),
    addGroupingWithCustomFieldNames: create(
      "Create or update a grouping, with custom fields keyed by name.",
      "/tasksAPI/groupingWithCustomFieldNames",
    ),
    removeGrouping: remove("Delete a grouping by id.", "/tasksAPI/grouping"),
    listGroupingStatuses: tags("List the project statuses.", "/tasksAPI/groupingStatuses"),
    listOpportunityStatuses: tags("List the opportunity statuses.", "/tasksAPI/opportunityStatuses"),
    listGroupingTags: tags("List the tags available on groupings.", "/tasksAPI/groupingTags"),
    listGroupingCustomFieldDefinitions: tags(
      "List the custom field definitions for groupings.",
      "/tasksAPI/groupingCustomFieldDefinitions",
    ),
    listUsersForGrouping: query(
      { description: "List the users assigned to a grouping.", input: object({ groupingId: number() }) },
      read("/tasksAPI/usersForGrouping"),
    ),
    listGroupingComments: byId("List all comments on a grouping.", "/tasksAPI/groupingComments"),
    listGroupingCommentsLimited: query(
      { description: "List the latest comments on a grouping, up to limit.", input: object({ id: number(), limit: number().optional() }) },
      read("/tasksAPI/groupingCommentsLimited"),
    ),
    addGroupingComment: create("Add a comment to a grouping.", "/tasksAPI/groupingComment"),
    removeGroupingComment: remove("Delete a grouping comment by id.", "/tasksAPI/groupingComment"),
    // Tasks
    listTasks: query(
      {
        description:
          "List tasks, filtered by searchField and searchValue. complete includes finished tasks, archive includes archived ones.",
        input: object({
          searchField: string().optional(),
          searchValue: string().optional(),
          complete: boolean().optional(),
          archive: boolean().optional(),
        }),
      },
      read("/tasksAPI/tasks"),
    ),
    getTask: byId("Get one task by id.", "/tasksAPI/task"),
    listCurrentTasks: query(
      { description: "List the open tasks assigned to a user (userId).", input: object({ userId: string().optional() }) },
      read("/tasksAPI/currentTasks"),
    ),
    getTrackingTask: tags("Get the task the current user is tracking time on, or their top task.", "/tasksAPI/trackingOrTop"),
    listTaskTags: tags("List the tags available on tasks.", "/tasksAPI/taskTags"),
    addTask: mutation(
      {
        description:
          "Create or update a task. Pass the task JSON in body, shaped like a getTask response. authorWatch makes the author watch the task.",
        input: object({ authorWatch: boolean().optional(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("POST", "/tasksAPI/task")({ fetch }, input),
    ),
    removeTask: mutation(
      {
        description: "Delete a task by id. deleteFuture also deletes future occurrences of a recurring task.",
        input: object({ id: number(), deleteFuture: boolean().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("DELETE", "/tasksAPI/task")({ fetch }, input),
    ),
    trackTask: mutation(
      {
        description: "Start (track true) or stop (track false) time tracking on a task.",
        input: object({ id: number(), track: boolean() }),
        approval: always(),
      },
      async ({ fetch }, input) => get("/tasksAPI/trackTask", input)({ fetch }),
    ),
    listTaskComments: byId("List all comments on a task.", "/tasksAPI/taskComments"),
    listTaskCommentsLimited: query(
      { description: "List the latest comments on a task, up to limit.", input: object({ id: number(), limit: number().optional() }) },
      read("/tasksAPI/taskCommentsLimited"),
    ),
    addTaskComment: mutation(
      {
        description:
          "Add a comment to a task. Pass the comment JSON in body. addToGroupingComment is an optional flag copying it to the task's grouping.",
        input: object({ addToGroupingComment: string().optional(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("POST", "/tasksAPI/taskComment")({ fetch }, input),
    ),
    removeTaskComment: remove("Delete a task comment by id.", "/tasksAPI/taskComment"),
  });
};

export default defineApp({ user: { accounts: { magnetic: magnetic.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.magnetic ?? [], (account) => magneticTools(account, signal), { signal }), {
    title: "Magnetic",
    description:
      "Magnetic professional services automation: client companies and contacts, projects and opportunities (groupings), tasks, comments and users.",
    icons,
  }),
}));
