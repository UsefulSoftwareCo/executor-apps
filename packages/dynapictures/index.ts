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
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.dynapictures.com";

const dynapictures = defineProvider({
  name: "DynaPictures",
  hosts: ["api.dynapictures.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/workspaces`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({ id: string() })));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = (body: boolean): Record<string, string> => ({
    Authorization: `Bearer ${token}`,
    ...(body ? { "Content-Type": "application/json" } : {}),
  });
  const call = async (method: string, path: string, body?: unknown) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: headers(body !== undefined),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`DynaPictures returned ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { status: response.status };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { status: response.status, body: text };
    }
  };
  return { call };
}

const enc = encodeURIComponent;
const optionalString = string().optional();

export default defineApp(
  { user: { accounts: { dynapictures: dynapictures.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dynapictures ?? [],
        (account) => {
          const { call } = client(account.fields.token, fetch, signal);
          return router({
            templates: router({
              list: query(
                {
                  description:
                    "List templates that have 'Sync to Zapier' enabled in DynaPictures. Templates without that flag are not returned; use templates.get with a known UID for any other template.",
                  input: object({}),
                },
                async () => call("GET", "/templates"),
              ),
              get: query(
                {
                  description: "Get one template by UID, including its layers and their names.",
                  input: object({ uid: string({ minLength: 1 }) }),
                },
                async (_ctx, { uid }) => call("GET", `/templates/${enc(uid)}`),
              ),
            }),
            images: router({
              generate: mutation(
                {
                  description:
                    "Generate an image from a single-page template. params is a list of layer overrides; every item requires name (the layer name), e.g. { name, text?, imageUrl?, color?, backgroundColor?, opacity?, value?, ... } where name is the layer name. format is png, jpeg, webp or avif. metadata is stored with the image. Returns JSON with the image URL.",
                  input: object({
                    templateUid: string({ minLength: 1 }),
                    params: array(record(json())),
                    format: optionalString,
                    metadata: optionalString,
                  }),
                  approval: always(),
                },
                async (_ctx, { templateUid, params, format, metadata }) =>
                  call("POST", `/designs/${enc(templateUid)}`, {
                    params,
                    responseFormat: "json",
                    ...(format ? { format } : {}),
                    ...(metadata ? { metadata } : {}),
                  }),
              ),
              generatePages: mutation(
                {
                  description:
                    "Generate a multi-page design from a template. pages is a list of { index, layers: [{ name (required), text?, imageUrl?, ... }] }. Set format to pdf for a PDF. Returns JSON with the result URL.",
                  input: object({
                    templateUid: string({ minLength: 1 }),
                    pages: array(record(json())),
                    format: optionalString,
                    metadata: optionalString,
                  }),
                  approval: always(),
                },
                async (_ctx, { templateUid, pages, format, metadata }) =>
                  call("POST", `/designs/${enc(templateUid)}`, {
                    pages,
                    responseFormat: "json",
                    ...(format ? { format } : {}),
                    ...(metadata ? { metadata } : {}),
                  }),
              ),
              delete: mutation(
                {
                  description: "Delete a generated image by its subpath, for example ff01d10f8d/9be4738250.png (the part of the image URL after /images/).",
                  input: object({ imagePath: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { imagePath }) =>
                  call("DELETE", `/images/${imagePath.split("/").map(enc).join("/")}`),
              ),
            }),
            ai: router({
              generate: mutation(
                {
                  description:
                    "Start a standalone AI image generation job (costs credits). Returns { jobUid, status: 'queued' }; poll ai.getJob. modelId is one of gemini-3.1-flash-image, nano-banana-pro, gpt-image-1-mini, gpt-image-2-low, gpt-image-2-med, gpt-image-2-high, flux-2-pro, flux-kontext, ideogram-v3-turbo, ideogram-v3-quality, qwen-image, recraft-v3. ratio is one of 1:1, 3:2, 2:3, 16:9, 9:16, 4:3, 3:4 (supported subset varies by model; default 1:1). sourceImage is an optional public image URL to edit. referenceImages is an optional list of { name, url } where name is the token used in the prompt as [name] and url is a public image URL. sourceImage plus referenceImages may total at most 6 images.",
                  input: object({
                    modelId: string({ minLength: 1 }),
                    prompt: string({ minLength: 1 }),
                    ratio: optionalString,
                    sourceImage: optionalString,
                    referenceImages: array(object({ name: string({ minLength: 1 }), url: string({ minLength: 1 }) })).optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, input) => call("POST", "/ai/generate", input),
              ),
              getJob: query(
                {
                  description: "Get the status of an AI generation job: queued, running, done or error, with resultUrl and credits when done.",
                  input: object({ jobUid: string({ minLength: 1 }) }),
                },
                async (_ctx, { jobUid }) => call("GET", `/ai/generate/${enc(jobUid)}`),
              ),
            }),
            workspaces: router({
              list: query(
                { description: "List workspaces the API key's user belongs to.", input: object({}) },
                async () => call("GET", "/workspaces"),
              ),
              create: mutation(
                {
                  description: "Create a workspace. Requires admin rights.",
                  input: object({ name: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { name }) => call("POST", "/workspaces", { name }),
              ),
              update: mutation(
                {
                  description: "Rename a workspace.",
                  input: object({ id: string({ minLength: 1 }), name: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { id, name }) => call("PUT", `/workspaces/${enc(id)}`, { name }),
              ),
              delete: mutation(
                {
                  description: "Permanently delete a workspace with its templates, media and generated images. Irreversible; requires admin rights.",
                  input: object({ id: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { id }) => call("DELETE", `/workspaces/${enc(id)}`),
              ),
            }),
            media: router({
              list: query(
                {
                  description: "List media library assets (images and folders) in a workspace, 30 per page. page is 1-based.",
                  input: object({ workspaceId: string({ minLength: 1 }), page: number().optional() }),
                },
                async (_ctx, { workspaceId, page }) =>
                  call("GET", `/media/${enc(workspaceId)}/assets${page ? `?p=${page}` : ""}`),
              ),
              get: query(
                {
                  description: "Get one media library asset.",
                  input: object({ workspaceId: string({ minLength: 1 }), assetId: string({ minLength: 1 }) }),
                },
                async (_ctx, { workspaceId, assetId }) =>
                  call("GET", `/media/${enc(workspaceId)}/assets/${enc(assetId)}`),
              ),
              delete: mutation(
                {
                  description: "Delete a media library asset.",
                  input: object({ workspaceId: string({ minLength: 1 }), assetId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { workspaceId, assetId }) =>
                  call("DELETE", `/media/${enc(workspaceId)}/assets/${enc(assetId)}`),
              ),
            }),
            webhooks: router({
              subscribe: mutation(
                {
                  description:
                    "Subscribe a URL to a template's NEW_IMAGE event; DynaPictures POSTs the image generation payload to targetUrl.",
                  input: object({ targetUrl: string({ minLength: 1 }), templateId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { targetUrl, templateId }) =>
                  call("POST", "/hooks", { targetUrl, templateId, eventType: "NEW_IMAGE" }),
              ),
              unsubscribe: mutation(
                {
                  description: "Remove a NEW_IMAGE webhook subscription (same targetUrl and templateId as subscribe).",
                  input: object({ targetUrl: string({ minLength: 1 }), templateId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { targetUrl, templateId }) =>
                  call("DELETE", "/hooks", { targetUrl, templateId, eventType: "NEW_IMAGE" }),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "DynaPictures",
        description:
          "Generate personalized images and PDFs from DynaPictures templates, run AI image generation, and manage workspaces, media assets and webhooks.",
        icons,
      },
    ),
  }),
);
