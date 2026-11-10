import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  assistantControlOptions,
  assistantDataOptions,
  apiVersion,
  controlOptions,
  dataOptions,
  inferenceOptions,
} from "./openapi.js";


// Index and assistant hosts are returned by describe_index / get_assistant, for example
// "docs-example-abc1234.svc.aped-4627-b74a.pinecone.io" (index) or "prod-1-data.ke.pinecone.io" (assistant).
// The provider declares no `hosts`: the environment segment is open-ended (region names such as us-east1-aws
// and opaque ids such as aped-4627-b74a) and `*.` matches only one subdomain level, so no fixed pattern list
// can cover every index. The credential is instead confined here: the host must be a subdomain of
// pinecone.io, and each mount pins its origin with allowedOrigin.
function pineconeHost(value: string, label: string) {
  const host = value.trim().replace(/^https:\/\//, "").replace(/\/+$/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.pinecone\.io$/i.test(host)) {
    throw new Error(`Enter the ${label} host exactly as Pinecone returns it, for example my-index-abc123.svc.pinecone.io.`);
  }
  return `https://${host.toLowerCase()}`;
}

const pinecone = defineProvider({
  name: "Pinecone",
  auth: {
    // Control plane, Inference and Assistant management only.
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // Adds the data plane of one index (vectors, namespaces and aliases, documents, bulk imports, search).
    index: secrets({
      label: "API key and index host",
      fields: object({ apiKey: string({ minLength: 1 }), indexHost: plain(string({ minLength: 1 })) }),
    }),
    // Adds the data plane of one assistant (files, context).
    assistant: secrets({
      label: "API key and assistant host",
      fields: object({ apiKey: string({ minLength: 1 }), assistantHost: plain(string({ minLength: 1 })) }),
    }),
  },
  // Listing indexes works with any project API key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.pinecone.io/indexes", {
      signal,
      headers: { "Api-Key": account.fields.apiKey, "X-Pinecone-Api-Version": apiVersion },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { pinecone: pinecone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pinecone ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">, base?: string) =>
            approve(
              liveOpenapiRouter({
                ...options,
                ...(base === undefined ? {} : { allowedOrigin: new URL(base).origin, baseUrl: base }),
                cache,
                fetch,
                signal,
                account,
                parameterDefaults: { headers: { "X-Pinecone-Api-Version": apiVersion } },
              }),
            );
          const control = {
            indexes: mount(controlOptions),
            inference: mount(inferenceOptions),
            assistants: mount(assistantControlOptions),
          };
          if (account.method === "index") {
            return router(
              { ...control, data: mount(dataOptions, pineconeHost(account.fields.indexHost, "index")) },
              { title: "Pinecone", description: "Pinecone project." },
            );
          }
          if (account.method === "assistant") {
            return router(
              {
                ...control,
                assistantData: mount(assistantDataOptions, pineconeHost(account.fields.assistantHost, "assistant")),
              },
              { title: "Pinecone", description: "Pinecone project." },
            );
          }
          return router(control, { title: "Pinecone", description: "Pinecone project." });
        },
        { signal },
      ),
      {
        title: "Pinecone",
        description:
          "Pinecone vector database. indexes: indexes, collections, backups, restore jobs. inference: embeddings, reranking, models. assistants: create and manage Assistants. data (index accounts): upsert, query, fetch, delete vectors, namespaces and aliases, documents, bulk imports, integrated-embedding search. assistantData (assistant accounts): files, context (streaming chat is not exposed).",
        instructions:
          "The data plane is per index and the assistant data plane is per assistant. Connect an account with the 'API key and index host' (or assistant host) method, using the host returned by describe_index or get_assistant, to use those tools; connect one account per index.",
        icons,
      },
    ),
  }),
);
