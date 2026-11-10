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

const base = "https://api.keen.io/3.0";

const keen = defineProvider({
  name: "Keen.io",
  hosts: ["api.keen.io"],
  auth: {
    apiKey: secrets({
      label: "Project ID and keys",
      fields: object({
        projectId: string({ minLength: 1 }),
        masterKey: string({ minLength: 1 }),
      }),
    }),
  },
  // Listing the project's collections is read-only and works with the master key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/projects/${encodeURIComponent(account.fields.projectId)}/events`, {
      signal,
      headers: { Authorization: account.fields.masterKey, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { projectId: string; masterKey: string } };

const enc = encodeURIComponent;
const project = (account: Account) => `${base}/projects/${enc(account.fields.projectId)}`;
const headers = (account: Account) => ({
  Authorization: account.fields.masterKey,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const timeframe = json();
const filters = array(record(json())).optional();
const common = {
  event_collection: string(),
  timeframe: timeframe.optional(),
  filters,
  group_by: json().optional(),
  interval: string().optional(),
  timezone: json().optional(),
};

const keenTools = (account: Account, signal: AbortSignal) => {
  const analysis = (name: string, description: string, needsTarget: boolean) =>
    query(
      {
        description,
        input: needsTarget
          ? object({ ...common, target_property: string() })
          : object({ ...common, target_property: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/queries/${name}`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    );

  const timeframeNote =
    " timeframe is a relative string such as this_30_days or previous_7_days, or an object {start, end} of ISO 8601 times. group_by is a property name or array of names, interval is minutely, hourly, daily, weekly, monthly, quarterly or yearly, and filters is an array of {property_name, operator, property_value}.";

  return router({
    recordEvent: mutation(
      {
        description:
          "Record one event in a collection. The event is a JSON object; set keen.timestamp to backdate it. Needs a key with write access (the master key works). Events can take about 10 seconds to appear in queries.",
        input: object({ collection: string(), event: record(json()) }),
        approval: always(),
      },
      async ({ fetch }, { collection, event }) =>
        decodeJson(
          await fetch(`${project(account)}/events/${enc(collection)}`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(event),
          }),
          json(),
        ),
    ),
    recordEvents: mutation(
      {
        description:
          "Record many events across collections in one request. events maps each collection name to an array of event objects. Keep batches to 5,000 events or fewer. Returns a per-event success result.",
        input: object({ events: record(array(record(json()))) }),
        approval: always(),
      },
      async ({ fetch }, { events }) =>
        decodeJson(
          await fetch(`${project(account)}/events`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(events),
          }),
          json(),
        ),
    ),
    listCollections: query(
      {
        description:
          "List the event collections in the project with their properties. Set include_schema to true to include property types.",
        input: object({ include_schema: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/events?${search(input)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getCollection: query(
      {
        description: "Get the schema of one event collection: properties and their types, plus the URL of each property.",
        input: object({ collection: string() }),
      },
      async ({ fetch }, { collection }) =>
        decodeJson(
          await fetch(`${project(account)}/events/${enc(collection)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getProperty: query(
      {
        description: "Get the type and sample information of one property in a collection.",
        input: object({ collection: string(), property: string() }),
      },
      async ({ fetch }, { collection, property }) =>
        decodeJson(
          await fetch(`${project(account)}/events/${enc(collection)}/properties/${enc(property)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    count: analysis("count", "Count the events in a collection over a timeframe." + timeframeNote, false),
    countUnique: analysis(
      "count_unique",
      "Count the distinct values of target_property across matching events." + timeframeNote,
      true,
    ),
    minimum: analysis("minimum", "Minimum numeric value of target_property across matching events." + timeframeNote, true),
    maximum: analysis("maximum", "Maximum numeric value of target_property across matching events." + timeframeNote, true),
    sum: analysis("sum", "Sum of target_property across matching events." + timeframeNote, true),
    average: analysis("average", "Average of target_property across matching events." + timeframeNote, true),
    median: analysis("median", "Median of target_property across matching events." + timeframeNote, true),
    percentile: query(
      {
        description:
          "Percentile (0-100, up to two decimals) of target_property across matching events. Approximated above 1,000,000 values." +
          timeframeNote,
        input: object({ ...common, target_property: string(), percentile: number() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/queries/percentile`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    selectUnique: analysis(
      "select_unique",
      "List the distinct values of target_property across matching events. Missing values count as a value; add an exists filter to avoid that." +
        timeframeNote,
      true,
    ),
    multiAnalysis: query(
      {
        description:
          "Run several analyses over the same events in one request. analyses maps a label to {analysis_type, target_property?, percentile?} where analysis_type is count, count_unique, minimum, maximum, sum, average, median, percentile, select_unique or standard_deviation." +
          timeframeNote,
        input: object({ ...common, analyses: record(json()) }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/queries/multi_analysis`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    funnel: query(
      {
        description:
          "Run a funnel over ordered steps. Each step is {event_collection, actor_property, timeframe?, timezone?, filters?, inverted?, optional?, with_actors?}; the first step cannot be inverted or optional. timeframe and timezone at the top level apply to steps that omit them. interval and group_by are not supported.",
        input: object({ steps: array(record(json())), timeframe: timeframe.optional(), timezone: json().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/queries/funnel`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    extraction: query(
      {
        description:
          "Extract raw events from a collection. Without email it returns up to 100,000 events synchronously. With email the extraction runs asynchronously and Keen emails a link to a CSV or JSON file valid for 30 days (up to 10 million events). latest limits to the most recent N events and property_names selects columns." +
          " timeframe is a relative string or {start, end}.",
        input: object({
          event_collection: string(),
          timeframe,
          filters,
          timezone: json().optional(),
          email: string().optional(),
          latest: number().optional(),
          property_names: array(string()).optional(),
          content_type: string().optional(),
          content_encoding: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/queries/extraction`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    listSavedQueries: query(
      { description: "List the project's saved query definitions, including cached ones and their run information.", input: object({}) },
      async ({ fetch }) =>
        decodeJson(await fetch(`${project(account)}/queries/saved`, { signal, headers: headers(account) }), json()),
    ),
    getSavedQuery: query(
      { description: "Get one saved query definition.", input: object({ name: string() }) },
      async ({ fetch }, { name }) =>
        decodeJson(
          await fetch(`${project(account)}/queries/saved/${enc(name)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getSavedQueryResult: query(
      {
        description:
          "Run a saved query or read its cached result. For a cached query this returns the last computed result at no extra cost.",
        input: object({ name: string() }),
      },
      async ({ fetch }, { name }) =>
        decodeJson(
          await fetch(`${project(account)}/queries/saved/${enc(name)}/result`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    putSavedQuery: mutation(
      {
        description:
          "Create or replace a saved query. Names allow letters, digits, hyphens and underscores. query is the full query definition {analysis_type, event_collection, timeframe, ...}; updates must resend the whole query and re-run it. Set refresh_rate in seconds (14400 to 172800) to cache the result. metadata may hold a display_name.",
        input: object({
          name: string(),
          query: record(json()),
          refresh_rate: number().optional(),
          metadata: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { name, ...body }) =>
        decodeJson(
          await fetch(`${project(account)}/queries/saved/${enc(name)}`, {
            method: "PUT",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    deleteSavedQuery: mutation(
      { description: "Delete a saved query.", input: object({ name: string() }), approval: always() },
      async ({ fetch }, { name }) => {
        const response = await fetch(`${project(account)}/queries/saved/${enc(name)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        return { status: response.status, ok: response.ok };
      },
    ),
    listDatasets: query(
      {
        description: "List cached dataset definitions (early release). limit is 1-100; pass after_name from the previous page to continue.",
        input: object({ limit: number().optional(), after_name: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/datasets?${search(input)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getDataset: query(
      {
        description: "Get a cached dataset's definition and status (Created, Bootstrapping, BootstrappingFailed, OK, Warn).",
        input: object({ name: string() }),
      },
      async ({ fetch }, { name }) =>
        decodeJson(
          await fetch(`${project(account)}/datasets/${enc(name)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getDatasetResults: query(
      {
        description:
          "Read results from a cached dataset. index_by is the index value (string, or JSON for several or non-string keys) and timeframe must align with the dataset's interval.",
        input: object({ name: string(), index_by: json(), timeframe, zero_fill: string().optional() }),
      },
      async ({ fetch }, { name, index_by, timeframe, zero_fill }) =>
        decodeJson(
          await fetch(
            `${project(account)}/datasets/${enc(name)}/results?${search({
              index_by: typeof index_by === "string" ? index_by : JSON.stringify(index_by),
              timeframe: typeof timeframe === "string" ? timeframe : JSON.stringify(timeframe),
              zero_fill,
            })}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
    createDataset: mutation(
      {
        description:
          "Create a cached dataset. query must use a relative timeframe whose unit matches its interval (for example this_90_days with daily) and cannot be a funnel; index_by lists up to 3 properties; display_name is a label. Datasets cannot be updated, only recreated.",
        input: object({
          name: string(),
          display_name: string(),
          query: record(json()),
          index_by: array(string()),
        }),
        approval: always(),
      },
      async ({ fetch }, { name, ...body }) =>
        decodeJson(
          await fetch(`${project(account)}/datasets/${enc(name)}`, {
            method: "PUT",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    deleteDataset: mutation(
      { description: "Delete a cached dataset.", input: object({ name: string() }), approval: always() },
      async ({ fetch }, { name }) => {
        const response = await fetch(`${project(account)}/datasets/${enc(name)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        return { status: response.status, ok: response.ok };
      },
    ),
    deleteEvents: mutation(
      {
        description:
          "Delete events from a collection that match filters and timeframe. Destructive and rate limited to 10 per minute. Without filters every event in the timeframe is deleted.",
        input: object({ collection: string(), timeframe: timeframe.optional(), filters, timezone: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { collection, ...body }) => {
        const response = await fetch(`${project(account)}/events/${enc(collection)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
          body: JSON.stringify(body),
        });
        return { status: response.status, ok: response.ok };
      },
    ),
    deleteCollection: mutation(
      {
        description:
          "Delete an entire event collection and all its events. Permanent. Collections with more than 1,000,000 events cannot be deleted this way.",
        input: object({ collection: string() }),
        approval: always(),
      },
      async ({ fetch }, { collection }) => {
        const response = await fetch(`${project(account)}/events/${enc(collection)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        return { status: response.status, ok: response.ok };
      },
    ),
    deleteProperty: mutation(
      {
        description: "Delete a property from every event in a collection. Permanent.",
        input: object({ collection: string(), property: string() }),
        approval: always(),
      },
      async ({ fetch }, { collection, property }) => {
        const response = await fetch(`${project(account)}/events/${enc(collection)}/properties/${enc(property)}`, {
          method: "DELETE",
          signal,
          headers: headers(account),
        });
        return { status: response.status, ok: response.ok };
      },
    ),
    listAccessKeys: query(
      {
        description: "List the project's access keys. name filters by exact name; page starts at 0; per_page is at most 200.",
        input: object({ name: string().optional(), page: number().optional(), per_page: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/keys?${search(input)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    getAccessKey: query(
      { description: "Get one access key by its key value.", input: object({ key: string() }) },
      async ({ fetch }, { key }) =>
        decodeJson(await fetch(`${project(account)}/keys/${enc(key)}`, { signal, headers: headers(account) }), json()),
    ),
    createAccessKey: mutation(
      {
        description:
          "Create a scoped access key. name is up to 256 characters; permitted lists any of writes, queries, saved_queries, cached_queries, datasets, schema, query_definition; options sets per-permission restrictions such as queries.filters or writes.autofill. The response contains the new key, so treat it as a secret.",
        input: object({
          name: string(),
          is_active: boolean().optional(),
          permitted: array(string()),
          options: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${project(account)}/keys`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify({ ...input, is_active: input.is_active }),
          }),
          json(),
        ),
    ),
    updateAccessKey: mutation(
      {
        description:
          "Update an access key (name, is_active, permitted, options). Set is_active to false to revoke the key without deleting it.",
        input: object({
          key: string(),
          name: string().optional(),
          is_active: boolean().optional(),
          permitted: array(string()).optional(),
          options: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { key, ...input }) =>
        decodeJson(
          await fetch(`${project(account)}/keys/${enc(key)}`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify({ ...input, is_active: input.is_active }),
          }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { keenio: keen.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.keenio ?? [], (account) => keenTools(account, signal), { signal }), {
    title: "Keen.io",
    description:
      "Record events and run analytics on Keen.io: counts, aggregations, funnels, extractions, saved queries, cached datasets and access keys.",
    icons,
  }),
}));
