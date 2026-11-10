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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://needle.app/api/v1";

const models = ["basilikum-minima", "mate-meta", "tortellini-maxima"];
const contentTypes = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/calendar",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

const needle = defineProvider({
  name: "Needle",
  hosts: ["needle.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/collections`, {
      signal,
      headers: { authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
  "content-type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const id = (value: string) => encodeURIComponent(value);

const needleTools = (account: Account, signal: AbortSignal) =>
  router({
    listCollections: query(
      {
        description: "List your Needle collections with id, name, creation time and number of search queries.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/collections`, { signal, headers: headers(account) }), json()),
    ),
    getCollection: query(
      {
        description: "Get one collection's details (id, name, created_at, search_queries).",
        input: object({ collectionId: string() }),
      },
      async ({ fetch }, { collectionId }) =>
        decodeJson(await fetch(`${base}/collections/${id(collectionId)}`, { signal, headers: headers(account) }), json()),
    ),
    getCollectionStats: query(
      {
        description:
          "Get a collection's statistics: users, chunk count, character count and per-status (pending, indexed, error) file counts and bytes.",
        input: object({ collectionId: string() }),
      },
      async ({ fetch }, { collectionId }) =>
        decodeJson(
          await fetch(`${base}/collections/${id(collectionId)}/stats`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listCollectionFiles: query(
      {
        description:
          "List the files in a collection with id, name, size, content type and timestamps. limit is at most 500; use offset to page.",
        input: object({ collectionId: string(), offset: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { collectionId, ...paging }) =>
        decodeJson(
          await fetch(`${base}/collections/${id(collectionId)}/files${search(paging)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    searchCollection: query(
      {
        description:
          "Semantic search over one collection. Returns matching chunks (id, content, file_id) ranked by relevance. top_k is the number of results; offset skips results.",
        input: object({
          collectionId: string(),
          text: string(),
          top_k: number().optional(),
          offset: number().optional(),
        }),
      },
      async ({ fetch }, { collectionId, ...body }) =>
        decodeJson(
          await fetch(`${base}/collections/${id(collectionId)}/search`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    getFileUploadUrls: query(
      {
        description:
          "Get signed upload URLs, one per content type given. Allowed content types: " + contentTypes.join(", ") + ". PUT the file bytes to upload_url, then pass the returned url to addFilesToCollection.",
        input: object({ contentTypes: array(string()) }),
      },
      async ({ fetch }, { contentTypes: requested }) => {
        const bad = requested.filter((type) => !contentTypes.includes(type));
        if (bad.length > 0 || requested.length === 0)
          throw new Error(`contentTypes must be a non-empty list of: ${contentTypes.join(", ")}`);
        const params = new URLSearchParams();
        for (const type of requested) params.append("content_type", type);
        return decodeJson(
          await fetch(`${base}/files/upload_url?${params.toString()}`, { signal, headers: headers(account) }),
          json(),
        );
      },
    ),
    getFileDownloadUrl: query(
      {
        description: "Get a signed download URL for a file by its id.",
        input: object({ fileId: string() }),
      },
      async ({ fetch }, { fileId }) =>
        decodeJson(await fetch(`${base}/files/${id(fileId)}/download_url`, { signal, headers: headers(account) }), json()),
    ),
    listConnectors: query(
      {
        description:
          "List your data connectors (web, local, Google Drive, Slack, GitHub and others) with type, status, schedule and any error.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/connectors`, { signal, headers: headers(account) }), json()),
    ),
    createCollection: mutation(
      {
        description:
          "Create a collection. model is one of basilikum-minima (default), mate-meta, tortellini-maxima (other values are rejected). file_ids optionally seeds it with existing files.",
        input: object({
          name: string({ minLength: 1 }),
          model: string().optional(),
          file_ids: array(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) => {
        if (input.model !== undefined && !models.includes(input.model))
          throw new Error(`model must be one of: ${models.join(", ")}`);
        return decodeJson(
          await fetch(`${base}/collections`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        );
      },
    ),
    addFilesToCollection: mutation(
      {
        description:
          "Add files to a collection by URL (publicly reachable, or a url from getFileUploadUrls). Each file needs a name and url. Indexing is asynchronous; check getCollectionStats.",
        input: object({
          collectionId: string(),
          files: array(object({ name: string(), url: string() })),
        }),
        approval: always(),
      },
      async ({ fetch }, { collectionId, files }) =>
        decodeJson(
          await fetch(`${base}/collections/${id(collectionId)}/files`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify({ files }),
          }),
          json(),
        ),
    ),
    deleteCollectionFiles: mutation(
      {
        description: "Remove files from a collection by id (1-100 per call).",
        input: object({ collectionId: string(), file_ids: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { collectionId, file_ids }) => {
        if (file_ids.length < 1 || file_ids.length > 100) throw new Error("file_ids must contain 1 to 100 ids");
        const response = await fetch(`${base}/collections/${id(collectionId)}/files`, {
          method: "DELETE",
          signal,
          headers: headers(account),
          body: JSON.stringify({ file_ids }),
        });
        if (response.status === 204) return { deleted: file_ids.length };
        return decodeJson(response, json());
      },
    ),
  });

export default defineApp({ user: { accounts: { needle: needle.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.needle ?? [], (account) => needleTools(account, signal), { signal }), {
    title: "Needle",
    description:
      "Manage Needle RAG collections, files and connectors, and run semantic search over your indexed documents.",
    icons,
  }),
}));
