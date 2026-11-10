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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.promptmate.io/v1";

const promptmate = defineProvider({
  name: "Promptmate.io",
  hosts: ["api.promptmate.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/userInfo`, { signal, headers: { "x-api-key": account.fields.token } });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, params?: Record<string, string | number | boolean | undefined>, body?: unknown) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined) search.set(key, String(value));
    const qs = search.toString();
    const response = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: body === undefined ? { "x-api-key": token } : { "x-api-key": token, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  return {
    get: (path: string, params?: Record<string, string | number | boolean | undefined>) => send("GET", path, params),
    post: (path: string, body: unknown) => send("POST", path, undefined, body),
    del: (path: string, body: unknown) => send("DELETE", path, undefined, body),
  };
}

function build(api: ReturnType<typeof client>) {
  return router({
    getUserInfo: query(
      { description: "Return details about the account that owns the API key, including credit information.", input: object({}) },
      async () => api.get("/userInfo"),
    ),
    apps: router({
      list: query(
        { description: "List the Promptmate apps on the account (id and name). An app id is needed to read an app, run a job or fetch results.", input: object({}) },
        async () => api.get("/apps"),
      ),
      get: query(
        {
          description: "Get one app's structure: name, estimated credit cost per row, the data fields a job must supply, and the response fields it returns.",
          input: object({ appId: string({ minLength: 1 }) }),
        },
        async (_ctx, { appId }) => api.get("/app", { appId }),
      ),
      getLastResults: query(
        {
          description: "Get the most recent result rows an app produced, useful to inspect output shape without running a job.",
          input: object({ appId: string({ minLength: 1 }), limit: number().optional(), onlyDefaultResultFields: boolean().optional() }),
        },
        async (_ctx, { appId, limit, onlyDefaultResultFields }) =>
          api.get("/app-results", { appId, limit, onlyDefaultResultFields }),
      ),
    }),
    jobs: router({
      create: mutation(
        {
          description:
            "Start a job that runs an app over rows of data. Each object in data must contain the data fields the app requires (see apps.get). Consumes credits. Processing is asynchronous: poll jobs.get with the returned job id, or set callBackUrl.",
          input: object({
            appId: string({ minLength: 1 }),
            data: array(record(json())),
            callBackUrl: string().optional(),
            noMailOnFinish: boolean().optional(),
            config: object({ language: string().optional(), country: string().optional() }).optional(),
          }),
        },
        async (_ctx, input) => api.post("/app-jobs", input),
      ),
      get: query(
        {
          description: "Get the status and results of a job started with jobs.create.",
          input: object({ appId: string({ minLength: 1 }), jobId: string({ minLength: 1 }), onlyDefaultResultFields: boolean().optional() }),
        },
        async (_ctx, { appId, jobId, onlyDefaultResultFields }) =>
          api.get("/app-jobs", { appId, jobId, onlyDefaultResultFields }),
      ),
    }),
    templates: router({
      list: query({ description: "List the available app templates.", input: object({}) }, async () => api.get("/templates")),
      use: mutation(
        {
          description: "Create a new app from a template. Each call creates a new app.",
          input: object({ templateId: string({ minLength: 1 }) }),
        },
        async (_ctx, { templateId }) => api.post("/templates/use", { templateId }),
      ),
    }),
    projects: router({
      list: query({ description: "List the projects that organise apps.", input: object({}) }, async () => api.get("/projects")),
    }),
    reference: router({
      listLanguages: query(
        { description: "List the languages accepted in a job's config.language.", input: object({}) },
        async () => api.get("/reference/languages"),
      ),
      listCountries: query(
        { description: "List the countries accepted in a job's config.country.", input: object({}) },
        async () => api.get("/reference/countries"),
      ),
    }),
    webhooks: router({
      list: query({ description: "List the webhooks configured on the account.", input: object({}) }, async () => api.get("/webhooks")),
      create: mutation(
        {
          description:
            "Register a webhook. A job webhook fires once when a whole job finishes; a row webhook fires per finished row. Restrict it to apps with restrictedAppIds, or leave empty for all apps.",
          input: object({
            endpointUrl: string({ minLength: 1 }),
            webhookName: string({ minLength: 1 }),
            webhookType: string({ minLength: 1 }),
            restrictedAppIds: array(string()).optional(),
            webhookReference: string().optional(),
          }),
        },
        async (_ctx, input) => api.post("/webhooks", input),
      ),
      delete: mutation(
        { description: "Delete a webhook by id.", input: object({ webhookId: string({ minLength: 1 }) }) },
        async (_ctx, { webhookId }) => api.del("/webhooks", { webhookId }),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { promptmate: promptmate.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.promptmate ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Promptmate.io",
        description: "Run Promptmate.io AI apps and templates as jobs, fetch results, and manage webhooks.",
        icons,
      },
    ),
  }),
);
