import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  router,
  secrets,
  string,
  boolean,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://pdfmunk.com/api/v1";

const pdfmunk = defineProvider({
  name: "PDF Munk",
  hosts: ["pdfmunk.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // PDF Munk documents no read-only account endpoint. compressPdf with an empty body is rejected by validation (url is required) before any work is done; a 400 is the only response treated as healthy (observed behavior, not documented), everything else fails closed.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/compressPdf`, {
      method: "POST",
      signal,
      headers: { "CLIENT-API-KEY": account.fields.token, "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status !== 400) throw new Error(`PDF Munk health check failed (HTTP ${response.status}); expected 400 validation response for a valid key.`);
  },
});

type Body = Record<string, unknown>;

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const post = async (path: string, body: Body) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { "CLIENT-API-KEY": token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  // Every PDF Munk call is a POST that creates a hosted file or returns derived data, so all are mutations.
  const op = <T extends Parameters<typeof object>[0]>(
    path: string,
    description: string,
    input: T,
  ) => mutation({ description, input: object(input) }, async (_ctx, args: Body) => post(path, args));

  const outputFormat = string().optional();
  return router({
    generatePdf: op(
      "/generatePdf",
      "Create a PDF from HTML (html_content, optional css_content) or from a web page (url); send exactly one of html_content or url. output_format: url (default, returns a hosted link kept 30 days) or pdf/binary/file. Options: paper_size (A4, Letter, Legal, etc.), landscape, printBackground, preferCSSPageSize, viewPortWidth, viewPortHeight, wait_till (seconds to wait before generating), dynamic_params (object of template placeholder values).",
      {
        html_content: string().optional(),
        url: string().optional(),
        css_content: string().optional(),
        output_format: outputFormat,
        paper_size: string().optional(),
        viewPortWidth: number().optional(),
        viewPortHeight: number().optional(),
        landscape: boolean().optional(),
        printBackground: boolean().optional(),
        preferCSSPageSize: boolean().optional(),
        wait_till: number().optional(),
        dynamic_params: json().optional(),
      },
    ),
    generateImage: op(
      "/generateImage",
      "Create an image from HTML/CSS or a web page. Send exactly one of url or html_content (css_content optional). output_format: url, base64 or both. Options: width, height (px), quality (30-100), full_page (url mode only), wait_till (seconds), wait_until (load, domcontentloaded or networkidle), font (Google Font names separated by |), dynamic_params (object of template values).",
      {
        url: string().optional(),
        html_content: string().optional(),
        css_content: string().optional(),
        output_format: outputFormat,
        width: number().optional(),
        height: number().optional(),
        quality: number().optional(),
        full_page: boolean().optional(),
        wait_till: number().optional(),
        wait_until: string().optional(),
        font: string().optional(),
        dynamic_params: json().optional(),
      },
    ),
    urlToHtml: op(
      "/url-to-html",
      "Render a web page in a headless browser (including JavaScript) and return its final HTML. wait_till: load, domcontentloaded or networkidle. Optionally wait_for_selector, timeout (ms), viewport_width, viewport_height.",
      {
        url: string(),
        wait_till: string().optional(),
        wait_for_selector: string().optional(),
        timeout: number().optional(),
        viewport_width: number().optional(),
        viewport_height: number().optional(),
      },
    ),
    pdfToImage: op(
      "/convert/pdf/image",
      "Convert pages of a PDF at a public url to images. pages: all, 1-3 or 1,3,5-7. image_format: png or jpg. dpi sets resolution. output: url or file.",
      {
        url: string(),
        pages: string().optional(),
        image_format: string().optional(),
        dpi: number().optional(),
        output: string().optional(),
      },
    ),
    imageToPdf: op(
      "/convert/image/pdf",
      "Combine one or more images into a PDF. Pass urls, a list of public image URLs, in page order. output: url or file.",
      { urls: json(), output: string().optional() },
    ),
    pdfOcr: op(
      "/pdf/ocr/parse",
      "Extract text from a scanned PDF at a public url with Tesseract OCR. pages: all, 1-3 or 1,3,5-7. lang is a Tesseract language such as eng; dpi, psm and oem tune recognition.",
      {
        url: string(),
        pages: string().optional(),
        lang: string().optional(),
        dpi: number().optional(),
        psm: number().optional(),
        oem: number().optional(),
      },
    ),
    imageOcr: op(
      "/image/ocr/parse",
      "Extract text from an image with Tesseract OCR. Pass image_url (public URL) or base64_image. lang such as eng or eng+hin; psm and oem tune recognition.",
      {
        image_url: string().optional(),
        base64_image: string().optional(),
        lang: string().optional(),
        psm: number().optional(),
        oem: number().optional(),
      },
    ),
    compressPdf: op(
      "/compressPdf",
      "Reduce the size of a PDF at a public url. compression: low, medium, high or max. output: url or file; output_name names the download.",
      {
        url: string(),
        compression: string().optional(),
        output: string().optional(),
        output_name: string().optional(),
      },
    ),
    watermarkPdf: op(
      "/watermark",
      "Stamp text on a PDF or image. Pass file_url (public URL) or base64_file (raw base64 or data URL), plus text. opacity is 0.0-1.0, angle is in degrees, font_size overrides the size, output_format is file, url, base64 or both.",
      {
        file_url: string().optional(),
        base64_file: string().optional(),
        text: string(),
        opacity: number().optional(),
        angle: number().optional(),
        font_size: number().optional(),
        output_format: outputFormat,
      },
    ),
    lockPdf: op(
      "/lockPdf",
      "Password-protect a PDF at a public url with password. Pass input_password if it is already protected. output: url or file; output_name names the download.",
      {
        url: string(),
        password: string(),
        input_password: string().optional(),
        output: string().optional(),
        output_name: string().optional(),
      },
    ),
    unlockPdf: op(
      "/unlockPdf",
      "Remove password protection from a PDF at a public url, given its current password. output: url or file; output_name names the download.",
      {
        url: string(),
        password: string(),
        output: string().optional(),
        output_name: string().optional(),
      },
    ),
    mergePdf: op(
      "/pdf/merge",
      "Merge 2-15 PDFs into one. Pass urls (list of public PDF URLs, in order) or files (list of base64 PDFs). output: url, file or base64.",
      { urls: json().optional(), files: json().optional(), output: string().optional() },
    ),
    splitPdf: op(
      "/pdf/split",
      "Split a PDF. Pass url or file (base64). pages selects pages (for example 3, 1-5, 1-3,5,7-10, 10-); mode each yields one file per page; chunks splits into that many parts. output: url, file or base64.",
      {
        url: string().optional(),
        file: string().optional(),
        pages: string().optional(),
        mode: string().optional(),
        chunks: number().optional(),
        output: string().optional(),
      },
    ),
    parsePdf: op(
      "/pdf/parse",
      "Extract content from a PDF at a public url. mode: text, layout, tables or full. pages: all, a page such as 2, or a range such as 1-3.",
      { url: string(), mode: string().optional(), pages: string().optional() },
    ),
    deleteFile: op(
      "/file/delete",
      "Delete a file previously stored by PDF Munk, by its hosted url.",
      { url: string() },
    ),
  });
}

export default defineApp(
  { user: { accounts: { pdfmunk: pdfmunk.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pdfmunk ?? [],
        (account) => withApprovals(build(account.fields.token, fetch, signal), () => always()),
        { signal },
      ),
      {
        title: "PDF Munk",
        description: "Generate, convert, OCR, parse, merge, split, compress, watermark and password-protect PDFs and images with PDF Munk.",
        icons,
      },
    ),
  }),
);
