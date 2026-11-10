import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  jsonSchema,
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

const base = "https://api.cloudpdf.io";

// GET /v2/auth returns JSON: {"message":"Authorized","organizationName":"..."}.
const authResult = object({ organizationName: string() });

const cloudpdf = defineProvider({
  name: "CloudPDF",
  hosts: ["api.cloudpdf.io"],
  auth: {
    // Dashboard > Settings > API Keys > "Simple API Key", sent in the X-Authorization header.
    apiKey: secrets({
      label: "Simple API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/auth`, {
      signal,
      headers: { "X-Authorization": account.fields.token },
    });
    await decodeJson(response, authResult);
  },
});

type Fetch = typeof fetch;

const Permissions = object({
  download: jsonSchema({ type: "string", enum: ["NotAllowed", "Allowed", "EmailRequired"] }).optional(),
  search: boolean().optional(),
  selection: boolean().optional(),
  info: array(jsonSchema({ type: "string", enum: ["email", "name", "organization", "phone"] })).optional(),
  public: boolean().optional(),
});
const permissionsHelp =
  "defaultPermissions: { download: NotAllowed | Allowed | EmailRequired, search, selection, info: [email|name|organization|phone], public }.";

function api(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        "X-Authorization": token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  const id = (value: string | number) => encodeURIComponent(String(value));
  const clean = (value: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

  return router({
    account: router({
      auth: query(
        { description: "Verify the API key and return the organization name.", input: object({}) },
        async () => {
          const response = await fetcher(`${base}/v2/auth`, { signal, headers: { "X-Authorization": token } });
          return decodeJson(response, authResult);
        },
      ),
      get: query(
        { description: "Get the account's plan, quotas and usage.", input: object({}) },
        async () => call("GET", "/v2/account"),
      ),
    }),
    documents: router({
      create: mutation(
        {
          description: `Create a document. The response contains file.uploadUrl, a pre-signed URL to PUT the PDF to (Content-Type: application/pdf); then call documents.files.patch with uploadCompleted true. ${permissionsHelp}`,
          input: object({
            name: string({ minLength: 1 }),
            description: string().optional(),
            parentId: string().optional(),
            tags: array(string()).optional(),
            defaultPermissions: Permissions.optional(),
          }),
        },
        async (_ctx, args) => call("POST", "/v2/documents", clean(args)),
      ),
      get: query(
        { description: "Get a document and its files by id.", input: object({ id: string() }) },
        async (_ctx, { id: docId }) => call("GET", `/v2/documents/${id(docId)}`),
      ),
      update: mutation(
        {
          description: `Update a document's name, description, parent, tags or default permissions. ${permissionsHelp}`,
          input: object({
            id: string(),
            name: string().optional(),
            description: string().optional(),
            parentId: string().optional(),
            tags: array(string()).optional(),
            defaultPermissions: Permissions.optional(),
          }),
        },
        async (_ctx, { id: docId, ...rest }) => call("PUT", `/v2/documents/${id(docId)}`, clean(rest)),
      ),
      delete: mutation(
        { description: "Delete a document by id.", input: object({ id: string() }) },
        async (_ctx, { id: docId }) => call("DELETE", `/v2/documents/${id(docId)}`),
      ),
      files: router({
        create: mutation(
          {
            description:
              "Create a new file version for a document. The response contains an uploadUrl to PUT the PDF to.",
            input: object({ id: string(), name: string({ minLength: 1 }) }),
          },
          async (_ctx, { id: docId, name }) => call("POST", `/v2/documents/${id(docId)}/files`, { name }),
        ),
        patch: mutation(
          {
            description:
              "Mark a file upload as completed (uploadCompleted true) so CloudPDF starts processing it.",
            input: object({ id: string(), fileId: string(), uploadCompleted: boolean() }),
          },
          async (_ctx, { id: docId, fileId, uploadCompleted }) =>
            call("PATCH", `/v2/documents/${id(docId)}/files/${id(fileId)}`, { uploadCompleted }),
        ),
        get: query(
          {
            description: "Get a document file and its processing status (WaitingUpload, Processing, Failed, Completed).",
            input: object({ id: string(), fileId: string() }),
          },
          async (_ctx, { id: docId, fileId }) => call("GET", `/v2/documents/${id(docId)}/files/${id(fileId)}`),
        ),
      }),
    }),
    webhooks: router({
      list: query({ description: "List webhooks.", input: object({}) }, async () => call("GET", "/v2/webhooks")),
      get: query(
        { description: "Get a webhook by integer id.", input: object({ id: number() }) },
        async (_ctx, { id: hookId }) => call("GET", `/v2/webhooks/${id(hookId)}`),
      ),
      create: mutation(
        {
          description:
            "Create a webhook. events may include document.created, document.updated, collection.created, collection.updated, tracker.new, lead.new, file.processed. The secret is sent to your endpoint as a query string value.",
          input: object({
            name: string({ minLength: 1 }),
            url: string({ minLength: 1 }),
            secret: string().optional(),
            events: array(string()).optional(),
            headers: record(string()).optional(),
          }),
        },
        async (_ctx, args) => call("POST", "/v2/webhooks", clean(args)),
      ),
      update: mutation(
        {
          description: "Replace a webhook's name, url, secret, events and headers. The vendor's update docs list the same events as create except file.processed (likely a docs omission).",
          input: object({
            id: number(),
            name: string({ minLength: 1 }),
            url: string({ minLength: 1 }),
            secret: string().optional(),
            events: array(string()).optional(),
            headers: record(string()).optional(),
          }),
        },
        async (_ctx, { id: hookId, ...rest }) => call("PUT", `/v2/webhooks/${id(hookId)}`, clean(rest)),
      ),
      delete: mutation(
        { description: "Delete a webhook by integer id.", input: object({ id: number() }) },
        async (_ctx, { id: hookId }) => call("DELETE", `/v2/webhooks/${id(hookId)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { cloudpdf: cloudpdf.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudpdf ?? [],
        (account) =>
          withApprovals(api(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CloudPDF",
        description: "Create, upload, update and share PDF documents in CloudPDF, and manage file versions, webhooks and account usage.",
        icons,
      },
    ),
  }),
);
