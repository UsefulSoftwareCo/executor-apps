import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.webvizio.com/api/mcp/v1";

const webvizio = defineProvider({
  name: "Webvizio",
  hosts: ["app.webvizio.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Read-only: the projects the key can see.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/projects`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

const Task = object({ uuid: string({ minLength: 1 }) });
const taskUuid = "uuid is the task's UUID: the id from get tasks, or the one in a https://app.webvizio.com/task/<uuid>/show link.";

function build(call: ReturnType<typeof client>) {
  const taskQuery = (suffix: string, description: string) =>
    query({ description: `${description} ${taskUuid}`, input: Task }, async (_ctx, { uuid }) =>
      call("GET", `/task/${encodeURIComponent(uuid)}${suffix}`),
    );
  return router({
    projects: router(
      {
        list: query(
          { description: "List the Webvizio projects the API key can access (uuid and name).", input: object({}) },
          async () => call("GET", "/projects"),
        ),
        current: query(
          { description: "Get the project currently selected for this API key.", input: object({}) },
          async () => call("GET", "/current-project"),
        ),
        select: mutation(
          {
            description:
              "Select the current project for this API key. Tasks are listed from the selected project, and the selection is stored by Webvizio for the key.",
            input: object({ uuid: string({ minLength: 1 }) }),
          },
          async (_ctx, { uuid }) => call("POST", "/set-project", { uuid }),
        ),
      },
      { title: "Projects", description: "List projects and choose the current one." },
    ),
    tasks: router(
      {
        list: query(
          {
            description:
              "List the open tasks assigned to the user in the current project (uuid, number, title, priority, createdAt, executeAt, tags). If no project is selected, select one with projects.select first.",
            input: object({}),
          },
          async () => call("GET", "/tasks"),
        ),
        description: taskQuery("", "Get a task, including its description."),
        prompt: taskQuery(
          "/prompt",
          "Get a ready-to-execute prompt for the task: its description plus the relevant technical context.",
        ),
        errorLogs: taskQuery("/error-logs", "Get the error logs captured with the task."),
        consoleLogs: taskQuery("/console-logs", "Get the browser console logs captured with the task."),
        networkLogs: taskQuery("/network-logs", "Get the network requests captured with the task."),
        actionLogs: taskQuery("/action-logs", "Get the action logs (reproduction steps) captured with the task."),
        screenshot: taskQuery(
          "/screenshot",
          "Get the task screenshot as a URL in the response's screenshot field. The lilac marker shows the element the task refers to.",
        ),
        close: mutation(
          {
            description: `Set the task to Done. Only after the user confirms the task is complete. ${taskUuid}`,
            input: Task,
          },
          async (_ctx, { uuid }) => call("POST", `/task/${encodeURIComponent(uuid)}/close`),
        ),
      },
      { title: "Tasks", description: "Feedback tasks captured in Webvizio, with their prompts and diagnostic logs." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { webvizio: webvizio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.webvizio ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Webvizio",
        description:
          "Visual website feedback and bug reports turned into developer tasks: projects, task prompts, screenshots and console, network, error and action logs.",
        icons,
      },
    ),
  }),
);
