import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const base = "https://api.hubplanner.com/v1";

const hubplanner = defineProvider({
  name: "Hub Planner",
  hosts: ["api.hubplanner.com"],
  auth: {
    // Hub Planner (now Resource Flow) offers only API keys, created by an administrator under Settings -> API.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // The key goes in Authorization without a "Bearer" prefix.
    const response = await fetch(`${base}/project?limit=1`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json", "Content-Type": "application/json" },
    });
    // Hub Planner has no current-user endpoint; a one-item project list is the cheapest read-only call that fails on a bad key.
    await decodeJson(response, array(object({ _id: string() })));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: token,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Executor (executor.sh)",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();

function fill(path: string, ids: readonly string[], input: Params): string {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

// Reads take path ids and a `query` object of URL parameters (page, limit, sort, ...).
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }) },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

// Searches POST a MongoDB-style filter as the body; they do not change data.
function search(call: Call, path: string, description: string) {
  return query(
    {
      description: `${description} body is a filter object such as {"resource": {"$in": ["id1"]}}; operators $in, $nin, $lt, $lte, $gt, $gte. Pagination and sort go in query.`,
      input: object({ body: record(json()), query: filters }),
    },
    async (_ctx, input: Params) => call("POST", path, (input.query as Params | undefined) ?? {}, input.body),
  );
}

// Writes take path ids, `query`, and a JSON `body` (an object, or an array where the API expects one).
function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody = true) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(hasBody ? { body: json() } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, ids, input), (input.query as Params | undefined) ?? {}, hasBody ? input.body : undefined),
  );
}

