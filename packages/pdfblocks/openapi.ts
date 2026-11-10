import type { OpenapiToolNamesOptions } from "apps/openapi";

// PDF Blocks does not publish its OpenAPI document (its docs say to request it by email). The
// APIs.guru copy is an old conversion (spec 1.5.0) whose routes and fields no longer match the
// API (1.18.0, 17 actions). This document is therefore written from the vendor's current
// reference at https://www.pdfblocks.com/docs/api/actions-overview, one operation per action.

type Json = string | number | boolean | null | readonly Json[] | { readonly [key: string]: Json };
type Schema = { [key: string]: Json };
type Properties = Record<string, Schema>;

const file = (description: string): Schema => ({ type: "string", format: "binary", description });
const pdf = file("The input PDF document.");
const pages = (description: string): Schema => ({ type: "string", maxLength: 1000, description });
const integer = (description: string, minimum?: number, maximum?: number): Schema => ({
  type: "integer",
  description,
  ...(minimum === undefined ? {} : { minimum }),
  ...(maximum === undefined ? {} : { maximum }),
});
const algorithm: Schema = {
  type: "string",
  enum: ["AES-128", "AES-256"],
  default: "AES-128",
  description: "The encryption algorithm.",
};
const flag = (description: string): Schema => ({ type: "boolean", default: true, description });

const pdfResponse = {
  "200": {
    description: "The processed PDF document.",
    content: { "application/pdf": { schema: file("The output PDF document.") } },
  },
};
// Split actions pick their packaging from the Accept header: ZIP (default), JSON or multipart/mixed.
// Only JSON is declared so that the request asks for it and the parts come back as base64 PDFs.
const documentsResponse = {
  "200": {
    description: "The output PDF documents, in order, as base64.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["documents"],
          properties: {
            documents: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "content", "content_type"],
                properties: {
                  name: { type: "string", description: "File name, such as 00001.pdf." },
                  content: { type: "string", description: "The PDF bytes, base64-encoded." },
                  content_type: { type: "string", description: "Always application/pdf." },
                },
              },
            },
          },
        },
      },
    },
  },
};

function operation(
  id: string,
  tag: string,
  summary: string,
  description: string,
  properties: Properties,
  required: readonly string[],
  responses: Schema = pdfResponse,
) {
  return {
    post: {
      operationId: id,
      tags: [tag],
      summary,
      description,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { type: "object", required: ["file", ...required], properties: { file: pdf, ...properties } },
          },
        },
      },
      responses,
    },
  };
}

