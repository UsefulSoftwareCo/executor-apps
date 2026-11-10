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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const imagerouter = defineProvider({
  name: "ImageRouter",
  hosts: ["api.imagerouter.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.imagerouter.io/v1/credits", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // GET /v1/credits: the spec marks all three fields as required strings.
    await decodeJson(
      response,
      object({ remaining_credits: string(), credit_usage: string(), total_deposits: string() }),
    );
  },
});

const post = async (
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  token: string,
  path: string,
  body: unknown,
) =>
  decodeJson(
    await fetch(`https://api.imagerouter.io${path}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
    json(),
  );

const Message = object({ role: string(), content: json().optional() });

// The spec declares text/event-stream for these two operations, so the generator drops them.
// These tools call them with stream=false, which returns plain JSON.
const custom = (account: { fields: { token: string } }, signal: AbortSignal) =>
  router({
    chatCompletions: mutation(
      {
        description:
          "OpenAI-compatible Chat Completions for text (LLM) models (POST /v1/openai/chat/completions). Always non-streaming. Billed on true cost.",
        input: object({
          model: string({ minLength: 1 }),
          messages: array(Message),
          temperature: number().optional(),
          max_tokens: number().optional(),
          tools: json().optional(),
          tool_choice: json().optional(),
          response_format: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        post(fetch, signal, account.fields.token, "/v1/openai/chat/completions", { ...input, stream: false }),
    ),
    responses: mutation(
      {
        description:
          "OpenAI-compatible Responses API for text (LLM) models (POST /v1/openai/responses). Always non-streaming. `input` is a string or an array of {role, content}. Billed on true cost.",
        input: object({
          model: string({ minLength: 1 }),
          input: json(),
          instructions: string().optional(),
          temperature: number().optional(),
          max_output_tokens: number().optional(),
          tools: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        post(fetch, signal, account.fields.token, "/v1/openai/responses", { ...input, stream: false }),
    ),
  });

export default defineApp(
  { user: { accounts: { imagerouter: imagerouter.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.imagerouter ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        custom: await accountRouter(user?.accounts.imagerouter ?? [], (account) => custom(account, signal), { signal }),
      },
      {
        title: "ImageRouter",
        description: "Generate images, videos and text with ImageRouter: image and video generation, image edits, chat, responses, models and credits.",
        icons,
      },
    ),
  }),
);
