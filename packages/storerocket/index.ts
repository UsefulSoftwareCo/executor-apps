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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://storerocket.io/api/v2";

const storerocket = defineProvider({
  name: "StoreRocket",
  hosts: ["storerocket.io"],
  auth: {
    // StoreRocket has no OAuth: tokens are created under API Tokens in the dashboard.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const { data } = await decodeJson(response, object({ data: object({ id: string(), name: string(), email: string() }) }));
    return { accountInfo: { externalId: data.id, displayName: data.name, email: data.email } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search?: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const project = string();
  const location = string();
  const flag = number().optional();
  const locationPath = (a: { project_id: string; location_id: string }) =>
    `/projects/${encodeURIComponent(a.project_id)}/locations/${encodeURIComponent(a.location_id)}`;

  const writableFields = {
    name: string().optional(),
    city: string().optional(),
    address_line_1: string().optional(),
    address_line_2: string().optional(),
    state: string().optional(),
    postcode: string().optional(),
    country: string().optional(),
    lat: number().optional(),
    lng: number().optional(),
    visible: boolean().optional(),
    phone: string().optional(),
    email: string().optional(),
    url: string().optional(),
    hours: record(json()).optional(),
    fields: record(json()).optional(),
    callsToAction: record(json()).optional(),
    filters: array(string()).optional(),
  };

  const bodyOf = (args: Params): Params => {
    const { project_id: _project, location_id: _location, ...body } = args;
    return body;
  };

  return router({
    user: router({
      get: query({ description: "Read the profile of the user that owns the API token.", input: object({}) }, async () => call("GET", "/user")),
    }),
    projects: router({
      list: query(
        {
          description: "List the projects the token's user belongs to. Use the returned id as project_id in location tools.",
          input: object({}),
        },
        async () => call("GET", "/projects"),
      ),
    }),
    locations: router({
      list: query(
        {
          description:
            "List a project's locations, 15 per page by default. Follow links.next until it is null. Set the include flags to 1 to attach hours, filters, custom fields or calls to action.",
          input: object({
            project_id: project,
            page: number().optional(),
            limit: number().optional(),
            includeHours: flag,
            includeFilters: flag,
            includeFields: flag,
            includeCallsToAction: flag,
          }),
        },
        async (_context, { project_id, ...search }) =>
          call("GET", `/projects/${encodeURIComponent(project_id)}/locations`, search),
      ),
      get: query(
        {
          description: "Read one location. Set the include flags to 1 to attach hours, filters, custom fields or calls to action.",
          input: object({
            project_id: project,
            location_id: location,
            includeHours: flag,
            includeFilters: flag,
            includeFields: flag,
            includeCallsToAction: flag,
          }),
        },
        async (_context, args) => {
          const { project_id: _p, location_id: _l, ...search } = args;
          return call("GET", locationPath(args), search);
        },
      ),
      create: mutation(
        {
          description:
            "Create a location. name and city are required; send visible false to keep it hidden from the locator. Needs a Business plan project with API access.",
          input: object({ project_id: project, ...writableFields, name: string(), city: string() }),
        },
        async (_context, args) => call("POST", `/projects/${encodeURIComponent(args.project_id)}/locations`, undefined, bodyOf(args)),
      ),
      update: mutation(
        {
          description:
            "Partially update a location (PATCH): only the fields you send change. Hours accept weekday keys such as {\"mon\":\"09:00-17:00\"} or \"closed\"; fields and callsToAction merge by name; filters replaces the list.",
          input: object({ project_id: project, location_id: location, ...writableFields }),
        },
        async (_context, args) => call("PATCH", locationPath(args), undefined, bodyOf(args)),
      ),
      replace: mutation(
        {
          description:
            "Update a location with PUT, the original update contract: name and city are required, and omitted marker/type selections reset to defaults. Prefer update for partial changes.",
          input: object({ project_id: project, location_id: location, ...writableFields, name: string(), city: string() }),
        },
        async (_context, args) => call("PUT", locationPath(args), undefined, bodyOf(args)),
      ),
      delete: mutation(
        {
          description: "Permanently delete a location from a project.",
          input: object({ project_id: project, location_id: location }),
        },
        async (_context, args) => call("DELETE", locationPath(args)),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { storerocket: storerocket.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.storerocket ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "StoreRocket",
        description: "Manage StoreRocket store-locator projects and locations: list, read, create, update and delete locations, hours, custom fields and filters.",
        instructions:
          "Call projects.list first and pass the returned id as project_id. IDs are strings. Location endpoints need a project on the Business plan and a token with the matching location:read/create/update/delete permission. Rate limit is 1,000 requests per minute.",
        icons,
      },
    ),
  }),
);
