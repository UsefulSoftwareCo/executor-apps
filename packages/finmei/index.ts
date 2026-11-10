import {
  accountRouter,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.finmei.com/api";

const finmei = defineProvider({
  name: "Finmei",
  hosts: ["app.finmei.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/profile`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const call = async (method: string, path: string, options: { query?: Record<string, unknown>; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url, {
      method,
      signal,
      headers: options.body === undefined ? headers : { ...headers, "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return decodeJson(response, json());
  };
  const upload = async (method: string, path: string, fields: Record<string, string>, file: { fileBase64: string; fileName: string; mimeType: string }) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    const bytes = Uint8Array.from(atob(file.fileBase64), (c) => c.charCodeAt(0));
    form.set("file", new Blob([bytes], { type: file.mimeType }), file.fileName);
    const response = await fetcher(`${base}${path}`, { method, signal, headers, body: form });
    return decodeJson(response, json());
  };
  // Downloads are binary; hand them back as base64 with the content type.
  const download = async (path: string) => {
    const response = await fetcher(`${base}${path}`, { signal, headers });
    if (!response.ok) throw new Error(`Finmei download failed (${response.status})`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { contentType: response.headers.get("content-type") ?? "application/octet-stream", base64: btoa(binary) };
  };
  return { call, upload, download };
}

const page = number().optional();
const id = string({ minLength: 1 });
const invoiceBody = record(json());
const fileFields = {
  fileBase64: string({ minLength: 1 }),
  fileName: string({ minLength: 1 }),
  mimeType: string({ minLength: 1 }),
};
const fileHelp = "fileBase64 is the base64-encoded PDF or image; fileName and mimeType (for example application/pdf or image/png) describe it.";

function build(c: ReturnType<typeof client>) {
  return router({
    profile: query(
      { description: "Get the business profile that the API token belongs to. Each token is scoped to one business.", input: object({}) },
      async () => c.call("GET", "/profile"),
    ),
    invoices: router(
      {
        list: query(
          { description: "List invoices. Pass page to fetch later pages.", input: object({ page }) },
          async (_ctx, { page }) => c.call("GET", "/invoices", { query: { page } }),
        ),
        get: query({ description: "Get one invoice by id.", input: object({ id }) }, async (_ctx, { id }) =>
          c.call("GET", `/invoices/${encodeURIComponent(id)}`),
        ),
        downloadPdf: query(
          { description: "Download an invoice as a PDF. Returns { contentType, base64 }.", input: object({ id }) },
          async (_ctx, { id }) => c.download(`/invoices/${encodeURIComponent(id)}/download`),
        ),
        create: mutation(
          {
            description:
              "Create an invoice. body is the JSON document. Required: type (regular_invoice, vat_invoice, preliminary_invoice, preliminary_vat_invoice, credit_invoice, credit_vat_invoice), invoice_date (YYYY-MM-DD), series, currency (uppercase ISO code), buyer ({ type: company|individual, company_name or first_name+last_name, optional address, vat_code, email, phone }) and products ([{ name, units, quantity, price, vat_percentage }]). Optional: pay_until_date, invoice_number, notes, language (en, es, lt), payment_status (paid, not_paid), payment_options ([{ type: bank|other, bank_account, bank_name, routing_or_sort_number, swift_bic_code, fields: [{ label, value }] }]), use_default_seller_info (default true) and seller ({ company_name, vat_code, address, email, phone, custom_fields }) when it is false.",
            input: object({ body: invoiceBody }),
          },
          async (_ctx, { body }) => c.call("POST", "/invoices", { body }),
        ),
        update: mutation(
          {
            description: "Update an invoice. body takes the same fields as invoices.create and replaces the invoice contents.",
            input: object({ id, body: invoiceBody }),
          },
          async (_ctx, { id, body }) => c.call("PUT", `/invoices/${encodeURIComponent(id)}`, { body }),
        ),
        delete: mutation({ description: "Delete an invoice.", input: object({ id }) }, async (_ctx, { id }) =>
          c.call("DELETE", `/invoices/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Invoices", description: "Create, update, download and delete invoices." },
    ),
    expenses: router(
      {
        list: query(
          { description: "List expenses. Pass page to fetch later pages.", input: object({ page }) },
          async (_ctx, { page }) => c.call("GET", "/expenses", { query: { page } }),
        ),
        get: query({ description: "Get one expense by id.", input: object({ id }) }, async (_ctx, { id }) =>
          c.call("GET", `/expenses/${encodeURIComponent(id)}`),
        ),
        downloadFile: query(
          { description: "Download the bill file attached to an expense. Returns { contentType, base64 }.", input: object({ id }) },
          async (_ctx, { id }) => c.download(`/expenses/${encodeURIComponent(id)}/download`),
        ),
        create: mutation(
          {
            description: `Create an expense from a bill file. seller is the company or person name, total the amount, currency an uppercase ISO code, date YYYY-MM-DD. ${fileHelp}`,
            input: object({ seller: string({ minLength: 1 }), total: number(), currency: string({ minLength: 3 }), date: string({ minLength: 10 }), ...fileFields }),
          },
          async (_ctx, { seller, total, currency, date, ...file }) =>
            c.upload("POST", "/expenses", { seller, total: String(total), currency, date }, file),
        ),
        update: mutation(
          {
            description: "Update the fields of an expense. To replace its bill file use expenses.updateFile.",
            input: object({ id, seller: string({ minLength: 1 }), total: number(), currency: string({ minLength: 3 }), date: string({ minLength: 10 }) }),
          },
          async (_ctx, { id, ...body }) => c.call("PUT", `/expenses/${encodeURIComponent(id)}`, { body }),
        ),
        updateFile: mutation(
          { description: `Replace the bill file of an expense. ${fileHelp}`, input: object({ id, ...fileFields }) },
          async (_ctx, { id, ...file }) => c.upload("POST", `/expenses/${encodeURIComponent(id)}/file`, {}, file),
        ),
      },
      { title: "Expenses", description: "Record expenses with their bill files." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { finmei: finmei.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.finmei ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Finmei",
        description: "Create and manage invoices and expenses in Finmei, and read the business profile.",
        icons,
      },
    ),
  }),
);
