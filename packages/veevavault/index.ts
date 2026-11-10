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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Veeva Vault is hosted per vault: every vault has its own DNS name (https://{vaultDNS}/api/{version}).
// The provider declares `hosts: ["*.veevavault.com"]` so the password reaches app code only as a handle that
// Executor substitutes on requests to Veeva hosts. Every request is built from the validated vault origin below.
function vaultOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Vault DNS name, for example mycompany-quality.veevavault.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Vault address must use https.");
  if (!/^[a-z0-9-]+\.veevavault\.com$/i.test(url.hostname) || url.port !== "") {
    throw new Error("The Vault address must be a Veeva domain such as mycompany-quality.veevavault.com.");
  }
  return url.origin;
}

const defaultVersion = "v25.3";

function apiVersion(raw: string): string {
  const text = raw.trim() === "" ? defaultVersion : raw.trim();
  if (!/^v\d{2}\.\d$/.test(text)) throw new Error("The API version must look like v25.3.");
  return text;
}

type Fields = { vault: string; username: string; password: string; version: string };
type Fetch = typeof fetch;
type Params = Record<string, unknown>;

// Vault's session sign-in: POST /auth with the user name and password returns a sessionId that goes in the
// Authorization header. Each call signs in, does its work and ends the session so sessions never pile up.
async function withSession<T>(
  fields: Fields,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  work: (call: (path: string, init?: RequestInit) => Promise<Response>) => Promise<T>,
): Promise<T> {
  const origin = vaultOrigin(fields.vault);
  const base = `${origin}/api/${apiVersion(fields.version)}`;
  const login = await fetcher(`${base}/auth`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ username: fields.username, password: fields.password }).toString(),
  });
  const auth = await decodeJson(login, json());
  const body = auth as { responseStatus?: string; sessionId?: string; errors?: Array<{ message?: string }> };
  if (body.responseStatus !== "SUCCESS" || typeof body.sessionId !== "string") {
    throw new Error(`Veeva Vault sign-in failed: ${body.errors?.[0]?.message ?? "check the vault DNS, user name and password"}.`);
  }
  const sessionId = body.sessionId;
  try {
    return await work((path, init) =>
      fetcher(`${base}${path}`, {
        ...init,
        signal,
        headers: { Accept: "application/json", Authorization: sessionId, ...(init?.headers as Record<string, string> | undefined) },
      }),
    );
  } finally {
    // Deliberately unsignalled: ending the session must still run when the call is cancelled.
    await fetcher(`${base}/session`, { method: "DELETE", headers: { Authorization: sessionId } }).catch(() => undefined);
  }
}

const veeva = defineProvider({
  name: "Veeva Vault",
  hosts: ["*.veevavault.com"],
  auth: {
    // Vault OAuth 2.0 / OpenID Connect needs a security policy and OAuth profile configured per vault by an
    // administrator, so the connection uses the user's own name and password with the session API.
    password: secrets({
      label: "Vault user name and password",
      fields: object({
        vault: plain(string({ minLength: 1 })),
        username: plain(string({ minLength: 1 })),
        password: string({ minLength: 1 }),
        version: plain(string()),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.fields;
    const origin = vaultOrigin(fields.vault);
    const base = `${origin}/api/${apiVersion(fields.version)}`;
    const login = await fetch(`${base}/auth`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ username: fields.username, password: fields.password }).toString(),
    });
    const auth = await decodeJson(login, object({ responseStatus: string(), sessionId: string() }));
    if (auth.responseStatus !== "SUCCESS") throw new Error("Veeva Vault sign-in failed.");
    await fetch(`${base}/session`, { method: "DELETE", headers: { Authorization: auth.sessionId } }).catch(() => undefined);
    return {
      accountInfo: { externalId: `${new URL(origin).hostname}:${fields.username}`, displayName: `${fields.username} @ ${new URL(origin).hostname}` },
    };
  },
});

function segment(value: unknown, label: string): string {
  const text = String(value);
  if (text === "" || !/^[A-Za-z0-9_.\-]+$/.test(text)) throw new Error(`${label} must contain only letters, digits, '_', '-' and '.'.`);
  return encodeURIComponent(text);
}

function qs(input: Params, keys: string[]): string {
  const url = new URLSearchParams();
  for (const key of keys) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") url.set(key, String(value));
  }
  const text = url.toString();
  return text === "" ? "" : `?${text}`;
}

