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
import { options } from "./openapi.js";

const elevenlabs = defineProvider({
  name: "ElevenLabs",
  hosts: ["api.elevenlabs.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      signal,
      headers: { "xi-api-key": account.fields.token },
    });
    await decodeJson(response, object({ user_id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { elevenlabs: elevenlabs.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.elevenlabs ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ElevenLabs",
        description: "ElevenLabs AI audio: text to speech, speech to text, voices, dubbing, sound effects, music, conversational agents and workspace management.",
        icons,
      },
    ),
  }),
);
