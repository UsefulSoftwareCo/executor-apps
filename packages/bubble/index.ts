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
  plain,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Bubble app has its own host (appname.bubbleapps.io). Apps on a custom domain are not
// covered: Executor must know the hosts that may receive the API token.
const bubble = defineProvider({
  name: "Bubble",
  hosts: ["*.bubbleapps.io"],
  auth: {
    apiKey: secrets({
      label: "Admin API token (Settings > API in the Bubble editor). Bypasses privacy rules: full database access",
      fields: object({
        appUrl: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // The Swagger document is served only to a valid token and costs no workload units.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${apiBase(account.fields.appUrl)}/meta/swagger.json`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

// appUrl is the app's base URL, e.g. https://myapp.bubbleapps.io or, for the development
// version, https://myapp.bubbleapps.io/version-test. A trailing /api/1.1 is accepted.
function apiBase(appUrl: string): string {
  const trimmed = appUrl.trim().replace(/\/+$/, "").replace(/\/api\/1\.1$/, "");
  const url = new URL(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
  if (url.protocol !== "https:") throw new Error("Bubble app URL must use https");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/api/1.1`;
}

type Fetch = typeof fetch;

function client(appUrl: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = apiBase(appUrl);
  const headers = (extra: Record<string, string> = {}) => ({ authorization: `Bearer ${token}`, ...extra });
  const segment = (value: string) => encodeURIComponent(value);
  const check = async (response: Response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bubble returned ${response.status}: ${text.slice(0, 500)}`);
    }
    return response;
  };
  return {
    get: async (path: string, params: Record<string, string | undefined> = {}) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, value);
      return decodeJson(await fetcher(url.toString(), { signal, headers: headers() }), json());
    },
    send: async (method: string, path: string, body: unknown) => {
      const response = await check(
        await fetcher(`${base}${path}`, {
          method,
          signal,
          headers: headers({ "content-type": "application/json" }),
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      );
      const text = await response.text();
      if (text === "") return { status: response.status };
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return { status: response.status, body: text };
      }
    },
    sendGet: async (path: string, params: Record<string, unknown>) => {
      const url = new URL(`${base}${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
      }
      const response = await check(await fetcher(url.toString(), { signal, headers: headers() }));
      const text = await response.text();
      if (text === "") return { status: response.status };
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return { status: response.status, body: text };
      }
    },
    bulk: async (path: string, lines: string) => {
      const response = await check(
        await fetcher(`${base}${path}`, {
          method: "POST",
          signal,
          headers: headers({ "content-type": "text/plain" }),
          body: lines,
        }),
      );
      return { status: response.status, body: await response.text() };
    },
    segment,
  };
}

const Type = string({ minLength: 1 });

const tools = (c: ReturnType<typeof client>) =>
  router({
    things: router(
      {
        list: query(
          {
            description:
              "Search and page through records of a data type. constraints is a list of { key, constraint_type, value } (types: equals, not equal, is_empty, is_not_empty, text contains, not text contains, greater than, less than, in, not in, contains, not contains, empty, not empty, geographic_search). Returns { response: { cursor, results, count, remaining } }. A search reaches at most 50,000 records.",
            input: object({
              type: Type,
              constraints: array(object({ key: string(), constraint_type: string(), value: json().optional() })).optional(),
              cursor: number().optional(),
              limit: number().optional(),
              sortField: string().optional(),
              descending: boolean().optional(),
              additionalSortFields: array(object({ sort_field: string(), descending: boolean().optional() })).optional(),
              excludeRemaining: boolean().optional(),
            }),
          },
          async (_ctx, i) =>
            c.get(`/obj/${c.segment(i.type)}`, {
              constraints: i.constraints ? JSON.stringify(i.constraints) : undefined,
              cursor: i.cursor?.toString(),
              limit: i.limit?.toString(),
              sort_field: i.sortField,
              descending: i.descending?.toString(),
              additional_sort_fields: i.additionalSortFields ? JSON.stringify(i.additionalSortFields) : undefined,
              exclude_remaining: i.excludeRemaining?.toString(),
            }),
        ),
        get: query(
          { description: "Get one record by its unique ID.", input: object({ type: Type, id: Type }) },
          async (_ctx, { type, id }) => c.get(`/obj/${c.segment(type)}/${c.segment(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a record. fields maps the type's field keys (as returned by get) to values. Returns { status, id }. For the User type, email is required (Bubble Data API docs).",
            input: object({ type: Type, fields: record(json()) }),
            approval: always(),
          },
          async (_ctx, { type, fields }) => c.send("POST", `/obj/${c.segment(type)}`, fields),
        ),
        bulkCreate: mutation(
          {
            description:
              "Create up to 1,000 records of one type in a single request. Returns one result line per record as text. Costs a lot of app capacity; test with a few records first. Bubble stops the request after 4 minutes and marks unfinished records as errors.",
            input: object({ type: Type, records: array(record(json())) }),
            approval: always(),
          },
          async (_ctx, { type, records }) =>
            c.bulk(`/obj/${c.segment(type)}/bulk`, records.map((r) => JSON.stringify(r)).join("\n")),
        ),
        update: mutation(
          {
            description: "Change only the given fields of a record (PATCH).",
            input: object({ type: Type, id: Type, fields: record(json()) }),
            approval: always(),
          },
          async (_ctx, { type, id, fields }) => c.send("PATCH", `/obj/${c.segment(type)}/${c.segment(id)}`, fields),
        ),
        replace: mutation(
          {
            description: "Overwrite all editable fields of a record (PUT). Omitted fields reset to empty or their default.",
            input: object({ type: Type, id: Type, fields: record(json()) }),
            approval: always(),
          },
          async (_ctx, { type, id, fields }) => c.send("PUT", `/obj/${c.segment(type)}/${c.segment(id)}`, fields),
        ),
        delete: mutation(
          {
            description: "Permanently delete a record by its unique ID.",
            input: object({ type: Type, id: Type }),
            approval: always(),
          },
          async (_ctx, { type, id }) => c.send("DELETE", `/obj/${c.segment(type)}/${c.segment(id)}`, undefined),
        ),
      },
      { title: "Things", description: "Records of the app's data types through the Data API (only types marked active in the app's Data API settings)." },
    ),
    workflows: router(
      {
        run: mutation(
          {
            description:
              "Run an exposed API workflow by name, sending params as a JSON body (POST). Use runGet for workflows configured as GET. Workflows can have any side effect and return whatever the app defines.",
            input: object({ workflow: Type, params: record(json()).optional() }),
            approval: always(),
          },
          async (_ctx, { workflow, params }) => c.send("POST", `/wf/${c.segment(workflow)}`, params ?? {}),
        ),
        runGet: mutation(
          {
            description:
              "Run an exposed API workflow whose method is GET, sending params as a querystring (string values; objects and arrays are JSON-encoded). Workflows can have any side effect even when triggered by GET.",
            input: object({ workflow: Type, params: record(json()).optional() }),
            approval: always(),
          },
          async (_ctx, { workflow, params }) =>
            c.sendGet(`/wf/${c.segment(workflow)}`, params ?? {}),
        ),
      },
      { title: "Workflows", description: "Backend API workflows exposed by the app (POST or GET, as each workflow is configured)." },
    ),
    meta: router(
      {
        swagger: query(
          {
            description:
              "The app's own Swagger 2.0 document: the data types and API workflows enabled for this token, with their fields and parameters. Read it first to learn exact type and field names.",
            input: object({}),
          },
          async () => c.get("/meta/swagger.json"),
        ),
      },
      { title: "Meta", description: "Describes the app's API." },
    ),
  });

export default defineApp(
  { user: { accounts: { bubble: bubble.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bubble ?? [],
        (account) => tools(client(account.fields.appUrl, account.fields.token, fetch, signal)),
        { signal },
      ),
      {
        title: "Bubble",
        description: "Records and API workflows of one Bubble app: search, create, update and delete things and run backend workflows.",
        instructions:
          "Each account is one Bubble app (one app URL and API token). Call meta.swagger first to see the data types and workflows the app exposes; a data type must be active in the app's Data API settings to be reachable. The token is an admin token: it bypasses privacy rules, so every record of those types is readable and writable. Type and field names are the API names shown there, not the editor labels.",
        icons,
      },
    ),
  }),
);
