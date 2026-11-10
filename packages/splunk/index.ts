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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Splunk is hosted per customer (Splunk Cloud Platform stacks or self-managed servers), so the management
// host and port are part of the account. Self-managed servers can live on any domain, so the provider
// cannot declare a fixed `hosts` list; the token reaches app code and is only ever sent to the validated
// https origin built here.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Splunk management host and port, for example my-splunk.example.com:8089.");
  }
  if (url.protocol !== "https:") throw new Error("Splunk must be reached over https.");
  if (!/^[a-zA-Z0-9.-]+$/.test(url.hostname)) throw new Error("The Splunk host may contain only letters, digits, dots and hyphens.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "")
    throw new Error("Enter only the host and port, with no path or credentials.");
  return url.origin;
}

const splunk = defineProvider({
  name: "Splunk",
  auth: {
    // An authentication token (Settings > Tokens) or a session key; both are sent as a Bearer token.
    token: secrets({
      label: "Authentication token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const response = await fetch(`${origin}/services/authentication/current-context?output_mode=json`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    const host = new URL(origin).host;
    return { accountInfo: { externalId: host, displayName: host } };
  },
});

type Fields = { host: string; token: string };
type Params = Record<string, unknown>;

const segment = /^[A-Za-z0-9_.\-@ ]+$/;
function seg(value: unknown, what: string): string {
  const text = String(value);
  if (!segment.test(text) || text === "." || text === "..") throw new Error(`${what} may contain only letters, digits and _ . - @ spaces.`);
  return encodeURIComponent(text);
}

// /servicesNS/<owner>/<app>/... when a namespace is given, otherwise the user's default /services/...
function base(input: Params): string {
  if (input.app === undefined && input.owner === undefined) return "/services";
  return `/servicesNS/${seg(input.owner ?? "-", "owner")}/${seg(input.app ?? "-", "app")}`;
}

async function call(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined, path: string, params: Params = {}, method = "GET") {
  const origin = originOf(fields.host);
  const body = new URLSearchParams({ output_mode: "json" });
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    body.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const get = method === "GET" || method === "DELETE";
  const response = await fetcher(get ? `${origin}${path}?${body}` : `${origin}${path}`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${fields.token}`,
      Accept: "application/json",
      ...(get ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    ...(get ? {} : { body: body.toString() }),
  });
  return decodeJson(response, json());
}

const ns = { owner: string().optional(), app: string().optional() };
const page = { count: number().optional(), offset: number().optional(), search: string().optional(), sort_key: string().optional(), sort_dir: string().optional() };
const form = record(string());

export default defineApp(
  { user: { accounts: { splunk: splunk.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.splunk ?? [],
        (account) => {
          const f = account.fields;
          const run = (path: string, params?: Params, method?: string) => call(f, fetch, signal, path, params, method);

          // list/get/create/update/delete over a Splunk configuration endpoint.
          const config = (endpoint: string, noun: string, create: boolean, remove: boolean) => ({
            list: query(
              { description: `List ${noun}. count 0 returns all; filter with search and page with offset.`, input: object({ ...ns, ...page }) },
              async (_ctx, i: Params) => run(`${base(i)}/${endpoint}`, { count: i.count, offset: i.offset, search: i.search, sort_key: i.sort_key, sort_dir: i.sort_dir }),
            ),
            get: query(
              { description: `Retrieve one of the ${noun} by name.`, input: object({ name: string(), ...ns }) },
              async (_ctx, i: Params) => run(`${base(i)}/${endpoint}/${seg(i.name, "name")}`),
            ),
            ...(create
              ? {
                  create: mutation(
                    { description: `Create one of the ${noun}. name plus the endpoint's own form parameters (see Splunk REST API reference).`, input: object({ name: string(), ...ns, params: form.optional() }) },
                    async (_ctx, i: Params) => run(`${base(i)}/${endpoint}`, { ...(i.params as Params), name: i.name }, "POST"),
                  ),
                }
              : {}),
            update: mutation(
              { description: `Update one of the ${noun} by name; params are the endpoint's form parameters to change.`, input: object({ name: string(), ...ns, params: form }) },
              async (_ctx, i: Params) => run(`${base(i)}/${endpoint}/${seg(i.name, "name")}`, i.params as Params, "POST"),
            ),
            ...(remove
              ? {
                  delete: mutation(
                    { description: `Delete one of the ${noun} by name.`, input: object({ name: string(), ...ns }) },
                    async (_ctx, i: Params) => run(`${base(i)}/${endpoint}/${seg(i.name, "name")}`, {}, "DELETE"),
                  ),
                }
              : {}),
          });

          const jobPath = (i: Params) => `${base(i)}/search/jobs/${seg(i.sid, "sid")}`;

          return withApprovals(
            router({
              server: router(
                {
                  info: query({ description: "Server name, version, build, license and OS information.", input: object({}) }, async () => run("/services/server/info")),
                  currentContext: query({ description: "The authenticated user, roles and capabilities.", input: object({}) }, async () => run("/services/authentication/current-context")),
                  settings: query({ description: "Server settings (host name, ports, paths).", input: object({}) }, async () => run("/services/server/settings")),
                  health: query({ description: "Overall splunkd health status and feature health tree.", input: object({}) }, async () => run("/services/server/health/splunkd/details")),
                  messages: query({ description: "System messages shown in Splunk Web.", input: object({}) }, async () => run("/services/messages")),
                },
                { title: "Server", description: "Instance information and health." },
              ),
              search: router(
                {
                  oneshot: mutation(
                    {
                      description:
                        "Run a search synchronously and return its results in the response (requires approval because SPL can write data, for example outputlookup or collect). search is SPL and must start with a generating command or 'search ' (for example 'search index=main error | head 10'). Suitable for short searches; use jobs.create for long ones.",
                      input: object({ search: string(), earliest_time: string().optional(), latest_time: string().optional(), count: number().optional(), offset: number().optional(), ...ns }),
                    },
                    async (_ctx, i: Params) =>
                      run(`${base(i)}/search/jobs`, { search: i.search, earliest_time: i.earliest_time, latest_time: i.latest_time, count: i.count ?? 100, offset: i.offset, exec_mode: "oneshot" }, "POST"),
                  ),
                  jobs: router({
                    list: query({ description: "List search jobs (sids) visible to the user.", input: object({ ...ns, ...page }) }, async (_ctx, i: Params) =>
                      run(`${base(i)}/search/jobs`, { count: i.count, offset: i.offset, search: i.search, sort_key: i.sort_key, sort_dir: i.sort_dir })),
                    create: mutation(
                      {
                        description: "Start an asynchronous search job and return its sid. Poll jobs.get until dispatchState is DONE, then read jobs.results. search is SPL beginning with a generating command or 'search '.",
                        input: object({ search: string(), earliest_time: string().optional(), latest_time: string().optional(), max_count: number().optional(), ...ns }),
                      },
                      async (_ctx, i: Params) =>
                        run(`${base(i)}/search/jobs`, { search: i.search, earliest_time: i.earliest_time, latest_time: i.latest_time, max_count: i.max_count }, "POST"),
                    ),
                    get: query({ description: "Job status: dispatchState, isDone, doneProgress, resultCount, eventCount.", input: object({ sid: string(), ...ns }) }, async (_ctx, i: Params) => run(jobPath(i))),
                    results: query(
                      { description: "Results of a finished (or partly finished) transforming search.", input: object({ sid: string(), ...ns, count: number().optional(), offset: number().optional(), fields: string().optional() }) },
                      async (_ctx, i: Params) => run(`${jobPath(i)}/results`, { count: i.count ?? 100, offset: i.offset, f: i.fields }),
                    ),
                    events: query(
                      { description: "Raw events matched by a job.", input: object({ sid: string(), ...ns, count: number().optional(), offset: number().optional(), fields: string().optional() }) },
                      async (_ctx, i: Params) => run(`${jobPath(i)}/events`, { count: i.count ?? 100, offset: i.offset, f: i.fields }),
                    ),
                    summary: query({ description: "Field summary statistics for a job's events.", input: object({ sid: string(), ...ns }) }, async (_ctx, i: Params) => run(`${jobPath(i)}/summary`)),
                    control: mutation(
                      { description: "Control a running job. action is one of pause, unpause, finalize, cancel, touch, setttl, setpriority, enablepreview, disablepreview.", input: object({ sid: string(), action: string(), ...ns, ttl: number().optional(), priority: number().optional() }) },
                      async (_ctx, i: Params) => run(`${jobPath(i)}/control`, { action: i.action, ttl: i.ttl, priority: i.priority }, "POST"),
                    ),
                    delete: mutation({ description: "Delete a search job and its results.", input: object({ sid: string(), ...ns }) }, async (_ctx, i: Params) => run(jobPath(i), {}, "DELETE")),
                  }, { title: "Search jobs", description: "Asynchronous search jobs." }),
                  parse: query(
                    { description: "Parse and validate an SPL query without running it.", input: object({ q: string(), ...ns }) },
                    async (_ctx, i: Params) => run(`${base(i)}/search/parser`, { q: i.q, parse_only: "true" }),
                  ),
                },
                { title: "Search", description: "Run SPL searches and read their results." },
              ),
              savedSearches: router(
                {
                  ...config("saved/searches", "saved searches, reports and alerts", true, true),
                  dispatch: mutation(
                    { description: "Run a saved search now and return the sid of the job.", input: object({ name: string(), ...ns, dispatch_earliest_time: string().optional(), dispatch_latest_time: string().optional() }) },
                    async (_ctx, i: Params) => run(`${base(i)}/saved/searches/${seg(i.name, "name")}/dispatch`, { "dispatch.earliest_time": i.dispatch_earliest_time, "dispatch.latest_time": i.dispatch_latest_time }, "POST"),
                  ),
                  history: query({ description: "Jobs previously dispatched by a saved search.", input: object({ name: string(), ...ns }) }, async (_ctx, i: Params) => run(`${base(i)}/saved/searches/${seg(i.name, "name")}/history`)),
                  firedAlerts: query({ description: "Triggered (fired) alerts.", input: object({ ...ns, count: number().optional(), offset: number().optional() }) }, async (_ctx, i: Params) => run(`${base(i)}/alerts/fired_alerts`, { count: i.count, offset: i.offset })),
                },
                { title: "Saved searches", description: "Reports, scheduled searches and alerts." },
              ),
              indexes: router(
                {
                  ...config("data/indexes", "indexes", true, true),
                },
                { title: "Indexes", description: "Event and metrics indexes." },
              ),
              apps: router(config("apps/local", "installed apps", false, true), { title: "Apps", description: "Installed apps." }),
              dashboards: router(config("data/ui/views", "dashboards and views", true, true), { title: "Dashboards", description: "Dashboards (Simple XML and Dashboard Studio views). Create with params {\"eai:data\": \"<xml or json>\"}." }),
              macros: router(config("configs/conf-macros", "search macros", true, true), { title: "Search macros", description: "Search macros." }),
              eventTypes: router(config("saved/eventtypes", "event types", true, true), { title: "Event types", description: "Event types." }),
              tags: router(config("search/tags", "tags", false, true), { title: "Tags", description: "Field-value tags." }),
              lookups: router(config("data/lookup-table-files", "lookup table files", false, true), { title: "Lookups", description: "Lookup table files." }),
              inputs: router(
                {
                  hecTokens: router(config("data/inputs/http", "HTTP Event Collector tokens", true, true), { title: "HEC tokens", description: "HTTP Event Collector tokens." }),
                  monitor: router(config("data/inputs/monitor", "file and directory monitor inputs", true, true), { title: "Monitor inputs", description: "File and directory monitors." }),
                  tcp: router(config("data/inputs/tcp/raw", "raw TCP inputs", true, true), { title: "TCP inputs", description: "Raw TCP data inputs." }),
                  udp: router(config("data/inputs/udp", "UDP inputs", true, true), { title: "UDP inputs", description: "UDP data inputs." }),
                },
                { title: "Data inputs", description: "Ways data gets into Splunk." },
              ),
              users: router(config("authentication/users", "users", true, true), { title: "Users", description: "Splunk users." }),
              roles: router(config("authorization/roles", "roles", true, true), { title: "Roles", description: "Roles and their capabilities." }),
              tokens: router(
                {
                  list: query({ description: "List authentication tokens of the current user (or any user with admin).", input: object({}) }, async () => run("/services/authorization/tokens")),
                  create: mutation(
                    { description: "Create an authentication token for a user. The token value is returned once.", input: object({ name: string(), audience: string(), expires_on: string().optional(), not_before: string().optional() }) },
                    async (_ctx, i: Params) => run("/services/authorization/tokens", { name: i.name, audience: i.audience, expires_on: i.expires_on, not_before: i.not_before }, "POST"),
                  ),
                },
                { title: "Tokens", description: "Authentication tokens." },
              ),
              kvstore: router(
                {
                  status: query({ description: "KV store status.", input: object({}) }, async () => run("/services/kvstore/status")),
                  collections: router(config("storage/collections/config", "KV store collections", true, true), { title: "Collections", description: "KV store collection definitions." }),
                  records: router(
                    {
                      query: query(
                        { description: "Query records of a collection. query is a MongoDB-style JSON filter string, e.g. {\"status\":\"open\"}.", input: object({ collection: string(), app: string(), owner: string().optional(), query: string().optional(), limit: number().optional(), skip: number().optional(), fields: string().optional(), sort: string().optional() }) },
                        async (_ctx, i: Params) => run(`/servicesNS/${seg(i.owner ?? "nobody", "owner")}/${seg(i.app, "app")}/storage/collections/data/${seg(i.collection, "collection")}`, { query: i.query, limit: i.limit, skip: i.skip, fields: i.fields, sort: i.sort }),
                      ),
                      insert: mutation(
                        { description: "Insert one record (a JSON object) into a collection.", input: object({ collection: string(), app: string(), owner: string().optional(), record: record(json()) }) },
                        async (_ctx, i: Params) => {
                          const origin = originOf(f.host);
                          const response = await fetch(`${origin}/servicesNS/${seg(i.owner ?? "nobody", "owner")}/${seg(i.app, "app")}/storage/collections/data/${seg(i.collection, "collection")}?output_mode=json`, {
                            method: "POST",
                            signal,
                            headers: { Authorization: `Bearer ${f.token}`, "Content-Type": "application/json", Accept: "application/json" },
                            body: JSON.stringify(i.record),
                          });
                          return decodeJson(response, json());
                        },
                      ),
                      delete: mutation(
                        { description: "Delete one record by _key.", input: object({ collection: string(), app: string(), owner: string().optional(), key: string() }) },
                        async (_ctx, i: Params) => run(`/servicesNS/${seg(i.owner ?? "nobody", "owner")}/${seg(i.app, "app")}/storage/collections/data/${seg(i.collection, "collection")}/${seg(i.key, "key")}`, {}, "DELETE"),
                      ),
                    },
                    { title: "Records", description: "Records within a KV store collection." },
                  ),
                },
                { title: "KV store", description: "App key-value store." },
              ),
              request: router(
                {
                  get: query(
                    { description: "GET any Splunk REST path under /services or /servicesNS (for example /services/data/indexes/main), for endpoints without a named tool. params become query parameters.", input: object({ path: string(), params: form.optional() }) },
                    async (_ctx, i: Params) => run(restPath(i.path), i.params as Params),
                  ),
                  post: mutation(
                    { description: "POST form parameters to any Splunk REST path under /services or /servicesNS.", input: object({ path: string(), params: form.optional() }) },
                    async (_ctx, i: Params) => run(restPath(i.path), i.params as Params, "POST"),
                  ),
                  delete: mutation(
                    { description: "DELETE any Splunk REST path under /services or /servicesNS.", input: object({ path: string() }) },
                    async (_ctx, i: Params) => run(restPath(i.path), {}, "DELETE"),
                  ),
                },
                { title: "Raw REST", description: "Escape hatch for any other Splunk REST endpoint." },
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Splunk",
        description: "Run SPL searches and manage saved searches, indexes, apps, dashboards, inputs, users, roles and KV store collections on a Splunk Enterprise or Splunk Cloud Platform instance.",
        icons,
      },
    ),
  }),
);

function restPath(raw: unknown): string {
  const path = String(raw);
  if (!/^\/services(NS)?\/[A-Za-z0-9_.\-@ /]*$/.test(path) || path.split("/").some((part) => part === ".." || part === ".")) {
    throw new Error("path must start with /services/ or /servicesNS/ and contain no '..' segments.");
  }
  return path;
}
