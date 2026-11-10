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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.wit.ai";
const version = "20240304";

const witai = defineProvider({
  name: "Wit.ai",
  hosts: ["api.wit.ai"],
  auth: {
    apiKey: secrets({
      label: "Server access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Parsing a short text is read-only and works with any app's server access token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/message?v=${version}&q=hello`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ text: string() }));
  },
});

type Account = { fields: { token: string } };

const enc = encodeURIComponent;

const url = (path: string, params: Record<string, string | number | undefined> = {}) => {
  const out = new URLSearchParams({ v: version });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return `${base}${path}?${out.toString()}`;
};

const witaiTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: `Bearer ${account.fields.token}` };
  const jsonHeaders = { ...headers, "content-type": "application/json" };
  const get = (fetch: typeof globalThis.fetch, path: string, params?: Record<string, string | number | undefined>) =>
    fetch(url(path, params), { signal, headers }).then((response) => decodeJson(response, json()));
  const send = (
    fetch: typeof globalThis.fetch,
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>,
  ) =>
    fetch(url(path, params), {
      method,
      signal,
      headers: jsonHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }).then((response) => decodeJson(response, json()));

  return router({
    parseMessage: query(
      {
        description:
          "Run natural language understanding on a text (up to 280 characters) with the app the token belongs to. Returns intents, entities and traits with confidences. n is the maximum number of intents/entities to return (default 1). tag selects an app version tag; context is a JSON string such as {\"timezone\":\"America/Los_Angeles\"}.",
        input: object({ q: string(), n: number().optional(), tag: string().optional(), context: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/message", input),
    ),
    detectLanguage: query(
      {
        description: "Detect the language of a text (up to 280 characters). n is the maximum number of candidate languages (default 1).",
        input: object({ q: string(), n: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/language", input),
    ),
    listApps: query(
      {
        description: "List the Wit.ai apps of the account that owns the token (the Wit.ai tutorial uses the Server Access Token for this). limit is 1-10000 (default 0 means 1), offset starts at 0.",
        input: object({ limit: number().optional(), offset: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/apps", input),
    ),
    getApp: query(
      { description: "Get one app's metadata and settings by app id.", input: object({ appId: string() }) },
      async ({ fetch }, { appId }) => get(fetch, `/apps/${enc(appId)}`),
    ),
    listAppTags: query(
      {
        description: "List the tag groups (saved versions) of an app, with their creation time.",
        input: object({ appId: string() }),
      },
      async ({ fetch }, { appId }) => get(fetch, `/apps/${enc(appId)}/tags`),
    ),
    getAppTag: query(
      {
        description: "Get one app version tag (saved version) of an app by tag name.",
        input: object({ appId: string(), tag: string() }),
      },
      async ({ fetch }, { appId, tag }) => get(fetch, `/apps/${enc(appId)}/tags/${enc(tag)}`),
    ),
    exportApp: query(
      {
        description:
          "Get a temporary download URL for a ZIP backup (training data, entities, intents) of the app the token belongs to.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/export"),
    ),
    createApp: mutation(
      {
        description:
          "Create a new app using the account's Server Access Token. lang is a two-letter language code (for example en); private is whether the app is private; timezone is an IANA name such as America/Los_Angeles. The response includes the new app's access_token.",
        input: object({ name: string(), lang: string(), private: boolean(), timezone: string().optional(), desc: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { timezone, ...body }) => send(fetch, "POST", "/apps", body, { timezone }),
    ),
    updateApp: mutation(
      {
        description: "Update an app's name, language, privacy, timezone or description.",
        input: object({
          appId: string(),
          name: string().optional(),
          lang: string().optional(),
          private: boolean().optional(),
          timezone: string().optional(),
          desc: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { appId, ...body }) => send(fetch, "PUT", `/apps/${enc(appId)}`, body),
    ),
    createAppTag: mutation(
      {
        description: "Save the current state of an app as a named version tag.",
        input: object({ appId: string(), tag: string() }),
        approval: always(),
      },
      async ({ fetch }, { appId, tag }) => send(fetch, "POST", `/apps/${enc(appId)}/tags/`, { tag }),
    ),
    deleteAppTag: mutation(
      {
        description: "Delete an app version tag.",
        input: object({ appId: string(), tag: string() }),
        approval: always(),
      },
      async ({ fetch }, { appId, tag }) => send(fetch, "DELETE", `/apps/${enc(appId)}/tags/${enc(tag)}`),
    ),
    deleteApp: mutation(
      { description: "Permanently delete an app and all its training data.", input: object({ appId: string() }), approval: always() },
      async ({ fetch }, { appId }) => send(fetch, "DELETE", `/apps/${enc(appId)}`),
    ),
    listIntents: query(
      { description: "List the intents of the app the token belongs to.", input: object({}) },
      async ({ fetch }) => get(fetch, "/intents"),
    ),
    getIntent: query(
      { description: "Get one intent by name, including its entities.", input: object({ intent: string() }) },
      async ({ fetch }, { intent }) => get(fetch, `/intents/${enc(intent)}`),
    ),
    createIntent: mutation(
      { description: "Create an intent with the given name.", input: object({ name: string() }), approval: always() },
      async ({ fetch }, body) => send(fetch, "POST", "/intents", body),
    ),
    deleteIntent: mutation(
      { description: "Permanently delete an intent by name.", input: object({ intent: string() }), approval: always() },
      async ({ fetch }, { intent }) => send(fetch, "DELETE", `/intents/${enc(intent)}`),
    ),
    listEntities: query(
      { description: "List the entities of the app the token belongs to.", input: object({}) },
      async ({ fetch }) => get(fetch, "/entities"),
    ),
    getEntity: query(
      { description: "Get one entity by name, including roles, lookup strategies and keywords.", input: object({ entity: string() }) },
      async ({ fetch }, { entity }) => get(fetch, `/entities/${enc(entity)}`),
    ),
    createEntity: mutation(
      {
        description:
          "Create an entity. roles are the role names (defaults to one role named like the entity); lookups are strategies such as free-text and keywords.",
        input: object({ name: string(), roles: array(string()).optional(), lookups: array(string()).optional() }),
        approval: always(),
      },
      async ({ fetch }, body) => send(fetch, "POST", "/entities", body),
    ),
    updateEntity: mutation(
      {
        description: "Update an entity's name, roles or lookup strategies.",
        input: object({ entity: string(), name: string().optional(), roles: array(string()).optional(), lookups: array(string()).optional() }),
        approval: always(),
      },
      async ({ fetch }, { entity, ...body }) => send(fetch, "PUT", `/entities/${enc(entity)}`, body),
    ),
    deleteEntity: mutation(
      { description: "Permanently delete an entity by name.", input: object({ entity: string() }), approval: always() },
      async ({ fetch }, { entity }) => send(fetch, "DELETE", `/entities/${enc(entity)}`),
    ),
    deleteEntityRole: mutation(
      {
        description: "Delete one role from an entity.",
        input: object({ entity: string(), role: string() }),
        approval: always(),
      },
      async ({ fetch }, { entity, role }) => send(fetch, "DELETE", `/entities/${enc(entity)}:${enc(role)}`),
    ),
    addEntityKeyword: mutation(
      {
        description: "Add a keyword with its synonyms to a keywords-lookup entity.",
        input: object({ entity: string(), keyword: string(), synonyms: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { entity, ...body }) => send(fetch, "POST", `/entities/${enc(entity)}/keywords`, body),
    ),
    deleteEntityKeyword: mutation(
      { description: "Delete a keyword from an entity.", input: object({ entity: string(), keyword: string() }), approval: always() },
      async ({ fetch }, { entity, keyword }) => send(fetch, "DELETE", `/entities/${enc(entity)}/keywords/${enc(keyword)}`),
    ),
    addEntitySynonym: mutation(
      {
        description: "Add a synonym to an existing keyword of an entity.",
        input: object({ entity: string(), keyword: string(), synonym: string() }),
        approval: always(),
      },
      async ({ fetch }, { entity, keyword, synonym }) =>
        send(fetch, "POST", `/entities/${enc(entity)}/keywords/${enc(keyword)}/synonyms`, { synonym }),
    ),
    deleteEntitySynonym: mutation(
      {
        description: "Delete a synonym from a keyword of an entity.",
        input: object({ entity: string(), keyword: string(), synonym: string() }),
        approval: always(),
      },
      async ({ fetch }, { entity, keyword, synonym }) =>
        send(fetch, "DELETE", `/entities/${enc(entity)}/keywords/${enc(keyword)}/synonyms/${enc(synonym)}`),
    ),
    listTraits: query(
      { description: "List the traits of the app the token belongs to.", input: object({}) },
      async ({ fetch }) => get(fetch, "/traits"),
    ),
    getTrait: query(
      { description: "Get one trait by name, including its values.", input: object({ trait: string() }) },
      async ({ fetch }, { trait }) => get(fetch, `/traits/${enc(trait)}`),
    ),
    createTrait: mutation(
      {
        description: "Create a trait with its initial values.",
        input: object({ name: string(), values: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, body) => send(fetch, "POST", "/traits", body),
    ),
    deleteTrait: mutation(
      { description: "Permanently delete a trait by name.", input: object({ trait: string() }), approval: always() },
      async ({ fetch }, { trait }) => send(fetch, "DELETE", `/traits/${enc(trait)}`),
    ),
    addTraitValue: mutation(
      { description: "Add a value to an existing trait.", input: object({ trait: string(), value: string() }), approval: always() },
      async ({ fetch }, { trait, value }) => send(fetch, "POST", `/traits/${enc(trait)}/values`, { value }),
    ),
    deleteTraitValue: mutation(
      { description: "Delete a value from a trait.", input: object({ trait: string(), value: string() }), approval: always() },
      async ({ fetch }, { trait, value }) => send(fetch, "DELETE", `/traits/${enc(trait)}/values/${enc(value)}`),
    ),
    listUtterances: query(
      {
        description: "List the training utterances of the app. limit is 1-10000 (default 10), offset starts at 0, intents optionally filters by intent names (comma-separated).",
        input: object({ limit: number().optional(), offset: number().optional(), intents: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/utterances", input),
    ),
    createUtterances: mutation(
      {
        description:
          "Add training utterances (limit 200 per minute). Each item has text, an optional intent name, and entities and traits annotations exactly as in the Wit.ai API: entities as {entity: \"name:role\", start, end, body, entities: []}, traits as {trait, value}. Pass [] for none.",
        input: object({
          utterances: array(object({ text: string(), intent: string().optional(), entities: array(json()), traits: array(json()) })),
        }),
        approval: always(),
      },
      async ({ fetch }, { utterances }) => send(fetch, "POST", "/utterances", utterances),
    ),
    deleteUtterances: mutation(
      {
        description: "Delete training utterances by their exact text.",
        input: object({ texts: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { texts }) =>
        send(fetch, "DELETE", "/utterances", texts.map((text) => ({ text }))),
    ),
    listVoices: query(
      { description: "List the text-to-speech voices available, grouped by locale.", input: object({}) },
      async ({ fetch }) => get(fetch, "/voices"),
    ),
    getVoice: query(
      { description: "Get one text-to-speech voice by name, with its styles and supported locales.", input: object({ voice: string() }) },
      async ({ fetch }, { voice }) => get(fetch, `/voices/${enc(voice)}`),
    ),
  });
};

export default defineApp(
  { user: { accounts: { witai: witai.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.witai ?? [], (account) => witaiTools(account, signal), { signal }),
      {
        title: "Wit.ai",
        description: "Meta's Wit.ai natural language platform: parse text into intents, entities and traits, and manage apps, training utterances, traits and voices.",
        icons,
      },
    ),
  }),
);
