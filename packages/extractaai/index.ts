import {
  accountRouter,
  array,
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

const base = "https://api.extracta.ai/api/v1";

const extracta = defineProvider({
  name: "Extracta.ai",
  hosts: ["api.extracta.ai"],
  auth: {
    // Extracta has no OAuth: keys are generated at https://app.extracta.ai/api.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ status: string(), credits: number() }));
    return { accountInfo: { externalId: "extracta", displayName: "Extracta.ai" } };
  },
});

type Fetch = typeof fetch;
type Call = (method: string, path: string, body: Record<string, unknown> | undefined) => Promise<unknown>;
type Upload = (path: string, fields: Record<string, string>, files: readonly UploadFile[]) => Promise<unknown>;
type UploadFile = { name: string; contentBase64: string; mimeType?: string | undefined };

const File = object({
  name: string({ minLength: 1 }),
  contentBase64: string({ minLength: 1 }),
  mimeType: string().optional(),
});

function bytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, body) => {
    const response = await fetcher(`${base}/${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const upload: Upload = async (path, fields, files) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    for (const file of files) {
      form.append("files", new Blob([bytes(file.contentBase64)], { type: file.mimeType ?? "application/octet-stream" }), file.name);
    }
    const response = await fetcher(`${base}/${path}`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    return decodeJson(response, json());
  };

  const uploadInput = (idKey: string) =>
    object({
      [idKey]: string({ minLength: 1 }),
      batchId: string().optional(),
      files: array(File),
    });
  const fieldsOf = (idKey: string, args: Record<string, unknown>) => {
    const fields: Record<string, string> = { [idKey]: String(args[idKey]) };
    if (typeof args.batchId === "string") fields.batchId = args.batchId;
    return fields;
  };

  return router({
    credits: router({
      get: query(
        { description: "Remaining credits on the account (1 credit = 1 page processed).", input: object({}) },
        async () => call("GET", "credits", undefined),
      ),
    }),
    extractions: router(
      {
        create: mutation(
          {
            description:
              "Create an extraction template. extractionDetails: { name, description?, language, options?: { hasTable, hasVisuals, handwrittenTextRecognition, checkboxRecognition, longDocument, splitPdfPages, specificPageProcessing, ... }, fields: [{ key, description?, example?, type?: 'string'|'object'|'array', properties?, items? }] }. Returns extractionId.",
            input: object({ extractionDetails: record(json()) }),
          },
          async (_ctx, args) => call("POST", "createExtraction", { extractionDetails: args.extractionDetails }),
        ),
        view: query(
          { description: "View an extraction template and its batches.", input: object({ extractionId: string({ minLength: 1 }) }) },
          async (_ctx, args) => call("POST", "viewExtraction", { extractionId: args.extractionId }),
        ),
        update: mutation(
          {
            description: "Update an extraction template. extractionDetails holds only the properties to change (name, description, language, options, fields).",
            input: object({ extractionId: string({ minLength: 1 }), extractionDetails: record(json()) }),
          },
          async (_ctx, args) =>
            call("PATCH", "updateExtraction", { extractionId: args.extractionId, extractionDetails: args.extractionDetails }),
        ),
        delete: mutation(
          {
            description:
              "Permanently delete data. extractionId alone deletes the whole extraction; with batchId deletes that batch; with batchId and fileId deletes one file.",
            input: object({ extractionId: string({ minLength: 1 }), batchId: string().optional(), fileId: string().optional() }),
          },
          async (_ctx, args) =>
            call("DELETE", "deleteExtraction", {
              extractionId: args.extractionId,
              ...(args.batchId === undefined ? {} : { batchId: args.batchId }),
              ...(args.fileId === undefined ? {} : { fileId: args.fileId }),
            }),
        ),
        uploadFiles: mutation(
          {
            description:
              "Upload documents (base64 content) to an extraction for processing. Omit batchId to start a new batch; pass an existing one to add to it. Returns batchId and files[] (each with fileId); then call getResults.",
            input: uploadInput("extractionId"),
          },
          async (_ctx, args) => upload("uploadFiles", fieldsOf("extractionId", args), args.files),
        ),
        getResults: query(
          {
            description:
              "Get extracted results for a batch (optionally one file). status 'waiting' means still processing: retry after at least 2 seconds.",
            input: object({ extractionId: string({ minLength: 1 }), batchId: string({ minLength: 1 }), fileId: string().optional() }),
          },
          async (_ctx, args) =>
            call("POST", "getBatchResults", {
              extractionId: args.extractionId,
              batchId: args.batchId,
              ...(args.fileId === undefined ? {} : { fileId: args.fileId }),
            }),
        ),
      },
      { title: "Extractions", description: "Define extraction templates, upload documents and read structured results." },
    ),
    classifications: router(
      {
        create: mutation(
          {
            description:
              "Create a document classification. classificationDetails: { name, description?, documentTypes: [{ name, description, uniqueWords: string[], extractionId? }] }. Returns classificationId.",
            input: object({ classificationDetails: record(json()) }),
          },
          async (_ctx, args) =>
            call("POST", "documentClassification/createClassification", { classificationDetails: args.classificationDetails }),
        ),
        view: query(
          { description: "View a classification and its document types.", input: object({ classificationId: string({ minLength: 1 }) }) },
          async (_ctx, args) => call("POST", "documentClassification/viewClassification", { classificationId: args.classificationId }),
        ),
        update: mutation(
          {
            description: "Update a classification. classificationDetails holds only the properties to change.",
            input: object({ classificationId: string({ minLength: 1 }), classificationDetails: record(json()) }),
          },
          async (_ctx, args) =>
            call("PATCH", "documentClassification/updateClassification", {
              classificationId: args.classificationId,
              classificationDetails: args.classificationDetails,
            }),
        ),
        deleteClassification: mutation(
          {
            description: "Permanently delete a classification with all its batches, results and files.",
            input: object({ classificationId: string({ minLength: 1 }) }),
          },
          async (_ctx, args) =>
            call("DELETE", "documentClassification/deleteClassification", { classificationId: args.classificationId }),
        ),
        deleteBatch: mutation(
          {
            description: "Permanently delete a classification batch with its results and files.",
            input: object({ classificationId: string({ minLength: 1 }), batchId: string({ minLength: 1 }) }),
          },
          async (_ctx, args) =>
            call("DELETE", "documentClassification/deleteBatch", { classificationId: args.classificationId, batchId: args.batchId }),
        ),
        deleteFiles: mutation(
          {
            description: "Permanently delete the listed files (and their results) from a classification batch.",
            input: object({
              classificationId: string({ minLength: 1 }),
              batchId: string({ minLength: 1 }),
              fileIds: array(string({ minLength: 1 })),
            }),
          },
          async (_ctx, args) =>
            call("DELETE", "documentClassification/deleteFiles", {
              classificationId: args.classificationId,
              batchId: args.batchId,
              fileIds: args.fileIds,
            }),
        ),
        uploadFiles: mutation(
          {
            description:
              "Upload documents (base64 content) to a classification. Omit batchId to start a new batch. Returns batchId and files[] (each with fileId); then call getResults.",
            input: uploadInput("classificationId"),
          },
          async (_ctx, args) => upload("documentClassification/uploadFiles", fieldsOf("classificationId", args), args.files),
        ),
        getResults: query(
          {
            description:
              "Get classification results for a batch (optionally one file). status 'waiting' means still processing: retry after at least 2 seconds.",
            input: object({ classificationId: string({ minLength: 1 }), batchId: string({ minLength: 1 }), fileId: string().optional() }),
          },
          async (_ctx, args) =>
            call("POST", "documentClassification/getResults", {
              classificationId: args.classificationId,
              batchId: args.batchId,
              ...(args.fileId === undefined ? {} : { fileId: args.fileId }),
            }),
        ),
      },
      { title: "Classifications", description: "Define document types, upload documents and read classification results." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { extracta: extracta.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.extracta ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Extracta.ai",
        description: "AI document data extraction and classification: templates, uploads, results and credits.",
        instructions:
          "Flow: create an extraction (or classification), upload files with base64 content, then poll getResults (at most once every 2 seconds) until status is no longer 'waiting'. Each processed page costs one credit; check credits.get first.",
        icons,
      },
    ),
  }),
);
