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

const base = "https://www.ocrwebservice.com/restservices";

const ocrwebservice = defineProvider({
  name: "OCR Web Service",
  hosts: ["www.ocrwebservice.com"],
  auth: {
    // HTTP Basic: the account user name and the license code from the account page.
    apiKey: secrets({
      label: "User name and license code",
      fields: object({ username: string({ minLength: 1 }), licenseCode: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/getAccountInformation`, {
      signal,
      headers: { accept: "application/json", authorization: basic(account.fields) },
    });
    const info = checkVendorError(await decodeJson(response, json()));
    const availablePages = typeof info.AvailablePages === "number" ? info.AvailablePages : undefined;
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username, availablePages } };
  },
});

const outputFormatNames = ["pdf", "pdfimg", "doc", "docx", "xls", "xlsx", "rtf", "txt"] as const;

// The vendor reports failures in an ErrorMessage field, which can arrive on a 200 response
// and is null or empty on success.
function checkVendorError(value: unknown): Record<string, unknown> {
  const body = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const message = body.ErrorMessage;
  if (typeof message === "string" && message.trim().length > 0) {
    throw new Error(`OCR Web Service failed: ${message}`);
  }
  return body;
}

function basic(fields: { username: string; licenseCode: string }) {
  return `Basic ${Buffer.from(`${fields.username}:${fields.licenseCode}`).toString("base64")}`;
}

export default defineApp(
  { user: { accounts: { ocrwebservice: ocrwebservice.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ocrwebservice ?? [],
        (account) => {
          const authorization = basic(account.fields);
          return router({
            account: router({
              information: query(
                {
                  description:
                    "Remaining page balance, plan maximum, last processing time, subscription plan and expiration date for the account.",
                  input: object({}),
                },
                async () =>
                  decodeJson(
                    await fetch(`${base}/getAccountInformation`, {
                      signal,
                      headers: { accept: "application/json", authorization },
                    }),
                    json(),
                  ),
              ),
            }),
            ocr: router({
              processDocument: mutation(
                {
                  description:
                    "OCR a scanned document or image (PDF (multi-page allowed), TIF/TIFF, JPEG/JPG, BMP, PCX, PNG, GIF, or a ZIP archive of these) given as base64. Set getText to return the extracted text and/or outputFormats (one or two of pdf, pdfimg, doc, docx, xls, xlsx, rtf, txt) to get a download link. Consumes pages from the plan. OCRText is indexed [zone][page].",
                  input: object({
                    fileBase64: string({ minLength: 1 }),
                    contentType: string().optional(),
                    languages: array(string({ minLength: 1 })).optional(),
                    pageRange: string().optional(),
                    getText: boolean().optional(),
                    getWords: boolean().optional(),
                    outputFormats: array(string({ minLength: 1 })).optional(), // validated in the handler against outputFormatNames, max two
                    toBlackAndWhite: boolean().optional(),
                    zones: array(string({ minLength: 1 })).optional(),
                    keepNewLines: boolean().optional(),
                    description: string().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) => {
                  const formats = input.outputFormats ?? [];
                  if (formats.length > 2) {
                    throw new Error("OCR Web Service allows at most two output formats.");
                  }
                  const invalid = formats.filter((f) => !(outputFormatNames as readonly string[]).includes(f));
                  if (invalid.length > 0) {
                    throw new Error(`Unsupported output format ${invalid.join(", ")}; use one or two of ${outputFormatNames.join(", ")}.`);
                  }
                  if (!input.getText && formats.length === 0) {
                    throw new Error("Set getText or outputFormats; OCR Web Service requires one of them.");
                  }
                  const url = new URL(`${base}/processDocument`);
                  const set = (key: string, value: string | undefined) => value !== undefined && url.searchParams.set(key, value);
                  set("language", input.languages?.join(","));
                  set("pagerange", input.pageRange);
                  set("gettext", input.getText === undefined ? undefined : String(input.getText));
                  set("getwords", input.getWords === undefined ? undefined : String(input.getWords));
                  set("outputformat", input.outputFormats?.join(","));
                  set("tobw", input.toBlackAndWhite === undefined ? undefined : String(input.toBlackAndWhite));
                  set("zone", input.zones?.join(","));
                  set("newline", input.keepNewLines ? "1" : undefined);
                  set("description", input.description);
                  const result = await decodeJson(
                    await fetch(url.toString(), {
                      method: "POST",
                      signal,
                      headers: {
                        accept: "application/json",
                        authorization,
                        "content-type": input.contentType ?? "application/octet-stream",
                      },
                      body: Buffer.from(input.fileBase64, "base64"),
                    }),
                    json(),
                  );
                  return checkVendorError(result);
                },
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "OCR Web Service",
        description:
          "Optical character recognition: extract text or searchable PDF/Word/Excel output from scanned documents and images, and check the account's remaining pages.",
        icons,
      },
    ),
  }),
);
