import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pdfless.com/v1";

// Pdfless documents no read-only account endpoint, so the provider has no health check.
const pdfless = defineProvider({
  name: "Pdfless",
  hosts: ["api.pdfless.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apikey: string({ minLength: 1 }) }),
    }),
  },
});

const pdflessTools = (account: { fields: { apikey: string } }, signal: AbortSignal) =>
  router({
    generatePdf: mutation(
      {
        description:
          "Generate a PDF from a Pdfless template. templateId is the template GUID from the dashboard; payload is the JSON data merged into the template. Returns download_url (valid for 10 minutes), expires and created_at. Optional encryption fields password-protect the file and restrict what viewers may do.",
        input: object({
          templateId: string(),
          referenceId: string().optional(),
          payload: json().optional(),
          encryptionUserPassword: string().optional(),
          encryptionOwnerPassword: string().optional(),
          encryptionAllowPrinting: boolean().optional(),
          encryptionAllowModifying: boolean().optional(),
          encryptionAllowModifyAnnotations: boolean().optional(),
          encryptionAllowContentCopying: boolean().optional(),
          encryptionAllowScreenreaders: boolean().optional(),
          encryptionAllowFormFilling: boolean().optional(),
          encryptionAllowDocumentAssembly: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const body = Object.fromEntries(
          Object.entries({
            template_id: input.templateId,
            reference_id: input.referenceId,
            payload: typeof input.payload === "string" ? JSON.parse(input.payload) : input.payload,
            encryption_user_password: input.encryptionUserPassword,
            encryption_owner_password: input.encryptionOwnerPassword,
            encryption_allow_printing: input.encryptionAllowPrinting,
            encryption_allow_modifying: input.encryptionAllowModifying,
            encryption_allow_modify_annotations: input.encryptionAllowModifyAnnotations,
            encryption_allow_content_copying: input.encryptionAllowContentCopying,
            encryption_allow_screenreaders: input.encryptionAllowScreenreaders,
            encryption_allow_form_filling: input.encryptionAllowFormFilling,
            encryption_allow_document_assembly: input.encryptionAllowDocumentAssembly,
          }).filter(([, value]) => value !== undefined),
        );
        const response = await fetch(`${base}/pdfs`, {
          method: "POST",
          signal,
          headers: { apikey: account.fields.apikey, "content-type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        return decodeJson(response, json());
      },
    ),
  });

export default defineApp({ user: { accounts: { pdfless: pdfless.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pdfless ?? [], (account) => pdflessTools(account, signal), { signal }), {
    title: "Pdfless",
    description: "Generate PDF documents from Pdfless HTML/CSS templates and JSON data.",
    icons,
  }),
}));
