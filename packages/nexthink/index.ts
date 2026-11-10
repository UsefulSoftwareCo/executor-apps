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
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fetch = typeof fetch;
type Fields = { instance: string; region: string; clientId: string; clientSecret: string };
type Method = "GET" | "POST";
type Params = Record<string, unknown>;

const regions = ["us", "eu", "pac", "meta"];

function names(fields: Fields) {
  const instance = fields.instance.trim().toLowerCase();
  const region = fields.region.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(instance)) throw new Error("Enter your Nexthink instance name, for example acme.");
  if (!regions.includes(region)) throw new Error("The region must be one of us, eu, pac or meta.");
  return { instance, region };
}

// Every Nexthink instance has its own API and login hosts; credentials only ever go to these two.
function hosts(fields: Fields) {
  const { instance, region } = names(fields);
  return {
    api: `https://${instance}.api.${region}.nexthink.cloud`,
    token: `https://${instance}-login.${region}.nexthink.cloud/oauth2/default/v1/token`,
  };
}

async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(hosts(fields).token, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "service:integration" }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Tokens live 15 minutes; mint one lazily and renew it shortly before it expires.
function tokenSource(fields: Fields, fetcher: Fetch) {
  let cached: { token: string; expires: number } | undefined;
  return async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 900) - 60, 30) * 1000 };
    return t.access_token;
  };
}

