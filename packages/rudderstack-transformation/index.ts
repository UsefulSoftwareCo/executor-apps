import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
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

const hosts = { us: "https://api.rudderstack.com", eu: "https://api.eu.rudderstack.com" } as const;

const rudderstack = defineProvider({
  name: "RudderStack",
  hosts: ["api.rudderstack.com", "api.eu.rudderstack.com"],
  auth: {
    // A workspace-level Service Access Token (recommended) or a Personal Access Token.
    // RudderStack has no OAuth for its public APIs.
    apiKey: secrets({
      label: "Access token",
      fields: object({
        token: string({ minLength: 1 }),
        // "us" (default) or "eu".
        region: string().optional(),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseUrl(account.fields.region)}/transformations`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

function baseUrl(region: string | undefined): string {
  const key = (region ?? "us").trim().toLowerCase();
  if (key !== "us" && key !== "eu") throw new Error(`Unknown RudderStack region "${region}": use "us" or "eu".`);
  return hosts[key];
}

type Method = "GET" | "POST" | "DELETE";
type Params = Record<string, unknown>;

function client(account: { fields: { token: string; region?: string | undefined } }, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = baseUrl(account.fields.region);
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Deletes return 200 with no body, so there is nothing to decode.
    if (method === "DELETE") {
      if (!response.ok) throw new Error(`RudderStack DELETE ${path} failed: ${response.status} ${await response.text()}`);
      return { ok: true };
    }
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

// "javascript" or "pythonfaas".
const language = string();
// "true" publishes the new version so it goes live for incoming events.
const publishFlag = string().optional();
// Version listings take count (default 5) and orderBy (asc or desc).
const listing = {
  count: string().optional(),
  orderBy: string().optional(),
};

function build(call: Call) {
  const get = (path: (input: Params) => string, description: string, input: Parameters<typeof object>[0]) =>
    query({ description, input: object(input) }, async (_ctx, i: Params) => {
      const { id: _id, versionId: _versionId, ...rest } = i;
      return call("GET", path(i), rest);
    });

  const idOnly = { id: string({ minLength: 1 }) };
  const idAndVersion = { id: string({ minLength: 1 }), versionId: string({ minLength: 1 }) };

  const transformations = router(
    {
      list: get(() => "/transformations", "List all published transformations in the workspace.", {}),
      get: get((i) => `/transformations/${encodeURIComponent(String(i.id))}`, "Retrieve a single transformation by ID.", idOnly),
      create: mutation(
        {
          description:
            "Create a transformation. It is only an unpublished revision unless publish is \"true\"; destinations can connect only to a published transformation.",
          input: object({
            name: string({ minLength: 1 }),
            language,
            code: string().optional(),
            description: string().optional(),
            publish: publishFlag,
          }),
        },
        async (_ctx, { publish, ...body }) => call("POST", "/transformations", { publish }, body),
      ),
      update: mutation(
        {
          description:
            "Update a transformation's name, description or code, creating a new revision (the language cannot change). Publish it with publish \"true\".",
          input: object({
            id: string({ minLength: 1 }),
            name: string().optional(),
            description: string().optional(),
            code: string().optional(),
            publish: publishFlag,
          }),
        },
        async (_ctx, { id, publish, ...body }) => call("POST", `/transformations/${encodeURIComponent(id)}`, { publish }, body),
      ),
      delete: mutation(
        { description: "Delete a published transformation by ID. Revisions are never deleted.", input: object(idOnly) },
        async (_ctx, { id }) => call("DELETE", `/transformations/${encodeURIComponent(id)}`),
      ),
      connectToDestination: mutation(
        {
          description:
            "Connect a published transformation to a destination, replacing any transformation already connected to that destination.",
          input: object({ id: string({ minLength: 1 }), destinationId: string({ minLength: 1 }) }),
        },
        async (_ctx, { id, destinationId }) => call("POST", `/transformations/${encodeURIComponent(id)}/connectToDestination`, {}, { destinationId }),
      ),
      disconnectFromDestination: mutation(
        {
          description: "Disconnect a transformation from a destination.",
          input: object({ id: string({ minLength: 1 }), destinationId: string({ minLength: 1 }) }),
        },
        async (_ctx, { id, destinationId }) =>
          call("POST", `/transformations/${encodeURIComponent(id)}/disconnectFromDestination`, {}, { destinationId }),
      ),
      versions: router({
        list: get((i) => `/transformations/${encodeURIComponent(String(i.id))}/versions`, "List the revisions of a transformation.", { ...idOnly, ...listing }),
        get: get(
          (i) => `/transformations/${encodeURIComponent(String(i.id))}/versions/${encodeURIComponent(String(i.versionId))}`,
          "Retrieve a single transformation revision.",
          idAndVersion,
        ),
      }),
    },
    { title: "Transformations", description: "Create, update, publish, delete and connect JavaScript or Python event transformations." },
  );

  const libraries = router(
    {
      list: get(() => "/libraries", "List all published transformation libraries.", {}),
      get: get((i) => `/libraries/${encodeURIComponent(String(i.id))}`, "Retrieve a library by ID.", idOnly),
      create: mutation(
        {
          description: "Create a library that transformations can import by its importName. Unpublished unless publish is \"true\".",
          input: object({
            name: string({ minLength: 1 }),
            code: string(),
            language,
            description: string().optional(),
            publish: publishFlag,
          }),
        },
        async (_ctx, { publish, ...body }) => call("POST", "/libraries", { publish }, body),
      ),
      update: mutation(
        {
          description: "Update a library's code or description, creating a new version (the name and language cannot change). Publish it with publish \"true\".",
          input: object({ id: string({ minLength: 1 }), code: string(), language, description: string().optional(), publish: publishFlag }),
        },
        async (_ctx, { id, publish, ...body }) => call("POST", `/libraries/${encodeURIComponent(id)}`, { publish }, body),
      ),
      delete: mutation(
        { description: "Delete a library by ID.", input: object(idOnly) },
        async (_ctx, { id }) => call("DELETE", `/libraries/${encodeURIComponent(id)}`),
      ),
      versions: router({
        list: get((i) => `/libraries/${encodeURIComponent(String(i.id))}/versions`, "List the versions of a library.", { ...idOnly, ...listing }),
        get: get(
          (i) => `/libraries/${encodeURIComponent(String(i.id))}/versions/${encodeURIComponent(String(i.versionId))}`,
          "Retrieve a single library version.",
          idAndVersion,
        ),
      }),
    },
    { title: "Libraries", description: "Reusable code modules that transformations import." },
  );

  const publish = mutation(
    {
      description:
        "Publish specific transformation and library versions together. Each transformation entry takes a versionId and optional testInput events; each library entry takes a versionId.",
      input: object({
        transformations: array(object({ versionId: string({ minLength: 1 }), testInput: array(record(json())).optional() })).optional(),
        libraries: array(object({ versionId: string({ minLength: 1 }) })).optional(),
      }),
    },
    async (_ctx, body) => call("POST", "/libraries/publish", {}, body),
  );

  return router({ transformations, libraries, publish });
}

export default defineApp(
  { user: { accounts: { rudderstack: rudderstack.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rudderstack ?? [],
        (account) => withApprovals(build(client(account, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "RudderStack Transformations",
        description: "Manage RudderStack transformations and libraries: create, edit, publish, version, delete and connect them to destinations.",
        icons,
      },
    ),
  }),
);
