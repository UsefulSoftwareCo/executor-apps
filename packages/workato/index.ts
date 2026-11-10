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

// Every Workato data center serves the Developer API from its own host.
const dataCenters = [
  "www.workato.com",
  "app.eu.workato.com",
  "app.jp.workato.com",
  "app.sg.workato.com",
  "app.au.workato.com",
  "app.il.workato.com",
  "app.kr.workato.com",
  "app.uk.workato.com",
  "app.workatoapp.cn",
  "app.trial.workato.com",
];

function origin(account: { fields: { host: string } }) {
  const host = account.fields.host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!dataCenters.includes(host))
    throw new Error(
      `Unsupported Workato data center host "${host}". Use one of: ${dataCenters.join(", ")}.`,
    );
  return `https://${host}`;
}

const workato = defineProvider({
  name: "Workato",
  hosts: dataCenters,
  auth: {
    apiKey: secrets({
      label: "API client token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: number(), name: string() }));
    return {
      accountInfo: { externalId: `${new URL(base).host}/${me.id}`, displayName: me.name },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #; use the query field");
    const url = new URL(`${base}/api${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/api/"))
      throw new Error("path must stay under /api on the account data center");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
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
const Query = record(string());
const queryDoc = "Extra query parameters keyed exactly as the API expects, for example {\"page\": \"2\", \"per_page\": \"50\"}.";
const bodyDoc = "JSON request body as documented in the Workato Developer API reference.";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${queryDoc}`, input: object({ query: Query.optional() }) }, (_c, { query: q }) =>
      call("GET", path, q ?? {}),
    );
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("GET", path(i)));
  const getQ = (path: (i: string) => string, description: string) =>
    query(
      { description: `${description} ${queryDoc}`, input: object({ id: id(), query: Query.optional() }) },
      (_c, { id: i, query: q }) => call("GET", path(i), q ?? {}),
    );
  const create = (path: string, description: string) =>
    mutation({ description: `${description} ${bodyDoc}`, input: object({ body: json() }) }, (_c, { body }) =>
      call("POST", path, {}, body),
    );
  const createAt = (path: (i: string) => string, description: string) =>
    mutation(
      { description: `${description} ${bodyDoc}`, input: object({ id: id(), body: json().optional() }) },
      (_c, { id: i, body }) => call("POST", path(i), {}, body),
    );
  const update = (path: (i: string) => string, description: string) =>
    mutation(
      { description: `${description} ${bodyDoc}`, input: object({ id: id(), body: json() }) },
      (_c, { id: i, body }) => call("PUT", path(i), {}, body),
    );
  const action = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("PUT", path(i)));
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ id: id() }) }, (_c, { id: i }) => call("DELETE", path(i)));

  const workspace = router(
    {
      me: query({ description: "Get details of the workspace user that owns the API client token.", input: object({}) }, () =>
        call("GET", "/users/me"),
      ),
      collaborators: list("/members", "List workspace collaborators."),
      getCollaborator: get((i) => `/members/${seg(i)}`, "Get a collaborator by id."),
      collaboratorProjectGrants: getQ((i) => `/members/${seg(i)}/project_grants`, "List a collaborator's project grants."),
      collaboratorPrivileges: get((i) => `/members/${seg(i)}/privileges`, "Get a collaborator's privileges."),
      collaboratorProjectPrivileges: get((i) => `/members/${seg(i)}/projects_privileges`, "Get a collaborator's project privileges."),
      inviteCollaborator: create("/member_invitations", "Invite a collaborator to the workspace."),
      updateCollaborator: update((i) => `/members/${seg(i)}`, "Update a collaborator's roles."),
      deleteCollaborator: remove((i) => `/members/${seg(i)}`, "Delete a collaborator."),
      activityLogs: list("/activity_logs", "Retrieve activity audit log records (filter with event_type, resource_type, from, to, page)."),
      clearSecretsCache: mutation(
        { description: "Clear the secrets management cache.", input: object({}) },
        () => call("POST", "/secrets_management/clear_cache"),
      ),
    },
    { title: "Workspace", description: "Workspace details, collaborators and the audit log." },
  );

  const recipes = router(
    {
      list: list("/recipes", "List recipes (folder_id, with_subfolders, running, adapter_names_any, adapter_names_all, order, page, per_page, since_id)."),
      get: getQ((i) => `/recipes/${seg(i)}`, "Get recipe details, including its code."),
      jobCounts: list("/recipes/job_counts", "Retrieve job success and failure counts for recipes (recipe_ids[]=...)."),
      create: create("/recipes", "Create a recipe: {\"recipe\": {\"name\", \"code\", \"folder_id\", \"config\"}}."),
      update: update((i) => `/recipes/${seg(i)}`, "Update a recipe. The recipe must be stopped."),
      copy: createAt((i) => `/recipes/${seg(i)}/copy`, "Copy a recipe to another folder."),
      start: action((i) => `/recipes/${seg(i)}/start`, "Start a recipe."),
      stop: action((i) => `/recipes/${seg(i)}/stop`, "Stop a recipe."),
      delete: remove((i) => `/recipes/${seg(i)}`, "Delete a stopped recipe."),
      resetTrigger: createAt((i) => `/recipes/${seg(i)}/reset_trigger`, "Reset a recipe's trigger."),
      updateConnection: update((i) => `/recipes/${seg(i)}/connect`, "Update the connection used by an application in a stopped recipe."),
      pollNow: createAt((i) => `/recipes/${seg(i)}/poll_now`, "Activate a polling trigger for a recipe now."),
      forceRun: createAt((i) => `/recipes/${seg(i)}/force_run`, "Force a recipe to run on demand."),
      versions: getQ((i) => `/recipes/${seg(i)}/versions`, "List versions of a recipe."),
      getVersion: query(
        { description: "Get details of one recipe version.", input: object({ recipeId: id(), versionId: id() }) },
        (_c, { recipeId, versionId }) => call("GET", `/recipes/${seg(recipeId)}/versions/${seg(versionId)}`),
      ),
      health: get((i) => `/recipes/${seg(i)}/health`, "Retrieve the most recent optimization report for a recipe."),
      scanHealth: createAt((i) => `/recipes/${seg(i)}/health`, "Queue a performance scan of a recipe."),
    },
    { title: "Recipes", description: "Create, edit, run and version recipes." },
  );

  const jobs = router(
    {
      list: getQ((i) => `/recipes/${seg(i)}/jobs`, "List jobs of a recipe (status, offset_job_id, prev, rerun_only)."),
      get: query(
        { description: "Get one job's metadata by job handle.", input: object({ recipeId: id(), jobHandle: id() }) },
        (_c, { recipeId, jobHandle }) => call("GET", `/recipes/${seg(recipeId)}/jobs/${seg(jobHandle)}`),
      ),
      repeat: createAt((i) => `/recipes/${seg(i)}/repeat_jobs`, "Repeat jobs of a recipe: {\"job_ids\": [...]}."),
      cancel: createAt((i) => `/recipes/${seg(i)}/cancel_jobs`, "Cancel ongoing jobs of a recipe: {\"job_ids\": [...]}."),
      resume: create("/job/resume", "Resume a waiting job: {\"resume_token\": \"...\"}."),
    },
    { title: "Jobs", description: "Recipe job history and job control." },
  );

  const connections = router(
    {
      list: list("/connections", "List connections (folder_id, parent_id, includes[])."),
      create: create("/connections", "Create a connection."),
      update: update((i) => `/connections/${seg(i)}`, "Update a connection."),
      disconnect: createAt((i) => `/connections/${seg(i)}/disconnect`, "Disconnect a connection."),
      delete: remove((i) => `/connections/${seg(i)}`, "Delete a connection."),
      pickList: createAt((i) => `/connections/${seg(i)}/pick_list`, "Get picklist values for a connection: {\"pick_list_name\": \"...\", \"pick_list_params\": {}}."),
      connectors: list("/integrations", "List connectors and their metadata."),
      allConnectors: list("/integrations/all", "List all standard and platform connectors (paginated)."),
    },
    { title: "Connections", description: "Application connections and connector metadata." },
  );

  const projects = router(
    {
      listFolders: list("/folders", "List folders (parent_id, page, per_page)."),
      listProjects: list("/projects", "List projects (page, per_page)."),
      getFolder: get((i) => `/folders/${seg(i)}`, "Get a folder."),
      createFolder: create("/folders", "Create a folder or project."),
      updateFolder: update((i) => `/folders/${seg(i)}`, "Update a folder."),
      deleteFolder: remove((i) => `/folders/${seg(i)}`, "Delete a folder."),
      updateProject: update((i) => `/projects/${seg(i)}`, "Update a project."),
      deleteProject: remove((i) => `/projects/${seg(i)}`, "Delete a project."),
      build: createAt((i) => `/projects/${seg(i)}/build`, "Build a project."),
      getBuild: get((i) => `/project_builds/${seg(i)}`, "Get a project build."),
      deployBuild: createAt((i) => `/project_builds/${seg(i)}/deploy`, "Deploy a project build to an environment."),
      deploy: createAt((i) => `/projects/${seg(i)}/deploy`, "Build and deploy a project to an environment."),
      listDeployments: list("/deployments", "List deployments (project_id, folder_id, date range)."),
      getDeployment: get((i) => `/deployments/${seg(i)}`, "Get a deployment."),
      eligibleReviewers: get((i) => `/deployments/${seg(i)}/eligible_reviewers`, "List eligible reviewers for a deployment."),
      assignReviewers: createAt((i) => `/deployments/${seg(i)}/assign_reviewers`, "Assign reviewers to a deployment."),
      submitForReview: createAt((i) => `/deployments/${seg(i)}/submit_for_review`, "Submit a deployment for review."),
      approveDeployment: createAt((i) => `/deployments/${seg(i)}/approve`, "Approve a deployment."),
      rejectDeployment: createAt((i) => `/deployments/${seg(i)}/reject`, "Reject a deployment."),
      reopenDeployment: createAt((i) => `/deployments/${seg(i)}/reopen`, "Re-open a deployment for review."),
      updateReviewComment: createAt((i) => `/deployments/${seg(i)}/update_review_comment`, "Update a deployment review comment."),
      runDeployment: createAt((i) => `/deployments/${seg(i)}/deploy`, "Deploy an approved deployment."),
    },
    { title: "Projects", description: "Folders, projects, builds and deployments." },
  );

  const packages = router(
    {
      folderAssets: list("/export_manifests/folder_assets", "View assets in a folder (folder_id)."),
      createManifest: create("/export_manifests", "Create an export manifest."),
      getManifest: get((i) => `/export_manifests/${seg(i)}`, "View an export manifest."),
      updateManifest: update((i) => `/export_manifests/${seg(i)}`, "Update an export manifest."),
      deleteManifest: remove((i) => `/export_manifests/${seg(i)}`, "Delete an export manifest."),
      export: createAt((i) => `/packages/export/${seg(i)}`, "Export a package from a manifest id."),
      get: get((i) => `/packages/${seg(i)}`, "Get a package by id (poll for export or import status)."),
      downloadInfo: get((i) => `/packages/${seg(i)}/download`, "Download a package (returns the package response)."),
    },
    { title: "Packages", description: "Recipe lifecycle management: export manifests and packages." },
  );

  const lookupTables = router(
    {
      list: list("/lookup_tables", "List lookup tables."),
      create: create("/lookup_tables", "Create a lookup table."),
      batchDelete: create("/lookup_tables/batch_delete", "Delete lookup tables in batch: {\"ids\": [...]}."),
      rows: getQ((i) => `/lookup_tables/${seg(i)}/rows`, "List rows of a lookup table."),
      lookup: getQ((i) => `/lookup_tables/${seg(i)}/lookup`, "Look up a row by column values, e.g. {\"col1\": \"value\"}."),
      getRow: query(
        { description: "Get a row.", input: object({ tableId: id(), rowId: id() }) },
        (_c, { tableId, rowId }) => call("GET", `/lookup_tables/${seg(tableId)}/rows/${seg(rowId)}`),
      ),
      addRow: createAt((i) => `/lookup_tables/${seg(i)}/rows`, "Add a row: {\"data\": {...}}."),
      updateRow: mutation(
        { description: `Update a row. ${bodyDoc}`, input: object({ tableId: id(), rowId: id(), body: json() }) },
        (_c, { tableId, rowId, body }) => call("PUT", `/lookup_tables/${seg(tableId)}/rows/${seg(rowId)}`, {}, body),
      ),
      deleteRow: mutation(
        { description: "Delete a row.", input: object({ tableId: id(), rowId: id() }) },
        (_c, { tableId, rowId }) => call("DELETE", `/lookup_tables/${seg(tableId)}/rows/${seg(rowId)}`),
      ),
    },
    { title: "Lookup tables", description: "Lookup tables and their rows." },
  );

  const dataTables = router(
    {
      list: list("/data_tables", "List data tables."),
      get: get((i) => `/data_tables/${seg(i)}`, "Get a data table by id."),
      create: create("/data_tables", "Create a data table."),
      update: update((i) => `/data_tables/${seg(i)}`, "Update a data table."),
      delete: remove((i) => `/data_tables/${seg(i)}`, "Delete a data table."),
      truncate: createAt((i) => `/data_tables/${seg(i)}/truncate`, "Delete every record in a data table."),
      queryRecords: createAt((i) => `/v1/tables/${seg(i)}/query`, "Query records with filters, e.g. {\"where\": {...}, \"limit\": 100}."),
      createRecord: createAt((i) => `/v1/tables/${seg(i)}/records`, "Create a record."),
      updateRecord: mutation(
        { description: `Update a record. ${bodyDoc}`, input: object({ tableId: id(), recordId: id(), body: json() }) },
        (_c, { tableId, recordId, body }) => call("PUT", `/v1/tables/${seg(tableId)}/records/${seg(recordId)}`, {}, body),
      ),
      deleteRecord: mutation(
        { description: "Delete a record.", input: object({ tableId: id(), recordId: id() }) },
        (_c, { tableId, recordId }) => call("DELETE", `/v1/tables/${seg(tableId)}/records/${seg(recordId)}`),
      ),
    },
    { title: "Data tables", description: "Data tables and their records." },
  );

  const properties = router(
    {
      list: list("/properties", "List environment properties by prefix (prefix) or project properties (prefix and project_id)."),
      upsert: mutation(
        {
          description: `Upsert properties. Pass project_id in query for project-level properties. Body: {"properties": {"name": "value"}}.`,
          input: object({ query: Query.optional(), body: json() }),
        },
        (_c, { query: q, body }) => call("POST", "/properties", q ?? {}, body),
      ),
      tags: list("/tags", "List tags."),
      createTag: create("/tags", "Create a tag."),
      updateTag: update((i) => `/tags/${seg(i)}`, "Update a tag by handle."),
      deleteTag: remove((i) => `/tags/${seg(i)}`, "Delete a tag by handle."),
      assignTags: create("/tags_assignments", "Apply tags to or remove tags from recipes and connections."),
    },
    { title: "Properties and tags", description: "Environment and project properties, tags and tag assignments." },
  );

  const apiPlatform = router(
    {
      collections: list("/api_collections", "List API collections."),
      createCollection: create("/api_collections", "Create an API collection in a project."),
      updateCollection: update((i) => `/api_collections/${seg(i)}`, "Update an API collection."),
      deleteCollection: remove((i) => `/api_collections/${seg(i)}`, "Delete an API collection and its endpoints."),
      collectionOpenapi: get((i) => `/api_collections/${seg(i)}/openapi`, "Get the OpenAPI specification of an API collection."),
      endpoints: list("/api_endpoints", "List API endpoints (api_collection_id)."),
      createEndpoint: createAt((i) => `/api_collections/${seg(i)}/api_endpoints`, "Create an API endpoint in a collection."),
      enableEndpoint: action((i) => `/api_endpoints/${seg(i)}/enable`, "Enable an API endpoint."),
      disableEndpoint: action((i) => `/api_endpoints/${seg(i)}/disable`, "Disable an API endpoint."),
      endpointOpenapi: get((i) => `/api_endpoints/${seg(i)}/openapi`, "Get the OpenAPI specification of an API endpoint."),
      clients: list("/v2/api_clients", "List API platform clients."),
      getClient: get((i) => `/v2/api_clients/${seg(i)}`, "Get an API platform client."),
      createClient: create("/v2/api_clients", "Create an API platform client."),
      updateClient: update((i) => `/v2/api_clients/${seg(i)}`, "Update an API platform client."),
      deleteClient: remove((i) => `/v2/api_clients/${seg(i)}`, "Delete an API platform client."),
      keys: getQ((i) => `/v2/api_clients/${seg(i)}/api_keys`, "List API keys of an API platform client."),
      createKey: createAt((i) => `/v2/api_clients/${seg(i)}/api_keys`, "Create an API key for an API platform client."),
    },
    { title: "API platform", description: "API collections, endpoints, clients and keys." },
  );

  const onPrem = router(
    {
      groups: list("/on_prem_groups", "List on-prem groups."),
      getGroup: get((i) => `/on_prem_groups/${seg(i)}`, "Get an on-prem group."),
      createGroup: create("/on_prem_groups", "Create an on-prem group."),
      updateGroup: update((i) => `/on_prem_groups/${seg(i)}`, "Update an on-prem group."),
      deleteGroup: remove((i) => `/on_prem_groups/${seg(i)}`, "Delete an on-prem group."),
      groupStatus: get((i) => `/on_prem_groups/${seg(i)}/status`, "Get the status of an on-prem group."),
      agents: list("/on_prem_agents", "List on-prem agents."),
      getAgent: get((i) => `/on_prem_agents/${seg(i)}`, "Get an on-prem agent."),
      createAgent: create("/on_prem_agents", "Create an on-prem agent."),
      updateAgent: update((i) => `/on_prem_agents/${seg(i)}`, "Update an on-prem agent."),
      deleteAgent: remove((i) => `/on_prem_agents/${seg(i)}`, "Delete an on-prem agent."),
      agentStatus: get((i) => `/on_prem_agents/${seg(i)}/status`, "Get the status of an on-prem agent."),
      searchAgents: list("/on_prem_agents/search", "Search for on-prem agents."),
      activationCode: get((i) => `/on_prem_agents/${seg(i)}/activation_code`, "Get an on-prem agent's activation code."),
    },
    { title: "On-prem agents", description: "On-prem groups and agents." },
  );

  const eventStreams = router(
    {
      topics: list("/event_streams/topics", "List event stream topics."),
      getTopic: get((i) => `/event_streams/topics/${seg(i)}`, "Get an event stream topic."),
      createTopic: create("/event_streams/topics", "Create an event stream topic."),
      updateTopic: update((i) => `/event_streams/topics/${seg(i)}`, "Update an event stream topic."),
      purgeTopic: action((i) => `/event_streams/topics/${seg(i)}/purge`, "Purge all messages from a topic."),
      deleteTopic: remove((i) => `/event_streams/topics/${seg(i)}`, "Delete an event stream topic."),
      publish: createAt((i) => `/v1/topics/${seg(i)}/publish`, "Publish a message to a topic."),
      publishBatch: createAt((i) => `/v1/batch/topics/${seg(i)}/publish`, "Publish a batch of messages to a topic."),
      consume: createAt((i) => `/v1/topics/${seg(i)}/consume`, "Consume messages from a topic."),
    },
    { title: "Event streams", description: "Event topics, publishing and consuming." },
  );

  return router({
    workspace,
    recipes,
    jobs,
    connections,
    projects,
    packages,
    lookupTables,
    dataTables,
    properties,
    apiPlatform,
    onPrem,
    eventStreams,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Workato Developer API. path is relative to /api, for example /roles. Prefer the dedicated tools.",
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
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#")) throw new Error("path must start with / and stay under /api");
        return call(m, path, q ?? {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { workato: workato.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.workato ?? [],
        (account) =>
          withApprovals(build(client(origin(account), account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Workato",
        description:
          "Workato Developer API: recipes, jobs, connections, projects and deployments, packages, lookup and data tables, properties, tags, API platform, on-prem agents and event streams.",
        icons,
        instructions:
          "List tools accept a query record for the API's query parameters (page, per_page, folder_id, ...). Create and update tools take the JSON body documented in the Workato Developer API reference. Tools only work for endpoints the API client's role allows.",
      },
    ),
  }),
);
