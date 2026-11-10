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
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://a.blazemeter.com/api/v4";

const blazemeter = defineProvider({
  name: "BlazeMeter",
  hosts: ["a.blazemeter.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ keyId: string({ minLength: 1 }), keySecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, { signal, headers: headers(account) });
    const { result } = await decodeJson(response, object({ result: object({ id: number() }) }));
    return { accountInfo: { externalId: String(result.id) } };
  },
});

type Account = { fields: { keyId: string; keySecret: string } };

// BlazeMeter API keys authenticate with HTTP Basic: key id as user, key secret as password.
const headers = (account: Account) => ({
  Authorization: `Basic ${btoa(`${account.fields.keyId}:${account.fields.keySecret}`)}`,
  Accept: "application/json",
});

type Params = Record<string, string | number | boolean | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const blazemeterTools = (account: Account, signal: AbortSignal) => {
  const call = async (
    fetch: typeof globalThis.fetch,
    method: string,
    path: string,
    params: Params = {},
    body?: unknown,
  ) =>
    decodeJson(
      await fetch(`${base}${path}${search(params)}`, {
        method,
        signal,
        headers: body === undefined ? headers(account) : { ...headers(account), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      json(),
    );

  const paging = { limit: number().optional(), skip: number().optional() };

  return router(
    {
      user: router(
        {
          get: query(
            { description: "Get the user the API key belongs to: id, name, email, default account and workspace.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/user"),
          ),
          projects: query(
            { description: "List the projects the user can access.", input: object({ ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/user/projects", input),
          ),
          invites: query(
            { description: "List pending workspace and account invitations for the user.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/user/invites"),
          ),
          activeSessions: query(
            { description: "List the active test sessions of the user.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/user/active"),
          ),
          terminateSessions: mutation(
            {
              description: "Immediately terminate the given active sessions of the user.",
              input: object({ sessionIds: array(string()) }),
              approval: always(),
            },
            async ({ fetch }, { sessionIds }) => call(fetch, "POST", "/user/active/terminate", {}, { session_ids: sessionIds }),
          ),
        },
        { title: "User", description: "The user behind the API key." },
      ),
      accounts: router(
        {
          list: query(
            { description: "List accounts the user belongs to.", input: object({ ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/accounts", input),
          ),
        },
        { title: "Accounts", description: "Accounts that own workspaces." },
      ),
      workspaces: router(
        {
          list: query(
            { description: "List workspaces, optionally for one account.", input: object({ accountId: number().optional(), ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/workspaces", input),
          ),
          get: query(
            { description: "Get one workspace by id.", input: object({ workspaceId: number() }) },
            async ({ fetch }, { workspaceId }) => call(fetch, "GET", `/workspaces/${workspaceId}`),
          ),
          users: query(
            { description: "List the users of a workspace.", input: object({ workspaceId: number(), ...paging }) },
            async ({ fetch }, { workspaceId, ...rest }) => call(fetch, "GET", `/workspaces/${workspaceId}/users`, rest),
          ),
          terminateMasters: mutation(
            {
              description:
                "Terminate the active test runs (masters) of a workspace. Use dryRun to preview without terminating.",
              input: object({ workspaceId: number(), dryRun: boolean().optional() }),
              approval: always(),
            },
            async ({ fetch }, { workspaceId, ...body }) =>
              call(fetch, "POST", `/workspaces/${workspaceId}/terminate-masters`, {}, body),
          ),
          updateUser: mutation(
            {
              description: "Update a workspace user's roles and enabled flag.",
              input: object({ workspaceId: number(), userId: number(), roles: array(string()), enabled: boolean() }),
              approval: always(),
            },
            async ({ fetch }, { workspaceId, userId, ...body }) =>
              call(fetch, "PATCH", `/workspaces/${workspaceId}/users/${userId}`, {}, body),
          ),
        },
        { title: "Workspaces", description: "Workspaces group projects and tests." },
      ),
      projects: router(
        {
          list: query(
            {
              description: "List projects, optionally for one workspace or account.",
              input: object({ workspaceId: number().optional(), accountId: number().optional(), name: string().optional(), ...paging }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/projects", input),
          ),
          get: query(
            { description: "Get one project by id.", input: object({ projectId: number() }) },
            async ({ fetch }, { projectId }) => call(fetch, "GET", `/projects/${projectId}`),
          ),
          create: mutation(
            { description: "Create a project in a workspace.", input: object({ name: string(), workspaceId: number() }), approval: always() },
            async ({ fetch }, input) => call(fetch, "POST", "/projects", {}, input),
          ),
          update: mutation(
            {
              description: "Rename a project or change its description.",
              input: object({ projectId: number(), name: string().optional(), description: string().optional() }),
              approval: always(),
            },
            async ({ fetch }, { projectId, ...body }) => call(fetch, "PATCH", `/projects/${projectId}`, {}, body),
          ),
          delete: mutation(
            { description: "Delete a project and its tests.", input: object({ projectId: number() }), approval: always() },
            async ({ fetch }, { projectId }) => call(fetch, "DELETE", `/projects/${projectId}`),
          ),
        },
        { title: "Projects", description: "Projects hold tests inside a workspace." },
      ),
      tests: router(
        {
          list: query(
            {
              description: "List tests, optionally filtered by project, workspace, account or name.",
              input: object({
                projectId: number().optional(),
                workspaceId: number().optional(),
                accountId: number().optional(),
                name: string().optional(),
                ...paging,
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/tests", input),
          ),
          get: query(
            { description: "Get one test with its full configuration.", input: object({ testId: number() }) },
            async ({ fetch }, { testId }) => call(fetch, "GET", `/tests/${testId}`),
          ),
          create: mutation(
            {
              description:
                "Create a test in a project. configuration follows BlazeMeter's test configuration object (for example {type: 'http', plugins: {...}}); omit it for an empty test.",
              input: object({ name: string(), projectId: number(), configuration: record(json()).optional() }),
              approval: always(),
            },
            async ({ fetch }, input) => call(fetch, "POST", "/tests", {}, input),
          ),
          update: mutation(
            {
              description: "Update a test's name or configuration (PATCH, so only the given fields change).",
              input: object({ testId: number(), name: string().optional(), configuration: record(json()).optional() }),
              approval: always(),
            },
            async ({ fetch }, { testId, ...body }) => call(fetch, "PATCH", `/tests/${testId}`, {}, body),
          ),
          duplicate: mutation(
            {
              description: "Duplicate a test, optionally under a new name.",
              input: object({ testId: number(), name: string().optional() }),
              approval: always(),
            },
            async ({ fetch }, { testId, ...body }) => call(fetch, "POST", `/tests/${testId}/duplicate`, {}, body),
          ),
          delete: mutation(
            { description: "Delete a test.", input: object({ testId: number() }), approval: always() },
            async ({ fetch }, { testId }) => call(fetch, "DELETE", `/tests/${testId}`),
          ),
          start: mutation(
            {
              description:
                "Start a test run. Returns the new master (test run). delayedStart and isDebugRun are sent as query flags. Consumes plan load capacity.",
              input: object({ testId: number(), delayedStart: boolean().optional(), isDebugRun: boolean().optional() }),
              approval: always(),
            },
            async ({ fetch }, { testId, ...rest }) => call(fetch, "POST", `/tests/${testId}/start`, rest),
          ),
          stop: mutation(
            { description: "Stop all running masters of a test.", input: object({ testId: number() }), approval: always() },
            async ({ fetch }, { testId }) => call(fetch, "POST", `/tests/${testId}/stop`),
          ),
          files: query(
            { description: "List the script and data files attached to a test.", input: object({ testId: number() }) },
            async ({ fetch }, { testId }) => call(fetch, "GET", `/tests/${testId}/files`),
          ),
          validations: query(
            { description: "Get the validation results of a test's configuration.", input: object({ testId: number() }) },
            async ({ fetch }, { testId }) => call(fetch, "GET", `/tests/${testId}/validations`),
          ),
          validate: mutation(
            {
              description: "Start validation of a test's configuration; read the outcome with tests.validations.",
              input: object({ testId: number() }),
              approval: always(),
            },
            async ({ fetch }, { testId }) => call(fetch, "POST", `/tests/${testId}/validate`),
          ),
        },
        { title: "Tests", description: "Performance and functional test definitions." },
      ),
      masters: router(
        {
          summary: query(
            {
              description: "Get the default report summary of a test run: hits, errors, response times, throughput.",
              input: object({ masterId: number() }),
            },
            async ({ fetch }, { masterId }) => call(fetch, "GET", `/masters/${masterId}/reports/default/summary`),
          ),
          stop: mutation(
            { description: "Stop a running test run gracefully.", input: object({ masterId: number() }), approval: always() },
            async ({ fetch }, { masterId }) => call(fetch, "POST", `/masters/${masterId}/stop`),
          ),
        },
        { title: "Masters", description: "Test runs. A master is one execution of a test." },
      ),
      multiTests: router(
        {
          list: query(
            {
              description: "List multi-tests (collections that run several tests together).",
              input: object({ projectId: number().optional(), workspaceId: number().optional(), ...paging }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/multi-tests", input),
          ),
          get: query(
            {
              description: "Get one multi-test by id.",
              input: object({ collectionId: number(), populateTests: boolean().optional() }),
            },
            async ({ fetch }, { collectionId, ...rest }) => call(fetch, "GET", `/multi-tests/${collectionId}`, rest),
          ),
          create: mutation(
            {
              description: "Create a multi-test (collection) in a project. Add tests to it afterwards in BlazeMeter.",
              input: object({ name: string(), projectId: number(), collectionType: string().optional() }),
              approval: always(),
            },
            async ({ fetch }, input) => call(fetch, "POST", "/multi-tests", {}, input),
          ),
        },
        { title: "Multi-tests", description: "Collections that run several tests at once." },
      ),
      schedules: router(
        {
          list: query(
            {
              description: "List test schedules, optionally for one test, multi-test, project, workspace or account.",
              input: object({
                testId: number().optional(),
                collectionId: number().optional(),
                projectId: number().optional(),
                workspaceId: number().optional(),
                accountId: number().optional(),
                enabled: boolean().optional(),
                ...paging,
              }),
            },
            async ({ fetch }, input) => call(fetch, "GET", "/schedules", input),
          ),
          get: query(
            { description: "Get one schedule.", input: object({ scheduleId: string() }) },
            async ({ fetch }, { scheduleId }) => call(fetch, "GET", `/schedules/${scheduleId}`),
          ),
          create: mutation(
            {
              description:
                "Create a cron schedule for a test (testId) or a multi-test (testCollectionId). cron is a cron string such as '0 9 * * 1-5'. Give one of testId or testCollectionId.",
              input: object({ cron: string(), testId: number().optional(), testCollectionId: number().optional() }),
              approval: always(),
            },
            async ({ fetch }, input) => {
              if ((input.testId === undefined) === (input.testCollectionId === undefined))
                throw new Error("give exactly one of testId or testCollectionId");
              return call(fetch, "POST", "/schedules", {}, input);
            },
          ),
          update: mutation(
            {
              description: "Enable or disable a schedule.",
              input: object({ scheduleId: string(), enabled: boolean() }),
              approval: always(),
            },
            async ({ fetch }, { scheduleId, ...body }) => call(fetch, "PATCH", `/schedules/${scheduleId}`, {}, body),
          ),
          delete: mutation(
            { description: "Delete a schedule.", input: object({ scheduleId: string() }), approval: always() },
            async ({ fetch }, { scheduleId }) => call(fetch, "DELETE", `/schedules/${scheduleId}`),
          ),
        },
        { title: "Schedules", description: "Recurring test executions." },
      ),
      locations: router(
        {
          list: query(
            { description: "List public load-generation locations and their ids for test configurations.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/locations"),
          ),
          listPrivate: query(
            { description: "List private locations (Private Location harbors) of the user's accounts.", input: object({ ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/private-locations", input),
          ),
          createPrivate: mutation(
            {
              description: "Create a private location (harbor) in an account and share it with workspaces.",
              input: object({
                name: string(),
                type: string(),
                accountId: number(),
                workspacesId: array(number()),
                funcIds: array(string()),
                threadsPerEngine: number(),
                slots: number().optional(),
                engineXms: number().optional(),
                engineXmx: number().optional(),
                consoleXms: number().optional(),
                consoleXmx: number().optional(),
                overrideCPU: number().optional(),
                overrideMemory: number().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) => call(fetch, "POST", "/private-locations", {}, input),
          ),
        },
        { title: "Locations", description: "Where load is generated from." },
      ),
      organization: router(
        {
          tags: query(
            { description: "List tags.", input: object({ workspaceId: number().optional(), ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/tags", input),
          ),
          folders: query(
            { description: "List folders.", input: object({ workspaceId: number().optional(), ...paging }) },
            async ({ fetch }, input) => call(fetch, "GET", "/folders", input),
          ),
          createTag: mutation(
            {
              description: "Create a tag in a workspace.",
              input: object({ workspaceId: number(), label: string() }),
              approval: always(),
            },
            async ({ fetch }, { workspaceId, ...body }) => call(fetch, "POST", `/workspaces/${workspaceId}/tags`, {}, body),
          ),
          searchMetadata: query(
            { description: "List the entities, fields, relations and operators that search accepts.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/search/metadata"),
          ),
          search: mutation(
            {
              description:
                "Search one entity type (see searchMetadata) with filters, selected fields and ordering. Read-only despite using POST.",
              input: object({
                entity: string(),
                fields: array(string()).optional(),
                filters: json().optional(),
                ordering: json().optional(),
                accountId: number().optional(),
                workspaceId: number().optional(),
                ...paging,
              }),
              approval: always(),
            },
            async ({ fetch }, input) => call(fetch, "POST", "/search", {}, input),
          ),
        },
        { title: "Organization", description: "Tags, folders and search." },
      ),
      info: router(
        {
          version: query(
            { description: "Get the BlazeMeter API version.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/info/version"),
          ),
          health: query(
            { description: "Get the BlazeMeter service health.", input: object({}) },
            async ({ fetch }) => call(fetch, "GET", "/info/health"),
          ),
        },
        { title: "Info", description: "Service version and health." },
      ),
      request: mutation(
        {
          description:
            "Call any other BlazeMeter API v4 endpoint. path starts with a single slash and is relative to https://a.blazemeter.com/api/v4 (for example /masters/123). It must not contain '?', '#' or '..'; put query-string parameters in the query field. Use only when no dedicated tool exists.",
          input: object({
            method: string(),
            path: string(),
            query: record(string()).optional(),
            body: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => {
          const method = input.method.toUpperCase();
          if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method))
            throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
          if (
            !input.path.startsWith("/") ||
            input.path.includes("//") ||
            /[?#\\]/.test(input.path) ||
            input.path.split("/").some((segment) => segment === ".." || segment === ".")
          )
            throw new Error("path must start with a single slash and must not contain '?', '#', backslashes or '.'/'..' segments; use the query field for query parameters");
          return call(fetch, method, input.path, input.query ?? {}, input.body);
        },
      ),
    },
  );
};

export default defineApp({ user: { accounts: { blazemeter: blazemeter.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.blazemeter ?? [], (account) => blazemeterTools(account, signal), { signal }), {
    title: "BlazeMeter",
    description:
      "Run and analyze performance tests with BlazeMeter: tests, test runs (masters), multi-tests, projects, workspaces, schedules, locations and users. Use request for endpoints without a dedicated tool (for example fetching a master by id).",
    icons,
  }),
}));