function build(call: Call) {
  const list = (noun: string, path: string) =>
    read(call, path, `List ${noun}. Pagination: query.page (from 0) and query.limit (1-1000); query.sort, e.g. "-name".`);
  const crud = (
    noun: string,
    plural: string,
    path: string,
    opts: { search?: boolean; update?: Method; remove?: boolean; create?: boolean } = {},
  ) => ({
    list: list(plural, `/${path}`),
    get: read(call, `/${path}/{id}`, `Retrieve a ${noun} by id.`, ["id"]),
    ...(opts.search === false ? {} : { search: search(call, `/${path}/search`, `Search ${plural}.`) }),
    ...(opts.create === false ? {} : { create: write(call, "POST", `/${path}`, `Create a ${noun}. body is the ${noun} object from the Hub Planner API reference.`) }),
    ...(opts.update === undefined
      ? {}
      : { update: write(call, opts.update as Exclude<Method, "GET">, `/${path}/{id}`, `Update a ${noun}. ${opts.update === "PUT" ? "body is the full object." : "body holds the fields to change."}`, ["id"]) }),
    ...(opts.remove === false ? {} : { delete: write(call, "DELETE", `/${path}/{id}`, `Delete a ${noun}.`, ["id"], false) }),
  });

  const tags = (noun: string, path: string) => ({
    list: list(`${noun} tags`, `/${path}-tag`),
    create: write(call, "POST", `/${path}-tag`, `Create a ${noun} tag. body: {"value": "..."}.`),
    update: write(call, "PUT", `/${path}-tag/{id}`, `Rename a ${noun} tag.`, ["id"]),
    delete: write(call, "DELETE", `/${path}-tag/{id}`, `Delete a ${noun} tag.`, ["id"], false),
    onItem: read(call, `/${path}/{id}/tag`, `List the tags on one ${noun}.`, ["id"]),
    addToItem: write(call, "PATCH", `/${path}/{id}/tag`, `Add tags to a ${noun}. body: {"tags": ["tagId", ...]}.`, ["id"]),
    removeFromItem: write(call, "DELETE", `/${path}/{id}/tag/{tagId}`, `Remove a tag from a ${noun}.`, ["id", "tagId"], false),
  });

  const customFields = (noun: string, path: string) => ({
    list: read(call, `/${path}/customField/template`, `List ${noun} custom field templates.`),
    get: read(call, `/${path}/customField/template/{id}`, `Retrieve a ${noun} custom field template.`, ["id"]),
    search: search(call, `/${path}/customField/template/search`, `Search ${noun} custom field templates.`),
    create: write(call, "POST", `/${path}/customField/template`, `Create a ${noun} custom field template.`),
    update: write(call, "PUT", `/${path}/customField/template/{id}`, `Update a ${noun} custom field template.`, ["id"]),
    delete: write(call, "DELETE", `/${path}/customField/template/{id}`, `Delete a ${noun} custom field template.`, ["id"], false),
    addChoices: write(call, "POST", `/${path}/customField/template/{id}/addChoices`, `Add choices to a ${noun} custom field template.`, ["id"]),
  });

  return router({
    projects: router(
      {
        ...crud("project", "projects", "project"),
        update: write(call, "PATCH", "/project", "Update projects. body is an array of project objects that each carry _id plus the fields to change; a single update is a one-element array.", [], true),
        deleteMany: write(call, "DELETE", "/project", "Delete several projects. body is an array of project ids.", [], true),
        addResources: write(call, "POST", "/project/addResourcesToProject/{projectId}", 'Add resources to a project. body: {"resourceIds": [...]}.', ["projectId"]),
        removeResourceFromProjects: write(call, "POST", "/project/removeResourceFromProjects/{resourceId}", 'Remove a resource from projects. body: {"projectIds": [...]}.', ["resourceId"]),
        addClients: write(call, "POST", "/project/{projectId}/client/", 'Add clients to a project. body: {"clientIds": [...]}.', ["projectId"]),
        removeClientFromProjects: write(call, "POST", "/project/client/{clientId}", 'Remove a client from projects. body: {"projectIds": [...]}.', ["clientId"]),
        setManagers: write(call, "PUT", "/project/{projectId}/project-managers", "Set a project's managers. body is an array of resource ids.", ["projectId"]),
        managers: list("project managers (resources that can manage projects)", "/project-manager"),
      },
      {
        title: "Projects",
        description:
          "Projects. update is a PATCH: body must be an array of project objects that each carry _id, e.g. [{\"_id\": \"...\", \"name\": \"New\"}]; create takes one project object, or an array to create several.",
      },
    ),
    resources: router(
      {
        ...crud("resource", "resources", "resource"),
        update: write(call, "PATCH", "/resource", "Update resources. body is an array of resource objects that each carry _id plus the fields to change; a single update is a one-element array.", [], true),
        deleteMany: write(call, "DELETE", "/resource", "Delete several resources. body is an array of resource ids.", [], true),
      },
      {
        title: "Resources",
        description:
          "People and other bookable resources. update is a PATCH: body must be an array of resource objects that each carry _id; include several to bulk-update.",
      },
    ),
    bookings: router(
      {
        ...crud("booking", "bookings", "booking", { update: "PUT" }),
        patch: write(call, "PATCH", "/booking/{id}", "Patch a booking: body holds only the properties to change.", ["id"]),
        deleteBy: write(call, "DELETE", "/booking", "Delete bookings in bulk. Pass exactly one query filter: ids (comma-separated), resourceId or projectId.", [], false),
      },
      {
        title: "Bookings",
        description:
          "Resource bookings on projects. list also accepts query.skip, query.deleted=true, query.dependencies=true and query.cursor (see Hub Planner docs); without a limit only 20 results return.",
      },
    ),
    timeEntries: router(
      {
        ...crud("time entry", "time entries", "timeentry", { update: "PUT" }),
        deleteMany: write(call, "DELETE", "/timeentry", "Delete several time entries. body is an array of time entry ids.", [], true),
      },
      {
        title: "Time entries",
        description: "Timesheet entries. list filters: query.project, query.start, query.end (YYYY-MM-DD). create body: resource, project, date, minutes.",
      },
    ),
    vacations: router(crud("vacation", "vacations", "vacation", { update: "PUT" }), { title: "Vacations", description: "Time off entries." }),
    holidays: router(crud("public holiday", "public holidays", "holiday", { update: "PUT" }), { title: "Public holidays", description: "Public holiday calendar." }),
    events: router(crud("event", "events", "event", { update: "PUT" }), { title: "Events", description: "Company events." }),
    milestones: router(
      {
        get: read(call, "/milestone/{id}", "Retrieve a milestone by id.", ["id"]),
        search: search(call, "/milestone/search", "Search milestones."),
        create: write(call, "POST", "/milestone", "Create a milestone."),
        update: write(call, "PUT", "/milestone/{id}", "Update a milestone.", ["id"]),
        delete: write(call, "DELETE", "/milestone/{id}", "Delete a milestone.", ["id"], false),
      },
      { title: "Milestones", description: "Project milestones." },
    ),
    clients: router(crud("client", "clients", "client", { update: "PUT" }), { title: "Clients", description: "Clients that projects belong to." }),
    billingRates: router(crud("billing rate", "billing rates", "billingRate", { update: "PUT" }), { title: "Billing rates", description: "Billing rate definitions." }),
    groups: router(
      {
        listProjectGroups: list("project groups", "/projectgroup"),
        getProjectGroup: read(call, "/projectgroup/{id}", "Retrieve a project group.", ["id"]),
        createProjectGroup: write(call, "POST", "/projectgroup", 'Create a project group. body: {"name": "..."}.'),
        updateProjectGroup: write(call, "PUT", "/projectgroup/{id}", "Update a project group.", ["id"]),
        deleteProjectGroup: write(call, "DELETE", "/projectgroup/{id}", "Delete a project group.", ["id"], false),
        addProjectsToGroup: write(call, "POST", "/projectgroup/addProjectsToGroup/{id}", 'Add projects to a group. body: {"projectIds": [...]}.', ["id"]),
        removeProjectFromGroups: write(call, "POST", "/projectgroup/removeProjectFromGroups/{id}", 'Remove a project from groups. body: {"groupIds": [...]}.', ["id"]),
        listResourceGroups: list("resource groups", "/resourcegroup"),
        getResourceGroup: read(call, "/resourcegroup/{id}", "Retrieve a resource group.", ["id"]),
        createResourceGroup: write(call, "POST", "/resourcegroup", 'Create a resource group. body: {"name": "..."}.'),
        updateResourceGroup: write(call, "PUT", "/resourcegroup/{id}", "Update a resource group.", ["id"]),
        deleteResourceGroup: write(call, "DELETE", "/resourcegroup/{id}", "Delete a resource group.", ["id"], false),
        addResourcesToGroup: write(call, "POST", "/resourcegroup/addResourcesToGroup/{id}", 'Add resources to a group. body: {"resourceIds": [...]}.', ["id"]),
        removeResourceFromGroups: write(call, "POST", "/resourcegroup/removeResourceFromGroups/{id}", 'Remove a resource from groups. body: {"groupIds": [...]}.', ["id"]),
        addApproverToGroups: write(call, "PUT", "/resourcegroup/addApproverToGroups/{id}", "Make a resource an approver of resource groups. id is the resource id.", ["id"]),
        removeApproverFromGroups: write(call, "PUT", "/resourcegroup/removeApproverFromGroups/{id}", "Remove a resource as approver of resource groups. id is the resource id.", ["id"]),
      },
      { title: "Groups", description: "Project groups and resource groups." },
    ),
    projectTags: router(tags("project", "project"), { title: "Project tags", description: "Project tags and tagging." }),
    resourceTags: router(tags("resource", "resource"), { title: "Resource tags", description: "Resource tags and tagging." }),
    bookingCategories: router(
      {
        list: list("booking categories", "/categories"),
        get: read(call, "/categories/{id}", "Retrieve a booking category.", ["id"]),
        search: search(call, "/categories/search", "Search booking categories."),
        create: write(call, "POST", "/categories", "Create a booking category."),
        update: write(call, "PUT", "/categories/{id}", "Update a booking category.", ["id"]),
        groups: read(call, "/category-groups", "List booking category groups."),
      },
      { title: "Booking categories", description: "Booking categories and their groups." },
    ),
    costCategories: router(
      {
        list: list("project cost categories", "/costCategories"),
        get: read(call, "/costCategories/{id}", "Retrieve a project cost category.", ["id"]),
        search: search(call, "/costCategories/search", "Search project cost categories."),
        create: write(call, "POST", "/costCategories", "Create a project cost category."),
        update: write(call, "PUT", "/costCategories/{id}", "Update a project cost category.", ["id"]),
        delete: write(call, "DELETE", "/costCategories/{id}", "Delete a project cost category.", ["id"], false),
      },
      { title: "Cost categories", description: "Project cost categories." },
    ),
    unassignedWork: router(
      {
        list: list("unassigned work entries", "/unassigned-work"),
        get: read(call, "/unassigned-work/{id}", "Retrieve an unassigned work entry.", ["id"]),
        create: write(call, "POST", "/unassigned-work", "Create an unassigned work entry."),
        update: write(call, "PUT", "/unassigned-work/{id}", "Update an unassigned work entry.", ["id"]),
        delete: write(call, "DELETE", "/unassigned-work/{id}", "Delete an unassigned work entry.", ["id"], false),
      },
      { title: "Unassigned work", description: "Requires the Unassigned Work extension enabled on the account." },
    ),
    customFields: router(
      {
        resource: router(customFields("resource", "resource"), { title: "Resource custom fields" }),
        project: router(customFields("project", "project"), { title: "Project custom fields" }),
      },
      { title: "Custom fields", description: "Custom field templates for resources and projects." },
    ),
    webhooks: router(
      {
        list: read(call, "/subscription", "List webhook subscriptions."),
        create: write(
          call,
          "POST",
          "/subscription",
          'Subscribe to an event. body: {"event", "target_url", "authorization_token"?}. Events: project.update, resource.update, booking.create, booking.update, booking.delete, booking.delete.multiple, timeEntry.create, timeEntry.update, timeEntry.create.update, timeEntry.delete.',
        ),
        delete: write(call, "DELETE", "/subscription/{id}", "Delete a webhook subscription.", ["id"], false),
      },
      { title: "Webhooks", description: "Event subscriptions that call your URL." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { hubplanner: hubplanner.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hubplanner ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Hub Planner",
        description:
          "Resource management and timesheets in Hub Planner (Resource Flow): projects, resources, bookings, time entries, vacations, holidays, events, milestones, clients, groups, tags, billing rates, custom fields and webhooks. Pass URL parameters in query (page from 0, limit up to 1000, sort) and JSON in body. Ids are strings. The API allows 6000 calls a day.",
        icons,
      },
    ),
  }),
);
