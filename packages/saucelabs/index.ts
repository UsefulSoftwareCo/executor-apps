import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Each Sauce Labs data center has its own API host; credentials only go to these three.
const regions = ["us-west-1", "eu-central-1", "us-east-4"];

type Fields = { region: string; username: string; token: string };

function origin(account: { fields: Fields }) {
  const region = account.fields.region.trim().toLowerCase();
  if (!regions.includes(region)) throw new Error(`Region must be one of: ${regions.join(", ")}.`);
  return `https://api.${region}.saucelabs.com`;
}

const authorization = (account: { fields: Fields }) =>
  `Basic ${btoa(`${account.fields.username.trim()}:${account.fields.token}`)}`;

const saucelabs = defineProvider({
  name: "Sauce Labs",
  hosts: ["api.us-west-1.saucelabs.com", "api.eu-central-1.saucelabs.com", "api.us-east-4.saucelabs.com"],
  auth: {
    apiKey: secrets({
      label: "Username and access key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${origin(account)}/rest/v1.2/users/${encodeURIComponent(account.fields.username.trim())}/concurrency`,
      { signal, headers: { Authorization: authorization(account), Accept: "application/json" } },
    );
    await decodeJson(response, json());
    return {
      accountInfo: {
        externalId: account.fields.username.trim(),
        displayName: account.fields.username.trim(),
        username: account.fields.username.trim(),
      },
    };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, auth: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, options: { params?: Params; json?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: auth, Accept: "application/json" };
    let body: string | undefined;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    }
    const response = await fetcher(url.toString(), { method, signal, headers, body });
    const text = await response.text();
    if (!response.ok) throw new Error(`Sauce Labs ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    if (text.trim() === "") return { ok: true };
    try {
      return JSON.parse(text);
    } catch {
      return { ok: true, response: text.slice(0, 20000) };
    }
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const req = () => string({ minLength: 1 });
const body = () => json();
// Query-string parameters for analytics endpoints with many optional filters. Array filters repeat the key.
const filters = () => json();

function qs(value: unknown): Params {
  const out: Params = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || v === null) continue;
      out[k] = Array.isArray(v) ? v.join(",") : (v as string | number | boolean);
    }
  }
  return out;
}

function build(call: Call) {
  const analytics = (description: string, path: string) =>
    query({ description, input: object({ query: filters() }) }, (_c, { query: q }) =>
      call("GET", path, { params: qs(q) }),
    );
  const bySource = (description: string, path: (source: string) => string) =>
    query(
      {
        description: `${description} source is rdc (real devices) or vdc (virtual devices). query holds the filters as an object, for example {"org_id":"...","start":"2026-01-01T00:00:00Z"}; array filters are comma-joined.`,
        input: object({ source: req(), query: filters() }),
      },
      (_c, { source, query: q }) => call("GET", path(source), { params: qs(q) }),
    );

  return {
    jobs: router(
      {
        list: query(
          {
            description: "List recent virtual-device (Selenium/Appium on VMs, emulators, simulators) jobs run by a user.",
            input: object({
              username: req(),
              limit: number().optional(),
              skip: number().optional(),
              from: number().optional(),
              to: number().optional(),
            }),
          },
          (_c, { username, ...params }) => call("GET", `/rest/v1/${seg(username)}/jobs`, { params }),
        ),
        get: query(
          { description: "Get the details of a virtual-device job.", input: object({ username: req(), jobId: req() }) },
          (_c, { username, jobId }) => call("GET", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}`),
        ),
        update: mutation(
          {
            description:
              'Update a virtual-device job. Body fields replace existing values, for example {"name":"Login test","passed":true,"build":"Release","tags":["e2e"],"public":"team"}. Tags replace, not add.',
            input: object({ username: req(), jobId: req(), body: body() }),
          },
          (_c, { username, jobId, body: b }) => call("PUT", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}`, { json: b }),
        ),
        stop: mutation(
          { description: "Stop a running virtual-device job.", input: object({ username: req(), jobId: req() }) },
          (_c, { username, jobId }) => call("PUT", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}/stop`),
        ),
        delete: mutation(
          {
            description: "Delete a virtual-device job and all its assets from test history.",
            input: object({ username: req(), jobId: req() }),
          },
          (_c, { username, jobId }) => call("DELETE", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}`),
        ),
        listAssets: query(
          {
            description: "List the asset files (logs, video, screenshots) of a virtual-device job.",
            input: object({ username: req(), jobId: req() }),
          },
          (_c, { username, jobId }) => call("GET", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}/assets`),
        ),
        getAsset: query(
          {
            description: "Fetch a text asset file (for example selenium-server.log) of a virtual-device job. Binary assets such as video are not returned; use the URLs from listAssets.",
            input: object({ username: req(), jobId: req(), fileName: req() }),
          },
          (_c, { username, jobId, fileName }) =>
            call("GET", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}/assets/${seg(fileName)}`),
        ),
        deleteAssets: mutation(
          {
            description: "Delete all asset files of a virtual-device job (single files cannot be deleted).",
            input: object({ username: req(), jobId: req() }),
          },
          (_c, { username, jobId }) => call("DELETE", `/rest/v1/${seg(username)}/jobs/${seg(jobId)}/assets`),
        ),
      },
      { title: "Jobs", description: "Virtual-device test jobs." },
    ),
    builds: router(
      {
        list: query(
          {
            description:
              'Look up builds. source is rdc (real devices) or vdc (emulators, simulators, browsers). query holds optional filters, for example {"team_id":"...","status":["failed"],"limit":20}; array filters are comma-joined.',
            input: object({ source: req(), query: filters() }),
          },
          (_c, { source, query: q }) => call("GET", `/v2/builds/${seg(source)}/`, { params: qs(q) }),
        ),
        get: query(
          { description: "Get a build by ID. source is rdc or vdc.", input: object({ source: req(), buildId: req() }) },
          (_c, { source, buildId }) => call("GET", `/v2/builds/${seg(source)}/${seg(buildId)}/`),
        ),
        forJob: query(
          { description: "Get the build a job belongs to. source is rdc or vdc.", input: object({ source: req(), jobId: req() }) },
          (_c, { source, jobId }) => call("GET", `/v2/builds/${seg(source)}/jobs/${seg(jobId)}/build/`),
        ),
        jobs: query(
          {
            description:
              'List the jobs in a build. source is rdc or vdc. query holds optional filters such as {"completed":true,"failed":true,"modified_since":1700000000}.',
            input: object({ source: req(), buildId: req(), query: filters() }),
          },
          (_c, { source, buildId, query: q }) =>
            call("GET", `/v2/builds/${seg(source)}/${seg(buildId)}/jobs/`, { params: qs(q) }),
        ),
      },
      { title: "Builds", description: "Builds that group jobs, for real and virtual devices." },
    ),
    realDevices: router(
      {
        listDevices: query({ description: "List the real devices in the data center with OS and identifying info.", input: object({}) }, () =>
          call("GET", "/v1/rdc/devices"),
        ),
        getDevice: query(
          { description: "Get a real device by ID.", input: object({ deviceId: req() }) },
          (_c, { deviceId }) => call("GET", `/v1/rdc/devices/${seg(deviceId)}`),
        ),
        deviceStatus: query(
          { description: "List real devices with their current state (AVAILABLE, IN_USE, CLEANING, MAINTENANCE, ...).", input: object({}) },
          () => call("GET", "/v1/rdc/devices/status"),
        ),
        listJobs: query(
          {
            description: "List jobs on real devices. type LIVE limits to manual tests.",
            input: object({ limit: number().optional(), offset: number().optional(), type: string().optional() }),
          },
          (_c, params) => call("GET", "/v1/rdc/jobs", { params }),
        ),
        getJob: query(
          { description: "Get a real-device job by ID.", input: object({ jobId: req() }) },
          (_c, { jobId }) => call("GET", `/v1/rdc/jobs/${seg(jobId)}`),
        ),
        getJobAsset: query(
          {
            description:
              "Fetch a text asset of a finished real-device job. assetType is one of deviceLogs, appiumLogs, appiumRequests, junit.xml, xcuitestLogs, network.har, insights.json, crash.json. Video and screenshots are binary and not supported here.",
            input: object({ jobId: req(), assetType: req() }),
          },
          (_c, { jobId, assetType }) => call("GET", `/v1/rdc/jobs/${seg(jobId)}/${seg(assetType)}`),
        ),
        startNativeTest: mutation(
          {
            description:
              'Start an XCUITest, XCTest or Espresso run on real devices. Body: {"test_framework":"XCUITEST|XCTEST|ANDROID_INSTRUMENTATION","app_id":"storage://<file_id>","xc_test_run_file":"storage://<file_id>","device_query":{"type":"DynamicDeviceQuery","device_name":"iPhone.*","os_version":"17.*"},"tunnel_name":"optional"}. The app and test files must already be in App Storage.',
            input: object({ body: body() }),
          },
          (_c, { body: b }) => call("POST", "/v1/rdc/native-composer/tests", { json: b }),
        ),
        updateJob: mutation(
          {
            description: 'Update a real-device job. Body: {"name":"...","build":"...","passed":true,"tags":["a"]}. Tags replace existing ones.',
            input: object({ jobId: req(), body: body() }),
          },
          (_c, { jobId, body: b }) => call("PUT", `/v1/rdc/jobs/${seg(jobId)}`, { json: b }),
        ),
        stopJob: mutation(
          { description: "Stop a running real-device job (Appium, Espresso or XCUITest).", input: object({ jobId: req() }) },
          (_c, { jobId }) => call("PUT", `/v1/rdc/jobs/${seg(jobId)}/stop`),
        ),
        deleteJob: mutation(
          {
            description: "Delete a real-device job and its assets. Only the owner or a team or org admin can do this.",
            input: object({ jobId: req() }),
          },
          (_c, { jobId }) => call("DELETE", `/v1/rdc/jobs/${seg(jobId)}`),
        ),
        listPrivateDevices: query(
          { description: "List private devices with their settings.", input: object({}) },
          () => call("GET", "/v1/rdc/device-management/devices"),
        ),
        assignDeviceToTeams: mutation(
          {
            description: 'Assign a private device to teams; the list replaces existing assignments (empty list unassigns). Body: {"ids":["<team_id>"]}.',
            input: object({ deviceId: req(), body: body() }),
          },
          (_c, { deviceId, body: b }) =>
            call("PUT", `/v1/rdc/device-management/devices/${seg(deviceId)}/teams`, { json: b }),
        ),
        updateDeviceSettings: mutation(
          {
            description:
              'Update private device settings; old values are replaced. Body requires appWhitelist, accountWhitelist, systemAppAllowlist (arrays), applePaySupportEnabled (boolean) and skipCleaningFolders (array).',
            input: object({ deviceId: req(), body: body() }),
          },
          (_c, { deviceId, body: b }) =>
            call("PUT", `/v1/rdc/device-management/devices/${seg(deviceId)}/settings`, { json: b }),
        ),
      },
      { title: "Real devices", description: "Real device cloud: devices, jobs and native test runs." },
    ),
    tunnels: router(
      {
        list: query(
          {
            description: "List running Sauce Connect tunnels for a user. full=true returns tunnel details instead of IDs.",
            input: object({ username: req(), full: string().optional(), all: string().optional(), filter: string().optional() }),
          },
          (_c, { username, ...params }) => call("GET", `/rest/v1/${seg(username)}/tunnels`, { params }),
        ),
        get: query(
          { description: "Get information about a tunnel.", input: object({ username: req(), tunnelId: req() }) },
          (_c, { username, tunnelId }) => call("GET", `/rest/v1/${seg(username)}/tunnels/${seg(tunnelId)}`),
        ),
        numJobs: query(
          { description: "Get the number of jobs currently running through a tunnel.", input: object({ username: req(), tunnelId: req() }) },
          (_c, { username, tunnelId }) => call("GET", `/rest/v1/${seg(username)}/tunnels/${seg(tunnelId)}/num_jobs`),
        ),
        versions: query(
          {
            description: "Get Sauce Connect client download info. Optional client_version, client_host (for example darwin-amd64), all=true.",
            input: object({ client_version: string().optional(), client_host: string().optional(), all: string().optional() }),
          },
          (_c, params) => call("GET", "/rest/v1/public/tunnels/info/versions", { params }),
        ),
        stop: mutation(
          { description: "Shut down a tunnel.", input: object({ username: req(), tunnelId: req() }) },
          (_c, { username, tunnelId }) => call("DELETE", `/rest/v1/${seg(username)}/tunnels/${seg(tunnelId)}`),
        ),
      },
      { title: "Sauce Connect", description: "Sauce Connect tunnels." },
    ),
    storage: router(
      {
        listFiles: query(
          {
            description: "List files in App Storage. Filters: q, name, kind (android|ios), icon_repr (use hash to shrink output), page, per_page.",
            input: object({
              q: string().optional(),
              name: string().optional(),
              kind: string().optional(),
              file_id: string().optional(),
              sha256: string().optional(),
              tag: string().optional(),
              team_id: string().optional(),
              icon_repr: string().default("hash"),
              page: number().optional(),
              per_page: number().optional(),
            }),
          },
          (_c, params) => call("GET", "/v1/storage/files", { params }),
        ),
        listGroups: query(
          {
            description: "List App Storage groups (apps with several files).",
            input: object({
              q: string().optional(),
              kind: string().optional(),
              group_id: string().optional(),
              project_name: string().optional(),
              icon_repr: string().default("hash"),
              page: number().optional(),
              per_page: number().optional(),
            }),
          },
          (_c, params) => call("GET", "/v1/storage/groups", { params }),
        ),
        getGroupSettings: query(
          { description: "Get the settings of an App Storage group.", input: object({ groupId: req() }) },
          (_c, { groupId }) => call("GET", `/v1/storage/groups/${seg(groupId)}/settings`),
        ),
        updateGroupSettings: mutation(
          {
            description: "Replace the settings of an App Storage group. Body is the settings JSON as returned by getGroupSettings.",
            input: object({ groupId: req(), body: body() }),
          },
          (_c, { groupId, body: b }) => call("PUT", `/v1/storage/groups/${seg(groupId)}/settings`, { json: b }),
        ),
        shareGroup: mutation(
          {
            description: 'Share an App Storage group with teams (org admins only). Body: {"teams":["<team_id>"]}.',
            input: object({ groupId: req(), body: body() }),
          },
          (_c, { groupId, body: b }) => call("PUT", `/v1/storage/groups/${seg(groupId)}/share`, { json: b }),
        ),
        updateFile: mutation(
          {
            description: 'Update a stored file. Body: {"description":"...","tags":"tag1,tag2"}. Tags override existing ones.',
            input: object({ fileId: req(), body: body() }),
          },
          (_c, { fileId, body: b }) => call("PUT", `/v1/storage/files/${seg(fileId)}`, { json: b }),
        ),
        deleteFile: mutation(
          { description: "Delete a file from App Storage (team or org admins only).", input: object({ fileId: req() }) },
          (_c, { fileId }) => call("DELETE", `/v1/storage/files/${seg(fileId)}`),
        ),
        deleteGroup: mutation(
          { description: "Delete an App Storage group and its files (team or org admins only).", input: object({ groupId: req() }) },
          (_c, { groupId }) => call("DELETE", `/v1/storage/groups/${seg(groupId)}`),
        ),
        listTags: query(
          { description: "List tags in use in App Storage.", input: object({ page: number().optional(), per_page: number().optional() }) },
          (_c, params) => call("GET", "/v1/storage/tags", { params }),
        ),
        listProjects: query(
          {
            description: "List App Storage projects.",
            input: object({ kind: string().optional(), page: number().optional(), per_page: number().optional() }),
          },
          (_c, params) => call("GET", "/v1/storage/projects", { params }),
        ),
      },
      { title: "App Storage", description: "Mobile app and file storage. Upload and download of binaries is not supported." },
    ),
    teams: router(
      {
        list: query(
          {
            description: "Look up teams in the organization, optionally by name prefix or comma-separated ids.",
            input: object({ name: string().optional(), id: string().optional() }),
          },
          (_c, params) => call("GET", "/team-management/v1/teams/", { params }),
        ),
        get: query(
          { description: "Get a team by ID.", input: object({ teamId: req() }) },
          (_c, { teamId }) => call("GET", `/team-management/v1/teams/${seg(teamId)}/`),
        ),
        members: query(
          { description: "List the members of a team.", input: object({ teamId: req() }) },
          (_c, { teamId }) => call("GET", `/team-management/v1/teams/${seg(teamId)}/members/`),
        ),
        create: mutation(
          {
            description: 'Create a team. Body: {"name":"A-Team","settings":{"virtual_machines":10},"description":"..."}.',
            input: object({ body: body() }),
          },
          (_c, { body: b }) => call("POST", "/team-management/v1/teams/", { json: b }),
        ),
        update: mutation(
          { description: "Replace a team's attributes. Body is the full team JSON (name, settings, description).", input: object({ teamId: req(), body: body() }) },
          (_c, { teamId, body: b }) => call("PUT", `/team-management/v1/teams/${seg(teamId)}/`, { json: b }),
        ),
        patch: mutation(
          { description: "Partially update a team. Body holds only the fields to change.", input: object({ teamId: req(), body: body() }) },
          (_c, { teamId, body: b }) => call("PATCH", `/team-management/v1/teams/${seg(teamId)}/`, { json: b }),
        ),
        delete: mutation(
          { description: "Delete a team.", input: object({ teamId: req() }) },
          (_c, { teamId }) => call("DELETE", `/team-management/v1/teams/${seg(teamId)}/`),
        ),
        resetAccessKeys: mutation(
          { description: "Reset the access keys of every member of a team.", input: object({ teamId: req() }) },
          (_c, { teamId }) => call("POST", `/team-management/v1/teams/${seg(teamId)}/reset-access-key/`, { json: {} }),
        ),
        activeTeam: query({ description: "Get the authenticated user's active team.", input: object({}) }, () =>
          call("GET", "/team-management/v1/users/me/active-team/"),
        ),
      },
      { title: "Teams", description: "Teams in the organization." },
    ),
    users: router(
      {
        list: query(
          {
            description: "Look up users in the organization. query holds optional filters such as {\"username\":\"jsmith\",\"team\":\"<team_id>\"}.",
            input: object({ query: filters() }),
          },
          (_c, { query: q }) => call("GET", "/team-management/v1/users/", { params: qs(q) }),
        ),
        get: query(
          { description: "Get a user by ID.", input: object({ userId: req() }) },
          (_c, { userId }) => call("GET", `/team-management/v1/users/${seg(userId)}/`),
        ),
        concurrency: query(
          { description: "Get a user's concurrency allowance and current usage.", input: object({ username: req() }) },
          (_c, { username }) => call("GET", `/rest/v1.2/users/${seg(username)}/concurrency`),
        ),
        teams: query(
          { description: "Get the team of a user.", input: object({ userId: req() }) },
          (_c, { userId }) => call("GET", `/team-management/v1/users/${seg(userId)}/teams/`),
        ),
        create: mutation(
          {
            description: "Create a user. Body is the user JSON (username, email, first_name, last_name, password, verify_password, organization, ...).",
            input: object({ body: body() }),
          },
          (_c, { body: b }) => call("POST", "/team-management/v1/users/", { json: b }),
        ),
        patch: mutation(
          { description: "Partially update a user. Body holds only the fields to change.", input: object({ userId: req(), body: body() }) },
          (_c, { userId, body: b }) => call("PATCH", `/team-management/v1/users/${seg(userId)}`, { json: b }),
        ),
        changeTeam: mutation(
          { description: "Change a user's team assignment. Body: {\"team\":\"<team_id>\"}.", input: object({ userId: req(), body: body() }) },
          (_c, { userId, body: b }) => call("PUT", `/team-management/v1/users/${seg(userId)}/teams/`, { json: b }),
        ),
        subscribeToTeam: mutation(
          { description: "Subscribe a user to a team. Body: {\"user\":\"<user_id>\",\"team\":\"<team_id>\"}.", input: object({ body: body() }) },
          (_c, { body: b }) => call("POST", "/team-management/v1/membership/", { json: b }),
        ),
        setRole: mutation(
          {
            description: "Set a user's role: org-admin, team-admin or member.",
            input: object({ userId: req(), role: req() }),
          },
          (_c, { userId, role }) => {
            const action = { "org-admin": "set-admin", "team-admin": "set-team-admin", member: "set-member" }[role];
            if (!action) throw new Error("role must be org-admin, team-admin or member.");
            return call("POST", `/team-management/v1/users/${seg(userId)}/${action}/`, { json: {} });
          },
        ),
        getAccessKey: query(
          { description: "Get a user's access key. Returns a secret.", input: object({ userId: req() }) },
          (_c, { userId }) => call("GET", `/team-management/v1/users/${seg(userId)}/access-key/`),
        ),
        resetAccessKey: mutation(
          { description: "Reset a user's access key.", input: object({ userId: req() }) },
          (_c, { userId }) => call("POST", `/team-management/v1/users/${seg(userId)}/reset-access-key/`, { json: {} }),
        ),
        deactivate: mutation(
          { description: "Deactivate a user.", input: object({ userId: req() }) },
          (_c, { userId }) => call("POST", `/team-management/v1/users/${seg(userId)}/deactivate/`, { json: {} }),
        ),
        activate: mutation(
          { description: "Activate a user.", input: object({ userId: req() }) },
          (_c, { userId }) => call("POST", `/team-management/v1/users/${seg(userId)}/activate/`, { json: {} }),
        ),
      },
      { title: "Users", description: "Users in the organization." },
    ),
    serviceAccounts: router(
      {
        list: query({ description: "List service accounts (enterprise plans only).", input: object({}) }, () =>
          call("GET", "/team-management/v1/service-accounts/"),
        ),
        get: query(
          { description: "Get a service account by UUID.", input: object({ uuid: req() }) },
          (_c, { uuid }) => call("GET", `/team-management/v1/service-accounts/${seg(uuid)}/`),
        ),
        create: mutation(
          { description: "Create a service account. Body is the service account JSON (name, team, ...).", input: object({ body: body() }) },
          (_c, { body: b }) => call("POST", "/team-management/v1/service-accounts/", { json: b }),
        ),
        update: mutation(
          { description: "Update a service account. Body holds the fields to change.", input: object({ uuid: req(), body: body() }) },
          (_c, { uuid, body: b }) => call("PATCH", `/team-management/v1/service-accounts/${seg(uuid)}/`, { json: b }),
        ),
        delete: mutation(
          { description: "Delete a service account.", input: object({ uuid: req() }) },
          (_c, { uuid }) => call("DELETE", `/team-management/v1/service-accounts/${seg(uuid)}/`),
        ),
        resetAccessKey: mutation(
          { description: "Reset a service account's access key.", input: object({ uuid: req() }) },
          (_c, { uuid }) => call("POST", `/team-management/v1/service-accounts/${seg(uuid)}/reset-access-key/`, { json: {} }),
        ),
      },
      { title: "Service accounts", description: "Service accounts (enterprise plans)." },
    ),
    usage: router(
      {
        orgConcurrency: query(
          {
            description: "Organization concurrency usage. Requires org_id. Optional source (vdc|rdc), granularity (hourly|daily|weekly|monthly), resource_type, start and end.",
            input: object({ query: filters() }),
          },
          (_c, { query: q }) => call("GET", "/usage-analytics/v1/concurrency/org", { params: qs(q) }),
        ),
        teamsConcurrency: query(
          {
            description: "Team concurrency usage. Requires org_id and team_id. Same optional filters as orgConcurrency.",
            input: object({ query: filters() }),
          },
          (_c, { query: q }) => call("GET", "/usage-analytics/v1/concurrency/teams", { params: qs(q) }),
        ),
        orgVisualSnapshots: query(
          {
            description: "Organization visual snapshot usage. Requires org_id, start_date and end_date (YYYY-MM-DDTHH:mm:ssZ).",
            input: object({ query: filters() }),
          },
          (_c, { query: q }) => call("GET", "/usage-analytics/v1/visual/usage/org", { params: qs(q) }),
        ),
        teamsVisualSnapshots: query(
          {
            description: "Team visual snapshot usage. Requires org_id, team_id, start_date and end_date.",
            input: object({ query: filters() }),
          },
          (_c, { query: q }) => call("GET", "/usage-analytics/v1/visual/usage/teams", { params: qs(q) }),
        ),
      },
      { title: "Usage", description: "Concurrency and visual snapshot usage." },
    ),
    insights: router(
      {
        testResults: analytics(
          "Test run data. query needs start and end (or time_range such as 7d) plus optional build, name, owner, scope, status, size, from, descending.",
          "/v1/analytics/tests",
        ),
        testMetrics: analytics(
          "Aggregate metrics for a named test. query needs start and end (or time_range) and query (the test name); optional scope, owner, status, os, browser.",
          "/v1/analytics/insights/test-metrics",
        ),
        testTrends: analytics("Test result trends over time. Same time filters as testResults.", "/v1/analytics/trends/tests"),
        buildsAndTests: analytics("Builds and tests over time. Same time filters as testResults.", "/v1/analytics/trends/builds_tests"),
        filterItems: bySource("List the filter values (builds, OS, browsers, tags, ...) available for insights.", (s) => `/v2/insights/${seg(s)}/filters`),
        tests: bySource("List tests with details. query requires org_id.", (s) => `/v2/insights/${seg(s)}/tests`),
        errors: bySource("List errors seen in tests. query requires org_id.", (s) => `/v2/insights/${seg(s)}/errors`),
        errorTrends: bySource("Error trends over time. query requires org_id.", (s) => `/v2/insights/${seg(s)}/errors/trends`),
        testCases: bySource("List test cases. query requires org_id.", (s) => `/v2/insights/${seg(s)}/test-cases`),
        testCaseStats: bySource("Test case statistics. query requires org_id.", (s) => `/v2/insights/${seg(s)}/test-cases/stats`),
        testCaseTrends: bySource("Status trend of test cases. query requires org_id.", (s) => `/v2/insights/${seg(s)}/test-cases/trends`),
        maxConcurrency: bySource("Max concurrency report as JSON. query requires org_id.", (s) => `/v2/insights/${seg(s)}/concurrency/max/json`),
        activityForUser: query(
          {
            description: "Daily test and concurrency statistics for a user. Optional since, until (Unix time) and level (user|organization).",
            input: object({ userId: req(), query: filters() }),
          },
          (_c, { userId, query: q }) => call("GET", `/rest/v1/users/${seg(userId)}/activity`, { params: qs(q) }),
        ),
        activityForUsers: analytics("Daily statistics for users. Optional users, since, until.", "/rest/v1/users_activity"),
        activityForTeams: analytics("Daily statistics per team. Optional since, until.", "/rest/v1/activity/teams"),
        activityForOrg: analytics("Daily statistics for the organization. Optional since, until.", "/rest/v1/activity/organization"),
      },
      { title: "Insights", description: "Test analytics and activity statistics." },
    ),
    platform: router(
      {
        status: query({ description: "Current availability of the Sauce Labs platform.", input: object({}) }, () =>
          call("GET", "/rest/v1/info/status"),
        ),
        platforms: query(
          { description: "Supported OS and browser combinations. automationApi is all, appium or webdriver.", input: object({ automationApi: req() }) },
          (_c, { automationApi }) => call("GET", `/rest/v1/info/platforms/${seg(automationApi)}`),
        ),
        appiumEol: query({ description: "End-of-life dates (Unix time) for Appium versions.", input: object({}) }, () =>
          call("GET", "/rest/v1/info/platforms/appium/eol"),
        ),
      },
      { title: "Platform", description: "Platform status and supported platforms." },
    ),
  };
}

export default defineApp({ user: { accounts: { saucelabs: saucelabs.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.saucelabs ?? [],
      (account) =>
        withApprovals(
          router(build(client(origin(account), authorization(account), fetch, signal))),
          (tool) => (tool.kind === "mutation" ? always() : undefined),
        ),
      { signal },
    ),
    {
      title: "Sauce Labs",
      description: "Sauce Labs testing cloud: jobs, builds, real devices, Sauce Connect tunnels, app storage, teams, users, usage and Insights analytics.",
      instructions:
        "Most calls need the Sauce Labs username (the one connected). Jobs here are virtual-device jobs; real-device jobs are under realDevices. Analytics tools take a query object of filters.",
      icons,
    },
  ),
}));
