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
import { optionsFor, specs } from "./openapi.js";

const cometapi = defineProvider({
  name: "CometAPI",
  hosts: ["api.cometapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.cometapi.com/v1/models", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { cometapi: cometapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cometapi ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(specs).map(([key, path]) => [
                key,
                withApprovals(
                  liveOpenapiRouter({ ...optionsFor(path), cache, fetch, signal, account }),
                  (tool) => (tool.kind === "mutation" ? always() : undefined),
                ),
              ]),
            ),
            { title: "CometAPI", description: "CometAPI gateway." },
          ),
        { signal },
      ),
      {
        title: "CometAPI",
        description:
          "CometAPI unified AI gateway: model listing, chat completions, responses, embeddings, moderation, image, audio and video generation across providers.",
        icons,
      },
    ),
  }),
);
