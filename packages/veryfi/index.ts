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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.veryfi.com/api/v8/partner";

const veryfi = defineProvider({
  name: "Veryfi OCR",
  hosts: ["api.veryfi.com"],
  auth: {
    apiKey: secrets({
      label: "API credentials",
      fields: object({
        clientId: string({ minLength: 1 }),
        username: string({ minLength: 1 }),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  // Listing documents is a read-only call that needs all three credentials.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/documents/?page_size=1`, {
      signal,
      headers: {
        Accept: "application/json",
        "Client-Id": account.fields.clientId,
        Authorization: `apikey ${account.fields.username}:${account.fields.apiKey}`,
      },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Credentials = { clientId: string; username: string; apiKey: string };

function client(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Client-Id": credentials.clientId,
    Authorization: `apikey ${credentials.username}:${credentials.apiKey}`,
  };
  const send = async (method: string, path: string, init: { query?: Record<string, unknown>; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) throw new Error(`Veryfi responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const text = await response.text();
    if (text.trim() === "") return { ok: true };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { ok: true };
    }
  };
  return { send };
}

type Api = ReturnType<typeof client>;

const id = number();
const drop = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const source = {
  fileUrl: string().optional(),
  fileUrls: array(string()).optional(),
  fileName: string().optional(),
  fileBase64: string().optional(),
  extra: json().optional(),
};

// Builds the body for a document-processing call from a URL, several URLs, or base64 file data.
function processBody(
  input: { fileUrl?: string | undefined; fileUrls?: readonly string[] | undefined; fileName?: string | undefined; fileBase64?: string | undefined; extra?: unknown },
  more: Record<string, unknown> = {},
) {
  const hasSource = input.fileUrl !== undefined || input.fileUrls !== undefined || input.fileBase64 !== undefined;
  if (!hasSource) throw new Error("Provide fileUrl, fileUrls or fileBase64 (with fileName).");
  if (input.fileBase64 !== undefined && input.fileName === undefined) throw new Error("fileName is required with fileBase64.");
  const extra = input.extra !== null && typeof input.extra === "object" && !Array.isArray(input.extra) ? (input.extra as Record<string, unknown>) : {};
  return {
    ...drop({ file_name: input.fileName, file_url: input.fileUrl, file_urls: input.fileUrls, file_data: input.fileBase64 }),
    ...drop(more),
    ...extra,
  };
}

const processDescription =
  "Provide one of fileUrl (public URL), fileUrls (several public URLs) or fileBase64 with fileName. extra is an optional JSON object of additional documented body fields merged into the request.";

// Document types that share list, get, process and delete endpoints.
function documentKind(api: Api, path: string, label: string, plural: string, title: string) {
  return router(
    {
      list: query(
        {
          description: `List processed ${plural}. page and pageSize paginate; extra query filters go in filters as a JSON object of key to value.`,
          input: object({ page: number().optional(), pageSize: number().optional(), filters: json().optional() }),
        },
        async (_ctx, { page, pageSize, filters }) =>
          api.send("GET", `${path}/`, {
            query: {
              page,
              page_size: pageSize,
              ...(filters !== null && typeof filters === "object" && !Array.isArray(filters) ? (filters as Record<string, unknown>) : {}),
            },
          }),
      ),
      get: query({ description: `Get a processed ${label} with its extracted data.`, input: object({ id }) }, async (_ctx, { id }) =>
        api.send("GET", `${path}/${id}/`),
      ),
      process: mutation(
        { description: `Process a ${label} and extract its data. ${processDescription}`, input: object(source), approval: always() },
        async (_ctx, input) => api.send("POST", `${path}/`, { body: processBody(input) }),
      ),
      delete: mutation(
        { description: `Permanently delete a processed ${label}.`, input: object({ id }), approval: always() },
        async (_ctx, { id }) => api.send("DELETE", `${path}/${id}/`),
      ),
    },
    { title, description: `Extract and read ${plural}.` },
  );
}

function build(api: Api) {
  const { send } = api;
  const documentId = object({ documentId: id });
  return router({
    documents: router(
      {
        list: query(
          {
            description:
              "Search processed receipts and invoices. Filters: q (search text), externalId, tag, createdGt/createdGte/createdLt/createdLte (date-time). page and pageSize paginate.",
            input: object({
              q: string().optional(),
              externalId: string().optional(),
              tag: string().optional(),
              createdGt: string().optional(),
              createdGte: string().optional(),
              createdLt: string().optional(),
              createdLte: string().optional(),
              page: number().optional(),
              pageSize: number().optional(),
            }),
          },
          async (_ctx, input) =>
            send("GET", "/documents/", {
              query: {
                q: input.q,
                external_id: input.externalId,
                tag: input.tag,
                created__gt: input.createdGt,
                created__gte: input.createdGte,
                created__lt: input.createdLt,
                created__lte: input.createdLte,
                page: input.page,
                page_size: input.pageSize,
              },
            }),
        ),
        get: query({ description: "Get a processed document with all extracted fields.", input: object({ id }) }, async (_ctx, { id }) =>
          send("GET", `/documents/${id}/`),
        ),
        process: mutation(
          {
            description: `Process a receipt, invoice or other expense document and extract its fields. ${processDescription} Optional: categories (list of expense categories), externalId, boostMode (faster, skips enrichment), maxPagesToProcess, deleteAfterProcessing.`,
            input: object({
              ...source,
              categories: array(string()).optional(),
              externalId: string().optional(),
              boostMode: boolean().optional(),
              maxPagesToProcess: number().optional(),
              deleteAfterProcessing: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, input) =>
            send("POST", "/documents/", {
              body: processBody(input, {
                categories: input.categories,
                external_id: input.externalId,
                boost_mode: input.boostMode,
                max_pages_to_process: input.maxPagesToProcess,
                auto_delete: input.deleteAfterProcessing,
              }),
            }),
        ),
        processBulk: mutation(
          { description: "Queue many documents for processing from a list of public URLs. Returns the created document ids.", input: object({ fileUrls: array(string()) }), approval: always() },
          async (_ctx, { fileUrls }) => send("POST", "/documents/bulk/", { body: { file_urls: fileUrls } }),
        ),
        update: mutation(
          {
            description: "Update fields of a processed document. fields is a JSON object of the document fields to change (for example vendor, date, total, category, notes, tags).",
            input: object({ id, fields: json() }),
            approval: always(),
          },
          async (_ctx, { id, fields }) => send("PUT", `/documents/${id}/`, { body: fields }),
        ),
        delete: mutation(
          { description: "Permanently delete a processed document.", input: object({ id }), approval: always() },
          async (_ctx, { id }) => send("DELETE", `/documents/${id}/`),
        ),
      },
      { title: "Documents", description: "Receipts, invoices and other expense documents." },
    ),
    lineItems: router(
      {
        list: query({ description: "List the line items of a document.", input: documentId }, async (_ctx, { documentId }) =>
          send("GET", `/documents/${documentId}/line-items/`),
        ),
        get: query(
          { description: "Get one line item of a document.", input: object({ documentId: id, lineItemId: id }) },
          async (_ctx, { documentId, lineItemId }) => send("GET", `/documents/${documentId}/line-items/${lineItemId}`),
        ),
        add: mutation(
          { description: "Add a line item to a document. lineItem is a JSON object (for example description, quantity, price, total, sku).", input: object({ documentId: id, lineItem: json() }), approval: always() },
          async (_ctx, { documentId, lineItem }) => send("POST", `/documents/${documentId}/line-items/`, { body: lineItem }),
        ),
        update: mutation(
          { description: "Update a line item. lineItem is a JSON object of the fields to change.", input: object({ documentId: id, lineItemId: id, lineItem: json() }), approval: always() },
          async (_ctx, { documentId, lineItemId, lineItem }) => send("PUT", `/documents/${documentId}/line-items/${lineItemId}`, { body: lineItem }),
        ),
        delete: mutation(
          { description: "Delete one line item of a document.", input: object({ documentId: id, lineItemId: id }), approval: always() },
          async (_ctx, { documentId, lineItemId }) => send("DELETE", `/documents/${documentId}/line-items/${lineItemId}`),
        ),
        deleteAll: mutation(
          { description: "Delete every line item of a document.", input: documentId, approval: always() },
          async (_ctx, { documentId }) => send("DELETE", `/documents/${documentId}/line-items/`),
        ),
      },
      { title: "Line items", description: "Read and edit the line items of a document." },
    ),
    tags: router(
      {
        list: query({ description: "List the tags on a document.", input: documentId }, async (_ctx, { documentId }) =>
          send("GET", `/documents/${documentId}/tags`),
        ),
        add: mutation(
          { description: "Add one tag to a document.", input: object({ documentId: id, tag: string({ minLength: 1 }) }), approval: always() },
          async (_ctx, { documentId, tag }) => send("PUT", `/documents/${documentId}/tags/`, { body: { name: tag } }),
        ),
        addMany: mutation(
          { description: "Add several tags to a document.", input: object({ documentId: id, tags: array(string({ minLength: 1 })) }), approval: always() },
          async (_ctx, { documentId, tags }) => send("POST", `/documents/${documentId}/tags/`, { body: { tags } }),
        ),
        replace: mutation(
          { description: "Replace all tags of a document with the given list.", input: object({ documentId: id, tags: array(string()) }), approval: always() },
          async (_ctx, { documentId, tags }) => send("PUT", `/documents/${documentId}/`, { body: { tags } }),
        ),
        remove: mutation(
          { description: "Unlink one tag from a document by tag id.", input: object({ documentId: id, tagId: id }), approval: always() },
          async (_ctx, { documentId, tagId }) => send("DELETE", `/documents/${documentId}/tags/${tagId}`),
        ),
        removeAll: mutation(
          { description: "Remove every tag from a document.", input: documentId, approval: always() },
          async (_ctx, { documentId }) => send("DELETE", `/documents/${documentId}/tags`),
        ),
      },
      { title: "Tags", description: "Tag documents for search and grouping." },
    ),
    pdfSplit: router(
      {
        list: query({ description: "List multi-document PDFs that were split and processed.", input: object({ page: number().optional(), pageSize: number().optional() }) }, async (_ctx, { page, pageSize }) =>
          send("GET", "/documents-set/", { query: { page, page_size: pageSize } }),
        ),
        get: query({ description: "Get the documents extracted from a split PDF.", input: object({ id }) }, async (_ctx, { id }) =>
          send("GET", `/documents-set/${id}`),
        ),
        process: mutation(
          {
            description: `Split a PDF that holds several documents and process each one. ${processDescription} Optional: categories, maxPagesToProcess.`,
            input: object({ ...source, categories: array(string()).optional(), maxPagesToProcess: number().optional() }),
            approval: always(),
          },
          async (_ctx, input) =>
            send("POST", "/documents-set/", {
              body: processBody(input, { categories: input.categories, max_pages_to_process: input.maxPagesToProcess }),
            }),
        ),
      },
      { title: "PDF split", description: "Split multi-document PDFs and process each part." },
    ),
    bankStatements: documentKind(api, "/bank-statements", "bank statement", "bank statements", "Bank statements"),
    checks: router(
      {
        list: query(
          { description: "List processed checks.", input: object({ page: number().optional(), pageSize: number().optional(), filters: json().optional() }) },
          async (_ctx, { page, pageSize, filters }) =>
            send("GET", "/checks/", {
              query: { page, page_size: pageSize, ...(filters !== null && typeof filters === "object" && !Array.isArray(filters) ? (filters as Record<string, unknown>) : {}) },
            }),
        ),
        get: query({ description: "Get a processed check.", input: object({ id }) }, async (_ctx, { id }) => send("GET", `/checks/${id}/`)),
        process: mutation(
          { description: `Process a check image. ${processDescription}`, input: object(source), approval: always() },
          async (_ctx, input) => send("POST", "/checks/", { body: processBody(input) }),
        ),
        processWithRemittance: mutation(
          { description: `Process a check together with its remittance document. ${processDescription}`, input: object(source), approval: always() },
          async (_ctx, input) => send("POST", "/check-with-document/", { body: processBody(input) }),
        ),
        update: mutation(
          { description: "Update fields of a processed check. fields is a JSON object.", input: object({ id, fields: json() }), approval: always() },
          async (_ctx, { id, fields }) => send("PUT", `/checks/${id}/`, { body: fields }),
        ),
        delete: mutation({ description: "Permanently delete a processed check.", input: object({ id }), approval: always() }, async (_ctx, { id }) =>
          send("DELETE", `/checks/${id}/`),
        ),
      },
      { title: "Checks", description: "Extract and read checks." },
    ),
    w2s: documentKind(api, "/w2s", "W-2", "W-2 forms", "W-2 forms"),
    w9s: documentKind(api, "/w9s", "W-9", "W-9 forms", "W-9 forms"),
    w8s: documentKind(api, "/w-8ben-e", "W-8BEN-E", "W-8BEN-E forms", "W-8BEN-E forms"),
    businessCards: documentKind(api, "/business-cards", "business card", "business cards", "Business cards"),
    anyDocuments: router(
      {
        list: query(
          { description: "List documents processed with a custom blueprint.", input: object({ page: number().optional(), pageSize: number().optional(), filters: json().optional() }) },
          async (_ctx, { page, pageSize, filters }) =>
            send("GET", "/any-documents/", {
              query: { page, page_size: pageSize, ...(filters !== null && typeof filters === "object" && !Array.isArray(filters) ? (filters as Record<string, unknown>) : {}) },
            }),
        ),
        get: query({ description: "Get a document processed with a blueprint.", input: object({ id }) }, async (_ctx, { id }) =>
          send("GET", `/any-documents/${id}/`),
        ),
        process: mutation(
          {
            description: `Extract data from any document using a named blueprint configured in the Veryfi account. ${processDescription} Requires blueprintName.`,
            input: object({ blueprintName: string({ minLength: 1 }), ...source }),
            approval: always(),
          },
          async (_ctx, input) => send("POST", "/any-documents/", { body: processBody(input, { blueprint_name: input.blueprintName }) }),
        ),
        delete: mutation({ description: "Permanently delete a blueprint-processed document.", input: object({ id }), approval: always() }, async (_ctx, { id }) =>
          send("DELETE", `/any-documents/${id}/`),
        ),
      },
      { title: "Any documents", description: "Extract data from arbitrary documents with a custom blueprint." },
    ),
    classify: router(
      {
        classify: mutation(
          {
            description: `Classify a document into a type. ${processDescription} Optional: documentTypes (list of candidate types).`,
            input: object({ ...source, documentTypes: array(string()).optional() }),
            approval: always(),
          },
          async (_ctx, input) => send("POST", "/classify/", { body: processBody(input, { document_types: input.documentTypes }) }),
        ),
      },
      { title: "Classify", description: "Identify the type of a document." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { veryfi: veryfi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.veryfi ?? [], (account) => build(client(account.fields, fetch, signal)), { signal }),
      {
        title: "Veryfi OCR",
        description:
          "Extract structured data from receipts, invoices, bank statements, checks, W-2/W-9/W-8 forms and business cards with Veryfi: process documents, edit line items and tags, and read results.",
        icons,
      },
    ),
  }),
);
