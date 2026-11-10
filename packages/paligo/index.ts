import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Paligo instance lives at https://<instance>.paligoapp.com.
const instancePattern = /^[a-z0-9][a-z0-9-]*$/;

function origin(account: { fields: { instance: string } }) {
  const name = account.fields.instance
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.paligoapp\.com.*$/, "")
    .replace(/\/.*$/, "");
  if (!instancePattern.test(name))
    throw new Error("Enter your Paligo instance name, for example mycompany for https://mycompany.paligoapp.com.");
  return `https://${name}.paligoapp.com`;
}

function authorization(account: { fields: { username: string; token: string } }) {
  return `Basic ${btoa(`${account.fields.username}:${account.fields.token}`)}`;
}

const fields = object({
  instance: plain(string({ minLength: 1 })),
  username: plain(string({ minLength: 1 })),
  token: string({ minLength: 1 }),
});

const paligo = defineProvider({
  name: "Paligo",
  hosts: ["*.paligoapp.com"],
  auth: {
    apiKey: secrets({ label: "Username and API key", fields }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/v2/groups?page=1&per_page=1`, {
      signal,
      headers: { Authorization: authorization(account), Accept: "application/json" },
    });
    await decodeJson(response, object({ page: number() }));
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname, username: account.fields.username } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, auth: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}/api/v2${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    const send = () =>
      fetcher(url.toString(), {
        method,
        signal,
        headers: {
          Authorization: auth,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    // Limits are per minute; Retry-After says how long to wait. Retry a bounded number of times.
    let response = await send();
    for (let attempt = 0; attempt < 2 && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000, 30_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal?.throwIfAborted();
      response = await send();
    }
    if (response.status === 204 || (method === "DELETE" && response.ok && response.headers.get("content-length") === "0"))
      return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const idIn = () => string({ minLength: 1 });
const page = { page: number().optional(), per_page: number().optional() };

function build(call: Call) {
  const list = (path: string, description: string, extra: Record<string, ReturnType<typeof string> | ReturnType<typeof number>> = {}) =>
    query(
      { description, input: object({ ...page, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v.optional()])) }) },
      (_c, input) => call("GET", path, input as Params),
    );
  const get = (path: (id: string) => string, description: string) =>
    query({ description, input: object({ id: idIn() }) }, (_c, { id }) => call("GET", path(id)));
  const create = (path: string, description: string) =>
    mutation({ description, input: object({ body: json() }) }, (_c, { body }) => call("POST", path, {}, body));
  const update = (path: (id: string) => string, description: string) =>
    mutation({ description, input: object({ id: idIn(), body: json() }) }, (_c, { id, body }) =>
      call("PUT", path(id), {}, body),
    );
  const remove = (path: (id: string) => string, description: string) =>
    mutation({ description, input: object({ id: idIn() }) }, (_c, { id }) => call("DELETE", path(id)));

  const documents = router(
    {
      list: list(
        "/documents",
        "List documents (topics, publications) in a folder; defaults to the root Documents folder. XML content is not included. Filters: name, parent (folder id), creator/owner/author (user ids), checkout (true/false), created_start_at, created_end_at, modified_start_at, modified_end_at (unix timestamps).",
        {
          name: string(), parent: number(), creator: number(), owner: number(), author: number(), checkout: string(),
          created_start_at: number(), created_end_at: number(), modified_start_at: number(), modified_end_at: number(),
        },
      ),
      get: get((i) => `/documents/${seg(i)}`, "Get a document by id, including its XML content."),
      create: create(
        "/documents/",
        'Create a document. Body: {"parent": folderId, "name": "...", "content": "<xml/>", "subtype": "component", "custom_attributes": [{"name": "...", "value": "..."}]}.',
      ),
      update: update(
        (i) => `/documents/${seg(i)}`,
        "Update a document. Body fields: name, content (XML), checkout (bool, forces checkout), release_status (STATUS_NOT_RELEASED, STATUS_IN_TECHNICAL_REVIEW, STATUS_IN_TRANSLATION, STATUS_IN_RELEASE_REVIEW, STATUS_RELEASED), taxonomies (array of taxonomy ids), custom_attributes.",
      ),
      delete: remove((i) => `/documents/${seg(i)}`, "Delete a document."),
    },
    { title: "Documents", description: "Topics, components and publications, with their XML content." },
  );

  const forks = router(
    {
      list: list("/forks", "List forks (a document's placement in a publication or other document). parent is a fork id or document id.", { parent: number() }),
      get: query(
        { description: "Get a fork by id, with its child forks.", input: object({ id: idIn(), ...page }) },
        (_c, { id, ...p }) => call("GET", `/forks/${seg(id)}`, p),
      ),
      create: create("/forks/", 'Insert a document into a structure. Body: {"parent": forkOrDocumentId, "document": documentId, "position": optionalIndex}.'),
      delete: remove((i) => `/forks/${seg(i)}`, "Remove a fork from its structure."),
    },
    { title: "Forks", description: "Publication structure: where documents sit inside other documents." },
  );

  const folders = router(
    {
      list: list("/folders", "List folders under a parent folder; defaults to the root Documents folder.", { parent: number() }),
      get: query(
        { description: "Get a folder and its child folders.", input: object({ id: idIn(), parent: number().optional(), ...page }) },
        (_c, { id, ...p }) => call("GET", `/folders/${seg(id)}`, p),
      ),
      create: create("/folders/", 'Create a folder. Body: {"title": "...", "parent": folderId}; parent defaults to the root Documents folder.'),
    },
    { title: "Folders", description: "The Documents folder tree." },
  );

  const images = router(
    {
      list: list("/images", "List images in a media folder (default root Media folder). Filters: name, parent, size (pre, scr, lpr, hpr, icn, spr), variant.", { name: string(), parent: number(), size: string(), variant: string() }),
      get: get((i) => `/images/${seg(i)}`, "Get an image's metadata, including content_url."),
    },
    { title: "Images", description: "Media library images (metadata only; upload and download use multipart or binary responses and are not wrapped)." },
  );

  const search = router(
    {
      run: query(
        {
          description:
            'Search (beta). resource is documents, taxonomies or forks. where is an array of filters: {"operator": "equals"|"has"|"before"|"after"|"between"|"containsblockelement", "property": "...", "value"|"values"|"start"+"end": ...}. Dates are unix timestamps.',
          input: object({ resource: string({ minLength: 1 }), where: json().optional(), page: number().optional(), per_page: number().optional() }),
        },
        (_c, { resource, where, page: p, per_page }) => call("POST", "/search/", {}, { resource, where, page: p, per_page }),
      ),
    },
    { title: "Search", description: "Search documents, taxonomies and forks (read-only; the API uses POST)." },
  );

  const taxonomies = router(
    {
      list: list("/taxonomies/", "List taxonomies; without parent, lists root-level ones. Filters: title, color (0-4), parent.", { title: string(), color: number(), parent: number() }),
      get: get((i) => `/taxonomies/${seg(i)}/`, "Get a taxonomy by id."),
      create: create("/taxonomies/", 'Create a taxonomy. Body: {"title": "...", "color": 0-4, "parent": taxonomyId}.'),
      update: update((i) => `/taxonomies/${seg(i)}/`, "Update a taxonomy (title, color, parent)."),
      delete: mutation(
        { description: "Delete a taxonomy; force also deletes its sub-taxonomies.", input: object({ id: idIn(), force: string().optional() }) },
        (_c, { id, force }) => call("DELETE", `/taxonomies/${seg(id)}/`, { force }),
      ),
    },
    { title: "Taxonomies", description: "Tags used to classify documents." },
  );

  const productions = router(
    {
      list: list("/productions/", "List productions (publish runs)."),
      get: get((i) => `/productions/${seg(i)}`, "Get a production's status; a completed production reports the output name."),
      create: create("/productions/", 'Start a production. Body: {"publishsetting": "<saved publish setting id>"}.'),
      cancel: remove((i) => `/productions/${seg(i)}`, "Cancel a running or pending production (409 if it is neither)."),
      publishSettings: list("/publishsettings/", "List saved publish settings. Filters: format, resource (document id).", { format: string(), resource: number() }),
      getPublishSetting: get((i) => `/publishsettings/${seg(i)}`, "Get a publish setting by id."),
    },
    { title: "Productions", description: "Publish runs and the saved publish settings that drive them." },
  );

  const translations = router(
    {
      listExports: list("/translationexports/", "List translation exports."),
      getExport: get((i) => `/translationexports/${seg(i)}`, "Get a translation export by id."),
      createExport: create(
        "/translationexports/",
        'Export documents for translation. Body: {"document": id | [ids], "source": "en", "target": ["de"], "format": "xliff"|"xliffswordfish"|"po", "approved"?, "fuzzy"?, "force"?, "preview"?, "varinfo"?}. Multiple documents only with xliff.',
      ),
      listImports: list("/translationimports/", "List translation imports."),
      getImport: get((i) => `/translationimports/${seg(i)}`, "Get a translation import by id."),
    },
    { title: "Translations", description: "Translation exports and import status (uploading translation files is multipart and not wrapped)." },
  );

  const variables = router(
    {
      listSets: list("/variablesets/", "List variable sets."),
      getSet: get((i) => `/variablesets/${seg(i)}/`, "Get a variable set."),
      createSet: create("/variablesets/", 'Create a variable set. Body: {"title": "..."}.'),
      updateSet: update((i) => `/variablesets/${seg(i)}/`, "Rename a variable set."),
      deleteSet: remove((i) => `/variablesets/${seg(i)}/`, "Delete a variable set."),
      listVariants: list("/variants/", "List variants, optionally of one variable set.", { variable_set_id: number() }),
      getVariant: get((i) => `/variants/${seg(i)}`, "Get a variant."),
      createVariant: create("/variants/", 'Create a variant. Body: {"title": "...", "variable_set_id": id}.'),
      updateVariant: update((i) => `/variants/${seg(i)}`, "Rename a variant (title only)."),
      deleteVariant: remove((i) => `/variants/${seg(i)}`, "Delete a variant."),
      list: list("/variables/", "List variables, optionally of one variable set.", { variable_set_id: number() }),
      get: get((i) => `/variables/${seg(i)}/`, "Get a variable."),
      create: create("/variables/", 'Create a variable. Body: {"title": "...", "type": "text"|"xml"|"translation"|"image", "variable_set_id": id}.'),
      update: update((i) => `/variables/${seg(i)}/`, "Update a variable (title, type, variable_set_id)."),
      delete: remove((i) => `/variables/${seg(i)}/`, "Delete a variable."),
      listValues: list("/variablevalues/", "List variable values. Filters: variable_set_id, variable_id, variant_id.", { variable_set_id: number(), variable_id: number(), variant_id: number() }),
      getValue: get((i) => `/variablevalues/${seg(i)}/`, "Get a variable value."),
      createValue: create("/variablevalues/", 'Set a variable value. Body: {"value": text | {"id": imageId} | [{"language": "en", "value": "..."}], "variable_id": id, "variant_id": id}.'),
      updateValue: update((i) => `/variablevalues/${seg(i)}/`, "Update a variable value (value only)."),
    },
    { title: "Variables", description: "Variable sets, variants, variables and their values for conditional and reusable content." },
  );

  const assignments = router(
    {
      list: list(
        "/assignments/",
        "List assignments. Filters: status (draft, started, finished), lang, type (contribution, review, translation, translationreview), issuer, users, groups (ids).",
        { status: string(), lang: string(), type: string(), issuer: number(), users: number(), groups: number() },
      ),
      get: get((i) => `/assignments/${seg(i)}/`, "Get an assignment."),
      create: create(
        "/assignments/",
        'Create an assignment. Body: {"assignees": {"users": [ids], "groups": [ids]}, "document": id, "type": "contribution"|"review"|"translation"|"translationreview", "lang": "en", "start_date": unix, "end_date": unix, "message"?: "..."}.',
      ),
      update: update((i) => `/assignments/${seg(i)}/`, "Update an assignment (assignees, document, lang, status, message, start_date, end_date; type cannot change)."),
      delete: remove((i) => `/assignments/${seg(i)}/`, "Delete an assignment."),
    },
    { title: "Assignments", description: "Review, contribution and translation assignments." },
  );

  const people = router(
    {
      users: list("/users/", "List users. Filter type: admin, author, reviewer, contributor, publisher, itadmin, translationmanager, webdavuser.", { type: string() }),
      getUser: get((i) => `/users/${seg(i)}/`, "Get a user."),
      groups: list("/groups", "List groups. Filter type: assignment or access.", { type: string() }),
      getGroup: get((i) => `/groups/${seg(i)}`, "Get a group."),
      imports: list("/imports/", "List content imports. Filters: user (id), status (cancelled, done, running).", { user: number(), status: string() }),
      getImport: get((i) => `/imports/${seg(i)}`, "Get a content import."),
    },
    { title: "People and imports", description: "Users, groups and content import status." },
  );

  return router({ documents, forks, folders, images, search, taxonomies, productions, translations, variables, assignments, people });
}

export default defineApp(
  { user: { accounts: { paligo: paligo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.paligo ?? [],
        (account) =>
          withApprovals(build(client(origin(account), authorization(account), fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Paligo",
        description: "Paligo CCMS: documents and XML content, folders, forks, taxonomies, search, productions, translations, variables, assignments, groups and users.",
        icons,
        instructions:
          "List tools take page and per_page and return {page, next_page, total_pages, resources}. Documents list excludes XML; use documents.get for content. Create/update tools take a JSON body as described in each tool. The API needs an admin user's API key and has per-minute rate limits.",
      },
    ),
  }),
);
