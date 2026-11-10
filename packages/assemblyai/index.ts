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
import { agentsOptions, llmGatewayOptions, transcriptionOptions, webhooksOptions } from "./openapi.js";

const assemblyai = defineProvider({
  name: "AssemblyAI",
  hosts: ["api.assemblyai.com", "llm-gateway.assemblyai.com", "agents.assemblyai.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing transcripts is a read-only call that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    if (!response.ok) throw new Error(`AssemblyAI rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { assemblyai: assemblyai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.assemblyai ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0] extends infer P ? Omit<P & object, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              transcription: mount(transcriptionOptions),
              llmGateway: mount(llmGatewayOptions),
              agents: mount(agentsOptions),
              webhooks: mount(webhooksOptions),
            },
            { title: "AssemblyAI", description: "AssemblyAI account." },
          );
        },
        { signal },
      ),
      {
        title: "AssemblyAI",
        description: "AssemblyAI. transcription: submit, fetch, list and delete transcripts, upload audio, sentences, paragraphs, word search, subtitles, redacted audio. llmGateway: chat completions, audio understanding, model list. agents: Voice Agent REST (agents and sessions). webhooks: Voice Agent webhook subscriptions.",
        icons,
      },
    ),
  }),
);
