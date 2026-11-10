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

const base = "https://api.mathpix.com";

const mathpix = defineProvider({
  name: "Mathpix",
  hosts: ["api.mathpix.com"],
  auth: {
    apiKey: secrets({
      label: "App ID and app key",
      fields: object({ appId: string({ minLength: 1 }), appKey: string({ minLength: 1 }) }),
    }),
  },
  // Listing a single stored PDF result is free and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v3/pdf-results?per_page=1`, { signal, headers: headers(account) });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { appId: string; appKey: string } };

const headers = (account: Account) => ({ app_id: account.fields.appId, app_key: account.fields.appKey });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

// Optional fields left undefined are dropped by JSON.stringify.
const jsonBody = (body: Record<string, unknown>) => JSON.stringify(body);

const textFormats = "mmd, md, html, lines.json (and, for PDFs, lines.mmd.json)";

const ocrOptions = {
  formats: array(string()).optional(),
  dataOptions: json().optional(),
  alphabetsAllowed: json().optional(),
  includeLineData: boolean().optional(),
  includeWordData: boolean().optional(),
  includeSmiles: boolean().optional(),
  enableDocumentLayout: boolean().optional(),
  confidenceThreshold: number().optional(),
  rmSpaces: boolean().optional(),
  rmFonts: boolean().optional(),
  idiomaticEqnArrays: boolean().optional(),
  mathInlineDelimiters: array(string()).optional(),
  mathDisplayDelimiters: array(string()).optional(),
  extra: json().optional(),
};

const ocrBody = (input: {
  formats?: readonly string[] | undefined;
  dataOptions?: unknown;
  alphabetsAllowed?: unknown;
  includeLineData?: boolean | undefined;
  includeWordData?: boolean | undefined;
  includeSmiles?: boolean | undefined;
  enableDocumentLayout?: boolean | undefined;
  confidenceThreshold?: number | undefined;
  rmSpaces?: boolean | undefined;
  rmFonts?: boolean | undefined;
  idiomaticEqnArrays?: boolean | undefined;
  mathInlineDelimiters?: readonly string[] | undefined;
  mathDisplayDelimiters?: readonly string[] | undefined;
  extra?: unknown;
}): Record<string, unknown> => ({
  ...(typeof input.extra === "object" && input.extra !== null ? (input.extra as Record<string, unknown>) : {}),
  formats: input.formats,
  data_options: input.dataOptions,
  alphabets_allowed: input.alphabetsAllowed,
  include_line_data: input.includeLineData,
  include_word_data: input.includeWordData,
  include_smiles: input.includeSmiles,
  enable_document_layout: input.enableDocumentLayout,
  confidence_threshold: input.confidenceThreshold,
  rm_spaces: input.rmSpaces,
  rm_fonts: input.rmFonts,
  idiomatic_eqn_arrays: input.idiomaticEqnArrays,
  math_inline_delimiters: input.mathInlineDelimiters,
  math_display_delimiters: input.mathDisplayDelimiters,
});

const documentOptions = {
  pageRanges: string().optional(),
  conversionFormats: json().optional(),
  conversionOptions: json().optional(),
  includePageBreaks: boolean().optional(),
  includeHyperlinks: boolean().optional(),
  includePageInfo: json().optional(),
  includeSmiles: boolean().optional(),
  rmSpaces: boolean().optional(),
  rmFonts: boolean().optional(),
  idiomaticEqnArrays: boolean().optional(),
  mathInlineDelimiters: array(string()).optional(),
  mathDisplayDelimiters: array(string()).optional(),
  extra: json().optional(),
};

const documentBody = (input: {
  pageRanges?: string | undefined;
  conversionFormats?: unknown;
  conversionOptions?: unknown;
  includePageBreaks?: boolean | undefined;
  includeHyperlinks?: boolean | undefined;
  includePageInfo?: unknown;
  includeSmiles?: boolean | undefined;
  rmSpaces?: boolean | undefined;
  rmFonts?: boolean | undefined;
  idiomaticEqnArrays?: boolean | undefined;
  mathInlineDelimiters?: readonly string[] | undefined;
  mathDisplayDelimiters?: readonly string[] | undefined;
  extra?: unknown;
}): Record<string, unknown> => ({
  ...(typeof input.extra === "object" && input.extra !== null ? (input.extra as Record<string, unknown>) : {}),
  page_ranges: input.pageRanges,
  conversion_formats: input.conversionFormats,
  conversion_options: input.conversionOptions,
  include_page_breaks: input.includePageBreaks,
  include_hyperlinks: input.includeHyperlinks,
  include_page_info: input.includePageInfo,
  include_smiles: input.includeSmiles,
  rm_spaces: input.rmSpaces,
  rm_fonts: input.rmFonts,
  idiomatic_eqn_arrays: input.idiomaticEqnArrays,
  math_inline_delimiters: input.mathInlineDelimiters,
  math_display_delimiters: input.mathDisplayDelimiters,
});

const mathpixTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetcher: typeof fetch, path: string) =>
    decodeJson(await fetcher(`${base}${path}`, { signal, headers: headers(account) }), json());
  const send = async (fetcher: typeof fetch, method: string, path: string, body?: Record<string, unknown>) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method,
        signal,
        headers: body === undefined ? headers(account) : { ...headers(account), "content-type": "application/json" },
        ...(body === undefined ? {} : { body: jsonBody(body) }),
      }),
      json(),
    );
  // Result files are returned as text. 202 always means "still working". HTTP 404 means "not ready" only where the
  // vendor documents it: /v3/pdf/{id}.{ext} (404 carrying a non-completed status object) and /files/v1/{id}.{ext}
  // (404 format_not_ready). Any other 404, including every converter 404, is an error such as an unknown id.
  const pdfNotReady = (body: string) => {
    try {
      const status = (JSON.parse(body) as { status?: unknown }).status;
      return typeof status === "string" && status !== "completed" && status !== "error";
    } catch {
      return false;
    }
  };
  const filesNotReady = (body: string) => body.includes("format_not_ready");
  const download = async (fetcher: typeof fetch, path: string, notReady404?: (body: string) => boolean) => {
    const response = await fetcher(`${base}${path}`, { signal, headers: headers(account) });
    const body = await response.text();
    if (response.status === 202 || (response.status === 404 && notReady404?.(body) === true)) {
      return { ready: false, status: response.status, body };
    }
    if (!response.ok) throw new Error(`Mathpix download failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
    return { ready: true, status: response.status, content: body };
  };

  return router(
    {
      text: router(
        {
          recognize: mutation(
            {
              description:
                "Run OCR on one image with POST /v3/text and return Mathpix Markdown (text), confidence, and the optional outputs you ask for. src is a public image URL (10 MB max) or a base64 data URI (data:image/png;base64,..., 2 MB max). formats picks outputs from text, data, html, latex_styled (default text). dataOptions enables include_svg, include_table_html, include_latex, include_tsv, include_asciimath, include_mathml, include_sub_math. extra is merged into the request body for any other documented v3/text option (region, tags, metadata, include_page_info, math delimiters and so on). Consumes OCR credits; results are stored unless improve_mathpix is false in extra.",
              input: object({ src: string({ minLength: 1 }), ...ocrOptions }),
              approval: always(),
            },
            async ({ fetch }, { src, ...rest }) => send(fetch, "POST", "/v3/text", { src, ...ocrBody(rest) }),
          ),
        },
        { title: "Image OCR", description: "Recognize text, math, tables and chemistry in a single image." },
      ),
      strokes: router(
        {
          recognize: mutation(
            {
              description:
                "Recognize handwritten digital ink with POST /v3/strokes. x and y are arrays with one array of coordinates per stroke, for example x: [[0,10,20]], y: [[5,15,25]] (512 KB body limit). Accepts the same output options as text.recognize. Consumes OCR credits; results are stored unless improve_mathpix is false in extra.",
              input: object({ x: array(array(number())), y: array(array(number())), ...ocrOptions }),
              approval: always(),
            },
            async ({ fetch }, { x, y, ...rest }) =>
              send(fetch, "POST", "/v3/strokes", { strokes: { strokes: { x, y } }, ...ocrBody(rest) }),
          ),
        },
        { title: "Strokes", description: "Recognize handwritten digital ink." },
      ),
      pdf: router(
        {
          submit: mutation(
            {
              description:
                "Submit a document by public URL for asynchronous OCR with POST /v3/pdf (PDF, DOCX, PPTX, DOC, ODT, EPUB, MOBI, DJVU and more, up to 1 GB) and return its pdf_id. Poll pdf.status until status is completed, then use pdf.download. Request extra output formats with conversionFormats, for example {\"docx\": true, \"tex.zip\": true}; MMD is always produced. pageRanges is like 2,4-6. extra is merged into the request body for any other documented v3/pdf option (callback_url, metadata, alphabets_allowed, auto_number_sections and so on). Consumes OCR credits.",
              input: object({ url: string({ minLength: 1 }), streaming: boolean().optional(), ...documentOptions }),
              approval: always(),
            },
            async ({ fetch }, { url, streaming, ...rest }) =>
              send(fetch, "POST", "/v3/pdf", { url, streaming, ...documentBody(rest) }),
          ),
          status: query(
            {
              description:
                "Processing status of a submitted PDF (GET /v3/pdf/{pdf_id}): status is received, loaded, split, completed or error, with num_pages, num_pages_completed and conversion_status. percent_done can reach 100 before output is assembled, so wait for status completed.",
              input: object({ pdfId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { pdfId }) => get(fetch, `/v3/pdf/${encodeURIComponent(pdfId)}`),
          ),
          conversionStatus: query(
            {
              description:
                "Per-format conversion progress for a PDF (GET /v3/converter/{pdf_id}). Download a requested format only after its entry in conversion_status is completed.",
              input: object({ pdfId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { pdfId }) => get(fetch, `/v3/converter/${encodeURIComponent(pdfId)}`),
          ),
          download: query(
            {
              description: `Download a PDF result as text (GET /v3/pdf/{pdf_id}.{extension}). Supported text extensions: ${textFormats}. Binary formats (docx, pptx, xlsx, pdf, zip) cannot be returned here. Returns { ready: false } while the result is still being produced (HTTP 202, or HTTP 404 carrying a non-completed status object); an unknown pdf_id throws.`,
              input: object({ pdfId: string({ minLength: 1 }), extension: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { pdfId, extension }) =>
              download(fetch, `/v3/pdf/${encodeURIComponent(pdfId)}.${extension.replace(/^\./, "")}`, pdfNotReady),
          ),
          delete: mutation(
            {
              description:
                "Permanently delete a PDF's outputs and input (DELETE /v3/pdf/{pdf_id}). Irreversible. Returns the status object at deletion time.",
              input: object({ pdfId: string({ minLength: 1 }) }),
              approval: always(),
            },
            async ({ fetch }, { pdfId }) => send(fetch, "DELETE", `/v3/pdf/${encodeURIComponent(pdfId)}`),
          ),
        },
        { title: "PDF and documents", description: "Asynchronous OCR of PDFs and office documents into Markdown, LaTeX, DOCX and more." },
      ),
      converter: router(
        {
          submit: mutation(
            {
              description:
                "Convert a Mathpix Markdown (MMD) document to other formats with POST /v3/converter (10 MB body limit) and return conversion_id. formats is an object such as {\"docx\": true, \"tex.zip\": true, \"html\": true, \"pdf\": true}; conversionOptions holds per-format options keyed by format. Poll converter.status, then converter.download.",
              input: object({
                mmd: string(),
                formats: json(),
                conversionOptions: json().optional(),
                metadata: json().optional(),
              }),
              approval: always(),
            },
            async ({ fetch }, { mmd, formats, conversionOptions, metadata }) =>
              send(fetch, "POST", "/v3/converter", {
                mmd,
                formats,
                conversion_options: conversionOptions,
                metadata,
              }),
          ),
          status: query(
            {
              description:
                "Conversion progress (GET /v3/converter/{conversion_id}): conversion_status gives each requested format's state.",
              input: object({ conversionId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { conversionId }) => get(fetch, `/v3/converter/${encodeURIComponent(conversionId)}`),
          ),
          download: query(
            {
              description:
                "Download a converted output as text (GET /v3/converter/{conversion_id}.{extension}). Text extensions: mmd, md, html. Binary formats (docx, pptx, xlsx, pdf, zip) cannot be returned here. Returns { ready: false } on HTTP 202; any 404 (unknown conversion_id) throws.",
              input: object({ conversionId: string({ minLength: 1 }), extension: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { conversionId, extension }) =>
              download(fetch, `/v3/converter/${encodeURIComponent(conversionId)}.${extension.replace(/^\./, "")}`),
          ),
          delete: mutation(
            {
              description: "Permanently delete a conversion's output files (DELETE /v3/converter/{conversion_id}). Irreversible.",
              input: object({ conversionId: string({ minLength: 1 }) }),
              approval: always(),
            },
            async ({ fetch }, { conversionId }) =>
              send(fetch, "DELETE", `/v3/converter/${encodeURIComponent(conversionId)}`),
          ),
        },
        { title: "Converter", description: "Convert Mathpix Markdown into DOCX, LaTeX, HTML, PDF and other formats." },
      ),
      files: router(
        {
          submit: mutation(
            {
              description:
                "Submit one remote document to the async Files API with POST /files/v1/uri and return file_id. sourceUri is a public https:// URL (s3://, gs:// and Azure Blob URIs need a data source registered in the Mathpix console). Optional filename, conversionFormats (for example {\"docx\": true}; MMD is always produced), jobId, customId (needs jobId), pageRanges. extra is merged into the body for other documented options (callback_url, destination_uri, image_output_mode, metadata and the v3/pdf OCR options). Consumes OCR credits.",
              input: object({
                sourceUri: string({ minLength: 1 }),
                filename: string().optional(),
                jobId: string().optional(),
                customId: string().optional(),
                ...documentOptions,
              }),
              approval: always(),
            },
            async ({ fetch }, { sourceUri, filename, jobId, customId, ...rest }) =>
              send(fetch, "POST", "/files/v1/uri", {
                source_uri: sourceUri,
                filename,
                job_id: jobId,
                custom_id: customId,
                ...documentBody(rest),
              }),
          ),
          status: query(
            {
              description:
                "Status of a Files API file (GET /files/v1/{file_id}): status is pending, split, completed or error, plus percent_done and per-format states in formats. Wait for both status and the format to be completed before downloading.",
              input: object({ fileId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { fileId }) => get(fetch, `/files/v1/${encodeURIComponent(fileId)}`),
          ),
          download: query(
            {
              description: `Download a Files API result as text (GET /files/v1/{file_id}.{extension}). Text extensions: ${textFormats}. Binary formats (docx, pptx, xlsx, pdf, zip) cannot be returned here. Returns { ready: false } while the format is not ready.`,
              input: object({ fileId: string({ minLength: 1 }), extension: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { fileId, extension }) =>
              download(fetch, `/files/v1/${encodeURIComponent(fileId)}.${extension.replace(/^\./, "")}`, filesNotReady),
          ),
          delete: mutation(
            {
              description:
                "Delete a completed or errored file and its Mathpix-stored results (DELETE /files/v1/{file_id}). Files still processing return 409. Idempotent.",
              input: object({ fileId: string({ minLength: 1 }) }),
              approval: always(),
            },
            async ({ fetch }, { fileId }) => send(fetch, "DELETE", `/files/v1/${encodeURIComponent(fileId)}`),
          ),
        },
        { title: "Files API", description: "Asynchronous document processing for bulk volumes." },
      ),
      jobs: router(
        {
          create: mutation(
            {
              description:
                "Submit up to 200,000 documents in one batch job with POST /files/v1/jobs. files is an array of { source_uri, custom_id?, filename?, destination_uri?, s3_region?, destination_basename?, page_ranges? }. jobId is generated if omitted and is required when any file has a custom_id. extra is merged into the body (conversion_formats, image_output_mode, callback_url, callback_headers, callback_events, metadata and v3/pdf OCR options). Finalize the job when all files are submitted. Consumes OCR credits.",
              input: object({ files: array(json()), jobId: string().optional(), extra: json().optional() }),
              approval: always(),
            },
            async ({ fetch }, { files, jobId, extra }) =>
              send(fetch, "POST", "/files/v1/jobs", {
                ...(typeof extra === "object" && extra !== null ? (extra as Record<string, unknown>) : {}),
                files,
                job_id: jobId,
              }),
          ),
          list: query(
            {
              description:
                "List jobs, newest first (GET /files/v1/jobs). start and end are yyyy-MM-dd (UTC), limit 1-1000 (default 100); pass next_page_token from the previous response as pagingState.",
              input: object({
                start: string().optional(),
                end: string().optional(),
                limit: number().optional(),
                pagingState: string().optional(),
              }),
            },
            async ({ fetch }, { pagingState, ...input }) =>
              get(fetch, `/files/v1/jobs${search({ ...input, paging_state: pagingState })}`),
          ),
          get: query(
            {
              description:
                "Job status and counters (GET /files/v1/jobs/{job_id}): status, file_count, files_completed, files_errored, pages sent and completed, finalized_at.",
              input: object({ jobId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { jobId }) => get(fetch, `/files/v1/jobs/${encodeURIComponent(jobId)}`),
          ),
          files: query(
            {
              description:
                "List the files in a job (GET /files/v1/jobs/{job_id}/files). status filters by pending, completed or error. Paginate with pagingState set to the previous next_page_token.",
              input: object({
                jobId: string({ minLength: 1 }),
                status: string().optional(),
                limit: number().optional(),
                pagingState: string().optional(),
              }),
            },
            async ({ fetch }, { jobId, pagingState, ...input }) =>
              get(
                fetch,
                `/files/v1/jobs/${encodeURIComponent(jobId)}/files${search({ ...input, paging_state: pagingState })}`,
              ),
          ),
          file: query(
            {
              description:
                "Status of one file in a job by its custom id (GET /files/v1/jobs/{job_id}/files/{custom_id}); same body as files.status.",
              input: object({ jobId: string({ minLength: 1 }), customId: string({ minLength: 1 }) }),
            },
            async ({ fetch }, { jobId, customId }) =>
              get(fetch, `/files/v1/jobs/${encodeURIComponent(jobId)}/files/${encodeURIComponent(customId)}`),
          ),
          finalize: mutation(
            {
              description:
                "Close a job to new submissions (POST /files/v1/jobs/{job_id}/finalize). Idempotent and permanent; required before the job.completed webhook fires.",
              input: object({ jobId: string({ minLength: 1 }) }),
              approval: always(),
            },
            async ({ fetch }, { jobId }) => send(fetch, "POST", `/files/v1/jobs/${encodeURIComponent(jobId)}/finalize`),
          ),
        },
        { title: "Batch jobs", description: "Bulk document submission and progress tracking." },
      ),
      history: router(
        {
          ocrResults: query(
            {
              description:
                "Query stored image OCR results (GET /v3/ocr-results). page (default 1, max 10000), perPage (default 100), fromDate (inclusive) and toDate (exclusive) as ISO datetimes, appId, substring filters text, textDisplay and latexStyled, tags (array), and detection filters isPrinted, isHandwritten, containsTable, containsChemistry, containsDiagram, containsTriangle, containsAlgorithm. Requests sent with improve_mathpix false are not stored.",
              input: object({
                page: number().optional(),
                perPage: number().optional(),
                fromDate: string().optional(),
                toDate: string().optional(),
                appId: string().optional(),
                text: string().optional(),
                textDisplay: string().optional(),
                latexStyled: string().optional(),
                tags: array(string()).optional(),
                isPrinted: boolean().optional(),
                isHandwritten: boolean().optional(),
                containsTable: boolean().optional(),
                containsChemistry: boolean().optional(),
                containsDiagram: boolean().optional(),
                containsTriangle: boolean().optional(),
                containsAlgorithm: boolean().optional(),
              }),
            },
            async ({ fetch }, { tags, ...input }) => {
              const params = new URLSearchParams(
                search({
                  page: input.page,
                  per_page: input.perPage,
                  from_date: input.fromDate,
                  to_date: input.toDate,
                  app_id: input.appId,
                  text: input.text,
                  text_display: input.textDisplay,
                  latex_styled: input.latexStyled,
                  is_printed: input.isPrinted,
                  is_handwritten: input.isHandwritten,
                  contains_table: input.containsTable,
                  contains_chemistry: input.containsChemistry,
                  contains_diagram: input.containsDiagram,
                  contains_triangle: input.containsTriangle,
                  contains_algorithm: input.containsAlgorithm,
                }),
              );
              for (const tag of tags ?? []) params.append("tags", tag);
              const text = params.toString();
              return get(fetch, `/v3/ocr-results${text === "" ? "" : `?${text}`}`);
            },
          ),
          pdfResults: query(
            {
              description:
                "List processed PDFs (GET /v3/pdf-results): id, input_file, status, created_at, modified_at, num_pages and request_args. page (default 1), perPage (default 100), fromDate (inclusive), toDate (exclusive), appId.",
              input: object({
                page: number().optional(),
                perPage: number().optional(),
                fromDate: string().optional(),
                toDate: string().optional(),
                appId: string().optional(),
              }),
            },
            async ({ fetch }, input) =>
              get(
                fetch,
                `/v3/pdf-results${search({
                  page: input.page,
                  per_page: input.perPage,
                  from_date: input.fromDate,
                  to_date: input.toDate,
                  app_id: input.appId,
                })}`,
              ),
          ),
          usage: query(
            {
              description:
                "Request counts for billing and monitoring (GET /v3/ocr-usage). groupBy is usage_type, request_args_hash or app_id; timespan is an aggregation period such as month; fromDate (inclusive) and toDate (exclusive) are ISO datetimes.",
              input: object({
                groupBy: string().optional(),
                timespan: string().optional(),
                fromDate: string().optional(),
                toDate: string().optional(),
              }),
            },
            async ({ fetch }, input) =>
              get(
                fetch,
                `/v3/ocr-usage${search({
                  group_by: input.groupBy,
                  timespan: input.timespan,
                  from_date: input.fromDate,
                  to_date: input.toDate,
                })}`,
              ),
          ),
        },
        { title: "History and usage", description: "Stored OCR and PDF results and usage counts." },
      ),
    }
  );
};

export default defineApp({ user: { accounts: { mathpix: mathpix.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.mathpix ?? [], (account) => mathpixTools(account, signal), { signal }), {
    title: "Mathpix",
    description:
      "OCR for math, text, tables and chemistry with Mathpix: images, handwritten strokes, PDFs and documents, Markdown conversion, bulk jobs, result history and usage.",
    icons,
  }),
}));