const nexthink = defineProvider({
  name: "Nexthink",
  hosts: [
    "*.api.us.nexthink.cloud",
    "*.us.nexthink.cloud",
    "*.api.eu.nexthink.cloud",
    "*.eu.nexthink.cloud",
    "*.api.pac.nexthink.cloud",
    "*.pac.nexthink.cloud",
    "*.api.meta.nexthink.cloud",
    "*.meta.nexthink.cloud",
  ],
  auth: {
    // API credentials from Administration > Account Management > API credentials (OAuth client credentials).
    // The instance and region are part of both the token and API hosts, so `hosts` below uses one wildcard
    // label per region; the clientSecret reaches app code as a handle that Executor only substitutes on these.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // Minting a token proves the instance, region and credentials; no data is read.
  async health({ account, fetch, signal }) {
    await accessToken(account.fields, fetch, signal);
    const { instance, region } = names(account.fields);
    return { accountInfo: { externalId: `${instance}.${region}:${account.fields.clientId}`, displayName: `${instance} (${region})` } };
  },
});

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = hosts(fields).api;
  const token = tokenSource(fields, fetcher);
  const call = async (
    method: Method,
    path: string,
    options: { search?: Params; body?: unknown; headers?: Record<string, string> } = {},
  ) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.search ?? {})) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${await token(signal)}`,
      Accept: "application/json",
      ...options.headers,
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 204) return null;
    if (response.ok) {
      const text = await response.text();
      if (text === "") return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const stringMap = record(string());
const queryId = string({ minLength: 1 });

function build(c: Client) {
  return router({
    nql: router(
      {
        execute: query(
          {
            description:
              "Run a saved NQL query and return its rows (POST /api/v2/nql/execute). queryId is the ID of an NQL query saved with API access enabled, such as #my_query; parameters fills its placeholders. Set csv to true for CSV text instead of JSON, and utc to true for UTC timestamps. Large results should use nql.startExport.",
            input: object({
              queryId,
              parameters: stringMap.optional(),
              csv: plain(string()).optional(),
              utc: plain(string()).optional(),
            }),
          },
          async (_ctx, input) =>
            c.call("POST", "/api/v2/nql/execute", {
              body: { queryId: input.queryId, ...(input.parameters === undefined ? {} : { parameters: input.parameters }) },
              headers: {
                ...(input.csv === "true" ? { Accept: "text/csv" } : {}),
                ...(input.utc === "true" ? { "x-utc-times": "true" } : {}),
              },
            }),
        ),
        startExport: mutation(
          {
            description:
              "Start an export of a saved NQL query's results to S3 (POST /api/v1/nql/export) and return its exportId. Optional compression is NONE, GZIP or ZSTD. Poll nql.exportStatus with the exportId.",
            input: object({ queryId, parameters: stringMap.optional(), compression: string().optional() }),
          },
          async (_ctx, input) =>
            c.call("POST", "/api/v1/nql/export", {
              body: {
                queryId: input.queryId,
                ...(input.parameters === undefined ? {} : { parameters: input.parameters }),
                ...(input.compression === undefined ? {} : { compression: input.compression }),
              },
            }),
        ),
        exportStatus: query(
          {
            description:
              "Get the status of an NQL export (GET /api/v1/nql/status/{exportId}): SUBMITTED, IN_PROGRESS, ERROR or COMPLETED, with resultsFileUrl when complete. A 206 means results were cut at the license's maximum.",
            input: object({ exportId: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("GET", `/api/v1/nql/status/${encodeURIComponent(input.exportId)}`),
        ),
      },
      { title: "NQL", description: "Run saved Nexthink Query Language queries and export large result sets." },
    ),
    remoteActions: router(
      {
        list: query(
          {
            description: "List remote actions available to the API (GET /api/v1/act/remote-action), with targeting, script info, inputs and outputs.",
            input: object({}),
          },
          async () => c.call("GET", "/api/v1/act/remote-action"),
        ),
        get: query(
          {
            description: "Get one remote action by its NQL ID (GET /api/v1/act/remote-action/details).",
            input: object({ nqlId: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("GET", "/api/v1/act/remote-action/details", { search: { "nql-id": input.nqlId } }),
        ),
        execute: mutation(
          {
            description:
              "Run a remote action on devices (POST /api/v1/act/execute). remoteActionId is the action's NQL ID; devices are Collector IDs (1 to 10,000). Optional params (script parameters), expiresInMinutes (60 to 10080, how long an offline device is waited for) and triggerInfo { externalSource, reason (max 500 chars), externalReference }. Returns requestId for querying executions in NQL.",
            input: object({
              remoteActionId: string({ minLength: 1 }),
              devices: array(string({ minLength: 1 })),
              params: stringMap.optional(),
              expiresInMinutes: number().optional(),
              triggerInfo: record(json()).optional(),
            }),
          },
          async (_ctx, input) => c.call("POST", "/api/v1/act/execute", { body: input }),
        ),
      },
      { title: "Remote actions", description: "List and trigger Nexthink remote actions on devices." },
    ),
    workflows: router(
      {
        list: query(
          {
            description:
              "List workflows (GET /api/v1/workflows). dependency is USER, DEVICE, USER_AND_DEVICE or NONE; triggerMethod is API, MANUAL, MANUAL_MULTIPLE or SCHEDULER; fetchOnlyActiveWorkflows optionally limits to active ones.",
            input: object({
              dependency: string({ minLength: 1 }),
              triggerMethod: string({ minLength: 1 }),
              fetchOnlyActiveWorkflows: plain(string()).optional(),
            }),
          },
          async (_ctx, input) => c.call("GET", "/api/v1/workflows", { search: input }),
        ),
        get: query(
          {
            description: "Get a workflow by its NQL ID (GET /api/v1/workflows/details).",
            input: object({ nqlId: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("GET", "/api/v1/workflows/details", { search: { nqlId: input.nqlId } }),
        ),
        execute: mutation(
          {
            description:
              "Trigger a workflow (POST /api/v2/workflows/execute). workflowId is its NQL ID. devices are objects { name, uid, collectorUid } and users are objects { uid, upn, sid } (each up to 10,000; send an empty array for the kind the workflow does not use). params is an optional string map. Returns requestUuid and executionsUuids.",
            input: object({
              workflowId: string({ minLength: 1 }),
              devices: array(record(json())),
              users: array(record(json())),
              params: stringMap.optional(),
            }),
          },
          async (_ctx, input) => c.call("POST", "/api/v2/workflows/execute", { body: input }),
        ),
        executeV1: mutation(
          {
            description:
              "Trigger a workflow by identifiers (POST /api/v1/workflows/execute). devices are Collector ID UUID strings and users are SID strings (each up to 10,000; either list may be empty when the other is supplied). params is an optional string map.",
            input: object({
              workflowId: string({ minLength: 1 }),
              devices: array(string({ minLength: 1 })),
              users: array(string({ minLength: 1 })),
              params: stringMap.optional(),
            }),
          },
          async (_ctx, input) => c.call("POST", "/api/v1/workflows/execute", { body: input }),
        ),
        triggerWaitForEvent: mutation(
          {
            description:
              "Release a workflow execution that is waiting for an event (POST /api/v1/workflows/workflows/{workflowUuid}/execution/{executionUuid}/trigger). parameters is a map of non-empty strings.",
            input: object({
              workflowUuid: string({ minLength: 1 }),
              executionUuid: string({ minLength: 1 }),
              parameters: stringMap.optional(),
            }),
          },
          async (_ctx, input) =>
            c.call(
              "POST",
              `/api/v1/workflows/workflows/${encodeURIComponent(input.workflowUuid)}/execution/${encodeURIComponent(input.executionUuid)}/trigger`,
              { body: { parameters: input.parameters ?? {} } },
            ),
        ),
      },
      { title: "Workflows", description: "List and trigger Nexthink workflows." },
    ),
    campaigns: router(
      {
        trigger: mutation(
          {
            description:
              "Send a campaign to users (POST /api/v1/euf/campaign/trigger). campaignNqlId is the campaign's ID; userSid lists 1 to 10,000 user SIDs; expiresInMinutes is 1 to 525600 and is fixed at call time; parameters (max 30) keys must match the campaign's parameter IDs. Returns a requestId per user.",
            input: object({
              campaignNqlId: string({ minLength: 1 }),
              userSid: array(string({ minLength: 1 })),
              expiresInMinutes: number(),
              parameters: stringMap.optional(),
            }),
          },
          async (_ctx, input) => c.call("POST", "/api/v1/euf/campaign/trigger", { body: input }),
        ),
      },
      { title: "Campaigns", description: "Send Nexthink campaigns to users." },
    ),
    enrichment: router(
      {
        enrich: mutation(
          {
            description:
              "Write field values onto devices, users, binaries or packages (POST /api/v1/enrichment/data/fields). enrichments is 1 to 10,000 items { identification: [{ name, value }], fields: [{ name, value }] }. identification name is one of device/device/name, device/device/uid, user/user/sid, user/user/uid, user/user/upn, binary/binary/uid, package/package/uid. Field names include custom fields written #<custom_field_name> on device, user, binary or package. domain is a non-empty label used for tracking.",
            input: object({ enrichments: array(record(json())), domain: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => c.call("POST", "/api/v1/enrichment/data/fields", { body: input }),
        ),
      },
      { title: "Enrichment", description: "Enrich Nexthink objects with custom field values." },
    ),
    dataManagement: router(
      {
        scheduleDeviceDeletions: mutation(
          {
            description:
              "Schedule devices for deletion (POST /api/v1/data-management/device/deletions). devices is 1 to 100 items { uid (UUID), name }. Asynchronous: check each returned device status (SCHEDULED, INVALID or FAILED).",
            input: object({ devices: array(record(json())) }),
          },
          async (_ctx, input) => c.call("POST", "/api/v1/data-management/device/deletions", { body: input }),
        ),
      },
      { title: "Data management", description: "Schedule device deletions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { nexthink: nexthink.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nexthink ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Nexthink",
        description:
          "Run NQL queries and exports, trigger remote actions, workflows and campaigns, enrich objects and schedule device deletions in Nexthink.",
        instructions:
          "Queries, remote actions, workflows and campaigns are referenced by their NQL ID (starting with #); NQL queries must be saved with API access enabled. What a call may do depends on the permission scopes of the API credentials.",
        icons,
      },
    ),
  }),
);