const document = {
  openapi: "3.0.3",
  info: { title: "PDF Blocks API", version: "1.18.0" },
  servers: [{ url: "https://api.pdfblocks.com" }],
  security: [{ apiKey: [] }],
  components: { securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } } },
  paths: {
    "/v1/merge_documents": operation(
      "mergeDocuments", "merge", "Merge PDF documents",
      "Merge several PDF documents into one, in the order they are sent.",
      { file: { type: "array", minItems: 1, items: { type: "string", format: "binary" }, description: "The input PDF documents, merged in the order given." } },
      [],
    ),
    "/v1/split_by_page_count": operation(
      "splitByPageCount", "split", "Split a PDF by page count",
      "Split a PDF into consecutive parts of a fixed number of pages; the last part holds the remaining pages.",
      { page_count: integer("The number of pages in each output PDF.", 1) },
      ["page_count"], documentsResponse,
    ),
    "/v1/split_at_page": operation(
      "splitAtPage", "split", "Split a PDF at a page",
      "Split a PDF into two documents: the pages before the split page, then the split page onward.",
      { page: integer("The page number that begins the second part, from 2 to the page count.", 2) },
      ["page"], documentsResponse,
    ),
    "/v1/split_by_size": operation(
      "splitBySize", "split", "Split a PDF by file size",
      "Split a PDF into smaller documents, each no larger than a maximum size in bytes.",
      { maximum_bytes: integer("The maximum size in bytes of each output PDF.", 1) },
      ["maximum_bytes"], documentsResponse,
    ),
    "/v1/split_by_groups": operation(
      "splitByGroups", "split", "Split a PDF into page groups",
      "Split a PDF into page groups; each group becomes one output PDF, in written order.",
      { groups: { type: "string", description: "Groups separated by ';', each a comma-separated ordered list of pages and ranges, such as '2..8,29;1' for two PDFs. Pages are 1-based, negative counts from the end, 'a..b' is a range and may run backwards." } },
      ["groups"], documentsResponse,
    ),
    "/v1/reorder_pages": operation(
      "reorderPages", "pages", "Reorder the pages of a PDF",
      "Rearrange pages into the exact order listed; a repeated page is duplicated and an omitted page is dropped.",
      { page_order: { type: "string", maxLength: 1000, description: "The ordered pages, such as '3,1,2' or '-1,1..-2'. 1-based; negative counts from the end; ranges may run backwards." } },
      ["page_order"],
    ),
    "/v1/extract_pages": operation(
      "extractPages", "pages", "Extract pages from a PDF",
      "Keep only the selected pages, in document order.",
      { pages: pages("The pages to extract as a set, such as '1..3,5'. Omit for every page.") },
      [],
    ),
    "/v1/remove_pages": operation(
      "removePages", "pages", "Remove pages from a PDF",
      "Remove the selected pages. At least one page must remain.",
      { pages: pages("The pages to remove as a set, such as '2,4..6'.") },
      ["pages"],
    ),
    "/v1/rotate_pages": operation(
      "rotatePages", "pages", "Rotate pages in a PDF",
      "Rotate the selected pages; the rotation adds to each page's current rotation.",
      {
        angle: { type: "integer", enum: [0, 90, 180, 270, -90, -180, -270], description: "Degrees; positive is clockwise." },
        pages: pages("The pages to rotate as a set, such as '1..3,5'. Omit for every page."),
      },
      ["angle"],
    ),
    "/v1/reverse_pages": operation(
      "reversePages", "pages", "Reverse the pages of a PDF",
      "Reverse the order of all pages.",
      {},
      [],
    ),
    "/v1/add_text_watermark": operation(
      "addTextWatermark", "watermark", "Add a text watermark to a PDF",
      "Stamp up to three lines of text on the pages of a PDF.",
      {
        line_1: { type: "string", maxLength: 32, description: "First line of text (standard Latin characters)." },
        line_2: { type: "string", maxLength: 32, description: "Second line of text." },
        line_3: { type: "string", maxLength: 32, description: "Third line of text." },
        pages: pages("The pages to stamp as a set, such as '1..3,5'. Omit for every page."),
        template: { type: "integer", default: 1001, enum: [1001, 1002, 1003, 1004, 1005, 1017, 1018, 1019, 1020, 1021], description: "Style and orientation: 1001-1005 filled (diagonal up, diagonal down, horizontal, vertical up, vertical down), 1017-1021 the same as outline." },
        color: { type: "string", default: "Gray", enum: ["Red", "Blue", "Gray", "Black"], description: "Watermark color." },
        transparency: integer("0 (opaque) to 100 (transparent). Default 75.", 0, 100),
        margin: { type: "number", minimum: 0, description: "Inches from the page border to the watermark. Default 1.0." },
      },
      ["line_1"],
    ),
    "/v1/add_image_watermark": operation(
      "addImageWatermark", "watermark", "Add an image watermark to a PDF",
      "Stamp a PNG or JPEG image on the pages of a PDF.",
      {
        image: file("The watermark image, PNG or JPEG."),
        pages: pages("The pages to stamp as a set, such as '1..3,5'. Omit for every page."),
        transparency: integer("0 (opaque) to 100 (transparent). Default 50.", 0, 100),
        margin: { type: "number", minimum: 0, description: "Inches from the page border to the watermark. Default 1.0." },
      },
      ["image"],
    ),
    "/v1/add_password": operation(
      "addPassword", "security", "Add a password to a PDF",
      "Encrypt a PDF so a password is required to open it.",
      {
        password: { type: "string", pattern: "^[\\x20-\\x7e]{4,32}$", description: "The open password, 4-32 printable ASCII characters." },
        encryption_algorithm: algorithm,
      },
      ["password"],
    ),
    "/v1/remove_password": operation(
      "removePassword", "security", "Remove the password from a PDF",
      "Decrypt a PDF using the password that currently opens it.",
      { password: { type: "string", maxLength: 256, description: "The password that currently opens the file." } },
      ["password"],
    ),
    "/v1/add_restrictions": operation(
      "addRestrictions", "security", "Add restrictions to a PDF",
      "Restrict what readers can do (copy, print, edit) behind an owner password. Send only the flags to turn off.",
      {
        owner_password: { type: "string", pattern: "^[\\x20-\\x7e]{4,32}$", description: "The owner password, 4-32 printable ASCII characters." },
        user_password: { type: "string", description: "Optional open password, 4-32 printable ASCII characters." },
        encryption_algorithm: algorithm,
        allow_copy_content: flag("Allow copying text and images."),
        allow_change_content: flag("Allow changing the content."),
        allow_print: flag("Allow printing."),
        allow_print_high_resolution: flag("Allow high-resolution printing."),
        allow_comment_and_fill_form: flag("Allow annotations and filling form fields."),
        allow_fill_form: flag("Allow filling form fields."),
        allow_assemble_document: flag("Allow inserting, deleting and rotating pages."),
        allow_accessibility: flag("Allow accessibility software to read the document."),
      },
      ["owner_password"],
    ),
    "/v1/remove_restrictions": operation(
      "removeRestrictions", "security", "Remove restrictions from a PDF",
      "Remove the permission restrictions from a PDF.",
      {},
      [],
    ),
    "/v1/remove_signatures": operation(
      "removeSignatures", "security", "Remove signatures from a PDF",
      "Remove the digital signatures from a PDF.",
      {},
      [],
    ),
  },
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.pdfblocks.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
