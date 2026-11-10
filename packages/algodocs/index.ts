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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.algodocs.com/v1";

const algodocs = defineProvider({
  name: "Algodocs",
  hosts: ["api.algodocs.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, { signal, headers: { "x-api-key": account.fields.token } });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (path: string, init: RequestInit = {}) => {
    const response = await fetcher(`${base}${path}`, {
      ...init,
      signal,
      headers: { "x-api-key": token },
    });
    return decodeJson(response, json());
  };
  return {
    get: (path: string) => send(path),
    // Uploads are multipart/form-data; fetch sets the boundary header from the FormData body.
    upload: (path: string, fields: Record<string, string>) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.set(key, value);
      return send(path, { method: "POST", body: form });
    },
  };
}

const target = { extractorId: string({ minLength: 1 }), folderId: string({ minLength: 1 }) };

function build(api: ReturnType<typeof client>) {
  const id = encodeURIComponent;
  return router({
    me: query(
      { description: "Return the full name and email of the account the API key belongs to.", input: object({}) },
      async () => api.get("/me"),
    ),
    listExtractors: query(
      {
        description: "List every extractor on the account (id and name). An extractor defines which fields are pulled from a document type; its id is needed for uploads.",
        input: object({}),
      },
      async () => api.get("/extractors"),
    ),
    listFolders: query(
      {
        description: "List the folder tree (id, parentId, name). parentId is null for the root folder. A folder id is needed for uploads.",
        input: object({}),
      },
      async () => api.get("/folders"),
    ),
    uploadDocumentFromUrl: mutation(
      {
        description:
          "Have AlgoDocs fetch a document from a publicly reachable URL and process it with an extractor into a folder. Returns the document id (id, fileSize, fileMD5CheckSum, uploadedAt); processing is asynchronous, so poll getExtractedDataByDocument until data is populated.",
        input: object({ ...target, url: string({ minLength: 1 }) }),
      },
      async (_ctx, { extractorId, folderId, url }) =>
        api.upload(`/document/upload_url/${id(extractorId)}/${id(folderId)}`, { url }),
    ),
    uploadDocumentBase64: mutation(
      {
        description:
          "Upload a document sent as base64 content (PDF, PNG, JPG, Word or Excel) for an extractor and folder. Returns the document id; processing is asynchronous, so poll getExtractedDataByDocument until data is populated.",
        input: object({ ...target, fileBase64: string({ minLength: 1 }), filename: string({ minLength: 1 }) }),
      },
      async (_ctx, { extractorId, folderId, fileBase64, filename }) =>
        api.upload(`/document/upload_base64/${id(extractorId)}/${id(folderId)}`, {
          file_base64: fileBase64,
          filename,
        }),
    ),
    getExtractedDataByDocument: query(
      {
        description:
          "Get the extracted data for one document by the numeric document id returned from an upload. Always returns an array with one object per record (split or multi-page documents yield several). The data field is empty until processing finishes; it holds an error field if the classifier could not recognise the document.",
        input: object({ documentId: string({ minLength: 1 }) }),
      },
      async (_ctx, { documentId }) => api.get(`/extracted_data/${id(documentId)}`),
    ),
    getExtractedDataByExtractor: query(
      {
        description:
          "Get extracted data for every document processed by an extractor. Optional folderId restricts to one folder, date (ISO 8601) returns only documents uploaded after it, limit caps the record count (default 10000).",
        input: object({ extractorId: string({ minLength: 1 }), folderId: string().optional(), date: string().optional(), limit: number().optional() }),
      },
      async (_ctx, { extractorId, folderId, date, limit }) => {
        const params = new URLSearchParams();
        if (folderId) params.set("folderId", folderId);
        if (date) params.set("date", date);
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return api.get(`/extracted_data/${id(extractorId)}${qs ? `?${qs}` : ""}`);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { algodocs: algodocs.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.algodocs ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Algodocs",
        description: "Extract structured data from invoices, receipts and other documents with AlgoDocs extractors.",
        icons,
      },
    ),
  }),
);
