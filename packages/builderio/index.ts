import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  oauth2,
  query,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const cmsUrl = "https://mcp.builder.io/mcp/publish";
const codeUrl = "https://mcp.builder.io/mcp/fusion";

// Both servers publish OAuth metadata with dynamic client registration; each token is bound to its
// own resource, so each server gets its own account type.
const cms = defineProvider({
  name: "Builder.io CMS",
  hosts: ["mcp.builder.io"],
  auth: { oauth: oauth2({ discover: cmsUrl }) },
  health: (check) =>
    mcpHealth(check, { url: cmsUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

const code = defineProvider({
  name: "Builder.io Code",
  hosts: ["mcp.builder.io"],
  auth: { oauth: oauth2({ discover: codeUrl }) },
  health: (check) =>
    mcpHealth(check, { url: codeUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

const contentBase = "https://cdn.builder.io/api/v3/content";
const writeBase = "https://builder.io/api/v1/write";

// Private-key access to the REST APIs. The private key is created by a Space admin under Space
// Settings > Private Keys; the public key is the Space's Public API Key (Content API requires it).
const rest = defineProvider({
  name: "Builder.io REST",
  hosts: ["builder.io", "cdn.builder.io"],
  auth: {
    privateKey: secrets({
      label: "Private key and public API key",
      fields: object({ privateKey: string({ minLength: 1 }), publicKey: string({ minLength: 1 }) }),
    }),
  },
  // Read-only: a one-entry Content API read sent with the private key. A bad key is a 4xx.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `${contentBase}/page?apiKey=${encodeURIComponent(account.fields.publicKey)}&limit=1&noTraverse=true`,
      { signal, headers: { Authorization: `Bearer ${account.fields.privateKey}` } },
    );
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

function restRouter(privateKey: string, publicKey: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${privateKey}`, "Content-Type": "application/json" };
  const send = async (method: string, url: string, body?: unknown) =>
    decodeJson(
      await fetcher(url, { method, signal, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
      json(),
    );
  return router(
    {
      listContent: query(
        {
          description:
            "List entries of a Builder content model (for example `page` or `symbol`) through the Content API, including private content. `query` is an optional JSON string of a Mongo-style filter, for example {\"data.url\":\"/about\"}.",
          input: object({
            model: string({ minLength: 1 }),
            limit: number().optional(),
            offset: number().optional(),
            query: string().optional(),
          }),
        },
        async (_ctx, input) => {
          const params = new URLSearchParams({ apiKey: publicKey, noTraverse: "true" });
          if (input.limit !== undefined) params.set("limit", String(input.limit));
          if (input.offset !== undefined) params.set("offset", String(input.offset));
          if (input.query !== undefined) params.set("query", input.query);
          return send("GET", `${contentBase}/${encodeURIComponent(input.model)}?${params}`);
        },
      ),
      createEntry: mutation(
        {
          description: "Create an entry in a content model through the Write API. `body` is the entry JSON (name, data, published, ...).",
          input: object({ model: string({ minLength: 1 }), body: json() }),
        },
        async (_ctx, { model, body }) => send("POST", `${writeBase}/${encodeURIComponent(model)}`, body),
      ),
      updateEntry: mutation(
        {
          description: "Update only the sent fields of an entry through the Write API (PATCH).",
          input: object({ model: string({ minLength: 1 }), id: string({ minLength: 1 }), body: json() }),
        },
        async (_ctx, { model, id, body }) =>
          send("PATCH", `${writeBase}/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, body),
      ),
      deleteEntry: mutation(
        {
          description: "Delete an entry through the Write API.",
          input: object({ model: string({ minLength: 1 }), id: string({ minLength: 1 }) }),
        },
        async (_ctx, { model, id }) =>
          send("DELETE", `${writeBase}/${encodeURIComponent(model)}/${encodeURIComponent(id)}`),
      ),
    },
    { title: "Builder REST", description: "Content API reads and Write API changes with a private key." },
  );
}

const approve = (tool: Parameters<typeof toolAnnotations>[0]) =>
  toolAnnotations(tool)?.readOnlyHint === true ? undefined : always();

export default defineApp(
  { user: { accounts: { cms: cms.many(), code: code.many(), rest: rest.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      {
        cms: router(
          await accountRouter(
            user?.accounts.cms ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: cmsUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                approve,
              ),
            { signal },
          ),
          { title: "Builder CMS", description: "Models, schemas and content of a Builder Content space." },
        ),
        code: router(
          await accountRouter(
            user?.accounts.code ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: codeUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                approve,
              ),
            { signal },
          ),
          { title: "Builder Code", description: "Builder Code projects, branches, agent runs and design systems." },
        ),
        rest: router(
          await accountRouter(
            user?.accounts.rest ?? [],
            (account) =>
              withApprovals(
                restRouter(account.fields.privateKey, account.fields.publicKey, fetch, signal),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              ),
            { signal },
          ),
          { title: "Builder REST", description: "Private-key Content API reads and Write API changes." },
        ),
      },
      {
        title: "Builder.io",
        description:
          "Builder.io through its official MCP servers: CMS models and content under `cms`, Builder Code projects, branches and agent runs under `code`, private-key REST content tools under `rest`.",
        icons,
      },
    ),
  }),
);
