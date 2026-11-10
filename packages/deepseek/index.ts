import {
  accountRouter,
  array,
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

const base = "https://api.deepseek.com";

const deepseek = defineProvider({
  name: "DeepSeek",
  hosts: ["api.deepseek.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/models`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: array(json()) }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const message = object({
  role: string(),
  // string, or an array of content parts ({type:"text"}, {type:"image_url"}, {type:"file"}) for user and tool messages; null allowed on assistant turns.
  content: json(),
  tool_call_id: string().optional(),
  tool_calls: array(json()).optional(),
  name: string().optional(),
  prefix: boolean().optional(),
  reasoning_content: string().optional(),
});

const deepseekTools = (account: Account, signal: AbortSignal) =>
  router({
    models: query(
      {
        description: "List the models available to this API key (currently deepseek-flash and deepseek-v4-pro).",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/models`, { signal, headers: headers(account) }), json()),
    ),
    balance: query(
      {
        description: "Get the account balance per currency and whether the balance is sufficient for API calls.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/user/balance`, { signal, headers: headers(account) }), json()),
    ),
    chat: router({
      completion: mutation(
        {
          description:
            "Create a (non-streaming) chat completion. model is deepseek-flash or deepseek-v4-pro. messages is the conversation with roles system, user, assistant and tool. User and tool content may be a string or an array of parts (text, image_url, file); tool messages need tool_call_id, and assistant turns that called tools carry tool_calls and may have null content. Thinking is enabled by default: set thinking { type: 'disabled' } or reasoning_effort 'none' to turn it off, and reasoning_effort (none, low, high, max; default high) to control effort. temperature has no effect in thinking mode. Optional: top_p, max_tokens, stop, user_id (letters, digits, - and _, max 512), logprobs, top_logprobs and response_format { type: 'json_object' } (then the prompt must ask for JSON). frequency_penalty and presence_penalty are no longer supported by DeepSeek and are not exposed. Streaming is not supported. Tool calling uses the tools (function definitions) and tool_choice inputs, passed through as-is.",
          input: object({
            model: string(),
            messages: array(message),
            temperature: number().optional(),
            top_p: number().optional(),
            max_tokens: number().optional(),
            stop: array(string()).optional(),
            thinking: object({ type: string() }).optional(),
            reasoning_effort: string().optional(),
            user_id: string().optional(),
            response_format: object({ type: string() }).optional(),
            tools: array(json()).optional(),
            tool_choice: json().optional(),
            logprobs: boolean().optional(),
            top_logprobs: number().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${base}/chat/completions`, {
              method: "POST",
              signal,
              headers: { ...headers(account), "content-type": "application/json" },
              body: JSON.stringify({ ...input, stream: false }),
            }),
            json(),
          ),
      ),
    }),
    fim: router({
      completion: mutation(
        {
          description:
            "Create a fill-in-the-middle completion (beta endpoint, POST /beta/completions): the model writes the text between prompt and suffix. model is deepseek-flash or deepseek-v4-pro. Optional: suffix, max_tokens, temperature, top_p, stop, echo (cannot be combined with suffix). frequency_penalty and presence_penalty are no longer supported by DeepSeek and are not exposed.",
          input: object({
            model: string(),
            prompt: string(),
            suffix: string().optional(),
            max_tokens: number().optional(),
            temperature: number().optional(),
            top_p: number().optional(),
            stop: array(string()).optional(),
            echo: boolean().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(
            await fetch(`${base}/beta/completions`, {
              method: "POST",
              signal,
              headers: { ...headers(account), "content-type": "application/json" },
              body: JSON.stringify({ ...input, stream: false }),
            }),
            json(),
          ),
      ),
    }),
  });

export default defineApp({ user: { accounts: { deepseek: deepseek.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.deepseek ?? [], (account) => deepseekTools(account, signal), { signal }), {
    title: "DeepSeek",
    description: "Call DeepSeek models: chat completions, fill-in-the-middle completions, list models and check account balance.",
    icons,
  }),
}));
