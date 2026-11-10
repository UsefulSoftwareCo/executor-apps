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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// ActiveCampaign hosts every account on its own subdomain (the "URL" under Settings > Developer).
const hostPattern = /^[a-z0-9][a-z0-9-]*\.(api-us1\.com|activehosted\.com)$/;

function origin(account: { fields: { account: string } }) {
  const host = account.fields.account
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host))
    throw new Error(
      "Enter your ActiveCampaign API URL host from Settings > Developer, for example myaccount.api-us1.com. Only *.api-us1.com and *.activehosted.com hosts are supported; other Developer-tab hosts are not supported yet.",
    );
  return `https://${host}`;
}

const activecampaign = defineProvider({
  name: "ActiveCampaign",
  hosts: ["*.api-us1.com", "*.activehosted.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        account: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/3/users/me`, {
      signal,
      headers: { "Api-Token": account.fields.token, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ user: object({ id: string(), email: string() }) }));
    return {
      accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname, username: me.user.email },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}/api/3${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/api/3/"))
      throw new Error("path must stay under /api/3 on the account host");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: {
          "Api-Token": token,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // The API allows 5 requests/second; retry 429 a bounded number of times, honoring Retry-After.
    let response = await send();
    for (let attempt = 0; attempt < 3 && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1), 10_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204 || (method === "DELETE" && response.ok)) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const bodyDoc = (wrapper: string) =>
  `Request body, wrapped as {"${wrapper}": {...}} as in the ActiveCampaign API reference.`;
const Query = record(string());
const listInput = object({
  limit: number().optional(),
  offset: number().optional(),
  query: Query.optional(),
});
const queryDoc =
  "Extra query parameters keyed exactly as the API expects, for example {\"filters[email]\": \"a@b.com\", \"orders[id]\": \"ASC\", \"search\": \"term\"}.";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${queryDoc}`, input: listInput }, (_c, { limit, offset, query: q }) =>
      call("GET", path, { limit, offset, ...(q ?? {}) }),
    );
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const create = (path: string, wrapper: string, description: string) =>
    mutation(
      { description: `${description} ${bodyDoc(wrapper)}`, input: object({ body: json() }) },
      (_c, { body }) => call("POST", path, {}, body),
    );
  const update = (path: (i: string) => string, wrapper: string, description: string) =>
    mutation(
      { description: `${description} ${bodyDoc(wrapper)}`, input: object({ id: id(), body: json() }) },
      (_c, { id: i, body }) => call("PUT", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const children = (path: (i: string) => string, description: string) =>
    query({ description: `${description} ${queryDoc}`, input: object({ id: id(), limit: number().optional(), offset: number().optional(), query: Query.optional() }) }, (_c, { id: i, limit, offset, query: q }) =>
      call("GET", path(i), { limit, offset, ...(q ?? {}) }),
    );

  const contacts = router(
    {
      list: list("/contacts", "List, search and filter contacts (filters[email], search, listid, tagid, status, segmentid, ...)."),
      get: get((i) => `/contacts/${seg(i)}`, "Get a contact by id."),
      create: create("/contacts", "contact", "Create a contact (email required)."),
      sync: mutation(
        { description: `Create or update a contact matched by email. ${bodyDoc("contact")}`, input: object({ body: json() }) },
        (_c, { body }) => call("POST", "/contact/sync", {}, body),
      ),
      update: update((i) => `/contacts/${seg(i)}`, "contact", "Update a contact."),
      delete: remove((i) => `/contacts/${seg(i)}`, "Delete a contact."),
      lists: children((i) => `/contacts/${seg(i)}/contactLists`, "List a contact's list memberships."),
      tags: children((i) => `/contacts/${seg(i)}/contactTags`, "List a contact's tag associations."),
      deals: children((i) => `/contacts/${seg(i)}/contactDeals`, "List a contact's deals."),
      automations: children((i) => `/contacts/${seg(i)}/contactAutomations`, "List the automations a contact is in."),
      fieldValues: children((i) => `/contacts/${seg(i)}/fieldValues`, "List a contact's custom field values."),
      notes: children((i) => `/contacts/${seg(i)}/notes`, "List notes on a contact."),
      activityLogs: children((i) => `/contacts/${seg(i)}/contactLogs`, "List a contact's activity log."),
      trackingLogs: children((i) => `/contacts/${seg(i)}/trackingLogs`, "List a contact's site tracking events."),
      bounceLogs: children((i) => `/contacts/${seg(i)}/bounceLogs`, "List a contact's bounce logs."),
      scoreValues: children((i) => `/contacts/${seg(i)}/scoreValues`, "List a contact's score values."),
      updateListStatus: mutation(
        {
          description:
            'Subscribe or unsubscribe a contact on a list. Body: {"contactList": {"list": "1", "contact": "2", "status": "1"}}; status 1 subscribes, 2 unsubscribes.',
          input: object({ body: json() }),
        },
        (_c, { body }) => call("POST", "/contactLists", {}, body),
      ),
      addTag: mutation(
        { description: `Add a tag to a contact. Body: {"contactTag": {"contact": "1", "tag": "2"}}.`, input: object({ body: json() }) },
        (_c, { body }) => call("POST", "/contactTags", {}, body),
      ),
      removeTag: remove((i) => `/contactTags/${seg(i)}`, "Remove a tag from a contact by contactTag association id."),
      addToAutomation: mutation(
        { description: `Add a contact to an automation. Body: {"contactAutomation": {"contact": "1", "automation": "2"}}.`, input: object({ body: json() }) },
        (_c, { body }) => call("POST", "/contactAutomations", {}, body),
      ),
      removeFromAutomation: remove((i) => `/contactAutomations/${seg(i)}`, "Remove a contact from an automation by contactAutomation id."),
      updateFieldValue: update((i) => `/fieldValues/${seg(i)}`, "fieldValue", "Update a custom field value on a contact by fieldValue id."),
      createFieldValue: create("/fieldValues", "fieldValue", "Set a custom field value on a contact."),
    },
    { title: "Contacts", description: "People in the account, their lists, tags, automations and custom field values." },
  );

  const accounts = router(
    {
      list: list("/accounts", "List accounts (organizations); use search to filter by name."),
      get: get((i) => `/accounts/${seg(i)}`, "Get an account by id."),
      create: create("/accounts", "account", "Create an account."),
      update: update((i) => `/accounts/${seg(i)}`, "account", "Update an account."),
      delete: remove((i) => `/accounts/${seg(i)}`, "Delete an account."),
      notes: children((i) => `/accounts/${seg(i)}/notes`, "List notes on an account."),
      associations: list("/accountContacts", "List account-contact associations."),
      associate: create("/accountContacts", "accountContact", "Associate a contact with an account."),
      updateAssociation: update((i) => `/accountContacts/${seg(i)}`, "accountContact", "Update an account-contact association (job title)."),
      removeAssociation: remove((i) => `/accountContacts/${seg(i)}`, "Remove an account-contact association."),
      customFields: list("/accountCustomFieldMeta", "List account custom field definitions."),
      customFieldValues: list("/accountCustomFieldData", "List account custom field values."),
    },
    { title: "Accounts", description: "Organizations in the CRM and their contact associations." },
  );

  const deals = router(
    {
      list: list("/deals", "List deals (filters[stage], filters[group], filters[owner], filters[status], search)."),
      get: get((i) => `/deals/${seg(i)}`, "Get a deal by id."),
      create: create("/deals", "deal", "Create a deal."),
      update: update((i) => `/deals/${seg(i)}`, "deal", "Update a deal, including moving it to another stage."),
      delete: remove((i) => `/deals/${seg(i)}`, "Delete a deal."),
      notes: children((i) => `/deals/${seg(i)}/notes`, "List notes on a deal."),
      createNote: create("/notes", "note", "Create a note on a deal or contact (relid, reltype)."),
      updateNote: update((i) => `/notes/${seg(i)}`, "note", "Update a note."),
      deleteNote: remove((i) => `/notes/${seg(i)}`, "Delete a note."),
      tasks: list("/dealTasks", "List deal tasks."),
      getTask: get((i) => `/dealTasks/${seg(i)}`, "Get a deal task by id."),
      createTask: create("/dealTasks", "dealTask", "Create a task on a deal."),
      updateTask: update((i) => `/dealTasks/${seg(i)}`, "dealTask", "Update a deal task, including marking it complete."),
      deleteTask: remove((i) => `/dealTasks/${seg(i)}`, "Delete a deal task."),
      taskTypes: list("/dealTasktypes", "List deal task types."),
      pipelines: list("/dealGroups", "List pipelines (deal groups)."),
      getPipeline: get((i) => `/dealGroups/${seg(i)}`, "Get a pipeline by id."),
      createPipeline: create("/dealGroups", "dealGroup", "Create a pipeline."),
      updatePipeline: update((i) => `/dealGroups/${seg(i)}`, "dealGroup", "Update a pipeline."),
      deletePipeline: remove((i) => `/dealGroups/${seg(i)}`, "Delete a pipeline."),
      stages: list("/dealStages", "List pipeline stages (filters[d_groupid] restricts to a pipeline)."),
      getStage: get((i) => `/dealStages/${seg(i)}`, "Get a stage by id."),
      createStage: create("/dealStages", "dealStage", "Create a pipeline stage."),
      updateStage: update((i) => `/dealStages/${seg(i)}`, "dealStage", "Update a pipeline stage."),
      deleteStage: remove((i) => `/dealStages/${seg(i)}`, "Delete a pipeline stage."),
      customFields: list("/dealCustomFieldMeta", "List deal custom field definitions."),
      customFieldValues: list("/dealCustomFieldData", "List deal custom field values."),
    },
    { title: "Deals", description: "Deals, notes, tasks, pipelines and stages." },
  );

  const lists = router(
    {
      list: list("/lists", "List mailing lists (filters[name])."),
      get: get((i) => `/lists/${seg(i)}`, "Get a list by id."),
      create: create("/lists", "list", "Create a list."),
      delete: remove((i) => `/lists/${seg(i)}`, "Delete a list."),
    },
    { title: "Lists", description: "Mailing lists contacts subscribe to." },
  );

  const tags = router(
    {
      list: list("/tags", "List tags (search by name)."),
      get: get((i) => `/tags/${seg(i)}`, "Get a tag by id."),
      create: create("/tags", "tag", "Create a tag."),
      update: update((i) => `/tags/${seg(i)}`, "tag", "Update a tag."),
      delete: remove((i) => `/tags/${seg(i)}`, "Delete a tag."),
    },
    { title: "Tags", description: "Tags applied to contacts." },
  );

  const fields = router(
    {
      list: list("/fields", "List contact custom fields."),
      get: get((i) => `/fields/${seg(i)}`, "Get a custom field by id."),
      create: create("/fields", "field", "Create a contact custom field."),
      update: update((i) => `/fields/${seg(i)}`, "field", "Update a contact custom field."),
      delete: remove((i) => `/fields/${seg(i)}`, "Delete a contact custom field."),
    },
    { title: "Custom fields", description: "Contact custom field definitions." },
  );

  const campaigns = router(
    {
      list: list("/campaigns", "List campaigns."),
      get: get((i) => `/campaigns/${seg(i)}`, "Get a campaign by id."),
      links: children((i) => `/campaigns/${seg(i)}/links`, "List the links in a campaign."),
      messages: list("/messages", "List email messages (campaign content)."),
      getMessage: get((i) => `/messages/${seg(i)}`, "Get a message by id."),
      createMessage: create("/messages", "message", "Create an email message."),
      updateMessage: update((i) => `/messages/${seg(i)}`, "message", "Update an email message."),
      deleteMessage: remove((i) => `/messages/${seg(i)}`, "Delete an email message."),
      createCampaign: mutation(
        { description: `Create a campaign (POST /campaigns). ${bodyDoc("campaign")}`, input: object({ body: json() }) },
        (_c, { body }) => call("POST", "/campaigns", {}, body),
      ),
      templates: list("/templates", "List email templates."),
    },
    { title: "Campaigns", description: "Email campaigns, messages and templates." },
  );

  const automations = router(
    {
      list: list("/automations", "List automations."),
      get: get((i) => `/automations/${seg(i)}`, "Get an automation by id."),
      contactAutomations: list("/contactAutomations", "List contacts' automation enrollments (filters[seriesid], filters[contact])."),
      blocks: list("/automationBlocks", "List automation blocks."),
      goals: list("/contactGoals", "List contact goal completions."),
    },
    { title: "Automations", description: "Automations and contact enrollments." },
  );

  const forms = router(
    {
      list: list("/forms", "List forms."),
      get: get((i) => `/forms/${seg(i)}`, "Get a form by id."),
    },
    { title: "Forms", description: "Subscription and signup forms." },
  );

  const webhooks = router(
    {
      list: list("/webhooks", "List webhooks."),
      get: get((i) => `/webhooks/${seg(i)}`, "Get a webhook by id."),
      create: create("/webhooks", "webhook", "Create a webhook."),
      update: update((i) => `/webhooks/${seg(i)}`, "webhook", "Update a webhook."),
      delete: remove((i) => `/webhooks/${seg(i)}`, "Delete a webhook."),
      events: query({ description: "List the event types a webhook can subscribe to.", input: object({}) }, () =>
        call("GET", "/webhook/events"),
      ),
    },
    { title: "Webhooks", description: "Webhook subscriptions to account events." },
  );

  const users = router(
    {
      me: query({ description: "Get the user that owns the API key.", input: object({}) }, () => call("GET", "/users/me")),
      list: list("/users", "List users."),
      get: get((i) => `/users/${seg(i)}`, "Get a user by id."),
      groups: list("/groups", "List user groups."),
    },
    { title: "Users", description: "Users and groups in the account." },
  );

  const ecommerce = router(
    {
      connections: list("/connections", "List ecommerce connections."),
      createConnection: create("/connections", "connection", "Create an ecommerce connection."),
      customers: list("/ecomCustomers", "List ecommerce customers."),
      createCustomer: create("/ecomCustomers", "ecomCustomer", "Create an ecommerce customer."),
      orders: list("/ecomOrders", "List ecommerce orders (filters[state]: 0 pending, 1 completed, 2 abandoned, 3 recovered, 4 waiting; filters[email], filters[externalcheckoutid], filters[connectionid], filters[customerid])."),
      getOrder: get((i) => `/ecomOrders/${seg(i)}`, "Get an ecommerce order by id."),
      createOrder: create("/ecomOrders", "ecomOrder", "Create an ecommerce order."),
      updateOrder: update((i) => `/ecomOrders/${seg(i)}`, "ecomOrder", "Update an ecommerce order."),
      deleteOrder: remove((i) => `/ecomOrders/${seg(i)}`, "Delete an ecommerce order."),
      products: children((i) => `/ecomOrders/${seg(i)}/orderProducts`, "List the products in an order."),
    },
    { title: "Ecommerce", description: "Deep Data connections, customers and orders." },
  );

  return router({
    contacts,
    accounts,
    deals,
    lists,
    tags,
    fields,
    campaigns,
    automations,
    forms,
    webhooks,
    users,
    ecommerce,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the ActiveCampaign v3 REST API. path is relative to /api/3, for example /savedResponses. Prefer the dedicated tools.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: Query.optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#")) throw new Error("path must start with / and stay under /api/3");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { activecampaign: activecampaign.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.activecampaign ?? [],
        (account) =>
          withApprovals(build(client(origin(account), account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ActiveCampaign",
        description:
          "Contacts, accounts, deals and pipelines, lists, tags, custom fields, campaigns, automations, forms, webhooks and ecommerce data in ActiveCampaign.",
        icons,
        instructions:
          "Create and update tools take a body wrapped in the resource name, for example {\"contact\": {\"email\": \"a@b.com\"}}. List tools accept limit (default 20, max 100 per the pagination docs), offset and a query record for filters[...] and orders[...] keys.",
      },
    ),
  }),
);
