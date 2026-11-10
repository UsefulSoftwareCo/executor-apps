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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.parsehub.com/api/v2";

const parsehub = defineProvider({
  name: "ParseHub",
  hosts: ["www.parsehub.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/projects?${search({ api_key: account.fields.token, limit: 1 })}`, {
      signal,
    });
    await decodeJson(response, object({ projects: json() }));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const parsehubTools = (account: Account, signal: AbortSignal) => {
  const key = account.fields.token;
  const form = { "content-type": "application/x-www-form-urlencoded" };
  return router({
    listProjects: query(
      {
        description:
          "List the projects in the account (token, title, templates_json, main_template, main_site, owner_email, last_run, last_ready_run). offset skips projects; limit is at most 20 (default 20). include_options=1 also returns each project's options.",
        input: object({ offset: number().optional(), limit: number().optional(), include_options: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/projects?${search({ api_key: key, ...input })}`, { signal }), json()),
    ),
    getProject: query(
      {
        description:
          "Get one project by its project token, including its last_run, last_ready_run and a run_list of recent runs. offset skips runs in run_list.",
        input: object({ projectToken: string(), offset: number().optional(), include_options: number().optional() }),
      },
      async ({ fetch }, { projectToken, ...input }) =>
        decodeJson(
          await fetch(`${base}/projects/${encodeURIComponent(projectToken)}?${search({ api_key: key, ...input })}`, {
            signal,
          }),
          json(),
        ),
    ),
    runProject: mutation(
      {
        description:
          "Start a run of a project and return the run object (run_token, status, data_ready). Optional start_url, start_template and start_value_override (a JSON string of global start values) override the project's defaults. send_email=1 emails the owner when the run finishes. Poll getRun until data_ready, then call getRunData.",
        input: object({
          projectToken: string(),
          start_url: string().optional(),
          start_template: string().optional(),
          start_value_override: string().optional(),
          send_email: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { projectToken, ...input }) =>
        decodeJson(
          await fetch(`${base}/projects/${encodeURIComponent(projectToken)}/run`, {
            method: "POST",
            signal,
            headers: form,
            body: search({ api_key: key, ...input }),
          }),
          json(),
        ),
    ),
    getLastReadyRunData: query(
      {
        description:
          "Get the data of the project's most recent completed run (one whose data_ready is true). format is json (default) or csv.",
        input: object({ projectToken: string(), format: string().optional() }),
      },
      async ({ fetch }, { projectToken, format }) => {
        const response = await fetch(
          `${base}/projects/${encodeURIComponent(projectToken)}/last_ready_run/data?${search({ api_key: key, format })}`,
          { signal },
        );
        return format === "csv" ? { csv: await response.text() } : decodeJson(response, json());
      },
    ),
    getRun: query(
      {
        description:
          "Get a run by run token: status (initialized, running, complete, cancelled, error), data_ready, start_time, end_time, pages, md5sum and the project's options. This endpoint is rate-limited, so poll sparingly.",
        input: object({ runToken: string() }),
      },
      async ({ fetch }, { runToken }) =>
        decodeJson(
          await fetch(`${base}/runs/${encodeURIComponent(runToken)}?${search({ api_key: key })}`, { signal }),
          json(),
        ),
    ),
    getRunData: query(
      {
        description:
          "Get the extracted data of a run by run token. format is json (default) or csv. Only available once data_ready is true.",
        input: object({ runToken: string(), format: string().optional() }),
      },
      async ({ fetch }, { runToken, format }) => {
        const response = await fetch(
          `${base}/runs/${encodeURIComponent(runToken)}/data?${search({ api_key: key, format })}`,
          { signal },
        );
        return format === "csv" ? { csv: await response.text() } : decodeJson(response, json());
      },
    ),
    cancelRun: mutation(
      {
        description: "Cancel a running run by run token. Data collected so far stays available.",
        input: object({ runToken: string() }),
        approval: always(),
      },
      async ({ fetch }, { runToken }) =>
        decodeJson(
          await fetch(`${base}/runs/${encodeURIComponent(runToken)}/cancel`, {
            method: "POST",
            signal,
            headers: form,
            body: search({ api_key: key }),
          }),
          json(),
        ),
    ),
    deleteRun: mutation(
      {
        description: "Permanently delete a run and its data by run token.",
        input: object({ runToken: string() }),
        approval: always(),
      },
      async ({ fetch }, { runToken }) =>
        decodeJson(
          await fetch(`${base}/runs/${encodeURIComponent(runToken)}?${search({ api_key: key })}`, {
            method: "DELETE",
            signal,
          }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { parsehub: parsehub.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.parsehub ?? [], (account) => parsehubTools(account, signal), { signal }), {
    title: "ParseHub",
    description: "Run ParseHub web scraping projects, check run status and fetch extracted data as JSON or CSV.",
    icons,
  }),
}));
