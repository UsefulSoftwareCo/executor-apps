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

// Every Oomnitza instance lives at https://<subdomain>.oomnitza.com.
const subdomainPattern = /^[a-z0-9][a-z0-9-]*$/;

function origin(account: { fields: { subdomain: string } }) {
  const sub = account.fields.subdomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.oomnitza\.com.*$/, "")
    .replace(/\/.*$/, "");
  if (!subdomainPattern.test(sub))
    throw new Error("Enter your Oomnitza subdomain, for example mycompany for https://mycompany.oomnitza.com.");
  return `https://${sub}.oomnitza.com`;
}

const oomnitza = defineProvider({
  name: "Oomnitza",
  hosts: ["*.oomnitza.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = origin(account);
    const response = await fetch(`${base}/api/v3/assets/meta`, {
      signal,
      headers: { Authorization2: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: new URL(base).hostname, displayName: new URL(base).hostname } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function client(base: string, token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    if (path.includes("?") || path.includes("#")) throw new Error("path must not contain ? or #");
    const url = new URL(`${base}/api/v3${path}`);
    if (url.origin !== base || !url.pathname.startsWith("/api/v3/"))
      throw new Error("path must stay under /api/v3 on the account host");
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization2: token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const ident = () => string({ minLength: 1 });
const listInput = object({
  limit: number().optional(),
  skip: number().optional(),
  sortby: string().optional(),
  filter: string().optional(),
  fields: string().optional(),
});
const listDoc =
  "limit/skip paginate, sortby orders (prefix with - for descending), filter is an Oomnitza filter expression such as \"barcode IS NULL\" or \"first_name LIKE 'Al'\", fields is a comma-separated field list.";

function build(call: Call) {
  const list = (path: string, description: string) =>
    query({ description: `${description} ${listDoc}`, input: listInput }, (_c, p) => call("GET", path, p));
  const get = (path: (i: string) => string, description: string) =>
    query({ description, input: object({ ident: ident() }) }, (_c, { ident: i }) => call("GET", path(i)));
  const sub = (path: (i: string) => string, description: string) =>
    query({ description: `${description} ${listDoc}`, input: object({ ident: ident(), limit: number().optional(), skip: number().optional(), sortby: string().optional(), filter: string().optional(), fields: string().optional() }) }, (_c, { ident: i, ...p }) =>
      call("GET", path(i), p),
    );
  const create = (path: string, description: string) =>
    mutation({ description: `${description} body is a JSON object of field names to values.`, input: object({ body: json() }) }, (_c, { body }) =>
      call("POST", path, {}, body),
    );
  const update = (path: (i: string) => string, description: string) =>
    mutation({ description: `${description} body holds only the fields to change.`, input: object({ ident: ident(), body: json() }) }, (_c, { ident: i, body }) =>
      call("PATCH", path(i), {}, body),
    );
  const remove = (path: (i: string) => string, description: string) =>
    mutation({ description, input: object({ ident: ident() }) }, (_c, { ident: i }) => call("DELETE", path(i)));

  // Standard resource: list, get, create, update, delete, change history, saved searches.
  const resource = <Extras extends object = {}>(name: string, singular: string, title: string, description: string, extras: Extras = {} as Extras) =>
    router(
      {
        list: list(`/${name}`, `List ${singular}s.`),
        get: get((i) => `/${name}/${seg(i)}`, `Get a ${singular} by its id.`),
        create: create(`/${name}`, `Create a ${singular}.`),
        update: update((i) => `/${name}/${seg(i)}`, `Update a ${singular}.`),
        delete: remove((i) => `/${name}/${seg(i)}`, `Delete a ${singular}.`),
        changesHistory: sub((i) => `/${name}/${seg(i)}/changes-history`, `List the change history of a ${singular}.`),
        savedSearches: query({ description: `List saved searches for ${singular}s.`, input: object({}) }, () => call("GET", `/${name}/savedsearches`)),
        getSavedSearch: get((i) => `/${name}/savedsearches/${seg(i)}`, `Get a ${singular} saved search by id.`),
        ...extras,
      },
      { title, description },
    );

  const assets = resource("assets", "asset", "Assets", "IT assets: laptops, phones, hardware and other tracked equipment.", {
    software: sub((i) => `/assets/${seg(i)}/software`, "List software installed on an asset."),
    meta: query({ description: "Get the asset field definitions (names, types, options).", input: object({}) }, () => call("GET", "/assets/meta")),
  });
  const users = resource("users", "user", "Users", "People in the organization and what they have assigned.", {
    assets: sub((i) => `/users/${seg(i)}/assets`, "List assets assigned to a user."),
    software: sub((i) => `/users/${seg(i)}/software`, "List software assigned to a user."),
    saas: sub((i) => `/users/${seg(i)}/software/saas`, "List SaaS applications a user has access to."),
    profileSettings: get((i) => `/users/${seg(i)}/profile_settings`, "Get a user's profile settings."),
  });
  const software = resource("software", "software item", "Software", "Software titles and the assets they are installed on.", {
    assets: sub((i) => `/software/${seg(i)}/assets`, "List assets a software title is installed on."),
  });
  const accessories = resource("accessories", "accessory", "Accessories", "Peripherals and accessories.");
  const contracts = resource("contracts", "contract", "Contracts", "Vendor contracts, leases and warranties.");
  const locations = resource("locations", "location", "Locations", "Physical locations.");
  const stockrooms = resource("stockrooms", "stockroom", "Stockrooms", "Stockrooms holding inventory.");

  const subscriptions = router(
    {
      list: list("/subscriptions", "List subscriptions."),
      get: get((i) => `/subscriptions/${seg(i)}`, "Get a subscription by id."),
      create: create("/subscriptions", "Create a subscription."),
      update: update((i) => `/subscriptions/${seg(i)}`, "Update a subscription."),
      delete: remove((i) => `/subscriptions/${seg(i)}`, "Delete a subscription."),
    },
    { title: "Subscriptions", description: "Recurring subscriptions." },
  );

  const saas = resource("saas", "SaaS application", "SaaS", "SaaS applications, their roles and users.", {
    roles: sub((i) => `/saas/${seg(i)}/roles`, "List roles of a SaaS application."),
    createRole: mutation(
      { description: "Create a role on a SaaS application. body is the role JSON.", input: object({ ident: ident(), body: json() }) },
      (_c, { ident: i, body }) => call("POST", `/saas/${seg(i)}/roles`, {}, body),
    ),
    updateRole: mutation(
      { description: "Update a SaaS role. body holds the fields to change.", input: object({ ident: ident(), roleId: ident(), body: json() }) },
      (_c, { ident: i, roleId, body }) => call("PATCH", `/saas/${seg(i)}/roles/${seg(roleId)}`, {}, body),
    ),
    deleteRole: mutation(
      { description: "Delete a SaaS role.", input: object({ ident: ident(), roleId: ident() }) },
      (_c, { ident: i, roleId }) => call("DELETE", `/saas/${seg(i)}/roles/${seg(roleId)}`),
    ),
    assignRoleUsers: mutation(
      { description: "Assign users to roles on a SaaS application. body is the request JSON.", input: object({ ident: ident(), body: json() }) },
      (_c, { ident: i, body }) => call("POST", `/saas/${seg(i)}/roles/users`, {}, body),
    ),
    updateRoleUsers: mutation(
      { description: "Update user role assignments on a SaaS application. body is the request JSON.", input: object({ ident: ident(), body: json() }) },
      (_c, { ident: i, body }) => call("PATCH", `/saas/${seg(i)}/roles/users`, {}, body),
    ),
    removeRoleUsers: mutation(
      { description: "Remove users from roles on a SaaS application. body is the request JSON.", input: object({ ident: ident(), body: json() }) },
      (_c, { ident: i, body }) => call("DELETE", `/saas/${seg(i)}/roles/users`, {}, body),
    ),
    users: sub((i) => `/saas/${seg(i)}/users`, "List users of a SaaS application."),
    addUsers: mutation(
      { description: "Add users to a SaaS application. body is the request JSON.", input: object({ ident: ident(), body: json() }) },
      (_c, { ident: i, body }) => call("POST", `/saas/${seg(i)}/users`, {}, body),
    ),
    updateUser: mutation(
      { description: "Update a user's access on a SaaS application. body is the request JSON.", input: object({ ident: ident(), userId: ident(), body: json() }) },
      (_c, { ident: i, userId, body }) => call("POST", `/saas/${seg(i)}/users/${seg(userId)}`, {}, body),
    ),
    allUsers: list("/saas_users", "List SaaS users across all applications."),
    activateUsers: mutation(
      { description: "Activate SaaS users. body is the request JSON.", input: object({ body: json() }) },
      (_c, { body }) => call("PATCH", "/saas_users/activate", {}, body),
    ),
    deactivateUsers: mutation(
      { description: "Deactivate SaaS users. body is the request JSON.", input: object({ body: json() }) },
      (_c, { body }) => call("PATCH", "/saas_users/deactivate", {}, body),
    ),
  });

  const customObjects = router(
    {
      list: list("/custom_objects", "List custom object definitions."),
      get: get((i) => `/custom_objects/${seg(i)}`, "Get a custom object definition."),
      create: create("/custom_objects", "Create a custom object definition."),
      update: update((i) => `/custom_objects/${seg(i)}`, "Update a custom object definition."),
      delete: remove((i) => `/custom_objects/${seg(i)}`, "Delete a custom object definition."),
      records: sub((i) => `/custom_objects/${seg(i)}/records`, "List records of a custom object."),
      getRecord: query(
        { description: "Get a custom object record.", input: object({ ident: ident(), recordId: ident() }) },
        (_c, { ident: i, recordId }) => call("GET", `/custom_objects/${seg(i)}/records/${seg(recordId)}`),
      ),
      createRecord: mutation(
        { description: "Create a custom object record. body is a JSON object of field values.", input: object({ ident: ident(), body: json() }) },
        (_c, { ident: i, body }) => call("POST", `/custom_objects/${seg(i)}/records`, {}, body),
      ),
      updateRecord: mutation(
        { description: "Update a custom object record. body holds the fields to change.", input: object({ ident: ident(), recordId: ident(), body: json() }) },
        (_c, { ident: i, recordId, body }) => call("PATCH", `/custom_objects/${seg(i)}/records/${seg(recordId)}`, {}, body),
      ),
      deleteRecord: mutation(
        { description: "Delete a custom object record.", input: object({ ident: ident(), recordId: ident() }) },
        (_c, { ident: i, recordId }) => call("DELETE", `/custom_objects/${seg(i)}/records/${seg(recordId)}`),
      ),
      recordHistory: query(
        { description: "List the change history of a custom object record.", input: object({ ident: ident(), recordId: ident() }) },
        (_c, { ident: i, recordId }) => call("GET", `/custom_objects/${seg(i)}/records/${seg(recordId)}/changes-history`),
      ),
    },
    { title: "Custom objects", description: "Custom object definitions and their records." },
  );

  const monitoring = router(
    {
      activities: list("/activities", "List activity log entries."),
      connectorRuns: sub((i) => `/connector_run_logs/connectors/${seg(i)}`, "List run logs for a connector."),
      connectorRun: get((i) => `/connector_run_logs/${seg(i)}`, "Get a connector run log by id."),
    },
    { title: "Monitoring", description: "Activity and connector run logs." },
  );

  return router({
    assets,
    users,
    software,
    accessories,
    contracts,
    locations,
    stockrooms,
    subscriptions,
    saas,
    customObjects,
    monitoring,
    request: mutation(
      {
        description:
          "Escape hatch: send any request to the Oomnitza v3 REST API. path is relative to /api/v3, for example /assets/meta.",
        input: object({
          method: string(),
          path: string({ minLength: 1 }),
          query: object({}).optional(),
          body: json().optional(),
        }),
      },
      (_c, { method, path, body }) => {
        const m = method.toUpperCase();
        if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) throw new Error("method must be GET, POST, PUT, PATCH or DELETE");
        if (!path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("?") || path.includes("#")) throw new Error("path must start with / and stay under /api/v3");
        return call(m, path, {}, body);
      },
    ),
  });
}

export default defineApp(
  { user: { accounts: { oomnitza: oomnitza.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.oomnitza ?? [],
        (account) =>
          withApprovals(build(client(origin(account), account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Oomnitza",
        description: "Manage IT assets, users, software, SaaS, contracts, locations, stockrooms and custom objects in Oomnitza.",
        icons,
        instructions:
          "Ids may be numeric ids or external ids. List tools take limit, skip, sortby, filter and fields. Create and update tools take a JSON body of field names to values; call assets.meta to see asset field names.",
      },
    ),
  }),
);
