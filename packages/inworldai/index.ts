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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.inworld.ai";

const inworld = defineProvider({
  name: "Inworld AI",
  hosts: ["api.inworld.ai"],
  auth: {
    // The workspace API key is shown in Portal as one Base64 credential (base64(key_id:secret)).
    // It is sent unchanged as `Authorization: Basic <credential>`.
    apiKey: secrets({
      label: "API key (Base64 credential)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/tts/v1/voices?filter=language%3Den`, {
      signal,
      headers: { Authorization: `Basic ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const inworldTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: `Basic ${account.fields.token}`, Accept: "application/json" };
  const jsonHeaders = { ...headers, "content-type": "application/json" };
  const get = (path: string, params: Record<string, string | number | undefined> = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers }), json());
  const send = (method: string, path: string, body?: unknown) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(
        await fetch(`${base}${path}`, {
          method,
          signal,
          headers: jsonHeaders,
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
        json(),
      );
  const id = (value: string) => encodeURIComponent(value);

  return router({
    // Text-to-speech
    listTtsVoices: query(
      {
        description:
          "List the voices usable for speech synthesis (system voices and your custom voices). Optional language is an ISO 639-1 code such as en.",
        input: object({ language: string().optional() }),
      },
      async (ctx, { language }) => get("/tts/v1/voices", { filter: language === undefined ? undefined : `language=${language}` })(ctx),
    ),
    synthesizeSpeech: mutation(
      {
        description:
          "Synthesize speech from text (POST /tts/v1/voice). Body: {text (max 2000 chars), voiceId, modelId (inworld-tts-2 or inworld-tts-2-flash), audioConfig?: {audioEncoding: MP3|LINEAR16|OGG_OPUS|WAV|FLAC|PCM|ALAW|MULAW, sampleRateHertz?, speakingRate?}, language?, deliveryMode?: STABLE|BALANCED|CREATIVE, instruction?}. Returns JSON with base64 audioContent and usage; it bills characters.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/tts/v1/voice", body)(ctx),
    ),
    synthesizeSpeechAsync: mutation(
      {
        description:
          "Start an async long-text synthesis job (POST /tts/v1/voice:synthesizeAsync, Preview, up to 100,000 characters). Body as in synthesizeSpeech. Returns a long-running operation; poll it with getOperation.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/tts/v1/voice:synthesizeAsync", body)(ctx),
    ),
    synthesizeSpeechBatch: mutation(
      {
        description:
          "Start a batch synthesis job of many independent requests (POST /tts/v1/voice:synthesizeBatch, Preview). Returns a long-running operation; poll it with getOperation.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/tts/v1/voice:synthesizeBatch", body)(ctx),
    ),
    getOperation: query(
      {
        description:
          "Get an async or batch synthesis operation (GET /lro/v1alpha/{name}). name is the operation name returned when the job was started.",
        input: object({ name: string() }),
      },
      async (ctx, { name }) => get(`/lro/v1alpha/${name.split("/").map(id).join("/")}`)(ctx),
    ),

    // Voices
    listVoices: query(
      {
        description:
          "List voices in your voice library (GET /voices/v1/voices). filter is an AIP-160 expression, for example owned = \"true\", source = \"IVC\", gender = \"female\" or community = \"true\" for community voices.",
        input: object({ filter: string().optional() }),
      },
      async (ctx, { filter }) => get("/voices/v1/voices", { filter })(ctx),
    ),
    getVoice: query(
      {
        description: "Get one voice by id (voiceId format {workspace}__{voice} for custom voices).",
        input: object({ voiceId: string() }),
      },
      async (ctx, { voiceId }) => get(`/voices/v1/voices/${id(voiceId)}`)(ctx),
    ),
    updateVoice: mutation(
      {
        description:
          "Update a custom voice (PATCH). updateMask is a comma-separated list of snake_case fields to change (display_name, description, tags, gender, age_group, categories); body holds the camelCase values.",
        input: object({ voiceId: string(), updateMask: string(), body: json() }),
        approval: always(),
      },
      async (ctx, { voiceId, updateMask, body }) =>
        send("PATCH", `/voices/v1/voices/${id(voiceId)}${search({ updateMask })}`, body)(ctx),
    ),
    deleteVoice: mutation(
      {
        description: "Permanently delete a custom voice from your workspace.",
        input: object({ voiceId: string() }),
        approval: always(),
      },
      async (ctx, { voiceId }) => send("DELETE", `/voices/v1/voices/${id(voiceId)}`)(ctx),
    ),
    cloneVoice: mutation(
      {
        description:
          "Instant voice clone from audio (POST /voices/v1/voices:clone). Body: {displayName, voiceSamples: [{audioData (base64 WAV/MP3), transcription?}], languageCode? (e.g. en-US), description?, tags?, audioProcessingConfig?: {removeBackgroundNoise}}.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/voices/v1/voices:clone", body)(ctx),
    ),
    designVoice: mutation(
      {
        description:
          "Design a voice from a text description (POST /voices/v1/voices:design). Body: {designPrompt (English, 30-1000 chars), previewText (1-30 seconds of speech), languageCode?, voiceDesignConfig?: {numberOfSamples 1-3}}. Returns draft voices to publish.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/voices/v1/voices:design", body)(ctx),
    ),
    publishVoice: mutation(
      {
        description:
          "Publish a draft designed voice into your voice library. Body: {displayName?, description?, tags?}.",
        input: object({ voiceId: string(), body: json() }),
        approval: always(),
      },
      async (ctx, { voiceId, body }) => send("POST", `/voices/v1/voices/${id(voiceId)}:publish`, body)(ctx),
    ),
    listPvcVoices: query(
      {
        description: "Beta. List professional voice clone requests.",
        input: object({ pageSize: number().optional(), pageToken: string().optional() }),
      },
      async (ctx, { pageSize, pageToken }) => get("/voices/v1/pvcVoices", { pageSize, pageToken })(ctx),
    ),
    getPvcVoice: query(
      {
        description: "Beta. Get a professional voice clone request with its samples and training state.",
        input: object({ voiceId: string() }),
      },
      async (ctx, { voiceId }) => get(`/voices/v1/pvcVoices/${id(voiceId)}`)(ctx),
    ),
    deletePvcVoice: mutation(
      {
        description: "Beta. Delete an unfinished professional voice clone request.",
        input: object({ voiceId: string() }),
        approval: always(),
      },
      async (ctx, { voiceId }) => send("DELETE", `/voices/v1/pvcVoices/${id(voiceId)}`)(ctx),
    ),

    // Speech-to-text
    transcribe: mutation(
      {
        description:
          "Transcribe audio synchronously (POST /stt/v1/transcribe, about 16 MB limit). Body: {transcribeConfig: {modelId: \"inworld/inworld-stt-1\", audioEncoding: AUTO_DETECT|LINEAR16|MP3|OGG_OPUS|FLAC|MP4|WEBM, ...}, audioData: {content: <base64 audio>}}. Bills audio time.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/stt/v1/transcribe", body)(ctx),
    ),

    // Inference
    chatCompletions: mutation(
      {
        description:
          "OpenAI-compatible chat completion through the Inworld router (POST /v1/chat/completions). Body: {model (id like openai/gpt-5.4, auto, or inworld/<router>), messages: [{role, content}], temperature?, max_tokens?, tools?, response_format?}. Do not set stream. Bills tokens.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/v1/chat/completions", body)(ctx),
    ),
    createResponse: mutation(
      {
        description:
          "Create a response in OpenAI Responses API format (POST /v1/responses) for any routed model. Do not set stream. Bills tokens.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/v1/responses", body)(ctx),
    ),
    getResponse: query(
      {
        description: "Retrieve a stored response by id.",
        input: object({ responseId: string() }),
      },
      async (ctx, { responseId }) => get(`/v1/responses/${id(responseId)}`)(ctx),
    ),
    deleteResponse: mutation(
      {
        description: "Delete a stored response by id.",
        input: object({ responseId: string() }),
        approval: always(),
      },
      async (ctx, { responseId }) => send("DELETE", `/v1/responses/${id(responseId)}`)(ctx),
    ),
    cancelResponse: mutation(
      {
        description: "Cancel an in-progress background response.",
        input: object({ responseId: string() }),
        approval: always(),
      },
      async (ctx, { responseId }) => send("POST", `/v1/responses/${id(responseId)}/cancel`, {})(ctx),
    ),
    createModeration: mutation(
      {
        description:
          "Classify text for harmful content (POST /v1/moderations, OpenAI-compatible). Body: {input: string | string[], model?}.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/v1/moderations", body)(ctx),
    ),
    createDecision: mutation(
      {
        description:
          "Preview. Get typed decisions (yes/no probabilities, picks, scores) for named questions about a state (POST /alpha/decisions).",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/alpha/decisions", body)(ctx),
    ),
    listModels: query(
      {
        description:
          "List models available through Inworld Inference (GET /llm/v1alpha/models). Filter by provider, model, or outputModalities (text, image, video, decisions, or all).",
        input: object({
          provider: string().optional(),
          model: string().optional(),
          outputModalities: string().optional(),
        }),
      },
      async (ctx, { provider, model, outputModalities }) =>
        get("/llm/v1alpha/models", { provider, model, output_modalities: outputModalities })(ctx),
    ),

    // Video
    createVideo: mutation(
      {
        description:
          "Start a video generation job from a text prompt or images (POST /v1/videos). Asynchronous and billed per second; poll with getVideo.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/v1/videos", body)(ctx),
    ),
    getVideo: query(
      { description: "Retrieve a video job by id.", input: object({ videoId: string() }) },
      async (ctx, { videoId }) => get(`/v1/videos/${id(videoId)}`)(ctx),
    ),
    listVideos: query(
      { description: "List video jobs.", input: object({}) },
      async (ctx) => get("/v1/videos")(ctx),
    ),
    cancelVideo: mutation(
      {
        description: "Cancel a video job.",
        input: object({ videoId: string() }),
        approval: always(),
      },
      async (ctx, { videoId }) => send("POST", `/v1/videos/${id(videoId)}/cancel`, {})(ctx),
    ),
    deleteVideo: mutation(
      {
        description: "Delete a video job.",
        input: object({ videoId: string() }),
        approval: always(),
      },
      async (ctx, { videoId }) => send("DELETE", `/v1/videos/${id(videoId)}`)(ctx),
    ),

    // Routers
    listRouters: query(
      {
        description: "List routers (traffic splitting and conditional routing configs).",
        input: object({ pageSize: number().optional(), pageToken: string().optional() }),
      },
      async (ctx, { pageSize, pageToken }) =>
        get("/router/v1/routers", { page_size: pageSize, page_token: pageToken })(ctx),
    ),
    getRouter: query(
      { description: "Get one router by id.", input: object({ routerId: string() }) },
      async (ctx, { routerId }) => get(`/router/v1/routers/${id(routerId)}`)(ctx),
    ),
    createRouter: mutation(
      {
        description:
          "Create a router (POST /router/v1/routers). The key needs Router write permission. See https://docs.inworld.ai/router/routing-quickstart.md for the body.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => send("POST", "/router/v1/routers", body)(ctx),
    ),
    updateRouter: mutation(
      {
        description: "Update a router (PATCH /router/v1/routers/{router_id}) with the fields in body.",
        input: object({ routerId: string(), body: json() }),
        approval: always(),
      },
      async (ctx, { routerId, body }) => send("PATCH", `/router/v1/routers/${id(routerId)}`, body)(ctx),
    ),
    deleteRouter: mutation(
      {
        description: "Delete a router.",
        input: object({ routerId: string() }),
        approval: always(),
      },
      async (ctx, { routerId }) => send("DELETE", `/router/v1/routers/${id(routerId)}`)(ctx),
    ),

    // Usage
    queryUsage: query(
      {
        description:
          "Experimental. Query metered usage records (GET /usage/v1/records). startTime inclusive and endTime exclusive, RFC 3339. granularity GRANULARITY_DAY or GRANULARITY_HOUR (ranges up to 30 days).",
        input: object({
          startTime: string(),
          endTime: string(),
          granularity: string().optional(),
        }),
      },
      async (ctx, input) => get("/usage/v1/records", input)(ctx),
    ),
  });
};

export default defineApp({ user: { accounts: { inworld: inworld.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.inworld ?? [], (account) => inworldTools(account, signal), { signal }), {
    title: "Inworld AI",
    description:
      "Inworld AI voice and inference: text-to-speech, voice cloning and design, speech-to-text, chat completions through the router, video generation, models, routers and usage.",
    icons,
  }),
}));
