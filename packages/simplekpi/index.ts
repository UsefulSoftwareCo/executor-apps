import {
  accountRouter,
  array,
  base64,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every SimpleKPI account lives on its own host: https://<subdomain>.simplekpi.com.
const siteUrl = (subdomain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.simplekpi\.com)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.simplekpi.com (letters, digits, hyphens).");
  return `https://${match[1]}.simplekpi.com`;
};

const simplekpi = defineProvider({
  name: "SimpleKPI",
  hosts: ["*.simplekpi.com"],
  auth: {
    // SimpleKPI's API uses basic auth: the user's email as username and the account API token
    // (Settings | Developer API) as password. It offers no OAuth.
    apiKey: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        email: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ email, token }) => header("authorization", t`Basic ${base64(t`${email}:${token}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.subdomain)}/api/kpifrequencies`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json", "Content-Type": "application/json" },
    });
    await decodeJson(response, array(object({})));
    return { accountInfo: { externalId: account.fields.email, displayName: account.fields.email } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

// Path parameters ({braces}) are numeric ids, except those named here.
const stringPath = new Set<string>(["frequencyId"]);

const kpiBody = [
  n("icon_id", "body", true), n("unit_id", "body", true), s("frequency_id", "body", true), s("name", "body", true),
  s("description"), n("target_default"), s("value_direction", "body", true), s("aggregate_function", "body", true),
  n("sort_order", "body", true), b("is_active", "body", true),
];
const kpiNote =
  "frequency_id is one uppercase letter from list kpiFrequencies (D daily, W weekly, ...). value_direction is U (up), D (down) or N (none). aggregate_function is AVG or SUM. target_default may be omitted for a KPI without a target. Calculated KPIs cannot be changed through the API.";
const entryFields = [
  n("user_id"), s("email"), n("kpi_id", "body", true), s("entry_date", "body", true), n("actual"), n("target"), s("notes"),
  b("setActual"), b("setTarget"), b("setNotes"), b("addToActual"),
];
const userBody = [
  s("user_type", "body", true), s("user_status_id", "body", true), s("first_name", "body", true), s("last_name"),
  s("email", "body", true), b("can_manage_users", "body", true), b("can_admin_settings", "body", true),
];

const rows: Row[] = [
  // KPIs
  ["kpis", "list", "GET", "/kpis", "List all KPIs.", []],
  ["kpis", "get", "GET", "/kpis/{kpiId}", "Retrieve a KPI.", []],
  ["kpis", "create", "POST", "/kpis", `Create a KPI. category_id is required. ${kpiNote}`, [n("category_id", "body", true), ...kpiBody]],
  ["kpis", "update", "PUT", "/kpis/{kpiId}", `Update a KPI. ${kpiNote}`, [n("category_id", "body", true), ...kpiBody]],
  ["kpis", "delete", "DELETE", "/kpis/{kpiId}", "Delete a KPI.", []],

  // KPI entries (the data points)
  ["kpiEntries", "list", "GET", "/kpientries", "List KPI entries. dateFrom and dateTo (YYYY-MM-DD) default to today. rows is the page size (max 500); request the next page while a full page comes back.", [n("userid", "query"), n("kpiid", "query"), s("dateFrom", "query"), s("dateTo", "query"), n("rows", "query"), n("page", "query")]],
  ["kpiEntries", "get", "GET", "/kpientries/{entryId}", "Retrieve a KPI entry.", []],
  ["kpiEntries", "create", "POST", "/kpientries", "Create or overwrite the entry for a user, KPI and date. Give user_id or the email of an active user. actual is required unless target or notes is given. Set addToActual to increment the existing actual; setActual, setTarget and setNotes (default true) set to false keep the existing value. notes max 500 characters.", entryFields],
  ["kpiEntries", "createMany", "POST", "/kpientries/list", "Create up to 5000 KPI entries in one call. entries is an array of objects shaped like the create tool's input. hasActuals, hasTargets and hasNotes (default true) set to false leave those values unchanged. Returns rows_added.", [j("entries", "body", true), b("hasActuals"), b("hasTargets"), b("hasNotes")]],
  ["kpiEntries", "update", "PUT", "/kpientries/{entryId}", "Update a KPI entry.", [n("user_id", "body", true), n("kpi_id", "body", true), s("entry_date", "body", true), n("actual"), n("target"), s("notes")]],
  ["kpiEntries", "delete", "DELETE", "/kpientries/{entryId}", "Delete a KPI entry.", []],

  // KPI categories
  ["kpiCategories", "list", "GET", "/kpicategories", "List KPI categories.", []],
  ["kpiCategories", "get", "GET", "/kpicategories/{categoryId}", "Retrieve a KPI category.", []],
  ["kpiCategories", "create", "POST", "/kpicategories", "Create a KPI category (name max 50 characters).", [s("name", "body", true), n("sort_order", "body", true)]],
  ["kpiCategories", "update", "PUT", "/kpicategories/{categoryId}", "Update a KPI category.", [s("name", "body", true), n("sort_order", "body", true)]],
  ["kpiCategories", "delete", "DELETE", "/kpicategories/{categoryId}", "Delete a KPI category.", []],
  ["kpiCategories", "listKpis", "GET", "/kpicategories/{categoryId}/kpis", "List the KPIs in a category.", []],
  ["kpiCategories", "getKpi", "GET", "/kpicategories/{categoryId}/kpis/{kpiId}", "Retrieve a KPI in a category.", []],
  ["kpiCategories", "createKpi", "POST", "/kpicategories/{categoryId}/kpis", `Create a KPI in a category. ${kpiNote}`, kpiBody],
  ["kpiCategories", "updateKpi", "PUT", "/kpicategories/{categoryId}/kpis/{kpiId}", `Update a KPI in a category. ${kpiNote}`, kpiBody],
  ["kpiCategories", "deleteKpi", "DELETE", "/kpicategories/{categoryId}/kpis/{kpiId}", "Delete a KPI in a category.", []],

  // Frequencies, units, icons
  ["kpiFrequencies", "list", "GET", "/kpifrequencies", "List KPI frequencies (ids are single letters such as D and W).", []],
  ["kpiFrequencies", "get", "GET", "/kpifrequencies/{frequencyId}", "Retrieve a KPI frequency by its letter id.", []],
  ["kpiUnits", "list", "GET", "/kpiunits", "List KPI units of measure.", []],
  ["kpiUnits", "get", "GET", "/kpiunits/{unitId}", "Retrieve a KPI unit.", []],
  ["kpiUnits", "create", "POST", "/kpiunits", "Create a KPI unit. entry_format allows only 0, # and . (max 25 characters); display_format is a number format such as \"#.00%\".", [s("name", "body", true), s("entry_format", "body", true), s("display_format", "body", true), b("is_percentage", "body", true)]],
  ["kpiUnits", "update", "PUT", "/kpiunits/{unitId}", "Update a KPI unit.", [s("name", "body", true), s("entry_format", "body", true), s("display_format", "body", true), b("is_percentage", "body", true)]],
  ["kpiUnits", "delete", "DELETE", "/kpiunits/{unitId}", "Delete a KPI unit.", []],
  ["kpiIcons", "list", "GET", "/kpiicons", "List the KPI icons available to KPIs.", []],
  ["kpiIcons", "get", "GET", "/kpiicons/{iconId}", "Retrieve a KPI icon.", []],

  // Users
  ["users", "list", "GET", "/users", "List users.", []],
  ["users", "get", "GET", "/users/{userId}", "Retrieve a user.", []],
  ["users", "create", "POST", "/users", "Create a user. user_type is Admin, Director, Manager or User; user_status_id is A (active) or L (locked). password (max 20 characters) cannot be changed through the API afterwards.", [...userBody, s("password", "body", true)]],
  ["users", "update", "PUT", "/users/{userId}", "Update a user (password cannot be changed).", [n("id", "body", true), ...userBody]],
  ["users", "delete", "DELETE", "/users/{userId}", "Delete a user.", []],
  ["users", "listKpis", "GET", "/users/{userId}/kpis", "List the KPIs assigned to a user.", []],
  ["users", "getKpi", "GET", "/users/{userId}/kpis/{kpiId}", "Retrieve a KPI assignment for a user.", []],
  ["users", "assignKpi", "POST", "/users/{userId}/kpis", "Assign a KPI to a user. id is the KPI id; user_target applies only to KPIs with a target.", [n("id", "body", true), n("user_target"), n("sort_order", "body", true)]],
  ["users", "updateKpi", "PUT", "/users/{userId}/kpis/{kpiId}", "Update a user's KPI assignment.", [n("user_target"), n("sort_order", "body", true)]],
  ["users", "unassignKpi", "DELETE", "/users/{userId}/kpis/{kpiId}", "Remove a KPI from a user.", []],
  ["users", "listGroupItems", "GET", "/users/{userId}/groupitems", "List the group items assigned to a user.", []],
  ["users", "getGroupItem", "GET", "/users/{userId}/groupitems/{itemId}", "Retrieve a group item assignment for a user.", []],
  ["users", "assignGroupItem", "POST", "/users/{userId}/groupitems", "Assign a group item to a user. id is the group item id.", [n("id", "body", true)]],
  ["users", "unassignGroupItem", "DELETE", "/users/{userId}/groupitems/{itemId}", "Remove a group item from a user.", []],

  // Groups
  ["groups", "list", "GET", "/groups", "List groups.", []],
  ["groups", "get", "GET", "/groups/{groupId}", "Retrieve a group.", []],
  ["groups", "create", "POST", "/groups", "Create a group (name max 50 characters).", [s("name", "body", true), n("sort_order", "body", true)]],
  ["groups", "update", "PUT", "/groups/{groupId}", "Update a group.", [s("name", "body", true), n("sort_order", "body", true)]],
  ["groups", "delete", "DELETE", "/groups/{groupId}", "Delete a group.", []],
  ["groups", "listItems", "GET", "/groups/{groupId}/items", "List the items in a group.", []],
  ["groups", "getItem", "GET", "/groups/{groupId}/items/{itemId}", "Retrieve a group item.", []],
  ["groups", "createItem", "POST", "/groups/{groupId}/items", "Create a group item (name max 100 characters).", [s("name", "body", true), n("sort_order", "body", true)]],
  ["groups", "updateItem", "PUT", "/groups/{groupId}/items/{itemId}", "Update a group item.", [s("name", "body", true), n("sort_order", "body", true)]],
  ["groups", "deleteItem", "DELETE", "/groups/{groupId}/items/{itemId}", "Delete a group item.", []],

  // Reports
  ["reports", "allDataEntries", "GET", "/reports/AllDataEntries", "All data entries with KPI and group item details, at most 10,000 rows. dateFrom and dateTo are YYYY-MM-DD (default today); kpiIds, groupItemIds and userIds are comma-separated id lists.", [s("kpiIds", "query"), s("dateFrom", "query"), s("dateTo", "query"), s("groupItemIds", "query"), s("userIds", "query")]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    stringPath.has(m[1]!) ? "string" : "number",
    true,
    "path",
  ]);
  return [...pathFields, ...extra];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

type Account = {
  fields: { subdomain: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.subdomain);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method === "POST" || method === "PUT";
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      throw new Error(
        `SimpleKPI answered ${response.status}${retryAfter === null ? "" : ` (Retry-After ${retryAfter}s)`}: ${text.slice(0, 1000)}`,
      );
    }
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { simplekpi: simplekpi.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simplekpi ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SimpleKPI",
        description: "SimpleKPI: KPIs, KPI entries, categories, units, frequencies, users, groups and reports.",
        icons,
      },
    ),
  }),
);
