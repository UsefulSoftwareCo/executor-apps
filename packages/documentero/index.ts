import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const endpoint = "https://app.documentero.com/api";

// Documentero has a single endpoint and no read-only call that validates a key (an unknown key is
// accepted until a document is generated), so the provider declares no health check.
const documentero = defineProvider({
  name: "Documentero",
  hosts: ["app.documentero.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

type Account = { fields: { token: string } };

const generate = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  body: Record<string, unknown>,
) =>
  decodeJson(
    await fetch(endpoint, {
      method: "POST",
      signal,
      headers: {
        Authorization: `apiKey ${account.fields.token}`,
        "content-type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }),
    json(),
  );

const documenteroTools = (account: Account, signal: AbortSignal) =>
  router({
    generateDocument: mutation(
      {
        description:
          "Merge data into a Documentero template to generate a document. document is the template identifier (shown in the template's API panel in the Documentero app). data is a JSON object whose keys are the template's fields and sections; use \\n for line breaks. format is 'docx' or 'pdf' (defaults to the template's setting). The response has status, message and data, where data is an expiring download link. Errors can come back as HTTP 200, so check status and message.",
        input: object({
          document: string({ minLength: 1 }),
          data: record(json()),
          format: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { document, data, format }) =>
        generate(fetch, account, signal, { document, data, ...(format === undefined ? {} : { format }) }),
    ),
    generateAndEmailDocument: mutation(
      {
        description:
          "Generate a document from a Documentero template and email it as an attachment. email is up to 5 comma-separated recipient addresses. emailCC, emailBCC, emailSubject, emailMessage (limited HTML), emailFooter (limited HTML) and emailSender are optional. Other fields behave as in generateDocument.",
        input: object({
          document: string({ minLength: 1 }),
          data: record(json()),
          email: string({ minLength: 1 }),
          format: string().optional(),
          emailCC: string().optional(),
          emailBCC: string().optional(),
          emailSubject: string().optional(),
          emailMessage: string().optional(),
          emailFooter: string().optional(),
          emailSender: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) if (value !== undefined) body[key] = value;
        return generate(fetch, account, signal, body);
      },
    ),
  });

export default defineApp({ user: { accounts: { documentero: documentero.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.documentero ?? [], (account) => documenteroTools(account, signal), { signal }), {
    title: "Documentero",
    description: "Generate Word, Excel and PDF documents from Documentero templates by merging JSON data, optionally emailing the result.",
    icons,
  }),
}));
