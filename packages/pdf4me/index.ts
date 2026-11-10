import {
  accountRouter,
  array,
  boolean,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import type { JsonValue, Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pdf4me.com/api/v2";

const pdf4me = defineProvider({
  name: "PDF4me",
  hosts: ["api.pdf4me.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // PDF4me has no account or usage endpoint. An empty request to a processing endpoint is
  // rejected with 400 for a valid key and 401 for a bad one, and consumes no credits.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/GetPdfMetadata`, {
      method: "POST",
      signal,
      headers: { Authorization: `Basic ${account.fields.token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 401 || response.status === 403)
      throw new Error(`PDF4me rejected the API key (${response.status})`);
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof globalThis.fetch;

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const settle = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(timer), reject(signal.reason)), { once: true });
  });

// Sends one processing request. The API answers 200 with the result (a file, or JSON for data
// endpoints), or 202 with a Location header to poll when the job outlives the request.
const call = async (
  account: Account,
  fetch: Fetch,
  signal: AbortSignal,
  path: string,
  input: object,
): Promise<JsonValue> => {
  const headers = { Authorization: `Basic ${account.fields.token}` };
  const body: Record<string, unknown> = { isAsync: false };
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) if (value !== undefined) body[key] = value;
  let response = await fetch(`${base}/${path}`, {
    method: "POST",
    signal,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  for (let attempt = 0; response.status === 202 && attempt < 30; attempt++) {
    const location = response.headers.get("location");
    if (location === null) throw new Error("PDF4me accepted the job but sent no Location header to poll");
    await settle(5000, signal);
    response = await fetch(location, { signal, headers });
  }
  if (response.status === 202) throw new Error("PDF4me is still processing this job; try again later");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  if (!response.ok) throw new Error(`PDF4me ${path} failed (${response.status}): ${new TextDecoder().decode(bytes).slice(0, 1000)}`);
  if (/json/i.test(contentType) || /^\s*[[{]/.test(new TextDecoder().decode(bytes.subarray(0, 8)))) {
    return JSON.parse(new TextDecoder().decode(bytes)) as JsonValue;
  }
  if (/^text\//i.test(contentType)) return { contentType, text: new TextDecoder().decode(bytes) };
  return { contentType, sizeBytes: bytes.length, contentBase64: toBase64(bytes) };
};

const file = "Base64-encoded content of the file.";
const doc = {
  docContent: string(),
  docName: string(),
};
const docs = { ...doc, pages: string().optional() };

const result =
  " Returns the output file as { contentType, sizeBytes, contentBase64 }, or the JSON the API produces for data endpoints.";

const pdf4meTools = (account: Account, fetch: Fetch, signal: AbortSignal) => {
  // Output-producing operations create a file and spend credits, so they need approval.
  const run = <I extends object>(path: string, description: string, input: Schema<I, boolean>) =>
    mutation(
      { description: description + result, input, approval: always() },
      async (_ctx, args) => call(account, fetch, signal, path, args),
    );
  const read = <I extends object>(path: string, description: string, input: Schema<I, boolean>) =>
    query({ description: description + result, input }, async (_ctx, args) => call(account, fetch, signal, path, args));
  const pdfDoc = `docContent is a ${file} docName is the file name with extension.`;

  return router({
    pdf: router(
      {
        merge: run("Merge", `Merge two or more PDFs into one, in array order. docContent is an array of base64 PDFs (at least two). docName is the output file name.`, object({ docContent: array(string()), docName: string() })),
        mergeOverlay: run("MergeOverlay", "Overlay the pages of one PDF (layer) on top of another (base).", object({ baseDocContent: string(), baseDocName: string(), layerDocContent: string(), layerDocName: string() })),
        split: run("SplitPdf", `Split a PDF into several PDFs. ${pdfDoc} splitAction is for example SplitAfterPage with splitActionNumber (split after every N pages). fileNaming is for example NameAsPerOrder.`, object({ ...doc, splitAction: string(), splitActionNumber: number().optional(), splitSequence: string().optional(), fileNaming: string().optional() })),
        splitByText: run("SplitByText", `Split a PDF at pages containing a text. ${pdfDoc} splitTextPage is before or after.`, object({ ...doc, text: string(), splitTextPage: string(), fileNaming: string().optional() })),
        splitByBarcode: run("SplitPdfByBarcode_old", `Split a PDF at pages containing a barcode. ${pdfDoc} splitBarcodePage is before or after; barcodeFilter is for example startsWith, contains, exact; pdfRenderDpi is for example 150.`, object({ ...doc, barcodeString: string(), barcodeFilter: string(), barcodeType: string(), splitBarcodePage: string(), combinePagesWithSameConsecutiveBarcodes: boolean().optional(), pdfRenderDpi: string().optional() })),
        splitBySwissQr: run("SplitPdfBySwissQR", `Split a PDF at pages containing a Swiss QR code. ${pdfDoc} splitQRPage is before or after; returnAsZip returns a ZIP.`, object({ ...doc, splitQRPage: string().optional(), pdfRenderDpi: string().optional(), combinePagesWithSameBarcodes: boolean().optional(), returnAsZip: boolean().optional() })),
        compress: run("Optimize", `Compress a PDF. ${pdfDoc} optimizeProfile is for example Web, Print, Max, Default, Screen, Ebook.`, object({ ...doc, optimizeProfile: string() })),
        linearize: run("LinearizePdf", `Linearize a PDF for fast web viewing. ${pdfDoc} optimizeProfile is for example web.`, object({ ...doc, optimizeProfile: string().optional() })),
        flatten: run("FlattenPdf", `Flatten form fields and annotations into page content. ${pdfDoc}`, object(doc)),
        repair: run("RepairPdf", `Repair a damaged PDF. ${pdfDoc}`, object(doc)),
        toPdfA: run("PdfA", `Convert a PDF to PDF/A. ${pdfDoc} compliance is for example PdfA1b, PdfA2b.`, object({ ...doc, compliance: string(), allowUpgrade: boolean().optional(), allowDowngrade: boolean().optional() })),
        protect: run("Protect", `Password-protect a PDF. ${pdfDoc} pdfPermission is for example All or None.`, object({ ...doc, password: string(), pdfPermission: string() })),
        unlock: run("Unlock", `Remove the password from a PDF. ${pdfDoc}`, object({ ...doc, password: string() })),
        deletePages: run("DeletePages", `Delete pages from a PDF. ${pdfDoc} pageNumbers is for example 1,3,5-7.`, object({ ...doc, pageNumbers: string() })),
        extractPages: run("Extract", `Extract pages into a new PDF. ${pdfDoc} pageNumbers is for example 1,3,5-7.`, object({ ...doc, pageNumbers: string() })),
        deleteBlankPages: run("DeleteBlankPages", `Remove blank pages. ${pdfDoc} deletePageOption is for example NoTextNoImages.`, object({ ...doc, deletePageOption: string() })),
        rotate: run("Rotate", `Rotate every page. ${pdfDoc} rotationType is for example Clockwise90, Clockwise180, Clockwise270.`, object({ ...doc, rotationType: string() })),
        rotatePage: run("RotatePage", `Rotate selected pages. ${pdfDoc} rotationType is for example Clockwise90; page is the page number or range.`, object({ ...doc, rotationType: string(), page: string() })),
        addMargin: run("AddMargin", `Add margins in millimeters (0-100). ${pdfDoc}`, object({ ...doc, marginLeft: number(), marginRight: number(), marginTop: number(), marginBottom: number() })),
        addPageNumber: run("AddPageNumber", `Add page numbers. ${pdfDoc} pageNumberFormat is for example "Page {0} of {1}"; alignX is left/center/right; alignY is top/middle/bottom.`, object({ ...doc, pageNumberFormat: string(), alignX: string(), alignY: string(), marginXinMM: number().optional(), marginYinMM: number().optional(), fontSize: number().optional(), isBold: boolean().optional(), isItalic: boolean().optional(), skipFirstPage: boolean().optional() })),
        addHeaderFooter: run("AddHtmlHeaderFooter", `Add an HTML header or footer. ${pdfDoc} htmlContent is plain HTML; location is Header, Footer or Both; pages is a range or empty for all.`, object({ ...doc, htmlContent: string(), location: string(), pages: string().optional(), skipFirstPage: boolean().optional(), marginLeft: number().optional(), marginRight: number().optional(), marginTop: number().optional(), marginBottom: number().optional() })),
        addTextStamp: run("Stamp", `Stamp text such as a watermark. ${pdfDoc} pages is all or a range; opacity 0-100 as a string.`, object({ ...doc, pages: string(), text: string(), alignX: string(), alignY: string(), opacity: string().optional(), fontName: string().optional(), fontSize: number().optional(), fontColor: string().optional(), isBold: boolean().optional(), isItalics: boolean().optional(), underline: boolean().optional(), rotate: number().optional(), isBackground: boolean().optional(), showOnlyInPrint: boolean().optional(), marginXInMM: string().optional(), marginYInMM: string().optional() })),
        addImageStamp: run("ImageStamp", `Stamp an image. ${pdfDoc} imageFile is the base64 image and imageName its file name.`, object({ ...doc, imageFile: string(), imageName: string(), pages: string().optional(), alignX: string(), alignY: string(), widthInMM: string().optional(), heightInMM: string().optional(), marginXInMM: string().optional(), marginYInMM: string().optional(), opacity: number().optional(), isBackground: boolean().optional(), showOnlyInPrint: boolean().optional() })),
        sign: run("SignPdf", `Place a signature image on pages. ${pdfDoc} imageFile is the base64 signature image and imageName its file name.`, object({ ...doc, imageFile: string(), imageName: string(), pages: string(), alignX: string(), alignY: string(), widthInMM: string().optional(), heightInMM: string().optional(), marginXInMM: string().optional(), marginYInMM: string().optional(), opacity: string().optional(), showOnlyInPrint: boolean().optional(), isBackground: boolean().optional() })),
        addAttachment: run("AddAttachmentToPdf", `Embed files in a PDF. ${pdfDoc} attachments is a list of { docName, docContent } with base64 content.`, object({ ...doc, attachments: array(object({ docName: string(), docContent: string() })) })),
        updateHyperlinks: run("UpdateHyperlinksAnnotation", `Rewrite hyperlink text and URLs. ${pdfDoc} updatehyperlinkannotationlist items have SearchOn, SearchValue, IsExpression, TextCurrentValue, TextNewValue, URLCurrentValue, URLNewValue.`, object({ ...doc, updatehyperlinkannotationlist: array(object({ SearchOn: string(), SearchValue: string(), IsExpression: boolean(), TextCurrentValue: string(), TextNewValue: string(), URLCurrentValue: string(), URLNewValue: string() })) })),
        findAndReplace: run("FindAndReplace", `Find and replace text. ${pdfDoc} pageSequence is for example 1,3-5.`, object({ ...doc, oldText: string(), newText: string(), pageSequence: string().optional() })),
        replaceTextWithImage: run("ReplaceTextWithImage", `Replace text with an image. ${pdfDoc} imageContent is a base64 image.`, object({ ...doc, replaceText: string(), pageSequence: string(), imageContent: string(), imageHeight: number(), imageWidth: number() })),
        ocr: run("ConvertOcrPdf", `Make a scanned PDF searchable with OCR. ${pdfDoc} qualityType is Draft or Quality; language is for example English.`, object({ ...doc, qualityType: string(), ocrWhenNeeded: string(), language: string().optional(), outputFormat: string(), mergeAllSheets: boolean().optional() })),
        addFormField: run("AddFormField", `Add a text box or check box form field. ${pdfDoc} formFieldType is TextBox or CheckBox.`, object({ ...doc, fieldName: string(), initialValue: string(), positionX: number(), positionY: number(), Size: number(), pages: string(), formFieldType: string() })),
        fillForm: run("FillPdfForm", `Fill a PDF form. templateDocContent is the base64 PDF and templateDocName its name; dataArray is a JSON string of field values; outputType is pdf; inputDataType is json.`, object({ templateDocName: string(), templateDocContent: string(), dataArray: string(), outputType: string(), inputDataType: string() })),
        metadata: read("GetPdfMetadata", `Read a PDF's metadata and page information. ${pdfDoc}`, object(doc)),
        classify: read("ClassifyDocument", `Classify a PDF by document type. ${pdfDoc}`, object(doc)),
        parse: read("ParseDocument", `Parse a PDF into structured data. ${pdfDoc}`, object(doc)),
      },
      { title: "PDF", description: "Merge, split, compress, protect, stamp, OCR and inspect PDFs." },
    ),
    convert: router(
      {
        toPdf: run("ConvertToPdf", `Convert a Word, Excel, PowerPoint, image or other file to PDF. ${pdfDoc}`, object(doc)),
        htmlToPdf: run("ConvertHtmlToPdf", `Convert HTML to PDF. docContent is base64 HTML; indexFilePath is the HTML file name; layout is Portrait or Landscape; format is for example A4 or Letter; margins like 20px.`, object({ ...doc, indexFilePath: string(), layout: string().optional(), format: string().optional(), scale: number().optional(), topMargin: string().optional(), bottomMargin: string().optional(), leftMargin: string().optional(), rightMargin: string().optional(), printBackground: boolean().optional(), displayHeaderFooter: boolean().optional() })),
        urlToPdf: run("ConvertUrlToPdf", `Render a web page to PDF. authType is NoAuth or Basic; docName is the output file name.`, object({ webUrl: string(), docName: string(), authType: string().optional(), username: string().optional(), password: string().optional(), layout: string().optional(), format: string().optional(), scale: number().optional(), topMargin: string().optional(), bottomMargin: string().optional(), leftMargin: string().optional(), rightMargin: string().optional(), printBackground: boolean().optional(), displayHeaderFooter: boolean().optional() })),
        markdownToPdf: run("ConvertMdToPdf", `Convert Markdown to PDF. docContent is base64 Markdown; docName ends in .md.`, object({ ...doc, mdFilePath: string().optional() })),
        wordToPdfForm: run("ConvertWordToPdfForm", `Convert a Word document with form controls to a fillable PDF. ${pdfDoc}`, object(doc)),
        visio: run("ConvertVisio", `Convert a Visio file. OutputFormat is PDF, JPG, PNG or TIFF.`, object({ ...doc, OutputFormat: string(), IsPdfCompliant: boolean().optional(), PageIndex: number().optional(), PageCount: number().optional(), IncludeHiddenPages: boolean().optional(), AutoFit: boolean().optional() })),
        jsonToExcel: run("ConvertJsonToExcel", `Convert JSON to an Excel workbook. docContent is base64 JSON.`, object({ ...doc, worksheetName: string().optional(), isTitleBold: boolean().optional(), isTitleWrapText: boolean().optional(), convertNumberAndDate: boolean().optional(), ignoreNullValues: boolean().optional(), firstRow: number().optional(), firstColumn: number().optional() })),
        pdfToWord: run("ConvertPdfToWord", `Convert a PDF to Word. ${pdfDoc} qualityType is Draft or Quality.`, object({ ...doc, qualityType: string(), language: string().optional(), ocrWhenNeeded: boolean().optional(), outputFormat: boolean().optional(), mergeAllSheets: boolean().optional() })),
        pdfToExcel: run("ConvertPdfToExcel", `Convert a PDF to Excel. ${pdfDoc} qualityType is Draft or Quality.`, object({ ...doc, qualityType: string(), language: string().optional(), ocrWhenNeeded: boolean().optional(), outputFormat: boolean().optional(), mergeAllSheets: boolean().optional() })),
        pdfToPowerPoint: run("ConvertPdfToPowerPoint", `Convert a PDF to PowerPoint. ${pdfDoc} qualityType is Draft or Quality.`, object({ ...doc, qualityType: string(), language: string().optional(), ocrWhenNeeded: boolean().optional(), outputFormat: boolean().optional(), mergeAllSheets: boolean().optional() })),
        pdfToImages: run("CreateImages", `Render PDF pages as images. docContent is the base64 PDF; docname is lowercase here; imageAction is { WidthPixel, ImageExtension (jpeg or png), PageSelection: { PageNrs: number[] } }.`, object({ docContent: string(), docname: string(), imageAction: object({ WidthPixel: string(), ImageExtension: string(), PageSelection: object({ PageNrs: array(number()) }) }) })),
      },
      { title: "Convert", description: "Convert between PDF, Word, Excel, PowerPoint, HTML, Markdown, Visio, JSON and images." },
    ),
    extract: router(
      {
        text: read("ExtractTextByExpression", `Extract text matching a regular expression. ${pdfDoc} pageSequence is for example 1,3-5.`, object({ ...doc, expression: string(), pageSequence: string().optional() })),
        tables: read("ExtractTableFromPdf", `Extract tables from a PDF. ${pdfDoc}`, object(doc)),
        formData: read("ExtractPdfFormData", `Read the form field values of a PDF. ${pdfDoc}`, object(doc)),
        attachments: read("ExtractAttachmentFromPdf", `Extract embedded files from a PDF. ${pdfDoc}`, object(doc)),
        resources: read("ExtractResources", `Extract text and images from a PDF. ${pdfDoc}`, object({ ...doc, extractText: boolean().optional(), extractImages: boolean().optional() })),
        wordText: read("ExtractTextFromWord", `Extract text from a Word document. docContent is base64 .docx.`, object({ ...doc, StartPageNumber: number().optional(), EndPageNumber: number().optional(), RemoveComments: boolean().optional(), RemoveHeaderFooter: boolean().optional(), AcceptChanges: boolean().optional() })),
        wordTrackedChanges: read("GetTrackingChangesInWord", `List tracked changes in a Word document. docContent is base64 .docx.`, object(doc)),
      },
      { title: "Extract", description: "Pull text, tables, form data, attachments and tracked changes out of documents." },
    ),
    word: router(
      {
        enableTrackedChanges: run("EnableTrackingChangesInWord", `Turn on tracked changes in a Word document. docContent is base64 .docx.`, object(doc)),
        disableTrackedChanges: run("DisableTrackingChangesInWord", `Turn off tracked changes in a Word document. docContent is base64 .docx.`, object(doc)),
        replaceTextWithImage: run("ReplaceTextWithImageInWord", `Replace text in a Word document with an image. docContent is base64 .docx.`, object({ ...doc, ImageFileName: string(), ImageFileContent: string(), SearchText: string(), PageNumbers: string().optional(), IsFirstPageSkip: boolean().optional() })),
        generateDocument: run("GenerateDocumentSingle", `Fill a Word, HTML or PDF template with JSON/XML data to produce one document. templateFileType is Word, HTML or PDF; documentDataType is JSON or XML; documentDataText is the data text.`, object({ templateFileType: string(), templateFileName: string(), templateFileData: string(), documentDataType: string(), outputType: string(), documentDataText: string() })),
        generateDocuments: run("GenerateDocumentMultiple", `Fill a template with a data array to produce several documents. Fields as for generateDocument; outputType is PDF, Docx, Excel or HTML.`, object({ templateFileType: string(), templateFileName: string(), templateFileData: string(), documentDataType: string(), outputType: string(), documentDataText: string(), metaDataJson: string().optional() })),
      },
      { title: "Word and templates", description: "Edit Word documents and generate documents from templates." },
    ),
    image: router(
      {
        compress: run("CompressImage", `Compress an image. docContent is base64 image; imageType is JPG or PNG; compressionLevel is Low, Medium or High.`, object({ ...doc, imageType: string(), compressionLevel: string() })),
        convertFormat: run("ConvertImageFormat", `Convert an image format. currentImageFormat and newImageFormat are for example JPG, PNG.`, object({ ...doc, currentImageFormat: string(), newImageFormat: string() })),
        resize: run("ResizeImage", `Resize an image. ImageResizeType is Percentage or Specific; give ResizePercentage or Width and Height; MaintainAspectRatio is a boolean.`, object({ ...doc, ImageResizeType: string(), ResizePercentage: number().optional(), Width: number().optional(), Height: number().optional(), MaintainAspectRatio: boolean().optional() })),
        crop: run("CropImage", `Crop an image to a rectangle in pixels.`, object({ ...doc, cropX: number(), cropY: number(), cropWidth: number(), cropHeight: number() })),
        flip: run("FlipImage", `Flip an image horizontally and/or vertically.`, object({ ...doc, flipHorizontal: boolean(), flipVertical: boolean() })),
        rotate: run("RotateImage", `Rotate an image by an angle in degrees.`, object({ ...doc, rotationAngle: number() })),
        rotateByExif: run("RotateImageByExifData", `Rotate an image to match its EXIF orientation. imageType is JPG or PNG.`, object({ ...doc, imageType: string() })),
        removeExif: run("RemoveExifTagsFromImage", `Strip EXIF metadata from an image.`, object(doc)),
        addTextWatermark: run("AddTextWatermarkToImage", `Add a text watermark. TextPosition is for example bottomleft; TextColour is hex.`, object({ ...doc, WatermarkText: string(), TextPosition: string().optional(), TextFontFamily: string().optional(), TextFontSize: number().optional(), TextColour: string().optional(), IsBold: boolean().optional(), IsItalic: boolean().optional(), IsUnderline: boolean().optional(), Opacity: number().optional(), RotationAngle: number().optional(), PositionX: number().optional(), PositionY: number().optional() })),
        addImageWatermark: run("AddImageWatermarkToImage", `Add an image watermark. Position is for example topright.`, object({ ...doc, WatermarkFileName: string(), WatermarkFileContent: string(), Position: string().optional(), Opacity: number().optional(), HorizontalOffset: number().optional(), VerticalOffset: number().optional(), Rotation: number().optional() })),
        metadata: read("GetImageMetadata", `Read image metadata (dimensions, EXIF).`, object(doc)),
        extractText: read("ImageExtractText", `OCR text from an image. language is a code such as eng.`, object({ ...doc, language: string().optional() })),
        readBarcodes: read("ReadBarcodesFromImage", `Read barcodes and QR codes from an image. barcodeTypes is for example ["All"].`, object({ ...doc, readMultipleBarcodes: boolean().optional(), barcodeTypes: array(string()).optional() })),
      },
      { title: "Image", description: "Resize, convert, watermark, OCR and inspect images." },
    ),
    barcode: router(
      {
        create: run("CreateBarcode", `Generate a barcode image. barcodeType is for example qrCode, code128, dataMatrix, aztec, pdf417.`, object({ text: string(), barcodeType: string(), hideText: boolean().optional() })),
        addToPdf: run("addbarcode", `Place a barcode on PDF pages. ${pdfDoc} pages is a range or empty for all; alignX Left/Center/Right; alignY Top/Middle/Bottom; sizes and margins are strings in mm.`, object({ ...doc, text: string(), barcodeType: string(), pages: string().optional(), alignX: string().optional(), alignY: string().optional(), heightInMM: string().optional(), widthInMM: string().optional(), marginXInMM: string().optional(), marginYInMM: string().optional(), opacity: number().optional(), hideText: boolean().optional(), showOnlyInPrint: boolean().optional() })),
        readFromPdf: read("ReadBarcodes", `Read barcodes from a PDF. ${pdfDoc} barcodeType is for example ["all"]; pages is all or a range.`, object({ ...doc, barcodeType: array(string()), pages: string() })),
        readSwissQr: read("ReadSwissQR", `Read the Swiss QR bill data from a PDF. ${pdfDoc}`, object(doc)),
        createSwissQrBill: run("CreateSwissQrBill", `Add a Swiss QR bill to a PDF. cr* fields are the creditor, ud* the ultimate debtor; address types are S (structured); referenceType is for example NON; languageType is for example English; seperatorLine is for example LineWithScissor.`, object({ ...doc, iban: string(), crName: string(), crAddressType: string(), crStreetOrAddressLine1: string(), crStreetOrAddressLine2: string(), crPostalCode: string(), crCity: string(), amount: string(), currency: string(), udName: string(), udAddressType: string(), udStreetOrAddressLine1: string(), udStreetOrAddressLine2: string(), udPostalCode: string(), udCity: string(), referenceType: string(), languageType: string(), seperatorLine: string() })),
      },
      { title: "Barcode", description: "Create, place and read barcodes, QR codes and Swiss QR bills." },
    ),
  });
};

export default defineApp({ user: { accounts: { pdf4me: pdf4me.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.pdf4me ?? [], (account) => pdf4meTools(account, fetch, signal), { signal }), {
    title: "PDF4me",
    description:
      "Convert, merge, split, compress, secure, OCR and extract data from PDF, Word, Excel and image files, generate documents from templates and work with barcodes using PDF4me.",
    instructions:
      "Files go in and out as base64 strings (docContent and the file name in docName); outputs are returned as { contentType, sizeBytes, contentBase64 }. Tools that produce a file ask for approval and spend PDF4me credits. Keep files small: whole documents travel through the tool call.",
    icons,
  }),
}));
