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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.anthropic.com";

const anthropic = defineProvider({
  name: "Anthropic Administrator",
  hosts: ["api.anthropic.com"],
  auth: {
    apiKey: secrets({
      label: "Admin API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/organizations/me`, { signal, headers: headers(account.fields.token) });
    const org = await decodeJson(response, object({ id: string(), name: string() }));
    return { accountInfo: { externalId: org.id, displayName: org.name } };
  },
});

function headers(token: string): Record<string, string> {
  return { "x-api-key": token, "anthropic-version": "2023-06-01", "content-type": "application/json" };
}

type Query = Record<string, string | number | boolean | readonly string[] | undefined>;

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "DELETE", path: string, options: { query?: Query; body?: Record<string, unknown> } = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) params.append(`${key}[]`, item);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    const body = options.body
      ? JSON.stringify(Object.fromEntries(Object.entries(options.body).filter(([, v]) => v !== undefined)))
      : undefined;
    const response = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, { method, signal, headers: headers(token), body });
    return decodeJson(response, json());
  };
}

const page = {
  limit: number().optional(),
  after_id: string().optional(),
  before_id: string().optional(),
};

function build(call: ReturnType<typeof client>) {
  const pageQuery = (i: { limit?: number; after_id?: string; before_id?: string }) => ({
    limit: i.limit,
    after_id: i.after_id,
    before_id: i.before_id,
  });
  const report = {
    starting_at: string({ minLength: 1 }),
    ending_at: string().optional(),
    limit: number().optional(),
    page: string().optional(),
  };

  return router({
    organization: query(
      { description: "Get the organization this key belongs to: id and name.", input: object({}) },
      async () => call("GET", "/v1/organizations/me"),
    ),
    users: router(
      {
        list: query(
          {
            description: "List organization members. Filter by exact email. Paginate with after_id/before_id.",
            input: object({ ...page, email: string().optional() }),
          },
          async (_ctx, i) => call("GET", "/v1/organizations/users", { query: { ...pageQuery(i), email: i.email } }),
        ),
        get: query(
          { description: "Get an organization member by user id.", input: object({ user_id: string({ minLength: 1 }) }) },
          async (_ctx, { user_id }) => call("GET", `/v1/organizations/users/${encodeURIComponent(user_id)}`),
        ),
        update: mutation(
          {
            description: "Change a member's organization role: user, developer, billing or claude_code_user (Enterprise organizations accept user and managed). The admin role cannot be assigned through the API; set it in the Claude Console.",
            input: object({ user_id: string({ minLength: 1 }), role: string({ minLength: 1 }) }),
          },
          async (_ctx, { user_id, role }) =>
            call("POST", `/v1/organizations/users/${encodeURIComponent(user_id)}`, { body: { role } }),
        ),
        remove: mutation(
          { description: "Remove a member from the organization.", input: object({ user_id: string({ minLength: 1 }) }) },
          async (_ctx, { user_id }) => call("DELETE", `/v1/organizations/users/${encodeURIComponent(user_id)}`),
        ),
      },
      { title: "Members", description: "Organization members and their roles." },
    ),
    invites: router(
      {
        list: query(
          { description: "List organization invites.", input: object(page) },
          async (_ctx, i) => call("GET", "/v1/organizations/invites", { query: pageQuery(i) }),
        ),
        get: query(
          { description: "Get an invite by id.", input: object({ invite_id: string({ minLength: 1 }) }) },
          async (_ctx, { invite_id }) => call("GET", `/v1/organizations/invites/${encodeURIComponent(invite_id)}`),
        ),
        create: mutation(
          {
            description: "Invite someone by email with an organization role: user, developer, billing or claude_code_user.",
            input: object({ email: string({ minLength: 3 }), role: string({ minLength: 1 }) }),
          },
          async (_ctx, { email, role }) => call("POST", "/v1/organizations/invites", { body: { email, role } }),
        ),
        delete: mutation(
          { description: "Delete a pending invite.", input: object({ invite_id: string({ minLength: 1 }) }) },
          async (_ctx, { invite_id }) => call("DELETE", `/v1/organizations/invites/${encodeURIComponent(invite_id)}`),
        ),
      },
      { title: "Invites", description: "Pending organization invitations." },
    ),
    workspaces: router(
      {
        list: query(
          {
            description: "List workspaces. Archived workspaces are excluded unless include_archived is true.",
            input: object({ ...page, include_archived: boolean().optional() }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/organizations/workspaces", { query: { ...pageQuery(i), include_archived: i.include_archived } }),
        ),
        get: query(
          { description: "Get a workspace by id.", input: object({ workspace_id: string({ minLength: 1 }) }) },
          async (_ctx, { workspace_id }) => call("GET", `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}`),
        ),
        create: mutation(
          {
            description: "Create a workspace. data_residency is optional and cannot be changed later.",
            input: object({ name: string({ minLength: 1 }), data_residency: json().optional() }),
          },
          async (_ctx, { name, data_residency }) =>
            call("POST", "/v1/organizations/workspaces", { body: { name, data_residency } }),
        ),
        update: mutation(
          {
            description: "Rename a workspace.",
            input: object({ workspace_id: string({ minLength: 1 }), name: string({ minLength: 1 }) }),
          },
          async (_ctx, { workspace_id, name }) =>
            call("POST", `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}`, { body: { name } }),
        ),
        archive: mutation(
          {
            description: "Archive a workspace. Its API keys stop working and archiving cannot be undone.",
            input: object({ workspace_id: string({ minLength: 1 }) }),
          },
          async (_ctx, { workspace_id }) =>
            call("POST", `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/archive`),
        ),
        members: router(
          {
            list: query(
              {
                description: "List the members of a workspace.",
                input: object({ workspace_id: string({ minLength: 1 }), ...page }),
              },
              async (_ctx, i) =>
                call("GET", `/v1/organizations/workspaces/${encodeURIComponent(i.workspace_id)}/members`, {
                  query: pageQuery(i),
                }),
            ),
            get: query(
              {
                description: "Get one member of a workspace.",
                input: object({ workspace_id: string({ minLength: 1 }), user_id: string({ minLength: 1 }) }),
              },
              async (_ctx, { workspace_id, user_id }) =>
                call(
                  "GET",
                  `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/members/${encodeURIComponent(user_id)}`,
                ),
            ),
            add: mutation(
              {
                description:
                  "Add an organization member to a workspace with workspace_admin, workspace_developer, workspace_restricted_developer or workspace_user. workspace_billing cannot be assigned here; it is inherited from the organization billing role.",
                input: object({
                  workspace_id: string({ minLength: 1 }),
                  user_id: string({ minLength: 1 }),
                  workspace_role: string({ minLength: 1 }),
                }),
              },
              async (_ctx, { workspace_id, user_id, workspace_role }) =>
                call("POST", `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/members`, {
                  body: { user_id, workspace_role },
                }),
            ),
            update: mutation(
              {
                description: "Change a workspace member's workspace role: workspace_admin, workspace_developer, workspace_restricted_developer, workspace_user or workspace_billing (the update reference lists all five).",
                input: object({
                  workspace_id: string({ minLength: 1 }),
                  user_id: string({ minLength: 1 }),
                  workspace_role: string({ minLength: 1 }),
                }),
              },
              async (_ctx, { workspace_id, user_id, workspace_role }) =>
                call(
                  "POST",
                  `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/members/${encodeURIComponent(user_id)}`,
                  { body: { workspace_role } },
                ),
            ),
            remove: mutation(
              {
                description: "Remove a member from a workspace.",
                input: object({ workspace_id: string({ minLength: 1 }), user_id: string({ minLength: 1 }) }),
              },
              async (_ctx, { workspace_id, user_id }) =>
                call(
                  "DELETE",
                  `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/members/${encodeURIComponent(user_id)}`,
                ),
            ),
          },
          { title: "Workspace members", description: "Who can use a workspace and with what role." },
        ),
        rateLimits: query(
          {
            description: "Read the rate limit overrides of a workspace. Set include_inherited to also see inherited values.",
            input: object({ workspace_id: string({ minLength: 1 }), include_inherited: boolean().optional() }),
          },
          async (_ctx, { workspace_id, include_inherited }) =>
            call("GET", `/v1/organizations/workspaces/${encodeURIComponent(workspace_id)}/rate_limits`, {
              query: { include_inherited },
            }),
        ),
      },
      { title: "Workspaces", description: "Workspaces, their members and rate limits." },
    ),
    apiKeys: router(
      {
        list: query(
          {
            description: "List API keys. Filter by status (active, inactive, archived), workspace or creating user.",
            input: object({
              ...page,
              status: string().optional(),
              workspace_id: string().optional(),
              created_by_user_id: string().optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/organizations/api_keys", {
              query: {
                ...pageQuery(i),
                status: i.status,
                workspace_id: i.workspace_id,
                created_by_user_id: i.created_by_user_id,
              },
            }),
        ),
        get: query(
          { description: "Get an API key's metadata by id.", input: object({ api_key_id: string({ minLength: 1 }) }) },
          async (_ctx, { api_key_id }) => call("GET", `/v1/organizations/api_keys/${encodeURIComponent(api_key_id)}`),
        ),
        update: mutation(
          {
            description: "Rename an API key or set its status to active, inactive or archived.",
            input: object({ api_key_id: string({ minLength: 1 }), name: string().optional(), status: string().optional() }),
          },
          async (_ctx, { api_key_id, name, status }) =>
            call("POST", `/v1/organizations/api_keys/${encodeURIComponent(api_key_id)}`, { body: { name, status } }),
        ),
      },
      { title: "API keys", description: "Audit and disable API keys. Keys can be created only in the Console." },
    ),
    reports: router(
      {
        usage: query(
          {
            description:
              "Token usage buckets from the Usage API. starting_at and ending_at are RFC 3339 timestamps; bucket_width is 1m, 1h or 1d. group_by accepts model, workspace_id, api_key_id, service_tier, inference_geo and speed. Paginate with page from next_page.",
            input: object({
              ...report,
              bucket_width: string().optional(),
              group_by: array(string()).optional(),
              models: array(string()).optional(),
              api_key_ids: array(string()).optional(),
              workspace_ids: array(string()).optional(),
              service_tiers: array(string()).optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/organizations/usage_report/messages", {
              query: {
                starting_at: i.starting_at,
                ending_at: i.ending_at,
                bucket_width: i.bucket_width,
                group_by: i.group_by,
                models: i.models,
                api_key_ids: i.api_key_ids,
                workspace_ids: i.workspace_ids,
                service_tiers: i.service_tiers,
                limit: i.limit,
                page: i.page,
              },
            }),
        ),
        cost: query(
          {
            description:
              "Daily cost in USD from the Cost API. starting_at and ending_at are RFC 3339 timestamps. group_by accepts workspace_id and description. Paginate with page from next_page.",
            input: object({ ...report, group_by: array(string()).optional() }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/organizations/cost_report", {
              query: {
                starting_at: i.starting_at,
                ending_at: i.ending_at,
                bucket_width: "1d",
                group_by: i.group_by,
                limit: i.limit,
                page: i.page,
              },
            }),
        ),
        claudeCode: query(
          {
            description:
              "Claude Code analytics for one day: per-user sessions, lines of code, commits, pull requests, tool acceptance and estimated cost. starting_at is YYYY-MM-DD (UTC).",
            input: object({ starting_at: string({ minLength: 10 }), limit: number().optional(), page: string().optional() }),
          },
          async (_ctx, i) =>
            call("GET", "/v1/organizations/usage_report/claude_code", {
              query: { starting_at: i.starting_at, limit: i.limit, page: i.page },
            }),
        ),
      },
      { title: "Reports", description: "Usage, cost and Claude Code analytics." },
    ),
    rateLimits: query(
      {
        description: "Read the organization's rate limits for the Messages API. Optionally filter by model or group_type.",
        input: object({ model: string().optional(), group_type: string().optional(), limit: number().optional(), page: string().optional() }),
      },
      async (_ctx, i) =>
        call("GET", "/v1/organizations/rate_limits", {
          query: { model: i.model, group_type: i.group_type, limit: i.limit, page: i.page },
        }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { anthropic: anthropic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anthropic ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Anthropic Administrator",
        description:
          "Manage an Anthropic organization: members, invites, workspaces, API keys, usage and cost reports, Claude Code analytics and rate limits.",
        icons,
      },
    ),
  }),
);
