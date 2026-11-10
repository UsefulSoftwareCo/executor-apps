import type { OpenapiToolNamesOptions } from "apps/openapi";

// The combined document references an AudioSetting component it does not define; the definition below is the
// one on MiniMax's music generation page. Streaming responses are dropped from the text operations because the
// compiler skips any operation that declares text/event-stream; the tools return the non-streaming response.
const audioSetting = {
  type: "object",
  description: "Audio output configuration",
  properties: {
    sample_rate: { type: "integer", description: "Sampling rate. Options: 16000, 24000, 32000, 44100." },
    bitrate: { type: "integer", description: "Bitrate. Options: 32000, 64000, 128000, 256000." },
    format: { type: "string", description: "Audio format. Options: mp3, wav, pcm.", enum: ["mp3", "wav", "pcm"] },
  },
};
const patchAudio = [{ op: "add", path: "/components/schemas/AudioSetting", value: audioSetting }] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;
const noStream = (path: string) =>
  [{ op: "remove", path: `/paths/${path}/post/responses/200/content/text~1event-stream` }] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// One MiniMax product, several official OpenAPI documents served by https://platform.minimax.io/docs.
// index.ts mounts each under its own key; all of them use the same bearer API key on api.minimax.io.
const api = (path: string, patches?: NonNullable<OpenapiToolNamesOptions["patches"]>) =>
  ({
    source: { url: `https://platform.minimax.io/docs/${path}` },
    allowedOrigin: "https://api.minimax.io",
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
      apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
    },
    methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    ...(patches ? { patches } : {}),
  }) satisfies OpenapiToolNamesOptions;

// Speech, voices, files, image, music, v1 video, video templates and legacy text chat.
export const platformOptions = api("api-reference/openapi.json", patchAudio);
// Video generation V2 (MiniMax H3): create, query, list, cancel, context IR, regeneration.
export const videoOptions = api("api-reference/video/generation/api/v2-video-generation.json");
// OpenAI-compatible Chat Completions.
export const chatOptions = api("api-reference/text/api/openapi-chat-openai.json", noStream("~1v1~1chat~1completions"));
// Anthropic-compatible Messages.
export const messagesOptions = api("api-reference/text/api/openapi-chat-anthropic.json", noStream("~1anthropic~1v1~1messages"));
// OpenAI-compatible Responses.
export const responsesOptions = api("api-reference/text/api/openapi-responses.json");
// Speech to text.
export const transcriptionOptions = api("api-reference/speech/speech-to-text/api/openapi.json");
// v1 video generation status query.
export const videoV1Options = api("api-reference/video/generation/api/openapi.json");

// scripts/tools.ts reads `options`; the platform document is the main one.
export const options = platformOptions;
