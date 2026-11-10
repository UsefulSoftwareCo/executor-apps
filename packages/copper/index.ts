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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.copper.com/developer_api/v1";

type Credentials = { token: string; email: string };

const headersOf = ({ token, email }: Credentials): Record<string, string> => ({
  "X-PW-AccessToken": token,
  "X-PW-Application": "developer_api",
  "X-PW-UserEmail": email,
  Accept: "application/json",
});

const copper = defineProvider({
  name: "Copper",
  hosts: ["api.copper.com"],
  auth: {
    // Copper API keys are bound to the email of the user who created them; both are required on every request.
    apiKey: secrets({
      label: "API key and user email",
      fields: object({ token: string({ minLength: 1 }), email: string({ minLength: 3 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, { signal, headers: headersOf(account.fields) });
    const info = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: String(info.id), username: info.name } };
  },
});

type Fetch = typeof fetch;

function client(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, query: Record<string, string> = {}, body?: unknown) => {
    if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#"))
      throw new Error("path must start with / and must not contain .., //, ? or #");
    const url = new URL(`${base}${path}`);
    if (url.origin !== "https://api.copper.com" || !url.pathname.startsWith("/developer_api/v1/"))
      throw new Error("path must stay under /developer_api/v1");
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: { ...headersOf(credentials), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // Copper allows 180 requests a minute; retry 429s a bounded number of times.
    let response = await send();
    for (let attempt = 0; attempt < 3 && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1), 10_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204 || (method === "DELETE" && response.ok && (await response.clone().text()) === "")) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const Id = () => string({ minLength: 1 });
const Query = record(string());
const searchDoc =
  "Paginated with page_number (from 1) and page_size (max 200). Other filters go in body as in the Copper docs (for example name, emails, sort_by, sort_direction, minimum_modified_date, custom_fields).";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description, input: object({}) }, () => call("GET", path));
  const get = (path: (id: string) => string, description: string) =>
    query({ description, input: object({ id: Id() }) }, (_c, { id }) => call("GET", path(id)));
  const search = (path: string, description: string) =>
    query({ description: `${description} ${searchDoc}`, input: object({ body: json().optional() }) }, (_c, { body }) =>
      call("POST", path, {}, body ?? {}),
    );
  const create = (path: string, description: string) =>
    mutation({ description, input: object({ body: json() }) }, (_c, { body }) => call("POST", path, {}, body));
  const update = (path: (id: string) => string, description: string) =>
    mutation({ description: `${description} Send only the fields to change.`, input: object({ id: Id(), body: json() }) }, (_c, { id, body }) =>
      call("PUT", path(id), {}, body),
    );
  const remove = (path: (id: string) => string, description: string) =>
    mutation({ description, input: object({ id: Id() }) }, (_c, { id }) => call("DELETE", path(id)));
  const activities = (path: (id: string) => string, description: string) =>
    query({ description, input: object({ id: Id(), body: json().optional() }) }, (_c, { id, body }) =>
      call("POST", path(id), {}, body ?? {}),
    );

  const leads = router(
    {
      search: search("/leads/search", "List or search leads."),
      get: get((i) => `/leads/${seg(i)}`, "Get a lead by id."),
      create: create("/leads", "Create a lead (name required)."),
      update: update((i) => `/leads/${seg(i)}`, "Update a lead."),
      delete: remove((i) => `/leads/${seg(i)}`, "Delete a lead."),
      upsert: mutation(
        { description: "Create or update a lead matched by properties (for example email) or custom_fields in the body.", input: object({ body: json() }) },
        (_c, { body }) => call("PUT", "/leads/upsert", {}, body),
      ),
      convert: mutation(
        { description: "Convert a lead into a person, optionally with a company and opportunity (details object in the body).", input: object({ id: Id(), body: json() }) },
        (_c, { id, body }) => call("POST", `/leads/${seg(id)}/convert`, {}, body),
      ),
      activities: activities((i) => `/leads/${seg(i)}/activities`, "List activities logged on a lead."),
      statuses: list("/lead_statuses", "List lead statuses."),
    },
    { title: "Leads", description: "Leads and lead statuses." },
  );

  const people = router(
    {
      search: search("/people/search", "List or search people."),
      get: get((i) => `/people/${seg(i)}`, "Get a person by id."),
      fetchByEmail: query(
        { description: "Fetch a person by exact email address.", input: object({ email: string({ minLength: 3 }) }) },
        (_c, { email }) => call("POST", "/people/fetch_by_email", {}, { email }),
      ),
      create: create("/people", "Create a person (name required)."),
      update: update((i) => `/people/${seg(i)}`, "Update a person."),
      delete: remove((i) => `/people/${seg(i)}`, "Delete a person."),
      activities: activities((i) => `/people/${seg(i)}/activities`, "List activities logged on a person."),
      contactTypes: list("/contact_types", "List contact types for people and companies."),
    },
    { title: "People", description: "People (contacts) and contact types." },
  );

  const companies = router(
    {
      search: search("/companies/search", "List or search companies."),
      get: get((i) => `/companies/${seg(i)}`, "Get a company by id."),
      create: create("/companies", "Create a company (name required)."),
      update: update((i) => `/companies/${seg(i)}`, "Update a company."),
      delete: remove((i) => `/companies/${seg(i)}`, "Delete a company."),
      activities: activities((i) => `/companies/${seg(i)}/activities`, "List activities logged on a company."),
    },
    { title: "Companies", description: "Companies." },
  );

  const opportunities = router(
    {
      search: search("/opportunities/search", "List or search opportunities (filter by pipeline_ids, status_ids, name, ...)."),
      get: get((i) => `/opportunities/${seg(i)}`, "Get an opportunity by id."),
      create: create("/opportunities", "Create an opportunity (name and primary_contact_id required)."),
      update: update((i) => `/opportunities/${seg(i)}`, "Update an opportunity, for example to move its pipeline_stage_id."),
      delete: remove((i) => `/opportunities/${seg(i)}`, "Delete an opportunity."),
      pipelines: list("/pipelines", "List pipelines."),
      pipelineStages: list("/pipeline_stages", "List all pipeline stages."),
      stagesInPipeline: get((i) => `/pipeline_stages/pipeline/${seg(i)}`, "List the stages of one pipeline (id is the pipeline id)."),
      lossReasons: list("/loss_reasons", "List loss reasons."),
      customerSources: list("/customer_sources", "List customer sources."),
    },
    { title: "Opportunities", description: "Opportunities, pipelines, stages, loss reasons and customer sources." },
  );

  const projects = router(
    {
      search: search("/projects/search", "List or search projects."),
      get: get((i) => `/projects/${seg(i)}`, "Get a project by id."),
      create: create("/projects", "Create a project (name required)."),
      update: update((i) => `/projects/${seg(i)}`, "Update a project."),
      delete: remove((i) => `/projects/${seg(i)}`, "Delete a project."),
    },
    { title: "Projects", description: "Projects." },
  );

  const tasks = router(
    {
      search: search("/tasks/search", "List or search tasks."),
      get: get((i) => `/tasks/${seg(i)}`, "Get a task by id."),
      create: create("/tasks", "Create a task (name required)."),
      update: update((i) => `/tasks/${seg(i)}`, "Update a task, for example status Completed."),
      delete: remove((i) => `/tasks/${seg(i)}`, "Delete a task."),
    },
    { title: "Tasks", description: "Tasks." },
  );

  const activityTools = router(
    {
      search: search("/activities/search", "List or search activities (notes, calls, meetings, custom types)."),
      get: get((i) => `/activities/${seg(i)}`, "Get an activity by id."),
      create: create("/activities", "Log an activity: body has parent {type, id}, type {category, id} and details."),
      delete: remove((i) => `/activities/${seg(i)}`, "Delete an activity."),
      types: list("/activity_types", "List activity types (user and system)."),
      customTypes: list("/custom_activity_types", "List custom activity types."),
      getCustomType: get((i) => `/custom_activity_types/${seg(i)}`, "Get a custom activity type by id."),
      createCustomType: create("/custom_activity_types", "Create a custom activity type."),
      updateCustomType: update((i) => `/custom_activity_types/${seg(i)}`, "Update a custom activity type."),
    },
    { title: "Activities", description: "Activities and activity types." },
  );

  const customFields = router(
    {
      definitions: list("/custom_field_definitions", "List custom field definitions."),
      get: get((i) => `/custom_field_definitions/${seg(i)}`, "Get a custom field definition by id."),
      create: create("/custom_field_definitions", "Create a custom field definition."),
      update: update((i) => `/custom_field_definitions/${seg(i)}`, "Update a custom field definition."),
      delete: remove((i) => `/custom_field_definitions/${seg(i)}`, "Delete a custom field definition."),
      connections: query(
        {
          description: "List the connections of a Connect custom field on a record.",
          input: object({ custom_field_definition_id: Id(), source_type: Id(), source_id: Id() }),
        },
        (_c, q) => call("GET", "/related_links", q),
      ),
      connect: create("/related_links", "Create a connection for a Connect custom field."),
      disconnect: remove((i) => `/related_links/${seg(i)}`, "Delete a Connect custom field connection."),
    },
    { title: "Custom fields", description: "Custom field definitions and Connect field links." },
  );

  const related = router(
    {
      list: query(
        {
          description: "List records related to an entity. entity is leads, people, companies, opportunities, projects or tasks; relatedEntity optionally narrows to one type.",
          input: object({ entity: Id(), id: Id(), relatedEntity: string().optional() }),
        },
        (_c, { entity, id, relatedEntity }) =>
          call("GET", `/${seg(entity)}/${seg(id)}/related${relatedEntity === undefined ? "" : `/${seg(relatedEntity)}`}`),
      ),
      add: mutation(
        { description: "Relate an existing record to an entity: body is {resource: {id, type}}.", input: object({ entity: Id(), id: Id(), body: json() }) },
        (_c, { entity, id, body }) => call("POST", `/${seg(entity)}/${seg(id)}/related`, {}, body),
      ),
      remove: mutation(
        { description: "Remove a relationship: body is {resource: {id, type}}.", input: object({ entity: Id(), id: Id(), body: json() }) },
        (_c, { entity, id, body }) => call("DELETE", `/${seg(entity)}/${seg(id)}/related`, {}, body),
      ),
    },
    { title: "Related items", description: "Relationships between records." },
  );

  const files = router(
    {
      list: query(
        { description: "List files attached to a record.", input: object({ entity: Id(), id: Id() }) },
        (_c, { entity, id }) => call("GET", `/${seg(entity)}/${seg(id)}/files`),
      ),
      get: query(
        { description: "Get metadata of an attached file.", input: object({ entity: Id(), id: Id(), fileId: Id() }) },
        (_c, { entity, id, fileId }) => call("GET", `/${seg(entity)}/${seg(id)}/files/${seg(fileId)}`),
      ),
    },
    { title: "Files", description: "Files attached to records (read only; uploads go through signed S3 URLs and are not supported)." },
  );

  const webhooks = router(
    {
      list: list("/webhooks", "List webhook subscriptions."),
      get: get((i) => `/webhooks/${seg(i)}`, "Get a webhook subscription by id."),
      create: create("/webhooks", "Subscribe: body has target, type (an entity) and event (new, update, delete)."),
      delete: remove((i) => `/webhooks/${seg(i)}`, "Delete a webhook subscription."),
    },
    { title: "Webhooks", description: "Webhook subscriptions." },
  );

  const account = router(
    {
      get: query({ description: "Get the Copper account (id and name).", input: object({}) }, () => call("GET", "/account")),
      users: search("/users/search", "List users in the account."),
      getUser: get((i) => `/users/${seg(i)}`, "Get a user by id."),
      tags: list("/tags", "List all tags."),
    },
    { title: "Account", description: "Account, users and tags." },
  );

  return router({
    account,
    leads,
    people,
    companies,
    opportunities,
    projects,
    tasks,
    activities: activityTools,
    customFields,
    related,
    files,
    webhooks,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Copper developer API v1. path is relative to /developer_api/v1, for example /people/bulk. Prefer the dedicated tools.",
        input: object({ method: string(), path: string({ minLength: 1 }), query: Query.optional(), body: json().optional() }),
      },
      (_c, { method, path, query: q, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { copper: copper.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.copper ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Copper",
        description:
          "Leads, people, companies, opportunities, projects, tasks, activities, custom fields, related items, files and webhooks in Copper CRM.",
        icons,
        instructions:
          "Search tools are POST requests: pass filters, page_number and page_size (max 200) in body. Create and update bodies are flat JSON objects. Dates are Unix timestamps in seconds.",
      },
    ),
  }),
);
