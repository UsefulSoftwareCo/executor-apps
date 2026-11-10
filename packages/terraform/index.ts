import {
  accountRouter,
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

const base = "https://app.terraform.io";

const terraform = defineProvider({
  name: "Terraform",
  hosts: ["app.terraform.io"],
  auth: {
    // HCP Terraform has no user-created OAuth apps for its API; user, team and organization tokens are the supported credential.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/v2/organizations?page%5Bsize%5D=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

function fill(path: string, ids: readonly string[], input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

const idShape = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, string()]));

// Tools take path ids, `query` (JSON:API params such as page[number], page[size], filter[...], include) and, for writes, a JSON:API `body`.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...idShape(ids), query: filters }) },
    async (_ctx, input: Params) => call("GET", fill(path, ids, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], body: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        ...idShape(ids),
        query: filters,
        ...(body === "optional" ? { body: optionalPayload } : body ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, ids, input), (input.query as Params | undefined) ?? {}, body ? (input.body as Params | undefined) : undefined),
  );
}

const paging = "Paginate with query {\"page[number]\": 2, \"page[size]\": 100}.";

function build(c: Call) {
  const org = "/api/v2/organizations/{organization}";
  const o = ["organization"] as const;
  return router({
    account: router(
      {
        me: read(c, "/api/v2/account/details", "Details of the user or token owner behind the API token."),
        ping: read(c, "/api/v2/ping", "Check that the API is reachable."),
      },
      { title: "Account", description: "The authenticated account." },
    ),
    organizations: router(
      {
        list: read(c, "/api/v2/organizations", `List organizations the token can access. ${paging}`),
        get: read(c, org, "Show an organization.", o),
        update: write(c, "PATCH", org, "Update organization settings. body is a JSON:API document of type organizations.", o),
        entitlements: read(c, `${org}/entitlement-set`, "Show the features the organization's plan allows.", o),
        tags: read(c, `${org}/tags`, `List tags used in the organization. ${paging}`, o),
      },
      { title: "Organizations", description: "HCP Terraform organizations." },
    ),
    projects: router(
      {
        list: read(c, `${org}/projects`, `List projects. query filter[names] and q filter results. ${paging}`, o),
        get: read(c, "/api/v2/projects/{project_id}", "Show a project.", ["project_id"]),
        create: write(c, "POST", `${org}/projects`, "Create a project. body is a JSON:API document of type projects.", o),
        update: write(c, "PATCH", "/api/v2/projects/{project_id}", "Update a project.", ["project_id"]),
        delete: write(c, "DELETE", "/api/v2/projects/{project_id}", "Delete a project.", ["project_id"], false),
      },
      { title: "Projects", description: "Projects that group workspaces." },
    ),
    workspaces: router(
      {
        list: read(c, `${org}/workspaces`, `List workspaces. query: search[name], search[tags], filter[project][id], include. ${paging}`, o),
        get: read(c, `${org}/workspaces/{workspace_name}`, "Show a workspace by name.", [...o, "workspace_name"]),
        getById: read(c, "/api/v2/workspaces/{workspace_id}", "Show a workspace by id.", ["workspace_id"]),
        create: write(c, "POST", `${org}/workspaces`, "Create a workspace. body is a JSON:API document of type workspaces.", o),
        update: write(c, "PATCH", "/api/v2/workspaces/{workspace_id}", "Update a workspace's settings.", ["workspace_id"]),
        delete: write(c, "DELETE", "/api/v2/workspaces/{workspace_id}", "Delete a workspace.", ["workspace_id"], false),
        lock: write(c, "POST", "/api/v2/workspaces/{workspace_id}/actions/lock", "Lock a workspace. Optional body.reason.", ["workspace_id"], "optional"),
        unlock: write(c, "POST", "/api/v2/workspaces/{workspace_id}/actions/unlock", "Unlock a workspace.", ["workspace_id"], false),
        forceUnlock: write(c, "POST", "/api/v2/workspaces/{workspace_id}/actions/force-unlock", "Force unlock a workspace locked by someone else.", ["workspace_id"], false),
        resources: read(c, "/api/v2/workspaces/{workspace_id}/resources", `List resources in the workspace's state. ${paging}`, ["workspace_id"]),
        outputs: read(c, "/api/v2/workspaces/{workspace_id}/current-state-version-outputs", "List outputs of the current state version.", ["workspace_id"]),
        tags: read(c, "/api/v2/workspaces/{workspace_id}/relationships/tags", "List a workspace's tags.", ["workspace_id"]),
        addTags: write(c, "POST", "/api/v2/workspaces/{workspace_id}/relationships/tags", "Add tags to a workspace. body: {data: [{type: 'tags', attributes: {name}}]}.", ["workspace_id"]),
      },
      { title: "Workspaces", description: "Workspaces that hold configuration, variables and state." },
    ),
    runs: router(
      {
        listForWorkspace: read(c, "/api/v2/workspaces/{workspace_id}/runs", `List a workspace's runs. query: filter[status], filter[operation], filter[source]. ${paging}`, ["workspace_id"]),
        listForOrganization: read(c, `${org}/runs`, `List runs across an organization. query: filter[status], filter[workspace_names]. ${paging}`, o),
        get: read(c, "/api/v2/runs/{run_id}", "Show a run, including status and plan/apply relationships.", ["run_id"]),
        create: write(c, "POST", "/api/v2/runs", "Create a run (queue a plan). body is a JSON:API document of type runs with a workspace relationship."),
        apply: write(c, "POST", "/api/v2/runs/{run_id}/actions/apply", "Apply a run that is waiting for confirmation. Optional body.comment.", ["run_id"], "optional"),
        discard: write(c, "POST", "/api/v2/runs/{run_id}/actions/discard", "Discard a run waiting for confirmation. Optional body.comment.", ["run_id"], "optional"),
        cancel: write(c, "POST", "/api/v2/runs/{run_id}/actions/cancel", "Cancel a run that is planning or applying. Optional body.comment.", ["run_id"], "optional"),
        forceCancel: write(c, "POST", "/api/v2/runs/{run_id}/actions/force-cancel", "Force cancel a run that did not stop after cancel.", ["run_id"], "optional"),
        events: read(c, "/api/v2/runs/{run_id}/run-events", "List events for a run.", ["run_id"]),
      },
      { title: "Runs", description: "Plans and applies." },
    ),
    plans: router(
      {
        get: read(c, "/api/v2/plans/{plan_id}", "Show a plan, including resource change counts and log-read-url.", ["plan_id"]),
        jsonOutput: read(c, "/api/v2/plans/{plan_id}/json-output", "Show the plan in Terraform's JSON plan format.", ["plan_id"]),
      },
      { title: "Plans", description: "Plan results." },
    ),
    applies: router(
      { get: read(c, "/api/v2/applies/{apply_id}", "Show an apply, including log-read-url.", ["apply_id"]) },
      { title: "Applies", description: "Apply results." },
    ),
    variables: router(
      {
        list: read(c, "/api/v2/workspaces/{workspace_id}/vars", "List a workspace's variables. Sensitive values are not returned.", ["workspace_id"]),
        create: write(c, "POST", "/api/v2/workspaces/{workspace_id}/vars", "Create a workspace variable. body is a JSON:API document of type vars.", ["workspace_id"]),
        update: write(c, "PATCH", "/api/v2/workspaces/{workspace_id}/vars/{variable_id}", "Update a workspace variable.", ["workspace_id", "variable_id"]),
        delete: write(c, "DELETE", "/api/v2/workspaces/{workspace_id}/vars/{variable_id}", "Delete a workspace variable.", ["workspace_id", "variable_id"], false),
      },
      { title: "Variables", description: "Workspace variables." },
    ),
    variableSets: router(
      {
        list: read(c, `${org}/varsets`, `List variable sets. ${paging}`, o),
        get: read(c, "/api/v2/varsets/{varset_id}", "Show a variable set.", ["varset_id"]),
        create: write(c, "POST", `${org}/varsets`, "Create a variable set.", o),
        update: write(c, "PATCH", "/api/v2/varsets/{varset_id}", "Update a variable set.", ["varset_id"]),
        delete: write(c, "DELETE", "/api/v2/varsets/{varset_id}", "Delete a variable set.", ["varset_id"], false),
        variables: read(c, "/api/v2/varsets/{varset_id}/relationships/vars", "List variables in a variable set.", ["varset_id"]),
        createVariable: write(c, "POST", "/api/v2/varsets/{varset_id}/relationships/vars", "Add a variable to a variable set.", ["varset_id"]),
        apply: write(c, "POST", "/api/v2/varsets/{varset_id}/relationships/workspaces", "Apply a variable set to workspaces. body: {data: [{type: 'workspaces', id}]}.", ["varset_id"]),
      },
      { title: "Variable sets", description: "Variables shared across workspaces and projects." },
    ),
    state: router(
      {
        list: read(c, "/api/v2/state-versions", `List state versions. query filter[workspace][name] and filter[organization][name] are required. ${paging}`),
        current: read(c, "/api/v2/workspaces/{workspace_id}/current-state-version", "Show a workspace's current state version, with a hosted-state-download-url.", ["workspace_id"]),
        get: read(c, "/api/v2/state-versions/{state_version_id}", "Show a state version.", ["state_version_id"]),
        outputs: read(c, "/api/v2/state-versions/{state_version_id}/outputs", "List outputs of a state version.", ["state_version_id"]),
        output: read(c, "/api/v2/state-version-outputs/{output_id}", "Show a state version output.", ["output_id"]),
      },
      { title: "State", description: "State versions and outputs." },
    ),
    configurationVersions: router(
      {
        list: read(c, "/api/v2/workspaces/{workspace_id}/configuration-versions", `List configuration versions. ${paging}`, ["workspace_id"]),
        get: read(c, "/api/v2/configuration-versions/{configuration_version_id}", "Show a configuration version.", ["configuration_version_id"]),
        create: write(c, "POST", "/api/v2/workspaces/{workspace_id}/configuration-versions", "Create a configuration version; the response has an upload-url for the tarball.", ["workspace_id"]),
      },
      { title: "Configuration versions", description: "Uploaded Terraform configuration." },
    ),
    teams: router(
      {
        list: read(c, `${org}/teams`, `List teams. ${paging}`, o),
        get: read(c, "/api/v2/teams/{team_id}", "Show a team.", ["team_id"]),
        create: write(c, "POST", `${org}/teams`, "Create a team.", o),
        update: write(c, "PATCH", "/api/v2/teams/{team_id}", "Update a team.", ["team_id"]),
        delete: write(c, "DELETE", "/api/v2/teams/{team_id}", "Delete a team.", ["team_id"], false),
      },
      { title: "Teams", description: "Teams and their organization access." },
    ),
    members: router(
      {
        list: read(c, `${org}/organization-memberships`, `List organization memberships. query: filter[status], q. ${paging}`, o),
        get: read(c, "/api/v2/organization-memberships/{membership_id}", "Show an organization membership.", ["membership_id"]),
        invite: write(c, "POST", `${org}/organization-memberships`, "Invite a user by email. body type organization-memberships.", o),
        remove: write(c, "DELETE", "/api/v2/organization-memberships/{membership_id}", "Remove a user from the organization.", ["membership_id"], false),
      },
      { title: "Members", description: "Organization membership." },
    ),
    teamAccess: router(
      {
        list: read(c, "/api/v2/team-workspaces", "List team access to workspaces. query filter[workspace][id] is required."),
        get: read(c, "/api/v2/team-workspaces/{team_workspace_id}", "Show a team's access to a workspace.", ["team_workspace_id"]),
        add: write(c, "POST", "/api/v2/team-workspaces", "Give a team access to a workspace."),
        update: write(c, "PATCH", "/api/v2/team-workspaces/{team_workspace_id}", "Change a team's access level.", ["team_workspace_id"]),
        remove: write(c, "DELETE", "/api/v2/team-workspaces/{team_workspace_id}", "Remove a team's access to a workspace.", ["team_workspace_id"], false),
      },
      { title: "Team access", description: "Team permissions on workspaces." },
    ),
    tokens: router(
      {
        listTeam: read(c, "/api/v2/teams/{team_id}/authentication-tokens", "List a team's API tokens (metadata only).", ["team_id"]),
        listOrganization: read(c, `${org}/authentication-token`, "Show the organization token's metadata.", o),
        listUser: read(c, "/api/v2/users/{user_id}/authentication-tokens", "List a user's API tokens (metadata only).", ["user_id"]),
        delete: write(c, "DELETE", "/api/v2/authentication-tokens/{token_id}", "Delete an API token.", ["token_id"], false),
      },
      { title: "Tokens", description: "API token metadata." },
    ),
    policies: router(
      {
        list: read(c, `${org}/policies`, `List policies. ${paging}`, o),
        get: read(c, "/api/v2/policies/{policy_id}", "Show a policy.", ["policy_id"]),
        sets: read(c, `${org}/policy-sets`, `List policy sets. ${paging}`, o),
        set: read(c, "/api/v2/policy-sets/{policy_set_id}", "Show a policy set.", ["policy_set_id"]),
        checks: read(c, "/api/v2/runs/{run_id}/policy-checks", "List a run's policy checks.", ["run_id"]),
        override: write(c, "POST", "/api/v2/policy-checks/{policy_check_id}/actions/override", "Override a soft-failed policy check.", ["policy_check_id"], false),
      },
      { title: "Policies", description: "Sentinel and OPA policies and checks." },
    ),
    registry: router(
      {
        modules: read(c, `${org}/registry-modules`, `List private registry modules. ${paging}`, o),
        module: read(c, `${org}/registry-modules/{registry_name}/{namespace}/{name}/{provider}`, "Show a private registry module. registry_name is private or public.", [...o, "registry_name", "namespace", "name", "provider"]),
        createModule: write(c, "POST", `${org}/registry-modules`, "Create a private registry module.", o),
        deleteModule: write(c, "DELETE", `${org}/registry-modules/{registry_name}/{name}/{provider}`, "Delete a module and all its versions.", [...o, "registry_name", "name", "provider"], false),
        providers: read(c, `${org}/registry-providers`, `List private registry providers. ${paging}`, o),
        provider: read(c, `${org}/registry-providers/{registry_name}/{namespace}/{name}`, "Show a private registry provider.", [...o, "registry_name", "namespace", "name"]),
      },
      { title: "Registry", description: "Private registry modules and providers." },
    ),
    agents: router(
      {
        pools: read(c, `${org}/agent-pools`, `List agent pools. ${paging}`, o),
        pool: read(c, "/api/v2/agent-pools/{agent_pool_id}", "Show an agent pool.", ["agent_pool_id"]),
        agents: read(c, "/api/v2/agent-pools/{agent_pool_id}/agents", "List agents in a pool.", ["agent_pool_id"]),
      },
      { title: "Agents", description: "Agent pools and agents." },
    ),
    notifications: router(
      {
        list: read(c, "/api/v2/workspaces/{workspace_id}/notification-configurations", "List a workspace's notification configurations.", ["workspace_id"]),
        create: write(c, "POST", "/api/v2/workspaces/{workspace_id}/notification-configurations", "Create a notification configuration.", ["workspace_id"]),
        delete: write(c, "DELETE", "/api/v2/notification-configurations/{notification_configuration_id}", "Delete a notification configuration.", ["notification_configuration_id"], false),
      },
      { title: "Notifications", description: "Run notification destinations." },
    ),
    vcs: router(
      {
        oauthClients: read(c, `${org}/oauth-clients`, "List VCS provider connections.", o),
        oauthTokens: read(c, "/api/v2/oauth-clients/{oauth_client_id}/oauth-tokens", "List OAuth tokens of a VCS connection.", ["oauth_client_id"]),
      },
      { title: "VCS", description: "VCS provider connections." },
    ),
    audit: router(
      {
        tasks: read(c, `${org}/tasks`, `List run tasks. ${paging}`, o),
        comments: read(c, "/api/v2/runs/{run_id}/comments", "List comments on a run.", ["run_id"]),
        comment: write(c, "POST", "/api/v2/runs/{run_id}/comments", "Add a comment to a run.", ["run_id"]),
      },
      { title: "Run tasks and comments", description: "Run tasks and run comments." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { terraform: terraform.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.terraform ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Terraform",
        description:
          "HCP Terraform: organizations, projects, workspaces, runs, variables, state, teams, policies and the private registry. JSON:API: pass path ids as fields, JSON:API params (page[number], filter[...], include) in query, and a JSON:API document in body.",
        icons,
      },
    ),
  }),
);
