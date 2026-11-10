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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

type Fields = { environmentId: string; token: string };
type Account = { fields: Fields };
type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

// The environment ID is the subdomain of a SaaS tenant: https://<environmentId>.live.dynatrace.com.
function originOf(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!/^[a-z0-9]+$/.test(id)) throw new Error("Enter only the environment ID, for example abc12345 (no URL).");
  return `https://${id}.live.dynatrace.com`;
}

const authHeaders = (account: Account, extra: Record<string, string> = {}) => ({
  Authorization: `Api-Token ${account.fields.token}`,
  Accept: "application/json",
  ...extra,
});

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const dynatrace = defineProvider({
  name: "Dynatrace",
  // Tenant hosts are https://<environmentId>.live.dynatrace.com: one subdomain level under live.dynatrace.com.
  hosts: ["*.live.dynatrace.com"],
  auth: {
    apiToken: secrets({
      label: "API token",
      fields: object({
        environmentId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.environmentId);
    const response = await fetch(`${origin}/api/v2/entityTypes?pageSize=1`, {
      signal,
      headers: authHeaders(account),
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.environmentId, displayName: `${account.fields.environmentId}.live.dynatrace.com` } };
  },
});

const tools = (account: Account, signal: AbortSignal) => {
  const base = `${originOf(account.fields.environmentId)}/api/v2`;
  const get = async (fetcher: Fetch, path: string, params: Params = {}) =>
    decodeJson(await fetcher(`${base}${path}${search(params)}`, { signal, headers: authHeaders(account) }), json());
  const send = async (fetcher: Fetch, method: string, path: string, body: unknown, params: Params = {}) =>
    decodeJson(
      await fetcher(`${base}${path}${search(params)}`, {
        method,
        signal,
        headers: authHeaders(account, { "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      }),
      json(),
    );
  const id = (value: string) => encodeURIComponent(value);

  const page = {
    pageSize: number().optional(),
    nextPageKey: string().optional(),
  };
  const window = { from: string().optional(), to: string().optional() };

  return router(
    {
      problems: router(
        {
          list: query(
            {
              description:
                "List problems detected by Davis. problemSelector filters (for example status(\"open\"),severityLevel(\"ERROR\")), entitySelector filters by affected entity, from/to take timestamps or relative values like now-2h (default last 2 hours), fields adds evidenceDetails, impactAnalysis, recentComments. nextPageKey continues a previous page; when set, send only that parameter.",
              input: object({
                problemSelector: string().optional(),
                entitySelector: string().optional(),
                fields: string().optional(),
                sort: string().optional(),
                ...window,
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/problems", input),
          ),
          get: query(
            {
              description: "Get one problem by its ID, optionally with extra fields (evidenceDetails, impactAnalysis, recentComments).",
              input: object({ problemId: string(), fields: string().optional() }),
            },
            async ({ fetch }, { problemId, ...rest }) => get(fetch, `/problems/${id(problemId)}`, rest),
          ),
          comments: query(
            {
              description: "List the comments on a problem.",
              input: object({ problemId: string(), ...page }),
            },
            async ({ fetch }, { problemId, ...rest }) => get(fetch, `/problems/${id(problemId)}/comments`, rest),
          ),
          comment: mutation(
            {
              description: "Add a comment to a problem.",
              input: object({ problemId: string(), message: string(), context: string().optional() }),
              approval: always(),
            },
            async ({ fetch }, { problemId, ...body }) => send(fetch, "POST", `/problems/${id(problemId)}/comments`, body),
          ),
          close: mutation(
            {
              description: "Close a problem manually with a closing comment.",
              input: object({ problemId: string(), message: string() }),
              approval: always(),
            },
            async ({ fetch }, { problemId, ...body }) => send(fetch, "POST", `/problems/${id(problemId)}/close`, body),
          ),
        },
        { title: "Problems", description: "Davis AI problems: list, inspect, comment on and close." },
      ),
      entities: router(
        {
          list: query(
            {
              description:
                "List monitored entities (hosts, services, applications, process groups...). entitySelector is required, for example type(\"HOST\") or type(\"SERVICE\"),entityName.contains(\"checkout\"). fields adds properties, tags, managementZones, fromRelationships, toRelationships.",
              input: object({
                entitySelector: string(),
                fields: string().optional(),
                sort: string().optional(),
                ...window,
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/entities", input),
          ),
          get: query(
            {
              description: "Get one entity by its ID (for example HOST-1234567890ABCDEF).",
              input: object({ entityId: string(), fields: string().optional(), ...window }),
            },
            async ({ fetch }, { entityId, ...rest }) => get(fetch, `/entities/${id(entityId)}`, rest),
          ),
          types: query(
            {
              description: "List entity types known to the environment, or fetch one with its properties and relationships.",
              input: object({ type: string().optional(), ...page }),
            },
            async ({ fetch }, { type, ...rest }) =>
              type === undefined ? get(fetch, "/entityTypes", rest) : get(fetch, `/entityTypes/${id(type)}`),
          ),
          tags: query(
            {
              description: "List the manually applied custom tags of the entities matched by an entitySelector.",
              input: object({ entitySelector: string(), ...window }),
            },
            async ({ fetch }, input) => get(fetch, "/tags", input),
          ),
          addTags: mutation(
            {
              description: "Add custom tags to all entities matched by an entitySelector. Each tag is { key, value? }.",
              input: object({
                entitySelector: string(),
                tags: array(object({ key: string(), value: string().optional() })),
              }),
              approval: always(),
            },
            async ({ fetch }, { entitySelector, tags }) => send(fetch, "POST", "/tags", { tags }, { entitySelector }),
          ),
        },
        { title: "Entities", description: "Topology: monitored entities, entity types and custom tags." },
      ),
      metrics: router(
        {
          list: query(
            {
              description:
                "Search metric descriptors. metricSelector can be a key or pattern (for example builtin:host.*); text searches names; fields adds details such as displayName, unit, aggregationTypes, dimensionDefinitions.",
              input: object({
                metricSelector: string().optional(),
                text: string().optional(),
                fields: string().optional(),
                writtenSince: string().optional(),
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/metrics", input),
          ),
          get: query(
            {
              description: "Get the descriptor of one metric by key or selector (unit, aggregations, dimensions).",
              input: object({ metricKey: string() }),
            },
            async ({ fetch }, { metricKey }) => get(fetch, `/metrics/${id(metricKey)}`),
          ),
          query: query(
            {
              description:
                "Query metric data points. metricSelector is a metric expression, for example builtin:host.cpu.usage:avg:splitBy(\"dt.entity.host\"). resolution is like 1h, 5m or Inf; from/to take timestamps or relative values (default last 2 hours); entitySelector narrows the entities.",
              input: object({
                metricSelector: string(),
                resolution: string().optional(),
                entitySelector: string().optional(),
                mzSelector: string().optional(),
                ...window,
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/metrics/query", input),
          ),
          ingest: mutation(
            {
              description:
                "Ingest custom metric data points in the Dynatrace metric line protocol, one point per line, for example `custom.requests,env=prod count,delta=5`. Needs the metrics.ingest scope.",
              input: object({ lines: string() }),
              approval: always(),
            },
            async ({ fetch }, { lines }) =>
              decodeJson(
                await fetch(`${base}/metrics/ingest`, {
                  method: "POST",
                  signal,
                  headers: authHeaders(account, { "Content-Type": "text/plain; charset=utf-8" }),
                  body: lines,
                }),
                json(),
              ),
          ),
        },
        { title: "Metrics", description: "Search metric descriptors, query data points and ingest custom metrics." },
      ),
      events: router(
        {
          list: query(
            {
              description:
                "List events (deployments, config changes, availability, custom). eventSelector filters, for example eventType(\"CUSTOM_DEPLOYMENT\"); entitySelector filters by entity.",
              input: object({
                eventSelector: string().optional(),
                entitySelector: string().optional(),
                ...window,
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/events", input),
          ),
          get: query(
            {
              description: "Get one event by its ID.",
              input: object({ eventId: string() }),
            },
            async ({ fetch }, { eventId }) => get(fetch, `/events/${id(eventId)}`),
          ),
          types: query(
            {
              description: "List the event types of the environment.",
              input: object({ ...page }),
            },
            async ({ fetch }, input) => get(fetch, "/eventTypes", input),
          ),
          ingest: mutation(
            {
              description:
                "Send a custom event to Dynatrace. eventType is one of CUSTOM_INFO, CUSTOM_ANNOTATION, CUSTOM_CONFIGURATION, CUSTOM_DEPLOYMENT, MARKED_FOR_TERMINATION, ERROR_EVENT, AVAILABILITY_EVENT, PERFORMANCE_EVENT, RESOURCE_CONTENTION_EVENT, CUSTOM_ALERT. entitySelector picks the target entities. properties is a map of string values.",
              input: object({
                eventType: string(),
                title: string(),
                entitySelector: string().optional(),
                startTime: number().optional(),
                endTime: number().optional(),
                timeout: number().optional(),
                properties: object({}).optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, input) => send(fetch, "POST", "/events/ingest", input),
          ),
        },
        { title: "Events", description: "Query events and send custom events such as deployments." },
      ),
      logs: router(
        {
          search: query(
            {
              description:
                "Search ingested logs. query uses the log search syntax (for example status=\"ERROR\" AND content=\"timeout\"); limit is up to 1000; sort is like -timestamp. Requires the logs.read scope and Grail or classic log monitoring.",
              input: object({
                query: string().optional(),
                limit: number().optional(),
                sort: string().optional(),
                ...window,
                nextSliceKey: string().optional(),
              }),
            },
            async ({ fetch }, input) => get(fetch, "/logs/search", input),
          ),
          aggregate: query(
            {
              description: "Aggregate log records matching a query, grouped by a field (for example by status).",
              input: object({ query: string().optional(), groupBy: string().optional(), ...window }),
            },
            async ({ fetch }, input) => get(fetch, "/logs/aggregate", input),
          ),
          ingest: mutation(
            {
              description:
                "Ingest log records. Each record is a JSON object with a content field and optional attributes such as timestamp, severity, log.source, dt.entity.host. Needs the logs.ingest scope.",
              input: object({ records: array(object({ content: string() })) }),
              approval: always(),
            },
            async ({ fetch }, { records }) => send(fetch, "POST", "/logs/ingest", records),
          ),
        },
        { title: "Logs", description: "Search, aggregate and ingest logs." },
      ),
      slo: router(
        {
          list: query(
            {
              description:
                "List service-level objectives with their current status and error budget. sloSelector filters (for example name(\"checkout\")), evaluate=true calculates the values.",
              input: object({
                sloSelector: string().optional(),
                evaluate: string().optional(),
                timeFrame: string().optional(),
                sort: string().optional(),
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/slo", input),
          ),
          get: query(
            {
              description: "Get one SLO by its ID, optionally evaluating it over a time frame.",
              input: object({ sloId: string(), from: string().optional(), to: string().optional(), timeFrame: string().optional() }),
            },
            async ({ fetch }, { sloId, ...rest }) => get(fetch, `/slo/${id(sloId)}`, rest),
          ),
        },
        { title: "SLOs", description: "Service-level objectives and their status." },
      ),
      security: router(
        {
          problems: query(
            {
              description:
                "List security problems (vulnerabilities) found by Application Security. securityProblemSelector filters, for example riskLevel(\"CRITICAL\"),status(\"OPEN\").",
              input: object({
                securityProblemSelector: string().optional(),
                fields: string().optional(),
                sort: string().optional(),
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/securityProblems", input),
          ),
          problem: query(
            {
              description: "Get one security problem by its ID.",
              input: object({ securityProblemId: string(), fields: string().optional() }),
            },
            async ({ fetch }, { securityProblemId, ...rest }) => get(fetch, `/securityProblems/${id(securityProblemId)}`, rest),
          ),
        },
        { title: "Security", description: "Vulnerabilities detected by Dynatrace Application Security." },
      ),
      settings: router(
        {
          schemas: query(
            {
              description: "List settings schemas, or fetch one schema (with its properties) by schemaId.",
              input: object({ schemaId: string().optional() }),
            },
            async ({ fetch }, { schemaId }) =>
              schemaId === undefined ? get(fetch, "/settings/schemas") : get(fetch, `/settings/schemas/${id(schemaId)}`),
          ),
          objects: query(
            {
              description:
                "List settings objects of a schema (for example builtin:alerting.profile) at a scope such as environment or an entity ID. fields adds value, summary, modificationInfo.",
              input: object({
                schemaIds: string().optional(),
                scopes: string().optional(),
                fields: string().optional(),
                filter: string().optional(),
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/settings/objects", input),
          ),
          object: query(
            {
              description: "Get one settings object by its object ID.",
              input: object({ objectId: string() }),
            },
            async ({ fetch }, { objectId }) => get(fetch, `/settings/objects/${id(objectId)}`),
          ),
          create: mutation(
            {
              description:
                "Create settings objects. Each item is { schemaId, scope, value } where value is the object body defined by the schema. Set validateOnly to check without saving.",
              input: object({
                items: array(object({ schemaId: string(), scope: string(), value: object({}) })),
                validateOnly: string().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, { items, validateOnly }) => send(fetch, "POST", "/settings/objects", items, { validateOnly }),
          ),
          delete: mutation(
            {
              description: "Delete one settings object by its object ID.",
              input: object({ objectId: string() }),
              approval: always(),
            },
            async ({ fetch }, { objectId }) =>
              decodeJson(
                await fetch(`${base}/settings/objects/${id(objectId)}`, { method: "DELETE", signal, headers: authHeaders(account) }),
                json(),
              ),
          ),
        },
        { title: "Settings", description: "Settings 2.0 schemas and objects (alerting, management zones, ...)." },
      ),
      audit: router(
        {
          logs: query(
            {
              description: "List audit log entries (who changed what). filter uses the audit log filter syntax, for example category(\"CONFIG\").",
              input: object({ filter: string().optional(), sort: string().optional(), ...window, ...page }),
            },
            async ({ fetch }, input) => get(fetch, "/auditlogs", input),
          ),
        },
        { title: "Audit", description: "Audit log of configuration and access changes." },
      ),
      releases: router(
        {
          list: query(
            {
              description: "List releases (deployed versions) with their monitored entities. releaseSelector and entitySelector filter.",
              input: object({
                releaseSelector: string().optional(),
                entitySelector: string().optional(),
                ...window,
                ...page,
              }),
            },
            async ({ fetch }, input) => get(fetch, "/releases", input),
          ),
        },
        { title: "Releases", description: "Release and deployment tracking." },
      ),
      extensions: router(
        {
          list: query(
            {
              description: "List extensions 2.0 available in the environment, or the monitoring configurations of one extension by name.",
              input: object({ extensionName: string().optional(), ...page }),
            },
            async ({ fetch }, { extensionName, ...rest }) =>
              extensionName === undefined
                ? get(fetch, "/extensions", rest)
                : get(fetch, `/extensions/${id(extensionName)}/monitoringConfigurations`, rest),
          ),
        },
        { title: "Extensions", description: "Extensions 2.0 and their monitoring configurations." },
      ),
      synthetic: router(
        {
          locations: query(
            {
              description: "List synthetic monitoring locations (public, private and cluster).",
              input: object({ type: string().optional(), capability: string().optional() }),
            },
            async ({ fetch }, input) => get(fetch, "/synthetic/locations", input),
          ),
          nodes: query(
            {
              description: "List synthetic monitoring nodes (Active Gates that run synthetic tests).",
              input: object({}),
            },
            async ({ fetch }) => get(fetch, "/synthetic/nodes"),
          ),
        },
        { title: "Synthetic", description: "Synthetic monitoring locations and nodes." },
      ),
      networkZones: query(
        {
          description: "List network zones, or fetch one by ID.",
          input: object({ networkZoneId: string().optional() }),
        },
        async ({ fetch }, { networkZoneId }) =>
          networkZoneId === undefined ? get(fetch, "/networkZones") : get(fetch, `/networkZones/${id(networkZoneId)}`),
      ),
      apiTokens: query(
        {
          description: "List API tokens of the environment (metadata only, never the secret), or fetch one by ID. Needs the apiTokens.read scope.",
          input: object({ tokenId: string().optional(), apiTokenSelector: string().optional(), ...page }),
        },
        async ({ fetch }, { tokenId, ...rest }) =>
          tokenId === undefined ? get(fetch, "/apiTokens", rest) : get(fetch, `/apiTokens/${id(tokenId)}`),
      ),
    },
    {
      title: "Dynatrace",
      description:
        "Observability with the Dynatrace Environment API v2: problems, entities, metrics, events, logs, SLOs, security problems, settings and more.",
      instructions:
        "Time parameters (from, to) accept ISO 8601, milliseconds since epoch, or relative values such as now-2h. List tools return nextPageKey when more pages exist; pass only nextPageKey to fetch the next page. Selectors (entitySelector, problemSelector, metricSelector) use Dynatrace's selector syntax.",
    },
  );
};

export default defineApp({ user: { accounts: { dynatrace: dynatrace.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.dynatrace ?? [], (account) => tools(account, signal), { signal }), {
    title: "Dynatrace",
    description: "Problems, entities, metrics, events, logs, SLOs and settings from the Dynatrace Environment API v2.",
    icons,
  }),
}));
