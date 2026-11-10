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
import { agentOptions, options } from "./openapi.js";

const deepgram = defineProvider({
  name: "Deepgram",
  hosts: ["api.deepgram.com", "agent.deepgram.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { deepgram: deepgram.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.deepgram ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        // GET /v1/agent/settings/think/models is served only from agent.deepgram.com.
        agent: await accountRouter(
          user?.accounts.deepgram ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...agentOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Deepgram",
        description:
          "Deepgram speech AI: transcribe audio, synthesize speech, analyze text, and manage projects, keys, members, usage and billing.",
        icons,
      },
    ),
  }),
);
