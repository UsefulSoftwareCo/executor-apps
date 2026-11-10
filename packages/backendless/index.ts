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

// The native endpoint of each cluster carries the application id and REST API key in the path.
const clusters: Record<string, string> = {
  us: "api.backendless.com",
  eu: "eu-api.backendless.com",
  sa: "api.sa.backendless.com",
};

function clusterHost(region: string): string {
  const host = clusters[region.trim().toLowerCase()];
  if (!host) throw new Error("Region must be us, eu or sa: the cluster your Backendless app runs on.");
  return host;
}

const backendless = defineProvider({
  name: "Backendless",
  hosts: Object.values(clusters),
  auth: {
    apiKey: secrets({
      label: "Application ID and REST API key",
      fields: object({
        region: plain(string({ minLength: 1 })),
        applicationId: plain(string({ minLength: 1 })),
        restApiKey: string({ minLength: 1 }),
      }),
    }),
  },
  // Lists the roles of an unauthenticated REST client; it succeeds only when both keys are valid.
  async health({ account, fetch, signal }) {
    const { region, applicationId, restApiKey } = account.fields;
    const response = await fetch(
      `https://${clusterHost(region)}/${applicationId}/${restApiKey}/users/userroles`,
      { signal },
    );
    await decodeJson(response, array(string()));
    return { accountInfo: { externalId: applicationId, displayName: `Backendless ${applicationId}` } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;
type Fields = { region: string; applicationId: string; restApiKey: string };

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const root = `https://${clusterHost(fields.region)}/${fields.applicationId}/${fields.restApiKey}`;
  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const url = new URL(`${root}/${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.text();
    if (!response.ok) throw new Error(`Backendless ${response.status}: ${text.slice(0, 500)}`);
    if (text === "") return { ok: true };
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { value: text };
    }
  };
  return call;
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
// File and directory paths keep their slashes.
const filePath = (path: string) => path.replace(/^\/+/, "").split("/").map(seg).join("/");

const table = string({ minLength: 1 });
const objectId = string({ minLength: 1 });
const retrieval = {
  where: string().optional(),
  props: array(string()).optional(),
  sortBy: array(string()).optional(),
  groupBy: array(string()).optional(),
  having: string().optional(),
  loadRelations: array(string()).optional(),
  relationsDepth: number().optional(),
  pageSize: number().optional(),
  offset: number().optional(),
};
const retrievalParams = (input: Params): Params => ({
  where: input.where,
  props: input.props,
  sortBy: input.sortBy,
  groupBy: input.groupBy,
  having: input.having,
  loadRelations: input.loadRelations,
  relationsDepth: input.relationsDepth,
  pageSize: input.pageSize,
  offset: input.offset,
});

function build(call: Call) {
  return router({
    data: router(
      {
        find: query(
          {
            description:
              "Retrieve objects from a table. where is a SQL-like condition such as \"age > 20 AND name LIKE 'A%'\"; sortBy entries look like \"created DESC\"; pageSize is at most 100 (default 10); page with offset.",
            input: object({ table, ...retrieval }),
          },
          async (_c, input) => call("GET", `data/${seg(input.table)}`, retrievalParams(input)),
        ),
        get: query(
          {
            description: "Retrieve one object by objectId, optionally loading relations.",
            input: object({ table, objectId, props: array(string()).optional(), loadRelations: array(string()).optional(), relationsDepth: number().optional() }),
          },
          async (_c, input) =>
            call("GET", `data/${seg(input.table)}/${seg(input.objectId)}`, {
              props: input.props,
              loadRelations: input.loadRelations,
              relationsDepth: input.relationsDepth,
            }),
        ),
        first: query(
          { description: "Retrieve the first object of a table.", input: object({ table, props: array(string()).optional(), loadRelations: array(string()).optional() }) },
          async (_c, input) => call("GET", `data/${seg(input.table)}/first`, { props: input.props, loadRelations: input.loadRelations }),
        ),
        last: query(
          { description: "Retrieve the last object of a table.", input: object({ table, props: array(string()).optional(), loadRelations: array(string()).optional() }) },
          async (_c, input) => call("GET", `data/${seg(input.table)}/last`, { props: input.props, loadRelations: input.loadRelations }),
        ),
        count: query(
          { description: "Count the objects in a table, or those matching a where clause.", input: object({ table, where: string().optional() }) },
          async (_c, input) => call("GET", `data/${seg(input.table)}/count`, { where: input.where }),
        ),
        schema: query(
          { description: "Describe the columns of a table: name, type, required, default and related table.", input: object({ table }) },
          async (_c, input) => call("GET", `data/${seg(input.table)}/properties`),
        ),
        create: mutation(
          {
            description: "Save a new object. A missing table is created from the object's shape when dynamic schema definition is on. Do not include objectId.",
            input: object({ table, object: record(json()) }),
          },
          async (_c, input) => call("POST", `data/${seg(input.table)}`, {}, input.object),
        ),
        createMany: mutation(
          { description: "Save several objects at once. Returns their objectIds.", input: object({ table, objects: array(record(json())) }) },
          async (_c, input) => call("POST", `data/bulk/${seg(input.table)}`, {}, input.objects),
        ),
        update: mutation(
          { description: "Update an object by objectId. changes holds only the properties to change.", input: object({ table, objectId, changes: record(json()) }) },
          async (_c, input) => call("PUT", `data/${seg(input.table)}/${seg(input.objectId)}`, {}, input.changes),
        ),
        updateMany: mutation(
          {
            description: "Apply the same changes to every object matching a where clause. Returns the number updated.",
            input: object({ table, where: string({ minLength: 1 }), changes: record(json()) }),
          },
          async (_c, input) => call("PUT", `data/bulk/${seg(input.table)}`, { where: input.where }, input.changes),
        ),
        upsert: mutation(
          { description: "Update the object with the given objectId or insert it. object must include objectId.", input: object({ table, object: record(json()) }) },
          async (_c, input) => call("PUT", `data/${seg(input.table)}/upsert`, {}, input.object),
        ),
        upsertMany: mutation(
          { description: "Upsert several objects, each with an objectId. Returns the objectIds.", input: object({ table, objects: array(record(json())) }) },
          async (_c, input) => call("PUT", `data/bulkupsert/${seg(input.table)}`, {}, input.objects),
        ),
        delete: mutation(
          { description: "Delete one object by objectId.", input: object({ table, objectId }) },
          async (_c, input) => call("DELETE", `data/${seg(input.table)}/${seg(input.objectId)}`),
        ),
        deleteMany: mutation(
          { description: "Delete every object matching a where clause. Returns the number deleted.", input: object({ table, where: string({ minLength: 1 }) }) },
          async (_c, input) => call("DELETE", `data/bulk/${seg(input.table)}`, { where: input.where }),
        ),
      },
      { title: "Data", description: "Database tables: query, count, save, update, upsert and delete objects." },
    ),
    relations: router(
      {
        load: query(
          {
            description: "Retrieve the objects related to a parent through a relation column, with optional paging.",
            input: object({ table, objectId, relation: string({ minLength: 1 }), props: array(string()).optional(), sortBy: array(string()).optional(), pageSize: number().optional(), offset: number().optional() }),
          },
          async (_c, input) =>
            call("GET", `data/${seg(input.table)}/${seg(input.objectId)}/${seg(input.relation)}`, {
              props: input.props,
              sortBy: input.sortBy,
              pageSize: input.pageSize,
              offset: input.offset,
            }),
        ),
        set: mutation(
          {
            description:
              "Replace a parent's related children. Give childIds, or a whereClause selecting child objects. relation may be written column:ChildTable:n or column:ChildTable:1 when the column does not exist yet.",
            input: object({ table, objectId, relation: string({ minLength: 1 }), childIds: array(string()).optional(), whereClause: string().optional() }),
          },
          async (_c, input) =>
            call("POST", `data/${seg(input.table)}/${seg(input.objectId)}/${seg(input.relation)}`, { whereClause: input.whereClause }, input.childIds),
        ),
        add: mutation(
          { description: "Add children to a parent's relation, keeping existing ones. Give childIds or a whereClause.", input: object({ table, objectId, relation: string({ minLength: 1 }), childIds: array(string()).optional(), whereClause: string().optional() }) },
          async (_c, input) =>
            call("PUT", `data/${seg(input.table)}/${seg(input.objectId)}/${seg(input.relation)}`, { whereClause: input.whereClause }, input.childIds),
        ),
        remove: mutation(
          { description: "Disconnect children from a parent's relation without deleting them. Give childIds or a whereClause; with neither, all children are disconnected.", input: object({ table, objectId, relation: string({ minLength: 1 }), childIds: array(string()).optional(), whereClause: string().optional() }) },
          async (_c, input) =>
            call("DELETE", `data/${seg(input.table)}/${seg(input.objectId)}/${seg(input.relation)}`, { whereClause: input.whereClause }, input.childIds),
        ),
      },
      { title: "Relations", description: "Link and unlink related objects between tables." },
    ),
    users: router(
      {
        register: mutation(
          { description: "Register a user. properties holds email, password and any other Users columns.", input: object({ properties: record(json()) }) },
          async (_c, input) => call("POST", "users/register", {}, input.properties),
        ),
        login: mutation(
          { description: "Log a user in with their identity (login) and password. The response includes the user-token.", input: object({ login: string({ minLength: 1 }), password: string({ minLength: 1 }) }) },
          async (_c, input) => call("POST", "users/login", {}, { login: input.login, password: input.password }),
        ),
        find: query(
          { description: "Query the Users table. Same where, props, sortBy, pageSize and offset options as data.find.", input: object(retrieval) },
          async (_c, input) => call("GET", "data/Users", retrievalParams(input)),
        ),
        get: query(
          { description: "Retrieve a user by objectId.", input: object({ objectId }) },
          async (_c, input) => call("GET", `data/Users/${seg(input.objectId)}`),
        ),
        update: mutation(
          { description: "Update a user's properties by objectId.", input: object({ objectId, changes: record(json()) }) },
          async (_c, input) => call("PUT", `users/${seg(input.objectId)}`, {}, input.changes),
        ),
        delete: mutation(
          { description: "Delete a user by objectId.", input: object({ objectId }) },
          async (_c, input) => call("DELETE", `data/Users/${seg(input.objectId)}`),
        ),
        restorePassword: mutation(
          { description: "Email a password reset message to the user with this identity (usually the email).", input: object({ identity: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `users/restorepassword/${seg(input.identity)}`),
        ),
        resendEmailConfirmation: mutation(
          { description: "Resend the email confirmation message for a user identity.", input: object({ identity: string({ minLength: 1 }) }) },
          async (_c, input) => call("POST", `users/resendconfirmation/${seg(input.identity)}`),
        ),
        usersByRole: query(
          { description: "List the users that have a role.", input: object({ roleName: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `users/role/${seg(input.roleName)}`),
        ),
        roles: query({ description: "List the roles available to an unauthenticated REST client.", input: object({}) }, async () => call("GET", "users/userroles")),
      },
      { title: "Users", description: "User accounts, login, password reset and roles." },
    ),
    files: router(
      {
        list: query(
          {
            description: "List files and directories in a directory. pattern is a glob (default *); set sub to recurse.",
            input: object({ path: string(), pattern: string().optional(), sub: boolean().optional(), pageSize: number().optional(), offset: number().optional() }),
          },
          async (_c, input) =>
            call("GET", `files/${filePath(input.path)}`, { pattern: input.pattern, sub: input.sub, pagesize: input.pageSize, offset: input.offset }),
        ),
        count: query(
          { description: "Count files in a directory, optionally matching a pattern.", input: object({ path: string(), pattern: string().optional(), sub: boolean().optional(), countDirectories: boolean().optional() }) },
          async (_c, input) =>
            call("GET", `files/${filePath(input.path)}`, { action: "count", pattern: input.pattern, sub: input.sub, countDirectories: input.countDirectories }),
        ),
        createDirectory: mutation(
          { description: "Create a directory (and parents) in file storage.", input: object({ path: string({ minLength: 1 }) }) },
          async (_c, input) => call("POST", `files/${filePath(input.path)}`),
        ),
        delete: mutation(
          { description: "Delete a file or a directory (with its contents) from file storage.", input: object({ path: string({ minLength: 1 }) }) },
          async (_c, input) => call("DELETE", `files/${filePath(input.path)}`),
        ),
        copy: mutation(
          { description: "Copy a file or directory into a target directory.", input: object({ sourcePath: string({ minLength: 1 }), targetPath: string({ minLength: 1 }) }) },
          async (_c, input) => call("PUT", "files/copy", {}, { sourcePath: input.sourcePath, targetPath: input.targetPath }),
        ),
        move: mutation(
          { description: "Move a file or directory into a target directory.", input: object({ sourcePath: string({ minLength: 1 }), targetPath: string({ minLength: 1 }) }) },
          async (_c, input) => call("PUT", "files/move", {}, { sourcePath: input.sourcePath, targetPath: input.targetPath }),
        ),
        rename: mutation(
          { description: "Rename a file or directory.", input: object({ oldPathName: string({ minLength: 1 }), newName: string({ minLength: 1 }) }) },
          async (_c, input) => call("PUT", "files/rename", {}, { oldPathName: input.oldPathName, newName: input.newName }),
        ),
      },
      {
        title: "Files",
        description: "File storage: list, count, create directories, copy, move, rename and delete. Uploads and downloads of binary content are not wrapped.",
      },
    ),
    counters: router(
      {
        get: query(
          { description: "Current value of an atomic counter.", input: object({ name: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `counters/${seg(input.name)}`),
        ),
        list: query(
          { description: "List counter names matching a glob pattern such as * or shopper*.", input: object({ pattern: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `counters/${seg(input.pattern)}/list`),
        ),
        increment: mutation(
          { description: "Atomically add by (default 1; negative to decrement) and return the new value.", input: object({ name: string({ minLength: 1 }), by: number().optional() }) },
          async (_c, input) =>
            input.by === undefined
              ? call("PUT", `counters/${seg(input.name)}/increment/get`)
              : call("PUT", `counters/${seg(input.name)}/incrementby/get`, { value: input.by }),
        ),
        compareAndSet: mutation(
          { description: "Set the counter to updatedValue only if it currently equals expected. Returns true when updated.", input: object({ name: string({ minLength: 1 }), expected: number(), updatedValue: number() }) },
          async (_c, input) =>
            call("PUT", `counters/${seg(input.name)}/get/compareandset`, { expected: input.expected, updatedvalue: input.updatedValue }),
        ),
        reset: mutation(
          { description: "Reset a counter to zero.", input: object({ name: string({ minLength: 1 }) }) },
          async (_c, input) => call("PUT", `counters/${seg(input.name)}/reset`),
        ),
      },
      { title: "Counters", description: "Atomic counters." },
    ),
    cache: router(
      {
        get: query(
          { description: "Read a value from the cache (null when absent).", input: object({ key: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `cache/${seg(input.key)}`),
        ),
        exists: query(
          { description: "Whether a key is in the cache.", input: object({ key: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `cache/${seg(input.key)}/check`),
        ),
        put: mutation(
          { description: "Store a JSON value in the cache. timeToLive is in seconds (default and maximum 7200).", input: object({ key: string({ minLength: 1 }), value: json(), timeToLive: number().optional() }) },
          async (_c, input) => call("PUT", `cache/${seg(input.key)}`, { timeout: input.timeToLive }, input.value),
        ),
        extend: mutation(
          { description: "Extend a cached value's life by 1 to 7200 seconds from now.", input: object({ key: string({ minLength: 1 }), seconds: number() }) },
          async (_c, input) => call("PUT", `cache/${seg(input.key)}/expireIn`, { timeout: input.seconds }),
        ),
        delete: mutation(
          { description: "Remove a key from the cache.", input: object({ key: string({ minLength: 1 }) }) },
          async (_c, input) => call("DELETE", `cache/${seg(input.key)}`),
        ),
      },
      { title: "Cache", description: "Key-value cache with expiry." },
    ),
    hive: router(
      {
        list: query({ description: "List hive names.", input: object({}) }, async () => call("GET", "hive")),
        create: mutation(
          { description: "Create a hive.", input: object({ hiveName: string({ minLength: 1 }) }) },
          async (_c, input) => call("POST", `hive/${seg(input.hiveName)}`),
        ),
        delete: mutation(
          { description: "Delete a hive and everything in it.", input: object({ hiveName: string({ minLength: 1 }) }) },
          async (_c, input) => call("DELETE", `hive/${seg(input.hiveName)}`),
        ),
        rename: mutation(
          { description: "Rename a hive.", input: object({ hiveName: string({ minLength: 1 }), newName: string({ minLength: 1 }) }) },
          async (_c, input) => call("PUT", `hive/${seg(input.hiveName)}`, { newName: input.newName }),
        ),
      },
      { title: "Hive", description: "Hive management. Operations on keys inside a hive are not wrapped." },
    ),
    messaging: router(
      {
        publish: mutation(
          {
            description: "Publish a message to a pub/sub channel. message may be a string or JSON. Returns the messageId and status.",
            input: object({ channel: string({ minLength: 1 }), message: json(), publisherId: string().optional(), headers: record(string()).optional(), publishAt: number().optional() }),
          },
          async (_c, input) =>
            call("POST", `messaging/${seg(input.channel)}`, {}, {
              message: input.message,
              ...(input.publisherId === undefined ? {} : { publisherId: input.publisherId }),
              ...(input.headers === undefined ? {} : { headers: input.headers }),
              ...(input.publishAt === undefined ? {} : { publishAt: input.publishAt }),
            }),
        ),
        status: query(
          { description: "Publishing status of a message: published, scheduled, cancelled, failed or unknown.", input: object({ messageId: string({ minLength: 1 }) }) },
          async (_c, input) => call("GET", `messaging/${seg(input.messageId)}`),
        ),
        cancel: mutation(
          { description: "Cancel a scheduled message.", input: object({ messageId: string({ minLength: 1 }) }) },
          async (_c, input) => call("DELETE", `messaging/${seg(input.messageId)}`),
        ),
        sendEmail: mutation(
          {
            description: "Send an email through Backendless. Give text and/or html. attachments are paths in Backendless file storage.",
            input: object({ subject: string({ minLength: 1 }), to: array(string()), text: string().optional(), html: string().optional(), attachments: array(string()).optional() }),
          },
          async (_c, input) =>
            call("POST", "messaging/email", {}, {
              subject: input.subject,
              to: input.to,
              bodyparts: { ...(input.text === undefined ? {} : { textmessage: input.text }), ...(input.html === undefined ? {} : { htmlmessage: input.html }) },
              ...(input.attachments === undefined ? {} : { attachment: input.attachments }),
            }),
        ),
      },
      { title: "Messaging", description: "Pub/sub messages and email." },
    ),
    log: mutation(
      {
        description: "Write a message to the Backendless application log.",
        input: object({ level: string().default("INFO"), logger: string({ minLength: 1 }), message: string({ minLength: 1 }) }),
      },
      async (_c, input) =>
        call("PUT", "log", {}, [{ "log-level": input.level, logger: input.logger, timestamp: Date.now(), message: input.message }]),
    ),
  });
}

export default defineApp(
  { user: { accounts: { backendless: backendless.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.backendless ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Backendless",
        description: "Backendless backend-as-a-service: data tables and relations, users, files, counters, cache, hive, messaging, email and logging.",
        instructions:
          "Tables are created on first save when dynamic schema definition is on. where clauses are SQL-like, for example \"age > 20 AND city = 'Oslo'\". Collections return at most 100 objects per page: page with offset.",
        icons,
      },
    ),
  }),
);
