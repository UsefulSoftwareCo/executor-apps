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

const base = "https://api.hellotracks.com/api";

const hellotracks = defineProvider({
  name: "Hellotracks",
  hosts: ["api.hellotracks.com"],
  auth: {
    // Hellotracks has no OAuth: the API key from API & Integrations is the only method.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/getcompany`, {
      method: "POST",
      signal,
      headers: { "API-Key": account.fields.token, "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    const { status } = await decodeJson(response, object({ status: number() }));
    if (status !== 0) throw new Error(`Hellotracks rejected the API key (status ${status}).`);
    return {};
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function errorText(status: number): string {
  if (status === -3 || status === -8) return "authentication failed: check the API key";
  if (status === -5) return "permission denied";
  if (status === -9) return "rate limit exceeded";
  return `request failed, code ${status}`;
}

// Every endpoint is POST /api/<name> with the parameters wrapped in `data`; status 0 is success.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (endpoint: string, data: Params): Promise<unknown> => {
    const response = await fetcher(`${base}/${endpoint}`, {
      method: "POST",
      signal,
      headers: { "API-Key": token, "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const result = (await decodeJson(response, json())) as { status?: number; [key: string]: unknown };
    if (typeof result === "object" && result !== null && typeof result.status === "number" && result.status !== 0) {
      const code = errorText(result.status);
      throw new Error(`Hellotracks ${endpoint}: status ${result.status} (${code}). ${JSON.stringify(result)}`);
    }
    return result;
  };
}

type Call = ReturnType<typeof client>;

const data = record(json());
const optionalData = record(json()).optional();

function read(call: Call, endpoint: string, description: string, required = false) {
  return query(
    { description, input: object({ data: required ? data : optionalData }) },
    async (_ctx, input: { data?: Params }) => call(endpoint, input.data ?? {}),
  );
}

function write(call: Call, endpoint: string, description: string, required = true) {
  return mutation(
    { description, input: object({ data: required ? data : optionalData }) },
    async (_ctx, input: { data?: Params }) => call(endpoint, input.data ?? {}),
  );
}

function build(call: Call) {
  return router({
    company: router(
      {
        get: read(call, "getcompany", "Company settings and team configuration (teams_config maps team ids to names). data is empty."),
      },
      { title: "Company", description: "Organization-level settings." },
    ),
    jobs: router(
      {
        list: read(
          call,
          "getjobs",
          "List jobs. data: id, ids[], day (YYYYMMDD; 0 = undated, -1 = ignore), worker (username; \"\" unassigned, \"+\" any worker, \"*\" all), team, orderId, orderIds[], progressSuccess (1), progressActive (1), includeArchived (1), compact, sort { field, ascending, limit, skip, from, until, status }.",
        ),
        create: write(
          call,
          "createjobs",
          "Create jobs. data: jobs[] (job objects: title, address, location, day, worker, extended_data [{key,val}], ...), sendRouteChange, autoassign, isTemplate. See the Job API Object reference.",
        ),
        edit: write(
          call,
          "editjobs",
          "Update jobs. data: jobs (object keyed by job id holding the fields to change), notify (default true), sendRouteChange (default false).",
        ),
        archive: write(call, "archivejobs", "Archive jobs (restorable). data: { jobs: [jobId, ...] }."),
        restore: write(call, "restorejobs", "Restore archived jobs. data: { jobs: [jobId, ...] }."),
        delete: write(call, "deletejobs", "Permanently delete jobs; cannot be undone. data: { jobs: [jobId or tpl- template id, ...] }."),
        distribute: write(call, "distributejobs", "Cluster jobs into regions. data: jobs[] (ids), regions (count), max (per cluster, default 28), method (distance | zones | size). Returns clusters with centers and job ids."),
        autoassign: write(call, "autoassign", "Auto-assign jobs to workers. data: jobs[] (ids), workers[] (usernames), method (distance | zones | size), pickupCapacity, dropoffCapacity, day (YYYYMMDD)."),
        optimizeRoute: write(call, "routeoptimization", "Optimize a worker's route for a day. data: day (YYYYMMDD), account (worker username), solve (apply the result, default false), index, count, constraints."),
      },
      { title: "Jobs", description: "Dispatch, assign, optimize and archive jobs." },
    ),
    members: router(
      {
        list: read(call, "getaccounts", "List members (workers, dispatchers, admins). data: uids[] to restrict to specific members; omit for all."),
        create: write(call, "createaccount", "Create a member. data: name, username (required), password, role (default worker), phone, ..."),
        edit: write(call, "editaccount", "Update a member. data: uid or account (username) plus the fields to change."),
        delete: write(call, "deleteaccount", "Delete member(s). data: { uid } or { uids: [...] }."),
        locate: read(call, "locate", "Real-time location and status of members. data: accounts { <uid-or-username>: {} }, or teams [ids] (or true for everyone), withAddress, withDetails."),
        tracks: read(call, "gettracks", "Historical GPS tracks and mileage. data: from, until (ms timestamps, required), uids[], accounts[], withCourse.", true),
      },
      { title: "Members", description: "People in the organization, their live locations and GPS history." },
    ),
    places: router(
      {
        list: read(call, "getplaces", "List places (sites). data: query (text search), uids[], max (default 500)."),
        create: write(call, "createplace", "Create a place. data: name (required), location { lat, lng }, radius, address, city, postalcode, state, country_code, email, phone, color, teams[], extended_data [{key,val}]."),
        edit: write(call, "editplace", "Update a place. data: uid (or uids[]) plus the fields to change."),
      },
      { title: "Places", description: "Customer sites and geofenced locations." },
    ),
    reports: router(
      {
        create: write(call, "createreport", "Create a report. data: reporttype (required), format, day, from, until, accounts[] (required), columns [{key}]. See the Create Report reference."),
      },
      { title: "Reports", description: "Generate reports." },
    ),
    webhooks: router(
      {
        get: read(call, "getwebhooks", "Current webhook configuration. data is empty."),
        set: write(call, "setwebhooks", "Set webhooks. data keys: job_created, job_updated, job_completed, job_archived, job_deleted, job_checked, place_checked, clock_in_out, alert_triggered; each { url, header? }."),
      },
      { title: "Webhooks", description: "Callbacks for job, place, clock and alert events." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { hellotracks: hellotracks.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hellotracks ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Hellotracks",
        description:
          "Field workforce management: jobs, members, places, live locations, GPS tracks, route optimization, reports and webhooks. Every tool takes the endpoint's `data` object.",
        icons,
      },
    ),
  }),
);
