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

const base = "https://botster.io/api/v2";

const botster = defineProvider({
  name: "Botster",
  hosts: ["botster.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /credits is read-only and needs a valid token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Query = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, options: { query?: Query; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return decodeJson(response, json());
  };
}

const slug = string({ minLength: 1 });
const id = string({ minLength: 1 });
const launchInput = object({
  bot: slug,
  input: json(),
  webhook: string().optional(),
  options: record(json()).optional(),
});

function launchBody({ input, webhook, options }: { input: unknown; webhook?: string; options?: Record<string, unknown> }) {
  return { ...options, input, ...(webhook === undefined ? {} : { webhook }) };
}

function build(call: ReturnType<typeof client>) {
  return router({
    getCredits: query(
      { description: "Get the account's remaining credit balance.", input: object({}) },
      async () => call("GET", "/credits"),
    ),
    bots: router(
      {
        list: query(
          {
            description: "List available bots, optionally filtered by a search term. Each bot has a slug used to launch it.",
            input: object({ search: string().optional(), page: number().optional(), per: number().optional() }),
          },
          async (_ctx, { search, page, per }) => call("GET", "/bots", { query: { search, page, per } }),
        ),
        calculate: query(
          {
            description:
              "Estimate the credit cost of launching a bot with the given input, without launching it. input is usually a string of URLs separated by newlines; bot-specific options go in options.",
            input: launchInput,
          },
          async (_ctx, { bot, ...rest }) =>
            call("POST", `/bots/${encodeURIComponent(bot)}/calculate`, { body: launchBody(rest) }),
        ),
        launch: mutation(
          {
            description:
              "Launch a bot, creating a job and spending credits. Returns the job id. input is usually a string of URLs separated by newlines; bot-specific options (for example max_pages) go in options; webhook is an optional URL that receives the results as a JSON POST on completion. Fetch the job to get its run ids, then fetch each run for the results.",
            input: launchInput,
          },
          async (_ctx, { bot, ...rest }) => call("POST", `/bots/${encodeURIComponent(bot)}`, { body: launchBody(rest) }),
        ),
      },
      { title: "Bots", description: "Browse and launch data-extraction bots." },
    ),
    jobs: router(
      {
        list: query(
          { description: "List jobs.", input: object({ page: number().optional(), per: number().optional() }) },
          async (_ctx, { page, per }) => call("GET", "/jobs", { query: { page, per } }),
        ),
        get: query(
          { description: "Get a job's status and its data runs, which lists its data run ids; pass those ids to runs.get.", input: object({ jobId: id }) },
          async (_ctx, { jobId }) => call("GET", `/jobs/${encodeURIComponent(jobId)}`),
        ),
        restart: mutation(
          { description: "Restart a job, spending credits again.", input: object({ jobId: id }) },
          async (_ctx, { jobId }) => call("POST", `/jobs/${encodeURIComponent(jobId)}/restart`),
        ),
        archive: mutation(
          { description: "Archive a job.", input: object({ jobId: id }) },
          async (_ctx, { jobId }) => call("POST", `/jobs/${encodeURIComponent(jobId)}/archive`),
        ),
        unarchive: mutation(
          { description: "Unarchive a job.", input: object({ jobId: id }) },
          async (_ctx, { jobId }) => call("POST", `/jobs/${encodeURIComponent(jobId)}/unarchive`),
        ),
        delete: mutation(
          { description: "Delete a job.", input: object({ jobId: id }) },
          async (_ctx, { jobId }) => call("DELETE", `/jobs/${encodeURIComponent(jobId)}`),
        ),
      },
      { title: "Jobs", description: "Track, restart, archive and delete bot jobs." },
    ),
    runs: router(
      {
        get: query(
          { description: "Get the JSON results of a data run.", input: object({ runId: id }) },
          async (_ctx, { runId }) => call("GET", `/runs/${encodeURIComponent(runId)}`),
        ),
        delete: mutation(
          { description: "Delete a data run.", input: object({ runId: id }) },
          async (_ctx, { runId }) => call("DELETE", `/runs/${encodeURIComponent(runId)}`),
        ),
      },
      { title: "Runs", description: "Fetch and delete the results of job runs." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { botster: botster.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.botster ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Botster",
        description: "Run Botster data-extraction bots, track jobs, fetch run results and check credits.",
        icons,
      },
    ),
  }),
);
