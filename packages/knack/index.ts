import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const mcpUrl = "https://mcp.knack.com/mcp";
const apiBase = "https://api.knack.com/v1";

type ApiKeyFields = { appId: string; apiKey: string; objectKey: string };

const knack = defineProvider({
  name: "Knack",
  hosts: ["api.knack.com", "mcp.knack.com"],
  auth: {
    // Object-based record requests: the app's own API key and application ID (Settings > API & Code).
    apiKey: secrets({
      label: "App API key",
      fields: object({ appId: string({ minLength: 1 }), apiKey: string({ minLength: 1 }), objectKey: string({ minLength: 1 }) }),
    }),
    // The Builder MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth({ ...check, account }, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    // Documented read-only route: one record of the given object. Answers 401/403 for a wrong application ID or API key.
    const response = await fetch(
      `${apiBase}/objects/${encodeURIComponent(account.fields.objectKey)}/records?rows_per_page=1`,
      { signal, headers: recordHeaders(account.fields) },
    );
    await decodeJson(response, object({ total_records: number(), total_pages: number(), current_page: number() }));
    return { accountInfo: { externalId: account.fields.appId, displayName: `Knack app ${account.fields.appId}` } };
  },
});

function recordHeaders(fields: ApiKeyFields) {
  return {
    "X-Knack-Application-Id": fields.appId,
    "X-Knack-REST-API-Key": fields.apiKey,
    "content-type": "application/json",
  };
}

const objectKey = string({ minLength: 1 });
const recordId = string({ minLength: 1 });
const fieldValues = json();

function records(fields: ApiKeyFields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = recordHeaders(fields);
  const path = (object: string, id?: string) =>
    `${apiBase}/objects/${encodeURIComponent(object)}/records${id ? `/${encodeURIComponent(id)}` : ""}`;
  const send = async (url: string, method: string, body?: unknown) =>
    decodeJson(
      await fetcher(url, { method, signal, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
      json(),
    );

  return router({
    list: query(
      {
        description:
          "List records of an object (table). Returns records, total_records, total_pages and current_page. Use filters, sorting and paging to narrow results.",
        input: object({
          object: objectKey,
          page: number().optional(),
          rowsPerPage: number().optional(),
          sortField: string().optional(),
          sortOrder: string().optional(),
          format: string().optional(),
          filters: json().optional(),
        }),
      },
      async (_ctx, input) => {
        const params = new URLSearchParams();
        if (input.page !== undefined) params.set("page", String(input.page));
        if (input.rowsPerPage !== undefined) params.set("rows_per_page", String(input.rowsPerPage));
        if (input.sortField) params.set("sort_field", input.sortField);
        if (input.sortOrder) params.set("sort_order", input.sortOrder);
        if (input.format) params.set("format", input.format);
        if (input.filters !== undefined && input.filters !== null) params.set("filters", JSON.stringify(input.filters));
        const qs = params.toString();
        return send(`${path(input.object)}${qs ? `?${qs}` : ""}`, "GET");
      },
    ),
    get: query(
      { description: "Get one record of an object by its record ID.", input: object({ object: objectKey, id: recordId }) },
      async (_ctx, input) => send(path(input.object, input.id), "GET"),
    ),
    create: mutation(
      {
        description:
          "Create a record in an object. values maps field keys (field_12) to values, for example {\"field_1\": \"Acme\"}. Connection fields take arrays of record IDs.",
        input: object({ object: objectKey, values: fieldValues }),
        approval: always(),
      },
      async (_ctx, input) => send(path(input.object), "POST", input.values),
    ),
    update: mutation(
      {
        description: "Update a record by ID. values maps the field keys to change to their new values; other fields are left alone.",
        input: object({ object: objectKey, id: recordId, values: fieldValues }),
        approval: always(),
      },
      async (_ctx, input) => send(path(input.object, input.id), "PUT", input.values),
    ),
    delete: mutation(
      { description: "Permanently delete a record by ID.", input: object({ object: objectKey, id: recordId }), approval: always() },
      async (_ctx, input) => send(path(input.object, input.id), "DELETE"),
    ),
  }, { title: "Records", description: "Read and write records of Knack objects with the app API key." });
}

export default defineApp(
  { user: { accounts: { knack: knack.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.knack ?? [],
        async (account) => {
          if (account.method === "apiKey") return records(account.fields, fetch, signal);
          return withApprovals(
            await mcpRouter({ url: mcpUrl, account, headers: { Authorization: `Bearer ${account.fields.access_token}` }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "Knack",
        description: "Knack no-code databases: records through an app API key, or app structure (tables, fields, access control) through the Builder MCP server.",
        instructions:
          "An API key account exposes the record tools (list, get, create, update, delete) for one app; object keys look like object_1 and field keys like field_1. An OAuth account signs in with Knack Builder credentials and exposes the Builder MCP server, which manages app structure and (for early-access apps) records.",
        icons,
      },
    ),
  }),
);