async function send(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined, path: string, init: RequestInit = {}) {
  return withSession(fields, fetcher, signal, async (call) => {
    const response = await call(path, init);
    const result = await decodeJson(response, json());
    const body = result as { responseStatus?: string; errors?: Array<{ type?: string; message?: string }> } | null;
    // Vault reports many failures as HTTP 200 with responseStatus FAILURE.
    if (body !== null && typeof body === "object" && body.responseStatus === "FAILURE") {
      throw new Error(`Veeva Vault error: ${(body.errors ?? []).map((e) => `${e.type ?? "ERROR"}: ${e.message ?? ""}`).join("; ") || "request failed"}`);
    }
    return result;
  });
}

function form(values: Params): { body: string; headers: Record<string, string> } {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  return { body: params.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } };
}

const fieldsRecord = record(json());
const offset = { limit: number().optional(), offset: number().optional() };

export default defineApp(
  { user: { accounts: { veeva: veeva.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.veeva ?? [],
        (account) => {
          const f = account.fields;
          const get = (path: string) => send(f, fetch, signal, path);
          return withApprovals(
            router({
              versions: query(
                { description: "List the API versions this vault supports.", input: object({}) },
                async () => {
                  const origin = vaultOrigin(f.vault);
                  const response = await fetch(`${origin}/api/`, { signal, headers: { Accept: "application/json" } });
                  return decodeJson(response, json());
                },
              ),
              vql: router(
                {
                  query: query(
                    {
                      description:
                        "Run a Vault Query Language (VQL) query, e.g. \"SELECT id, name__v FROM documents WHERE status__v = 'Approved' LIMIT 10\". Results are paged; the response carries responseDetails.next_page, which you pass to next.",
                      input: object({ q: string(), next: string().optional() }),
                    },
                    async (_ctx, input: Params) => {
                      if (input.next !== undefined && input.next !== "") {
                        const next = String(input.next);
                        if (!next.startsWith("/api/")) throw new Error("next must be the next_page value returned by the previous call.");
                        const rest = next.replace(/^\/api\/v\d{2}\.\d/, "");
                        return get(rest);
                      }
                      const { body, headers } = form({ q: input.q });
                      return send(f, fetch, signal, "/query", { method: "POST", body, headers });
                    },
                  ),
                },
                { title: "VQL", description: "Query documents, objects, users and more with VQL." },
              ),
              documents: router(
                {
                  list: query(
                    {
                      description: "List documents the user can see. Use named_filter (e.g. 'My Documents'), sort, limit and offset; for filtering by field use vql.query instead.",
                      input: object({ named_filter: string().optional(), scope: string().optional(), sort: string().optional(), ...offset }),
                    },
                    async (_ctx, input: Params) => get(`/objects/documents${qs(input, ["named_filter", "scope", "sort", "limit", "offset"])}`),
                  ),
                  get: query(
                    { description: "Retrieve a document's latest version and its fields by id.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/documents/${segment(input.id, "id")}`),
                  ),
                  versions: query(
                    { description: "List all versions of a document.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/documents/${segment(input.id, "id")}/versions`),
                  ),
                  getVersion: query(
                    {
                      description: "Retrieve one version of a document by major and minor version number.",
                      input: object({ id: number(), major: number(), minor: number() }),
                    },
                    async (_ctx, input: Params) =>
                      get(`/objects/documents/${segment(input.id, "id")}/versions/${segment(input.major, "major")}/${segment(input.minor, "minor")}`),
                  ),
                  metadata: query(
                    { description: "Retrieve the metadata (fields) available on all documents.", input: object({}) },
                    async () => get("/metadata/objects/documents/properties"),
                  ),
                  types: query(
                    { description: "Retrieve all document types.", input: object({}) },
                    async () => get("/metadata/objects/documents/types"),
                  ),
                  roles: query(
                    { description: "Retrieve the roles and their assigned users and groups on a document.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/documents/${segment(input.id, "id")}/roles`),
                  ),
                  renditions: query(
                    { description: "List the renditions of a document's latest version.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/documents/${segment(input.id, "id")}/renditions`),
                  ),
                  attachments: query(
                    { description: "List the attachments of a document.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/documents/${segment(input.id, "id")}/attachments`),
                  ),
                  create: mutation(
                    {
                      description:
                        "Create a document from a file already in file staging. fields are the document fields as form values, e.g. {\"name__v\": \"Spec\", \"type__v\": \"Reference Document\", \"lifecycle__v\": \"General Lifecycle\", \"file\": \"/u123/spec.pdf\"}.",
                      input: object({ fields: fieldsRecord }),
                    },
                    async (_ctx, input: Params) => {
                      const { body, headers } = form(input.fields as Params);
                      return send(f, fetch, signal, "/objects/documents", { method: "POST", body, headers });
                    },
                  ),
                  update: mutation(
                    {
                      description: "Update the editable fields of a document's latest version, e.g. {\"title__v\": \"New title\"}.",
                      input: object({ id: number(), fields: fieldsRecord }),
                    },
                    async (_ctx, input: Params) => {
                      const { body, headers } = form(input.fields as Params);
                      return send(f, fetch, signal, `/objects/documents/${segment(input.id, "id")}`, { method: "PUT", body, headers });
                    },
                  ),
                  delete: mutation(
                    { description: "Delete all versions of a document.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => send(f, fetch, signal, `/objects/documents/${segment(input.id, "id")}`, { method: "DELETE" }),
                  ),
                },
                { title: "Documents", description: "Vault documents, versions, roles, renditions and attachments." },
              ),
              binders: router(
                {
                  list: query(
                    { description: "List binders the user can see.", input: object({ ...offset }) },
                    async (_ctx, input: Params) => get(`/objects/binders${qs(input, ["limit", "offset"])}`),
                  ),
                  get: query(
                    { description: "Retrieve a binder and its fields by id.", input: object({ id: number() }) },
                    async (_ctx, input: Params) => get(`/objects/binders/${segment(input.id, "id")}`),
                  ),
                },
                { title: "Binders", description: "Vault binders." },
              ),
              objects: router(
                {
                  list: query({ description: "List all object types (metadata) in the vault.", input: object({}) }, async () => get("/metadata/vobjects")),
                  describe: query(
                    {
                      description: "Retrieve the metadata of one object, including its fields, e.g. product__v or study__v.",
                      input: object({ object: string() }),
                    },
                    async (_ctx, input: Params) => get(`/metadata/vobjects/${segment(input.object, "object")}`),
                  ),
                  records: query(
                    {
                      description:
                        "List records of an object (name like product__v). Returns ids, names and standard fields; use vql.query to select other fields or filter. Paged with limit and offset.",
                      input: object({ object: string(), ...offset }),
                    },
                    async (_ctx, input: Params) => get(`/vobjects/${segment(input.object, "object")}${qs(input, ["limit", "offset"])}`),
                  ),
                  record: query(
                    { description: "Retrieve one object record by id.", input: object({ object: string(), id: string() }) },
                    async (_ctx, input: Params) => get(`/vobjects/${segment(input.object, "object")}/${segment(input.id, "id")}`),
                  ),
                  create: mutation(
                    {
                      description: "Create an object record. fields is the record, e.g. {\"name__v\": \"Cholecap\"}; add object_type__v when the object has several types.",
                      input: object({ object: string(), fields: fieldsRecord }),
                    },
                    async (_ctx, input: Params) =>
                      send(f, fetch, signal, `/vobjects/${segment(input.object, "object")}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify([input.fields]),
                      }),
                  ),
                  update: mutation(
                    {
                      description: "Update an object record. fields must include the record's id, e.g. {\"id\": \"00P000000000101\", \"name__v\": \"New name\"}.",
                      input: object({ object: string(), fields: fieldsRecord }),
                    },
                    async (_ctx, input: Params) =>
                      send(f, fetch, signal, `/vobjects/${segment(input.object, "object")}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify([input.fields]),
                      }),
                  ),
                  delete: mutation(
                    { description: "Delete an object record by id.", input: object({ object: string(), id: string() }) },
                    async (_ctx, input: Params) =>
                      send(f, fetch, signal, `/vobjects/${segment(input.object, "object")}/${segment(input.id, "id")}`, { method: "DELETE" }),
                  ),
                },
                { title: "Objects", description: "Vault objects (products, studies, countries and custom objects) and their records." },
              ),
              users: router(
                {
                  list: query(
                    { description: "List users in the vault. Use vql.query on the users object to filter.", input: object({ ...offset }) },
                    async (_ctx, input: Params) => get(`/objects/users${qs(input, ["limit", "offset"])}`),
                  ),
                  get: query(
                    { description: "Retrieve a user by id, or 'me' for the signed-in user.", input: object({ id: string() }) },
                    async (_ctx, input: Params) => get(`/objects/users/${segment(input.id, "id")}`),
                  ),
                  groups: query(
                    { description: "List groups in the vault.", input: object({}) },
                    async () => get("/objects/groups"),
                  ),
                },
                { title: "Users", description: "Vault users and groups." },
              ),
              picklists: router(
                {
                  list: query({ description: "List all picklists.", input: object({}) }, async () => get("/objects/picklists")),
                  get: query(
                    { description: "Retrieve the values of a picklist by name.", input: object({ name: string() }) },
                    async (_ctx, input: Params) => get(`/objects/picklists/${segment(input.name, "name")}`),
                  ),
                },
                { title: "Picklists", description: "Vault picklists." },
              ),
              jobs: query(
                { description: "Retrieve the status of a job by id, as returned by long-running operations.", input: object({ id: number() }) },
                async (_ctx, input: Params) => get(`/services/jobs/${segment(input.id, "id")}`),
              ),
              api: router(
                {
                  get: query(
                    {
                      description:
                        "GET any Vault API path after /api/{version}, e.g. /objects/documents/types or /services/file_staging/items. Use it for endpoints without a dedicated tool.",
                      input: object({ path: string(), params: record(string()).optional() }),
                    },
                    async (_ctx, input: Params) => get(`${rawPath(input.path)}${rawQuery(input.params)}`),
                  ),
                  request: mutation(
                    {
                      description:
                        "POST, PUT or DELETE any Vault API path after /api/{version}. body is sent as form fields by default, or as JSON when json is true (arrays allowed).",
                      input: object({
                        method: string(),
                        path: string(),
                        body: json().optional(),
                        json: json().optional(),
                      }),
                    },
                    async (_ctx, input: Params) => {
                      const method = String(input.method).toUpperCase();
                      if (!["POST", "PUT", "DELETE"].includes(method)) throw new Error("method must be POST, PUT or DELETE.");
                      const path = rawPath(input.path);
                      if (input.body === undefined || input.body === null) return send(f, fetch, signal, path, { method });
                      if (input.json === true) {
                        return send(f, fetch, signal, path, {
                          method,
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(input.body),
                        });
                      }
                      const { body, headers } = form(input.body as Params);
                      return send(f, fetch, signal, path, { method, body, headers });
                    },
                  ),
                },
                { title: "Any endpoint", description: "Call any Vault API endpoint by path." },
              ),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Veeva Vault",
        description:
          "Veeva Vault content and data: documents, binders, object records, VQL queries, users, picklists and jobs, plus any other endpoint of the Vault REST API.",
        instructions:
          "Vault's REST API is per vault; the account's vault DNS and API version select the vault and release. Use vql.query for filtering and selecting fields: documents and object records are queried with SELECT ... FROM documents or FROM <object>__v. Many Vault errors arrive as HTTP 200 with responseStatus FAILURE; these tools raise them as errors. Use api.get and api.request for endpoints without a dedicated tool (workflows, lifecycles, file staging, loader).",
        icons,
      },
    ),
  }),
);

function rawPath(value: unknown): string {
  const path = String(value);
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("..") || path.includes("?") || path.includes("#") || /[\s\\]/.test(path)) {
    throw new Error("path must start with '/' and be a Vault API path such as /objects/documents/types; pass query values in params.");
  }
  return path;
}

function rawQuery(params: unknown): string {
  if (params === undefined || params === null) return "";
  const text = new URLSearchParams(params as Record<string, string>).toString();
  return text === "" ? "" : `?${text}`;
}
