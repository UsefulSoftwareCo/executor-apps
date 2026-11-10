import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  chatOptions,
  messagesOptions,
  platformOptions,
  responsesOptions,
  transcriptionOptions,
  videoOptions,
  videoV1Options,
} from "./openapi.js";

const minimax = defineProvider({
  name: "MiniMax",
  hosts: ["api.minimax.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // POST /v1/get_voice is a documented read-only call. Its response schema has no required fields, so
    // decodeJson (which rejects non-2xx statuses) is the real check; the decoded shape asserts nothing.
    const response = await fetch("https://api.minimax.io/v1/get_voice", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voice_type: "system_voice" }),
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { minimax: minimax.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.minimax ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer T ? Omit<T & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              platform: mount(platformOptions),
              video: mount(videoOptions),
              videoV1: mount(videoV1Options),
              chat: mount(chatOptions),
              messages: mount(messagesOptions),
              responses: mount(responsesOptions),
              transcription: mount(transcriptionOptions),
            },
            { title: "MiniMax", description: "MiniMax API." },
          );
        },
        { signal },
      ),
      {
        title: "MiniMax",
        description:
          "MiniMax. platform: text-to-speech, async TTS, voice cloning and design, voices, image and music generation, v1 video, files. video: video generation V2 (H3). chat, messages, responses: OpenAI- and Anthropic-compatible text models. transcription: speech to text.",
        icons,
      },
    ),
  }),
);
