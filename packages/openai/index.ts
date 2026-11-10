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

const openai = defineProvider({
  name: "OpenAI",
  hosts: ["api.openai.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Admin keys only work on /organization/* endpoints and are rejected elsewhere.
    adminKey: secrets({
      label: "Admin API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url =
      account.method === "adminKey"
        ? "https://api.openai.com/v1/organization/users?limit=1"
        : "https://api.openai.com/v1/models";
    const response = await fetch(url, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ object: string() }));
  },
});

export default defineApp(
  { user: { accounts: { openai: openai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openai ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenAI",
        description:
          "OpenAI API: responses, chat completions, embeddings, images, audio, files, vector stores, assistants, fine-tuning, batches, models and organization administration.",
        icons,
      },
    ),
  }),
);
