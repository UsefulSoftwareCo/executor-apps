import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://analytics.babelstreet.com/rest/v1";

const rosette = defineProvider({
  name: "Rosette Text Analytics",
  hosts: ["analytics.babelstreet.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /info is a read-only call that needs a valid key (unlike /ping).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/info`, {
      signal,
      headers: { "X-BabelStreetAPI-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ name: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "X-BabelStreetAPI-Key": account.fields.token,
  Accept: "application/json",
  "Content-Type": "application/json",
});

// Every Rosette analysis endpoint is a read-only computation, so each is a query even though it is a POST.
const documentInput = object({
  content: string().optional(),
  contentUri: string().optional(),
  language: string().optional(),
  options: json().optional(),
});

const rosetteTools = (account: Account, signal: AbortSignal) => {
  const post = (path: string, description: string, input: Parameters<typeof query>[0]["input"] = documentInput) =>
    query(
      { description, input },
      async ({ fetch }, body: unknown) =>
        decodeJson(
          await fetch(`${base}/${path}`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    );
  const get = (path: string, description: string) =>
    query({ description, input: object({}) }, async ({ fetch }) =>
      decodeJson(await fetch(`${base}/${path}`, { signal, headers: headers(account) }), json()),
    );
  const docNote =
    "Pass either content (text) or contentUri (a URL the service fetches), optionally language as an ISO 639-3 code (auto-detected when omitted) and options for endpoint-specific settings.";

  return router({
    ping: get("ping", "Check that the Rosette service is reachable."),
    info: get("info", "Get server name, version and build information."),
    language: post("language", `Detect the languages and scripts in text, with confidence scores. ${docNote}`),
    sentences: post("sentences", `Split text into sentences. ${docNote}`),
    tokens: post("tokens", `Split text into tokens (words). ${docNote}`),
    morphologyComplete: post(
      "morphology/complete",
      `Complete morphological analysis: lemmas, part-of-speech tags, compound components and Han readings. ${docNote}`,
    ),
    morphologyLemmas: post("morphology/lemmas", `Lemmatize text. ${docNote}`),
    morphologyPartsOfSpeech: post("morphology/parts-of-speech", `Part-of-speech tag text. ${docNote}`),
    morphologyCompoundComponents: post(
      "morphology/compound-components",
      `Split compound words (German, Dutch and others) into components. ${docNote}`,
    ),
    morphologyHanReadings: post("morphology/han-readings", `Get readings of Han characters. ${docNote}`),
    syntaxDependencies: post("syntax/dependencies", `Get the syntactic dependency parse of text. ${docNote}`),
    entities: post(
      "entities",
      `Extract named entities (people, places, organizations, dates and more) and optionally link them to a knowledge base. Set options.linkEntities for linking. ${docNote}`,
    ),
    categories: post("categories", `Classify text into topical categories. ${docNote}`),
    sentiment: post("sentiment", `Analyze document and entity-level sentiment with confidence. ${docNote}`),
    relationships: post("relationships", `Extract relationships (subject, predicate, object) between entities. ${docNote}`),
    topics: post("topics", `Extract key phrases and concepts from text. ${docNote}`),
    events: post("events", `Extract events and their roles from text. ${docNote}`),
    semanticVector: post("semantics/vector", `Get a semantic embedding vector for text. ${docNote}`),
    semanticSimilar: post("semantics/similar", `Find terms semantically similar to the given text. ${docNote}`),
    transliteration: post("transliteration", `Transliterate text between scripts. ${docNote}`),
    nameSimilarity: post(
      "name-similarity",
      "Compare two names and return a match score from 0 to 1. name1 and name2 are objects such as { text, language?, entityType?, script? } where entityType is PERSON, LOCATION or ORGANIZATION. parameters holds optional tuning settings.",
      object({ name1: json(), name2: json(), parameters: json().optional() }),
    ),
    nameTranslation: post(
      "name-translation",
      "Translate a name into another language. name and targetLanguage (ISO 639-3) are required; optional entityType, sourceLanguageOfOrigin, sourceLanguageOfUse, sourceScript, targetScript and targetScheme.",
      object({
        name: string(),
        targetLanguage: string(),
        entityType: string().optional(),
        sourceLanguageOfOrigin: string().optional(),
        sourceLanguageOfUse: string().optional(),
        sourceScript: string().optional(),
        targetScript: string().optional(),
        targetScheme: string().optional(),
      }),
    ),
    nameDeduplication: post(
      "name-deduplication",
      "Group a list of names into clusters of duplicates. names is an array of name strings or objects; threshold (0-1) sets how similar names must be.",
      object({ names: array(json()), threshold: json().optional() }),
    ),
    addressSimilarity: post(
      "address-similarity",
      "Compare two postal addresses and return a match score. address1 and address2 are address strings or structured address objects; parameters holds optional settings.",
      object({ address1: json(), address2: json(), parameters: json().optional() }),
    ),
    recordSimilarity: post(
      "record-similarity",
      "Compare records across fields (names, addresses, dates and more). fields describes each field's type and weight; records holds the two record sets to compare; properties and comparisonMethod are optional.",
      object({
        fields: json(),
        records: json(),
        properties: json().optional(),
        comparisonMethod: string().optional(),
      }),
    ),
  });
};

export default defineApp({ user: { accounts: { rosette: rosette.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.rosette ?? [], (account) => rosetteTools(account, signal), { signal }), {
    title: "Rosette Text Analytics",
    description:
      "Multilingual text analytics with Rosette (Babel Street Analytics): language detection, entities, sentiment, categories, relationships, morphology, name matching and translation.",
    icons,
  }),
}));
