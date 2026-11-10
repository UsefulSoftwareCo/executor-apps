import {
  accountRouter,
  array,
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

const apiVersion = "7.1";
// Azure DevOps' resource id in Microsoft Entra.
const devopsScope = "499b84ac-1321-427f-aa17-267ca6975798/user_impersonation";

type Account =
  | { method: "apiKey"; fields: { organization: string; token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const azureDevops = defineProvider({
  name: "Azure DevOps",
  hosts: ["dev.azure.com", "vssps.dev.azure.com", "app.vssps.visualstudio.com"],
  auth: {
    apiKey: secrets({
      label: "Personal access token",
      fields: object({ organization: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
    // Microsoft Entra v2. The connect page asks for an app registration's client. The multi-tenant
    // "common" authority's discovery document advertises a templated issuer, so endpoints are declared.
    oauth: oauth2({
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["offline_access", devopsScope],
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "apiKey") {
      const org = encodeURIComponent(account.fields.organization);
      const response = await fetch(`https://dev.azure.com/${org}/_apis/projects?$top=1&api-version=${apiVersion}`, {
        signal,
        headers: { Authorization: authorization(account), Accept: "application/json" },
      });
      await decodeJson(response, object({ count: number() }));
      return { accountInfo: { externalId: account.fields.organization, displayName: account.fields.organization } };
    }
    const response = await fetch(`https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=${apiVersion}`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string(), displayName: string() }));
    return { accountInfo: { externalId: me.id, displayName: me.displayName } };
  },
});

function authorization(account: Account): string {
  return account.method === "apiKey"
    ? `Basic ${btoa(`:${account.fields.token}`)}`
    : `Bearer ${account.fields.access_token}`;
}

type Params = Record<string, string | number | boolean | undefined>;

const tools = (account: Account, signal: AbortSignal) => {
  const organizationOf = (input: { organization?: string | undefined }): string => {
    const organization = input.organization ?? (account.method === "apiKey" ? account.fields.organization : undefined);
    if (!organization) throw new Error("organization is required for OAuth accounts; call listOrganizations to find one");
    return encodeURIComponent(organization);
  };

  const send = async (
    fetch: typeof globalThis.fetch,
    method: string,
    url: string,
    params: Params,
    body: unknown,
    contentType = "application/json",
  ) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    if (!search.has("api-version")) search.set("api-version", apiVersion);
    const response = await fetch(`${url}?${search}`, {
      method,
      signal,
      headers: {
        Authorization: authorization(account),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": contentType }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const base = (input: { organization?: string | undefined; project?: string | undefined }) =>
    `https://dev.azure.com/${organizationOf(input)}${input.project ? `/${encodeURIComponent(input.project)}` : ""}/_apis`;

  const Org = { organization: string().optional() };
  const Proj = { ...Org, project: string() };
  const Repo = { ...Proj, repositoryId: string() };
  const seg = encodeURIComponent;
  const paging = { top: number().optional(), skip: number().optional() };

  return router({
    organizations: router(
      {
        listOrganizations: query(
          {
            description:
              "List the Azure DevOps organizations the signed-in user belongs to. Needed with OAuth accounts to find the organization name used by every other tool.",
            input: object({}),
          },
          async ({ fetch }) => {
            const me = await send(fetch, "GET", "https://app.vssps.visualstudio.com/_apis/profile/profiles/me", {}, undefined);
            const id = (me as { id: string }).id;
            return send(fetch, "GET", "https://app.vssps.visualstudio.com/_apis/accounts", { memberId: id }, undefined);
          },
        ),
        listProjects: query(
          {
            description: "List the projects in the organization. Names or ids from here are the `project` argument elsewhere.",
            input: object({ ...Org, ...paging, stateFilter: string().optional() }),
          },
          async ({ fetch }, { organization, top, skip, stateFilter }) =>
            send(fetch, "GET", `${base({ organization })}/projects`, { $top: top, $skip: skip, stateFilter }, undefined),
        ),
        getProject: query(
          { description: "Get one project by name or id, including capabilities.", input: object({ ...Org, projectId: string() }) },
          async ({ fetch }, { organization, projectId }) =>
            send(fetch, "GET", `${base({ organization })}/projects/${seg(projectId)}`, { includeCapabilities: true }, undefined),
        ),
        listTeams: query(
          { description: "List the teams of a project.", input: object({ ...Proj, ...paging }) },
          async ({ fetch }, { organization, project, top, skip }) =>
            send(fetch, "GET", `${base({ organization })}/projects/${seg(project)}/teams`, { $top: top, $skip: skip }, undefined),
        ),
      },
      { title: "Organization", description: "Organizations, projects and teams." },
    ),

    workItems: router(
      {
        queryByWiql: query(
          {
            description:
              "Run a WIQL query (for example: Select [System.Id] From WorkItems Where [System.State] = 'Active' Order By [System.ChangedDate] Desc). Returns work item ids only; fetch details with getWorkItems.",
            input: object({ ...Proj, wiql: string(), top: number().optional() }),
          },
          async ({ fetch }, { organization, project, wiql, top }) =>
            send(fetch, "POST", `${base({ organization, project })}/wit/wiql`, { $top: top }, { query: wiql }),
        ),
        getWorkItem: query(
          {
            description: "Get one work item by id. expand: None, Relations, Fields, Links or All.",
            input: object({ ...Org, id: number(), fields: string().optional(), expand: string().optional() }),
          },
          async ({ fetch }, { organization, id, fields, expand }) =>
            send(fetch, "GET", `${base({ organization })}/wit/workitems/${id}`, { fields, $expand: expand }, undefined),
        ),
        getWorkItems: query(
          {
            description: "Get up to 200 work items by id. fields is a comma-separated list of reference names, for example System.Title,System.State.",
            input: object({ ...Org, ids: array(number()), fields: string().optional(), expand: string().optional() }),
          },
          async ({ fetch }, { organization, ids, fields, expand }) =>
            send(fetch, "GET", `${base({ organization })}/wit/workitems`, { ids: ids.join(","), fields, $expand: expand }, undefined),
        ),
        createWorkItem: mutation(
          {
            description:
              'Create a work item of a type such as Bug, Task, User Story or Epic. operations is a JSON Patch array, for example [{ "op": "add", "path": "/fields/System.Title", "value": "Fix login" }].',
            input: object({ ...Proj, type: string(), operations: array(json()), validateOnly: string().optional() }),
          },
          async ({ fetch }, { organization, project, type, operations, validateOnly }) =>
            send(
              fetch,
              "POST",
              `${base({ organization, project })}/wit/workitems/$${seg(type)}`,
              { validateOnly },
              operations,
              "application/json-patch+json",
            ),
        ),
        updateWorkItem: mutation(
          {
            description:
              'Update a work item with a JSON Patch array, for example [{ "op": "replace", "path": "/fields/System.State", "value": "Active" }].',
            input: object({ ...Org, id: number(), operations: array(json()) }),
          },
          async ({ fetch }, { organization, id, operations }) =>
            send(fetch, "PATCH", `${base({ organization })}/wit/workitems/${id}`, {}, operations, "application/json-patch+json"),
        ),
        deleteWorkItem: mutation(
          {
            description: "Delete a work item (moves it to the recycle bin unless destroy is true).",
            input: object({ ...Org, id: number(), destroy: string().optional() }),
          },
          async ({ fetch }, { organization, id, destroy }) =>
            send(fetch, "DELETE", `${base({ organization })}/wit/workitems/${id}`, { destroy }, undefined),
        ),
        listComments: query(
          { description: "List the comments on a work item.", input: object({ ...Proj, workItemId: number(), top: number().optional() }) },
          async ({ fetch }, { organization, project, workItemId, top }) =>
            send(fetch, "GET", `${base({ organization, project })}/wit/workItems/${workItemId}/comments`, { $top: top, "api-version": "7.1-preview.4" }, undefined),
        ),
        addComment: mutation(
          { description: "Add a comment to a work item.", input: object({ ...Proj, workItemId: number(), text: string() }) },
          async ({ fetch }, { organization, project, workItemId, text }) =>
            send(fetch, "POST", `${base({ organization, project })}/wit/workItems/${workItemId}/comments`, { "api-version": "7.1-preview.4" }, { text }),
        ),
        listWorkItemTypes: query(
          { description: "List the work item types of a project.", input: object(Proj) },
          async ({ fetch }, { organization, project }) =>
            send(fetch, "GET", `${base({ organization, project })}/wit/workitemtypes`, {}, undefined),
        ),
        listIterations: query(
          {
            description: "List a team's iterations (sprints). team defaults to the project's default team. timeframe: current, past or future.",
            input: object({ ...Proj, team: string().optional(), timeframe: string().optional() }),
          },
          async ({ fetch }, { organization, project, team, timeframe }) =>
            send(fetch, "GET", `https://dev.azure.com/${organizationOf({ organization })}/${seg(project)}${team ? `/${seg(team)}` : ""}/_apis/work/teamsettings/iterations`, { $timeframe: timeframe }, undefined),
        ),
        getClassificationNodes: query(
          { description: "Get the area and iteration path trees of a project.", input: object({ ...Proj, depth: number().optional() }) },
          async ({ fetch }, { organization, project, depth }) =>
            send(fetch, "GET", `${base({ organization, project })}/wit/classificationnodes`, { $depth: depth }, undefined),
        ),
      },
      { title: "Work items", description: "Boards: query, read, create, update and comment on work items." },
    ),

    repos: router(
      {
        listRepositories: query(
          { description: "List the Git repositories of a project (or of the whole organization when project is omitted).", input: object({ ...Org, project: string().optional() }) },
          async ({ fetch }, { organization, project }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories`, {}, undefined),
        ),
        getRepository: query(
          { description: "Get a Git repository by name or id.", input: object(Repo) },
          async ({ fetch }, { organization, project, repositoryId }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}`, {}, undefined),
        ),
        listBranches: query(
          { description: "List the branches of a repository.", input: object({ ...Repo, filter: string().optional() }) },
          async ({ fetch }, { organization, project, repositoryId, filter }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/refs`, { filter: filter ? `heads/${filter}` : "heads/" }, undefined),
        ),
        listCommits: query(
          {
            description: "List commits of a repository, optionally on one branch (branch) or touching a path (itemPath).",
            input: object({ ...Repo, branch: string().optional(), itemPath: string().optional(), author: string().optional(), fromDate: string().optional(), toDate: string().optional(), top: number().optional(), skip: number().optional() }),
          },
          async ({ fetch }, { organization, project, repositoryId, branch, itemPath, author, fromDate, toDate, top, skip }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/commits`, {
              "searchCriteria.itemVersion.version": branch,
              "searchCriteria.itemPath": itemPath,
              "searchCriteria.author": author,
              "searchCriteria.fromDate": fromDate,
              "searchCriteria.toDate": toDate,
              "searchCriteria.$top": top,
              "searchCriteria.$skip": skip,
            }, undefined),
        ),
        getCommit: query(
          { description: "Get one commit by id.", input: object({ ...Repo, commitId: string(), changeCount: number().optional() }) },
          async ({ fetch }, { organization, project, repositoryId, commitId, changeCount }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/commits/${seg(commitId)}`, { changeCount }, undefined),
        ),
        getFile: query(
          {
            description: "Read a file or list a folder at a path in a repository. version is a branch name unless versionType is tag or commit.",
            input: object({ ...Repo, path: string(), version: string().optional(), versionType: string().optional(), recursionLevel: string().optional() }),
          },
          async ({ fetch }, { organization, project, repositoryId, path, version, versionType, recursionLevel }) => {
            const search = new URLSearchParams({ path, includeContent: "true", "api-version": apiVersion });
            if (version) search.set("versionDescriptor.version", version);
            if (version && versionType) search.set("versionDescriptor.versionType", versionType);
            if (recursionLevel) search.set("recursionLevel", recursionLevel);
            const response = await fetch(`${base({ organization, project })}/git/repositories/${seg(repositoryId)}/items?${search}`, {
              signal,
              headers: { Authorization: authorization(account), Accept: "application/json" },
            });
            return decodeJson(response, json());
          },
        ),
        listPullRequests: query(
          {
            description: "List pull requests in a repository. status: active, abandoned, completed or all.",
            input: object({ ...Repo, status: string().optional(), creatorId: string().optional(), reviewerId: string().optional(), sourceRefName: string().optional(), targetRefName: string().optional(), ...paging }),
          },
          async ({ fetch }, { organization, project, repositoryId, status, creatorId, reviewerId, sourceRefName, targetRefName, top, skip }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests`, {
              "searchCriteria.status": status,
              "searchCriteria.creatorId": creatorId,
              "searchCriteria.reviewerId": reviewerId,
              "searchCriteria.sourceRefName": sourceRefName,
              "searchCriteria.targetRefName": targetRefName,
              $top: top,
              $skip: skip,
            }, undefined),
        ),
        getPullRequest: query(
          { description: "Get one pull request by id.", input: object({ ...Repo, pullRequestId: number() }) },
          async ({ fetch }, { organization, project, repositoryId, pullRequestId }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests/${pullRequestId}`, {}, undefined),
        ),
        createPullRequest: mutation(
          {
            description: "Open a pull request. Branch names are full refs, for example refs/heads/feature.",
            input: object({ ...Repo, sourceRefName: string(), targetRefName: string(), title: string(), description: string().optional(), isDraft: string().optional() }),
          },
          async ({ fetch }, { organization, project, repositoryId, sourceRefName, targetRefName, title, description, isDraft }) =>
            send(fetch, "POST", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests`, {}, {
              sourceRefName,
              targetRefName,
              title,
              description,
              isDraft: isDraft === "true",
            }),
        ),
        updatePullRequest: mutation(
          {
            description: "Update a pull request: title, description, status (active, abandoned, completed) or other fields in body.",
            input: object({ ...Repo, pullRequestId: number(), body: record(json()) }),
          },
          async ({ fetch }, { organization, project, repositoryId, pullRequestId, body }) =>
            send(fetch, "PATCH", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests/${pullRequestId}`, {}, body),
        ),
        listPullRequestThreads: query(
          { description: "List the comment threads on a pull request.", input: object({ ...Repo, pullRequestId: number() }) },
          async ({ fetch }, { organization, project, repositoryId, pullRequestId }) =>
            send(fetch, "GET", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests/${pullRequestId}/threads`, {}, undefined),
        ),
        createPullRequestThread: mutation(
          { description: "Start a comment thread on a pull request.", input: object({ ...Repo, pullRequestId: number(), content: string(), status: string().optional() }) },
          async ({ fetch }, { organization, project, repositoryId, pullRequestId, content, status }) =>
            send(fetch, "POST", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests/${pullRequestId}/threads`, {}, {
              comments: [{ parentCommentId: 0, content, commentType: 1 }],
              status: status ?? "active",
            }),
        ),
        replyToPullRequestThread: mutation(
          { description: "Reply in an existing pull request comment thread.", input: object({ ...Repo, pullRequestId: number(), threadId: number(), content: string() }) },
          async ({ fetch }, { organization, project, repositoryId, pullRequestId, threadId, content }) =>
            send(fetch, "POST", `${base({ organization, project })}/git/repositories/${seg(repositoryId)}/pullrequests/${pullRequestId}/threads/${threadId}/comments`, {}, { content, parentCommentId: 1, commentType: 1 }),
        ),
      },
      { title: "Repos", description: "Git repositories, branches, commits, files and pull requests." },
    ),

    pipelines: router(
      {
        listPipelines: query(
          { description: "List the pipelines of a project.", input: object({ ...Proj, top: number().optional() }) },
          async ({ fetch }, { organization, project, top }) =>
            send(fetch, "GET", `${base({ organization, project })}/pipelines`, { $top: top }, undefined),
        ),
        runPipeline: mutation(
          {
            description: "Run a pipeline. body may set resources.repositories.self.refName, templateParameters and variables.",
            input: object({ ...Proj, pipelineId: number(), body: record(json()).optional() }),
          },
          async ({ fetch }, { organization, project, pipelineId, body }) =>
            send(fetch, "POST", `${base({ organization, project })}/pipelines/${pipelineId}/runs`, {}, body ?? {}),
        ),
        getPipelineRun: query(
          { description: "Get one pipeline run.", input: object({ ...Proj, pipelineId: number(), runId: number() }) },
          async ({ fetch }, { organization, project, pipelineId, runId }) =>
            send(fetch, "GET", `${base({ organization, project })}/pipelines/${pipelineId}/runs/${runId}`, {}, undefined),
        ),
        listBuilds: query(
          {
            description: "List builds. statusFilter: all, inProgress, completed, cancelling, postponed, notStarted. resultFilter: succeeded, failed, canceled, partiallySucceeded.",
            input: object({ ...Proj, definitions: string().optional(), branchName: string().optional(), statusFilter: string().optional(), resultFilter: string().optional(), top: number().optional() }),
          },
          async ({ fetch }, { organization, project, definitions, branchName, statusFilter, resultFilter, top }) =>
            send(fetch, "GET", `${base({ organization, project })}/build/builds`, { definitions, branchName, statusFilter, resultFilter, $top: top }, undefined),
        ),
        getBuild: query(
          { description: "Get one build by id.", input: object({ ...Proj, buildId: number() }) },
          async ({ fetch }, { organization, project, buildId }) =>
            send(fetch, "GET", `${base({ organization, project })}/build/builds/${buildId}`, {}, undefined),
        ),
        queueBuild: mutation(
          {
            description: "Queue a build of a build definition. parameters is a JSON string of queue-time variables.",
            input: object({ ...Proj, definitionId: number(), sourceBranch: string().optional(), parameters: string().optional() }),
          },
          async ({ fetch }, { organization, project, definitionId, sourceBranch, parameters }) =>
            send(fetch, "POST", `${base({ organization, project })}/build/builds`, {}, { definition: { id: definitionId }, sourceBranch, parameters }),
        ),
        listBuildDefinitions: query(
          { description: "List build definitions.", input: object({ ...Proj, name: string().optional(), top: number().optional() }) },
          async ({ fetch }, { organization, project, name, top }) =>
            send(fetch, "GET", `${base({ organization, project })}/build/definitions`, { name, $top: top }, undefined),
        ),
        listBuildLogs: query(
          { description: "List the log files of a build.", input: object({ ...Proj, buildId: number() }) },
          async ({ fetch }, { organization, project, buildId }) =>
            send(fetch, "GET", `${base({ organization, project })}/build/builds/${buildId}/logs`, {}, undefined),
        ),
        getBuildTimeline: query(
          { description: "Get the stages, jobs and tasks of a build with their results.", input: object({ ...Proj, buildId: number() }) },
          async ({ fetch }, { organization, project, buildId }) =>
            send(fetch, "GET", `${base({ organization, project })}/build/builds/${buildId}/timeline`, {}, undefined),
        ),
      },
      { title: "Pipelines", description: "Pipelines and builds: list, run, inspect." },
    ),

    wiki: router(
      {
        listWikis: query(
          { description: "List the wikis of a project.", input: object({ ...Org, project: string().optional() }) },
          async ({ fetch }, { organization, project }) =>
            send(fetch, "GET", `${base({ organization, project })}/wiki/wikis`, {}, undefined),
        ),
        getWikiPage: query(
          { description: "Get a wiki page with its content by path.", input: object({ ...Proj, wikiIdentifier: string(), path: string() }) },
          async ({ fetch }, { organization, project, wikiIdentifier, path }) =>
            send(fetch, "GET", `${base({ organization, project })}/wiki/wikis/${seg(wikiIdentifier)}/pages`, { path, includeContent: true }, undefined),
        ),
      },
      { title: "Wiki", description: "Project wikis." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { azureDevops: azureDevops.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.azureDevops ?? [],
        (account) =>
          withApprovals(tools(account, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Azure DevOps",
        description:
          "Azure DevOps Services boards, repos, pull requests, pipelines and wikis: work item queries and updates, Git branches, commits and pull requests, builds and pipeline runs.",
        instructions:
          "Every tool takes an optional organization (the name in https://dev.azure.com/<organization>). Token accounts default to the organization they were saved with; OAuth accounts must pass it, found with organizations.listOrganizations. Most tools also take a project name or id from organizations.listProjects.",
        icons,
      },
    ),
  }),
);
