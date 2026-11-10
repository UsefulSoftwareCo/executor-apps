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

const base = "https://readwise.io/api/v3";
const mcpUrl = "https://mcp2.readwise.io/mcp";

const readwise = defineProvider({
  name: "Readwise Reader",
  hosts: ["readwise.io", "mcp2.readwise.io"],
  auth: {
    apiKey: secrets({
      label: "Readwise access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The official MCP server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: "https://readwise.io/o/", scopes: ["openid", "read", "write"] }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth")
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    // Readwise answers 204 for a valid token and 401 otherwise.
    const response = await fetch("https://readwise.io/api/v2/auth/", { signal, headers: headers(account.fields) });
    if (response.status !== 204) throw new Error(`Readwise rejected the access token (${response.status})`);
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account["fields"]) => ({ Authorization: `Token ${account.token}`, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const fields = {
  title: string().optional(),
  author: string().optional(),
  summary: string().optional(),
  language: string().optional(),
  published_date: string().optional(),
  image_url: string().optional(),
  location: string().optional(),
  category: string().optional(),
  tags: array(string()).optional(),
  notes: string().optional(),
};

const readerTools = (account: Account, signal: AbortSignal) =>
  router({
    save: mutation(
      {
        description:
          "Save a URL to the Reader library (or create a highlight when parent_id and content are given). Returns the document id and Reader URL. location is new, later, archive or feed; category is article, email, rss, highlight, pdf, epub, tweet or video (note is not allowed on save; highlight requires parent_id). Pass html to save content you already have (should_clean_html lets Reader clean it). Rate limit 50/min.",
        input: object({
          url: string().optional(),
          html: string().optional(),
          should_clean_html: boolean().optional(),
          saved_using: string().optional(),
          parent_id: string().optional(),
          content: string().optional(),
          ...fields,
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        return decodeJson(
          await fetch(`${base}/save/`, {
            method: "POST",
            signal,
            headers: { ...headers(account.fields), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        );
      },
    ),
    list: query(
      {
        description:
          "List documents, highlights and notes in the Reader library, newest first, 100 per page at most. Filter by id, updatedAfter (ISO 8601), location (new, later, shortlist, archive, feed), category, and tag (one tag; empty string means untagged). Continue with pageCursor from the previous nextPageCursor. withHtmlContent=true includes the full HTML. Rate limit 20/min.",
        input: object({
          id: string().optional(),
          updatedAfter: string().optional(),
          location: string().optional(),
          category: string().optional(),
          tag: string().optional(),
          limit: number().optional(),
          pageCursor: string().optional(),
          withHtmlContent: boolean().optional(),
          withRawSourceUrl: boolean().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/list/?${search(input)}`, { signal, headers: headers(account.fields) }), json()),
    ),
    update: mutation(
      {
        description:
          "Update one document by id: title, author, summary, language, published_date, image_url, location (new, later, archive, feed), category, tags (replaces the set) and notes. Highlights accept only notes and tags. Set seen to true or false. Rate limit 50/min.",
        input: object({ id: string(), seen: boolean().optional(), ...fields }),
        approval: always(),
      },
      async ({ fetch }, { id, ...rest }) =>
        decodeJson(
          await fetch(`${base}/update/${encodeURIComponent(id)}/`, {
            method: "PATCH",
            signal,
            headers: { ...headers(account.fields), "content-type": "application/json" },
            body: JSON.stringify(rest),
          }),
          json(),
        ),
    ),
    bulkUpdate: mutation(
      {
        description:
          "Update up to 50 documents in one call. Each update needs an id plus any of the single-update fields (title, author, summary, location, category, tags, notes, seen and so on). The response lists results per document and may be a partial failure (status 207). Rate limit 20/min.",
        input: object({ updates: array(object({ id: string(), seen: boolean().optional(), ...fields })) }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/bulk_update/`, {
            method: "PATCH",
            signal,
            headers: { ...headers(account.fields), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    delete: mutation(
      {
        description:
          "Permanently delete a document by id, including its highlights and notes. Rate limit 20/min.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => {
        const response = await fetch(`${base}/delete/${encodeURIComponent(id)}/`, {
          method: "DELETE",
          signal,
          headers: headers(account.fields),
        });
        if (response.status !== 204) throw new Error(`Readwise delete failed (${response.status})`);
        return { deleted: true, id };
      },
    ),
    listTags: query(
      {
        description: "List every tag in the Reader library, paginated with pageCursor / nextPageCursor. Rate limit 20/min.",
        input: object({ pageCursor: string().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/tags/?${search(input)}`, { signal, headers: headers(account.fields) }), json()),
    ),
  });

export default defineApp({ user: { accounts: { readwise: readwise.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(
      user?.accounts.readwise ?? [],
      async (account) =>
        account.method === "oauth"
          ? withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            )
          : readerTools(account, signal),
      { signal },
    ),
    {
      title: "Readwise Reader",
      description: "Save, list, update, tag and delete documents, highlights and notes in a Readwise Reader library.",
      icons,
    },
  ),
}));
