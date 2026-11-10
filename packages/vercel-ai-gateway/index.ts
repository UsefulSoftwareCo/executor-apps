import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://ai-gateway.vercel.sh";
const base = `${origin}/v1`;

const gateway = defineProvider({
  name: "Vercel AI Gateway",
  hosts: ["ai-gateway.vercel.sh"],
  auth: {
    apiKey: secrets({
      label: "AI Gateway API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /models is public, so the credits endpoint is the cheapest authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ balance: string(), total_used: string() }));
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const gatewayTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" };
  const post = (path: string, extra?: Record<string, string>, root: string = base) => async ({ fetch }: { fetch: typeof globalThis.fetch }, body: unknown) => {
    if (typeof body === "object" && body !== null && (body as { stream?: unknown }).stream === true) {
      throw new Error("Streaming is not supported by this tool: remove `stream: true` from body.");
    }
    return decodeJson(
      await fetch(`${root}${path}`, { method: "POST", signal, headers: { ...headers, ...extra }, body: JSON.stringify(body) }),
      json(),
    );
  };
  return router({
    listModels: query(
      {
        description:
          "List every model available through the gateway with id, name, type (language, embedding, reranking, image, video), context window, max output tokens, capability tags and pricing per token. Set includeAvailability to annotate each model with whether your team can use it.",
        input: object({ includeAvailability: boolean().optional() }),
      },
      async ({ fetch }, { includeAvailability }) =>
        decodeJson(
          await fetch(`${base}/models${includeAvailability === true ? "?include_availability" : ""}`, { signal, headers }),
          json(),
        ),
    ),
    getModelEndpoints: query(
      {
        description:
          "List every provider endpoint serving one model, with per-endpoint pricing, supported parameters, uptime, latency and throughput. creator and model are the two halves of the model id, for example creator 'anthropic' and model 'claude-sonnet-5'.",
        input: object({ creator: string(), model: string() }),
      },
      async ({ fetch }, { creator, model }) =>
        decodeJson(
          await fetch(`${base}/models/${encodeURIComponent(creator)}/${encodeURIComponent(model)}/endpoints`, { signal, headers }),
          json(),
        ),
    ),
    getCredits: query(
      {
        description: "Get the team's remaining AI Gateway Credits balance and lifetime spend, in USD.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/credits`, { signal, headers }), json()),
    ),
    getGeneration: query(
      {
        description:
          "Look up one generation by id (gen_<ulid>, the id of a chat completion response): provider, model, cost breakdown, latency, finish reason and token counts. Usage is ingested asynchronously, so a fresh id may return 'Usage event not found' for a few seconds.",
        input: object({ id: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/generation${search(input)}`, { signal, headers }), json()),
    ),
    getReport: query(
      {
        description:
          "Query aggregated spend over an inclusive UTC date range (startDate, endDate as YYYY-MM-DD). groupBy is one of day (default), user, model, tag, provider, credential_type, zero_data_retention, api_key_name; datePart is day or hour when grouping by day. Optional filters: userId, model, provider, credentialType (byok or system), tags (comma-separated), tagsMatch (any or all), apiKeyId (stable key id, or 'self'), zeroDataRetention (boolean). Not available on Hobby or Pro-trial plans.",
        input: object({
          startDate: string(),
          endDate: string(),
          groupBy: string().optional(),
          datePart: string().optional(),
          userId: string().optional(),
          model: string().optional(),
          provider: string().optional(),
          credentialType: string().optional(),
          tags: string().optional(),
          tagsMatch: string().optional(),
          apiKeyId: string().optional(),
          zeroDataRetention: boolean().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(
            `${base}/report${search({
              start_date: input.startDate,
              end_date: input.endDate,
              group_by: input.groupBy,
              date_part: input.datePart,
              user_id: input.userId,
              model: input.model,
              provider: input.provider,
              credential_type: input.credentialType,
              tags: input.tags,
              tags_match: input.tagsMatch,
              api_key_id: input.apiKeyId,
              zero_data_retention: input.zeroDataRetention,
            })}`,
            { signal, headers },
          ),
          json(),
        ),
    ),
    chatCompletions: mutation(
      {
        description:
          "Run an OpenAI-style chat completion through the gateway. body is the request JSON: model (for example 'anthropic/claude-sonnet-5'), messages, and any of tools, response_format, temperature, max_tokens, reasoning and providerOptions. Streaming is not supported; do not set stream. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/chat/completions")(ctx, body),
    ),
    messages: mutation(
      {
        description:
          "Run an Anthropic Messages API request through the gateway. body is the request JSON: model, max_tokens, messages, and optional system, tools and thinking. Streaming is not supported. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/messages", { "anthropic-version": "2023-06-01" })(ctx, body),
    ),
    responses: mutation(
      {
        description:
          "Run an OpenAI Responses API request through the gateway. body is the request JSON: model, input, and optional instructions, tools and reasoning. Streaming is not supported. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/responses")(ctx, body),
    ),
    embeddings: mutation(
      {
        description:
          "Create vector embeddings through the gateway. body is the request JSON: model (an embedding model id from listModels), input (string or array of strings) and optional dimensions. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/embeddings")(ctx, body),
    ),
    rerank: mutation(
      {
        description:
          "Rerank documents by relevance with a Cohere-compatible reranking model (POST /v2/rerank). body is the request JSON: model (for example 'cohere/rerank-v3.5'), query, documents (array of strings) and optional top_n, max_tokens_per_doc and providerOptions. Returns results with index and relevance_score. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/v2/rerank", undefined, origin)(ctx, body),
    ),
    decisions: mutation(
      {
        description:
          "Ask typed questions about an input with a decision model (POST /v1/decisions). body is the request JSON: model (for example 'openai/gpt-6-luna-decisions'), input (string or messages) and questions, each with type predicate, choice (choices) or score (levels), instructions and optional name. Returns answers in question order. Spends credits.",
        input: object({ body: json() }),
        approval: always(),
      },
      async (ctx, { body }) => post("/decisions")(ctx, body),
    ),
    generateSpeech: mutation(
      {
        description:
          "Generate spoken audio from text (POST /v4/ai/speech-model). model is a speech model id such as 'openai/tts-1'. body is the request JSON: text and optional voice, outputFormat, instructions, speed, language. Returns audio as a base64 string plus warnings. Spends credits.",
        input: object({ model: string(), body: json() }),
        approval: always(),
      },
      async (ctx, { model, body }) =>
        post("/v4/ai/speech-model", {
          "ai-gateway-protocol-version": "0.0.1",
          "ai-speech-model-specification-version": "4",
          "ai-model-id": model,
        }, origin)(ctx, body),
    ),
    transcribe: mutation(
      {
        description:
          "Transcribe recorded audio (POST /v4/ai/transcription-model). model is a transcription model id such as 'openai/whisper-1'. body is the request JSON: audio (base64 string) and mediaType (for example 'audio/mpeg'), plus optional providerOptions. Returns text, segments, language and durationInSeconds. Spends credits.",
        input: object({ model: string(), body: json() }),
        approval: always(),
      },
      async (ctx, { model, body }) =>
        post("/v4/ai/transcription-model", {
          "ai-gateway-protocol-version": "0.0.1",
          "ai-transcription-model-specification-version": "4",
          "ai-model-id": model,
        }, origin)(ctx, body),
    ),
  });
};

export default defineApp({ user: { accounts: { vercelAiGateway: gateway.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.vercelAiGateway ?? [], (account) => gatewayTools(account, signal), { signal }), {
    title: "Vercel AI Gateway",
    description: "Discover gateway models and run chat, messages, responses, embeddings, rerank, decisions, speech and transcription requests; check credits, generations and spend.",
    icons,
  }),
}));
