import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  renameTools,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { duplicatedMcpTools, options } from "./openapi.js";

const mcpUrl = "https://mcp.edenai.run/mcp";

const edenai = defineProvider({
  name: "Eden AI",
  hosts: ["api.edenai.run", "mcp.edenai.run"],
  auth: {
    // Eden AI keys (sk-eden-...) go in a Bearer header; neither API has OAuth.
    apiKey: secrets({
      label: "Eden AI API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The MCP server answers listing without credentials and ignores a bogus key, so it cannot prove
  // a key. The REST API answers 401 to a bogus Bearer key on this endpoint.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.edenai.run/v3/models", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { edenai: edenai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.edenai ?? [],
            (account) =>
              withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          {
            title: "Eden AI API",
            description:
              "Eden AI v3 REST API: chat completions, responses, embeddings, images, speech, transcription, video, web search, moderation, files and collections.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.edenai ?? [],
            async (account) =>
              withApprovals(
                renameTools(
                  await mcpRouter({
                    url: mcpUrl,
                    account,
                    headers: { Authorization: `Bearer ${account.fields.token}` },
                    signal,
                  }),
                  (name) => (duplicatedMcpTools.has(name) ? undefined : name),
                ),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Eden AI expert models",
            description:
              "Eden AI's MCP server: OCR and document parsers, face and deepfake detection, anonymization, plagiarism, spell check, NER, topic extraction, background removal, logo and object detection, translation, web crawl, scrape and research.",
          },
        ),
      },
      {
        title: "Eden AI",
        description:
          "Run Eden AI across providers: the v3 REST API (api) plus expert-model tools such as OCR, detection and web scraping through its MCP server (mcp).",
        icons,
      },
    ),
  }),
);
