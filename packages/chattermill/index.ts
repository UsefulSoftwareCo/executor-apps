import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.chattermill.com";

const chattermill = defineProvider({
  name: "Chattermill",
  hosts: ["api.chattermill.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/projects`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: "chattermill", displayName: "Chattermill" } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}/v1${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204 || (method === "DELETE" && response.ok)) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const project = () => string({ minLength: 1 });
const id = () => string({ minLength: 1 });

function build(call: Call) {
  const list = (resource: string, description: string) =>
    query(
      {
        description: `${description} Paginated with page and per_page.`,
        input: object({ project: project(), page: number().optional(), per_page: number().optional() }),
      },
      (_c, { project: p, page, per_page }) => call("GET", `/${seg(p)}/${resource}`, { page, per_page }),
    );
  const get = (resource: string, description: string) =>
    query({ description, input: object({ project: project(), id: id() }) }, (_c, { project: p, id: i }) =>
      call("GET", `/${seg(p)}/${resource}/${seg(i)}`),
    );

  const projects = router(
    {
      list: query({ description: "List the projects the API key can access.", input: object({}) }, () => call("GET", "/projects")),
      get: query({ description: "Get a project by id.", input: object({ id: id() }) }, (_c, { id: i }) =>
        call("GET", `/projects/${seg(i)}`),
      ),
    },
    { title: "Projects", description: "Chattermill projects; every other resource lives under a project key." },
  );

  const responses = router(
    {
      list: query(
        {
          description:
            "List responses (feedback items with comment, score, metadata and themes). Scope by a date range (from/to, updated_from/updated_to) and page through results.",
          input: object({
            project: project(),
            page: number().optional(),
            per_page: number().optional(),
            from: string().optional(),
            to: string().optional(),
            data_type: string().optional(),
            data_source: string().optional(),
            filter_property: string().optional(),
            filter_value: string().optional(),
            text_analytics_processed: string().optional(),
            comment_present: string().optional(),
            score_from: number().optional(),
            score_to: number().optional(),
            custom_segment_id: string().optional(),
            theme_id: string().optional(),
            updated_from: string().optional(),
            updated_to: string().optional(),
          }),
        },
        (_c, { project: p, ...filters }) => call("GET", `/${seg(p)}/responses`, filters),
      ),
      get: get("responses", "Get a response by id."),
      search: mutation(
        {
          description:
            "Find responses matching criteria (POST /responses/search), for example by customer email or id when handling a data erasure request. Does not modify data, but is sent as POST. Body shape follows the Chattermill API reference.",
          input: object({ project: project(), body: json() }),
        },
        (_c, { project: p, body }) => call("POST", `/${seg(p)}/responses/search`, {}, body),
      ),
      create: mutation(
        {
          description:
            'Create a response. Body: {"response": {"score": 10, "comment": "...", "data_type": "NPS", "data_source": "Typeform", "user_meta": {"customer_id": {"type": "text", "value": "1234", "name": "Customer ID"}}, "segments": {...}}}. Get valid data_type and data_source keys from the data types and data sources lists.',
          input: object({ project: project(), body: json() }),
        },
        (_c, { project: p, body }) => call("POST", `/${seg(p)}/responses`, {}, body),
      ),
      update: mutation(
        {
          description:
            'Update a response, usually to add attributes. Body: {"response": {"user_meta": {...}, "segments": {...}}}.',
          input: object({ project: project(), id: id(), body: json() }),
        },
        (_c, { project: p, id: i, body }) => call("PUT", `/${seg(p)}/responses/${seg(i)}`, {}, body),
      ),
      delete: mutation(
        {
          description: "Permanently delete a response (for example a GDPR erasure request).",
          input: object({ project: project(), id: id() }),
        },
        (_c, { project: p, id: i }) => call("DELETE", `/${seg(p)}/responses/${seg(i)}`),
      ),
    },
    { title: "Responses", description: "Customer feedback responses and their processed themes." },
  );

  const taxonomy = router(
    {
      dataSources: list("data_sources", "List data sources (Zendesk, Typeform, ...) in a project."),
      getDataSource: get("data_sources", "Get a data source by id."),
      dataTypes: list("data_types", "List data types (nps, review, ...) in a project."),
      getDataType: get("data_types", "Get a data type by id."),
      customSegments: list("custom_segments", "List custom segments in a project."),
      themes: list("themes", "List themes in a project."),
      getTheme: get("themes", "Get a theme by id."),
      categories: list("categories", "List categories in a project."),
      getCategory: get("categories", "Get a category by id."),
      attributes: list("attributes", "List attributes in a project."),
      getAttribute: get("attributes", "Get an attribute by id."),
      tags: list("tags", "List tags in a project."),
      getTag: get("tags", "Get a tag by id."),
    },
    { title: "Taxonomy", description: "Data sources, data types, segments, themes, categories, attributes and tags." },
  );

  const metrics = router(
    {
      get: query(
        {
          description: "Get the value of a metric such as NPS over a date range, optionally filtered by category, theme and sentiment.",
          input: object({
            project: project(),
            type: string(),
            from: string().optional(),
            to: string().optional(),
            category: string().optional(),
            theme: string().optional(),
            sentiment: string().optional(),
          }),
        },
        (_c, { project: p, ...params }) => call("GET", `/${seg(p)}/metrics`, params),
      ),
    },
    { title: "Metrics", description: "Aggregate metrics over responses." },
  );

  return router({ projects, responses, taxonomy, metrics });
}

export default defineApp(
  { user: { accounts: { chattermill: chattermill.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chattermill ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Chattermill",
        description: "Customer feedback analytics: projects, responses, themes, categories, attributes, tags, segments and metrics.",
        icons,
        instructions:
          "List the projects first; every other tool needs a project key. Dates for filters are ISO 8601. Search is a POST but only reads.",
      },
    ),
  }),
);
