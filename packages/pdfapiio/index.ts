import {
  accountRouter,
  array,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://pdf-api.io/api";

const pdfapiio = defineProvider({
  name: "PDF-API.io",
  hosts: ["pdf-api.io"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing templates is read-only and does not generate (or bill) a PDF.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
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
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
}

const Output = string().optional();

const outputBody = (output: string | undefined): Record<string, unknown> => {
  if (output !== undefined && output !== "pdf" && output !== "url") throw new Error('output must be "pdf" or "url"');
  return output !== undefined ? { output } : {};
};

function build(call: ReturnType<typeof client>) {
  return router({
    listTemplates: query(
      {
        description:
          "List the templates available to the token: id, name, type (editor or html), created_at, meta and the variables each template expects.",
        input: object({}),
      },
      async () => call("GET", "/templates"),
    ),
    getTemplate: query(
      {
        description:
          "Get one template by id, including its team, type, meta and variables (arrays appear as name, name[] and name[].field entries) so you know the data shape to send when rendering.",
        input: object({ templateId: string({ minLength: 1 }) }),
      },
      async (_ctx, { templateId }) => call("GET", `/templates/${encodeURIComponent(templateId)}`),
    ),
    renderPdf: mutation(
      {
        description:
          'Render a PDF from a template merged with data. Returns JSON {status, data} where data is the base64 PDF, or with output "url" a link to the PDF that expires after 15 minutes (prefer "url" for anything large). data keys must match the template variables; repeatable table rows take an array of objects.',
        input: object({ templateId: string({ minLength: 1 }), data: json(), output: Output }),
      },
      async (_ctx, { templateId, data, output }) =>
        call("POST", `/templates/${encodeURIComponent(templateId)}/pdf`, { data, ...outputBody(output) }),
    ),
    mergeTemplates: mutation(
      {
        description:
          'Render several templates, each with its own data, and combine them into one PDF (for example an invoice plus a shipping label). Same response as renderPdf; output "url" returns a link that expires after 15 minutes.',
        input: object({
          templates: array(object({ id: string({ minLength: 1 }), data: json() })),
          output: Output,
        }),
      },
      async (_ctx, { templates, output }) => call("POST", "/templates/merge", { templates, ...outputBody(output) }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { pdfapiio: pdfapiio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfapiio ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PDF-API.io",
        description: "List PDF-API.io templates and render PDFs from them, singly or merged.",
        icons,
      },
    ),
  }),
);
