import {
  accountRouter,
  boolean,
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

const base = "https://developers.typless.com/api/v1";

const typless = defineProvider({
  name: "Typless",
  hosts: ["developers.typless.com"],
  auth: {
    // Found at https://app.typless.com/settings/api-keys. Sent as `Authorization: Token <key>`.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/awaiting-poll`, {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

const Fields = array(json());

function tools(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: "GET" | "POST", path: string, search: Record<string, unknown>, body?: Record<string, unknown>) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  // file is the base64-encoded document; file_name includes its extension.
  // learning_fields: [{ name, value: [{ value, x, y, width, height, page_number }] }].
  const fileInputs = {
    file: string(),
    file_name: string(),
  };
  const training = {
    learning_fields: Fields,
    line_items: Fields.optional(),
    vat_rates: Fields.optional(),
  };

  return router({
    extraction: router({
      extract: mutation(
        {
          description:
            "Extract data from a document synchronously using a document type. file is the base64-encoded document. Returns extracted_fields, line_items and vat_rates.",
          input: object({ ...fileInputs, document_type_name: string(), customer: string().optional() }),
        },
        (_ctx, args) => call("POST", "/extract-data", {}, args),
      ),
      extractAsync: mutation(
        {
          description: "Start an asynchronous extraction. Returns an extraction_id to pass to getResult.",
          input: object({
            ...fileInputs,
            document_type_name: string(),
            customer: string().optional(),
            parse_text_blocks: boolean().optional(),
          }),
        },
        (_ctx, args) => call("POST", "/extract-data-async", {}, args),
      ),
      extractWithPretrainedModel: mutation(
        {
          description:
            "Start an asynchronous extraction with a Typless pretrained model (by model_name). Provide either file (base64) or file_url.",
          input: object({
            model_name: string(),
            file_name: string(),
            file: string().optional(),
            file_url: string().optional(),
            for_customer: string().optional(),
          }),
        },
        (_ctx, { model_name, ...body }) => call("POST", `/pretrained-models/${encodeURIComponent(model_name)}`, {}, body),
      ),
      getResult: query(
        {
          description: "Get the status (IN_PROGRESS, SUCCESS, ERROR, EXPIRED) and result of an asynchronous extraction. Results expire 48 hours after completion.",
          input: object({ extraction_id: string(), text_blocks: boolean().optional() }),
        },
        (_ctx, args) => call("GET", "/get-extraction-data", args),
      ),
      listReady: query(
        {
          description: "List extraction ids of asynchronous extractions that have finished and are ready to fetch.",
          input: object({ customer: string().optional() }),
        },
        (_ctx, args) => call("GET", "/awaiting-poll", args),
      ),
    }),
    training: router({
      addDocument: mutation(
        {
          description: "Add a document with its correct field values to a document type's training dataset. file is base64; learning_fields is [{ name, value: [{ value, x, y, width, height, page_number }] }].",
          input: object({ ...fileInputs, document_type_name: string().optional(), ...training }),
        },
        (_ctx, args) => call("POST", "/add-document", {}, args),
      ),
      addDocumentAsync: mutation(
        {
          description: "Add a document with its correct field values to a training dataset asynchronously.",
          input: object({ ...fileInputs, document_type_name: string(), ...training }),
        },
        (_ctx, args) => call("POST", "/add-document-async", {}, args),
      ),
      addDocumentFeedback: mutation(
        {
          description: "Submit corrected field values for an already extracted document (by document_object_id) as training feedback.",
          input: object({ document_type_name: string(), document_object_id: string(), ...training }),
        },
        (_ctx, args) => call("POST", "/add-document-feedback", {}, args),
      ),
      start: mutation(
        {
          description: "Start training all models of a document type.",
          input: object({ document_type_name: string() }),
        },
        (_ctx, args) => call("POST", "/start-training", {}, args),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { typless: typless.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.typless ?? [],
        (account) =>
          withApprovals(tools(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Typless",
        description: "Typless AI document extraction: extract invoice and document data, poll async results, and train document type models.",
        icons,
      },
    ),
  }),
);
