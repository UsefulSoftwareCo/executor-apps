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
  type Schema,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Accounts created on the global site use api-server.compdf.com; accounts created on the
// mainland China site (compdf.cn) use api-server.compdf.cn.
const bases: Record<string, string> = {
  global: "https://api-server.compdf.com/server",
  china: "https://api-server.compdf.cn/server",
};

function baseFor(region: string | undefined): string {
  const key = (region ?? "").trim().toLowerCase() || "global";
  const found = bases[key];
  if (found === undefined) throw new Error(`Unknown ComPDF region "${region}". Use "global" (default) or "china".`);
  return found;
}

const compdf = defineProvider({
  name: "ComPDF",
  hosts: ["api-server.compdf.com", "api-server.compdf.cn"],
  auth: {
    apiKey: secrets({
      label: "API key (public key)",
      fields: object({ token: string({ minLength: 1 }), region: string().optional() }),
    }),
  },
  // Reading the asset balance is authenticated, read-only and free.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseFor(account.fields.region)}/v2/asset/info`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    // HTTP 200 does not guarantee success; the outcome is the body's code field ("200" on success).
    const body = await decodeJson(response, object({ code: string() }));
    if (body.code !== "200") throw new Error(`ComPDF rejected the API key (code ${body.code})`);
  },
});

type Fetch = typeof fetch;

// A file is supplied inline as base64 or fetched from a URL the server can reach.
const File = object({
  fileName: string({ minLength: 1 }),
  contentBase64: string().optional(),
  url: string().optional(),
});
type FileInput = { fileName: string; contentBase64?: string | undefined; url?: string | undefined };

const fileHelp =
  "Each file is { fileName, contentBase64 } or { fileName, url }. Runs in synchronous mode, which the vendor recommends for single files up to 10 MB (a request is limited to 50 MB). The result is JSON; the output link is in data.downloadUrl (data is an array of results with a downloadUrl each for merge and other multi-file results). Links are deleted at 24:00 the following day, so download promptly. Check the top-level code, because HTTP 200 does not mean the job succeeded. Error messages are requested in English (the vendor default is Chinese for some endpoints).";

type Value = string | number | boolean | undefined;

function client(token: string, region: string | undefined, fetcher: Fetch, signal: AbortSignal | undefined) {
  const base = baseFor(region);
  const headers = { "x-api-key": token };

  const toBlob = async (file: FileInput) => {
    if (file.contentBase64 !== undefined) return new Blob([Uint8Array.from(atob(file.contentBase64), (c) => c.charCodeAt(0))]);
    if (file.url !== undefined) {
      const response = await fetcher(file.url, signal === undefined ? {} : { signal });
      if (!response.ok) throw new Error(`Could not download ${file.url}: HTTP ${response.status}`);
      return await response.blob();
    }
    throw new Error(`File ${file.fileName} needs contentBase64 or url`);
  };

  const process = async (
    path: string,
    files: readonly FileInput[],
    fields: Record<string, Value | readonly string[]>,
    extraFiles: Record<string, FileInput | undefined> = {},
  ) => {
    const form = new FormData();
    // The API defaults error messages to Chinese for some endpoints; ask for English unless overridden.
    if (fields["language"] === undefined) form.append("language", "1");
    for (const file of files) form.append("file", await toBlob(file), file.fileName);
    for (const [key, file] of Object.entries(extraFiles)) {
      if (file !== undefined) form.append(key, await toBlob(file), file.fileName);
    }
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) form.append(key, item);
      else form.append(key, String(value));
    }
    const response = await fetcher(`${base}/v2/process/${path}`, { method: "POST", signal, headers, body: form });
    return decodeJson(response, json());
  };

  const get = async (path: string, params: Record<string, Value>) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url, { signal, headers });
    return decodeJson(response, json());
  };

  const post = async (path: string, params: Record<string, Value>) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url, { method: "POST", signal, headers });
    return decodeJson(response, json());
  };

  return { process, get, post };
}

type Client = ReturnType<typeof client>;

// Page ranges are numbered from 1, e.g. "1-3,6"; the verb only documents intent at call sites.
const pages = (_verb: string) => string({ minLength: 1 });

