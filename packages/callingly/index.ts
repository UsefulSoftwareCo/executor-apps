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
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.callingly.com/v1";
const mcpUrl = "https://api.callingly.com/mcp";

const callingly = defineProvider({
  name: "Callingly",
  hosts: ["api.callingly.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server advertises OAuth with dynamic client registration (scope mcp:use).
    oauth: oauth2({ discover: "https://api.callingly.com" }),
  },
  // API keys: listing teams is read-only and available to every key. OAuth: initialize the MCP server.
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${base}/teams`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const callinglyTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" };
  type F = typeof fetch;
  const get = (f: F, path: string) => f(`${base}${path}`, { signal, headers }).then((r) => decodeJson(r, json()));
  const send = (f: F, method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) =>
    f(`${base}${path}`, {
      method,
      signal,
      headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then((r) => decodeJson(r, json()));

  const Id = object({ id: string() });

  return router({
    calls: router(
      {
        list: query(
          {
            description:
              "List calls. start and end are YYYY-MM-DD dates; team_id filters by team; limit and page paginate.",
            input: object({
              start: string().optional(),
              end: string().optional(),
              team_id: number().optional(),
              limit: number().optional(),
              page: number().optional(),
            }),
          },
          ({ fetch }, input) => get(fetch, `/calls${search(input)}`),
        ),
        get: query(
          {
            description:
              "Get one call with status, duration, recording URL, transcript, agent and lead details.",
            input: object({ call_id: string() }),
          },
          ({ fetch }, { call_id }) => get(fetch, `/calls/${encodeURIComponent(call_id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a lead and trigger an immediate call to it, routed to the team. phone_number is required; scheduled_at (YYYY-MM-DD HH:MM:SS) schedules the call instead. account_id lets agencies act for a client.",
            input: object({
              team_id: number(),
              phone_number: string(),
              first_name: string().optional(),
              last_name: string().optional(),
              email: string().optional(),
              company: string().optional(),
              category: string().optional(),
              source: string().optional(),
              crm_id: string().optional(),
              scheduled_at: string().optional(),
              account_id: number().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/calls", input),
        ),
      },
      { title: "Calls" },
    ),
    leads: router(
      {
        list: query(
          {
            description: "List leads, optionally between start and end dates (YYYY-MM-DD) or by phone_number.",
            input: object({
              start: string().optional(),
              end: string().optional(),
              phone_number: string().optional(),
            }),
          },
          ({ fetch }, input) => get(fetch, `/leads${search(input)}`),
        ),
        get: query(
          { description: "Get one lead by id.", input: Id },
          ({ fetch }, { id }) => get(fetch, `/leads/${encodeURIComponent(id)}`),
        ),
        update: mutation(
          {
            description:
              "Update a lead. Only the supplied fields change. status, result and stage are the lead's pipeline fields; is_stopped stops further calling and is_blocked blocks the lead (0 or 1).",
            input: object({
              id: string(),
              fname: string().optional(),
              lname: string().optional(),
              email: string().optional(),
              phone_number: string().optional(),
              source: string().optional(),
              company: string().optional(),
              status: string().optional(),
              result: string().optional(),
              stage: string().optional(),
              is_stopped: number().optional(),
              is_blocked: number().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "PUT", `/leads/${encodeURIComponent(input.id)}`, input),
        ),
        delete: mutation(
          { description: "Delete a lead permanently.", input: Id, approval: always() },
          ({ fetch }, { id }) => send(fetch, "DELETE", `/leads/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Leads" },
    ),
    sms: router(
      {
        send: mutation(
          {
            description:
              "Send an SMS to a lead from one of your SMS numbers. Numbers should be E.164. message supports placeholders such as {{lead.first_name}}.",
            input: object({ phone_number: string(), sms_number: string(), message: string() }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/sms", input),
        ),
      },
      { title: "SMS" },
    ),
    clients: router(
      {
        list: query(
          { description: "List client accounts (agency accounts only).", input: object({}) },
          ({ fetch }) => get(fetch, "/clients"),
        ),
        create: mutation(
          {
            description: "Create a client account under an agency.",
            input: object({
              fname: string(),
              lname: string(),
              company: string().optional(),
              email: string(),
              phone_number: string().optional(),
              password: string(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/clients", input),
        ),
        delete: mutation(
          { description: "Delete a client account.", input: Id, approval: always() },
          ({ fetch }, { id }) => send(fetch, "DELETE", `/clients/${encodeURIComponent(id)}`),
        ),
        setActive: mutation(
          {
            description: "Activate (is_active 1) or deactivate (0) a client account.",
            input: object({ id: string(), is_active: number() }),
            approval: always(),
          },
          ({ fetch }, { id, is_active }) =>
            send(fetch, "POST", `/clients/${encodeURIComponent(id)}/active`, { is_active }),
        ),
      },
      { title: "Clients" },
    ),
    teams: router(
      {
        list: query(
          { description: "List teams.", input: object({}) },
          ({ fetch }) => get(fetch, "/teams"),
        ),
        get: query(
          { description: "Get a team's full settings.", input: Id },
          ({ fetch }, { id }) => get(fetch, `/teams/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a team. call_mode is for example simultaneous. retry_schedule and lead_retry_schedule are arrays of delays in minutes.",
            input: object({
              name: string(),
              account_id: number().optional(),
              is_record: number().optional(),
              call_mode: string().optional(),
              whispertext: string().optional(),
              language: string().optional(),
              delay: number().optional(),
              is_retry: number().optional(),
              retries: number().optional(),
              retry_schedule: array(number()).optional(),
              is_reschedule: number().optional(),
              is_retry_lead: number().optional(),
              lead_retries: number().optional(),
              lead_retry_schedule: array(number()).optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/teams", input),
        ),
        update: mutation(
          {
            description:
              "Update a team. The vendor does not document the PUT /teams/{id} body, so settings is a free-form object; send only fields you got from teams.get.",
            input: object({ id: string(), settings: json() }),
            approval: always(),
          },
          ({ fetch }, { id, settings }) => send(fetch, "PUT", `/teams/${encodeURIComponent(id)}`, settings),
        ),
        listAgents: query(
          { description: "List the agents on a team with priority and cap.", input: Id },
          ({ fetch }, { id }) => get(fetch, `/teams/${encodeURIComponent(id)}/agents`),
        ),
        setAgents: mutation(
          {
            description: "Replace the set of agents on a team with the given agent ids.",
            input: object({ id: string(), agents: array(string()) }),
            approval: always(),
          },
          ({ fetch }, { id, agents }) => send(fetch, "PUT", `/teams/${encodeURIComponent(id)}/agents`, { agents }),
        ),
        updateAgent: mutation(
          {
            description: "Set an agent's priority and daily cap within a team.",
            input: object({ id: string(), agent_id: string(), priority: number().optional(), cap: number().optional() }),
            approval: always(),
          },
          ({ fetch }, { id, agent_id, ...body }) =>
            send(fetch, "PUT", `/teams/${encodeURIComponent(id)}/agents/${encodeURIComponent(agent_id)}`, body),
        ),
        removeAgent: mutation(
          {
            description: "Remove an agent from a team.",
            input: object({ id: string(), agent_id: string() }),
            approval: always(),
          },
          ({ fetch }, { id, agent_id }) =>
            send(fetch, "DELETE", `/teams/${encodeURIComponent(id)}/agents/${encodeURIComponent(agent_id)}`),
        ),
      },
      { title: "Teams" },
    ),
    agents: router(
      {
        list: query(
          {
            description: "List agents (users) with availability and do-not-disturb state.",
            input: object({ account_id: number().optional() }),
          },
          ({ fetch }, input) => get(fetch, `/agents${search(input)}`),
        ),
        getSchedule: query(
          { description: "Get an agent's weekly availability schedule.", input: Id },
          ({ fetch }, { id }) => get(fetch, `/agents/${encodeURIComponent(id)}/schedule`),
        ),
        create: mutation(
          {
            description: "Create an agent.",
            input: object({
              fname: string(),
              lname: string().optional(),
              phone_number: string(),
              ext: string().optional(),
              timezone: string().optional(),
              account_id: number().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/agents", input),
        ),
        update: mutation(
          {
            description:
              "Update an agent. donotdisturb is 0 or 1; donotdisturb_until is a datetime.",
            input: object({
              id: string(),
              fname: string().optional(),
              lname: string().optional(),
              phone_number: string().optional(),
              ext: string().optional(),
              timezone: string().optional(),
              donotdisturb: number().optional(),
              donotdisturb_until: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { id, ...body }) => send(fetch, "PUT", `/agents/${encodeURIComponent(id)}`, body),
        ),
        delete: mutation(
          { description: "Delete an agent.", input: Id, approval: always() },
          ({ fetch }, { id }) => send(fetch, "DELETE", `/agents/${encodeURIComponent(id)}`),
        ),
        setSchedule: mutation(
          {
            description:
              "Replace an agent's weekly schedule. schedule is the same 7-day array agents.getSchedule returns: {label, day (0-6), is_available, times: [{start, end}]}, where start may be \"allday\".",
            input: object({ id: string(), schedule: json() }),
            approval: always(),
          },
          ({ fetch }, { id, schedule }) => send(fetch, "PUT", `/agents/${encodeURIComponent(id)}/schedule`, schedule),
        ),
      },
      { title: "Agents" },
    ),
    webhooks: router(
      {
        list: query(
          { description: "List webhooks.", input: object({}) },
          ({ fetch }) => get(fetch, "/webhooks"),
        ),
        get: query(
          { description: "Get one webhook.", input: Id },
          ({ fetch }, { id }) => get(fetch, `/webhooks/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a webhook. event is call_completed, lead_created or lead_updated. call_direction (outbound/inbound), call_status (completed/missed/offline), call_lead_status (contacted/missed/removed/voicemail), team_id and number_id apply to call_completed only; field (lead_owner/result/stage/status/tags) and filter apply to lead events only.",
            input: object({
              name: string(),
              event: string(),
              target_url: string(),
              call_direction: string().optional(),
              call_status: string().optional(),
              call_lead_status: string().optional(),
              team_id: number().optional(),
              number_id: number().optional(),
              field: string().optional(),
              filter: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => send(fetch, "POST", "/webhooks", input),
        ),
        update: mutation(
          {
            description:
              "Update a webhook; the id goes in the path. Callingly's docs list only PUT /webhooks with no id (and mark name, event and target_url required); PUT /webhooks/{id} is inferred from the other by-id routes and unverified, so supply name, event and target_url to be safe.",
            input: object({
              id: string(),
              name: string().optional(),
              event: string().optional(),
              target_url: string().optional(),
              call_direction: string().optional(),
              call_status: string().optional(),
              call_lead_status: string().optional(),
              team_id: number().optional(),
              number_id: number().optional(),
              field: string().optional(),
              filter: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { id, ...body }) => send(fetch, "PUT", `/webhooks/${encodeURIComponent(id)}`, body),
        ),
        delete: mutation(
          { description: "Delete a webhook.", input: Id, approval: always() },
          ({ fetch }, { id }) => send(fetch, "DELETE", `/webhooks/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Webhooks" },
    ),
  });
};

export default defineApp({ user: { accounts: { callingly: callingly.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.callingly ?? [],
      async (account) => {
        const mcpHeaders = {
          Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
        };
        const mcp = withApprovals(await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders, signal }), (tool) =>
          toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
        );
        // The REST API is documented for API keys only.
        if (account.method === "oauth") return router({ mcp }, { title: "Callingly" });
        return router({ ...callinglyTools(account, signal), mcp }, { title: "Callingly" });
      },
      { signal },
    ),
    {
      title: "Callingly",
      description:
        "Lead response management: trigger calls to leads, manage leads, send SMS, and configure teams, agents, clients and webhooks. The mcp group adds AI calls, sequences, scheduled SMS and reports.",
      icons,
    },
  ),
}));
