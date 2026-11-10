import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://app.neuronwriter.com/neuron-api/0.5/writer";

const neuronwriter = defineProvider({
  name: "NeuronWriter",
  hosts: ["app.neuronwriter.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // list-projects takes no parameters and uses no analysis credit.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/list-projects`, {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.token, "content-type": "application/json", accept: "application/json" },
      body: "{}",
    });
    await decodeJson(response, array(object({ project: string() })));
  },
});

// Every NeuronWriter method is a POST with a JSON body.
const call = async (
  token: string,
  fetcher: typeof fetch,
  signal: AbortSignal | undefined,
  method: string,
  body: Record<string, unknown>,
) =>
  decodeJson(
    await fetcher(`${base}/${method}`, {
      method: "POST",
      signal,
      headers: { "x-api-key": token, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    }),
    json(),
  );

export default defineApp(
  { user: { accounts: { neuronwriter: neuronwriter.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.neuronwriter ?? [],
        (account) => {
          const post = (method: string, body: Record<string, unknown>) =>
            call(account.fields.token, fetch, signal, method, body);
          return router({
            listProjects: query(
              {
                description: "List the account's projects with their ID, name, language and search engine.",
                input: object({}),
              },
              async () => post("list-projects", {}),
            ),
            listQueries: query(
              {
                description:
                  "List content queries in a project. Optional filters: status (waiting, in progress, ready), source (neuron for the UI, neuron-api), created and updated (ISO-8601), keyword, language, engine, and tags (every tag must be present).",
                input: object({
                  project: string({ minLength: 1 }),
                  status: string().optional(),
                  source: string().optional(),
                  created: string().optional(),
                  updated: string().optional(),
                  keyword: string().optional(),
                  language: string().optional(),
                  engine: string().optional(),
                  tags: array(string()).optional(),
                }),
              },
              async (_ctx, input) => post("list-queries", input),
            ),
            getQuery: query(
              {
                description:
                  "Get the analysis for a query ID. status is not found, waiting, in progress or ready; term recommendations, metrics, ideas and competitors appear only when ready (about 60 seconds after creation). Free; uses no analysis credit.",
                input: object({ query: string({ minLength: 1 }) }),
              },
              async (_ctx, input) => post("get-query", input),
            ),
            getContent: query(
              {
                description:
                  "Get the latest saved editor content of a query as HTML with title, description and revision date. Manual saves only unless revisionType is all (includes autosaves).",
                input: object({ query: string({ minLength: 1 }), revisionType: string().optional() }),
              },
              async (_ctx, { query: id, revisionType }) =>
                post("get-content", { query: id, revision_type: revisionType }),
            ),
            evaluateContent: query(
              {
                description:
                  "Calculate the content score of HTML or a page URL against a query without saving anything. Give html or url. With url, id or class selects the container holding the content.",
                input: object({
                  query: string({ minLength: 1 }),
                  html: string().optional(),
                  url: string().optional(),
                  title: string().optional(),
                  description: string().optional(),
                  id: string().optional(),
                  class: string().optional(),
                }),
              },
              async (_ctx, input) => post("evaluate-content", input),
            ),
            newQuery: mutation(
              {
                description:
                  "Create a content analysis for a keyword in a project. Uses one analysis from the monthly limit. engine is a Google domain such as google.com; language is a name such as English; competitorsMode is top10 (default), top30 or top-intent. Poll getQuery until ready.",
                input: object({
                  project: string({ minLength: 1 }),
                  keyword: string({ minLength: 1 }),
                  engine: string({ minLength: 1 }),
                  language: string({ minLength: 1 }),
                  competitorsMode: string().optional(),
                }),
                approval: always(),
              },
              async (_ctx, { competitorsMode, ...rest }) =>
                post("new-query", { ...rest, competitors_mode: competitorsMode }),
            ),
            importContent: mutation(
              {
                description:
                  "Replace a query's editor content and save it as a new revision, returning the content score. Give html or url. With url, id or class selects the container holding the content. title and description override those found in the source.",
                input: object({
                  query: string({ minLength: 1 }),
                  html: string().optional(),
                  url: string().optional(),
                  title: string().optional(),
                  description: string().optional(),
                  id: string().optional(),
                  class: string().optional(),
                }),
                approval: always(),
              },
              async (_ctx, input) => post("import-content", input),
            ),
          });
        },
        { signal },
      ),
      {
        title: "NeuronWriter",
        description:
          "Semantic SEO content optimization: projects, keyword analyses, term and question recommendations, competitor data, and content import and scoring.",
        icons,
      },
    ),
  }),
);