const ocr = {
  enableOcr: number().optional(),
  ocrRecognitionLang: string().optional(),
  ocrOption: string().optional(),
};

function convert(call: Client, path: string, label: string, extra: Record<string, Schema<string | undefined, true> | Schema<number | undefined, true>> = {}) {
  return mutation(
    {
      description: `${label}. Optional: pageRanges (e.g. "1-3,6"), password for a protected PDF, enableOcr (0 or 1) with ocrRecognitionLang and ocrOption (INVALID_CHARACTER, SCAN_PAGE, INVALID_CHARACTER_AND_SCAN_PAGE, ALL), isOutputDocumentPerPage (0 or 1). ${fileHelp}`,
      input: object({
        file: File,
        password: string().optional(),
        pageRanges: string().optional(),
        isOutputDocumentPerPage: number().optional(),
        ...ocr,
        ...extra,
      }),
    },
    async (_ctx, { file, ...fields }) => call.process(path, [file], fields),
  );
}

const layout = {
  enableAiLayout: number().optional(),
  isContainImg: number().optional(),
  isContainAnnot: number().optional(),
  containPageBackgroundImage: number().optional(),
  formulaToImage: number().optional(),
  pageLayoutMode: string().optional(),
};

function simple(call: Client, path: string, label: string) {
  return mutation(
    { description: `${label}. Optional password for a protected input. ${fileHelp}`, input: object({ file: File, password: string().optional() }) },
    async (_ctx, { file, password }) => call.process(path, [file], { password }),
  );
}

