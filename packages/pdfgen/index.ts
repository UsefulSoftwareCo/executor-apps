import {
  accountRouter,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://pdfgen.com/api/v1";

const pdfgen = defineProvider({
  name: "PDFgen",
  hosts: ["pdfgen.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /me returns the account behind the key and does not count against the PDF quota.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: object({ id: string() }) }));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
}

const page = (limit: number | undefined, offset: number | undefined) => {
  const q = new URLSearchParams();
  if (limit !== undefined) q.set("limit", String(limit));
  if (offset !== undefined) q.set("offset", String(offset));
  const s = q.toString();
  return s ? `?${s}` : "";
};

const Paging = object({
  limit: number().optional(),
  offset: number().optional(),
});

const Engine = string().optional();

function build(call: ReturnType<typeof client>) {
  return router({
    account: query(
      {
        description: "Get the account behind the API key: email, organization, plan and credit usage (used and limit).",
        input: object({}),
      },
      async () => call("GET", "/me"),
    ),
    generate: mutation(
      {
        description:
          "Generate a PDF and return a signed download URL. Provide exactly one source: templateId (a saved template, merged with data), html (raw HTML with optional Handlebars tokens, merged with data), markdown, or prompt (plain English, at least 20 characters; the AI writes the HTML and is billed at twice the page rate). Credits: 1 per 5 pages. format is one of A4 (default), Letter, Legal, A3, A5, Tabloid; orientation is portrait or landscape; expiryMinutes is 1 to 10080 (default 7 days). Set protectPdf with password to encrypt the file (password is required when protectPdf is true). engine (handlebars or legacy) applies to html sources only.",
        input: object({
          templateId: string().optional(),
          html: string().optional(),
          markdown: string().optional(),
          prompt: string().optional(),
          data: json().optional(),
          engine: Engine,
          format: string().optional(),
          orientation: string().optional(),
          fileName: string().optional(),
          expiryMinutes: number().optional(),
          protectPdf: boolean().optional(),
          password: string().optional(),
        }),
      },
      async (_ctx, i) => {
        const sources = [i.templateId, i.html, i.markdown, i.prompt].filter((v) => v !== undefined);
        if (sources.length !== 1) throw new Error("Provide exactly one of templateId, html, markdown or prompt");
        if (i.engine !== undefined && i.html === undefined) throw new Error("engine is only supported with an html source");
        if (i.protectPdf === true && (i.password === undefined || i.password === "")) throw new Error("password is required when protectPdf is true");
        const body: Record<string, unknown> = { export_type: "url" };
        if (i.templateId !== undefined) body.template_id = i.templateId;
        if (i.html !== undefined) body.html = i.html;
        if (i.markdown !== undefined) body.markdown = i.markdown;
        if (i.prompt !== undefined) body.prompt = i.prompt;
        if (i.data !== undefined) body.data = i.data;
        if (i.engine !== undefined) body.engine = i.engine;
        if (i.format !== undefined) body.format = i.format;
        if (i.orientation !== undefined) body.orientation = i.orientation;
        if (i.fileName !== undefined) body.file_name = i.fileName;
        if (i.expiryMinutes !== undefined) body.expiry_time = i.expiryMinutes;
        if (i.protectPdf !== undefined) body.protect_pdf = i.protectPdf;
        if (i.password !== undefined) body.password = i.password;
        return call("POST", "/generate", body);
      },
    ),
    templates: router(
      {
        list: query(
          {
            description: "List saved templates (id, name, engine, timestamps). Paged with limit and offset; the response includes the total.",
            input: Paging,
          },
          async (_ctx, { limit, offset }) => call("GET", `/templates${page(limit, offset)}`),
        ),
        get: query(
          {
            description: "Get one saved template, including its full HTML content.",
            input: object({ templateId: string({ minLength: 1 }) }),
          },
          async (_ctx, { templateId }) => call("GET", `/templates/${encodeURIComponent(templateId)}`),
        ),
        create: mutation(
          {
            description: "Create a reusable HTML template with Handlebars tokens. engine is handlebars (default) or legacy.",
            input: object({ name: string({ minLength: 1 }), content: string({ minLength: 1 }), engine: Engine }),
          },
          async (_ctx, { name, content, engine }) =>
            call("POST", "/templates", { name, content, ...(engine !== undefined ? { engine } : {}) }),
        ),
        update: mutation(
          {
            description: "Partially update a template's name, content or engine; omitted fields keep their current value.",
            input: object({
              templateId: string({ minLength: 1 }),
              name: string().optional(),
              content: string().optional(),
              engine: Engine,
            }),
          },
          async (_ctx, { templateId, name, content, engine }) =>
            call("PATCH", `/templates/${encodeURIComponent(templateId)}`, {
              ...(name !== undefined ? { name } : {}),
              ...(content !== undefined ? { content } : {}),
              ...(engine !== undefined ? { engine } : {}),
            }),
        ),
        delete: mutation(
          {
            description: "Permanently delete a saved template.",
            input: object({ templateId: string({ minLength: 1 }) }),
          },
          async (_ctx, { templateId }) => call("DELETE", `/templates/${encodeURIComponent(templateId)}`),
        ),
      },
      { title: "Templates", description: "Reusable Handlebars HTML templates. Managing them does not use PDF credits." },
    ),
    logs: query(
      {
        description:
          "List recent API calls (endpoint, status, duration, whether billed, template) for auditing and troubleshooting. Paged with limit and offset. Logs are eventually consistent.",
        input: Paging,
      },
      async (_ctx, { limit, offset }) => call("GET", `/logs${page(limit, offset)}`),
    ),
  });
}

export default defineApp(
  { user: { accounts: { pdfgen: pdfgen.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfgen ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PDFgen",
        description: "Generate PDFs from saved templates, HTML, Markdown or an AI prompt, and manage templates, usage and API logs.",
        icons,
      },
    ),
  }),
);
