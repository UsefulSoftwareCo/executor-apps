import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://api.capsulecrm.com/api/v2";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Personal API tokens and OAuth access tokens are both sent as bearer tokens.
const tokenOf = (account: Account) => (account.method === "oauth" ? account.fields.access_token : account.fields.token);

const User = object({
  user: object({ id: number() }),
});

const capsulecrm = defineProvider({
  name: "Capsule CRM",
  hosts: ["api.capsulecrm.com"],
  auth: {
    token: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Capsule publishes no OAuth metadata and no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://api.capsulecrm.com/oauth/authorise",
      tokenUrl: "https://api.capsulecrm.com/oauth/token",
      revocationUrl: "https://api.capsulecrm.com/oauth/token/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["read", "write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/current`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: String(me.user.id) } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}${path}`);
    if (url.origin !== "https://api.capsulecrm.com" || !url.pathname.startsWith("/api/v2/"))
      throw new Error("path must stay under /api/v2");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // Retry rate limits (429) a bounded number of times, honoring Retry-After.
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
const Query = record(string());
const listInput = object({
  page: number().optional(),
  perPage: number().optional(),
  embed: string().optional(),
  query: Query.optional(),
});
const listDoc =
  "Paginated: page (from 1) and perPage (max 100). embed is a comma-separated list of related data (for example tags,fields,missingImportantFields). query holds extra query parameters.";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${listDoc}`, input: listInput }, (_c, { page, perPage, embed, query: q }) =>
      call("GET", path, { page, perPage, embed, ...(q ?? {}) }),
    );
  const search = (path: string, description: string) =>
    query(
      {
        description: `${description} ${listDoc}`,
        input: object({ q: string({ minLength: 1 }), page: number().optional(), perPage: number().optional(), embed: string().optional() }),
      },
      (_c, { q, page, perPage, embed }) => call("GET", path, { q, page, perPage, embed }),
    );
  const get = (path: (i: string) => string, description: string) =>
    query(
      { description: `${description} embed is a comma-separated list of related data.`, input: object({ id: id(), embed: string().optional() }) },
      (_c, { id: i, embed }) => call("GET", path(i), { embed }),
    );
  const create = (path: string, wrapper: string, description: string) =>
    mutation(
      { description: `${description} Body is wrapped as {"${wrapper}": {...}}.`, input: object({ body: json() }) },
      (_c, { body }) => call("POST", path, {}, body),
    );
  const update = (path: (i: string) => string, wrapper: string, description: string) =>
    mutation(
      { description: `${description} Send only the changed fields, wrapped as {"${wrapper}": {...}}.`, input: object({ id: id(), body: json() }) },
      (_c, { id: i, body }) => call("PUT", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));
  const children = (path: (i: string) => string, description: string) =>
    query(
      { description: `${description} ${listDoc}`, input: object({ id: id(), page: number().optional(), perPage: number().optional(), embed: string().optional() }) },
      (_c, { id: i, page, perPage, embed }) => call("GET", path(i), { page, perPage, embed }),
    );

  const parties = router(
    {
      list: list("/parties", "List contacts (people and organisations). Filter with since (ISO 8601) in query."),
      search: search("/parties/search", "Search contacts by name, email, phone or other text."),
      get: get((i) => `/parties/${seg(i)}`, "Get a contact by id."),
      create: create("/parties", "party", "Create a person or organisation (type: person or organisation)."),
      update: update((i) => `/parties/${seg(i)}`, "party", "Update a contact."),
      delete: remove((i) => `/parties/${seg(i)}`, "Delete a contact."),
      people: children((i) => `/parties/${seg(i)}/people`, "List the people employed by an organisation."),
      opportunities: children((i) => `/parties/${seg(i)}/opportunities`, "List opportunities linked to a contact."),
      projects: children((i) => `/parties/${seg(i)}/kases`, "List projects (cases) linked to a contact."),
      entries: children((i) => `/parties/${seg(i)}/entries`, "List notes, emails and other entries for a contact."),
      tags: list("/parties/tags", "List tags available for contacts."),
      fieldDefinitions: list("/parties/fields/definitions", "List custom field definitions for contacts."),
    },
    { title: "Contacts", description: "People and organisations (Capsule parties)." },
  );

  const opportunities = router(
    {
      list: list("/opportunities", "List opportunities."),
      search: search("/opportunities/search", "Search opportunities by name or description."),
      get: get((i) => `/opportunities/${seg(i)}`, "Get an opportunity by id."),
      create: create("/opportunities", "opportunity", "Create an opportunity (party, milestone and name are required)."),
      update: update((i) => `/opportunities/${seg(i)}`, "opportunity", "Update an opportunity, for example to move its milestone."),
      delete: remove((i) => `/opportunities/${seg(i)}`, "Delete an opportunity."),
      parties: children((i) => `/opportunities/${seg(i)}/parties`, "List additional contacts on an opportunity."),
      entries: children((i) => `/opportunities/${seg(i)}/entries`, "List entries on an opportunity."),
      tags: list("/opportunities/tags", "List tags available for opportunities."),
      fieldDefinitions: list("/opportunities/fields/definitions", "List custom field definitions for opportunities."),
    },
    { title: "Opportunities", description: "Sales opportunities moving through a pipeline." },
  );

  const projects = router(
    {
      list: list("/kases", "List projects (called cases in the API)."),
      search: search("/kases/search", "Search projects."),
      get: get((i) => `/kases/${seg(i)}`, "Get a project by id."),
      create: create("/kases", "kase", "Create a project (party and name are required)."),
      update: update((i) => `/kases/${seg(i)}`, "kase", "Update a project, for example to close it."),
      delete: remove((i) => `/kases/${seg(i)}`, "Delete a project."),
      parties: children((i) => `/kases/${seg(i)}/parties`, "List additional contacts on a project."),
      entries: children((i) => `/kases/${seg(i)}/entries`, "List entries on a project."),
      tags: list("/kases/tags", "List tags available for projects."),
      fieldDefinitions: list("/kases/fields/definitions", "List custom field definitions for projects."),
    },
    { title: "Projects", description: "Projects, called kases (cases) in the API." },
  );

  const tasks = router(
    {
      list: list("/tasks", "List tasks. Filter with status (open, completed, pending) in query."),
      get: get((i) => `/tasks/${seg(i)}`, "Get a task by id."),
      create: create("/tasks", "task", "Create a task (description required; link a party, opportunity or kase)."),
      update: update((i) => `/tasks/${seg(i)}`, "task", "Update a task, for example to complete it with status completed."),
      delete: remove((i) => `/tasks/${seg(i)}`, "Delete a task."),
      categories: list("/categories", "List task categories."),
    },
    { title: "Tasks", description: "Follow-up tasks and their categories." },
  );

  const entries = router(
    {
      list: list("/entries", "List recent entries (notes, emails, completed tasks) across the account."),
      get: get((i) => `/entries/${seg(i)}`, "Get an entry by id."),
      create: create("/entries", "entry", "Create a note (type note, content and a party, opportunity or kase)."),
      update: update((i) => `/entries/${seg(i)}`, "entry", "Update a note."),
      delete: remove((i) => `/entries/${seg(i)}`, "Delete an entry."),
      activityTypes: list("/activitytypes", "List activity types for entries."),
    },
    { title: "Entries", description: "Notes, emails and history entries." },
  );

  const pipelines = router(
    {
      list: list("/pipelines", "List sales pipelines."),
      get: get((i) => `/pipelines/${seg(i)}`, "Get a pipeline by id."),
      milestones: list("/milestones", "List milestones (pipeline stages)."),
      getMilestone: get((i) => `/milestones/${seg(i)}`, "Get a milestone by id."),
      lostReasons: list("/lostreasons", "List reasons an opportunity can be lost."),
    },
    { title: "Pipelines", description: "Pipelines, milestones and lost reasons." },
  );

  const boards = router(
    {
      list: list("/boards", "List boards."),
      get: get((i) => `/boards/${seg(i)}`, "Get a board by id."),
      stages: list("/stages", "List board stages."),
      getStage: get((i) => `/stages/${seg(i)}`, "Get a stage by id."),
    },
    { title: "Boards", description: "Project boards and their stages." },
  );

  const tracks = router(
    {
      definitions: list("/trackdefinitions", "List track definitions (task templates)."),
      getDefinition: get((i) => `/trackdefinitions/${seg(i)}`, "Get a track definition by id."),
      list: list("/tracks", "List tracks applied to records."),
      get: get((i) => `/tracks/${seg(i)}`, "Get a track by id."),
    },
    { title: "Tracks", description: "Track definitions and applied tracks." },
  );

  const users = router(
    {
      current: query({ description: "Get the user that owns the token.", input: object({}) }, () => call("GET", "/users/current")),
      list: list("/users", "List users in the account."),
      get: get((i) => `/users/${seg(i)}`, "Get a user by id."),
    },
    { title: "Users", description: "Users in the Capsule account." },
  );

  const reference = router(
    {
      site: query({ description: "Get account details (name, URL, plan).", input: object({}) }, () => call("GET", "/site")),
      titles: list("/titles", "List contact titles (Mr, Ms ...)."),
      countries: list("/countries", "List countries."),
      currencies: list("/currencies", "List currencies."),
      filters: list("/filters", "List saved filters."),
    },
    { title: "Reference", description: "Account details and lookup lists." },
  );

  const webhooks = router(
    {
      list: list("/resthooks", "List webhook (REST hook) subscriptions."),
      create: create("/resthooks", "restHook", "Subscribe a target URL to an event, for example {\"restHook\": {\"event\": \"party/created\", \"targetUrl\": \"https://...\"}}."),
      delete: remove((i) => `/resthooks/${seg(i)}`, "Delete a webhook subscription."),
      events: query({ description: "List the event names a webhook can subscribe to.", input: object({}) }, () =>
        call("GET", "/resthooks/events"),
      ),
    },
    { title: "Webhooks", description: "REST hook subscriptions." },
  );

  return router({
    parties,
    opportunities,
    projects,
    tasks,
    entries,
    pipelines,
    boards,
    tracks,
    users,
    reference,
    webhooks,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Capsule v2 REST API. path is relative to /api/v2, for example /parties/filters/results. Prefer the dedicated tools.",
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
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#")) throw new Error("path must start with / and stay under /api/v2");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { capsulecrm: capsulecrm.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.capsulecrm ?? [],
        (account) =>
          withApprovals(build(client(tokenOf(account), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Capsule CRM",
        description:
          "Contacts, opportunities, projects, tasks, notes, pipelines, boards, tracks, users and webhooks in Capsule CRM.",
        icons,
        instructions:
          "Create and update tools take a body wrapped in the resource name, for example {\"party\": {\"type\": \"person\", \"firstName\": \"Ada\"}}. Capsule calls projects kases and contacts parties. List tools paginate with page and perPage (max 100) and accept embed for related data.",
      },
    ),
  }),
);
