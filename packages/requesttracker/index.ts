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

// RT is self-hosted: every account names its own instance, with or without the /REST/2.0 suffix.
function origin(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "").replace(/\/REST\/2\.0$/i, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter the base URL of your RT server, for example https://rt.example.com");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("The RT URL must be http(s)");
  if (parsed.username || parsed.password || parsed.search || parsed.hash)
    throw new Error("The RT URL must not contain credentials, a query or a fragment");
  return `${parsed.origin}${parsed.pathname === "/" ? "" : parsed.pathname}`;
}

type Account =
  | { method: "apiKey"; fields: { url: string; token: string } }
  | { method: "basic"; fields: { url: string; username: string; password: string } };

function authorization(account: Account) {
  return account.method === "apiKey"
    ? `token ${account.fields.token}`
    : `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}`;
}

const rt = defineProvider({
  name: "Request Tracker",
  // No `hosts`: the RT URL is entered per account, so it cannot be declared statically. Trade-off: without
  // `hosts` the token/password are readable by app code and are not restricted to a destination; they are
  // sent only to the user-entered URL. The framework documents no dynamic-host mechanism (gap to raise).
  auth: {
    apiKey: secrets({
      label: "Authentication token",
      fields: object({
        url: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    basic: secrets({
      label: "Username and password",
      fields: object({
        url: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account.fields.url);
    const response = await fetch(`${base}/REST/2.0/rt`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(base).host, displayName: new URL(base).host } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | string[] | undefined>;

function client(base: string, auth: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use query parameters");
    const root = `${base}/REST/2.0`;
    const url = new URL(`${root}${path}`);
    if (url.origin !== new URL(base).origin || !url.pathname.startsWith(`${new URL(root).pathname}/`))
      throw new Error("path must stay under /REST/2.0 on the RT server");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const v of value) url.searchParams.append(key, v);
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: auth,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const id = () => string({ minLength: 1 });
const Pagination = {
  page: number().optional(),
  per_page: number().optional(),
  fields: string().optional(),
  orderby: string().optional(),
  order: string().optional(),
};
const pageDoc =
  "Results are paged: page starts at 1, per_page defaults to 20 (max 100). fields adds comma-separated fields to each item, for example \"Subject,Status,Owner\". orderby with order ASC or DESC sorts results.";

function build(call: Call) {
  const paged = (i: { page?: number; per_page?: number; fields?: string; orderby?: string; order?: string }) => ({
    page: i.page,
    per_page: i.per_page,
    fields: i.fields,
    orderby: i.orderby,
    order: i.order,
  });
  const searchBody = json();
  const searchDoc =
    "conditions is a JSON array of {field, value, operator?} objects, for example [{\"field\":\"Name\",\"value\":\"Support\"}]; omit for no filter.";

  // JSON-search collections (queues, users, groups, ...) all accept POST /<plural> with an array of conditions.
  const search = (path: string, description: string) =>
    query(
      {
        description: `${description} ${searchDoc} ${pageDoc}`,
        input: object({ conditions: searchBody.optional(), ...Pagination }),
      },
      (_c, i) => call("POST", path, paged(i), i.conditions ?? []),
    );
  const childSearch = (path: (i: string) => string, description: string) =>
    query(
      {
        description: `${description} ${searchDoc} ${pageDoc}`,
        input: object({ id: id(), conditions: searchBody.optional(), ...Pagination }),
      },
      (_c, i) => call("POST", path(i.id), paged(i), i.conditions ?? []),
    );
  const get = (path: (i: string) => string, description: string) =>
    query(
      {
        description: `${description} fields adds comma-separated fields to the result.`,
        input: object({ id: id(), fields: string().optional() }),
      },
      (_c, { id: i, fields }) => call("GET", path(i), { fields }),
    );
  const create = (path: string, description: string) =>
    mutation(
      { description: `${description} body holds the record fields in RT's CamelCase names.`, input: object({ body: json() }) },
      (_c, { body }) => call("POST", path, {}, body),
    );
  const update = (path: (i: string) => string, description: string) =>
    mutation(
      { description: `${description} body holds only the fields to change.`, input: object({ id: id(), body: json() }) },
      (_c, { id: i, body }) => call("PUT", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const history = (path: (i: string) => string, description: string) =>
    query(
      { description: `${description} ${pageDoc}`, input: object({ id: id(), ...Pagination }) },
      (_c, i) => call("GET", path(i.id), paged(i)),
    );

  const reply = (kind: "correspond" | "comment") =>
    mutation(
      {
        description:
          kind === "correspond"
            ? "Reply to a ticket; the requestors are emailed according to the queue's scrips."
            : "Add an internal comment to a ticket; requestors are not notified.",
        input: object({
          id: id(),
          content: string({ minLength: 1 }),
          content_type: string().default("text/plain"),
          subject: string().optional(),
          time_taken: number().optional(),
          status: string().optional(),
          custom_fields: record(json()).optional(),
        }),
      },
      (_c, i) =>
        call("POST", `/ticket/${seg(i.id)}/${kind}`, {}, {
          Content: i.content,
          ContentType: i.content_type,
          Subject: i.subject,
          TimeTaken: i.time_taken,
          Status: i.status,
          CustomFields: i.custom_fields,
        }),
    );

  const ownership = (action: "take" | "untake" | "steal", description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("PUT", `/ticket/${seg(i)}/${action}`));

  const tickets = router(
    {
      search: query(
        {
          description: `Search tickets with a TicketSQL query, for example "Queue = 'General' AND Status = 'open' AND Owner = 'Nobody'". Set simple to true to use RT's simple search syntax instead. saved_search takes a saved search id. ${pageDoc}`,
          input: object({
            query: string().optional(),
            simple: boolean().optional(),
            saved_search: string().optional(),
            ...Pagination,
          }),
        },
        (_c, i) =>
          call("GET", "/tickets", {
            query: i.query,
            simple: i.simple ? 1 : undefined,
            search: i.saved_search,
            ...paged(i),
          }),
      ),
      get: get((i) => `/ticket/${seg(i)}`, "Get a ticket by id: subject, status, queue, owner, requestors, dates and custom fields."),
      create: mutation(
        {
          description:
            "Create a ticket. Queue (name or id) and Subject are the usual minimum; Requestor, Cc, AdminCc, Content, ContentType, Priority, CustomFields (by name or id) and Attachments ([{FileName, FileType, FileContent base64}]) are accepted.",
          input: object({ body: json() }),
        },
        (_c, { body }) => call("POST", "/ticket", {}, body),
      ),
      update: mutation(
        {
          description:
            "Update ticket metadata: Subject, Status, Queue, Owner, Priority, CustomFields, and links (Parent, Child, RefersTo, DependsOn, ... with Add/Delete prefixes). MergeInto: <id> merges into another ticket.",
          input: object({ id: id(), body: json() }),
        },
        (_c, { id: i, body }) => call("PUT", `/ticket/${seg(i)}`, {}, body),
      ),
      delete: remove((i) => `/ticket/${seg(i)}`, "Delete a ticket (sets its status to deleted)."),
      correspond: reply("correspond"),
      comment: reply("comment"),
      take: ownership("take", "Take ownership of an unowned ticket for the authenticated user."),
      untake: ownership("untake", "Give up ownership of a ticket the authenticated user owns."),
      steal: ownership("steal", "Take ownership of a ticket owned by someone else."),
      history: history((i) => `/ticket/${seg(i)}/history`, "List a ticket's transactions (replies, comments, status changes)."),
      attachments: history((i) => `/ticket/${seg(i)}/attachments`, "List the attachments of a ticket."),
      bulk_create: mutation(
        { description: "Create several tickets at once. tickets is an array of ticket bodies as for create.", input: object({ tickets: array(json()) }) },
        (_c, { tickets: t }) => call("POST", "/tickets/bulk", {}, t),
      ),
      bulk_update: mutation(
        { description: "Update several tickets at once. tickets is an array of bodies, each with an id.", input: object({ tickets: array(json()) }) },
        (_c, { tickets: t }) => call("PUT", "/tickets/bulk", {}, t),
      ),
    },
    { title: "Tickets", description: "Search, read, create, update, reply to and comment on tickets." },
  );

  const transactions = router(
    {
      search: search("/transactions", "Search transactions (history entries) across tickets and other objects."),
      get: get((i) => `/transaction/${seg(i)}`, "Get a transaction, including its Content and ContentType."),
      attachments: history((i) => `/transaction/${seg(i)}/attachments`, "List the attachments of a transaction."),
      attachment: get(
        (i) => `/attachment/${seg(i)}`,
        "Get an attachment by id; its Content field is base64-encoded.",
      ),
    },
    { title: "History", description: "Transactions and attachments." },
  );

  const queues = router(
    {
      list: query(
        { description: `List all queues visible to the authenticated user. ${pageDoc}`, input: object(Pagination) },
        (_c, i) => call("GET", "/queues/all", paged(i)),
      ),
      search: search("/queues", "Search queues."),
      get: get((i) => `/queue/${seg(i)}`, "Get a queue by id or name."),
      create: create("/queue", "Create a queue (Name required; also Description, CorrespondAddress, CommentAddress, Lifecycle)."),
      update: update((i) => `/queue/${seg(i)}`, "Update a queue by id or name (set Disabled to disable it)."),
      delete: remove((i) => `/queue/${seg(i)}`, "Disable a queue."),
      history: history((i) => `/queue/${seg(i)}/history`, "List a queue's transactions."),
      customfields: childSearch((i) => `/queue/${seg(i)}/customfields`, "Search the custom fields that apply to a queue."),
    },
    { title: "Queues", description: "Queues that hold tickets." },
  );

  const users = router(
    {
      search: search("/users", "Search users."),
      privileged: search("/users/privileged", "Search privileged users (staff)."),
      unprivileged: search("/users/unprivileged", "Search unprivileged users (requestors)."),
      get: get((i) => `/user/${seg(i)}`, "Get a user by id or username."),
      create: create("/user", "Create a user (Name and EmailAddress required)."),
      update: update((i) => `/user/${seg(i)}`, "Update a user by id or username (set Disabled to disable)."),
      delete: remove((i) => `/user/${seg(i)}`, "Disable a user."),
      history: history((i) => `/user/${seg(i)}/history`, "List a user's transactions."),
      groups: history((i) => `/user/${seg(i)}/groups`, "List the groups a user belongs to."),
      add_to_groups: mutation(
        { description: "Add a user to groups. group_ids is an array of group ids.", input: object({ id: id(), group_ids: array(number()) }) },
        (_c, { id: i, group_ids }) => call("PUT", `/user/${seg(i)}/groups`, {}, group_ids),
      ),
      remove_from_group: mutation(
        { description: "Remove a user from one group.", input: object({ id: id(), group_id: id() }) },
        (_c, { id: i, group_id }) => call("DELETE", `/user/${seg(i)}/group/${seg(group_id)}`),
      ),
    },
    { title: "Users", description: "Users and their group memberships." },
  );

  const groups = router(
    {
      search: search("/groups", "Search groups."),
      get: get((i) => `/group/${seg(i)}`, "Get a group by id."),
      create: create("/group", "Create a user-defined group (Name required)."),
      update: update((i) => `/group/${seg(i)}`, "Update a group."),
      delete: remove((i) => `/group/${seg(i)}`, "Disable a group."),
      history: history((i) => `/group/${seg(i)}/history`, "List a group's transactions."),
      members: query(
        {
          description: `List a group's members. recursively includes nested members; users and groups (false) restrict to groups or users only. ${pageDoc}`,
          input: object({ id: id(), recursively: boolean().optional(), users: boolean().optional(), groups: boolean().optional(), ...Pagination }),
        },
        (_c, i) =>
          call("GET", `/group/${seg(i.id)}/members`, {
            recursively: i.recursively === undefined ? undefined : i.recursively ? 1 : 0,
            users: i.users === undefined ? undefined : i.users ? 1 : 0,
            groups: i.groups === undefined ? undefined : i.groups ? 1 : 0,
            ...paged(i),
          }),
      ),
      add_members: mutation(
        { description: "Add members to a group. member_ids is an array of principal ids.", input: object({ id: id(), member_ids: array(number()) }) },
        (_c, { id: i, member_ids }) => call("PUT", `/group/${seg(i)}/members`, {}, member_ids),
      ),
      remove_member: mutation(
        { description: "Remove one member from a group.", input: object({ id: id(), member_id: id() }) },
        (_c, { id: i, member_id }) => call("DELETE", `/group/${seg(i)}/member/${seg(member_id)}`),
      ),
    },
    { title: "Groups", description: "Groups and their members." },
  );

  const assets = router(
    {
      search: query(
        {
          description: `Search assets with an AssetSQL query, for example "Catalog = 'Laptops' AND Status = 'in-use'". ${pageDoc}`,
          input: object({ query: string().optional(), ...Pagination }),
        },
        (_c, i) => call("GET", "/assets", { query: i.query, ...paged(i) }),
      ),
      get: get((i) => `/asset/${seg(i)}`, "Get an asset by id."),
      create: create("/asset", "Create an asset (Name and Catalog required; Description, Status, Owner, CustomFields optional)."),
      update: update((i) => `/asset/${seg(i)}`, "Update an asset."),
      delete: remove((i) => `/asset/${seg(i)}`, "Delete an asset (sets its status to deleted)."),
      history: history((i) => `/asset/${seg(i)}/history`, "List an asset's transactions."),
    },
    { title: "Assets", description: "Assets tracked in catalogs." },
  );

  const catalogs = router(
    {
      list: query(
        { description: `List all catalogs visible to the authenticated user. ${pageDoc}`, input: object(Pagination) },
        (_c, i) => call("GET", "/catalogs/all", paged(i)),
      ),
      search: search("/catalogs", "Search catalogs."),
      get: get((i) => `/catalog/${seg(i)}`, "Get a catalog by id or name."),
      create: create("/catalog", "Create a catalog (Name required)."),
      update: update((i) => `/catalog/${seg(i)}`, "Update a catalog."),
      delete: remove((i) => `/catalog/${seg(i)}`, "Disable a catalog."),
    },
    { title: "Catalogs", description: "Catalogs that group assets." },
  );

  const articles = router(
    {
      search: search("/articles", "Search knowledge-base articles."),
      get: get((i) => `/article/${seg(i)}`, "Get an article by id."),
      create: create("/article", "Create an article (Name and Class required; Summary, CustomFields optional)."),
      update: update((i) => `/article/${seg(i)}`, "Update an article."),
      delete: remove((i) => `/article/${seg(i)}`, "Delete an article (sets its status to deleted)."),
      history: history((i) => `/article/${seg(i)}/history`, "List an article's transactions."),
      classes: query(
        { description: `List all article classes. ${pageDoc}`, input: object(Pagination) },
        (_c, i) => call("GET", "/classes/all", paged(i)),
      ),
      search_classes: search("/classes", "Search article classes."),
      get_class: get((i) => `/class/${seg(i)}`, "Get an article class by id or name."),
      create_class: create("/class", "Create an article class (Name required)."),
      update_class: update((i) => `/class/${seg(i)}`, "Update an article class."),
      delete_class: remove((i) => `/class/${seg(i)}`, "Disable an article class."),
    },
    { title: "Articles", description: "Knowledge-base articles and their classes." },
  );

  const customfields = router(
    {
      search: search("/customfields", "Search custom fields."),
      get: get((i) => `/customfield/${seg(i)}`, "Get a custom field by id, with its values when it is a Select field."),
      create: create("/customfield", "Create a custom field (Name, Type, LookupType required)."),
      update: update((i) => `/customfield/${seg(i)}`, "Update a custom field."),
      delete: remove((i) => `/customfield/${seg(i)}`, "Disable a custom field."),
      values: childSearch((i) => `/customfield/${seg(i)}/values`, "Search the values of a Select custom field."),
      add_value: mutation(
        {
          description: "Add a value (or an array of values) to a Select custom field, for example {\"Name\":\"High\",\"SortOrder\":1}.",
          input: object({ id: id(), body: json() }),
        },
        (_c, { id: i, body }) => call("POST", `/customfield/${seg(i)}/value`, {}, body),
      ),
      customroles: search("/customroles", "Search custom roles."),
    },
    { title: "Custom fields", description: "Custom fields, their values and custom roles." },
  );

  const searches = router(
    {
      list: search("/searches", "Search saved searches."),
      get: get((i) => `/search/${seg(i)}`, "Get a saved search by id or description."),
    },
    { title: "Saved searches", description: "Saved ticket searches." },
  );

  return router({
    server: query({ description: "Get RT server information, including its version.", input: object({}) }, () => call("GET", "/rt")),
    tickets,
    history: transactions,
    queues,
    users,
    groups,
    assets,
    catalogs,
    articles,
    customfields,
    searches,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the RT REST2 API. path is relative to /REST/2.0, for example /queue/General/rights. Prefer the dedicated tools.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: record(string()).optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#"))
          throw new Error("path must start with / and stay under /REST/2.0");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { requesttracker: rt.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.requesttracker ?? [],
        (account) =>
          withApprovals(build(client(origin(account.fields.url), authorization(account), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Request Tracker (RT)",
        description:
          "Tickets, queues, users, groups, assets, catalogs, knowledge-base articles, custom fields and history in your own Request Tracker instance.",
        icons,
        instructions:
          "RT is self-hosted: the account stores your server's base URL. Find tickets with tickets.search using TicketSQL, then read with tickets.get. Collections return {count, page, pages, total, items}; follow page until items is empty. Use fields to add columns such as Subject,Status,Owner to search results.",
      },
    ),
  }),
);
