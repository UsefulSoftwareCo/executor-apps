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

const base = "https://api.parsio.io";

const parsio = defineProvider({
  name: "Parsio",
  hosts: ["api.parsio.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing mailboxes is a free read that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/mailboxes`, { signal, headers: { "X-API-Key": account.fields.token } });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const request = async (method: string, path: string, init: { query?: Record<string, unknown>; body?: BodyInit; contentType?: string } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { "X-API-Key": token };
    if (init.contentType !== undefined) headers["Content-Type"] = init.contentType;
    return fetcher(url.toString(), { method, signal, headers, body: init.body });
  };
  const send = async (method: string, path: string, init: { query?: Record<string, unknown>; body?: BodyInit; contentType?: string } = {}) =>
    decodeJson(await request(method, path, init), json());
  const sendJson = (method: string, path: string, body: unknown) =>
    send(method, path, { body: JSON.stringify(body), contentType: "application/json" });
  // The vendor documents no response body for deletes, so accept an empty body.
  const remove = async (path: string, body?: unknown) => {
    const response = await request("DELETE", path, body === undefined ? {} : { body: JSON.stringify(body), contentType: "application/json" });
    if (!response.ok) throw new Error(`Parsio responded with HTTP ${response.status}`);
    if ((await response.clone().text()).trim() === "") return { deleted: true };
    return decodeJson(response, json());
  };
  const upload = (path: string, input: { fileBase64: string; filename: string; contentType?: string | undefined; meta?: unknown }) => {
    const form = new FormData();
    const bytes = Uint8Array.from(atob(input.fileBase64), (char) => char.charCodeAt(0));
    // Field names `file` and `meta` come from https://help.parsio.io/public-api/parse-pdf-and-files-using-api-1
    form.append("file", new Blob([bytes], { type: input.contentType ?? "application/octet-stream" }), input.filename);
    if (input.meta !== undefined) form.append("meta", JSON.stringify(input.meta));
    return send("POST", path, { body: form });
  };
  return { send, sendJson, remove, upload };
}

const mailboxId = string({ minLength: 1 });
const documentId = string({ minLength: 1 });
const ids = array(string({ minLength: 1 }));
const eventNames = "doc.parsed, doc.parsed.flat, doc.fail, doc.received or table.parsed";
const enc = encodeURIComponent;

const uploadInput = object({
  mailboxId,
  fileBase64: string({ minLength: 1 }),
  filename: string({ minLength: 1 }),
  contentType: string().optional(),
  meta: json().optional(),
});

const textDocInput = object({
  mailboxId,
  name: string({ minLength: 1 }),
  html: string().optional(),
  text: string().optional(),
  from: string().optional(),
  to: string().optional(),
  meta: json().optional(),
});

function build(api: ReturnType<typeof client>) {
  const { send, sendJson, remove, upload } = api;
  return router({
    mailboxes: router(
      {
        list: query({ description: "List all mailboxes (parsers) in the account.", input: object({}) }, async () => send("GET", "/mailboxes")),
        get: query(
          { description: "Get a mailbox's settings and configuration.", input: object({ mailboxId }) },
          async (_ctx, { mailboxId }) => send("GET", `/mailboxes/${enc(mailboxId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a mailbox. preset is the parser type, ml_model the OCR/AI model, hasRawData and parseSig toggle raw data and signature parsing. The vendor does not document the accepted preset and model values.",
            input: object({
              name: string({ minLength: 1 }),
              preset: string().optional(),
              mlModel: string().optional(),
              hasRawData: boolean().optional(),
              parseSig: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { name, preset, mlModel, hasRawData, parseSig }) =>
            sendJson("POST", "/mailboxes/create", { name, preset, ml_model: mlModel, has_raw_data: hasRawData, parse_sig: parseSig }),
        ),
        update: mutation(
          {
            description:
              "Update a mailbox's settings. Only the fields you pass are sent. alertEmailHours is the alert frequency in hours; emailPrefix is the local part of the mailbox's inbound address.",
            input: object({
              mailboxId,
              name: string().optional(),
              emailPrefix: string().optional(),
              processAttachments: boolean().optional(),
              collectEmails: boolean().optional(),
              alertEmailHours: number().optional(),
              receiveEmail: boolean().optional(),
              preset: string().optional(),
              mlModel: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { mailboxId, name, emailPrefix, processAttachments, collectEmails, alertEmailHours, receiveEmail, preset, mlModel }) =>
            sendJson("POST", `/mailboxes/${enc(mailboxId)}`, {
              name,
              email_prefix: emailPrefix,
              process_attachments: processAttachments,
              collect_emails: collectEmails,
              alert_email_h: alertEmailHours,
              receive_email: receiveEmail,
              preset,
              ml_model: mlModel,
            }),
        ),
        delete: mutation(
          { description: "Permanently delete a mailbox. An empty success response is returned as { deleted: true }.", input: object({ mailboxId }), approval: always() },
          async (_ctx, { mailboxId }) => remove(`/mailboxes/${enc(mailboxId)}`),
        ),
        tableFields: query(
          { description: "List the table fields defined in a mailbox.", input: object({ mailboxId }) },
          async (_ctx, { mailboxId }) => send("GET", `/mailboxes/${enc(mailboxId)}/tableFields`),
        ),
        emails: query(
          { description: "List the email addresses a mailbox has collected.", input: object({ mailboxId }) },
          async (_ctx, { mailboxId }) => send("GET", `/mailboxes/${enc(mailboxId)}/emails`),
        ),
      },
      { title: "Mailboxes", description: "Parsers that receive documents and hold parsing settings." },
    ),
    documents: router(
      {
        list: query(
          {
            description:
              "List documents in a mailbox. Filter by from/to (YYYY-MM-DD), q (name search) and status (string array). perPage is at most 500.",
            input: object({
              mailboxId,
              page: number().optional(),
              perPage: number().optional(),
              from: string().optional(),
              to: string().optional(),
              q: string().optional(),
              status: array(string()).optional(),
            }),
          },
          async (_ctx, { mailboxId, page, perPage, from, to, q, status }) =>
            send("GET", `/mailboxes/${enc(mailboxId)}/docs`, { query: { page, per_page: perPage, from, to, q, status } }),
        ),
        get: query(
          {
            description: "Get a parsed document as JSON, in the same format webhooks use. Use it after an asynchronous import or when a synchronous call returns parsing_in_progress.",
            input: object({ documentId }),
          },
          async (_ctx, { documentId }) => send("GET", `/docs/${enc(documentId)}`),
        ),
        parsed: query(
          {
            description: "Get the parsed data of a mailbox's documents, optionally limited to from/to dates (YYYY-MM-DD).",
            input: object({ mailboxId, page: number().optional(), from: string().optional(), to: string().optional() }),
          },
          async (_ctx, { mailboxId, page, from, to }) => send("GET", `/mailboxes/${enc(mailboxId)}/parsed`, { query: { page, from, to } }),
        ),
        createFromTextAndParse: mutation(
          {
            description:
              "Create a document from HTML or text and wait for the parsed result. HTML takes priority over text when both are given. Works only with template-based and GPT-powered parsers.",
            input: textDocInput,
            approval: always(),
          },
          async (_ctx, { mailboxId, ...body }) => sendJson("POST", `/mailboxes/${enc(mailboxId)}/doc-sync`, body),
        ),
        createFromText: mutation(
          {
            description: "Create a document from HTML or text and parse it in the background. Returns the document id; fetch the result with documents.get.",
            input: textDocInput,
            approval: always(),
          },
          async (_ctx, { mailboxId, ...body }) => sendJson("POST", `/mailboxes/${enc(mailboxId)}/doc`, body),
        ),
        uploadAndParse: mutation(
          {
            description:
              "Upload one file (base64, up to 20 MB, no ZIP) and wait for the parsed result. If parsing is not finished the response has parsing_in_progress; fetch the result later with documents.get.",
            input: uploadInput,
            approval: always(),
          },
          async (_ctx, input) => upload(`/mailboxes/${enc(input.mailboxId)}/upload-sync`, input),
        ),
        upload: mutation(
          {
            description: "Upload a file (base64, ZIP allowed, up to 50 MB) for background parsing. Returns the document id; fetch the result with documents.get.",
            input: uploadInput,
            approval: always(),
          },
          async (_ctx, input) => upload(`/mailboxes/${enc(input.mailboxId)}/upload`, input),
        ),
        reparse: mutation(
          { description: "Queue a document to be parsed again.", input: object({ documentId }), approval: always() },
          async (_ctx, { documentId }) => send("POST", `/docs/${enc(documentId)}/parse`),
        ),
        skip: mutation(
          { description: "Skip the listed documents so they are not parsed.", input: object({ mailboxId, ids }), approval: always() },
          async (_ctx, { mailboxId, ids }) => sendJson("POST", `/mailboxes/${enc(mailboxId)}/docs/skip`, { ids }),
        ),
      },
      { title: "Documents", description: "Import documents for parsing and read their extracted data." },
    ),
    templates: router(
      {
        list: query(
          { description: "List the templates of a mailbox.", input: object({ mailboxId, page: number().optional() }) },
          async (_ctx, { mailboxId, page }) => send("GET", `/mailboxes/${enc(mailboxId)}/templates`, { query: { page } }),
        ),
        get: query(
          { description: "Get one template.", input: object({ templateId: string({ minLength: 1 }) }) },
          async (_ctx, { templateId }) => send("GET", `/templates/${enc(templateId)}`),
        ),
        enable: mutation(
          { description: "Enable templates by id.", input: object({ ids }), approval: always() },
          async (_ctx, { ids }) => sendJson("POST", "/templates/enable_many", { ids }),
        ),
        disable: mutation(
          { description: "Disable templates by id.", input: object({ ids }), approval: always() },
          async (_ctx, { ids }) => sendJson("POST", "/templates/disable_many", { ids }),
        ),
        clone: mutation(
          { description: "Clone templates into another mailbox.", input: object({ ids, mailboxId }), approval: always() },
          async (_ctx, { ids, mailboxId }) => sendJson("POST", "/templates/clone_many", { ids, mailbox_id: mailboxId }),
        ),
        delete: mutation(
          { description: "Permanently delete templates by id.", input: object({ ids }), approval: always() },
          async (_ctx, { ids }) => remove("/templates", { ids }),
        ),
      },
      { title: "Templates", description: "Parsing templates that tell a mailbox where to find fields." },
    ),
    webhooks: router(
      {
        list: query(
          { description: "List a mailbox's webhooks.", input: object({ mailboxId }) },
          async (_ctx, { mailboxId }) => send("GET", `/webhooks/mb/${enc(mailboxId)}`),
        ),
        get: query(
          { description: "Get one webhook.", input: object({ webhookId: string({ minLength: 1 }) }) },
          async (_ctx, { webhookId }) => send("GET", `/webhooks/${enc(webhookId)}`),
        ),
        create: mutation(
          {
            description: `Create a webhook on a mailbox. event is one of ${eventNames}. tableId is only for table.parsed.`,
            input: object({
              mailboxId,
              name: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              event: string({ minLength: 1 }),
              enabled: boolean().optional(),
              tableId: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { mailboxId, name, url, event, enabled, tableId }) =>
            sendJson("POST", `/webhooks/${enc(mailboxId)}`, { name, url, event, enabled, table_id: tableId }),
        ),
        update: mutation(
          {
            description: `Update a webhook. event is one of ${eventNames}. tableId is only for table.parsed.`,
            input: object({
              webhookId: string({ minLength: 1 }),
              name: string({ minLength: 1 }),
              url: string({ minLength: 1 }),
              event: string({ minLength: 1 }),
              enabled: boolean().optional(),
              tableId: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { webhookId, name, url, event, enabled, tableId }) =>
            sendJson("POST", "/webhooks", { _id: webhookId, name, url, event, enabled, table_id: tableId }),
        ),
        delete: mutation(
          { description: "Permanently delete webhooks by id.", input: object({ ids }), approval: always() },
          async (_ctx, { ids }) => remove("/webhooks", { ids }),
        ),
      },
      { title: "Webhooks", description: "Webhooks that push parsed data to your own endpoints." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { parsio: parsio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.parsio ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Parsio",
        description: "Extract structured data from emails, PDFs and documents: manage mailboxes, templates and webhooks, import documents and read parsed data.",
        icons,
      },
    ),
  }),
);
