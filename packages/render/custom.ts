import { decodeJson, json, mutation, object, query, record, router, string, withApprovals } from "apps";
import { always } from "apps/operations/approval";

// Hand-written tools for the operations the OpenAPI compiler skips. Render's spec points many schemas at
// JSON pointers inside `paths` or at nested properties, which the compiler does not accept
// (it only follows `#/components/schemas/<name>`), so these call the same REST endpoints directly.

const base = "https://api.render.com/v1";

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

function idsOf(path: string): string[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!);
}

function run(call: Call, method: Method, path: string, input: Params, hasBody: boolean) {
  let resolved = path;
  for (const id of idsOf(path)) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return call(method, resolved, (input.query as Params | undefined) ?? {}, hasBody ? ((input.body as Params | undefined) ?? {}) : undefined);
}

// `hasBody`: true requires a JSON body, "optional" accepts one, false sends none.
function read(call: Call, path: string, description: string) {
  return query(
    {
      description,
      input: object({ ...Object.fromEntries(idsOf(path).map((id) => [id, string()])), query: filters }),
    },
    async (_ctx, input: Params) => run(call, "GET", path, input, false),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, hasBody: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(idsOf(path).map((id) => [id, string()])),
        query: filters,
        ...(hasBody === "optional" ? { body: optionalPayload } : hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) => run(call, method, path, input, hasBody !== false),
  );
}

const page = " Pass filters in query (cursor, limit, and the filters named in the Render API reference). The response is an array of { cursor, <resource> }; pass the last cursor to get the next page.";

