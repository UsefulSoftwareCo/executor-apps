import {
  accountRouter,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const imageApi = "https://image-api.photoroom.com";
const sdkApi = "https://sdk.photoroom.com";

const photoroom = defineProvider({
  name: "PhotoRoom",
  hosts: ["image-api.photoroom.com", "sdk.photoroom.com"],
  auth: {
    // Created in the PhotoRoom API dashboard (https://app.photoroom.com/api-dashboard); sent as x-api-key.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${imageApi}/v2/account`, {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ plan: string() }));
  },
});

type Params = Record<string, unknown>;

const Output = object({
  contentType: string(),
  bytes: number(),
  base64: string(),
});

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/^data:[^,]*,/, ""));
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function image(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PhotoRoom returned ${response.status}: ${text.slice(0, 500)}`);
  }
  const buffer = await response.arrayBuffer();
  return {
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    bytes: buffer.byteLength,
    base64: toBase64(buffer),
  };
}

function tools(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { "x-api-key": token };
  const edits =
    "Set sandbox mode by sending the API key prefixed with sandbox_ (free, watermarked output) when testing. ";
  const editParams = record(json()).optional();

  return router({
    account: query(
      {
        description: "Get the PhotoRoom account plan and remaining image credits.",
        input: object({}),
      },
      async () => decodeJson(await fetcher(`${imageApi}/v2/account`, { signal, headers }), json()),
    ),
    edit: router(
      {
        fromUrl: mutation(
          {
            description:
              "Image Editing API v2 (Plus plan) from a public image URL: background removal (default), static or AI backgrounds, shadows, relighting, text removal, upscaling, outlines, padding and output size. Pass options in params using the API's dot-notation names, for example {\"removeBackground\": true, \"background.color\": \"FFFFFF\", \"outputSize\": \"1000x1000\", \"shadow.mode\": \"ai.soft\", \"export.format\": \"jpeg\"}. Returns the edited image as base64. Consumes credits.",
            input: object({ imageUrl: string({ minLength: 1 }), params: editParams }),
            output: Output,
          },
          async (_ctx, { imageUrl, params }) => {
            const url = new URL(`${imageApi}/v2/edit`);
            url.searchParams.set("imageUrl", imageUrl);
            for (const [key, value] of Object.entries((params as Params | undefined) ?? {})) {
              if (value === undefined || value === null) continue;
              url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
            }
            return image(await fetcher(url.toString(), { signal, headers }));
          },
        ),
        fromFile: mutation(
          {
            description:
              "Image Editing API v2 (Plus plan) from a base64-encoded image (multipart POST). Same options as edit.fromUrl, passed in params with dot-notation names (string values; nested objects are JSON-encoded). Returns the edited image as base64. Consumes credits.",
            input: object({ imageBase64: string({ minLength: 1 }), params: editParams }),
            output: Output,
          },
          async (_ctx, { imageBase64, params }) => {
            const form = new FormData();
            form.set("imageFile", new Blob([fromBase64(imageBase64)]), "image");
            for (const [key, value] of Object.entries((params as Params | undefined) ?? {})) {
              if (value === undefined || value === null) continue;
              form.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
            }
            return image(await fetcher(`${imageApi}/v2/edit`, { method: "POST", signal, headers, body: form }));
          },
        ),
      },
      { title: "Image editing", description: edits },
    ),
    removeBackground: mutation(
      {
        description:
          "Remove Background API (Basic plan, POST /v1/segment) for a base64-encoded image. Optional params: format (png|jpg|webp), channels (rgba|alpha), bg_color, size (preview|medium|hd|full), crop (true|false), despill (true|false). Returns the result as base64. Consumes credits.",
        input: object({ imageBase64: string({ minLength: 1 }), params: editParams }),
        output: Output,
      },
      async (_ctx, { imageBase64, params }) => {
        const form = new FormData();
        form.set("image_file", new Blob([fromBase64(imageBase64)]), "image");
        for (const [key, value] of Object.entries((params as Params | undefined) ?? {})) {
          if (value !== undefined && value !== null) form.set(key, String(value));
        }
        return image(await fetcher(`${sdkApi}/v1/segment`, { method: "POST", signal, headers, body: form }));
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { photoroom: photoroom.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.photoroom ?? [],
        (account) =>
          withApprovals(tools(account.fields.token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "PhotoRoom",
        description:
          "Edit images with PhotoRoom: background removal, AI backgrounds, shadows, relighting, upscaling, virtual models and account credit usage.",
        icons,
      },
    ),
  }),
);
