import {
  accountRouter,
  array,
  defineApp,
  defineProvider,
  decodeJson,
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

const base = "https://app.prompthub.us/api/v1";

const prompthub = defineProvider({
  name: "PromptHub",
  hosts: ["app.prompthub.us"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /me is the documented way to read the current team; it only proves the key is accepted.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const currentTeamId = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
): Promise<string> => {
  const me = await decodeJson(await fetch(`${base}/me`, { signal, headers: headers(account) }), json());
  const find = (value: unknown): unknown =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? ((value as Record<string, unknown>).current_team_id ?? find((value as Record<string, unknown>).data))
      : undefined;
  const id = find(me);
  if (typeof id === "number" || (typeof id === "string" && id !== "")) return String(id);
  throw new Error("PromptHub /me returned no current_team_id; pass teamId explicitly.");
};

const prompthubTools = (account: Account, signal: AbortSignal) =>
  router({
    getMe: query(
      {
        description:
          "Get the account behind the API key from PromptHub's /me endpoint. The response includes current_team_id, the team that listProjects uses when teamId is omitted.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/me`, { signal, headers: headers(account) }), json()),
    ),
    listProjects: query(
      {
        description:
          "List the projects (prompts and chats) of a PromptHub team with each project's head revision. teamId defaults to the account's current team (from /me). group, model and provider are optional filters; provider is a name such as OpenAI or Anthropic.",
        input: object({
          teamId: string().optional(),
          group: string().optional(),
          model: string().optional(),
          provider: string().optional(),
        }),
      },
      async ({ fetch }, { teamId, ...filters }) => {
        const team = teamId ?? (await currentTeamId(fetch, account, signal));
        return decodeJson(
          await fetch(`${base}/teams/${encodeURIComponent(team)}/projects${search(filters)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        );
      },
    ),
    getProjectHead: query(
      {
        description:
          "Get the latest commit of a PromptHub project on a branch (default master): prompt, system message, model configuration and a formatted_request ready to send to the model provider. variables fills placeholders by label; with fallback, unset placeholders use Project or Team defaults. Find the project id in the project URL or its API tab.",
        input: object({
          projectId: string(),
          branch: string().optional(),
          variables: record(string()).optional(),
          fallback: number().optional(),
        }),
      },
      async ({ fetch }, { projectId, branch, variables, fallback }) => {
        const params = new URLSearchParams();
        if (branch !== undefined) params.set("branch", branch);
        if (fallback !== undefined) params.set("fallback", String(fallback));
        for (const [label, value] of Object.entries(variables ?? {})) params.set(`variables[${label}]`, value);
        const text = params.toString();
        return decodeJson(
          await fetch(`${base}/projects/${encodeURIComponent(projectId)}/head${text === "" ? "" : `?${text}`}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        );
      },
    ),
    runProject: mutation(
      {
        description:
          "Run a PromptHub project through PromptHub: it sends the prompt (latest commit on a branch, default master, or a specific commit hash) to the configured model and returns the output text, token counts, cost and latency. The run is logged in the project's Logs tab and uses the team's model credits or keys. variables maps placeholder labels to values. For Chat projects, prompt is the next user message (required) and messages is optional prior history; metadata is optional tracking data.",
        input: object({
          projectId: string(),
          branch: string().optional(),
          hash: string().optional(),
          variables: record(string()).optional(),
          prompt: string().optional(),
          messages: array(object({ role: string(), content: string() })).optional(),
          metadata: record(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { projectId, branch, hash, variables, prompt, messages, metadata }) =>
        decodeJson(
          await fetch(`${base}/projects/${encodeURIComponent(projectId)}/run${search({ branch, hash })}`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify({ variables: variables ?? {}, prompt, messages, metadata }),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { prompthub: prompthub.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.prompthub ?? [], (account) => prompthubTools(account, signal), { signal }), {
    title: "PromptHub",
    description: "Look up the current team, list PromptHub projects, fetch a project's head commit and run versioned prompts.",
    icons,
  }),
}));
