import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
  type AppContext,
} from "apps";
import { icons } from "./icon.js";

const API_BASE = "https://api.ocr.space";
const STATS_BASE = "https://myapi.ocr.space";

const ocrspace = defineProvider({
  name: "OCR.space",
  hosts: ["api.ocr.space", "myapi.ocr.space"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Parsing spends quota, so health reads the conversion counters instead (statistics host).
  // This endpoint is not in the public docs; the public API has no free documented read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${STATS_BASE}/conversions`, {
      method: "POST",
      signal,
      headers: { apikey: account.fields.token, "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

type ParseOptions = {
  language?: string | undefined;
  ocrEngine?: string | undefined;
  isOverlayRequired?: boolean | undefined;
  detectOrientation?: boolean | undefined;
  scale?: boolean | undefined;
  isTable?: boolean | undefined;
  isCreateSearchablePdf?: boolean | undefined;
  filetype?: string | undefined;
};

function optionFields(o: ParseOptions): Record<string, string> {
  const out: Record<string, string> = {};
  if (o.language) out.language = o.language;
  if (o.ocrEngine) out.OCREngine = o.ocrEngine;
  if (o.isOverlayRequired !== undefined) out.isOverlayRequired = String(o.isOverlayRequired);
  if (o.detectOrientation !== undefined) out.detectOrientation = String(o.detectOrientation);
  if (o.scale !== undefined) out.scale = String(o.scale);
  if (o.isTable !== undefined) out.isTable = String(o.isTable);
  if (o.isCreateSearchablePdf !== undefined) out.isCreateSearchablePdf = String(o.isCreateSearchablePdf);
  if (o.filetype) out.filetype = o.filetype;
  return out;
}

// OCR.space answers HTTP 200 even when parsing failed. Success needs a top-level exit code of
// 1 or 2 and at least one page with FileParseExitCode 1 (the vendor samples show these as strings).
function assertParsed(result: unknown): unknown {
  const r = (result ?? {}) as {
    IsErroredOnProcessing?: unknown;
    OCRExitCode?: unknown;
    ParsedResults?: ReadonlyArray<{ FileParseExitCode?: unknown; ErrorMessage?: unknown }> | null;
    ErrorMessage?: unknown;
    ErrorDetails?: unknown;
  };
  const exit = Number(r.OCRExitCode);
  const pages = Array.isArray(r.ParsedResults) ? r.ParsedResults : [];
  const ok = r.IsErroredOnProcessing !== true && (exit === 1 || exit === 2) && pages.some((p) => Number(p?.FileParseExitCode) === 1);
  if (!ok) {
    const text = (v: unknown) => (Array.isArray(v) ? v.join(" ") : v == null || v === "" ? "" : String(v));
    const msg =
      text(r.ErrorMessage) ||
      text(r.ErrorDetails) ||
      pages.map((p) => text(p?.ErrorMessage)).find((m) => m) ||
      "OCR.space failed to process the request";
    throw new Error(msg);
  }
  return result;
}

function parseForm(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { apikey: token };
  // Both parse tools use the documented POST /parse/image (multipart/form-data, key in the apikey header).
  const parse = async (fields: Record<string, string>) => {
    const response = await fetcher(`${API_BASE}/parse/image`, { method: "POST", signal, headers, body: parseForm(fields) });
    return assertParsed(await decodeJson(response, json()));
  };
  return {
    parseUrl: (url: string, o: ParseOptions) => parse({ url, ...optionFields(o) }),
    parseBase64: (base64Image: string, o: ParseOptions) => parse({ base64Image, ...optionFields(o) }),
    conversions: async (startDate: string | undefined) => {
      const response = await fetcher(`${STATS_BASE}/conversions`, {
        method: "POST",
        signal,
        headers: { ...headers, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(startDate ? { startDate } : {}).toString(),
      });
      return decodeJson(response, json());
    },
  };
}

const optionInput = {
  language: string().optional(),
  ocrEngine: string().optional(),
  isOverlayRequired: boolean().optional(),
  detectOrientation: boolean().optional(),
  scale: boolean().optional(),
  isTable: boolean().optional(),
  isCreateSearchablePdf: boolean().optional(),
  filetype: string().optional(),
};

export default defineApp(
  { user: { accounts: { ocrspace: ocrspace.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ocrspace ?? [],
        (account) => {
          const c = client(account.fields.token, fetch, signal);
          return router({
            parseImageUrl: query(
              {
                description:
                  "Run OCR on a publicly reachable image or PDF URL and return the extracted text per page (ParsedResults[].ParsedText). Consumes quota; recommended for files over 10 MB. Options: language (3-letter code such as eng, ger, fre, spa, chs, jpn, or auto on engines 2/3; default eng), ocrEngine (2 default, 3 most accurate with its own quota; 1 is deprecated), isOverlayRequired (word bounding boxes), detectOrientation, scale (helps low-resolution scans), isTable (line by line, for receipts and invoices), isCreateSearchablePdf (link in SearchablePDFURL, expires in one hour), filetype (PDF, GIF, PNG, JPG, TIF, BMP).",
                input: object({ url: string({ minLength: 1 }), ...optionInput }),
              },
              async (_ctx: AppContext, { url, ...o }) => c.parseUrl(url, o),
            ),
            parseBase64Image: query(
              {
                description:
                  "Run OCR on a base64-encoded image or PDF and return the extracted text per page. The string must carry a data URI prefix such as data:image/png;base64,... Consumes quota; free plan files are limited to 1 MB. Same options as parseImageUrl (language, ocrEngine, isOverlayRequired, detectOrientation, scale, isTable, isCreateSearchablePdf, filetype).",
                input: object({ base64Image: string({ minLength: 1 }), ...optionInput }),
              },
              async (_ctx: AppContext, { base64Image, ...o }) => c.parseBase64(base64Image, o),
            ),
            conversions: query(
              {
                description:
                  "Conversion counters (count_total, count_engine1/2/3) for the account's current month, refreshed daily. startDate (YYYY-MM-DD) selects another period.",
                input: object({ startDate: string().optional() }),
              },
              async (_ctx: AppContext, { startDate }) => c.conversions(startDate),
            ),
          });
        },
        { signal },
      ),
      {
        title: "OCR.space",
        description: "Extract text from images and PDFs with OCR.space: parse by URL or base64, word overlays, table mode, searchable PDFs and usage counters.",
        icons,
      },
    ),
  }),
);
