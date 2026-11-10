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

const captions = defineProvider({
  name: "Captions",
  hosts: ["api.mirage.app"],
  auth: {
    apiKey: secrets({
      label: "Mirage API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.mirage.app/v1/avatars?limit=1", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Captions rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { captions: captions.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.captions ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Captions",
        description:
          "Captions (Mirage API): add styled captions to videos, generate AI avatar and creator videos, text-to-speech, and browse avatars, voices and caption templates.",
        icons,
      },
    ),
  }),
);