function build(call: Client) {
  return router({
    fromPdf: router(
      {
        toWord: convert(call, "pdf/docx", "Convert a PDF to Word (docx)", {
          enableAiLayout: number().optional(),
          isContainImg: number().optional(),
          isContainAnnot: number().optional(),
          pageLayoutMode: string().optional(),
        }),
        toExcel: convert(call, "pdf/xlsx", "Convert a PDF to Excel (xlsx). excelWorksheetOption: e_ForTable, e_ForPage or e_ForDocument", {
          enableAiLayout: number().optional(),
          excelAllContent: number().optional(),
          excelWorksheetOption: string().optional(),
          isContainImg: number().optional(),
          isContainAnnot: number().optional(),
        }),
        toPowerPoint: convert(call, "pdf/pptx", "Convert a PDF to PowerPoint (pptx)"),
        toRtf: convert(call, "pdf/rtf", "Convert a PDF to RTF", layout),
        toCsv: convert(call, "pdf/csv", "Extract tables from a PDF as CSV", { enableAiLayout: number().optional() }),
        toOfd: convert(call, "pdf/ofd", "Convert a PDF to OFD (OCR is always on for OFD output)", layout),
        toEditablePdf: convert(call, "pdf/editable", "Convert a scanned or image PDF to an editable, searchable PDF (OCR is on by default). transparentText (0 or 1) controls the invisible text layer", {
          ...layout,
          transparentText: number().optional(),
        }),
        toHtml: convert(call, "pdf/html", "Convert a PDF to HTML"),
        toText: convert(call, "pdf/txt", "Convert a PDF to plain text"),
        toJson: convert(call, "pdf/json", "Convert a PDF to JSON"),
        toMarkdown: convert(call, "pdf/markdown", "Convert a PDF to Markdown"),
        toImage: convert(
          call,
          "pdf/img",
          "Convert PDF pages to images. imageFormat: JPG (default), JPEG, JPEG2000, PNG, BMP, TIFF, TGA, GIF, WEBP; imageColorMode: e_Color, e_Gray, e_Binary; imageScaling default 1.0",
          { imageFormat: string().optional(), imageColorMode: string().optional(), imageScaling: number().optional() },
        ),
      },
      { title: "Convert from PDF", description: "Turn PDFs into Word, Excel, PowerPoint, HTML, text, JSON, Markdown or images." },
    ),
    toPdf: router(
      {
        fromWord: simple(call, "docx/pdf", "Convert a Word document to PDF"),
        fromExcel: simple(call, "xlsx/pdf", "Convert an Excel workbook to PDF"),
        fromPowerPoint: simple(call, "pptx/pdf", "Convert a PowerPoint presentation to PDF"),
        fromHtml: simple(call, "html/pdf", "Convert an HTML file to PDF"),
        fromImage: simple(call, "img/pdf", "Convert an image (PNG, JPG) to PDF"),
        fromText: simple(call, "txt/pdf", "Convert a plain text file to PDF"),
        fromRtf: simple(call, "rtf/pdf", "Convert an RTF document to PDF"),
        fromCsv: simple(call, "csv/pdf", "Convert a CSV file to PDF"),
      },
      { title: "Convert to PDF", description: "Create PDFs from Word, Excel, PowerPoint, HTML and images." },
    ),
    fromImage: router(
      {
        toWord: convert(call, "img/docx", "Convert an image to Word (docx) with OCR", layout),
        toExcel: convert(call, "img/xlsx", "Convert an image to Excel (xlsx) with OCR", layout),
        toPowerPoint: convert(call, "img/pptx", "Convert an image to PowerPoint (pptx) with OCR", layout),
        toRtf: convert(call, "img/rtf", "Convert an image to RTF with OCR", layout),
        toText: convert(call, "img/txt", "Convert an image to plain text with OCR", layout),
        toHtml: convert(call, "img/html", "Convert an image to HTML with OCR", layout),
        toJson: convert(call, "img/json", "Convert an image to JSON with OCR", layout),
        toCsv: convert(call, "img/csv", "Extract tables from an image as CSV", { enableAiLayout: number().optional() }),
      },
      { title: "Convert from image", description: "Turn images into Word, Excel, PowerPoint, RTF, text, HTML, JSON or CSV using OCR." },
    ),
    pages: router(
      {
        merge: mutation(
          {
            description: `Merge two or more PDFs in the order given. Optional filePageRanges (one entry per file, "all" or "1-3,6"), password (one open password shared by all files), passwords (one per file, "" for none) and outputFileName. ${fileHelp}`,
            input: object({
              files: array(File),
              filePageRanges: array(string()).optional(),
              password: string().optional(),
              passwords: array(string()).optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { files, ...fields }) => call.process("pdf/merge", files, fields),
        ),
        split: mutation(
          {
            description: `Split a PDF by page ranges into a ZIP. pages like "1-3,6". ${fileHelp}`,
            input: object({ file: File, pages: pages("Pages to split out"), password: string().optional(), zipFileName: string().optional() }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/split", [file], fields),
        ),
        extract: mutation(
          {
            description: `Extract pages from a PDF into a new PDF. ${fileHelp}`,
            input: object({ file: File, pages: pages("Pages to extract").optional(), password: string().optional(), outputFileName: string().optional() }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/extract", [file], fields),
        ),
        delete: mutation(
          {
            description: `Delete pages from a PDF. ${fileHelp}`,
            input: object({ file: File, pages: pages("Pages to delete"), password: string().optional(), outputFileName: string().optional() }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/delete", [file], fields),
        ),
        rotate: mutation(
          {
            description: `Rotate pages of a PDF. angle is 90, 180 or 270. ${fileHelp}`,
            input: object({
              file: File,
              pages: pages("Pages to rotate"),
              angle: number(),
              password: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/rotation", [file], fields),
        ),
        insertFromPdf: mutation(
          {
            description: `Insert pages from a source PDF into a target PDF at position index (from 1). sourcePages optional (default all). ${fileHelp}`,
            input: object({
              target: File,
              source: File,
              index: number(),
              sourcePages: string().optional(),
              targetPassword: string().optional(),
              insertPassword: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { target, source, ...fields }) =>
            call.process("pdf/insert", [target, source], { actionType: "FROM_PDF", ...fields }),
        ),
        compare: mutation(
          {
            description: `Compare two PDFs (the base file first, then the file to compare). mode is "content" or "overlay"; replaceColor and insertColor (hex, default #93B9FD and #C0FFEC) colour the differences in content mode; overlayBaseColor, overlayCompareColor, fillAlphaBase and fillAlphaCompare (0-100) apply to overlay mode. ${fileHelp}`,
            input: object({
              base: File,
              compare: File,
              mode: string().optional(),
              basePassword: string().optional(),
              comparePassword: string().optional(),
              replaceColor: string().optional(),
              insertColor: string().optional(),
              overlayBaseColor: string().optional(),
              overlayCompareColor: string().optional(),
              fillAlphaBase: number().optional(),
              fillAlphaCompare: number().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { base, compare, ...fields }) => call.process("pdf/contentCompare", [base, compare], fields),
        ),
      },
      { title: "Page operations", description: "Merge, split, extract, delete, rotate and insert PDF pages, and compare two PDFs." },
    ),
    security: router(
      {
        encrypt: mutation(
          {
            description: `Password-protect a PDF. Provide userPassword (to open), ownerPassword (permissions) or both. algorithm: rc4 (default), aes128, aes256. Permission flags (allowPrint, allowCopy, allowDocumentChanges, allowDocumentAssembly, allowCommenting, allowFormFieldEntry) default to false. ${fileHelp}`,
            input: object({
              file: File,
              password: string().optional(),
              userPassword: string().optional(),
              ownerPassword: string().optional(),
              algorithm: string().optional(),
              allowPrint: boolean().optional(),
              allowCopy: boolean().optional(),
              allowDocumentChanges: boolean().optional(),
              allowDocumentAssembly: boolean().optional(),
              allowCommenting: boolean().optional(),
              allowFormFieldEntry: boolean().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/encrypt", [file], fields),
        ),
        decrypt: mutation(
          {
            description: `Remove password protection from a PDF; password is its open or owner password. ${fileHelp}`,
            input: object({ file: File, password: string({ minLength: 1 }) }),
          },
          async (_ctx, { file, password }) => call.process("pdf/decrypt", [file], { password }),
        ),
        addWatermark: mutation(
          {
            description: `Add a text or image watermark. type is "text" or "image" (image needs imageFile). fontColor is hex like #D32F2F; opacity 0-1; horizalign left|center|right; vertalign top|center|bottom; fullScreen tiles it. ${fileHelp}`,
            input: object({
              file: File,
              type: string({ minLength: 1 }),
              imageFile: File.optional(),
              text: string().optional(),
              fontSize: number().optional(),
              fontColor: string().optional(),
              opacity: number().optional(),
              rotation: number().optional(),
              horizalign: string().optional(),
              vertalign: string().optional(),
              horizOffset: number().optional(),
              vertOffset: number().optional(),
              front: boolean().optional(),
              pages: string().optional(),
              fullScreen: boolean().optional(),
              horizontalSpacing: number().optional(),
              verticalSpacing: number().optional(),
              password: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, imageFile, ...fields }) => call.process("pdf/addWatermark", [file], fields, { imageFile }),
        ),
        compress: mutation(
          {
            description: `Compress a PDF. imageQuality 0-100; colorImageCompressAlgorithm jpeg|flate; monochromeImageCompressAlgorithm jbig2|flate; *UpperPpi and *TargetPpi tune resolution. ${fileHelp}`,
            input: object({
              file: File,
              password: string().optional(),
              imageQuality: number().optional(),
              colorImageUpperPpi: number().optional(),
              colorImageTargetPpi: number().optional(),
              colorImageCompressAlgorithm: string().optional(),
              colorImageQuality: number().optional(),
              grayscaleImageUpperPpi: number().optional(),
              grayscaleImageTargetPpi: number().optional(),
              monochromeImageUpperPpi: number().optional(),
              monochromeImageTargetPpi: number().optional(),
              monochromeImageCompressAlgorithm: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, ...fields }) => call.process("pdf/compress", [file], fields),
        ),
        removeWatermark: mutation(
          {
            description: `Remove watermarks from a PDF. mode is "tagged" (remove the watermarks listed in indices) or "untagged". pages optional (e.g. "1-3,6"). ${fileHelp}`,
            input: object({
              file: File,
              mode: string().optional(),
              indices: array(number()).optional(),
              pages: string().optional(),
              password: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, indices, ...fields }) =>
            call.process("pdf/delWatermark", [file], { ...fields, indices: indices?.map(String) }),
        ),
        convertStandard: mutation(
          {
            description: `Convert a PDF to an archival or print standard. standard: PDFTypeA1a (default), PDFTypeA1b, PDFTypeA2a, PDFTypeA2u, PDFTypeA2b, PDFTypeX4, PDFTypeE1 or PDFTypeUA1. iccFile is an optional ICC profile; uaTitle and uaLanguage apply to PDF/UA. ${fileHelp}`,
            input: object({
              file: File,
              standard: string().optional(),
              iccFile: File.optional(),
              uaTitle: string().optional(),
              uaLanguage: string().optional(),
              password: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { file, iccFile, ...fields }) => call.process("pdf/convertType", [file], fields, { iccFile }),
        ),
      },
      { title: "Security and optimization", description: "Encrypt, decrypt, watermark, compress and standardize PDFs." },
    ),
    generate: router(
      {
        pdf: mutation(
          {
            description: `Generate a PDF from HTML or a template. Give exactly one HTML source (html string, htmlUrl, or htmlFile) or a template (template string or templateFile) with data (JSON string) or dataFile. generationType is html (default) or template. baseUri resolves relative resources; pageWidth and pageHeight are in points. ${fileHelp.replace("Each file is { fileName, contentBase64 } or { fileName, url }.", "Files (htmlFile, templateFile, dataFile) are { fileName, contentBase64 } or { fileName, url }.")}`,
            input: object({
              generationType: string().optional(),
              html: string().optional(),
              htmlUrl: string().optional(),
              htmlFile: File.optional(),
              template: string().optional(),
              templateFile: File.optional(),
              data: string().optional(),
              dataFile: File.optional(),
              baseUri: string().optional(),
              pageWidth: number().optional(),
              pageHeight: number().optional(),
              password: string().optional(),
              outputFileName: string().optional(),
            }),
          },
          async (_ctx, { htmlFile, templateFile, dataFile, ...fields }) =>
            call.process("pdf/generate", [], fields, { htmlFile, templateFile, dataFile }),
        ),
      },
      { title: "Generate PDF", description: "Create a PDF from HTML or a template." },
    ),
    ai: router(
      {
        parseDocument: mutation(
          {
            description: `Parse a document into structured content. contentFilter: all (default), table, heading, toc, image, formula. parseOptions is a JSON string. ${fileHelp}`,
            input: object({
              file: File,
              password: string().optional(),
              pageRanges: string().optional(),
              contentFilter: string().optional(),
              imageType: string().optional(),
              parseOptions: string().optional(),
              ...ocr,
            }),
          },
          async (_ctx, { file, ...fields }) => call.process("idp/documentParsing", [file], fields),
        ),
        extractFields: mutation(
          {
            description: `Extract structured fields from a document. extractFields is a JSON string defining the schema; mode is vision (default, better for handwriting) or layout (large files, cross-page). optionsJson is an optional JSON string. ${fileHelp}`,
            input: object({
              file: File,
              extractFields: string({ minLength: 1 }),
              mode: string().optional(),
              password: string().optional(),
              pageRanges: string().optional(),
              optionsJson: string().optional(),
              ...ocr,
            }),
          },
          async (_ctx, { file, ...fields }) => call.process("idp/documentExtract", [file], fields),
        ),
      },
      { title: "AI document parsing", description: "Parse documents and extract structured fields." },
    ),
    tasks: router({
      list: query(
        { description: "List recent tasks (taskId, taskStatus, source and target types, cost). page defaults to 1, size to 10.", input: object({ page: number().optional(), size: number().optional() }) },
        async (_ctx, { page, size }) => call.get("/v2/task/list", { page, size }),
      ),
      close: mutation(
        { description: "Close a task by taskId.", input: object({ taskId: string({ minLength: 1 }) }) },
        async (_ctx, { taskId }) => call.post("/v2/task/closeTask", { taskId }),
      ),
    }, { title: "Tasks", description: "List and close processing tasks." }),
    assets: router({
      info: query(
        { description: "Show the remaining balance per asset type (subscriptions, packages).", input: object({}) },
        async () => call.get("/v2/asset/info", {}),
      ),
    }, { title: "Assets", description: "Account balance." }),
  });
}

export default defineApp(
  { user: { accounts: { compdf: compdf.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.compdf ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, account.fields.region, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ComPDF",
        description:
          "Convert, edit, secure and parse PDFs with the ComPDF cloud API: PDF to and from Word, Excel, PowerPoint, HTML, images and more; merge, split, rotate, watermark, encrypt, compress; AI parsing and field extraction.",
        icons,
      },
    ),
  }),
);
