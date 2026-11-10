import {
  accountRouter,
  array,
  decodeJson,
  type Infer,
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

const base = "https://deep-image.ai/rest_api";

const deepimage = defineProvider({
  name: "Deep Image",
  hosts: ["deep-image.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /me returns the profile and credit balance.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me`, { signal, headers: { "x-api-key": account.fields.token } });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "DELETE", path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        "x-api-key": token,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const sizeNote = 'width and height are pixels (500) or a percentage string ("200%" upscales by 2).';

const processInput = object({
  url: string({ minLength: 1 }),
  width: json().optional(),
  height: json().optional(),
  minLength: number().optional(),
  padding: json().optional(),
  fit: json().optional(),
  enhancements: array(string()).optional(),
  background: json().optional(),
  preset: string().optional(),
  outputFormat: string().optional(),
  maxFileSize: string().optional(),
  quality: number().optional(),
  printSize: string().optional(),
  dpi: number().optional(),
  parameters: json().optional(),
});

const processDescription = (lead: string) =>
  `${lead} url is a public image URL, a base64-encoded image, or a storage:// URL. ${sizeNote} ` +
  `enhancements is a list of denoise, deblur, clean, face_enhance, light, color, white_balance, exposure_correction. ` +
  `background is an object such as { remove: "auto"|"human"|"item", color: "white", replace: <image url>, generate: { description, adapter_type } }. ` +
  `fit is "canvas", "crop", "bounds", "cover" or { crop: "item"|"content"|"center" }. preset is real_estate, real_estate_upscaled, ecommerce or ecommerce_upscaled. ` +
  `outputFormat is jpeg, jpg, png or webp. parameters merges extra raw request fields, such as denoise_parameters, deblur_parameters, light_parameters, color_parameters, white_balance_parameters, print_reorientation or target (a storage:// URL). Consumes credits.`;

function payload(input: Infer<typeof processInput>) {
  const { url, minLength, outputFormat, maxFileSize, printSize, parameters, ...rest } = input;
  const body: Record<string, unknown> = {
    ...(parameters !== null && typeof parameters === "object" && !Array.isArray(parameters) ? parameters : {}),
    url,
    min_length: minLength,
    output_format: outputFormat,
    max_file_size: maxFileSize,
    print_size: printSize,
    ...rest,
  };
  for (const key of Object.keys(body)) if (body[key] === undefined) delete body[key];
  return body;
}

function build(call: ReturnType<typeof client>) {
  return router({
    getAccount: query(
      {
        description: "Get the authenticated account: credit balance, username, email, language, webhook settings and billing address.",
        input: object({}),
      },
      async () => call("GET", "/me"),
    ),
    processImage: mutation(
      {
        description: processDescription(
          "Process an image and wait for it: upscale, enhance, resize, remove or replace the background, or generate a new one. Returns result_url if it finishes within 25 seconds, otherwise a job id to pass to getResult.",
        ),
        input: processInput,
      },
      async (_ctx, input) => call("POST", "/process_result", payload(input)),
    ),
    scheduleImageProcessing: mutation(
      {
        description: processDescription(
          "Queue an image processing job without waiting. Returns a job id; poll it with getResult.",
        ),
        input: processInput,
      },
      async (_ctx, input) => call("POST", "/process", payload(input)),
    ),
    getResult: query(
      {
        description:
          "Get a processing job by id. status is received, not_started, in_progress or complete; result_url is present when complete.",
        input: object({ job: string({ minLength: 1 }) }),
      },
      async (_ctx, { job }) => call("GET", `/result/${encodeURIComponent(job)}`),
    ),
    deleteResult: mutation(
      {
        description: "Delete a processing job's stored result image by job id.",
        input: object({ job: string({ minLength: 1 }) }),
      },
      async (_ctx, { job }) => call("DELETE", `/result/${encodeURIComponent(job)}`),
    ),
  });
}

export default defineApp(
  { user: { accounts: { deepimage: deepimage.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.deepimage ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Deep Image",
        description: "Upscale, enhance, resize and re-background images with Deep Image, and check jobs and credits.",
        icons,
      },
    ),
  }),
);
