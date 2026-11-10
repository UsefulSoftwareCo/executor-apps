import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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

const base = "https://cronly.app/api";

const cronly = defineProvider({
  name: "Cronly",
  hosts: ["cronly.app"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /companies is read-only and returns the account's company.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/companies`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const company = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: String(company.id), displayName: company.name } };
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params?: Record<string, string | number | undefined>, body?: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined) search.set(key, String(value));
    const query = search.toString();
    const response = await fetcher(`${base}${path}${query ? `?${query}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Cronly ${method} ${path} failed (${response.status})`);
    }
    // DELETE (and some 204s) may carry no body; success is the 2xx status.
    const text = (await response.text()).trim();
    if (text === "") return { ok: true };
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Cronly ${method} ${path} returned a non-JSON body`);
    }
    // Cronly documents failures as status "error" with a "reason", and some endpoints return {"error": ...}.
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const body = parsed as Record<string, unknown>;
      if (body.status === "error" || (typeof body.error === "string" && body.error !== "")) {
        throw new Error(`Cronly error: ${String(body.reason ?? body.error ?? "unknown")}`);
      }
    }
    return parsed;
  };
}

type Call = ReturnType<typeof client>;

const noInput = object({});
const idInput = object({ id: number() });
const page = { page: number().optional(), perPage: number().optional() };
const clean = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));

