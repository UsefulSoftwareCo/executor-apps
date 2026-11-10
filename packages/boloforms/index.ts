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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://sapi.boloforms.com/signature";

const boloforms = defineProvider({
  name: "BoloForms",
  hosts: ["sapi.boloforms.com"],
  auth: {
    // Generated in BoloSign under Settings, API Key. Sent as the x-api-key header.
    // The workspace id is sent as the workspaceid header on GET /get-documents.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }), workspaceId: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/get-documents?limit=1`, {
      signal,
      headers: { "x-api-key": account.fields.token, workspaceid: account.fields.workspaceId },
    });
    await decodeJson(response, object({}));
  },
});

const mailData = object({ subject: string().optional(), message: string().optional() }).optional();

const receiverBase = {
  name: string(),
  email: string(),
  message: string().optional(),
  subject: string().optional(),
};
const pdfReceiver = object({
  ...receiverBase,
  roleTitle: string({ minLength: 1 }),
  roleColour: string(),
});
const formReceiver = object(receiverBase);

const reference = {
  documentId: string({ minLength: 1 }),
  documentType: string().optional(),
  responseId: string().optional(),
};

const tools = (account: { token: string; workspaceId: string }, fetcher: typeof fetch, signal: AbortSignal | undefined) => {
  const headers = (extra: Record<string, string> = {}) => ({ "x-api-key": account.token, ...extra });
  const get = async (path: string, params: Record<string, string | number | undefined>, extra: Record<string, string> = {}) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    return decodeJson(await fetcher(url.toString(), { signal, headers: headers(extra) }), json());
  };
  const post = async (path: string, body: unknown) =>
    decodeJson(
      await fetcher(`${base}/${path}`, {
        method: "POST",
        signal,
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      }),
      json(),
    );
  return router({
    documents: router(
      {
        list: query(
          {
            description:
              "List documents in the connected BoloSign workspace. documentType is PDF (single signature PDFs, default) or PDF_TEMPLATE. status (PDF only), dates are YYYY-MM-DD, sortOrder is asc or desc, archive is 'true' or 'false', limit max 100.",
            input: object({
              documentType: string().optional(),
              status: string().optional(),
              documentId: string().optional(),
              dateFrom: string().optional(),
              dateTo: string().optional(),
              sortOrder: string().optional(),
              archive: string().optional(),
              page: number().optional(),
              limit: number().optional(),
            }),
          },
          (_ctx, input) => get("get-documents", input, { workspaceid: account.workspaceId }),
        ),
        void: mutation(
          {
            description:
              "Void an in-progress document. documentType is PDF (default) or PDF_TEMPLATE; for PDF_TEMPLATE responseId (createdDocumentId from sending, or from documents.list) is required. Idempotent.",
            input: object(reference),
          },
          (_ctx, input) => post("void-document", input),
        ),
        sendReminder: mutation(
          {
            description:
              "Send reminder emails/SMS to pending signers of a document. documentType is PDF (default) or PDF_TEMPLATE; for PDF_TEMPLATE responseId is required.",
            input: object(reference),
          },
          (_ctx, input) => post("send-reminder", input),
        ),
      },
      { title: "Documents", description: "List, void and remind on documents in a BoloSign workspace." },
    ),
    signing: router(
      {
        sendPdfTemplate: mutation(
          {
            description:
              "Send a BoloSign PDF template for signing. roleTitle on each receiver must exactly match a role defined in the template (unique per receiver) and roleColour is a hex colour such as #FEE0EF. pdfData is an optional base64 data URI (data:application/pdf;base64,...). customVariables replace [name] style variables in the template.",
            input: object({
              documentId: string({ minLength: 1 }),
              receiversList: array(pdfReceiver),
              mailData,
              customVariables: array(object({ varName: string(), varValue: string() })).optional(),
              pdfData: string().optional(),
            }),
          },
          (_ctx, input) => post("pdf-template-lambda", { signingType: "PDF_TEMPLATE", ...input }),
        ),
        sendFormTemplate: mutation(
          {
            description:
              "Send a BoloSign form template for signing to up to 100 recipients in one request. documentId is the id from the form's responses page URL.",
            input: object({
              documentId: string({ minLength: 1 }),
              receiversList: array(formReceiver),
              mailData,
              customVariables: array(object({ varName: string(), varValue: string() })).optional(),
            }),
          },
          (_ctx, input) => post("pdf-template-lambda", { signingType: "FORM_TEMPLATE", ...input }),
        ),
      },
      { title: "Signing", description: "Send templates and forms out for signature." },
    ),
    templates: router(
      {
        respondents: query(
          {
            description:
              "List respondents of a PDF template (templateId, paginated) or fetch one respondent (respondentDocumentId, the createdDocumentId returned when sending). Provide either or both.",
            input: object({
              templateId: string().optional(),
              respondentDocumentId: string().optional(),
              page: number().optional(),
              limit: number().optional(),
            }),
          },
          (_ctx, input) => get("get-template-respondent", input),
        ),
      },
      { title: "Templates", description: "Respondents of sent PDF templates." },
    ),
    forms: router(
      {
        responses: query(
          {
            description:
              "List submitted responses of a form (formId, paginated) or fetch one response (responseId, a Mongo ObjectId or UUID v4). Provide either or both.",
            input: object({
              formId: string().optional(),
              responseId: string().optional(),
              page: number().optional(),
              limit: number().optional(),
            }),
          },
          (_ctx, input) => get("get-form-responses", input),
        ),
      },
      { title: "Forms", description: "Submitted form responses." },
    ),
  });
};

export default defineApp(
  { user: { accounts: { boloforms: boloforms.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.boloforms ?? [],
        (account) => withApprovals(tools(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "BoloForms",
        description: "BoloForms (BoloSign) eSignature: list, void and remind on documents, send PDF or form templates for signing, and read template respondents and form responses.",
        icons,
      },
    ),
  }),
);
