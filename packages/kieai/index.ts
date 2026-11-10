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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.kie.ai";
const uploads = "https://kieai.redpandaai.co";
const docs = "https://docs.kie.ai";

const kieai = defineProvider({
  name: "Kie.ai",
  hosts: ["api.kie.ai", "kieai.redpandaai.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Kie.ai answers errors with HTTP 200 and an error `code` in the body, so check both.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/api/v1/chat/credit`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const body = await decodeJson(response, object({ code: number(), msg: string() }));
    if (body.code !== 200) throw new Error(`Kie.ai rejected the API key (${body.code}): ${body.msg}`);
  },
});

type Fetch = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checked(body: unknown): unknown {
  if (!isRecord(body) || typeof body.code !== "number") throw new Error("Kie.ai returned an unexpected response without a code");
  if (body.code !== 200) throw new Error(`Kie.ai error (${body.code}): ${String(body.msg ?? "unknown")}`);
  return body;
}

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  return {
    // Task, credit, file and download endpoints answer errors with HTTP 200 and a non-200 body `code`.
    get: async (url: string) => checked(await decodeJson(await fetcher(url, { signal, headers }), json())),
    post: async (url: string, body: unknown) =>
      checked(await decodeJson(await fetcher(url, { method: "POST", signal, headers, body: JSON.stringify(body) }), json())),
    // Chat endpoints return the native Anthropic/OpenAI format; surface errors in either shape.
    chat: async (url: string, body: unknown) => {
      const payload = isRecord(body) ? { ...body, stream: false } : body;
      const result = await decodeJson(await fetcher(url, { method: "POST", signal, headers, body: JSON.stringify(payload) }), json());
      if (isRecord(result)) {
        if (typeof result.code === "number" && result.code !== 200) {
          throw new Error(`Kie.ai error (${result.code}): ${String(result.msg ?? "unknown")}`);
        }
        if (result.error !== undefined && result.error !== null) {
          throw new Error(`Kie.ai chat error: ${JSON.stringify(result.error)}`);
        }
      }
      return result;
    },
    // Public documentation; no credentials are sent.
    text: async (url: string) => {
      const response = await fetcher(url, { signal });
      if (!response.ok) throw new Error(`${url} answered ${response.status}`);
      return response.text();
    },
  };
}

type Client = ReturnType<typeof client>;

type ModelDoc = { category: string; title: string; url: string; description: string };

// llms.txt lists "- <category> [<title>](<url>): <description>" under "## API Docs".
function parseDocsIndex(text: string): ModelDoc[] {
  const start = text.indexOf("## API Docs");
  const lines = (start < 0 ? "" : text.slice(start)).split("\n");
  const docsList: ModelDoc[] = [];
  for (const line of lines) {
    const match = /^- (.*?)\s*\[([^\]]+)\]\((https:\/\/docs\.kie\.ai\/[^)]+)\):\s*(.*)$/.exec(line);
    if (match && !match[3]!.includes("/cn/")) {
      docsList.push({ category: match[1]!, title: match[2]!, url: match[3]!, description: match[4]! });
    }
  }
  return docsList;
}

