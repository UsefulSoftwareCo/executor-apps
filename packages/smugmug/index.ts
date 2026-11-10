import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  raw,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.smugmug.com";

const smugmug = defineProvider({
  name: "SmugMug",
  hosts: ["api.smugmug.com"],
  auth: {
    // SmugMug has no OAuth 2 and no bearer tokens. Public data needs only the API key.
    apiKey: secrets({
      label: "API key (public, read-only)",
      fields: object({ key: raw(string({ minLength: 1 })) }),
    }),
    // OAuth 1.0a: the user completes the flow once with their own API key and keeps the access token.
    oauth1: secrets({
      label: "OAuth 1.0a credentials",
      fields: object({
        consumerKey: raw(string({ minLength: 1 })),
        consumerSecret: raw(string({ minLength: 1 })),
        accessToken: raw(string({ minLength: 1 })),
        accessTokenSecret: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    // The API key alone cannot read !authuser, so it checks the public API root instead.
    const path = account.method === "apiKey" ? `/api/v2?APIKey=${encodeURIComponent(account.fields.key)}` : "/api/v2!authuser";
    const response = await fetch(`${origin}${path}`, { signal, ...authorize(account) });
    if (account.method === "oauth1") {
      const { Response } = await decodeJson(response, object({ Response: object({ User: object({ NickName: string() }) }) }));
      return { accountInfo: { externalId: Response.User.NickName, displayName: Response.User.NickName } };
    }
    await decodeJson(response, object({ Response: object({ Uri: string() }) }));
  },
});

type Credentials =
  | { method: "apiKey"; fields: { key: string } }
  | { method: "oauth1"; fields: { consumerKey: string; consumerSecret: string; accessToken: string; accessTokenSecret: string } };

const pct = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// PLAINTEXT signatures are allowed over https only; the signature is "consumerSecret&tokenSecret".
function authorize(account: Credentials): { headers: Record<string, string> } {
  if (account.method === "apiKey") return { headers: { Accept: "application/json" } };
  const f = account.fields;
  const params: Record<string, string> = {
    oauth_consumer_key: f.consumerKey,
    oauth_token: f.accessToken,
    oauth_signature_method: "PLAINTEXT",
    oauth_signature: `${pct(f.consumerSecret)}&${pct(f.accessTokenSecret)}`,
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_version: "1.0",
  };
  const header = "OAuth " + Object.entries(params).map(([k, v]) => `${k}="${pct(v)}"`).join(", ");
  return { headers: { Accept: "application/json", Authorization: header } };
}

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(account: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${origin}${path}`);
    if (url.origin !== origin || (url.pathname !== "/api/v2" && !url.pathname.startsWith("/api/v2/") && !url.pathname.startsWith("/api/v2!")) || path.split(/[/?#]/).some((part) => part === ".." || part.toLowerCase() === "%2e%2e"))
      throw new Error("path must be under /api/v2 and contain no '..' segments");
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    if (account.method === "apiKey") url.searchParams.set("APIKey", account.fields.key);
    const signed = authorize(account);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { ...signed.headers, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

// Tools take path ids (all strings), `query` for URL parameters such as start, count, _expand and _filter, and `body` for writes.
function read(call: Call, path: string, description: string, ids: readonly string[] = []) {
  return query(
    { description, input: object({ ...Object.fromEntries(ids.map((id) => [id, string()])), query: filters }) },
    async (_ctx, input: Params) => call("GET", fill(path, input, ids), (input.query as Params | undefined) ?? {}),
  );
}

function write(call: Call, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], body: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(body === "optional" ? { body: optionalPayload } : body ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) =>
      call(method, fill(path, input, ids), (input.query as Params | undefined) ?? {}, body ? (input.body as Params | undefined) : undefined),
  );
}

function fill(path: string, input: Params, ids: readonly string[]) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return resolved;
}

function build(call: Call) {
  const reads = {
    authuser: query({ description: "The authenticated user, with URIs for their node, albums and folders. Needs OAuth credentials.", input: object({}) }, async () =>
      call("GET", "/api/v2!authuser"),
    ),
    api: query({ description: "API root: lists the top-level endpoints.", input: object({}) }, async () => call("GET", "/api/v2")),
    request: query(
      {
        description:
          "GET any SmugMug API v2 path, for example /api/v2/user/cmac!albums or /api/v2/album/SJT3DX!images. Operation suffixes use '!'. query holds URL parameters.",
        input: object({ path: string(), query: filters }),
      },
      async (_ctx, input: { path: string; query?: Params }) => call("GET", input.path, input.query ?? {}),
    ),
  };
  const users = router(
    {
      get: read(call, "/api/v2/user/{nickname}", "Retrieve a user by nickname.", ["nickname"]),
      profile: read(call, "/api/v2/user/{nickname}!profile", "A user's public profile.", ["nickname"]),
      rootNode: read(call, "/api/v2/user/{nickname}!node", "A user's root node, the top of their folder and album tree.", ["nickname"]),
      folders: read(call, "/api/v2/folder/user/{nickname}", "A user's root folder.", ["nickname"]),
    },
    { title: "Users", description: "Users, profiles and their top-level content." },
  );
  const nodes = router(
    {
      get: read(call, "/api/v2/node/{nodeId}", "Retrieve a node (folder, album or page).", ["nodeId"]),
      children: read(call, "/api/v2/node/{nodeId}!children", "List a node's children. Paginate with query start and count.", ["nodeId"]),
      parents: read(call, "/api/v2/node/{nodeId}!parents", "List a node's ancestors up to the root.", ["nodeId"]),
    },
    { title: "Nodes", description: "The folder and album tree." },
  );
  const albums = router(
    {
      get: read(call, "/api/v2/album/{albumKey}", "Retrieve an album.", ["albumKey"]),
      images: read(call, "/api/v2/album/{albumKey}!images", "List the images in an album. Paginate with query start and count; use _expand=ImageSizes for URLs.", ["albumKey"]),
      highlightImage: read(call, "/api/v2/album/{albumKey}!highlightimage", "An album's highlight (cover) image.", ["albumKey"]),
      image: read(call, "/api/v2/album/{albumKey}/image/{imageKey}", "An image in the context of an album.", ["albumKey", "imageKey"]),
    },
    { title: "Albums", description: "Albums and the images inside them." },
  );
  const images = router(
    {
      get: read(call, "/api/v2/image/{imageKey}", "Retrieve an image or video.", ["imageKey"]),
      sizeDetails: read(call, "/api/v2/image/{imageKey}!sizedetails", "Detailed size information for an image.", ["imageKey"]),
      metadata: read(call, "/api/v2/image/{imageKey}!metadata", "EXIF and other metadata for an image.", ["imageKey"]),
    },
    { title: "Images", description: "Photos and videos." },
  );
  const folderPath = "/api/v2/folder/user/{nickname}";
  return router({
    ...reads,
    users,
    nodes,
    albums,
    images,
    manage: router(
      {
        createAlbum: write(call, "POST", `${folderPath}!albums`, "Create an album in a user's root folder. body: Name, UrlName (starts with a capital letter), Privacy (Public, Unlisted, Private) and other fields from the API docs.", ["nickname"]),
        createFolder: write(call, "POST", `${folderPath}!folders`, "Create a folder in a user's root folder. body: Name, UrlName, Privacy.", ["nickname"]),
        createChildNode: write(call, "POST", "/api/v2/node/{nodeId}!children", "Create a folder, album or page under a node. body: Type (Folder, Album, Page), Name, UrlName, Privacy.", ["nodeId"]),
        updateNode: write(call, "PATCH", "/api/v2/node/{nodeId}", "Update a node. body holds the fields to change.", ["nodeId"]),
        deleteNode: write(call, "DELETE", "/api/v2/node/{nodeId}", "Delete a node, and with it every album and image beneath it.", ["nodeId"], false),
        updateAlbum: write(call, "PATCH", "/api/v2/album/{albumKey}", "Update an album's settings. body holds the fields to change.", ["albumKey"]),
        deleteAlbum: write(call, "DELETE", "/api/v2/album/{albumKey}", "Delete an album and its images.", ["albumKey"], false),
        updateAlbumImage: write(call, "PATCH", "/api/v2/album/{albumKey}/image/{imageKey}", "Update an image as it appears in an album (title, caption, keywords). body holds the fields to change.", ["albumKey", "imageKey"]),
        removeAlbumImage: write(call, "DELETE", "/api/v2/album/{albumKey}/image/{imageKey}", "Remove an image from an album.", ["albumKey", "imageKey"], false),
        updateImage: write(call, "PATCH", "/api/v2/image/{imageKey}", "Update an image's title, caption, keywords or hidden state. body holds the fields to change.", ["imageKey"]),
        deleteImage: write(call, "DELETE", "/api/v2/image/{imageKey}", "Delete an image.", ["imageKey"], false),
      },
      { title: "Manage", description: "Create, update and delete folders, albums and images. Requires OAuth credentials with Modify permission." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { smugmug: smugmug.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.smugmug ?? [],
        (account) =>
          withApprovals(build(client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "SmugMug",
        description:
          "Photo hosting: users, folders and albums (nodes), images and videos. Operation suffixes in paths use '!'. Writes need OAuth 1.0a credentials; an API key alone reads public data.",
        icons,
      },
    ),
  }),
);
