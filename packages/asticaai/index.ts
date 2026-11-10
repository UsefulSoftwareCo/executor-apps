import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  boolean,
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

// astica authenticates with the API key as `tkn` in every JSON request body.
const hosts = ["vision.astica.ai", "listen.astica.ai", "voice.astica.ai", "design.astica.ai", "nlp.astica.ai"];

const astica = defineProvider({
  name: "Astica AI",
  hosts,
  auth: {
    // astica has no OAuth: keys are created at https://astica.ai/api-keys/.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the account's voice clones fails with 401 on a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://voice.astica.ai/api/voice_clone_list", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tkn: account.fields.token }),
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

async function post(fetcher: Fetch, signal: AbortSignal | undefined, token: string, url: string, body: Record<string, unknown>) {
  const response = await fetcher(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, tkn: token }),
  });
  const redact = (text: string) => text.split(token).join("[REDACTED]");
  const raw = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(raw);
  } catch {
    result = undefined;
  }
  const record = result !== null && typeof result === "object" ? (result as { status?: unknown; error?: unknown }) : undefined;
  // astica documents errors as { status: "error", error } with 4xx/5xx codes, but some failures arrive as HTTP 200.
  if (!response.ok || String(record?.status).toLowerCase() === "error") {
    const message = record?.error !== undefined ? String(record.error) : raw.slice(0, 300) || "unknown error";
    throw new Error(`astica error (HTTP ${response.status}): ${redact(message)}`);
  }
  return result;
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = (url: string, body: Record<string, unknown>) => post(fetcher, signal, token, url, body);
  const clean = (body: Record<string, unknown>) => Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));

  return router({
    vision: router({
      describe: mutation(
        {
          description:
            "Analyze an image with asticaVision. input is an HTTPS image URL or base64 (PNG/JPG, up to 20MB). visionParams is a comma-separated list of: describe, describe_all, text_read (OCR), gpt, gpt_detailed, faces, objects, objects_custom, objects_color, moderate, tags, brands, celebrities, landmarks. Leave visionParams empty to run (and be billed for) all of them. modelVersion defaults to 2.5_full (the version in astica's samples).",
          input: object({
            input: string(),
            modelVersion: string().optional(),
            visionParams: string().optional(),
            gpt_prompt: string().optional(),
            prompt_length: number().optional(),
            objects_custom_kw: string().optional(),
          }),
        },
        (_ctx, args) => call("https://vision.astica.ai/describe", clean({ ...args, modelVersion: args.modelVersion ?? "2.5_full" })),
      ),
      readText: mutation(
        {
          description: "Extract text (OCR) with word and line bounding boxes from an image URL or base64 string. modelVersion defaults to 2.5_full (the version in astica's samples).",
          input: object({ input: string(), modelVersion: string().optional() }),
        },
        (_ctx, args) =>
          call("https://vision.astica.ai/describe", { input: args.input, modelVersion: args.modelVersion ?? "2.5_full", visionParams: "text_read" }),
      ),
    }),
    hearing: router({
      transcribe: mutation(
        {
          description: "Transcribe speech with asticaListen. input is an HTTPS URL to a .wav or .mp3 file, or a base64 string. modelVersion defaults to 1.0_full (the version in astica's samples). low_priority is passed through only when set; astica does not document how to poll such jobs.",
          input: object({ input: string(), modelVersion: string().optional(), low_priority: number().optional() }),
        },
        (_ctx, args) =>
          call("https://listen.astica.ai/transcribe", {
            input: args.input,
            modelVersion: args.modelVersion ?? "1.0_full",
            ...(args.low_priority === undefined ? {} : { low_priority: args.low_priority }),
          }),
      ),
    }),
    voice: router({
      listVoices: query(
        { description: "List the public text-to-speech voices.", input: object({}) },
        () => call("https://voice.astica.ai/api/voice_list", {}),
      ),
      listClones: query(
        { description: "List the account's cloned voices.", input: object({}) },
        () => call("https://voice.astica.ai/api/voice_clone_list", {}),
      ),
      textToSpeech: mutation(
        {
          description:
            "Synthesize speech (returns JSON with audio_b64, a 24 kHz mono WAV). voice prefixes pick the engine: expressive_ava, expressive_jeanne, clone_1, prog_avery, prog_lena, prog_naomi, prog_morgan, neural_jennifer. timestamps works with expressive voices only. Set low_priority true (expressive and clone voices only) for a discounted queued job: no audio is returned, instead the response has a task_id to pass to voice.getTask. prompt (about 255 characters) styles programmable voices.",
          input: object({
            text: string(),
            voice: string().optional(),
            timestamps: boolean().optional(),
            low_priority: boolean().optional(),
            prompt: string().optional(),
          }),
        },
        (_ctx, args) => call("https://voice.astica.ai/api/tts", clean({ ...args, stream: false })),
      ),
      getTask: query(
        { description: "Poll a low-priority text-to-speech task by the task_id returned from voice.textToSpeech with low_priority. Returns status pending, success (with audio_b64) or an error.", input: object({ task_id: string() }) },
        (_ctx, args) => call("https://voice.astica.ai/api/tts/task", { task_id: args.task_id }),
      ),
    }),
    design: router({
      generateImage: mutation(
        {
          description:
            "Generate a 1024x1024 image with asticaDesign from a prompt (up to 350 characters). generate_quality is high, standard, fast or faster; generate_lossless 1 returns PNG, 0 JPG. Returns the image URL in output. modelVersion defaults to 2.0_full (the version in astica's samples).",
          input: object({
            prompt: string(),
            prompt_negative: string().optional(),
            modelVersion: string().optional(),
            seed: number().optional(),
            generate_quality: string().optional(),
            generate_lossless: number().optional(),
          }),
        },
        (_ctx, args) => call("https://design.astica.ai/generate_image", clean({ ...args, modelVersion: args.modelVersion ?? "2.0_full" })),
      ),
    }),
    nlp: router({
      generate: mutation(
        {
          description: "Generate text with astica GPT-S (research-grade model). input is the prompt; token_limit caps output tokens. Only the fields you pass are sent, so astica applies its own defaults for the rest. modelVersion defaults to GPT-S2 (the version in astica's samples).",
          input: object({
            input: string(),
            instruction: string().optional(),
            modelVersion: string().optional(),
            think_pass: number().optional(),
            temperature: number().optional(),
            top_p: number().optional(),
            token_limit: number().optional(),
            stop_sequence: string().optional(),
          }),
        },
        (_ctx, args) =>
          call(
            "https://nlp.astica.ai/generate",
            clean({ ...args, modelVersion: args.modelVersion ?? "GPT-S2" }),
          ),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { astica: astica.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.astica ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Astica AI",
        description: "astica cognitive APIs: image analysis and OCR, speech to text, text to speech, image generation and GPT-S text generation.",
        icons,
      },
    ),
  }),
);
