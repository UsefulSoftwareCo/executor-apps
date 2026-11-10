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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.cosmicjs.com/v3";

type Fields = { bucket_slug: string; read_key: string; write_key: string };
type Params = Record<string, unknown>;

const cosmic = defineProvider({
  name: "Cosmic",
  hosts: ["api.cosmicjs.com"],
  auth: {
    // Bucket keys come from Bucket Settings > API Access in the Cosmic dashboard.
    apiKey: secrets({
      label: "Bucket keys",
      fields: object({
        bucket_slug: string({ minLength: 1 }),
        read_key: string({ minLength: 1 }),
        write_key: string({ minLength: 1 }),
      }),
    }),
  },
  // Cosmic has no whoami endpoint for bucket keys; listing one object type is the lightest authenticated read.
  async health({ account, fetch, signal }) {
    const f = account.fields;
    const url = `${api}/buckets/${encodeURIComponent(f.bucket_slug)}/object-types?read_key=${encodeURIComponent(f.read_key)}`;
    const response = await fetch(url, { signal });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: f.bucket_slug, displayName: f.bucket_slug } };
  },
});

function buildTools(f: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = `${api}/buckets/${encodeURIComponent(f.bucket_slug)}`;
  const call = async (method: string, path: string, search: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const read = method === "GET";
    if (read) url.searchParams.set("read_key", f.read_key);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        ...(read ? {} : { Authorization: `Bearer ${f.write_key}` }),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
  const id = (v: unknown) => encodeURIComponent(String(v));
  const listInput = {
    query: record(json()).optional(),
    props: string().optional(),
    limit: number().optional(),
    skip: number().optional(),
    sort: string().optional(),
  };

  return router({
    objects: router({
      list: query(
        {
          description:
            "List objects. query is a Cosmic JSON filter (e.g. {\"type\":\"posts\"}); props picks fields (comma separated); sort e.g. -created_at; status is published, draft or any; depth resolves relationships.",
          input: object({ ...listInput, status: string().optional(), depth: number().optional(), after: string().optional() }),
        },
        (_c, a) => call("GET", "/objects", a),
      ),
      get: query(
        {
          description: "Get one object by id.",
          input: object({ id: string(), props: string().optional(), status: string().optional(), depth: number().optional() }),
        },
        (_c, { id: i, ...rest }) => call("GET", `/objects/${id(i)}`, rest),
      ),
      create: mutation(
        {
          description: "Create an object. Requires title and type (object type slug); metadata holds the metafield values.",
          input: object({ title: string(), type: string(), slug: string().optional(), status: string().optional(), metadata: record(json()).optional() }),
        },
        (_c, a) => call("POST", "/objects", {}, a),
      ),
      update: mutation(
        {
          description: "Update an object's title, slug, status (published or draft), metadata or thumbnail.",
          input: object({
            id: string(),
            title: string().optional(),
            slug: string().optional(),
            status: string().optional(),
            thumbnail: string().optional(),
            metadata: record(json()).optional(),
          }),
        },
        (_c, { id: i, ...body }) => call("PATCH", `/objects/${id(i)}`, {}, body),
      ),
      delete: mutation(
        { description: "Delete an object by id.", input: object({ id: string() }) },
        (_c, a) => call("DELETE", `/objects/${id(a.id)}`, {}),
      ),
      batch: mutation(
        {
          description:
            "Run up to 25 operations. Each operation has method (add, edit or delete), object_id (edit/delete) and object (add/edit).",
          input: object({ operations: json() }),
        },
        (_c, a) => call("POST", "/objects/batch", {}, a),
      ),
    }),
    revisions: router({
      list: query(
        { description: "List revisions of an object.", input: object({ object_id: string() }) },
        (_c, a) => call("GET", `/objects/${id(a.object_id)}/revisions`, {}),
      ),
      get: query(
        { description: "Get one revision of an object.", input: object({ object_id: string(), revision_id: string() }) },
        (_c, a) => call("GET", `/objects/${id(a.object_id)}/revisions/${id(a.revision_id)}`, {}),
      ),
      create: mutation(
        {
          description: "Add a draft revision to an object with title, slug or metadata changes.",
          input: object({ object_id: string(), title: string().optional(), slug: string().optional(), metadata: record(json()).optional() }),
        },
        (_c, { object_id, ...body }) => call("POST", `/objects/${id(object_id)}/revisions`, {}, body),
      ),
    }),
    objectTypes: router({
      list: query({ description: "List object types.", input: object({ props: string().optional() }) }, (_c, a) =>
        call("GET", "/object-types", a),
      ),
      get: query({ description: "Get an object type by slug.", input: object({ slug: string() }) }, (_c, a) =>
        call("GET", `/object-types/${id(a.slug)}`, {}),
      ),
      create: mutation(
        {
          description: "Create an object type. Needs title, slug and metafields (array of field definitions); optional singular, emoji.",
          input: object({ title: string(), slug: string(), singular: string().optional(), emoji: string().optional(), metafields: json().optional() }),
        },
        (_c, a) => call("POST", "/object-types", {}, a),
      ),
      update: mutation(
        {
          description: "Update an object type's title, singular, emoji or metafields.",
          input: object({ slug: string(), title: string().optional(), singular: string().optional(), emoji: string().optional(), metafields: json().optional() }),
        },
        (_c, { slug, ...body }) => call("PATCH", `/object-types/${id(slug)}`, {}, body),
      ),
      delete: mutation(
        { description: "Delete an object type by slug. Deletes its objects too.", input: object({ slug: string() }) },
        (_c, a) => call("DELETE", `/object-types/${id(a.slug)}`, {}),
      ),
    }),
    media: router({
      list: query({ description: "List media files.", input: object(listInput) }, (_c, a) => call("GET", "/media", a)),
      get: query({ description: "Get one media file by id.", input: object({ id: string() }) }, (_c, a) =>
        call("GET", "/media", { query: { id: a.id }, limit: 1 }),
      ),
      update: mutation(
        {
          description: "Update a media file's metadata (alt_text, folder, metadata).",
          input: object({ id: string(), alt_text: string().optional(), folder: string().optional(), metadata: record(json()).optional() }),
        },
        (_c, { id: i, ...body }) => call("PATCH", `/media/${id(i)}`, {}, body),
      ),
      delete: mutation(
        { description: "Delete a media file by id.", input: object({ id: string() }) },
        (_c, a) => call("DELETE", `/media/${id(a.id)}`, {}),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { cosmic: cosmic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cosmic ?? [],
        (account) =>
          withApprovals(buildTools(account.fields, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Cosmic",
        description: "Manage a Cosmic headless CMS bucket: objects, object types, media and revisions.",
        icons,
      },
    ),
  }),
);
