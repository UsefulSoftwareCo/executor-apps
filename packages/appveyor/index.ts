import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  boolean,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://ci.appveyor.com";

const appveyor = defineProvider({
  name: "AppVeyor",
  hosts: ["ci.appveyor.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only listing endpoint; a valid token returns JSON here.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/projects`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown, raw?: "text") => {
    const url = new URL(`${origin}/api${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": typeof body === "string" ? "text/plain" : "application/json" }),
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    if (raw === "text") {
      if (!response.ok) throw new Error(`AppVeyor request failed (${response.status})`);
      return { text: await response.text() };
    }
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const s = () => string({ minLength: 1 });
const Project = object({ accountName: s(), projectSlug: s() });
const projectPath = (p: { accountName: string; projectSlug: string }) => `/projects/${seg(p.accountName)}/${seg(p.projectSlug)}`;
const empty = object({});

function build(call: Call) {
  const projects = router(
    {
      list: query({ description: "List all projects with their recent builds.", input: empty }, () => call("GET", "/projects")),
      get: query(
        { description: "Get a project and its last build.", input: Project },
        (_c, i) => call("GET", projectPath(i)),
      ),
      add: mutation(
        {
          description: "Add a project from a repository. repositoryProvider is one of gitHub, bitBucket, vso, gitLab, kiln, stash, git, mercurial, subversion.",
          input: object({ repositoryProvider: s(), repositoryName: s() }),
          approval: always(),
        },
        (_c, i) => call("POST", "/projects", {}, i),
      ),
      update: mutation(
        {
          description: "Replace a project's settings. Body is the full project settings object as returned by projects.settings; send it back modified.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("PUT", "/projects", {}, body),
      ),
      delete: mutation(
        { description: "Delete a project.", input: Project, approval: always() },
        (_c, i) => call("DELETE", projectPath(i)),
      ),
      clearBuildCache: mutation(
        { description: "Clear a project's build cache.", input: Project, approval: always() },
        (_c, i) => call("DELETE", `${projectPath(i)}/buildcache`),
      ),
      settings: query(
        { description: "Get a project's full settings, configuration and available build images.", input: Project },
        (_c, i) => call("GET", `${projectPath(i)}/settings`),
      ),
      settingsYaml: query(
        { description: "Get a project's settings as appveyor.yml text.", input: Project },
        (_c, i) => call("GET", `${projectPath(i)}/settings/yaml`, {}, undefined, "text"),
      ),
      updateSettingsYaml: mutation(
        { description: "Replace a project's settings with the given appveyor.yml text.", input: object({ accountName: s(), projectSlug: s(), yaml: s() }), approval: always() },
        (_c, { yaml, ...i }) => call("PUT", `${projectPath(i)}/settings/yaml`, {}, yaml),
      ),
      environmentVariables: query(
        { description: "List a project's environment variables as {name, value: {isEncrypted, value}}.", input: Project },
        (_c, i) => call("GET", `${projectPath(i)}/settings/environment-variables`),
      ),
      updateEnvironmentVariables: mutation(
        {
          description: "Replace all of a project's environment variables. variables is an array of {name, value: {isEncrypted, value}}.",
          input: object({ accountName: s(), projectSlug: s(), variables: json() }),
          approval: always(),
        },
        (_c, { variables, ...i }) => call("PUT", `${projectPath(i)}/settings/environment-variables`, {}, variables),
      ),
      setNextBuildNumber: mutation(
        { description: "Set the next build number for a project.", input: object({ accountName: s(), projectSlug: s(), nextBuildNumber: number() }), approval: always() },
        (_c, { nextBuildNumber, ...i }) => call("PUT", `${projectPath(i)}/settings/build-number`, {}, { nextBuildNumber }),
      ),
      history: query(
        {
          description: "List a project's build history, newest first.",
          input: object({ accountName: s(), projectSlug: s(), recordsNumber: number(), startBuildId: number().optional(), branch: string().optional() }),
        },
        (_c, { recordsNumber, startBuildId, branch, ...i }) =>
          call("GET", `${projectPath(i)}/history`, { recordsNumber, startBuildId, branch }),
      ),
      deployments: query(
        {
          description: "List a project's deployments (up to 20 per call).",
          input: object({ accountName: s(), projectSlug: s(), recordsNumber: number().optional(), startDeploymentId: number().optional() }),
        },
        (_c, { recordsNumber, startDeploymentId, ...i }) =>
          call("GET", `${projectPath(i)}/deployments`, { recordsNumber, startDeploymentId }),
      ),
    },
    { title: "Projects", description: "AppVeyor projects, their settings, environment variables and history." },
  );

  const builds = router(
    {
      latestForBranch: query(
        { description: "Get the latest build of a branch.", input: object({ accountName: s(), projectSlug: s(), branch: s() }) },
        (_c, { branch, ...i }) => call("GET", `${projectPath(i)}/branch/${seg(branch)}`),
      ),
      get: query(
        { description: "Get a specific build by version, including its jobs.", input: object({ accountName: s(), projectSlug: s(), buildVersion: s() }) },
        (_c, { buildVersion, ...i }) => call("GET", `${projectPath(i)}/build/${seg(buildVersion)}`),
      ),
      jobLog: query(
        { description: "Get a build job's console log as text.", input: object({ jobId: s() }) },
        (_c, { jobId }) => call("GET", `/buildjobs/${seg(jobId)}/log`, {}, undefined, "text"),
      ),
      start: mutation(
        {
          description: "Queue a build for the latest commit of a branch, a specific commit (commitId), or a pull request (pullRequestId, no branch). environmentVariables is an optional name-to-value map.",
          input: object({
            accountName: s(),
            projectSlug: s(),
            branch: string().optional(),
            commitId: string().optional(),
            pullRequestId: number().optional(),
            environmentVariables: record(string()).optional(),
          }),
          approval: always(),
        },
        (_c, i) => call("POST", "/builds", {}, i),
      ),
      rerun: mutation(
        {
          description: "Re-run a build. With reRunIncomplete true only failed or cancelled jobs run again.",
          input: object({ buildId: number(), reRunIncomplete: boolean().default(false) }),
          approval: always(),
        },
        (_c, i) => call("PUT", "/builds", {}, i),
      ),
      cancel: mutation(
        { description: "Cancel a running build.", input: object({ accountName: s(), projectSlug: s(), buildVersion: s() }), approval: always() },
        (_c, { accountName, projectSlug, buildVersion }) =>
          call("DELETE", `/builds/${seg(accountName)}/${seg(projectSlug)}/${seg(buildVersion)}`),
      ),
      delete: mutation(
        { description: "Delete a build.", input: object({ buildId: number() }), approval: always() },
        (_c, { buildId }) => call("DELETE", `/builds/${buildId}`),
      ),
    },
    { title: "Builds", description: "Start, inspect, re-run, cancel and delete builds; read job logs." },
  );

  const environments = router(
    {
      list: query({ description: "List deployment environments.", input: empty }, () => call("GET", "/environments")),
      settings: query(
        { description: "Get an environment's settings, access key, provider settings and variables.", input: object({ environmentId: number() }) },
        (_c, { environmentId }) => call("GET", `/environments/${environmentId}/settings`),
      ),
      deployments: query(
        { description: "Get an environment and its deployments.", input: object({ environmentId: number() }) },
        (_c, { environmentId }) => call("GET", `/environments/${environmentId}/deployments`),
      ),
      create: mutation(
        {
          description: "Create an environment. Body has name, provider and settings {providerSettings[], environmentVariables[]}; items are {name, value: {value, isEncrypted}}.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("POST", "/environments", {}, body),
      ),
      update: mutation(
        {
          description: "Update an environment. Body has deploymentEnvironmentId, name, environmentAccessKey and settings, as returned by environments.settings.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("PUT", "/environments", {}, body),
      ),
      delete: mutation(
        { description: "Delete an environment.", input: object({ environmentId: number() }), approval: always() },
        (_c, { environmentId }) => call("DELETE", `/environments/${environmentId}`),
      ),
    },
    { title: "Environments", description: "Deployment environments and their settings." },
  );

  const deployments = router(
    {
      get: query(
        { description: "Get a deployment with its build, environment, jobs and status.", input: object({ deploymentId: number() }) },
        (_c, { deploymentId }) => call("GET", `/deployments/${deploymentId}`),
      ),
      start: mutation(
        {
          description: "Deploy a build to an environment. buildJobId is needed only when the build has several jobs with artifacts.",
          input: object({
            environmentName: s(),
            accountName: s(),
            projectSlug: s(),
            buildVersion: s(),
            buildJobId: string().optional(),
            environmentVariables: record(string()).optional(),
          }),
          approval: always(),
        },
        (_c, i) => call("POST", "/deployments", {}, i),
      ),
      stop: mutation(
        { description: "Stop a running deployment.", input: object({ deploymentId: number() }), approval: always() },
        (_c, i) => call("PUT", "/deployments/stop", {}, i),
      ),
    },
    { title: "Deployments", description: "Start, inspect and stop deployments." },
  );

  const users = router(
    {
      list: query({ description: "List users.", input: empty }, () => call("GET", "/users")),
      get: query(
        { description: "Get a user and the available roles.", input: object({ userId: number() }) },
        (_c, { userId }) => call("GET", `/users/${userId}`),
      ),
      add: mutation(
        {
          description: "Add a user. Set generatePassword true or supply password and confirmPassword.",
          input: object({
            fullName: s(),
            email: s(),
            roleId: number(),
            generatePassword: boolean().default(true),
            password: string().optional(),
            confirmPassword: string().optional(),
          }),
          approval: always(),
        },
        (_c, i) => call("POST", "/users", {}, i),
      ),
      update: mutation(
        {
          description: "Update a user. Body has userId, fullName, email, password (or null), roleId and the notification settings, as returned by users.get.",
          input: object({ body: json() }),
          approval: always(),
        },
        (_c, { body }) => call("PUT", "/users", {}, body),
      ),
      delete: mutation(
        { description: "Delete a user.", input: object({ userId: number() }), approval: always() },
        (_c, { userId }) => call("DELETE", `/users/${userId}`),
      ),
    },
    { title: "Users", description: "Account users." },
  );

  const collaborators = router(
    {
      list: query({ description: "List collaborators.", input: empty }, () => call("GET", "/collaborators")),
      get: query(
        { description: "Get a collaborator and the available roles.", input: object({ userId: number() }) },
        (_c, { userId }) => call("GET", `/collaborators/${userId}`),
      ),
      add: mutation(
        { description: "Invite a collaborator by email with a role.", input: object({ email: s(), roleId: number() }), approval: always() },
        (_c, i) => call("POST", "/collaborators", {}, i),
      ),
      update: mutation(
        { description: "Change a collaborator's role.", input: object({ userId: number(), roleId: number() }), approval: always() },
        (_c, i) => call("PUT", "/collaborators", {}, i),
      ),
      delete: mutation(
        { description: "Remove a collaborator.", input: object({ userId: number() }), approval: always() },
        (_c, { userId }) => call("DELETE", `/collaborators/${userId}`),
      ),
    },
    { title: "Collaborators", description: "Account collaborators." },
  );

  const roles = router(
    {
      list: query({ description: "List roles.", input: empty }, () => call("GET", "/roles")),
      get: query(
        { description: "Get a role with its permission groups.", input: object({ roleId: number() }) },
        (_c, { roleId }) => call("GET", `/roles/${roleId}`),
      ),
      add: mutation(
        { description: "Create a role.", input: object({ name: s() }), approval: always() },
        (_c, i) => call("POST", "/roles", {}, i),
      ),
      update: mutation(
        { description: "Update a role. Body is the full role object (roleId, name, groups with permissions) as returned by roles.get.", input: object({ body: json() }), approval: always() },
        (_c, { body }) => call("PUT", "/roles", {}, body),
      ),
      delete: mutation(
        { description: "Delete a role.", input: object({ roleId: number() }), approval: always() },
        (_c, { roleId }) => call("DELETE", `/roles/${roleId}`),
      ),
    },
    { title: "Roles", description: "Account roles and permissions." },
  );

  return router({ projects, builds, environments, deployments, users, collaborators, roles });
}

export default defineApp(
  { user: { accounts: { appveyor: appveyor.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.appveyor ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "AppVeyor",
        description: "Manage AppVeyor CI/CD: projects, builds, build logs, environments, deployments, users, collaborators and roles.",
        icons,
      },
    ),
  }),
);
