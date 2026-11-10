import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const inboxBase = "https://api.helpscout.net/v2";
const docsBase = "https://docsapi.helpscout.net/v1";

const helpscout = defineProvider({
  name: "Help Scout",
  hosts: ["api.helpscout.net", "docsapi.helpscout.net"],
  auth: {
    // Inbox API: an OAuth2 app created under Your Profile > My Apps. The connect page asks for its client.
    // Help Scout has no scopes; a token carries the permissions of the user who authorized it.
    oauth: oauth2({
      authorizationUrl: "https://secure.helpscout.net/authentication/authorizeClientApplication",
      tokenUrl: "https://api.helpscout.net/v2/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
    // Docs API: an API key from Your Profile > Authentication > API Keys, sent as the Basic auth username.
    docsKey: secrets({
      label: "Docs API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "oauth") {
      const response = await fetch(`${inboxBase}/users/me`, { signal, headers: authorization(account) });
      const me = await decodeJson(
        response,
        object({ id: number(), firstName: string(), lastName: string(), email: string() }),
      );
      return {
        accountInfo: {
          externalId: String(me.id),
          displayName: `${me.firstName} ${me.lastName}`.trim(),
          email: me.email,
        },
      };
    }
    const response = await fetch(`${docsBase}/sites`, { signal, headers: authorization(account) });
    await decodeJson(response, json());
    return { accountInfo: { displayName: "Help Scout Docs" } };
  },
});

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "docsKey"; fields: { apiKey: string } };

function authorization(account: Account) {
  return {
    Authorization:
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.apiKey}:X`)}`,
  };
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(base: string, account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = authorization(account);
  const url = (path: string, params: Params) => {
    const u = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  // Writes answer 201 or 204 with an empty body; a created resource's id is in the Resource-ID header.
  const send = async (method: string, path: string, body?: unknown, params: Params = {}) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Help Scout ${method} ${path} failed with ${response.status}: ${text.slice(0, 1000)}`);
    const id = response.headers.get("resource-id");
    const parsed: unknown = text === "" ? null : JSON.parse(text);
    if (parsed === null) return id === null ? { ok: true } : { ok: true, id };
    return parsed;
  };
  return {
    get: (path: string, params: Params = {}) => send("GET", path, undefined, params),
    post: (path: string, body: unknown, params: Params = {}) => send("POST", path, body, params),
    put: (path: string, body?: unknown, params: Params = {}) => send("PUT", path, body ?? {}, params),
    patch: (path: string, body: unknown) => send("PATCH", path, body),
    del: (path: string) => send("DELETE", path),
  };
}

type Api = ReturnType<typeof client>;

const basicCustomerFields = ["firstName", "lastName", "jobTitle", "location", "background", "organization", "gender", "age", "photoUrl"] as const;
const optStr = () => string().optional();
const optNum = () => number().optional();
const optBool = () => boolean().optional();
const id = () => number();
const page = { page: optNum() };

function inbox(api: Api) {
  const conversations = router(
    {
      list: query(
        {
          description:
            "List conversations (25 per page). Filter by mailbox, folder, status (active, closed, open, pending, spam, all; default active), tag (names, comma-separated), assigned_to (user id, or -1 for unassigned), number, modifiedSince (ISO 8601), customFieldsByIds (id:value pairs) or a query such as (subject:\"billing\" AND email:\"a@b.com\"). sortField is createdAt, customerEmail, mailboxid, modifiedAt, number, score, status or subject. embed=threads includes the threads.",
          input: object({
            ...page,
            mailbox: optStr(),
            folder: optNum(),
            status: optStr(),
            tag: optStr(),
            assigned_to: optNum(),
            modifiedSince: optStr(),
            number: optNum(),
            sortField: optStr(),
            sortOrder: optStr(),
            query: optStr(),
            customFieldsByIds: optStr(),
            embed: optStr(),
          }),
        },
        (_c, p) => api.get("/conversations", p),
      ),
      get: query(
        {
          description: "Get one conversation by id. embed=threads includes its threads.",
          input: object({ conversationId: id(), embed: optStr() }),
        },
        (_c, { conversationId, embed }) => api.get(`/conversations/${conversationId}`, { embed }),
      ),
      create: mutation(
        {
          description:
            "Create a conversation. type is email, chat or phone; status is active, closed or pending. threads needs at least one thread object ({type: customer|reply|note|phone|chat, customer: {email} or {id}, text, imported?, createdAt?}). Optional: assignTo (user id), tags (names), fields ([{id, value}]), autoReply, createdAt, imported. Returns the new id.",
          input: object({
            subject: string({ minLength: 1 }),
            customer: json(),
            mailboxId: id(),
            type: string(),
            status: string(),
            threads: array(json()),
            assignTo: optNum(),
            tags: array(string()).optional(),
            fields: array(json()).optional(),
            autoReply: optBool(),
            imported: optBool(),
            createdAt: optStr(),
            closedAt: optStr(),
            user: optNum(),
          }),
        },
        (_c, { autoReply, imported, ...body }) =>
          api.post("/conversations", body, { autoReply, imported }),
      ),
      update: mutation(
        {
          description:
            "Update a conversation with JSON Patch operations, each {op, path, value}. Supported: replace /subject, replace /status (active, closed, pending, spam), replace /assignTo (user id), remove /assignTo, replace /primaryCustomer.id, move /mailboxId, replace /draft.",
          input: object({ conversationId: id(), operations: array(object({ op: string(), path: string(), value: json().optional() })) }),
        },
        (_c, { conversationId, operations }) => api.patch(`/conversations/${conversationId}`, operations),
      ),
      delete: mutation(
        { description: "Delete a conversation permanently.", input: object({ conversationId: id() }) },
        (_c, { conversationId }) => api.del(`/conversations/${conversationId}`),
      ),
      setTags: mutation(
        {
          description: "Replace all tags on a conversation with the given tag names (an empty list removes them all).",
          input: object({ conversationId: id(), tags: array(string()) }),
        },
        (_c, { conversationId, tags }) => api.put(`/conversations/${conversationId}/tags`, { tags }),
      ),
      setFields: mutation(
        {
          description: "Set custom field values on a conversation as [{id, value}]. Fields not listed are removed.",
          input: object({ conversationId: id(), fields: array(object({ id: id(), value: json() })) }),
        },
        (_c, { conversationId, fields }) => api.put(`/conversations/${conversationId}/fields`, { fields }),
      ),
      threads: query(
        {
          description: "List the threads (messages, notes, status changes) of a conversation.",
          input: object({ conversationId: id(), ...page }),
        },
        (_c, { conversationId, page: pageNumber }) =>
          api.get(`/conversations/${conversationId}/threads`, { page: pageNumber }),
      ),
      reply: mutation(
        {
          description:
            "Send a reply from a user to the customer. customer is {id} or {email}; text is HTML. Optional: user (sending user id), status (active, closed, pending), cc and bcc (emails), draft, imported, createdAt, attachments ([{fileName, mimeType, data}] base64).",
          input: object({
            conversationId: id(),
            customer: object({ id: optNum(), email: optStr() }),
            text: string({ minLength: 1 }),
            user: optNum(),
            status: optStr(),
            cc: array(string()).optional(),
            bcc: array(string()).optional(),
            draft: optBool(),
            imported: optBool(),
            createdAt: optStr(),
            attachments: array(json()).optional(),
          }),
        },
        (_c, { conversationId, ...body }) => api.post(`/conversations/${conversationId}/reply`, body),
      ),
      note: mutation(
        {
          description: "Add an internal note to a conversation. text is HTML. Optional: user (author id), status, imported, createdAt.",
          input: object({
            conversationId: id(),
            text: string({ minLength: 1 }),
            user: optNum(),
            status: optStr(),
            imported: optBool(),
            createdAt: optStr(),
          }),
        },
        (_c, { conversationId, ...body }) => api.post(`/conversations/${conversationId}/notes`, body),
      ),
      customerThread: mutation(
        {
          description:
            "Add a thread written by the customer to a conversation. customer is {id} or {email}; text is HTML. Optional: imported, createdAt, cc, bcc.",
          input: object({
            conversationId: id(),
            customer: object({ id: optNum(), email: optStr() }),
            text: string({ minLength: 1 }),
            imported: optBool(),
            createdAt: optStr(),
            cc: array(string()).optional(),
            bcc: array(string()).optional(),
          }),
        },
        (_c, { conversationId, ...body }) => api.post(`/conversations/${conversationId}/customer`, body),
      ),
      phoneThread: mutation(
        {
          description: "Log a phone call thread on a conversation. customer is {id} or {email}; text is HTML.",
          input: object({
            conversationId: id(),
            customer: object({ id: optNum(), email: optStr() }),
            text: string({ minLength: 1 }),
            imported: optBool(),
            createdAt: optStr(),
          }),
        },
        (_c, { conversationId, ...body }) => api.post(`/conversations/${conversationId}/phones`, body),
      ),
      updateThread: mutation(
        {
          description: "Edit the text of a thread (JSON Patch). Use [{op: \"replace\", path: \"/text\", value: \"<html>\"}].",
          input: object({ conversationId: id(), threadId: id(), operations: array(object({ op: string(), path: string(), value: json() })) }),
        },
        (_c, { conversationId, threadId, operations }) =>
          api.patch(`/conversations/${conversationId}/threads/${threadId}`, operations),
      ),
      attachments: query(
        {
          description: "Get the data of one attachment (base64) from a thread.",
          input: object({ conversationId: id(), attachmentId: id() }),
        },
        (_c, { conversationId, attachmentId }) =>
          api.get(`/conversations/${conversationId}/attachments/${attachmentId}/data`),
      ),
      rating: query(
        { description: "Get a customer satisfaction rating by id.", input: object({ ratingId: id() }) },
        (_c, { ratingId }) => api.get(`/ratings/${ratingId}`),
      ),
    },
    { title: "Conversations", description: "Conversations, their threads, replies, notes, tags and custom fields." },
  );

  const customerEntries = (kind: string, description: string, value: Record<string, ReturnType<typeof string | typeof optStr>>) =>
    router({
      create: mutation(
        { description: `Add ${description} to a customer.`, input: object({ customerId: id(), ...value }) },
        (_c, { customerId, ...body }) => api.post(`/customers/${customerId}/${kind}`, body),
      ),
      delete: mutation(
        {
          description: `Remove ${description} from a customer.`,
          input: object({ customerId: id(), entryId: id() }),
        },
        (_c, { customerId, entryId }) => api.del(`/customers/${customerId}/${kind}/${entryId}`),
      ),
    });

  const customers = router(
    {
      list: query(
        {
          description:
            "List customers (50 per page). Filter by mode (all, contacts), firstName, lastName, email, modifiedSince (ISO 8601), sortField (score, firstName, lastName, modifiedAt), sortOrder, or a query such as (email:\"a@b.com\"). Also filter by mailbox (id).",
          input: object({
            ...page,
            mailbox: optNum(),
            firstName: optStr(),
            lastName: optStr(),
            email: optStr(),
            modifiedSince: optStr(),
            sortField: optStr(),
            sortOrder: optStr(),
            query: optStr(),
          }),
        },
        (_c, p) => api.get("/customers", p),
      ),
      get: query(
        { description: "Get one customer by id, with emails, phones, address, social profiles and properties.", input: object({ customerId: id() }) },
        (_c, { customerId }) => api.get(`/customers/${customerId}`),
      ),
      create: mutation(
        {
          description:
            "Create a customer. Provide any of firstName, lastName, email-bearing emails ([{type: home|other|work, value}]), phones ([{type: fax|home|mobile|other|pager|work, value}]), jobTitle, location, background, organization, gender, age, photoUrl, address ({lines, city, state, postalCode, country}), websites ([{value}]), chats, socialProfiles and properties ([{slug, value}]). Returns the new id.",
          input: object({
            firstName: optStr(),
            lastName: optStr(),
            jobTitle: optStr(),
            location: optStr(),
            background: optStr(),
            organization: optStr(),
            gender: optStr(),
            age: optStr(),
            photoUrl: optStr(),
            emails: array(json()).optional(),
            phones: array(json()).optional(),
            address: json().optional(),
            websites: array(json()).optional(),
            chats: array(json()).optional(),
            socialProfiles: array(json()).optional(),
            properties: array(json()).optional(),
          }),
        },
        (_c, body) => api.post("/customers", body),
      ),
      update: mutation(
        {
          description:
            "Update a customer's basic fields (firstName, lastName, jobTitle, location, background, organization, gender, age, photoUrl). The current customer is fetched first and omitted fields keep their current values, because Help Scout's PUT clears anything not sent.",
          input: object({
            customerId: id(),
            firstName: optStr(),
            lastName: optStr(),
            jobTitle: optStr(),
            location: optStr(),
            background: optStr(),
            organization: optStr(),
            gender: optStr(),
            age: optStr(),
            photoUrl: optStr(),
          }),
        },
        async (_c, { customerId, ...changes }) => {
          const current = await api.get(`/customers/${customerId}`);
          const base: Record<string, unknown> = {};
          if (typeof current === "object" && current !== null) {
            for (const key of basicCustomerFields) {
              const value = (current as Record<string, unknown>)[key];
              if (value !== undefined && value !== null) base[key] = value;
            }
          }
          for (const [key, value] of Object.entries(changes)) if (value !== undefined) base[key] = value;
          return api.put(`/customers/${customerId}`, base);
        },
      ),
      delete: mutation(
        { description: "Delete a customer and their conversations.", input: object({ customerId: id() }) },
        (_c, { customerId }) => api.del(`/customers/${customerId}`),
      ),
      setAddress: mutation(
        {
          description: "Create or replace a customer's address.",
          input: object({
            customerId: id(),
            city: optStr(),
            state: optStr(),
            postalCode: optStr(),
            country: optStr(),
            lines: array(string()).optional(),
          }),
        },
        (_c, { customerId, ...body }) => api.put(`/customers/${customerId}/address`, body),
      ),
      deleteAddress: mutation(
        { description: "Delete a customer's address.", input: object({ customerId: id() }) },
        (_c, { customerId }) => api.del(`/customers/${customerId}/address`),
      ),
      emails: customerEntries("emails", "an email address", { value: string({ minLength: 1 }), type: string() }),
      phones: customerEntries("phones", "a phone number", { value: string({ minLength: 1 }), type: string() }),
      websites: customerEntries("websites", "a website", { value: string({ minLength: 1 }) }),
      socialProfiles: customerEntries("social-profiles", "a social profile", { value: string({ minLength: 1 }), type: string() }),
      properties: query(
        { description: "List the customer property definitions (slug, name, type) available to the company.", input: object({}) },
        () => api.get("/customer-properties"),
      ),
    },
    { title: "Customers", description: "Customers and their emails, phones, websites, social profiles and address." },
  );

  const organizations = router(
    {
      list: query(
        { description: "List organizations.", input: object({ ...page, query: optStr(), sortField: optStr(), sortOrder: optStr() }) },
        (_c, p) => api.get("/organizations", p),
      ),
      get: query(
        { description: "Get an organization by id.", input: object({ organizationId: id() }) },
        (_c, { organizationId }) => api.get(`/organizations/${organizationId}`),
      ),
      customers: query(
        { description: "List the customers of an organization.", input: object({ organizationId: id(), ...page }) },
        (_c, { organizationId, page: pageNumber }) => api.get(`/organizations/${organizationId}/customers`, { page: pageNumber }),
      ),
      conversations: query(
        { description: "List the conversations of an organization.", input: object({ organizationId: id(), ...page }) },
        (_c, { organizationId, page: pageNumber }) =>
          api.get(`/organizations/${organizationId}/conversations`, { page: pageNumber }),
      ),
      create: mutation(
        {
          description: "Create an organization. Optional: website, description, location, phone, domains ([string]), note, properties.",
          input: object({
            name: string({ minLength: 1 }),
            website: optStr(),
            description: optStr(),
            location: optStr(),
            phone: optStr(),
            note: optStr(),
            domains: array(string()).optional(),
            properties: array(json()).optional(),
          }),
        },
        (_c, body) => api.post("/organizations", body),
      ),
      update: mutation(
        {
          description: "Update an organization (name, website, description, location, phone, note, domains).",
          input: object({
            organizationId: id(),
            name: optStr(),
            website: optStr(),
            description: optStr(),
            location: optStr(),
            phone: optStr(),
            note: optStr(),
            domains: array(string()).optional(),
          }),
        },
        (_c, { organizationId, ...body }) => api.put(`/organizations/${organizationId}`, body),
      ),
      delete: mutation(
        { description: "Delete an organization.", input: object({ organizationId: id() }) },
        (_c, { organizationId }) => api.del(`/organizations/${organizationId}`),
      ),
    },
    { title: "Organizations", description: "Companies that group customers." },
  );

  const mailboxes = router(
    {
      list: query(
        { description: "List the mailboxes (inboxes) the authorized user can access.", input: object({ ...page }) },
        (_c, p) => api.get("/mailboxes", p),
      ),
      get: query(
        { description: "Get a mailbox by id; embed=fields,folders includes them.", input: object({ mailboxId: id(), embed: optStr() }) },
        (_c, { mailboxId, embed }) => api.get(`/mailboxes/${mailboxId}`, { embed }),
      ),
      folders: query(
        { description: "List a mailbox's folders with their conversation counts.", input: object({ mailboxId: id(), ...page }) },
        (_c, { mailboxId, page: pageNumber }) => api.get(`/mailboxes/${mailboxId}/folders`, { page: pageNumber }),
      ),
      fields: query(
        { description: "List a mailbox's custom fields.", input: object({ mailboxId: id(), ...page }) },
        (_c, { mailboxId, page: pageNumber }) => api.get(`/mailboxes/${mailboxId}/fields`, { page: pageNumber }),
      ),
      savedReplies: query(
        { description: "List a mailbox's saved replies.", input: object({ mailboxId: id() }) },
        (_c, { mailboxId }) => api.get(`/mailboxes/${mailboxId}/saved-replies`),
      ),
      savedReply: query(
        { description: "Get one saved reply with its text.", input: object({ mailboxId: id(), savedReplyId: id() }) },
        (_c, { mailboxId, savedReplyId }) => api.get(`/mailboxes/${mailboxId}/saved-replies/${savedReplyId}`),
      ),
    },
    { title: "Mailboxes", description: "Inboxes, their folders, custom fields and saved replies." },
  );

  const users = router(
    {
        list: query(
          { description: "List users; filter by mailbox id or email.", input: object({ ...page, mailbox: optNum(), email: optStr() }) },
          (_c, p) => api.get("/users", p),
        ),
        get: query(
          { description: "Get a user by id.", input: object({ userId: id() }) },
          (_c, { userId }) => api.get(`/users/${userId}`),
        ),
        me: query(
          { description: "Get the user who authorized this connection.", input: object({}) },
          () => api.get("/users/me"),
        ),
        delete: mutation(
          { description: "Delete a user.", input: object({ userId: id() }) },
          (_c, { userId }) => api.del(`/users/${userId}`),
        ),
    },
    { title: "Users", description: "Agents in the Help Scout account." },
  );

  const teams = router(
    {
        list: query(
          { description: "List teams.", input: object({ ...page }) },
          (_c, p) => api.get("/teams", p),
        ),
        members: query(
          { description: "List the members of a team.", input: object({ teamId: id(), ...page }) },
          (_c, { teamId, page: pageNumber }) => api.get(`/teams/${teamId}/members`, { page: pageNumber }),
        ),
    },
    { title: "Teams", description: "Teams of agents." },
  );

  const tags = router(
    {
      list: query(
        { description: "List tags with their conversation counts.", input: object({ ...page }) },
        (_c, p) => api.get("/tags", p),
      ),
      get: query(
        { description: "Get a tag by id.", input: object({ tagId: id() }) },
        (_c, { tagId }) => api.get(`/tags/${tagId}`),
      ),
    },
    { title: "Tags", description: "Conversation tags." },
  );

  const webhooks = router(
    {
      list: query(
        { description: "List webhooks.", input: object({ ...page }) },
        (_c, p) => api.get("/webhooks", p),
      ),
      get: query(
        { description: "Get a webhook by id.", input: object({ webhookId: id() }) },
        (_c, { webhookId }) => api.get(`/webhooks/${webhookId}`),
      ),
      create: mutation(
        {
          description:
            "Create a webhook. events are names such as convo.created, convo.assigned, convo.status, convo.tags.added, convo.customer.reply.created, convo.agent.reply.created, convo.note.created, customer.created, customer.updated, satisfaction.ratings.received. secret signs deliveries (max 40 characters).",
          input: object({ url: string({ minLength: 1 }), events: array(string()), secret: string({ minLength: 1 }), notification: optBool(), payloadVersion: optStr() }),
        },
        (_c, body) => api.post("/webhooks", body),
      ),
      update: mutation(
        {
          description: "Replace a webhook's url, events and secret.",
          input: object({ webhookId: id(), url: string({ minLength: 1 }), events: array(string()), secret: string({ minLength: 1 }), notification: optBool(), payloadVersion: optStr() }),
        },
        (_c, { webhookId, ...body }) => api.put(`/webhooks/${webhookId}`, body),
      ),
      delete: mutation(
        { description: "Delete a webhook.", input: object({ webhookId: id() }) },
        (_c, { webhookId }) => api.del(`/webhooks/${webhookId}`),
      ),
    },
    { title: "Webhooks", description: "Subscriptions to Help Scout events." },
  );

  const workflows = router(
    {
      list: query(
        { description: "List workflows; filter by type (automatic, manual) and mailboxId.", input: object({ ...page, type: optStr(), mailboxId: optNum() }) },
        (_c, p) => api.get("/workflows", p),
      ),
      run: mutation(
        {
          description: "Run a manual workflow on conversations.",
          input: object({ workflowId: id(), conversationIds: array(number()) }),
        },
        (_c, { workflowId, conversationIds }) => api.post(`/workflows/${workflowId}/run`, { conversationIds }),
      ),
      setStatus: mutation(
        {
          description: "Activate or deactivate a workflow (status is active or inactive).",
          input: object({ workflowId: id(), status: string() }),
        },
        (_c, { workflowId, status }) =>
          api.patch(`/workflows/${workflowId}`, [{ op: "replace", path: "/status", value: status }]),
      ),
    },
    { title: "Workflows", description: "Automatic and manual workflows." },
  );

  const reportRange = {
    start: string({ minLength: 1 }),
    end: string({ minLength: 1 }),
    previousStart: optStr(),
    previousEnd: optStr(),
    mailboxes: optStr(),
    tags: optStr(),
    types: optStr(),
    folders: optStr(),
  };
  const report = (path: string, description: string, extra: Record<string, ReturnType<typeof optStr>> = {}) =>
    query(
      { description: `${description} start and end are ISO 8601 UTC timestamps; mailboxes, tags, types and folders are comma-separated filters. Requires a Plus or Pro plan.`, input: object({ ...reportRange, ...extra }) },
      (_c, p) => api.get(path, p),
    );

  const reports = router(
    {
      company: report("/reports/company", "Company-wide overview with customers helped and happiness."),
      conversations: report("/reports/conversations", "Conversation volume, busiest times and new conversations by day."),
      productivity: report("/reports/productivity", "Response time, resolution time, replies to resolve and handle time."),
      happiness: report("/reports/happiness", "Customer satisfaction ratings and scores."),
      user: report("/reports/user", "Performance of one user (user is the user id).", { user: optStr() }),
      docs: report("/reports/docs", "Docs site usage: visitors, searches and popular articles."),
    },
    { title: "Reports", description: "Analytics reports (Plus and Pro plans)." },
  );

  return router({ conversations, customers, organizations, mailboxes, users, teams, tags, webhooks, workflows, reports });
}

function docs(api: Api) {
  const articles = router(
    {
      get: query(
        { description: "Get an article by id or number; draft=true returns the draft version.", input: object({ articleId: string({ minLength: 1 }), draft: optBool() }) },
        (_c, { articleId, draft }) => api.get(`/articles/${articleId}`, { draft }),
      ),
      listByCollection: query(
        {
          description: "List articles in a collection. status is all, published or notpublished; sort is number, status, name, popularity, createdAt or updatedAt; pageSize is at most 100.",
          input: object({ collectionId: string({ minLength: 1 }), ...page, pageSize: optNum(), status: optStr(), sort: optStr(), order: optStr() }),
        },
        (_c, { collectionId, ...p }) => api.get(`/collections/${collectionId}/articles`, p),
      ),
      listByCategory: query(
        {
          description: "List articles in a category (same filters as listByCollection).",
          input: object({ categoryId: string({ minLength: 1 }), ...page, pageSize: optNum(), status: optStr(), sort: optStr(), order: optStr() }),
        },
        (_c, { categoryId, ...p }) => api.get(`/categories/${categoryId}/articles`, p),
      ),
      related: query(
        { description: "List articles related to an article.", input: object({ articleId: string({ minLength: 1 }), ...page, pageSize: optNum(), status: optStr() }) },
        (_c, { articleId, ...p }) => api.get(`/articles/${articleId}/related`, p),
      ),
      search: query(
        {
          description: "Search articles. Filter by collectionId, siteId, status (all, published, notpublished) and visibility (all, public, private).",
          input: object({ query: string({ minLength: 1 }), ...page, pageSize: optNum(), collectionId: optStr(), siteId: optStr(), status: optStr(), visibility: optStr() }),
        },
        (_c, p) => api.get("/search/articles", p),
      ),
      create: mutation(
        {
          description:
            "Create an article in a collection. text is HTML. Optional: status (published, notpublished), slug, categories (ids), related (article ids), keywords, reload (return the created article).",
          input: object({
            collectionId: string({ minLength: 1 }),
            name: string({ minLength: 1 }),
            text: string(),
            status: optStr(),
            slug: optStr(),
            categories: array(string()).optional(),
            related: array(string()).optional(),
            keywords: array(string()).optional(),
            reload: optBool(),
          }),
        },
        (_c, { reload, ...body }) => api.post("/articles", body, { reload }),
      ),
      update: mutation(
        {
          description: "Update an article's name, text, status, slug, categories, related articles or keywords. reload returns the updated article.",
          input: object({
            articleId: string({ minLength: 1 }),
            collectionId: optStr(),
            name: optStr(),
            text: optStr(),
            status: optStr(),
            slug: optStr(),
            categories: array(string()).optional(),
            related: array(string()).optional(),
            keywords: array(string()).optional(),
            reload: optBool(),
          }),
        },
        (_c, { articleId, reload, ...body }) => api.put(`/articles/${articleId}`, body, { reload }),
      ),
      delete: mutation(
        { description: "Delete an article.", input: object({ articleId: string({ minLength: 1 }) }) },
        (_c, { articleId }) => api.del(`/articles/${articleId}`),
      ),
    },
    { title: "Articles", description: "Knowledge base articles." },
  );

  const collections = router(
    {
      list: query(
        {
          description: "List collections; filter by siteId and visibility (all, public, private); sort by number, visibility, order, name, createdAt or updatedAt.",
          input: object({ ...page, pageSize: optNum(), siteId: optStr(), visibility: optStr(), sort: optStr(), order: optStr() }),
        },
        (_c, p) => api.get("/collections", p),
      ),
      get: query(
        { description: "Get a collection by id or number.", input: object({ collectionId: string({ minLength: 1 }) }) },
        (_c, { collectionId }) => api.get(`/collections/${collectionId}`),
      ),
      create: mutation(
        {
          description: "Create a collection in a site. visibility is public or private.",
          input: object({ siteId: string({ minLength: 1 }), name: string({ minLength: 1 }), visibility: string(), description: optStr(), order: optNum(), reload: optBool() }),
        },
        (_c, { reload, ...body }) => api.post("/collections", body, { reload }),
      ),
      update: mutation(
        {
          description: "Update a collection's name, visibility, description or order.",
          input: object({ collectionId: string({ minLength: 1 }), name: optStr(), visibility: optStr(), description: optStr(), order: optNum() }),
        },
        (_c, { collectionId, ...body }) => api.put(`/collections/${collectionId}`, body),
      ),
      delete: mutation(
        { description: "Delete a collection and its articles.", input: object({ collectionId: string({ minLength: 1 }) }) },
        (_c, { collectionId }) => api.del(`/collections/${collectionId}`),
      ),
    },
    { title: "Collections", description: "Top-level groups of articles within a site." },
  );

  const categories = router(
    {
      list: query(
        { description: "List the categories in a collection.", input: object({ collectionId: string({ minLength: 1 }), ...page, pageSize: optNum(), sort: optStr(), order: optStr() }) },
        (_c, { collectionId, ...p }) => api.get(`/collections/${collectionId}/categories`, p),
      ),
      get: query(
        { description: "Get a category by id or number.", input: object({ categoryId: string({ minLength: 1 }) }) },
        (_c, { categoryId }) => api.get(`/categories/${categoryId}`),
      ),
      create: mutation(
        {
          description: "Create a category in a collection.",
          input: object({ collectionId: string({ minLength: 1 }), name: string({ minLength: 1 }), slug: optStr(), description: optStr(), order: optNum(), reload: optBool() }),
        },
        (_c, { reload, ...body }) => api.post("/categories", body, { reload }),
      ),
      update: mutation(
        {
          description: "Update a category's name, slug, description or order.",
          input: object({ categoryId: string({ minLength: 1 }), name: optStr(), slug: optStr(), description: optStr(), order: optNum() }),
        },
        (_c, { categoryId, ...body }) => api.put(`/categories/${categoryId}`, body),
      ),
      delete: mutation(
        { description: "Delete a category (its articles are kept).", input: object({ categoryId: string({ minLength: 1 }) }) },
        (_c, { categoryId }) => api.del(`/categories/${categoryId}`),
      ),
    },
    { title: "Categories", description: "Groups of articles within a collection." },
  );

  const sites = router(
    {
      list: query({ description: "List Docs sites.", input: object({ ...page }) }, (_c, p) => api.get("/sites", p)),
      get: query(
        { description: "Get a Docs site by id.", input: object({ siteId: string({ minLength: 1 }) }) },
        (_c, { siteId }) => api.get(`/sites/${siteId}`),
      ),
    },
    { title: "Sites", description: "Docs sites." },
  );

  return router({ sites, collections, categories, articles });
}

export default defineApp(
  { user: { accounts: { helpscout: helpscout.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.helpscout ?? [],
        (account) => {
          const approvals = (tool: { kind: string }) => (tool.kind === "mutation" ? always() : undefined);
          return account.method === "oauth"
            ? withApprovals(router({ inbox: inbox(client(inboxBase, account, fetch, signal)) }), approvals)
            : withApprovals(router({ docs: docs(client(docsBase, account, fetch, signal)) }), approvals);
        },
        { signal },
      ),
      {
        title: "Help Scout",
        description:
          "Inbox API (conversations, customers, organizations, mailboxes, users, teams, tags, webhooks, workflows, reports) over OAuth, and the Docs API (sites, collections, categories, articles) with a Docs API key.",
        icons,
        instructions:
          "An OAuth connection exposes the inbox.* tools; a Docs API key connection exposes the docs.* tools. Create calls return the new id from the Resource-ID header as {ok: true, id}. Lists are paged with page; read the page object in the response.",
      },
    ),
  }),
);
