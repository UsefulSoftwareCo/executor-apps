import {
  accountRouter,
  array,
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

const cambai = defineProvider({
  name: "CAMB.AI",
  hosts: ["client.camb.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://client.camb.ai/apis/list-voices", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`CAMB.AI rejected the API key (${response.status})`);
    // list-voices returns a JSON array of voices (ListVoice); VoiceItem declares no required fields.
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { cambai: cambai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cambai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CAMB.AI",
        description:
          "Dub, transcribe, translate and synthesize speech with CAMB.AI: text-to-speech, voices, dubbing, subtitles, stories, translation and sound effects.",
        icons,
      },
    ),
  }),
);
