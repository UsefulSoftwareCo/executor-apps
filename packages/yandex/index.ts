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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const disk = "https://cloud-api.yandex.net/v1/disk";
const metrica = "https://api-metrika.yandex.net";

const LoginInfo = object({ id: string(), login: string() });

const yandex = defineProvider({
  name: "Yandex",
  hosts: ["cloud-api.yandex.net", "api-metrika.yandex.net", "login.yandex.ru"],
  auth: {
    token: secrets({
      label: "OAuth token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Yandex has no client registration: the connect page asks for an OAuth app's client id and secret.
    oauth: oauth2({
      authorizationUrl: "https://oauth.yandex.com/authorize",
      tokenUrl: "https://oauth.yandex.com/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "login:info",
        "cloud_api:disk.info",
        "cloud_api:disk.read",
        "cloud_api:disk.write",
        "metrika:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://login.yandex.ru/info?format=json", {
      signal,
      headers: { Authorization: `OAuth ${token}` },
    });
    const me = await decodeJson(response, LoginInfo);
    return { accountInfo: { externalId: me.id, username: me.login, displayName: me.login } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, base: string, path: string, params: Params = {}, body?: unknown) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    const qs = search.toString();
    const response = await fetcher(`${base}${path}${qs === "" ? "" : `?${qs}`}`, {
      method,
      signal,
      headers: {
        Authorization: `OAuth ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Yandex answered ${response.status}: ${text.slice(0, 1000)}`);
    // Disk answers 202 with an operation link for slow work and 204 with no body for quick work.
    return text === "" ? { ok: true, status: response.status } : (JSON.parse(text) as unknown);
  };
  const d = (method: string, path: string, params?: Params, body?: unknown) => call(method, disk, path, params, body);
  const m = (method: string, path: string, params?: Params, body?: unknown) =>
    call(method, metrica, path, params, body);

  const path = string({ minLength: 1 });
  const fields = string().optional();
  const page = { limit: number().optional(), offset: number().optional() };
  const counterId = number();

  return router({
    account: router(
      {
        info: query(
          {
            description: "The connected Yandex ID profile (login, name, default email). Needs the login:info scope.",
            input: object({}),
          },
          async () => call("GET", "https://login.yandex.ru", "/info", { format: "json" }),
        ),
      },
      { title: "Account", description: "The connected Yandex ID profile." },
    ),
    disk: router(
      {
        info: query(
          {
            description: "Disk quota (total_space, used_space, trash_size) and the paths of the system folders.",
            input: object({ fields }),
          },
          async (_ctx, i) => d("GET", "", { fields: i.fields }),
        ),
        list: query(
          {
            description:
              'Metadata of a file or folder; for a folder, its children in _embedded.items. path is like "disk:/Photos" or "/Photos" ("/" is the root); app folder paths start with "app:/". sort is name, path, created, modified, size (prefix - to reverse).',
            input: object({ path, ...page, sort: string().optional(), fields }),
          },
          async (_ctx, i) =>
            d("GET", "/resources", { path: i.path, limit: i.limit, offset: i.offset, sort: i.sort, fields: i.fields }),
        ),
        listFiles: query(
          {
            description:
              "A flat list of all files on the disk in alphabetical order. mediaType filters by kind, a comma list of: audio, backup, book, compressed, data, development, diskimage, document, encoded, executable, flash, font, image, settings, spreadsheet, text, unknown, video, web.",
            input: object({ ...page, mediaType: string().optional(), sort: string().optional(), fields }),
          },
          async (_ctx, i) =>
            d("GET", "/resources/files", {
              limit: i.limit,
              offset: i.offset,
              media_type: i.mediaType,
              sort: i.sort,
              fields: i.fields,
            }),
        ),
        lastUploaded: query(
          {
            description: "The most recently uploaded files, newest first.",
            input: object({ limit: number().optional(), mediaType: string().optional(), fields }),
          },
          async (_ctx, i) =>
            d("GET", "/resources/last-uploaded", { limit: i.limit, media_type: i.mediaType, fields: i.fields }),
        ),
        downloadLink: query(
          {
            description:
              "A temporary direct download URL (href) for a file. Fetch it without credentials; Executor tools do not stream binaries.",
            input: object({ path }),
          },
          async (_ctx, { path }) => d("GET", "/resources/download", { path }),
        ),
        uploadLink: query(
          {
            description:
              "A temporary URL to which a file can be sent with PUT (href, method). Another client performs the upload; overwrite replaces an existing file.",
            input: object({ path, overwrite: boolean().optional() }),
          },
          async (_ctx, i) => d("GET", "/resources/upload", { path: i.path, overwrite: i.overwrite }),
        ),
        operationStatus: query(
          {
            description:
              "Status (success, failed, in-progress) of an asynchronous operation. operationId is the last segment of the href returned by copy, move, delete or uploadFromUrl.",
            input: object({ operationId: string({ minLength: 1 }) }),
          },
          async (_ctx, { operationId }) => d("GET", `/operations/${encodeURIComponent(operationId)}`),
        ),
        createFolder: mutation(
          {
            description: "Create a folder. Parent folders must already exist; fails with 409 if the path exists.",
            input: object({ path }),
            approval: always(),
          },
          async (_ctx, { path }) => d("PUT", "/resources", { path }),
        ),
        copy: mutation(
          {
            description: "Copy a file or folder. Slow copies return an operation link; poll disk.operationStatus.",
            input: object({ from: path, path, overwrite: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) => d("POST", "/resources/copy", { from: i.from, path: i.path, overwrite: i.overwrite }),
        ),
        move: mutation(
          {
            description: "Move or rename a file or folder. Slow moves return an operation link; poll disk.operationStatus.",
            input: object({ from: path, path, overwrite: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) => d("POST", "/resources/move", { from: i.from, path: i.path, overwrite: i.overwrite }),
        ),
        delete: mutation(
          {
            description:
              "Delete a file or folder. By default it goes to the trash; permanently true deletes it for good, which cannot be undone.",
            input: object({ path, permanently: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) => d("DELETE", "/resources", { path: i.path, permanently: i.permanently }),
        ),
        uploadFromUrl: mutation(
          {
            description: "Have Yandex Disk download a file from a public URL into path. Returns an operation link.",
            input: object({ url: string({ minLength: 1 }), path }),
            approval: always(),
          },
          async (_ctx, i) => d("POST", "/resources/upload", { url: i.url, path: i.path }),
        ),
        setCustomProperties: mutation(
          {
            description:
              "Set or remove custom metadata on a resource. properties is an object of string keys to values; a null value deletes the key.",
            input: object({ path, properties: json() }),
            approval: always(),
          },
          async (_ctx, i) => d("PATCH", "/resources", { path: i.path }, { custom_properties: i.properties }),
        ),
      },
      { title: "Disk", description: "Browse, copy, move, delete and share files and folders on Yandex Disk." },
    ),
    sharing: router(
      {
        listPublished: query(
          {
            description: "Files and folders the user has published (public links).",
            input: object({ ...page, type: string().optional(), fields }),
          },
          async (_ctx, i) =>
            d("GET", "/resources/public", { limit: i.limit, offset: i.offset, type: i.type, fields: i.fields }),
        ),
        publicResource: query(
          {
            description:
              "Metadata of a public resource by its public_key or public URL; path selects an item inside a published folder.",
            input: object({ publicKey: string({ minLength: 1 }), path: string().optional(), ...page }),
          },
          async (_ctx, i) =>
            d("GET", "/public/resources", {
              public_key: i.publicKey,
              path: i.path,
              limit: i.limit,
              offset: i.offset,
            }),
        ),
        publicDownloadLink: query(
          {
            description: "A temporary download URL for a public file or for a file inside a public folder.",
            input: object({ publicKey: string({ minLength: 1 }), path: string().optional() }),
          },
          async (_ctx, i) => d("GET", "/public/resources/download", { public_key: i.publicKey, path: i.path }),
        ),
        publish: mutation(
          {
            description: "Publish a file or folder: makes it reachable by anyone with the public link.",
            input: object({ path }),
            approval: always(),
          },
          async (_ctx, { path }) => d("PUT", "/resources/publish", { path }),
        ),
        unpublish: mutation(
          {
            description: "Unpublish a file or folder, revoking its public link.",
            input: object({ path }),
            approval: always(),
          },
          async (_ctx, { path }) => d("PUT", "/resources/unpublish", { path }),
        ),
        updatePublicSettings: mutation(
          {
            description:
              "Change the public-link settings of a published resource (UpdatePublicSettings). settings is the request body: { accesses?, available_until?: { enabled, value }, password?: { enabled, value } }.",
            input: object({ path, settings: json(), fields }),
            approval: always(),
          },
          async (_ctx, i) =>
            d("PATCH", "/public/resources/public-settings", { path: i.path, fields: i.fields }, i.settings),
        ),
        saveToDisk: mutation(
          {
            description:
              "Copy a public resource into the user's Downloads folder, or name it with name and place it under savePath.",
            input: object({
              publicKey: string({ minLength: 1 }),
              path: string().optional(),
              name: string().optional(),
              savePath: string().optional(),
            }),
            approval: always(),
          },
          async (_ctx, i) =>
            d("POST", "/public/resources/save-to-disk", {
              public_key: i.publicKey,
              path: i.path,
              name: i.name,
              save_path: i.savePath,
            }),
        ),
      },
      { title: "Sharing", description: "Public links to Disk files and folders." },
    ),
    trash: router(
      {
        list: query(
          {
            description: 'Contents of the trash. path is "trash:/" for the top level or a trashed folder.',
            input: object({ path: string().default("/"), ...page, sort: string().optional(), fields }),
          },
          async (_ctx, i) =>
            d("GET", "/trash/resources", {
              path: i.path,
              limit: i.limit,
              offset: i.offset,
              sort: i.sort,
              fields: i.fields,
            }),
        ),
        restore: mutation(
          {
            description: "Restore a trashed item. name renames it on restore; overwrite replaces an existing file.",
            input: object({ path, name: string().optional(), overwrite: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, i) =>
            d("PUT", "/trash/resources/restore", { path: i.path, name: i.name, overwrite: i.overwrite }),
        ),
        empty: mutation(
          {
            description:
              "Permanently delete one trashed item by path, or empty the whole trash when path is omitted. This cannot be undone.",
            input: object({ path: string().optional() }),
            approval: always(),
          },
          async (_ctx, i) => d("DELETE", "/trash/resources", { path: i.path }),
        ),
      },
      { title: "Trash", description: "List, restore and permanently delete trashed Disk items." },
    ),
    metrica: router(
      {
        counters: query(
          {
            description: "Yandex Metrica counters (sites) the user can access.",
            input: object({ ...{ perPage: number().optional() }, search: string().optional(), status: string().optional() }),
          },
          async (_ctx, i) =>
            m("GET", "/management/v1/counters", { per_page: i.perPage, search_string: i.search, status: i.status }),
        ),
        counter: query(
          {
            description: "Settings of one Metrica counter.",
            input: object({ counterId }),
          },
          async (_ctx, { counterId }) => m("GET", `/management/v1/counter/${counterId}`),
        ),
        goals: query(
          { description: "Goals configured on a counter.", input: object({ counterId }) },
          async (_ctx, { counterId }) => m("GET", `/management/v1/counter/${counterId}/goals`),
        ),
        filters: query(
          { description: "Data filters configured on a counter.", input: object({ counterId }) },
          async (_ctx, { counterId }) => m("GET", `/management/v1/counter/${counterId}/filters`),
        ),
        grants: query(
          { description: "Access grants (who can view or edit) on a counter.", input: object({ counterId }) },
          async (_ctx, { counterId }) => m("GET", `/management/v1/counter/${counterId}/grants`),
        ),
        operations: query(
          { description: "Operations (data transformation rules) configured on a counter.", input: object({ counterId }) },
          async (_ctx, { counterId }) => m("GET", `/management/v1/counter/${counterId}/operations`),
        ),
        statistics: query(
          {
            description:
              'Report data from the Metrica Reporting API. metrics and dimensions are comma lists such as "ym:s:visits,ym:s:users" and "ym:s:date"; date1/date2 accept YYYY-MM-DD, "today", "yesterday" or "NdaysAgo".',
            input: object({
              ids: array(number()),
              metrics: string({ minLength: 1 }),
              dimensions: string().optional(),
              date1: string().optional(),
              date2: string().optional(),
              filters: string().optional(),
              sort: string().optional(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          async (_ctx, i) =>
            m("GET", "/stat/v1/data", {
              ids: i.ids.join(","),
              metrics: i.metrics,
              dimensions: i.dimensions,
              date1: i.date1,
              date2: i.date2,
              filters: i.filters,
              sort: i.sort,
              limit: i.limit,
              offset: i.offset,
            }),
        ),
      },
      { title: "Metrica", description: "Yandex Metrica counters, goals, filters, grants and reports (read only)." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { yandex: yandex.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.yandex ?? [],
        (account) =>
          tools(account.method === "oauth" ? account.fields.access_token : account.fields.token, fetch, signal),
        { signal },
      ),
      {
        title: "Yandex",
        description:
          "Yandex Disk files, folders, public links and trash, plus read access to Yandex Metrica counters and reports.",
        icons,
      },
    ),
  }),
);
