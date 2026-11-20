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

const getyoutubetranscript = defineProvider({
  name: "GetYouTubeTranscript",
  hosts: ["getyoutubetranscript.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      guide: "Create a key at https://getyoutubetranscript.com/developers (keys start with `sk_live_`).",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /credits is free (it spends no credits) and always returns the plan name.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://getyoutubetranscript.com/api/v1/credits", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ data: object({ plan: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { getyoutubetranscript: getyoutubetranscript.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.getyoutubetranscript ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GetYouTubeTranscript",
        description:
          "YouTube transcripts in any caption language, YouTube search, and channel, playlist and video data.",
        icons,
      },
    ),
  }),
);
