import {
  accountRouter,
  decodeJson,
  defineApp,
  boolean,
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

const jigsawstack = defineProvider({
  name: "JigsawStack",
  hosts: ["api.jigsawstack.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing prompt engine prompts is a read-only call that requires a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.jigsawstack.com/v1/prompt_engine", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

export default defineApp(
  { user: { accounts: { jigsawstack: jigsawstack.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jigsawstack ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "JigsawStack",
        description:
          "JigsawStack AI APIs: web search, scraping and deep research, OCR, speech to text and text to speech, translation, embeddings, classification, content validation, file storage and prompt engine.",
        icons,
      },
    ),
  }),
);
