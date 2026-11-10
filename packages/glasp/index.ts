import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
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

const base = "https://api.glasp.co";
const mcpUrl = "https://glasp.co/api/mcp";

// The REST API takes the access token as a bearer; the MCP server is a separate OAuth resource
// (dynamic client registration, scopes read and write), so it is its own provider.
const glaspMcp = defineProvider({
  name: "Glasp MCP",
  hosts: ["glasp.co"],
  auth: {
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

const glasp = defineProvider({
  name: "Glasp",
  hosts: ["api.glasp.co"],
  auth: {
    // Access tokens are created at https://glasp.co/settings/access_token.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The API has no current-user endpoint; the bookmark export answers for any valid token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/bookmarks/export`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ count: number() }));
  },
});

type Params = Record<string, string | number | undefined>;

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, params: Params, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };

  const exportInput = object({
    pageCursor: string().optional(),
    updatedAfter: string().optional(),
  });
  const exportNote =
    "Returns { count, nextPageCursor, results }. Pass nextPageCursor as pageCursor for the next page (newest to oldest). Use updatedAfter (ISO 8601, UTC unless an offset is given) for incremental syncs.";

  return router({
    highlights: router(
      {
        export: query(
          {
            description: `Export web, video, tweet and PDF highlights grouped by document, with notes, tags and summaries. ${exportNote} Rate limit 100/min.`,
            input: exportInput,
          },
          (_ctx, args) => call("GET", "/v1/highlights/export", args),
        ),
        create: mutation(
          {
            description:
              "Create up to 100 highlights (documents are matched by url). Returns the affected documents. Rate limit 15/min.",
            input: object({
              highlights: array(
                object({
                  title: string(),
                  url: string(),
                  text: string(),
                  author: string().optional(),
                  thumbnail_url: string().optional(),
                  color: string().optional(),
                  note: string().optional(),
                  tags: array(string()).optional(),
                  location: number().optional(),
                  location_type: string().optional(),
                  highlighted_at: string().optional(),
                  highlight_url: string().optional(),
                }),
              ),
            }),
          },
          (_ctx, args) => call("POST", "/v1/highlights/create", {}, args),
        ),
        update: mutation(
          {
            description:
              "Update one highlight, identified by the document url and highlight_id. color is pink, yellow, blue or green. Rate limit 30/min.",
            input: object({
              url: string(),
              highlight_id: string(),
              text: string().optional(),
              color: string().optional(),
              note: string().optional(),
              location: number().optional(),
              highlight_url: string().optional(),
            }),
          },
          (_ctx, args) => call("PATCH", "/v1/highlights/update", {}, args),
        ),
        delete: mutation(
          {
            description:
              "Delete one highlight (highlight_id) from the document at url, or every highlight in the document when delete_document is true. One of highlight_id or delete_document is required. Rate limit 15/min.",
            input: object({
              url: string(),
              highlight_id: string().optional(),
              delete_document: boolean().optional(),
            }),
          },
          (_ctx, args) => call("DELETE", "/v1/highlights/delete", {}, args),
        ),
      },
      { title: "Highlights", description: "Highlights and notes on articles, videos, tweets and PDFs." },
    ),
    kindle: router(
      {
        export: query(
          {
            description: `Export Kindle highlights imported through the Glasp Kindle extension or CSV. Read-only. ${exportNote} Rate limit 100/min.`,
            input: exportInput,
          },
          (_ctx, args) => call("GET", "/v1/kindle-highlights/export", args),
        ),
      },
      { title: "Kindle", description: "Kindle book highlights." },
    ),
    bookmarks: router(
      {
        export: query(
          {
            description: `Export pages saved without highlights. ${exportNote} Rate limit 100/min.`,
            input: exportInput,
          },
          (_ctx, args) => call("GET", "/v1/bookmarks/export", args),
        ),
        create: mutation(
          {
            description:
              "Save a page as a bookmark. Saving an existing url updates it. category is article, video, tweet, pdf or book (inferred from the url when omitted). Rate limit 15/min.",
            input: object({
              url: string(),
              title: string().optional(),
              thumbnail_url: string().optional(),
              description: string().optional(),
              category: string().optional(),
            }),
          },
          (_ctx, args) => call("POST", "/v1/bookmarks/create", {}, args),
        ),
      },
      { title: "Bookmarks", description: "Saved pages." },
    ),
    summaries: router(
      {
        export: query(
          {
            description: `Export AI summaries of pages, PDFs and YouTube videos (summary text only). ${exportNote} Rate limit 100/min.`,
            input: exportInput,
          },
          (_ctx, args) => call("GET", "/v1/summaries/export", args),
        ),
        get: query(
          {
            description:
              "Get one AI summary by id (from summaries.export, formatted {sha1}:{uid}). Set include to content to also return the stored Markdown body. Rate limit 100/min.",
            input: object({ id: string(), include: string().optional() }),
          },
          (_ctx, args) => call("GET", "/v1/summaries/get", args),
        ),
      },
      { title: "Summaries", description: "AI-generated summaries." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { glasp: glasp.many(), glaspMcp: glaspMcp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.glasp ?? [],
            (account) =>
              withApprovals(build(account.fields.token, fetch, signal), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          {
            title: "Glasp REST API",
            description:
              "Export highlights, bookmarks, Kindle highlights and summaries, and create, update and delete highlights and bookmarks, with an access token.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.glaspMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Glasp MCP",
            description:
              "Glasp's remote MCP server: semantic highlight search, recent highlights, highlights for a URL, Kindle highlights, bookmarks, summaries, memories, community highlights and saving bookmarks.",
          },
        ),
      },
      {
        title: "Glasp",
        description:
          "Glasp highlights, bookmarks, Kindle highlights and AI summaries through the REST API (api, access token) and Glasp's MCP server (mcp, OAuth).",
        icons,
      },
    ),
  }),
);