function build(c: Call) {
  return router({
    services: router(
      {
        list: read(c, "/services", "List services (web services, private services, static sites, background workers, cron jobs). Filters in query: name, type, env, region, ownerId, suspended, createdBefore/After, updatedBefore/After, includePreviews." + page),
        create: write(c, "POST", "/services", "Create a service. body follows the Render create-service schema: type (web_service, private_service, background_worker, static_site, cron_job), name, ownerId, repo, branch, autoDeploy, envVars, serviceDetails (runtime, plan, region, buildCommand, startCommand, schedule for cron jobs, ...)."),
        retrieve: read(c, "/services/{serviceId}", "Retrieve one service by id."),
        update: write(c, "PATCH", "/services/{serviceId}", "Update a service. body holds the fields to change: name, repo, branch, autoDeploy, rootDir, serviceDetails, ..."),
        listEvents: read(c, "/services/{serviceId}/events", "List events for a service (deploys, restarts, suspensions, failures)." + page),
        retrieveEvent: read(c, "/events/{eventId}", "Retrieve one event by id."),
        preview: write(c, "POST", "/services/{serviceId}/preview", "Create a preview instance of a service. body: imagePath, name, plan."),
        purgeCache: write(c, "POST", "/services/{serviceId}/cache/purge", "Purge the CDN cache of a static site or web service.", false),
        autoscale: write(c, "PUT", "/services/{serviceId}/autoscaling", "Set the autoscaling config of a service. body: enabled, min, max, criteria (cpu, memory)."),
      },
      { title: "Services", description: "List, create, retrieve and update services, their events and previews. Env vars, deploys, scaling and domains are under api." },
    ),
    jobs: router(
      {
        list: read(c, "/services/{serviceId}/jobs", "List one-off jobs run on a service." + page),
        create: write(c, "POST", "/services/{serviceId}/jobs", "Run a one-off job on a service. body: startCommand, planId."),
        retrieve: read(c, "/services/{serviceId}/jobs/{jobId}", "Retrieve a job and its status."),
        cancel: write(c, "POST", "/services/{serviceId}/jobs/{jobId}/cancel", "Cancel a running job.", false),
      },
      { title: "Jobs", description: "One-off jobs on a service. Cron job runs are under api (servicesCronJobs)." },
    ),
    postgres: router(
      {
        list: read(c, "/postgres", "List Postgres databases. Filters in query: name, region, suspended, createdBefore/After, updatedBefore/After, ownerId, id." + page),
        create: write(c, "POST", "/postgres", "Create a Postgres database. body: name, ownerId, plan, version, region, databaseName, databaseUser, diskSizeGB, enableHighAvailability, ipAllowList."),
        retrieve: read(c, "/postgres/{postgresId}", "Retrieve one Postgres database by id."),
        update: write(c, "PATCH", "/postgres/{postgresId}", "Update a Postgres database. body holds the fields to change: name, plan, diskSizeGB, enableHighAvailability, ipAllowList, ..."),
        recover: write(c, "POST", "/postgres/{postgresId}/recovery", "Restore a Postgres database to a point in time as a new instance. body: datastoreName, restoreTime."),
      },
      { title: "Postgres", description: "List, create, retrieve, update and recover Postgres databases. Connection info, users, exports and restarts are under api." },
    ),
    keyValue: router(
      {
        create: write(c, "POST", "/key-value", "Create a Key Value (Valkey) instance. body: name, ownerId, plan, region, maxmemoryPolicy, ipAllowList."),
        retrieve: read(c, "/key-value/{redisId}", "Retrieve one Key Value instance by id."),
        update: write(c, "PATCH", "/key-value/{redisId}", "Update a Key Value instance. body holds the fields to change: name, plan, maxmemoryPolicy, ipAllowList."),
      },
      { title: "Key Value", description: "Create, retrieve and update Key Value instances. Listing, connection info, suspend and resume are under api." },
    ),
    disks: router(
      {
        list: read(c, "/disks", "List persistent disks. Filters in query: ownerId, serviceId, name." + page),
        create: write(c, "POST", "/disks", "Add a persistent disk to a service. body: name, sizeGB, mountPath, serviceId."),
        retrieve: read(c, "/disks/{diskId}", "Retrieve one disk by id."),
        update: write(c, "PATCH", "/disks/{diskId}", "Update a disk. body: name, sizeGB, mountPath."),
        restoreSnapshot: write(c, "POST", "/disks/{diskId}/snapshots/restore", "Restore a disk from a snapshot. body: snapshotKey."),
      },
      { title: "Disks", description: "Persistent disks attached to services." },
    ),
    envGroups: router(
      { create: write(c, "POST", "/env-groups", "Create an environment group. body: name, ownerId, envVars, secretFiles, serviceIds.") },
      { title: "Environment groups", description: "Create environment groups. Listing, retrieving and linking are under api." },
    ),
    logs: router(
      {
        list: read(c, "/logs", "List logs. query needs ownerId and resource (array of service or database ids); optional startTime, endTime, direction, limit, level, type, text, instance, host, statusCode, method, path."),
        retrieveOwnerStream: read(c, "/logs/streams/owner/{ownerId}", "Retrieve the workspace log stream config."),
        setOwnerStream: write(c, "PUT", "/logs/streams/owner/{ownerId}", "Set the workspace log stream. body: endpoint, token, preview."),
        listResourceStreams: read(c, "/logs/streams/resource", "List resource log stream overrides." ),
        retrieveResourceStream: read(c, "/logs/streams/resource/{resourceId}", "Retrieve a resource's log stream override."),
        setResourceStream: write(c, "PUT", "/logs/streams/resource/{resourceId}", "Set a resource's log stream override. body: endpoint, token, preview."),
        retrieveMetricsStream: read(c, "/metrics-stream/{ownerId}", "Retrieve the workspace metrics stream config."),
        setMetricsStream: write(c, "PUT", "/metrics-stream/{ownerId}", "Set the workspace metrics stream. body: provider, url, token."),
      },
      { title: "Logs and streams", description: "Query logs and configure log and metrics streams." },
    ),
    notifications: router(
      {
        retrieveOwnerSettings: read(c, "/notification-settings/owners/{ownerId}", "Retrieve a workspace's notification settings."),
        updateOwnerSettings: write(c, "PATCH", "/notification-settings/owners/{ownerId}", "Update a workspace's notification settings. body: notificationsToSend, previewNotificationsEnabled, emailEnabled."),
        listOverrides: read(c, "/notification-settings/overrides", "List per-service notification overrides." + page),
        retrieveServiceOverride: read(c, "/notification-settings/overrides/services/{serviceId}", "Retrieve a service's notification override."),
        updateServiceOverride: write(c, "PATCH", "/notification-settings/overrides/services/{serviceId}", "Update a service's notification override. body: notificationsToSend, previewNotificationsEnabled."),
      },
      { title: "Notifications", description: "Workspace and per-service notification settings." },
    ),
    webhooks: router(
      {
        list: read(c, "/webhooks", "List webhooks." + page),
        create: write(c, "POST", "/webhooks", "Create a webhook. body: url, name, enabled, eventFilter, ownerId."),
        retrieve: read(c, "/webhooks/{webhookId}", "Retrieve one webhook."),
        update: write(c, "PATCH", "/webhooks/{webhookId}", "Update a webhook. body: name, url, enabled, eventFilter."),
        listEvents: read(c, "/webhooks/{webhookId}/events", "List a webhook's recent deliveries." + page),
      },
      { title: "Webhooks", description: "Webhook endpoints and their delivery events." },
    ),
    workflows: router(
      {
        list: read(c, "/workflows", "List workflows." + page),
        create: write(c, "POST", "/workflows", "Create a workflow. body: name, ownerId, runtime, repo, branch, buildConfig, autoDeployTrigger."),
        retrieve: read(c, "/workflows/{workflowId}", "Retrieve one workflow."),
        update: write(c, "PATCH", "/workflows/{workflowId}", "Update a workflow. body holds the fields to change."),
        listVersions: read(c, "/workflowversions", "List workflow versions." + page),
        listTasks: read(c, "/tasks", "List workflow tasks." + page),
        listTaskRuns: read(c, "/task-runs", "List task runs." + page),
        startTaskRun: write(c, "POST", "/task-runs", "Start a task run. body: task, input."),
        retrieveTaskRun: read(c, "/task-runs/{taskRunId}", "Retrieve one task run and its status."),
      },
      { title: "Workflows", description: "Render Workflows: definitions, versions, tasks and task runs." },
    ),
    blueprints: router(
      {
        list: read(c, "/blueprints", "List Blueprints (render.yaml sync definitions)." + page),
        retrieve: read(c, "/blueprints/{blueprintId}", "Retrieve one Blueprint."),
        update: write(c, "PATCH", "/blueprints/{blueprintId}", "Update a Blueprint. body: name, autoSync, branch, path."),
      },
      { title: "Blueprints", description: "Infrastructure-as-code Blueprints." },
    ),
    buildSources: router(
      {
        list: read(c, "/build-sources", "List build sources." + page),
        create: write(c, "POST", "/build-sources", "Create a build source. body: name, ownerId, git settings."),
        retrieve: read(c, "/build-sources/{buildSourceId}", "Retrieve one build source."),
        update: write(c, "PATCH", "/build-sources/{buildSourceId}", "Update a build source."),
        listBuilds: read(c, "/build-sources/{buildSourceId}/builds", "List builds of a build source." + page),
        createBuild: write(c, "POST", "/build-sources/{buildSourceId}/builds", "Start a build. body: commitId or similar per the Render API reference."),
        retrieveBuild: read(c, "/build-sources/{buildSourceId}/builds/{buildId}", "Retrieve one build."),
      },
      { title: "Build sources", description: "Build sources and their builds." },
    ),
    maintenance: router(
      {
        list: read(c, "/maintenance", "List scheduled maintenance runs." ),
        retrieve: read(c, "/maintenance/{maintenanceRunID}", "Retrieve one maintenance run."),
      },
      { title: "Maintenance", description: "Scheduled maintenance for databases and key-value stores." },
    ),
  });
}

export function renderCustom(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return withApprovals(build(client(token, fetcher, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined));
}
