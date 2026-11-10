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

const base = "https://api.phantombuster.com/api/v2";

const phantombuster = defineProvider({
  name: "PhantomBuster",
  hosts: ["api.phantombuster.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/orgs/fetch`, {
      signal,
      headers: { "X-Phantombuster-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { "X-Phantombuster-Key": token };
  const url = (path: string, params: Params = {}) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    return target.toString();
  };
  return {
    getText: async (path: string, params: Params = {}) => {
      const response = await fetcher(url(path, params), { signal, headers });
      if (!response.ok) throw new Error(`PhantomBuster request failed: ${response.status} ${await response.text()}`);
      return { csv: await response.text() };
    },
    get: async (path: string, params: Params = {}) =>
      decodeJson(await fetcher(url(path, params), { signal, headers }), json()),
    post: async (path: string, body: Params = {}) =>
      decodeJson(
        await fetcher(url(path), {
          method: "POST",
          signal,
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(
            Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined)),
          ),
        }),
        json(),
      ),
  };
}

type Client = ReturnType<typeof client>;

const id = string({ minLength: 1 });
// Free-form per-script arguments: PhantomBuster accepts a JSON object or a JSON string.
const argument = json().optional();
const extra = record(json()).optional();

const tools = (c: Client) =>
  router({
    user: router(
      {
        me: query(
          { description: "The authenticated user: id, email, timezone, credits and plan.", input: object({}) },
          async () => c.get("/users/fetch-me"),
        ),
        update: mutation(
          {
            description: "Update the authenticated user's profile. Pass fields such as firstName, lastName or timezone in fields.",
            input: object({ fields: record(json()) }),
            approval: always(),
          },
          async (_ctx, { fields }) => c.post("/users/update-me", fields),
        ),
      },
      { title: "User" },
    ),
    org: router(
      {
        get: query(
          { description: "The current organization: name, plan, quotas and usage.", input: object({}) },
          async () => c.get("/orgs/fetch"),
        ),
        resources: query(
          { description: "Organization resources: execution time, emails, captcha, AI credits and storage, used and remaining.", input: object({}) },
          async () => c.get("/orgs/fetch-resources"),
        ),
        runningContainers: query(
          { description: "Containers (runs) currently executing in the organization.", input: object({}) },
          async () => c.get("/orgs/fetch-running-containers"),
        ),
        exportAgentUsage: query(
          { description: "Export per-agent usage as CSV for an optional agent id or date range. Returns { csv: string } (raw CSV text, not JSON).", input: object({ agentId: string().optional(), days: number().optional() }) },
          async (_ctx, input) => c.getText("/orgs/export-agent-usage", input),
        ),
        exportContainerUsage: query(
          { description: "Export per-run (container) usage as CSV for an optional agent id or date range. Returns { csv: string } (raw CSV text, not JSON).", input: object({ agentId: string().optional(), days: number().optional() }) },
          async (_ctx, input) => c.getText("/orgs/export-container-usage", input),
        ),
        agentGroups: query(
          { description: "Agent groups (folders) and their order in the organization.", input: object({}) },
          async () => c.get("/orgs/fetch-agent-groups"),
        ),
        saveAgentGroups: mutation(
          {
            description: "Replace the organization's agent groups. Pass the full groups array as returned by org.agentGroups.",
            input: object({ agentGroups: array(json()) }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/orgs/save-agent-groups", input),
        ),
      },
      { title: "Organization" },
    ),
    agents: router(
      {
        list: query(
          { description: "All agents (Phantoms) in the organization with status, script and schedule.", input: object({}) },
          async () => c.get("/agents/fetch-all"),
        ),
        get: query(
          { description: "One agent with its script, branch, environment, argument and last end type.", input: object({ id }) },
          async (_ctx, input) => c.get("/agents/fetch", input),
        ),
        listDeleted: query(
          { description: "Agents that were deleted from the organization.", input: object({}) },
          async () => c.get("/agents/fetch-deleted"),
        ),
        output: query(
          {
            description:
              "Console output and status of an agent's latest run. For incremental polling pass fromOutputPos, prevContainerId, prevStatus and prevRuntimeEventIndex from the previous response.",
            input: object({
              id,
              fromOutputPos: number().optional(),
              prevContainerId: string().optional(),
              prevStatus: string().optional(),
              prevRuntimeEventIndex: number().optional(),
            }),
          },
          async (_ctx, input) => c.get("/agents/fetch-output", input),
        ),
        save: mutation(
          {
            description:
              "Create an agent (omit id; set script, name, branch) or update one (pass id). Optional launchType is manually, repeatedly, once or after agent; also launchTimes, launchTimezone, cronString, fileMgmt, loadChrome. Anything else goes in extra.",
            input: object({
              id: string().optional(),
              name: string().optional(),
              script: string().optional(),
              branch: string().optional(),
              environment: string().optional(),
              argument,
              launchType: string().optional(),
              launchTimes: json().optional(),
              launchTimezone: string().optional(),
              cronString: string().optional(),
              fileMgmt: string().optional(),
              fileMgmtValue: number().optional(),
              loadChrome: boolean().optional(),
              extra,
            }),
            approval: always(),
          },
          async (_ctx, { extra: more, ...input }) => c.post("/agents/save", { ...more, ...input }),
        ),
        delete: mutation(
          { description: "Delete an agent.", input: object({ id }), approval: always() },
          async (_ctx, input) => c.post("/agents/delete", input),
        ),
        launch: mutation(
          {
            description:
              "Launch an agent now. argument is a JSON object or string for the script; bonusArgument is merged for this run only. Returns the containerId of the run; read it with containers.get or agents.output.",
            input: object({
              id,
              argument,
              bonusArgument: argument,
              saveArgument: boolean().optional(),
              manualLaunch: boolean().optional(),
              maxInstanceCount: number().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/agents/launch", input),
        ),
        launchSoon: mutation(
          {
            description: "Schedule an agent to launch within the next minutes. Pass secondsFromNow or the fields documented for launch-soon.",
            input: object({ id, secondsFromNow: number().optional(), argument, extra }),
            approval: always(),
          },
          async (_ctx, { extra: more, ...input }) => c.post("/agents/launch-soon", { ...more, ...input }),
        ),
        stop: mutation(
          {
            description: "Stop a running agent. softAbort asks it to finish gracefully; dontLaunchSoon cancels a pending launch-soon; switchToManualLaunch disables its schedule.",
            input: object({
              id,
              softAbort: boolean().optional(),
              cascadeToAllSlaves: boolean().optional(),
              dontLaunchSoon: boolean().optional(),
              switchToManualLaunch: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) => c.post("/agents/stop", input),
        ),
        unscheduleAll: mutation(
          { description: "Remove the schedule from every agent in the organization.", input: object({}), approval: always() },
          async () => c.post("/agents/unschedule-all"),
        ),
      },
      { title: "Agents", description: "Phantoms: configured, schedulable runs of a script." },
    ),
    containers: router(
      {
        list: query(
          { description: "Runs (containers) of an agent, newest first.", input: object({ agentId: id }) },
          async (_ctx, input) => c.get("/containers/fetch-all", input),
        ),
        get: query(
          { description: "One run (container) with its status, exit code, timings and output.", input: object({ id }) },
          async (_ctx, input) => c.get("/containers/fetch", input),
        ),
        output: query(
          {
            description: "Console output of a run. Pass fromOutputPos to read only what is new.",
            input: object({ id, fromOutputPos: number().optional(), withoutResultObject: boolean().optional() }),
          },
          async (_ctx, input) => c.get("/containers/fetch-output", input),
        ),
        resultObject: query(
          { description: "The result object a finished run produced.", input: object({ id }) },
          async (_ctx, input) => c.get("/containers/fetch-result-object", input),
        ),
      },
      { title: "Containers", description: "Individual runs of agents." },
    ),
    scripts: router(
      {
        list: query(
          { description: "Scripts visible to the organization.", input: object({}) },
          async () => c.get("/scripts/fetch-all"),
        ),
        get: query(
          { description: "One script's metadata. Pass id or name.", input: object({ id: string().optional(), name: string().optional() }) },
          async (_ctx, input) => c.get("/scripts/fetch", input),
        ),
        code: query(
          { description: "Source code of a script. Pass id or name.", input: object({ id: string().optional(), name: string().optional() }) },
          async (_ctx, input) => c.get("/scripts/code", input),
        ),
        save: mutation(
          {
            description: "Create or update a script from source code. Pass id to update; otherwise name and text create it.",
            input: object({ id: string().optional(), name: string().optional(), text: string().optional(), extra }),
            approval: always(),
          },
          async (_ctx, { extra: more, ...input }) => c.post("/scripts/save", { ...more, ...input }),
        ),
        delete: mutation(
          { description: "Delete a script.", input: object({ id }), approval: always() },
          async (_ctx, input) => c.post("/scripts/delete", input),
        ),
        setVisibility: mutation(
          { description: "Change a script's visibility (for example private, public or restricted).", input: object({ id, visibility: string() }), approval: always() },
          async (_ctx, input) => c.post("/scripts/visibility", input),
        ),
        setAccessList: mutation(
          { description: "Replace the list of organizations allowed to use a restricted script.", input: object({ id, accessList: array(json()) }), approval: always() },
          async (_ctx, input) => c.post("/scripts/access-list", input),
        ),
      },
      { title: "Scripts", description: "Phantom script source code." },
    ),
    branches: router(
      {
        list: query(
          { description: "Script branches of the organization.", input: object({}) },
          async () => c.get("/branches/fetch-all"),
        ),
        diff: query(
          { description: "Differences between a branch's staging and release versions.", input: object({ id: string().optional(), name: string().optional() }) },
          async (_ctx, input) => c.get("/branches/diff", input),
        ),
        create: mutation(
          { description: "Create a branch.", input: object({ name: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, input) => c.post("/branches/create", input),
        ),
        delete: mutation(
          { description: "Delete a branch.", input: object({ id }), approval: always() },
          async (_ctx, input) => c.post("/branches/delete", input),
        ),
        release: mutation(
          { description: "Release a branch's staging scripts to production.", input: object({ id, scriptIds: json().optional() }), approval: always() },
          async (_ctx, input) => c.post("/branches/release", input),
        ),
      },
      { title: "Branches" },
    ),
    lists: router(
      {
        list: query(
          { description: "Lead lists in organization storage.", input: object({}) },
          async () => c.get("/org-storage/lists/fetch-all"),
        ),
        get: query(
          { description: "One lead list.", input: object({ id }) },
          async (_ctx, input) => c.get("/org-storage/lists/fetch", input),
        ),
        save: mutation(
          { description: "Create a list (pass name) or rename one (pass id and name).", input: object({ id: string().optional(), name: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/lists/save", input),
        ),
        delete: mutation(
          { description: "Delete a list.", input: object({ id }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/lists/delete", input),
        ),
      },
      { title: "Lists" },
    ),
    leads: router(
      {
        byList: query(
          {
            description: "Leads of a list, paged. Pass the list id; use page, perPage, and sort options in extra.",
            input: object({ listId: id, extra }),
          },
          async (_ctx, { listId, extra: more }) =>
            c.post(`/org-storage/leads/by-list/${encodeURIComponent(listId)}`, { ...more }),
        ),
        save: mutation(
          { description: "Save one lead into a list. lead is the lead's fields (for example linkedinUrl, firstName, lastName).", input: object({ listId: id, lead: record(json()) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/leads/save", input),
        ),
        saveMany: mutation(
          { description: "Save many leads into a list.", input: object({ listId: id, leads: array(record(json())) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/leads/save-many", input),
        ),
        deleteMany: mutation(
          { description: "Delete leads by id.", input: object({ ids: array(string()) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/leads/delete-many", input),
        ),
      },
      { title: "Leads" },
    ),
    leadObjects: router(
      {
        search: query(
          { description: "Search lead objects in organization storage. Pass filters, pagination and sort in the body.", input: object({ body: record(json()).optional() }) },
          async (_ctx, { body }) => c.post("/org-storage/leads-objects/search", { ...body }),
        ),
        save: mutation(
          { description: "Save one lead object.", input: object({ leadObject: record(json()) }), approval: always() },
          async (_ctx, { leadObject }) => c.post("/org-storage/leads-objects/save", leadObject),
        ),
        saveMany: mutation(
          { description: "Save many lead objects.", input: object({ leadObjects: array(record(json())) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/leads-objects/save-many", input),
        ),
        delete: mutation(
          { description: "Delete lead objects by id.", input: object({ ids: array(string()) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/leads-objects/delete", input),
        ),
      },
      { title: "Lead objects" },
    ),
    companyObjects: router(
      {
        search: query(
          { description: "Search company objects in organization storage. Pass filters, pagination and sort in the body.", input: object({ body: record(json()).optional() }) },
          async (_ctx, { body }) => c.post("/org-storage/companies-objects/search", { ...body }),
        ),
        save: mutation(
          { description: "Save one company object.", input: object({ companyObject: record(json()) }), approval: always() },
          async (_ctx, { companyObject }) => c.post("/org-storage/companies-objects/save", companyObject),
        ),
        saveMany: mutation(
          { description: "Save many company objects.", input: object({ companyObjects: array(record(json())) }), approval: always() },
          async (_ctx, input) => c.post("/org-storage/companies-objects/save-many", input),
        ),
      },
      { title: "Company objects" },
    ),
    identities: router(
      {
        generateToken: mutation(
          { description: "Generate a token for connecting an identity (browser session) to PhantomBuster.", input: object({}), approval: always() },
          async () => c.post("/identities/generate-token"),
        ),
        saveEvent: mutation(
          { description: "Record an identity event, such as a connection or disconnection.", input: object({ event: record(json()) }), approval: always() },
          async (_ctx, { event }) => c.post("/identities/events/save", event),
        ),
      },
      { title: "Identities" },
    ),
    tools: router(
      {
        ipLocation: query(
          { description: "Geolocation of an IP address.", input: object({ ip: string({ minLength: 1 }) }) },
          async (_ctx, input) => c.get("/location/ip", input),
        ),
        solveHCaptcha: mutation(
          { description: "Solve an hCaptcha challenge (spends captcha credits). Pass the page url and sitekey.", input: object({ url: string({ minLength: 1 }), sitekey: string({ minLength: 1 }), extra }), approval: always() },
          async (_ctx, { extra: more, ...input }) => c.post("/hcaptcha", { ...more, ...input }),
        ),
        solveRecaptcha: mutation(
          { description: "Solve a reCAPTCHA challenge (spends captcha credits). Pass the page url and sitekey.", input: object({ url: string({ minLength: 1 }), sitekey: string({ minLength: 1 }), extra }), approval: always() },
          async (_ctx, { extra: more, ...input }) => c.post("/recaptcha", { ...more, ...input }),
        ),
        aiCompletion: mutation(
          { description: "Run an AI completion with PhantomBuster's AI credits. Pass the request body documented for /ai/completions, such as model and messages.", input: object({ body: record(json()) }), approval: always() },
          async (_ctx, { body }) => c.post("/ai/completions", body),
        ),
      },
      { title: "Utilities", description: "IP geolocation, captcha solving and AI completions." },
    ),
  });

export default defineApp(
  { user: { accounts: { phantombuster: phantombuster.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.phantombuster ?? [], (account) => tools(client(account.fields.token, fetch, signal)), {
        signal,
      }),
      {
        title: "PhantomBuster",
        description:
          "Run and manage PhantomBuster automation: agents (Phantoms), runs and their output, scripts, branches, lead lists and organization storage, usage, captcha solving and AI credits.",
        icons,
      },
    ),
  }),
);
