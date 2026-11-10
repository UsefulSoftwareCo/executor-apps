import {
  accountRouter,
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

const base = "https://api.slazzer.com/v2.0";

const slazzer = defineProvider({
  name: "Slazzer",
  hosts: ["api.slazzer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reading the credit balance is free and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account`, {
      signal,
      headers: { "API-KEY": account.fields.token },
    });
    await decodeJson(response, object({ total_credits: number() }));
  },
});

type Account = { fields: { token: string } };

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

// Every image endpoint answers with raw image bytes, or JSON `{ error }` with a 4xx status.
const result = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slazzer ${response.status}: ${text}`);
  }
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { contentType, sizeBytes: bytes.length, base64: toBase64(bytes) };
};

const imageBlob = (base64: string) => {
  const raw = base64.replace(/^data:[^;]*;base64,/, "");
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: raw.startsWith("iVBOR") ? "image/png" : "image/jpeg" });
};

const send = async (
  fetch: typeof globalThis.fetch,
  account: Account,
  signal: AbortSignal,
  path: string,
  fields: Record<string, string | number | boolean | undefined>,
  files: Record<string, string | undefined> = {},
) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.set(key, String(value));
  for (const [key, value] of Object.entries(files))
    if (value !== undefined) form.set(key, imageBlob(value), key.includes("source") ? "source.png" : "background.png");
  return result(
    await fetch(`${base}/${path}`, { method: "POST", signal, headers: { "API-KEY": account.fields.token }, body: form }),
  );
};

const image = "Base64-encoded PNG or JPEG (a data: URI prefix is accepted).";
const output = "Returns { contentType, sizeBytes, base64 } for the processed image.";

const slazzerTools = (account: Account, signal: AbortSignal) =>
  router({
    credits: query(
      {
        description:
          "Get the remaining credit balance: subscription_plan_credits, topup_plan_credits, earn_credits and total_credits.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(
          await fetch(`${base}/account`, {
            signal,
            headers: { "API-KEY": account.fields.token },
          }),
          json(),
        ),
    ),
    removeBackground: mutation(
      {
        description: `Remove the background of an image (1 credit, or 0.20 with preview). Give exactly one of sourceImageUrl (publicly reachable) or sourceImageBase64. ${image} Optionally replace the background with one of bgColorCode (hex including #), bgImageUrl or bgImageBase64. format is png (default), jpg or zip (color image plus alpha matte). crop trims transparent borders (cropMargin: px or %, 1, 2 or 4 values). scale is 10%-100% and position needs scale. preview=true returns about 0.25 MP. channel is rgba or alpha. roi is top-left and bottom-right coordinates. carShadow adds a shadow to cars. ${output}`,
        input: object({
          sourceImageUrl: string().optional(),
          sourceImageBase64: string().optional(),
          bgColorCode: string().optional(),
          bgImageUrl: string().optional(),
          bgImageBase64: string().optional(),
          format: string().optional(),
          crop: boolean().optional(),
          cropMargin: string().optional(),
          scale: string().optional(),
          position: string().optional(),
          preview: boolean().optional(),
          channel: string().optional(),
          roi: string().optional(),
          carShadow: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, i) =>
        send(
          fetch,
          account,
          signal,
          "remove_image_background",
          {
            source_image_url: i.sourceImageUrl,
            bg_color_code: i.bgColorCode,
            bg_image_url: i.bgImageUrl,
            format: i.format,
            crop: i.crop,
            crop_margin: i.cropMargin,
            scale: i.scale,
            position: i.position,
            preview: i.preview,
            channel: i.channel,
            roi: i.roi,
            car_shadow: i.carShadow,
          },
          { source_image_file: i.sourceImageBase64, bg_image_file: i.bgImageBase64 },
        ),
    ),
    automobile: mutation(
      {
        description: `Remove the background of a car photo and optionally set a new one (1 credit, 0.20 with preview). Give exactly one of sourceImageUrl or sourceImageBase64. ${image} Background options as in removeBackground (bgColorCode, bgImageUrl, bgImageBase64), plus format, crop, cropMargin, scale, position, preview, channel, carShadow, carNumberPlateImageBase64 (image overlaid on a detected plate) and carNumberPlateSeg (return the plate mask). ${output}`,
        input: object({
          sourceImageUrl: string().optional(),
          sourceImageBase64: string().optional(),
          bgColorCode: string().optional(),
          bgImageUrl: string().optional(),
          bgImageBase64: string().optional(),
          format: string().optional(),
          crop: boolean().optional(),
          cropMargin: string().optional(),
          scale: string().optional(),
          position: string().optional(),
          preview: boolean().optional(),
          channel: string().optional(),
          carShadow: boolean().optional(),
          carNumberPlateImageBase64: string().optional(),
          carNumberPlateSeg: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, i) =>
        send(
          fetch,
          account,
          signal,
          "automobile",
          {
            source_image_url: i.sourceImageUrl,
            bg_color_code: i.bgColorCode,
            bg_image_url: i.bgImageUrl,
            format: i.format,
            crop: i.crop,
            crop_margin: i.cropMargin,
            scale: i.scale,
            position: i.position,
            preview: i.preview,
            channel: i.channel,
            car_shadow: i.carShadow,
            car_number_plate_seg: i.carNumberPlateSeg,
          },
          {
            source_image_file: i.sourceImageBase64,
            bg_image_file: i.bgImageBase64,
            car_number_plate_image: i.carNumberPlateImageBase64,
          },
        ),
    ),
    upscale: mutation(
      {
        description: `Upscale an image. scale is "2" (default, 0.5 credit) or "4" (1 credit). imageBase64: ${image} ${output}`,
        input: object({ imageBase64: string(), scale: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, i) => send(fetch, account, signal, "upscale", { scale: i.scale }, { source_image_file: i.imageBase64 }),
    ),
    colorEnhance: mutation(
      {
        description: `Improve color vibrancy, contrast and quality of an image (1 credit). imageBase64: ${image} ${output}`,
        input: object({ imageBase64: string() }),
        approval: always(),
      },
      async ({ fetch }, i) => send(fetch, account, signal, "color_enhance", {}, { source_image_file: i.imageBase64 }),
    ),
    colorize: mutation(
      {
        description: `Colorize a black-and-white or old photo (De-oldify, 1 credit). renderFactor is 7-40 (default 20): higher is more detailed and slower. imageBase64: ${image} ${output}`,
        input: object({ imageBase64: string(), renderFactor: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, i) =>
        send(fetch, account, signal, "de-oldify", { render_factor: i.renderFactor }, { source_image_file: i.imageBase64 }),
    ),
    relight: mutation(
      {
        description: `Relight an image (1 credit). brightnessFactor is 1.0-2.0 (default 1.15). imageBase64: ${image} ${output}`,
        input: object({ imageBase64: string(), brightnessFactor: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, i) =>
        send(
          fetch,
          account,
          signal,
          "ai-relighting",
          { brightness_factor: i.brightnessFactor },
          { source_image_file: i.imageBase64 },
        ),
    ),
    addShadow: mutation(
      {
        description: `Add an AI shadow to a product image (0.20 credit). lightSourcePos is left (default), top, long (sunset) or short (noon). bgColor is 0xRRGGBB (default 0xFFFFFF). shadowOpacity is 0.1-1 (default 0.5). imageBase64: ${image} ${output}`,
        input: object({
          imageBase64: string(),
          lightSourcePos: string().optional(),
          bgColor: string().optional(),
          shadowOpacity: number().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, i) =>
        send(
          fetch,
          account,
          signal,
          "ai_shadow",
          { light_source_pos: i.lightSourcePos ?? "left", bg_color: i.bgColor, shadow_opacity: i.shadowOpacity },
          { source_image_file: i.imageBase64 },
        ),
    ),
    skyReplacement: mutation(
      {
        description: `Replace the sky in a photo. Provide bgImageBase64 (a sky image, resized to fit) or bgColorCode (hex including #). imageBase64: ${image} ${output}`,
        input: object({
          imageBase64: string(),
          bgImageBase64: string().optional(),
          bgColorCode: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, i) => {
        if (i.bgImageBase64 === undefined && i.bgColorCode === undefined)
          throw new Error("skyReplacement requires bgImageBase64 or bgColorCode");
        return send(
          fetch,
          account,
          signal,
          "sky_replacement",
          { bg_color_code: i.bgColorCode },
          { source_image_file: i.imageBase64, bg_image_file: i.bgImageBase64 },
        );
      },
    ),
    catalogueImage: mutation(
      {
        description: `Generate a catalogue-ready product image (0.50 credit). category is grocery, food or furniture; furniture requires textPrompt describing the scene. scalingMode is fit (default) or fill. Optional bgColorCode (hex including #), bgImageBase64, referenceType (subject or original), padding (for example 10% or "10px, 15px, 20px, 25px", max 49%), textPrompt (AI background scene), seed, relighting and canvasSize (WIDTHxHEIGHT). imageBase64: ${image} ${output}`,
        input: object({
          category: string(),
          imageBase64: string(),
          scalingMode: string().optional(),
          bgColorCode: string().optional(),
          bgImageBase64: string().optional(),
          referenceType: string().optional(),
          padding: string().optional(),
          textPrompt: string().optional(),
          seed: number().optional(),
          relighting: boolean().optional(),
          canvasSize: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, i) => {
        if (i.category !== "grocery" && i.category !== "food" && i.category !== "furniture")
          throw new Error("category must be grocery, food or furniture");
        if (i.category === "furniture" && !i.textPrompt) throw new Error("furniture requires textPrompt");
        return send(
          fetch,
          account,
          signal,
          i.category,
          {
            scaling_mode: i.scalingMode ?? "fit",
            bg_color_code: i.bgColorCode,
            reference_type: i.referenceType,
            padding: i.padding,
            text_prompt: i.textPrompt,
            seed: i.seed,
            relighting: i.relighting,
            canvas_size: i.canvasSize,
          },
          { source_image_file: i.imageBase64, bg_image: i.bgImageBase64 },
        );
      },
    ),
  });

export default defineApp({ user: { accounts: { slazzer: slazzer.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.slazzer ?? [], (account) => slazzerTools(account, signal), { signal }), {
    title: "Slazzer",
    description:
      "AI image processing with Slazzer: background removal, automobile, upscale, color enhance, colorize, relighting, shadows, sky replacement and catalogue images.",
    icons,
  }),
}));
