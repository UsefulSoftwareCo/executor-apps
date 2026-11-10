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

const origin = "https://api.textrazor.com";

const textrazor = defineProvider({
  name: "TextRazor",
  hosts: ["api.textrazor.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/account/`, {
      signal,
      headers: { "X-TextRazor-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Init = { method?: string; json?: unknown; form?: Record<string, unknown>; csv?: string; query?: Record<string, unknown> };

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (path: string, init: Init = {}) => {
    const url = new URL(`${origin}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { "X-TextRazor-Key": token, Accept: "application/json" };
    let body: string | undefined;
    if (init.form) {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(init.form)) {
        if (value === undefined || value === null) continue;
        form.set(key, Array.isArray(value) ? value.join(",") : String(value));
      }
      body = form.toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (init.csv !== undefined) {
      body = init.csv;
      headers["Content-Type"] = "application/csv";
    } else if (init.json !== undefined) {
      body = JSON.stringify(init.json);
      headers["Content-Type"] = "application/json";
    }
    const response = await fetcher(url.toString(), {
      signal,
      method: init.method ?? "GET",
      headers,
      ...(body !== undefined ? { body } : {}),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`TextRazor answered ${response.status}: ${text.slice(0, 1000)}`);
    if (text.trim() === "") return {} as unknown;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { body: text } as unknown;
    }
  };
}

type Call = ReturnType<typeof client>;

const id = (value: string) => encodeURIComponent(value);

const analysisInput = object({
  text: string().optional(),
  url: string().optional(),
  extractors: array(string()).optional(),
  classifiers: array(string()).optional(),
  languageOverride: string().optional(),
  params: record(string()).optional(),
});

type AnalysisInput = {
  text?: string;
  url?: string;
  extractors?: readonly string[];
  classifiers?: readonly string[];
  languageOverride?: string;
  params?: Record<string, string>;
};

function analyze(call: Call, input: AnalysisInput, extractors: readonly string[] | undefined) {
  if ((input.text === undefined) === (input.url === undefined)) {
    throw new Error("Provide exactly one of text or url.");
  }
  return call("/", {
    method: "POST",
    form: {
      ...(input.params ?? {}),
      text: input.text,
      url: input.url,
      extractors: extractors && extractors.length > 0 ? extractors : undefined,
      classifiers: input.classifiers && input.classifiers.length > 0 ? input.classifiers : undefined,
      languageOverride: input.languageOverride,
    },
  });
}

function build(call: Call) {
  return router({
    analyze: router(
      {
        run: query(
          {
            description:
              "Run TextRazor analysis on text (up to 200kb) or a public url. Provide exactly one of text or url, and at least one extractor: entities, topics, words, phrases, dependency-trees, relations, entailments, senses, spelling. Optional classifiers (e.g. textrazor_mediatopics_2023Q1, textrazor_iab_content_taxonomy_3.0 or your own classifier ids). Further form options (cleanup.mode, entities.dictionaries, entities.filterDbpediaTypes, download.runJavascript, rules, ...) go in params as string values (numbers and booleans as text, lists comma-separated). Uses API requests from the plan.",
            input: analysisInput,
          },
          async (_ctx, input) => analyze(call, input, input.extractors),
        ),
        entities: query(
          {
            description:
              "Extract named entities (people, places, organisations, concepts) from text or a url, linked to Wikipedia, Wikidata and DBpedia types, with confidence and relevance scores.",
            input: object({ text: string().optional(), url: string().optional(), languageOverride: string().optional(), params: record(string()).optional() }),
          },
          async (_ctx, input) => analyze(call, input, ["entities"]),
        ),
        topics: query(
          {
            description: "Extract the main topics (Wikipedia concepts with scores) of a text or url.",
            input: object({ text: string().optional(), url: string().optional(), languageOverride: string().optional(), params: record(string()).optional() }),
          },
          async (_ctx, input) => analyze(call, input, ["topics"]),
        ),
        classify: query(
          {
            description:
              "Classify a text or url against one or more classifiers (built-in such as textrazor_mediatopics_2023Q1, textrazor_iab_content_taxonomy_3.0, textrazor_newscodes, or custom classifier ids). Returns scored categories. Set classifier.maxCategories in params to limit results. Note: this also runs the entities extractor on every call, which adds cost and latency.",
            input: object({
              text: string().optional(),
              url: string().optional(),
              classifiers: array(string({ minLength: 1 })),
              languageOverride: string().optional(),
              params: record(string()).optional(),
            }),
          },
          async (_ctx, input) => analyze(call, input, ["entities"]),
        ),
      },
      { title: "Analysis", description: "Natural language analysis of text and web pages." },
    ),
    account: query(
      { description: "Plan, concurrent request limit and usage, and requests used today for the API key.", input: object({}) },
      async () => call("/account/"),
    ),
    dictionaries: router(
      {
        list: query({ description: "List all custom entity dictionaries.", input: object({}) }, async () => call("/entities/")),
        get: query(
          { description: "Get a custom entity dictionary's settings.", input: object({ dictionaryId: string({ minLength: 1 }) }) },
          async (_ctx, { dictionaryId }) => call(`/entities/${id(dictionaryId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a custom entity dictionary. matchType is token (default) or stem; caseInsensitive defaults to false; language is an ISO-639-2 code or any.",
            input: object({
              dictionaryId: string({ minLength: 1 }),
              matchType: string().optional(),
              caseInsensitive: boolean().optional(),
              language: string().optional(),
            }),
          },
          async (_ctx, { dictionaryId, matchType, caseInsensitive, language }) =>
            call(`/entities/${id(dictionaryId)}`, { method: "PUT", json: { matchType, caseInsensitive, language } }),
        ),
        delete: mutation(
          { description: "Delete a custom entity dictionary and all its entries.", input: object({ dictionaryId: string({ minLength: 1 }) }) },
          async (_ctx, { dictionaryId }) => call(`/entities/${id(dictionaryId)}`, { method: "DELETE" }),
        ),
        addEntries: mutation(
          {
            description:
              "Add entries to a dictionary. Each entry has text, an optional id (reusing an id overwrites that entry) and optional data (map of string to list of strings).",
            input: object({ dictionaryId: string({ minLength: 1 }), entries: array(object({ text: string({ minLength: 1 }), id: string().optional(), data: record(json()).optional() })) }),
          },
          async (_ctx, { dictionaryId, entries }) => call(`/entities/${id(dictionaryId)}/`, { method: "POST", json: entries }),
        ),
        listEntries: query(
          {
            description: "List the entries of a dictionary, with paging.",
            input: object({ dictionaryId: string({ minLength: 1 }), limit: number().optional(), offset: number().optional() }),
          },
          async (_ctx, { dictionaryId, limit, offset }) => call(`/entities/${id(dictionaryId)}/_all`, { query: { limit, offset } }),
        ),
        getEntry: query(
          { description: "Get one dictionary entry.", input: object({ dictionaryId: string({ minLength: 1 }), entryId: string({ minLength: 1 }) }) },
          async (_ctx, { dictionaryId, entryId }) => call(`/entities/${id(dictionaryId)}/${id(entryId)}`),
        ),
        deleteEntry: mutation(
          { description: "Delete one dictionary entry.", input: object({ dictionaryId: string({ minLength: 1 }), entryId: string({ minLength: 1 }) }) },
          async (_ctx, { dictionaryId, entryId }) => call(`/entities/${id(dictionaryId)}/${id(entryId)}`, { method: "DELETE" }),
        ),
      },
      { title: "Entity dictionaries", description: "Custom entity dictionaries used during entity extraction." },
    ),
    classifiers: router(
      {
        create: mutation(
          {
            description:
              "Create a custom classifier, or merge categories into an existing one (categories with the same id are replaced). Each category has categoryId, optional label, and query such as concept('sport>golf').",
            input: object({
              classifierId: string({ minLength: 1 }),
              categories: array(object({ categoryId: string({ minLength: 1 }), label: string().optional(), query: string({ minLength: 1 }) })),
            }),
          },
          async (_ctx, { classifierId, categories }) => call(`/categories/${id(classifierId)}`, { method: "PUT", json: categories }),
        ),
        createFromCsv: mutation(
          {
            description:
              "Create a custom classifier from CSV text with rows 'Category ID,Category Label,Category Query'. Replaces any existing classifier with that id.",
            input: object({ classifierId: string({ minLength: 1 }), csv: string({ minLength: 1 }) }),
          },
          async (_ctx, { classifierId, csv }) => call(`/categories/${id(classifierId)}`, { method: "PUT", csv }),
        ),
        delete: mutation(
          { description: "Delete a custom classifier and all its categories.", input: object({ classifierId: string({ minLength: 1 }) }) },
          async (_ctx, { classifierId }) => call(`/categories/${id(classifierId)}`, { method: "DELETE" }),
        ),
        listCategories: query(
          {
            description: "List the categories of a custom classifier, with paging.",
            input: object({ classifierId: string({ minLength: 1 }), limit: number().optional(), offset: number().optional() }),
          },
          async (_ctx, { classifierId, limit, offset }) => call(`/categories/${id(classifierId)}/_all`, { query: { limit, offset } }),
        ),
        getCategory: query(
          { description: "Get one category of a custom classifier.", input: object({ classifierId: string({ minLength: 1 }), categoryId: string({ minLength: 1 }) }) },
          async (_ctx, { classifierId, categoryId }) => call(`/categories/${id(classifierId)}/${id(categoryId)}`),
        ),
        deleteCategory: mutation(
          { description: "Delete one category from a custom classifier.", input: object({ classifierId: string({ minLength: 1 }), categoryId: string({ minLength: 1 }) }) },
          async (_ctx, { classifierId, categoryId }) => call(`/categories/${id(classifierId)}/${id(categoryId)}`, { method: "DELETE" }),
        ),
      },
      { title: "Classifiers", description: "Custom classifiers built from category queries." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { textrazor: textrazor.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.textrazor ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TextRazor",
        description:
          "Natural language processing with TextRazor: extract entities, topics and relations from text or URLs, classify content, and manage custom entity dictionaries and classifiers.",
        icons,
      },
    ),
  }),
);
