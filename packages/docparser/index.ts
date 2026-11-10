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

const base = "https://api.docparser.com";

const docparser = defineProvider({
  name: "Docparser",
  hosts: ["api.docparser.com"],
  auth: {
    apiKey: secrets({
      label: "Secret API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v1/ping answers {"msg":"pong"} to a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/ping`, { signal, headers: { api_key: account.fields.token } });
    await decodeJson(response, object({ msg: string() }));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const id = (value: string) => encodeURIComponent(value);

const docparserTools = (account: Account, signal: AbortSignal) => {
  const headers = { api_key: account.fields.token };
  const form = (fields: Record<string, string | undefined>) => {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) if (value !== undefined) body.set(key, value);
    return body;
  };
  return router({
    listParsers: query(
      { description: "List all document parsers in the account as id and label.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/v1/parsers`, { signal, headers }), json()),
    ),
    listParserModels: query(
      {
        description: "List the model layouts of a parser as id and label.",
        input: object({ parserId: string() }),
      },
      async ({ fetch }, { parserId }) =>
        decodeJson(await fetch(`${base}/v1/parser/models/${id(parserId)}`, { signal, headers }), json()),
    ),
    getDocumentStatus: query(
      {
        description:
          "Get the processing state of one document: importing, processing and webhook flags, a Unix timestamp per stage, webhook counters and failed_jobs.",
        input: object({ parserId: string(), documentId: string() }),
      },
      async ({ fetch }, { parserId, documentId }) =>
        decodeJson(
          await fetch(`${base}/v2/document/status/${id(parserId)}/${id(documentId)}`, { signal, headers }),
          json(),
        ),
    ),
    getDocumentResults: query(
      {
        description:
          "Get the parsed data of one document. format is object (nested, default) or flat. includeChildren also returns data from child documents created by splitting. Rate limit 60 calls per minute.",
        input: object({
          parserId: string(),
          documentId: string(),
          format: string().optional(),
          includeChildren: boolean().optional(),
        }),
      },
      async ({ fetch }, { parserId, documentId, format, includeChildren }) =>
        decodeJson(
          await fetch(
            `${base}/v1/results/${id(parserId)}/${id(documentId)}${search({ format, include_children: includeChildren })}`,
            { signal, headers },
          ),
          json(),
        ),
    ),
    listParsedResults: query(
      {
        description:
          "Get parsed data of several documents of a parser. list is last_uploaded (default), uploaded_after or processed_after; the latter two require date (ISO 8601 or Unix timestamp). limit defaults to 100, at most 10000. sortBy is one of parsed_at, processed_at, uploaded_at, first_processed_at, imported_at, integrated_at, dispatched_webhook_at, preprocessed_at; sortOrder is ASC or DESC (default). remoteId filters by the remote id given at upload. Rate limit 30 calls per minute.",
        input: object({
          parserId: string(),
          format: string().optional(),
          list: string().optional(),
          limit: number().optional(),
          offset: number().optional(),
          date: string().optional(),
          remoteId: string().optional(),
          includeProcessingQueue: boolean().optional(),
          sortBy: string().optional(),
          sortOrder: string().optional(),
        }),
      },
      async ({ fetch }, { parserId, remoteId, includeProcessingQueue, sortBy, sortOrder, ...rest }) =>
        decodeJson(
          await fetch(
            `${base}/v1/results/${id(parserId)}${search({
              ...rest,
              remote_id: remoteId,
              include_processing_queue: includeProcessingQueue,
              sort_by: sortBy,
              sort_order: sortOrder,
            })}`,
            { signal, headers },
          ),
          json(),
        ),
    ),
    uploadDocumentContent: mutation(
      {
        description:
          "Upload a document to a parser from base64 content. fileName is optional (generated when empty); remoteId is an optional id of your own that later filters results. Returns the document id and the remaining quota.",
        input: object({
          parserId: string(),
          fileContent: string(),
          fileName: string().optional(),
          remoteId: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { parserId, fileContent, fileName, remoteId }) =>
        decodeJson(
          await fetch(`${base}/v1/document/upload/${id(parserId)}`, {
            method: "POST",
            signal,
            headers,
            body: form({ file_content: fileContent, file_name: fileName, remote_id: remoteId }),
          }),
          json(),
        ),
    ),
    fetchDocumentFromUrl: mutation(
      {
        description:
          "Have Docparser download a publicly accessible document URL into a parser. remoteId is an optional id of your own. Returns document_id, parser_id, remote_id and a status message.",
        input: object({ parserId: string(), url: string(), remoteId: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { parserId, url, remoteId }) =>
        decodeJson(
          await fetch(`${base}/v2/document/fetch/${id(parserId)}`, {
            method: "POST",
            signal,
            headers,
            body: form({ url, remote_id: remoteId }),
          }),
          json(),
        ),
    ),
    reparseDocuments: mutation(
      {
        description: "Queue documents for re-parsing with the parser's current rules. documentIds must be non-empty.",
        input: object({ parserId: string(), documentIds: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { parserId, documentIds }) => {
        const body = new FormData();
        for (const documentId of documentIds) body.append("document_ids[]", documentId);
        return decodeJson(
          await fetch(`${base}/v1/document/reparse/${id(parserId)}`, { method: "POST", signal, headers, body }),
          json(),
        );
      },
    ),
    reintegrateDocuments: mutation(
      {
        description:
          "Queue documents for integration again, re-sending their data to the parser's integrations. documentIds must be non-empty.",
        input: object({ parserId: string(), documentIds: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { parserId, documentIds }) => {
        const body = new FormData();
        for (const documentId of documentIds) body.append("document_ids[]", documentId);
        return decodeJson(
          await fetch(`${base}/v1/document/reintegrate/${id(parserId)}`, { method: "POST", signal, headers, body }),
          json(),
        );
      },
    ),
  });
};

export default defineApp({ user: { accounts: { docparser: docparser.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.docparser ?? [], (account) => docparserTools(account, signal), { signal }), {
    title: "Docparser",
    description: "List parsers, upload or fetch documents, check processing status and read parsed data in Docparser.",
    icons,
  }),
}));
