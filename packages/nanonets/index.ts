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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.nanonets.com/api/v2";

const nanonets = defineProvider({
  name: "Nanonets",
  hosts: ["app.nanonets.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Lists the account's external integrations (documented, read-only); answers for any valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/externalIntegrations`, {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

// Nanonets uses HTTP Basic auth: the API key is the username, the password is empty.
const authorization = (account: Account) => `Basic ${btoa(`${account.fields.token}:`)}`;

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const modelId = string({ minLength: 1 });
const part = encodeURIComponent;

const nanonetsTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: authorization(account), Accept: "application/json" };

  const get = (fetch: typeof globalThis.fetch, path: string) =>
    fetch(`${base}${path}`, { signal, headers }).then((response) => decodeJson(response, json()));

  const post = (fetch: typeof globalThis.fetch, path: string, body: BodyInit, contentType?: string) =>
    fetch(`${base}${path}`, {
      method: "POST",
      signal,
      headers: contentType === undefined ? headers : { ...headers, "content-type": contentType },
      body,
    }).then((response) => decodeJson(response, json()));

  const fileBlob = (base64: string, mimeType: string | undefined) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: mimeType ?? "application/octet-stream" });
  };

  const predictUrls = (fetch: typeof globalThis.fetch, input: { modelId: string; urls: string[]; requestMetadata?: string | undefined; pagesToProcess?: string | undefined; language?: string | undefined }, async_: boolean) => {
    const form = new URLSearchParams();
    for (const url of input.urls) form.append("urls", url);
    if (input.requestMetadata !== undefined) form.set("request_metadata", input.requestMetadata);
    if (!async_ && input.pagesToProcess !== undefined) form.set("pages_to_process", input.pagesToProcess);
    const query_ = async_ ? search({ async: true }) : search({ l: input.language });
    return post(
      fetch,
      `/OCR/Model/${part(input.modelId)}/LabelUrls/${query_}`,
      form.toString(),
      "application/x-www-form-urlencoded",
    );
  };

  const predictFile = (
    fetch: typeof globalThis.fetch,
    input: { modelId: string; fileBase64: string; fileName: string; mimeType?: string | undefined; requestMetadata?: string | undefined; pagesToProcess?: string | undefined; language?: string | undefined },
    async_: boolean,
  ) => {
    const form = new FormData();
    form.set("file", fileBlob(input.fileBase64, input.mimeType), input.fileName);
    if (input.requestMetadata !== undefined) form.set("request_metadata", input.requestMetadata);
    if (!async_ && input.pagesToProcess !== undefined) form.set("pages_to_process", input.pagesToProcess);
    const query_ = async_ ? search({ async: true }) : search({ l: input.language });
    return post(fetch, `/OCR/Model/${part(input.modelId)}/LabelFile/${query_}`, form);
  };

  return router({
    models: router(
      {
        train: mutation(
          {
            description:
              "Train or retrain an OCR model after uploading training images. Training runs asynchronously; it finishes in the background; check the model in the Nanonets app.",
            input: object({ modelId }),
            approval: always(),
          },
          async ({ fetch }, { modelId: id }) => post(fetch, `/OCR/Model/${part(id)}/Train/`, ""),
        ),
        uploadTrainingUrls: mutation(
          {
            description:
              "Upload training images to a model by public URL. data is an array of annotations, one per image: { filename: <the image url>, object: [{ name: <label>, bndbox: { xmin, ymin, xmax, ymax } }] }. urls is the array of image URLs.",
            input: object({
              modelId,
              data: array(
                object({
                  filename: string({ minLength: 1 }),
                  object: array(
                    object({
                      name: string({ minLength: 1 }),
                      bndbox: object({ xmin: number(), ymin: number(), xmax: number(), ymax: number() }),
                    }),
                  ),
                }),
              ),
              urls: array(string({ minLength: 1 })),
            }),
            approval: always(),
          },
          async ({ fetch }, { modelId: id, data, urls }) =>
            post(fetch, `/OCR/Model/${part(id)}/UploadUrls/`, JSON.stringify({ data, urls }), "application/json"),
        ),
        uploadTrainingFile: mutation(
          {
            description:
              "Upload one training image (base64) to a model. data is a JSON string of the annotation array [{ filename, object: [{ name, bndbox: { xmin, ymin, xmax, ymax } }] }]; each filename must equal fileName.",
            input: object({
              modelId,
              fileBase64: string({ minLength: 1 }),
              fileName: string({ minLength: 1 }),
              mimeType: string().optional(),
              data: string({ minLength: 1 }),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            const form = new FormData();
            form.set("data", input.data);
            form.set("file", fileBlob(input.fileBase64, input.mimeType), input.fileName);
            return post(fetch, `/OCR/Model/${part(input.modelId)}/UploadFile/`, form);
          },
        ),
      },
      { title: "Models", description: "Train OCR models and add training images." },
    ),
    predictions: router(
      {
        fromUrls: mutation(
          {
            description:
              "Run an OCR model on documents at public URLs and wait for the extracted fields and tables. Best for documents of 3 pages or fewer; use fromUrlsAsync for longer ones. Returns per-page predictions with label, ocr_text, score and bounding boxes. pagesToProcess is comma-separated page numbers such as '1,2'; language is an ISO code and is usually best left unset.",
            input: object({
              modelId,
              urls: json(),
              requestMetadata: string().optional(),
              pagesToProcess: string().optional(),
              language: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => predictUrls(fetch, { ...input, urls: asStrings(input.urls) }, false),
        ),
        fromUrlsAsync: mutation(
          {
            description:
              "Queue documents at public URLs for asynchronous processing by an OCR model; recommended above 3 pages. Returns request_file_id values; fetch results with predictions.getByFile once processed. requestMetadata is echoed back to help you match files.",
            input: object({ modelId, urls: json(), requestMetadata: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) => predictUrls(fetch, { ...input, urls: asStrings(input.urls) }, true),
        ),
        fromFile: mutation(
          {
            description:
              "Upload a document (base64) to an OCR model and wait for the extracted fields and tables. Best for 3 pages or fewer; use fromFileAsync for longer ones. Same response shape as fromUrls.",
            input: object({
              modelId,
              fileBase64: string({ minLength: 1 }),
              fileName: string({ minLength: 1 }),
              mimeType: string().optional(),
              requestMetadata: string().optional(),
              pagesToProcess: string().optional(),
              language: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => predictFile(fetch, input, false),
        ),
        fromFileAsync: mutation(
          {
            description:
              "Upload a document (base64) for asynchronous processing by an OCR model; recommended above 3 pages. Returns request_file_id; fetch results with predictions.getByFile once processed.",
            input: object({
              modelId,
              fileBase64: string({ minLength: 1 }),
              fileName: string({ minLength: 1 }),
              mimeType: string().optional(),
              requestMetadata: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => predictFile(fetch, input, true),
        ),
        list: query(
          {
            description:
              "List prediction results for all files uploaded to a model in a date range, split into moderated (approved) and unmoderated files. Both bounds are days since 1 January 1970 GMT: startDayInterval is the start and currentBatchDay the end.",
            input: object({ modelId, startDayInterval: number(), currentBatchDay: number() }),
          },
          async ({ fetch }, input) =>
            get(
              fetch,
              `/Inferences/Model/${part(input.modelId)}/ImageLevelInferences${search({
                start_day_interval: input.startDayInterval,
                current_batch_day: input.currentBatchDay,
              })}`,
            ),
        ),
        getByFile: query(
          {
            description:
              "Get the prediction results for one uploaded file by model id and request_file_id: initial predictions, human modifications and final result, with signed URLs for the source pages.",
            input: object({ modelId, requestFileId: string({ minLength: 1 }) }),
          },
          async ({ fetch }, input) =>
            get(
              fetch,
              `/Inferences/Model/${part(input.modelId)}/InferenceRequestFiles/GetPredictions/${part(input.requestFileId)}`,
            ),
        ),
        getByPage: query(
          {
            description:
              "Get the prediction results for one page by its page id (the id at the end of the page's file URL): initial prediction, moderated boxes, raw OCR and signed URLs.",
            input: object({ modelId, pageId: string({ minLength: 1 }) }),
          },
          async ({ fetch }, input) =>
            get(fetch, `/Inferences/Model/${part(input.modelId)}/ImageLevelInferences/${part(input.pageId)}`),
        ),
      },
      { title: "Predictions", description: "Extract data from documents and read back results." },
    ),
    classification: router(
      {
        fromUrls: mutation(
          {
            description: "Classify images at public URLs with an image classification model. urls is an array of URLs.",
            input: object({ modelId, urls: json() }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            const form = new FormData();
            form.set("modelId", input.modelId);
            for (const url of asStrings(input.urls)) form.append("urls", url);
            return post(fetch, "/ImageCategorization/LabelUrls/", form);
          },
        ),
        fromFile: mutation(
          {
            description: "Classify one image (base64) with an image classification model.",
            input: object({
              modelId,
              fileBase64: string({ minLength: 1 }),
              fileName: string({ minLength: 1 }),
              mimeType: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) => {
            const form = new FormData();
            form.set("modelId", input.modelId);
            form.set("file", fileBlob(input.fileBase64, input.mimeType), input.fileName);
            return post(fetch, "/ImageCategorization/LabelFile/", form);
          },
        ),
      },
      { title: "Classification", description: "Classify images with an image classification model." },
    ),
    integrations: router(
      {
        list: query(
          {
            description: "List the external integrations (databases and lookup sources) linked to the account.",
            input: object({}),
          },
          async ({ fetch }) => get(fetch, "/externalIntegrations"),
        ),
        executeQuery: mutation(
          {
            description:
              "Run a generic SQL-style query against an external integration (get its id from integrations.list), for example \"select * from passports where dob='29/01/2019'\". Update statements are possible, so this can modify records.",
            input: object({ externalIntegrationId: string({ minLength: 1 }), query: string({ minLength: 1 }) }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            post(
              fetch,
              `/externalIntegrations/${part(input.externalIntegrationId)}/executequery`,
              JSON.stringify({ query: input.query }),
              "application/json",
            ),
        ),
      },
      { title: "Integrations", description: "List and query external integrations linked to the account." },
    ),
  });
};

const asStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  throw new Error("urls must be a string or an array of strings");
};

export default defineApp({ user: { accounts: { nanonets: nanonets.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.nanonets ?? [], (account) => nanonetsTools(account, signal), { signal }), {
    title: "Nanonets",
    description:
      "Extract fields and tables from documents with Nanonets OCR models, read back predictions, train models and query external integrations.",
    icons,
  }),
}));