function build(call: Client) {
  return router(
    {
      credits: query(
        { description: "Get the remaining credit balance of the account.", input: object({}) },
        async () => call.get(`${api}/api/v1/chat/credit`),
      ),
      models: router(
        {
          list: query(
            {
              description:
                "List Kie.ai's documented generation endpoints (image, video, music, audio and chat models) from its public docs index. Filter with `query`, a case-insensitive substring of the category, title or description. Each entry's `url` goes to models.describe for the exact `model` id and `input` fields.",
              input: object({ query: string().optional() }),
            },
            async (_ctx, { query: filter }) => {
              const all = parseDocsIndex(await call.text(`${docs}/llms.txt`));
              const needle = filter?.toLowerCase();
              return needle
                ? all.filter((doc) => `${doc.category} ${doc.title} ${doc.description}`.toLowerCase().includes(needle))
                : all;
            },
          ),
          describe: query(
            {
              description:
                "Read one model's documentation page (Markdown with its OpenAPI request schema) so you can build the `model` and `input` for tasks.create or the chat request body. `url` is an entry's url from models.list, on https://docs.kie.ai.",
              input: object({ url: string({ minLength: 1 }) }),
            },
            async (_ctx, { url }) => {
              if (!url.startsWith(`${docs}/`) || url.includes("..")) throw new Error(`url must be a page on ${docs}`);
              const text = await call.text(url.endsWith(".md") ? url : `${url}.md`);
              return { url, truncated: text.length > 60000, content: text.slice(0, 60000) };
            },
          ),
        },
        { title: "Models", description: "Discover Kie.ai models and their request schemas from the public docs." },
      ),
      tasks: router(
        {
          create: mutation(
            {
              description:
                "Create an asynchronous generation task on any Market model: image, video, music, audio and speech models, including Veo, Kling, Runway, Suno, Seedance, Flux, Nano Banana, GPT Image and Seedream. `model` is the exact model id from the model's docs page (models.describe); `input` is the model's input object. Returns a taskId; poll tasks.get until state is success or fail. Spends credits. Optional `callBackUrl` receives a webhook when the task finishes.",
              input: object({
                model: string({ minLength: 1 }),
                input: json(),
                callBackUrl: string().optional(),
              }),
            },
            async (_ctx, { model, input, callBackUrl }) =>
              call.post(`${api}/api/v1/jobs/createTask`, { model, input, ...(callBackUrl ? { callBackUrl } : {}) }),
          ),
          get: query(
            {
              description:
                "Get the status and result of a task created with tasks.create. state is waiting, queuing, generating, success or fail. When state is success, resultJson is a JSON string with resultUrls (generated files are kept for 14 days). Long video tasks can take over 10 minutes.",
              input: object({ taskId: string({ minLength: 1 }) }),
            },
            async (_ctx, { taskId }) => call.get(`${api}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`),
          ),
        },
        { title: "Tasks", description: "Run and poll Market generation tasks (one endpoint serves every model)." },
      ),
      chat: router(
        {
          claude: mutation(
            {
              description:
                "Chat with a Claude model through the Anthropic Messages format (POST /claude/v1/messages). `body` is the request: model (for example claude-sonnet-5-5), messages, max_tokens and optional system, tools, thinking. Streaming is always disabled (stream is forced to false). Spends credits.",
              input: object({ body: json() }),
            },
            async (_ctx, { body }) => call.chat(`${api}/claude/v1/messages`, body),
          ),
          responses: mutation(
            {
              description:
                "Call a model through the OpenAI Responses format. `provider` is codex (POST /codex/v1/responses, the GPT 5.x/6 models), openai (POST /openai/v1/responses) or grok (POST /grok/v1/responses, Grok 4.x). `body` is the request: model, input and optional tools, reasoning. Streaming is always disabled (stream is forced to false). Spends credits.",
              input: object({ provider: string({ minLength: 1 }), body: json() }),
            },
            async (_ctx, { provider, body }) => {
              if (!["codex", "openai", "grok"].includes(provider)) throw new Error("provider must be codex, openai or grok");
              return call.chat(`${api}/${provider}/v1/responses`, body);
            },
          ),
          completions: mutation(
            {
              description:
                "Call a model through the OpenAI Chat Completions format. `endpoint` is the model's path segment from its docs page: gpt-5-2, gemini-2.5-pro, gemini-3-pro, gemini-3.1-pro, gemini-3-5-flash-openai, gemini-3-6-flash-openai, gemini-3-7-flash-openai or gemini-3-8-flash-openai (POST /<endpoint>/v1/chat/completions). `body` is the request: messages and optional tools. Streaming is always disabled (stream is forced to false). Spends credits.",
              input: object({ endpoint: string({ minLength: 1 }), body: json() }),
            },
            async (_ctx, { endpoint, body }) => {
              if (!/^[A-Za-z0-9.-]+$/.test(endpoint)) throw new Error("endpoint must be a model path segment such as gpt-5-2");
              return call.chat(`${api}/${endpoint}/v1/chat/completions`, body);
            },
          ),
        },
        { title: "Chat", description: "LLM chat endpoints: Claude, GPT, Gemini and Grok models behind one key." },
      ),
      omni: router(
        {
          audio: router(
            {
              create: mutation(
                {
                  description:
                    "Register a Gemini Omni voice preset (free, synchronous). `body` has audio_id (a preset such as achernar, kore, puck), name, and optional voice_description and example_dialogue. Returns data.audioId, which goes in audio_ids of Gemini Omni video models (tasks.create) and omni.character.create. See models.describe on https://docs.kie.ai/market/gemini-omni-audio.md.",
                  input: object({ body: json() }),
                },
                async (_ctx, { body }) => call.post(`${api}/api/v1/omni/audio/create`, body),
              ),
            },
            { title: "Audio", description: "Gemini Omni voice presets." },
          ),
          character: router(
            {
              create: mutation(
                {
                  description:
                    "Create a Gemini Omni character (free). `body` has descriptions, image_urls (1-2 public URLs: portrait, optional full-body) and optional audio_ids (from omni.audio.create) and character_name. Returns data.characterId. See https://docs.kie.ai/market/gemini-omni-character.md.",
                  input: object({ body: json() }),
                },
                async (_ctx, { body }) => call.post(`${api}/api/v1/omni/character/create`, body),
              ),
            },
            { title: "Character", description: "Gemini Omni characters for video models." },
          ),
        },
        { title: "Omni", description: "Gemini Omni voice and character endpoints." },
      ),
      files: router(
        {
          uploadFromUrl: mutation(
            {
              description:
                "Have Kie.ai download a public http(s) file and host it for use as a model input (images, video, audio). Files are deleted after 24 hours. `uploadPath` is the folder path on Kie.ai storage, for example images/user-uploads. Returns the hosted downloadUrl.",
              input: object({
                fileUrl: string({ minLength: 1 }),
                uploadPath: string({ minLength: 1 }),
                fileName: string().optional(),
              }),
            },
            async (_ctx, input) => call.post(`${uploads}/api/file-url-upload`, input),
          ),
          uploadBase64: mutation(
            {
              description:
                "Upload a Base64 string or data URL as a hosted file for use as a model input. Files are deleted after 24 hours. `uploadPath` is the folder path on Kie.ai storage, for example images/user-uploads. Returns the hosted downloadUrl.",
              input: object({
                base64Data: string({ minLength: 1 }),
                uploadPath: string({ minLength: 1 }),
                fileName: string().optional(),
              }),
            },
            async (_ctx, input) => call.post(`${uploads}/api/file-base64-upload`, input),
          ),
          downloadUrl: mutation(
            {
              description:
                "Turn a generated file's URL (from a task's resultUrls or audio_url) into a temporary download link valid for 20 minutes. Files uploaded with files.* are not supported.",
              input: object({ url: string({ minLength: 1 }) }),
            },
            async (_ctx, input) => call.post(`${api}/api/v1/common/download-url`, input),
          ),
        },
        { title: "Files", description: "Host input files and get download links for generated files." },
      ),
    },
  );
}

export default defineApp(
  { user: { accounts: { kieai: kieai.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kieai ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kie.ai",
        description:
          "Generate images, video, music and speech with Veo, Kling, Runway, Suno, Flux, Nano Banana, Seedance and more, and call Claude, GPT, Gemini and Grok chat models, with one Kie.ai API key and credit balance.",
        instructions:
          "Every media model uses the same two calls. Find the model with models.list, read its page with models.describe to get the exact `model` id and `input` fields, call tasks.create, then poll tasks.get until state is success or fail. Results are URLs in resultJson. Kie.ai reports errors in the body `code` with HTTP 200. Chat models are synchronous (chat.*).",
        icons,
      },
    ),
  }),
);
