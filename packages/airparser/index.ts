import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  jsonSchema,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.airparser.com";

const airparser = defineProvider({
  name: "Airparser",
  hosts: ["api.airparser.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing inboxes is a free read that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/inboxes`, { signal, headers: { "X-API-Key": account.fields.token } });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, init: { query?: Record<string, unknown>; body?: BodyInit; contentType?: string } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { "X-API-Key": token };
    if (init.contentType !== undefined) headers["Content-Type"] = init.contentType;
    const response = await fetcher(url.toString(), { method, signal, headers, body: init.body });
    return decodeJson(response, json());
  };
  const sendJson = (method: string, path: string, body: unknown) =>
    send(method, path, { body: JSON.stringify(body), contentType: "application/json" });
  const upload = (path: string, input: { fileBase64: string; filename: string; contentType?: string | undefined; meta?: unknown }) => {
    const form = new FormData();
    const bytes = Uint8Array.from(atob(input.fileBase64), (char) => char.charCodeAt(0));
    form.append("file", new Blob([bytes], { type: input.contentType ?? "application/octet-stream" }), input.filename);
    if (input.meta !== undefined) form.append("meta", JSON.stringify(input.meta));
    return send("POST", path, { body: form });
  };
  // The vendor does not document a response body for DELETE, so accept an empty body.
  const remove = async (path: string) => {
    const response = await fetcher(`${base}${path}`, { method: "DELETE", signal, headers: { "X-API-Key": token } });
    if (!response.ok) throw new Error(`Airparser responded with HTTP ${response.status}`);
    const text = await response.text();
    if (text.trim() === "") return { deleted: true };
    try {
      return JSON.parse(text) as unknown as Record<string, unknown>;
    } catch {
      return { deleted: true };
    }
  };
  return { send, sendJson, upload, remove };
}

const inboxId = string({ minLength: 1 });
const documentId = string({ minLength: 1 });

const fieldName = { type: "string", pattern: "^[a-z][a-z0-9_]*$" };
const attribute = {
  type: "object",
  required: ["name", "description", "type"],
  properties: {
    name: fieldName,
    description: { type: "string" },
    type: { enum: ["string", "integer", "decimal", "boolean", "date"] },
    default_value: {},
  },
};
const schemaFields = jsonSchema({
  type: "array",
  minItems: 1,
  items: {
    oneOf: [
      {
        type: "object",
        required: ["type", "data"],
        properties: {
          type: { const: "scalar" },
          data: {
            type: "object",
            required: ["name", "description", "type"],
            properties: {
              name: fieldName,
              description: { type: "string" },
              type: { enum: ["string", "integer", "decimal", "boolean", "date"] },
              default_value: {},
            },
          },
        },
      },
      {
        type: "object",
        required: ["type", "data"],
        properties: {
          type: { enum: ["list", "object"] },
          data: {
            type: "object",
            required: ["name", "description", "attributes"],
            properties: { name: fieldName, description: { type: "string" }, attributes: { type: "array", items: attribute } },
          },
        },
      },
      {
        type: "object",
        required: ["type", "data"],
        properties: {
          type: { const: "enum" },
          data: {
            type: "object",
            required: ["name", "description", "values"],
            properties: { name: fieldName, description: { type: "string" }, values: { type: "array", items: { type: "string" } } },
          },
        },
      },
    ],
  },
});

const uploadInput = object({
  inboxId,
  fileBase64: string({ minLength: 1 }),
  filename: string({ minLength: 1 }),
  contentType: string().optional(),
  meta: json().optional(),
});

function build(api: ReturnType<typeof client>) {
  const { send, sendJson, upload, remove } = api;
  return router({
    inboxes: router(
      {
        list: query({ description: "List all inboxes (parsers) in the account.", input: object({}) }, async () => send("GET", "/inboxes")),
        get: query(
          { description: "Get an inbox with its parsing configuration and current extraction schema.", input: object({ inboxId }) },
          async (_ctx, { inboxId }) => send("GET", `/inboxes/${encodeURIComponent(inboxId)}`),
        ),
        create: mutation(
          {
            description: "Create an inbox. llmEngine is 'text' for text-based documents or 'vision' for scans and images.",
            input: object({ name: string({ minLength: 1 }), llmEngine: string({ minLength: 1 }) }),
            approval: always(),
          },
          async (_ctx, { name, llmEngine }) => sendJson("POST", "/inboxes/create", { name, llm_engine: llmEngine }),
        ),
        delete: mutation(
          { description: "Permanently delete an inbox. The vendor documents no response body, so an empty success response is returned as { deleted: true }.", input: object({ inboxId }), approval: always() },
          async (_ctx, { inboxId }) => remove(`/inboxes/${encodeURIComponent(inboxId)}`),
        ),
      },
      { title: "Inboxes", description: "Parsers that hold an extraction schema and the documents sent to them." },
    ),
    schema: router(
      {
        set: mutation(
          {
            description:
              "Replace an inbox's extraction schema. fields is a non-empty array; each field is { type, data } where type is scalar, list, object or enum. scalar: { type: 'scalar', data: { name, description, type: 'string'|'integer'|'decimal'|'boolean'|'date', default_value } }. list or object: { type: 'list'|'object', data: { name, description, attributes: [{ name, description, type, default_value }] } }. enum: { type: 'enum', data: { name, description, values: ['a','b'] } }. Names start with a lowercase letter and use lowercase letters, digits and underscores. The vendor returns true on success.",
            input: object({ inboxId, fields: schemaFields }),
            approval: always(),
          },
          async (_ctx, { inboxId, fields }) => sendJson("POST", `/inboxes/${encodeURIComponent(inboxId)}/schema`, { fields }),
        ),
        clone: mutation(
          {
            description: "Copies the schema to another inbox. The vendor returns true if the schema was cloned, otherwise false.",
            input: object({ inboxId, destinationInboxId: inboxId }),
            approval: always(),
          },
          async (_ctx, { inboxId, destinationInboxId }) =>
            sendJson("POST", `/inboxes/${encodeURIComponent(inboxId)}/schema-clone`, { destination_inbox_id: destinationInboxId }),
        ),
      },
      { title: "Schema", description: "Extraction schemas that define which fields are pulled from documents." },
    ),
    documents: router(
      {
        list: query(
          {
            description:
              "List documents in an inbox. Filter by from/to (YYYY-MM-DD), q (search text) and status (repeated query key; multi-value encoding is not documented by the vendor; importing, new, converting, parsing, parsed, fail, fail_pp, skipped, skipped_pp, quota, exception). per_page is 1-500, default 25.",
            input: object({
              inboxId,
              page: number().optional(),
              perPage: number().optional(),
              from: string().optional(),
              to: string().optional(),
              q: string().optional(),
              status: array(string()).optional(),
            }),
          },
          async (_ctx, { inboxId, page, perPage, from, to, q, status }) =>
            send("GET", `/inboxes/${encodeURIComponent(inboxId)}/docs`, {
              query: { page, per_page: perPage, from, to, q, status },
            }),
        ),
        get: query(
          {
            description: "Get a parsed document in compact form: status, filename, credits and the extracted json.",
            input: object({ documentId }),
          },
          async (_ctx, { documentId }) => send("GET", `/docs/${encodeURIComponent(documentId)}`),
        ),
        getExtended: query(
          {
            description:
              "Get a parsed document with full detail: text, pages, preview image, inbox and neighbouring document ids. Set source to 'parsed' for the raw parsed output instead of the post-processed output.",
            input: object({ documentId, source: string().optional() }),
          },
          async (_ctx, { documentId, source }) =>
            send("GET", `/docs/${encodeURIComponent(documentId)}/extended`, { query: { source } }),
        ),
        uploadAndParse: mutation(
          {
            description:
              "Upload a file (base64) to an inbox and wait up to about 60 seconds for the parsed result. If parsing is not finished it returns parsing_in_progress with doc_id; fetch it later with documents.get. Formats: EML, PDF, HTML, TXT, MD, DOCX, XLSX, CSV, JPG, PNG, BMP, up to 20 MB. ZIP is not accepted here.",
            input: uploadInput,
            approval: always(),
          },
          async (_ctx, input) => upload(`/inboxes/${encodeURIComponent(input.inboxId)}/upload-sync`, input),
        ),
        upload: mutation(
          {
            description:
              "Upload a file (base64) to an inbox for asynchronous parsing and return the document id. Accepts ZIP archives as well as the formats uploadAndParse accepts, up to 20 MB.",
            input: uploadInput,
            approval: always(),
          },
          async (_ctx, input) => upload(`/inboxes/${encodeURIComponent(input.inboxId)}/upload`, input),
        ),
      },
      { title: "Documents", description: "Upload files for parsing and read their extracted data." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { airparser: airparser.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.airparser ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Airparser",
        description: "Extract structured JSON from emails, PDFs, images and other documents: manage inboxes and extraction schemas, upload files and read parsed documents.",
        icons,
      },
    ),
  }),
);
