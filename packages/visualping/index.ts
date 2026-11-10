import {
  accountRouter,
  array,
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

const jobs = "https://job.api.visualping.io";
const account = "https://account.api.visualping.io";

const visualping = defineProvider({
  name: "Visualping",
  hosts: ["job.api.visualping.io", "account.api.visualping.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // describe-user needs no workspace and returns userId for every account type.
  async health({ account: acct, fetch, signal }) {
    const response = await fetch(`${account}/describe-user`, {
      signal,
      headers: { Authorization: `Bearer ${acct.fields.token}` },
    });
    await decodeJson(response, object({ userId: number() }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, url: string, search?: Params, body?: Params) => {
    const target = new URL(url);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) target.searchParams.append(key, String(item));
      else target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const workspaceId = number().optional();
const ids = array(number());

function build(call: Call) {
  return router({
    describeUser: query(
      {
        description:
          "Describe the authenticated user: profile, workspaces (with ids, roles and plan limits) and, for business accounts, the organisation. Call this first to find workspaceId and organisation id values.",
        input: object({}),
      },
      async () => call("GET", `${account}/describe-user`),
    ),
    jobs: router(
      {
        list: query(
          {
            description:
              "List monitors (jobs). workspaceId is required for business accounts. mode: counts_only, ids_and_wsIds, ids_only or normal. filters is an object of optional query filters: activeFilter (array of 0/1), modeFilter (VISUAL, WEB, TEXT), frequencyFilter, eventFilter (changed, changedImportant, errored, checked), dateFilter, dateFilterStart, fullTextSearchFilter, labelsFilter (label ids), sortBy (array, e.g. lastrun_desc, created_desc, alphabetical_asc).",
            input: object({
              workspaceId,
              mode: string().optional(),
              pageIndex: number().optional(),
              pageSize: number().optional(),
              filters: record(json()).optional(),
            }),
          },
          async (_ctx, input) =>
            call("GET", `${jobs}/v2/jobs`, {
              ...(input.filters ?? {}),
              workspaceId: input.workspaceId,
              mode: input.mode,
              pageIndex: input.pageIndex,
              pageSize: input.pageSize,
            }),
        ),
        get: query(
          {
            description: "Get one monitor's settings and its check history by job id. workspaceId is required for business accounts.",
            input: object({ jobId: number(), workspaceId }),
          },
          async (_ctx, input) => call("GET", `${jobs}/v2/jobs/${encodeURIComponent(String(input.jobId))}`, { workspaceId: input.workspaceId }),
        ),
        create: mutation(
          {
            description:
              "Create a monitor. body fields: url (required), workspaceId (business accounts), description, mode (VISUAL, WEB, TEXT or ALL), active, interval (minutes as a string, e.g. \"1440\", \"60\", \"15\"), trigger, xpath, crop {x,y,width,height}, keywords, keyword_action, disable_js, preactions {active, actions[]}, advanced_schedule {start_time, stop_time, active_days}, notification {enableEmailAlert, enableSmsAlert, onlyImportantAlerts, config{slack,teams,webhook,discord,...}}, alert_on_error ({threshold:N}, {never:true}, {change_baseline:true} or null), summalyzer {importantDefinitionType, importantDefinition}, labelIds.",
            input: object({ body: record(json()) }),
          },
          async (_ctx, input) => call("POST", `${jobs}/v2/jobs`, undefined, input.body),
        ),
        update: mutation(
          {
            description: "Update a monitor. body has the same shape as create; include only the fields to change. Business accounts include workspaceId in body.",
            input: object({ jobId: number(), body: record(json()) }),
          },
          async (_ctx, input) => call("PUT", `${jobs}/v2/jobs/${encodeURIComponent(String(input.jobId))}`, undefined, input.body),
        ),
        delete: mutation(
          {
            description: "Delete a monitor and its history. workspaceId is required for business accounts.",
            input: object({ jobId: number(), workspaceId }),
          },
          async (_ctx, input) => call("DELETE", `${jobs}/v2/jobs/${encodeURIComponent(String(input.jobId))}`, { workspaceId: input.workspaceId }),
        ),
        bulkCreate: mutation(
          {
            description: "Create many monitors in one call (business accounts). body: workspaceId, settings (shared job settings applied to every URL), jobs (array of { url, ...per-job overrides }) and optional initToBlank.",
            input: object({ body: record(json()) }),
          },
          async (_ctx, input) => call("PUT", `${jobs}/v2/jobs/bulk`, undefined, input.body),
        ),
        createFromPreset: mutation(
          {
            description: "Create a monitor from the organisation's saved settings (preset). Business accounts only. body: workspaceId, url and optional preset id and overrides.",
            input: object({ body: record(json()) }),
          },
          async (_ctx, input) => call("POST", `${jobs}/v2/jobs/from-saved-settings`, undefined, input.body),
        ),
        run: mutation(
          {
            description:
              "Run monitors now. Give jobId or jobIds; with neither, every job in the workspace runs. dryRun is required: true only reports credits needed, false really runs the checks and spends credits. restartSchedule resets the recurring schedule to start now.",
            input: object({
              jobId: number().optional(),
              jobIds: ids.optional(),
              workspaceId,
              restartSchedule: json().optional(),
              dryRun: json(),
            }),
          },
          async (_ctx, input) => call("POST", `${jobs}/v2/jobs/launch`, undefined, input),
        ),
        activityFeed: mutation(
          {
            description:
              "Read the reverse-chronological activity feed of checks across a workspace (changes, AI summaries, errors). Read-only despite using POST. scope.comboId must be the negative of workspaceId.",
            input: object({ workspaceId: number(), includeErrors: json().optional(), level: string().optional() }),
          },
          async (_ctx, input) =>
            call("POST", `${jobs}/v2/jobs/report-page`, undefined, {
              workspaceId: input.workspaceId,
              scope: { comboId: -input.workspaceId },
              ...(input.includeErrors === undefined ? {} : { includeErrors: input.includeErrors }),
              level: input.level ?? "allChecks",
            }),
        ),
      },
      { title: "Monitors", description: "Create, inspect, update, run and delete page monitors, and read their check history." },
    ),
    labels: router(
      {
        list: query(
          {
            description: "List labels of an organisation. sortBy: alphabetical_asc or alphabetical_desc. computeUsage 1 adds numOfJobsLabeled.",
            input: object({ organisationId: number(), sortBy: string().optional(), computeUsage: number().optional() }),
          },
          async (_ctx, input) => call("GET", `${jobs}/v2/jobs/labels`, { ...input }),
        ),
        create: mutation(
          {
            description: "Create labels. Each label: { id (a negative placeholder such as -1), name, color (hex such as \"#FFFAEB\"), emoji (optional shortcode) }.",
            input: object({ organisationId: number(), labels: array(record(json())) }),
          },
          async (_ctx, input) => call("POST", `${jobs}/v2/jobs/labels`, undefined, input),
        ),
        update: mutation(
          {
            description: "Update labels. Each label needs its real positive id plus name, color and optional emoji.",
            input: object({ organisationId: number(), labels: array(record(json())) }),
          },
          async (_ctx, input) => call("PUT", `${jobs}/v2/jobs/labels`, undefined, input),
        ),
        delete: mutation(
          {
            description: "Delete one label by id.",
            input: object({ organisationId: number(), id: number() }),
          },
          async (_ctx, input) => call("DELETE", `${jobs}/v2/jobs/labels`, undefined, input),
        ),
        assign: mutation(
          {
            description: "Add and/or remove labels on one or more monitors in a single call.",
            input: object({ organisationId: number(), jobIds: ids, addLabelIds: ids.optional(), removeLabelIds: ids.optional() }),
          },
          async (_ctx, input) => call("PUT", `${jobs}/v2/jobs/joblabels`, undefined, input),
        ),
      },
      { title: "Labels", description: "Organise monitors with labels (business accounts)." },
    ),
    presets: router(
      {
        list: query(
          {
            description: "List the organisation's saved job settings (presets). Business accounts only.",
            input: object({ organisationId: number() }),
          },
          async (_ctx, input) => call("GET", `${jobs}/v2/jobs/saved-job-settings`, { organisationId: input.organisationId }),
        ),
        create: mutation(
          {
            description: "Create a preset. body: { organisationId, settings: { name, settings: {job settings such as interval and notification}, defaultForWorkspaces?: [workspace ids] } }. There is no update endpoint: create a corrected preset and delete the old one.",
            input: object({ body: record(json()) }),
          },
          async (_ctx, input) => call("POST", `${jobs}/v2/jobs/saved-job-settings`, undefined, input.body),
        ),
        delete: mutation(
          {
            description: "Delete saved job settings by id. Jobs already created from the preset are unchanged.",
            input: object({ organisationId: number(), savedJobSettingsId: number() }),
          },
          async (_ctx, input) =>
            call("DELETE", `${jobs}/v2/jobs/saved-job-settings/${encodeURIComponent(String(input.savedJobSettingsId))}`, undefined, input),
        ),
        setDefault: mutation(
          {
            description: "Toggle whether a preset is the default for a workspace; setting one clears the workspace from other presets' defaults.",
            input: object({ organisationId: number(), workspaceId: number(), savedJobSettingsId: number() }),
          },
          async (_ctx, input) =>
            call("PUT", `${jobs}/v2/jobs/saved-job-settings/${encodeURIComponent(String(input.savedJobSettingsId))}/default`, undefined, input),
        ),
      },
      { title: "Presets", description: "Saved job settings reused when creating monitors (business accounts)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { visualping: visualping.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.visualping ?? [],
        (acct) =>
          withApprovals(build(client(acct.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Visualping",
        description: "Monitor web pages for visual, text and content changes: manage monitors, check history, labels and presets.",
        icons,
      },
    ),
  }),
);
