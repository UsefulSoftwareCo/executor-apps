import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const queryDocument = (token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) =>
  router({
    queryDocument: mutation(
      {
        description:
          "Extract structured data from a PDF or image (PDF, JPEG, JPG, PNG) with an AgentQL query or a natural-language prompt (POST /v1/query-document). Pass the file as base64. Provide exactly one of query or prompt. mode is 'fast' (default) or 'standard'. Each image costs one API call and each PDF page costs one.",
        input: object({
          fileBase64: string({ minLength: 1 }),
          filename: string({ minLength: 1 }),
          contentType: string().optional(),
          query: string().optional(),
          prompt: string().optional(),
          mode: string().optional(),
        }),
        approval: always(),
      },
      async (_ctx, input) => {
        if ((input.query === undefined) === (input.prompt === undefined)) {
          throw new Error("Provide exactly one of query or prompt.");
        }
        const form = new FormData();
        const bytes = Uint8Array.from(atob(input.fileBase64), (char) => char.charCodeAt(0));
        form.append("file", new Blob([bytes], { type: input.contentType ?? "application/octet-stream" }), input.filename);
        form.append(
          "body",
          JSON.stringify({
            ...(input.query === undefined ? { prompt: input.prompt } : { query: input.query }),
            ...(input.mode === undefined ? {} : { params: { mode: input.mode } }),
          }),
        );
        const response = await fetcher("https://api.agentql.com/v1/query-document", {
          method: "POST",
          signal,
          headers: { "X-API-Key": token },
          body: form,
        });
        return decodeJson(response, json());
      },
    ),
  });

const agentql = defineProvider({
  name: "AgentQL",
  hosts: ["api.agentql.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.agentql.com/v1/usage", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { agentql: agentql.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.agentql ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        documents: await accountRouter(user?.accounts.agentql ?? [], (account) => queryDocument(account.fields.token, fetch, signal), { signal }),
      },
      {
        title: "AgentQL",
        description: "Extract structured data from web pages, PDFs and images with AgentQL queries or prompts, create remote browser sessions, and read usage.",
        icons,
      },
    ),
  }),
);
