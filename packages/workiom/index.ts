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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.workiom.com";

const workiom = defineProvider({
  name: "Workiom",
  hosts: ["api.workiom.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists the apps the key can see: read-only and the call Workiom's own guide uses to test a key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/services/app/Apps/GetAll`, {
      signal,
      headers: { "X-Api-Key": account.fields.token, accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | readonly string[] | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, params: Params, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, item);
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-Api-Key": token,
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  return {
    get: (path: string, params: Params = {}) => call("GET", path, params),
    send: (method: "POST" | "PUT", path: string, params: Params, body: unknown) => call(method, path, params, body),
  };
}

const listId = string({ minLength: 1 });
const recordBody = record(json());

const filter = object({
  fieldId: string({ minLength: 1 }),
  operator: number(),
  value: json().optional(),
});

function tools(c: ReturnType<typeof client>) {
  return router({
    apps: router({
      list: query(
        { description: "List the Workiom apps the API key can access.", input: object({}) },
        async () => c.get("/api/services/app/Apps/GetAll"),
      ),
    }),
    lists: router({
      list: query(
        {
          description: "List the lists (tables) in a Workiom app. Get appId from apps.list. Unverified: this endpoint (Lists/GetAll) is not in the public guide and may fail.",
          input: object({ appId: string({ minLength: 1 }) }),
        },
        async (_ctx, { appId }) => c.get("/api/services/app/Lists/GetAll", { appId }),
      ),
      get: query(
        {
          description:
            "Get one list's metadata. Record fields are keyed by field id, so read the fields here (ids and data types) before querying or writing records. expand is a subset of Fields, Views, Filters (sent as repeated expand= parameters); it defaults to all three.",
          input: object({ id: listId, expand: array(string()).optional() }),
        },
        async (_ctx, { id, expand }) =>
          c.get("/api/services/app/Lists/Get", { id, expand: expand ?? ["Fields", "Views", "Filters"] }),
      ),
    }),
    records: router({
      query: query(
        {
          description:
            "Query records in a list with optional filters, sorting and paging. Filter operators: Contains=1, DoesNotContain=2, Is=3, IsNot=4, Greater=5, Less=6, IsEmpty=7, IsNotEmpty=8, GreaterOrEqual=9, LessOrEqual=10, Between=11, In=12, NotIn=13. sorting is a string like '11284 ASC' (field id then ASC or DESC).",
          input: object({
            listId,
            filters: array(filter).optional(),
            sorting: string().optional(),
            maxResultCount: number().optional(),
            skipCount: number().optional(),
          }),
        },
        async (_ctx, input) =>
          c.send("POST", "/api/services/app/Data/All", {}, input),
      ),
      create: mutation(
        {
          description:
            "Create a record in a list. record is an object keyed by field id. Value shapes: LinkList [{_id, label}], StaticSelect {id, label}, User {id, username} (Workiom's guide is inconsistent here, its Create example uses {id, label}; unverified); plain text, numbers and booleans are sent as they are.",
          input: object({ listId, record: recordBody }),
          approval: always(),
        },
        async (_ctx, { listId, record }) =>
          c.send("POST", "/api/services/app/Data/Create", { listId }, record),
      ),
      update: mutation(
        {
          description:
            "Replace a record in full. Fields missing from record are cleared; use records.updatePartial to change only some fields.",
          input: object({ listId, id: string({ minLength: 1 }), record: recordBody }),
          approval: always(),
        },
        async (_ctx, { listId, id, record }) =>
          c.send("PUT", "/api/services/app/Data/Update", { listId, id }, record),
      ),
      updatePartial: mutation(
        {
          description: "Update only the fields given in record, leaving the rest of the record unchanged. Caution: Workiom's guide documents an Authorization Bearer header for this endpoint (undocumented token source) while this tool sends the API key, so it may return 401.",
          input: object({ listId, id: string({ minLength: 1 }), record: recordBody }),
          approval: always(),
        },
        async (_ctx, { listId, id, record }) =>
          c.send("PUT", "/api/services/app/Data/UpdatePartial", { listId, id }, record),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { workiom: workiom.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.workiom ?? [], (account) => tools(client(account.fields.token, fetch, signal)), {
        signal,
      }),
      {
        title: "Workiom",
        description: "Workiom no-code workflow apps: list apps and lists, read list metadata, and query, create and update records.",
        icons,
      },
    ),
  }),
);
