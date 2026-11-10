import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.elev.io/v1";

const elevio = defineProvider({
  name: "Elevio",
  hosts: ["api.elev.io"],
  // Elevio issues a key and a JWT as a pair on the dashboard's API Keys page; every request sends both.
  auth: {
    apiKey: secrets({
      label: "API key and JWT",
      fields: object({ apiKey: string({ minLength: 1 }), jwt: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/categories`, { signal, headers: headers(account.fields) });
    await decodeJson(response, json());
  },
});

function headers(fields: { apiKey: string; jwt: string }) {
  return { "x-api-key": fields.apiKey, Authorization: `Bearer ${fields.jwt}`, "Content-Type": "application/json" };
}

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(fields: { apiKey: string; jwt: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, search?: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.append(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: headers(fields),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
}

const payload = record(json());

function build(call: ReturnType<typeof client>) {
  return router({
    articles: router(
      {
        list: query(
          {
            description:
              "List articles. page starts at 1; pageSize defaults to 100 (max 500). status is draft or published. Date filters are epoch milliseconds. tags filters by tag.",
            input: object({
              page: number().optional(),
              pageSize: number().optional(),
              status: string().optional(),
              fromCreatedAt: number().optional(),
              toCreatedAt: number().optional(),
              fromPublishedAt: number().optional(),
              toPublishedAt: number().optional(),
              tags: array(string()).optional(),
            }),
          },
          async (_ctx, i) =>
            call("GET", "/articles", {
              page: i.page,
              page_size: i.pageSize,
              status: i.status,
              from_created_at: i.fromCreatedAt,
              to_created_at: i.toCreatedAt,
              from_published_at: i.fromPublishedAt,
              to_published_at: i.toPublishedAt,
              "tag[]": i.tags,
            }),
        ),
        get: query(
          { description: "Get one article by id, including its translations.", input: object({ id: number() }) },
          async (_ctx, { id }) => call("GET", `/articles/${id}`),
        ),
        create: mutation(
          {
            description:
              "Create an article. body is the article JSON: category_id (required), translations [{language_id, title, body, summary?}] (required), plus optional order, status (draft or published), keywords, notes, discoverable, restriction (restricted, unrestricted, noaccess), is_internal, external_id, smart_groups.",
            input: object({ body: payload }),
          },
          async (_ctx, { body }) => call("POST", "/articles", undefined, body),
        ),
        update: mutation(
          {
            description: "Update an article by id. body takes the same fields as create; send translations to change content.",
            input: object({ id: number(), body: payload }),
          },
          async (_ctx, { id, body }) => call("PUT", `/articles/${id}`, undefined, body),
        ),
        delete: mutation(
          { description: "Delete an article by id.", input: object({ id: number() }) },
          async (_ctx, { id }) => call("DELETE", `/articles/${id}`),
        ),
      },
      { title: "Articles", description: "Knowledge base articles." },
    ),
    categories: router(
      {
        list: query({ description: "List all categories.", input: object({}) }, async () => call("GET", "/categories")),
        get: query(
          { description: "Get one category by id, including its translations.", input: object({ id: number() }) },
          async (_ctx, { id }) => call("GET", `/categories/${id}`),
        ),
        create: mutation(
          {
            description:
              "Create a category. body is the category JSON: translations [{language_id, title}] (required), plus optional parent_category_id, order, external_id, discoverable, restriction (restricted, unrestricted, noaccess), is_internal, smart_groups (use [] for none).",
            input: object({ body: payload }),
          },
          async (_ctx, { body }) => call("POST", "/categories", undefined, body),
        ),
        update: mutation(
          { description: "Update a category by id. body takes the same fields as create.", input: object({ id: number(), body: payload }) },
          async (_ctx, { id, body }) => call("PUT", `/categories/${id}`, undefined, body),
        ),
        delete: mutation(
          { description: "Delete a category by id.", input: object({ id: number() }) },
          async (_ctx, { id }) => call("DELETE", `/categories/${id}`),
        ),
      },
      { title: "Categories", description: "Knowledge base categories." },
    ),
    search: query(
      {
        description:
          "Search articles in one language. languageCode is an ISO 639-1 code such as en. page defaults to 1, rows to 8 (max 100). Optionally pass user access details (userEmail, hash).",
        input: object({
          languageCode: string({ minLength: 2 }),
          query: string({ minLength: 1 }),
          page: number().optional(),
          rows: number().optional(),
          userEmail: string().optional(),
          hash: string().optional(),
        }),
      },
      async (_ctx, i) =>
        call("GET", `/search/${encodeURIComponent(i.languageCode)}`, {
          query: i.query,
          page: i.page,
          rows: i.rows,
          user_email: i.userEmail,
          hash: i.hash,
        }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { elevio: elevio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.elevio ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Elevio",
        description: "Manage Elevio knowledge base content: articles, categories and search.",
        icons,
      },
    ),
  }),
);