function build(call: Call) {
  return router({
    company: query(
      { description: "Get the account's company details (name, timezone, billing summary).", input: noInput },
      async () => call("GET", "/companies"),
    ),
    notifications: query(
      {
        description: "List notifications (paginated). page defaults to 1, perPage to 10.",
        input: object(page),
      },
      async (_ctx, { page, perPage }) => call("GET", "/notifications", { page, per_page: perPage }),
    ),
    monitors: router(
      {
        list: query({ description: "List all cron job monitors.", input: noInput }, async () => call("GET", "/monitors")),
        get: query({ description: "Get one cron job monitor by id.", input: idInput }, async (_ctx, { id }) =>
          call("GET", `/monitors/${id}`),
        ),
        create: mutation(
          {
            description:
              "Create a cron job monitor. The Cronly docs give no field descriptions; per their example, schedule is a cron expression (for example '*/5 * * * *'), timezone a zone name (for example 'UTC') and duration a number (unit not documented). The response includes the pulse token: ping https://cronly.app/api/monitors/pulse/{token} from the job.",
            input: object({
              name: string({ minLength: 1 }),
              timezone: string({ minLength: 1 }),
              schedule: string({ minLength: 1 }),
              duration: number(),
              projectId: number().optional(),
            }),
          },
          async (_ctx, { projectId, ...rest }) => call("POST", "/monitors", undefined, clean({ ...rest, project_id: projectId })),
        ),
        delete: mutation({ description: "Delete a cron job monitor by id.", input: idInput }, async (_ctx, { id }) =>
          call("DELETE", `/monitors/${id}`),
        ),
      },
      { title: "Job monitors", description: "Monitor that cron jobs run on time." },
    ),
    projects: router(
      {
        list: query({ description: "List all projects.", input: noInput }, async () => call("GET", "/projects")),
        get: query({ description: "Get one project by id.", input: idInput }, async (_ctx, { id }) =>
          call("GET", `/projects/${id}`),
        ),
        create: mutation(
          { description: "Create a project used to group monitors.", input: object({ name: string({ minLength: 1 }) }) },
          async (_ctx, { name }) => call("POST", "/projects", undefined, { name }),
        ),
        delete: mutation({ description: "Delete a project by id.", input: idInput }, async (_ctx, { id }) =>
          call("DELETE", `/projects/${id}`),
        ),
      },
      { title: "Projects", description: "Group monitors into projects." },
    ),
    certificates: router(
      {
        list: query({ description: "List all SSL certificate monitors.", input: noInput }, async () =>
          call("GET", "/certificates"),
        ),
        get: query({ description: "Get one SSL certificate monitor by id.", input: idInput }, async (_ctx, { id }) =>
          call("GET", `/certificates/${id}`),
        ),
        create: mutation(
          {
            description: "Create an SSL certificate monitor for a hostname. port defaults to 443.",
            input: object({ hostname: string({ minLength: 1 }), port: number().optional(), projectId: number().optional() }),
          },
          async (_ctx, { hostname, port, projectId }) =>
            call("POST", "/certificates", undefined, clean({ hostname, port, project_id: projectId })),
        ),
        delete: mutation({ description: "Delete an SSL certificate monitor by id.", input: idInput }, async (_ctx, { id }) =>
          call("DELETE", `/certificates/${id}`),
        ),
      },
      { title: "SSL certificates", description: "Monitor TLS certificate expiry." },
    ),
    users: router(
      {
        list: query({ description: "List users in the organization.", input: noInput }, async () => call("GET", "/users")),
        get: query({ description: "Get one user by id.", input: idInput }, async (_ctx, { id }) => call("GET", `/users/${id}`)),
      },
      { title: "Users", description: "Users in the organization." },
    ),
    servers: router(
      {
        list: query({ description: "List all servers.", input: noInput }, async () => call("GET", "/servers")),
        get: query({ description: "Get one server by id.", input: idInput }, async (_ctx, { id }) =>
          call("GET", `/servers/${id}`),
        ),
        create: mutation(
          {
            description: "Register a server for crontab back-ups. identifier is a server identifier string (the docs give no description; it is the value later used as serverId for back-ups).",
            input: object({ name: string({ minLength: 1 }), ipAddress: string({ minLength: 1 }), identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { name, ipAddress, identifier }) =>
            call("POST", "/servers", undefined, { name, ip_address: ipAddress, identifier }),
        ),
        delete: mutation({ description: "Delete a server by id.", input: idInput }, async (_ctx, { id }) =>
          call("DELETE", `/servers/${id}`),
        ),
        alert: mutation(
          {
            description: "Send an alert that a crontab on a server was altered.",
            input: object({ username: string({ minLength: 1 }), serverId: string({ minLength: 1 }), command: string({ minLength: 1 }) }),
          },
          async (_ctx, { username, serverId, command }) =>
            call("POST", "/servers/alert", undefined, { username, server_id: serverId, command }),
        ),
      },
      { title: "Servers", description: "Servers whose crontabs are backed up." },
    ),
    backups: router(
      {
        list: query({ description: "List all crontab back-ups.", input: noInput }, async () => call("GET", "/backups")),
        get: query(
          {
            description: "Get the crontab back-up for a user on a server (serverId is the server's identifier).",
            input: object({ serverId: string({ minLength: 1 }), username: string({ minLength: 1 }) }),
          },
          async (_ctx, { serverId, username }) =>
            call("GET", `/backups/${encodeURIComponent(serverId)}/${encodeURIComponent(username)}`),
        ),
        create: mutation(
          {
            description:
              "Create a crontab back-up, or a new snapshot if one exists for the username. Cronly requires the request to come from the IP address configured on the server, so this only works from that machine.",
            input: object({ username: string({ minLength: 1 }), serverId: string({ minLength: 1 }), fileContent: string().optional() }),
          },
          async (_ctx, { username, serverId, fileContent }) =>
            call("POST", "/backups", undefined, clean({ username, server_id: serverId, file_content: fileContent })),
        ),
        delete: mutation(
          {
            description: "Delete the crontab back-up for a user on a server.",
            input: object({ serverId: string({ minLength: 1 }), username: string({ minLength: 1 }) }),
          },
          async (_ctx, { serverId, username }) =>
            call("DELETE", `/backups/${encodeURIComponent(serverId)}/${encodeURIComponent(username)}`),
        ),
      },
      { title: "Back-ups", description: "Crontab back-ups per server user." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { cronly: cronly.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cronly ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cronly",
        description: "Monitor cron jobs, SSL certificates, servers and crontab back-ups with Cronly.",
        icons,
      },
    ),
  }),
);
