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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pdfmonkey.io/api/v1";

const pdfmonkey = defineProvider({
  name: "PDFMonkey",
  hosts: ["api.pdfmonkey.io"],
  auth: {
    apiKey: secrets({
      label: "Secret API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/current_user`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const { current_user } = await decodeJson(
      response,
      object({ current_user: object({ id: string(), email: string() }) }),
    );
    return { accountInfo: { externalId: current_user.id, displayName: current_user.email, email: current_user.email } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account, body = false) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  ...(body ? { "content-type": "application/json" } : {}),
});

// Builds a query string; nested keys are written as q[search] or page[number].
const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const payloadNote =
  "payload and meta are JSON objects (or JSON strings); meta may hold _filename for the output file name.";

// auth_token appears in user, template and card payloads; the vendor calls the template one
// "internal", and the user one may be the secret API key, so it is never returned.
const stripSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "auth_token")
        .map(([key, v]) => [key, stripSecrets(v)]),
    );
  return value;
};

const userFields = [
  "id",
  "email",
  "lang",
  "current_plan",
  "current_plan_interval",
  "available_documents",
  "trial_ends_on",
  "paying_customer",
] as const;

const pdfmonkeyTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    stripSecrets(await decodeJson(await fetch(`${base}${path}`, { signal, headers: headers(account) }), json())) as any;
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body: unknown) =>
    stripSecrets(
      await decodeJson(
        await fetch(`${base}${path}`, { method, signal, headers: headers(account, true), body: JSON.stringify(body) }),
        json(),
      ),
    ) as any;
  const remove = async (fetch: typeof globalThis.fetch, path: string) => {
    const response = await fetch(`${base}${path}`, { method: "DELETE", signal, headers: headers(account) });
    if (!response.ok) throw new Error(`PDFMonkey DELETE ${path} failed with ${response.status}: ${await response.text()}`);
    return { deleted: true };
  };

  return router({
    getCurrentUser: query(
      {
        description:
          "Get the authenticated PDFMonkey account: email, plan, remaining available_documents, trial end date and language.",
        input: object({}),
      },
      async ({ fetch }) => {
        const result = (await get(fetch, "/current_user")) as { current_user?: Record<string, unknown> };
        const user = result.current_user ?? {};
        return { current_user: Object.fromEntries(userFields.filter((k) => k in user).map((k) => [k, user[k]])) };
      },
    ),
    listPdfEngines: query(
      {
        description:
          "List the PDF engines (id, name, deprecated_on). Use these ids as pdfEngineId / pdfEngineDraftId in createTemplate and updateTemplate; v4 is recommended.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/engines"),
    ),
    listDocuments: query(
      {
        description:
          "List generated documents as lightweight document cards (24 per page), newest first. Filter by templateId, status (draft, pending, generating, success, failure), a free-text search, an updatedSince timestamp or a workspaceId. page starts at 1.",
        input: object({
          page: number().optional(),
          templateId: string().optional(),
          status: string().optional(),
          search: string().optional(),
          updatedSince: string().optional(),
          workspaceId: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        get(
          fetch,
          `/document_cards?${search({
            "page[number]": input.page,
            "q[document_template_id]": input.templateId,
            "q[status]": input.status,
            "q[search]": input.search,
            "q[updated_since]": input.updatedSince,
            "q[workspace_id]": input.workspaceId,
          })}`,
        ),
    ),
    getDocumentCard: query(
      {
        description:
          "Get one document card by id: status, filename and download_url. This is the recommended way to poll generation status; download_url is set once status is success.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) => get(fetch, `/document_cards/${encodeURIComponent(id)}`),
    ),
    getDocument: query(
      {
        description:
          "Get the full document by id, including its payload, meta, status, failure_cause, checksum and download_url.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) => get(fetch, `/documents/${encodeURIComponent(id)}`),
    ),
    createDocument: mutation(
      {
        description: `Create a document from a template. Set status to "pending" to queue generation immediately (default "draft"), then poll getDocumentCard until status is success to get download_url. ${payloadNote}`,
        input: object({
          templateId: string(),
          payload: json().optional(),
          meta: json().optional(),
          status: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { templateId, ...rest }) =>
        send(fetch, "POST", "/documents", { document: { document_template_id: templateId, ...rest } }),
    ),
    generateDocumentSync: mutation(
      {
        description: `Create a document and wait server-side (up to 6 minutes) for generation to finish; returns the finished document card with download_url. Use for low-volume or interactive generation. status must be "pending" (the default here). ${payloadNote}`,
        input: object({ templateId: string(), payload: json().optional(), meta: json().optional() }),
        approval: always(),
      },
      async ({ fetch }, { templateId, ...rest }) =>
        send(fetch, "POST", "/documents/sync", {
          document: { document_template_id: templateId, status: "pending", ...rest },
        }),
    ),
    updateDocument: mutation(
      {
        description: `Update a document: change its templateId, payload or meta, or set status to "pending" to (re)generate it. ${payloadNote}`,
        input: object({
          id: string(),
          templateId: string().optional(),
          payload: json().optional(),
          meta: json().optional(),
          status: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, templateId, ...rest }) =>
        send(fetch, "PUT", `/documents/${encodeURIComponent(id)}`, {
          document: { ...(templateId === undefined ? {} : { document_template_id: templateId }), ...rest },
        }),
    ),
    deleteDocument: mutation(
      {
        description: "Permanently delete a document and its generated file.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => remove(fetch, `/documents/${encodeURIComponent(id)}`),
    ),
    listTemplates: query(
      {
        description:
          "List template cards (without body, styles or test data) for one workspace. workspaceId is required and is the app_id of a template or the workspace id shown in the dashboard. folders is a comma-separated list of folder ids, or none or all (default). page starts at 1; sort is an attribute name.",
        input: object({
          workspaceId: string(),
          folders: string().optional(),
          page: number().optional(),
          sort: string().optional(),
        }),
      },
      async ({ fetch }, input) =>
        get(
          fetch,
          `/document_template_cards?${search({
            "q[workspace_id]": input.workspaceId,
            "q[folders]": input.folders,
            page: input.page,
            sort: input.sort,
          })}`,
        ),
    ),
    getTemplate: query(
      {
        description:
          "Get the full template by id: published and draft body, scss_style, sample_data and settings, pdf engine ids, ttl, output_type and preview_url.",
        input: object({ id: string() }),
      },
      async ({ fetch }, { id }) => get(fetch, `/document_templates/${encodeURIComponent(id)}`),
    ),
    createTemplate: mutation(
      {
        description:
          "Create a template in a workspace (appId). identifier is the name (1-100 chars). body and scssStyle are HTML+Liquid and CSS/SCSS; sampleData is a JSON string; settings holds paper format, margins, header and footer. outputType is pdf (default) or image; editionMode is code (default) or builder. The *Draft fields set unpublished content; ttl is the retention of generated documents in seconds.",
        input: object({
          appId: string(),
          identifier: string(),
          body: string().optional(),
          bodyDraft: string().optional(),
          scssStyle: string().optional(),
          scssStyleDraft: string().optional(),
          sampleData: string().optional(),
          sampleDataDraft: string().optional(),
          settings: json().optional(),
          settingsDraft: json().optional(),
          pdfEngineId: string().optional(),
          pdfEngineDraftId: string().optional(),
          templateFolderId: string().optional(),
          ttl: number().optional(),
          editionMode: string().optional(),
          outputType: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/document_templates", { document_template: templateBody(input) }),
    ),
    updateTemplate: mutation(
      {
        description:
          "Update a template by id. Accepts the same optional fields as createTemplate (except appId). Draft fields change unpublished content; the non-draft fields are what documents are generated from.",
        input: object({
          id: string(),
          identifier: string().optional(),
          body: string().optional(),
          bodyDraft: string().optional(),
          scssStyle: string().optional(),
          scssStyleDraft: string().optional(),
          sampleData: string().optional(),
          sampleDataDraft: string().optional(),
          settings: json().optional(),
          settingsDraft: json().optional(),
          pdfEngineId: string().optional(),
          pdfEngineDraftId: string().optional(),
          templateFolderId: string().optional(),
          ttl: number().optional(),
          editionMode: string().optional(),
          outputType: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, ...input }) =>
        send(fetch, "PUT", `/document_templates/${encodeURIComponent(id)}`, { document_template: templateBody(input) }),
    ),
    deleteTemplate: mutation(
      {
        description: "Permanently delete a template by id.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => remove(fetch, `/document_templates/${encodeURIComponent(id)}`),
    ),
  });
};

const templateFields = {
  appId: "app_id",
  identifier: "identifier",
  body: "body",
  bodyDraft: "body_draft",
  scssStyle: "scss_style",
  scssStyleDraft: "scss_style_draft",
  sampleData: "sample_data",
  sampleDataDraft: "sample_data_draft",
  settings: "settings",
  settingsDraft: "settings_draft",
  pdfEngineId: "pdf_engine_id",
  pdfEngineDraftId: "pdf_engine_draft_id",
  templateFolderId: "template_folder_id",
  ttl: "ttl",
  editionMode: "edition_mode",
  outputType: "output_type",
} as const;

const templateBody = (input: Partial<Record<keyof typeof templateFields, unknown>>) =>
  Object.fromEntries(
    (Object.keys(templateFields) as Array<keyof typeof templateFields>)
      .filter((key) => input[key] !== undefined)
      .map((key) => [templateFields[key], input[key]]),
  );

export default defineApp({ user: { accounts: { pdfmonkey: pdfmonkey.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pdfmonkey ?? [], (account) => pdfmonkeyTools(account, signal), { signal }), {
    title: "PDFMonkey",
    description:
      "Generate PDFs and images from templates with PDFMonkey: create, poll and manage documents, and manage templates.",
    icons,
  }),
}));
