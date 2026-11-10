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

const base = "https://picnie.com/api/v1";

const picnie = defineProvider({
  name: "Picnie",
  hosts: ["picnie.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // POST /get-my-projects is read-only and requires a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/get-my-projects`, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Picnie rejected the API key (${response.status})`);
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return decodeJson(response, json());
  };
}

function uploader(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, form: FormData) => {
    const response = await fetcher(`${base}${path}`, {
      method: "POST",
      signal,
      headers: { Authorization: token },
      body: form,
    });
    return decodeJson(response, json());
  };
}

const ProjectId = string({ minLength: 1 });
const ImageUrl = string({ minLength: 1 });
const Details = array(json());
const detailsHelp =
  "details is a list of template variable values: objects with the variable name and either text (for text layers) or image_url (for image layers), for example [{ name: 'Title_0', text: 'Hello' }, { name: 'background_image', image_url: 'https://...' }]. Get the variable names from templates.get.";

function build(call: ReturnType<typeof client>, upload: ReturnType<typeof uploader>) {
  const keep = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  return router({
    projects: router(
      {
        list: query(
          { description: "List the account's Picnie projects (workspaces that hold generated assets).", input: object({}) },
          async () => call("/get-my-projects"),
        ),
        create: mutation(
          { description: "Create a project.", input: object({ name: string({ minLength: 1 }) }) },
          async (_ctx, { name }) => call("/create-project", { name }),
        ),
        delete: mutation(
          {
            description:
              "Delete a project's assets. delete_type 1 deletes all assets and the project; 2 deletes the assets only and keeps the empty project. Irreversible.",
            input: object({ project_id: number(), delete_type: number() }),
          },
          async (_ctx, input) => call("/delete-project", input),
        ),
        uploadAsset: mutation(
          {
            description:
              "Upload an image to Picnie (multipart upload-asset endpoint). Provide the file as base64 in content_base64; file_name should carry the extension and mime_type defaults to image/png.",
            input: object({
              content_base64: string({ minLength: 1 }),
              file_name: string({ minLength: 1 }),
              mime_type: string().optional(),
            }),
          },
          async (_ctx, input) => {
            const bytes = Uint8Array.from(atob(input.content_base64), (c) => c.charCodeAt(0));
            const form = new FormData();
            form.append("image", new Blob([bytes], { type: input.mime_type ?? "image/png" }), input.file_name);
            return upload("/upload-asset", form);
          },
        ),
      },
      { title: "Projects", description: "Workspaces that organise generated assets." },
    ),
    templates: router(
      {
        list: query(
          { description: "List the account's templates.", input: object({}) },
          async () => call("/get-my-templates"),
        ),
        get: query(
          {
            description: "Get one template's details, including the variable names its layers expose.",
            input: object({ template_id: string({ minLength: 1 }) }),
          },
          async (_ctx, { template_id }) => call("/get-template", { template_id }),
        ),
      },
      { title: "Templates", description: "Templates built in the Picnie editor (read only through the API)." },
    ),
    generate: router(
      {
        image: mutation(
          {
            description: `Generate an image from a template. Consumes credits. ${detailsHelp}`,
            input: object({
              project_id: ProjectId,
              template_id: string({ minLength: 1 }),
              template_name: string().optional(),
              output_image_quality: string().optional(),
              output_image_format: string().optional(),
              details: Details,
            }),
          },
          async (_ctx, input) => call("/create-image", { ...keep(input), type: "image" }),
        ),
        pdf: mutation(
          {
            description: `Generate a PDF from a template. Consumes credits. ${detailsHelp}`,
            input: object({
              project_id: ProjectId,
              template_id: string({ minLength: 1 }),
              template_name: string().optional(),
              details: Details,
            }),
          },
          async (_ctx, input) => call("/create-pdf", { ...keep(input), type: "pdf" }),
        ),
      },
      { title: "Generate", description: "Create images and PDFs from templates and variable data." },
    ),
    images: router(
      {
        resize: mutation(
          {
            description:
              "Resize an image. resize_type '1' resizes to width and height (required then); '2' resizes by resize_percentage (required then). no_enlarge_on_smaller '1' keeps smaller images as they are; is_maintain_aspect_ratio '1' keeps the ratio, '0' forces the exact size.",
            input: object({
              project_id: ProjectId,
              image_url: ImageUrl,
              resize_type: string({ minLength: 1 }),
              width: string().optional(),
              height: string().optional(),
              resize_percentage: string().optional(),
              no_enlarge_on_smaller: string().optional(),
              is_maintain_aspect_ratio: string().optional(),
            }),
          },
          async (_ctx, input) => call("/resize-image", keep(input)),
        ),
        compress: mutation(
          {
            description: "Compress an image. image_quality is 0-100 as a string; image_output_format is 'original' or a format such as jpg, png, webp.",
            input: object({
              project_id: ProjectId,
              image_url: ImageUrl,
              image_quality: string().optional(),
              image_output_format: string().optional(),
            }),
          },
          async (_ctx, input) => call("/compress-image", keep(input)),
        ),
        crop: mutation(
          {
            description:
              "Crop an image to width x height. vertical_crop_from is top, center or bottom; horizontal_crop_from is left, center or right.",
            input: object({
              project_id: ProjectId,
              image_url: ImageUrl,
              width: string({ minLength: 1 }),
              height: string({ minLength: 1 }),
              vertical_crop_from: string().optional(),
              horizontal_crop_from: string().optional(),
            }),
          },
          async (_ctx, input) => call("/crop-image", keep(input)),
        ),
        convert: mutation(
          {
            description: "Convert an image to another format (for example webp, png, jpg).",
            input: object({ project_id: ProjectId, image_url: ImageUrl, output_format: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("/convert-image", input),
        ),
        filter: mutation(
          {
            description: "Apply a filter to an image. filter is a PHP image filter constant such as IMG_FILTER_GRAYSCALE.",
            input: object({ project_id: ProjectId, image_url: ImageUrl, filter: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("/filter-on-image", input),
        ),
        removeBackground: mutation(
          {
            description: "Remove the background from an image with AI. Consumes credits.",
            input: object({ project_id: ProjectId, image_url: ImageUrl }),
          },
          async (_ctx, input) => call("/remove-background", input),
        ),
        transcribe: mutation(
          {
            description: "Extract text from an image (OCR). method and language default to 'Original'.",
            input: object({
              project_id: ProjectId,
              image_url: ImageUrl,
              method: string().optional(),
              language: string().optional(),
            }),
          },
          async (_ctx, input) => call("/transcribe-image", keep(input)),
        ),
        getMetadata: mutation(
          {
            description: "Read the metadata of an image.",
            input: object({ project_id: ProjectId, image_url: ImageUrl }),
          },
          async (_ctx, input) => call("/get-image-metadata", input),
        ),
        addMetadata: mutation(
          {
            description:
              "Write EXIF metadata into a JPEG image. metadata is an object with keys from: ImageDescription, Artist, Software, UserComment, Copyright, Make, Model, DateTimeOriginal (format YYYY:MM:DD HH:MM:SS).",
            input: object({ project_id: ProjectId, image_url: ImageUrl, metadata: json() }),
          },
          async (_ctx, input) => call("/add-image-metadata", input),
        ),
      },
      { title: "Images", description: "Resize, crop, compress, convert, filter, background removal, OCR and metadata." },
    ),
    watermark: router(
      {
        text: mutation(
          {
            description:
              "Overlay a text watermark on an image. position is for example bottom-right; font_color and background_color are hex colors; opacity and background_opacity are 0-1; rotation is degrees.",
            input: object({
              project_id: ProjectId,
              image_url: ImageUrl,
              watermark_text: string({ minLength: 1 }),
              position: string().optional(),
              font_size: number().optional(),
              font_path: string().optional(),
              font_color: string().optional(),
              opacity: number().optional(),
              rotation: number().optional(),
              padding: number().optional(),
              background_color: string().optional(),
              background_opacity: number().optional(),
            }),
          },
          async (_ctx, input) => call("/add-watermark-text-on-image", keep(input)),
        ),
        image: mutation(
          {
            description:
              "Overlay a front image (logo) on a background image. position is a corner code such as br; image_max_width and image_max_height limit the overlay size in pixels (as strings).",
            input: object({
              project_id: ProjectId,
              background_image_url: ImageUrl,
              front_image_url: ImageUrl,
              position: string().optional(),
              image_max_width: string().optional(),
              image_max_height: string().optional(),
            }),
          },
          async (_ctx, input) => call("/add-watermark-image", keep(input)),
        ),
      },
      { title: "Watermark", description: "Add text or image watermarks." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { picnie: picnie.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.picnie ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal), uploader(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Picnie",
        description:
          "Generate images and PDFs from Picnie templates, process images (resize, crop, compress, convert, filter, watermark, background removal, OCR) and manage projects.",
        icons,
      },
    ),
  }),
);
