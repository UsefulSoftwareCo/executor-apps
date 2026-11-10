import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  type AppContext,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const BASE = "https://de.eagle-doc.com";

const eagledoc = defineProvider({
  name: "Eagle Doc",
  hosts: ["de.eagle-doc.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The quota endpoint is documented, read-only and does not spend pages.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${BASE}/api/management/v1/quota`, {
      signal,
      headers: { "api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Query = Record<string, string | boolean | undefined>;

const FileInput = object({
  base64: string().optional(),
  url: string().optional(),
  name: string().optional(),
});
type FileInputValue = { base64?: string | undefined; url?: string | undefined; name?: string | undefined };

const filesDescription =
  "Files to send. Each entry gives either `base64` (file bytes, optionally with a data: URI prefix) or `url` (publicly reachable file to download first), plus an optional `name` with extension (png, jpg, tif or pdf). A multi-page document is one PDF or several page images.";

function bytesOf(base64: string): Uint8Array {
  const raw = base64.replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
  const binary = atob(raw);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function buildForm(files: readonly FileInputValue[], fetcher: Fetch, signal: AbortSignal | undefined) {
  if (files.length === 0) throw new Error("Provide at least one file");
  const form = new FormData();
  let index = 0;
  for (const file of files) {
    index++;
    let data: Uint8Array;
    let name = file.name;
    if (file.base64) {
      data = bytesOf(file.base64);
    } else if (file.url) {
      const response = await fetcher(file.url, { signal });
      if (!response.ok) throw new Error(`Could not download ${file.url} (${response.status})`);
      data = new Uint8Array(await response.arrayBuffer());
      name ??= new URL(file.url).pathname.split("/").pop() || undefined;
    } else {
      throw new Error("Each file needs base64 or url");
    }
    form.append("file", new Blob([data as BlobPart]), name || `file-${index}`);
  }
  return form;
}

function search(params: Query): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { "api-key": token };
  const upload = async (path: string, files: readonly FileInputValue[], params: Query) => {
    const body = await buildForm(files, fetcher, signal);
    const response = await fetcher(`${BASE}${path}${search(params)}`, { method: "POST", signal, headers, body });
    return decodeJson(response, json());
  };
  const get = async (path: string, params: Query = {}) =>
    decodeJson(await fetcher(`${BASE}${path}${search(params)}`, { signal, headers }), json());
  return { upload, get, delete: async (path: string, params: Query) =>
    decodeJson(await fetcher(`${BASE}${path}${search(params)}`, { method: "DELETE", signal, headers }), json()) };
}

const files = array(FileInput);
const privacy = boolean().optional();

export default defineApp(
  { user: { accounts: { eagledoc: eagledoc.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eagledoc ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            ocr: router(
              {
                receipt: mutation(
                  {
                    description:
                      "Extract structured data from one receipt (Receipt OCR v3, POST /api/receipt/v3/processing). Spends pages. `privacy` true (default) means the file is not stored; `polygon` adds coordinates; `fullText` adds page text; `speed` favours speed over accuracy.",
                    input: object({ files, privacy, polygon: boolean().optional(), fullText: boolean().optional(), speed: boolean().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/receipt/v3/processing", f, p),
                ),
                invoice: mutation(
                  {
                    description:
                      "Extract structured data from one invoice or credit memo (Invoice OCR v1, POST /api/invoice/v1/processing): general fields, line items, taxes, payments and bank details. Spends pages. `signature` extracts signatures at extra page cost.",
                    input: object({ files, privacy, polygon: boolean().optional(), fullText: boolean().optional(), signature: boolean().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/invoice/v1/processing", f, p),
                ),
                anyDocument: mutation(
                  {
                    description:
                      "Extract data from any supported document (Any Doc v1, POST /api/anydoc/v1/processing) with string values. `docType` (case-sensitive): BankStatement, TravelTicket, Passport, BusinessCard, EmployeeIdCard, StudentIdCard, DrivingLicense, BirthCertificate, DeliverySheet, Resume. Without docType or configId the document is classified first. `configId` selects a custom extraction config from the Eagle Doc team. `saveResult` stores the file and result in your account even when privacy is true.",
                    input: object({ files, privacy, docType: string().optional(), configId: string().optional(), saveResult: boolean().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/anydoc/v1/processing", f, p),
                ),
                anyDocumentGrounded: mutation(
                  {
                    description:
                      "Same extraction as anyDocument (POST /api/anydoc/v2/processing) but each value carries confidence, OCR confidence, page and polygon, and the result includes full text (and QR codes when enabled for the document type).",
                    input: object({ files, privacy, docType: string().optional(), configId: string().optional(), saveResult: boolean().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/anydoc/v2/processing", f, p),
                ),
                classify: mutation(
                  {
                    description:
                      "Classify a document without extracting (POST /api/anydoc/v1/classify). Returns DocType (may be Invoice or Receipt), NumberOfPages, FileHash. Spends pages.",
                    input: object({ files, privacy }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/anydoc/v1/classify", f, p),
                ),
                split: mutation(
                  {
                    description:
                      "Split a multi-document PDF or image set into separate documents (POST /api/doc/v1/split). Returns `splits` as 1-based inclusive [start, end] page ranges and `meta.emptyPages`.",
                    input: object({ files }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f }) => c.upload("/api/doc/v1/split", f, {}),
                ),
              },
              { title: "OCR", description: "Synchronous document extraction, classification and splitting." },
            ),
            batch: router(
              {
                submitFinance: mutation(
                  {
                    description:
                      "Submit a batch task of receipts and invoices (POST /api/finance/extract/batch/task/v1). Returns a task with an id; poll getTask until status is Finished or Error. `docType` is Invoice or Receipt.",
                    input: object({ files, privacy, docType: string().optional(), polygon: boolean().optional(), fullText: boolean().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/finance/extract/batch/task/v1", f, p),
                ),
                submitAnyDocument: mutation(
                  {
                    description:
                      "Submit a batch task of any supported documents (POST /api/anydoc/extract/batch/task/v1). Returns a task with an id; poll getTask. `docType` is one of BankStatement, TravelTicket, Passport, BusinessCard, EmployeeIDCard, StudentIDCard, DrivingLicense, BirthCertificate, DeliverySheet, Resume (this endpoint's docs spell the ID card types with IDCard); `configId` selects a custom config.",
                    input: object({ files, privacy, docType: string().optional(), configId: string().optional() }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { files: f, ...p }) => c.upload("/api/anydoc/extract/batch/task/v1", f, p),
                ),
                getTask: query(
                  {
                    description:
                      "Get a batch task (GET /api/doc/task/v1). status is Received, Processing, Error or Finished; results holds the extracted documents once Finished.",
                    input: object({ taskId: string({ minLength: 1 }) }),
                  },
                  async (_ctx: AppContext, { taskId }) => c.get("/api/doc/task/v1", { taskId }),
                ),
                deleteTask: mutation(
                  {
                    description: "Delete a batch task and its results (DELETE /api/doc/task/v1).",
                    input: object({ taskId: string({ minLength: 1 }) }),
                    approval: always(),
                  },
                  async (_ctx: AppContext, { taskId }) => c.delete("/api/doc/task/v1", { taskId }),
                ),
              },
              { title: "Batch", description: "Asynchronous batch tasks for finance and any-document extraction." },
            ),
            usage: router(
              {
                current: query(
                  { description: "Live counters for the current billing month: contract quota, pages used, over-usage settings and cost (GET /api/usage/v1/current).", input: object({}) },
                  async () => c.get("/api/usage/v1/current"),
                ),
                monthly: query(
                  { description: "Pages processed per month (GET /api/usage/v1/monthly).", input: object({}) },
                  async () => c.get("/api/usage/v1/monthly"),
                ),
                logs: query(
                  { description: "Recent API calls with page counts and timestamps (GET /api/usage/v1/logs).", input: object({}) },
                  async () => c.get("/api/usage/v1/logs"),
                ),
                quota: query(
                  { description: "Simplified quota view: quota, quotaUsed, currentMonth (GET /api/management/v1/quota).", input: object({}) },
                  async () => c.get("/api/management/v1/quota"),
                ),
              },
              { title: "Usage", description: "Quota and usage reporting." },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Eagle Doc",
        description:
          "Document AI with Eagle Doc: receipt, invoice and any-document OCR (bank statements, passports, resumes and more), classification, splitting, batch tasks and usage.",
        icons,
        instructions:
          "Every extraction tool takes `files`, an array of {base64 | url, name}. Calls spend pages from the subscription; privacy defaults to true (files not stored).",
      },
    ),
  }),
);
