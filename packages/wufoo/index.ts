import {
  accountRouter,
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

// Every Wufoo account lives on its own host: https://<subdomain>.wufoo.com.
const siteUrl = (subdomain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]|[a-z0-9])(?:\.wufoo\.com)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.wufoo.com (letters, digits, hyphens).");
  return `https://${match[1]}.wufoo.com`;
};

const wufoo = defineProvider({
  name: "Wufoo",
  hosts: ["*.wufoo.com"],
  auth: {
    // Wufoo uses basic auth with the API key as username and any password.
    // Wufoo has no user-created OAuth apps; its login endpoint is for approved partners only.
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("authorization", t`Basic ${base64(t`${apiKey}:footastic`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.subdomain)}/api/v3/users.json`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({ Users: json() }));
    return { accountInfo: { externalId: account.fields.subdomain.trim().toLowerCase() } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query" | "body";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, where: "query" | "body" = "query", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "query", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "query", required = false): Field => [name, "boolean", required, where];

const filtering: Field[] = [
  ["filters", "json", false, "query"],
  s("match"),
  s("sort"),
  s("sortDirection"),
  n("pageStart"),
  n("pageSize"),
  b("system"),
];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const rows: Row[] = [
  ["forms", "list", "GET", "/forms", "List the forms the API key can see (name, hash, links, entry limits). includeTodayCount adds EntryCountToday; page and limit (max 1000) paginate.", [b("includeTodayCount"), n("page"), n("limit")]],
  ["forms", "get", "GET", "/forms/{formIdentifier}", "Retrieve one form by its hash or title slug (the hash is stable; slugs change when the title changes).", [b("includeTodayCount")]],
  ["forms", "listFields", "GET", "/forms/{formIdentifier}/fields", "List a form's fields with titles, types, choices and sub-fields. The IDs (Field1, Field105...) are the keys used for entries and filters. system=true adds system fields (IP, LastPage, Status, PurchaseTotal...).", [b("system")]],
  ["forms", "listComments", "GET", "/forms/{formIdentifier}/comments", "List comments left on entries of a form. entryId restricts to one entry; pageStart/pageSize (max 100) paginate.", [n("entryId"), n("pageStart"), n("pageSize")]],
  ["forms", "countComments", "GET", "/forms/{formIdentifier}/comments/count", "Count the comments on a form's entries.", []],
  ["entries", "list", "GET", "/forms/{formIdentifier}/entries", "List a form's entries (default 25, max 100 per page). filters is an array of strings like \"Field1 Contains Smith\" (operators: Contains, Does_not_contain, Begins_with, Ends_with, Is_less_than, Is_greater_than, Is_on, Is_before, Is_after, Is_equal_to, Is_not_equal_to, Is_not_NULL; dates are YYYY-MM-DD HH:MM:SS Pacific time). match is AND or OR. sort is a field ID. system=true adds system fields.", [...filtering]],
  ["entries", "count", "GET", "/forms/{formIdentifier}/entries/count", "Count a form's entries, optionally with the same filters and match as entries.list.", [["filters", "json", false, "query"], s("match")]],
  ["entries", "submit", "POST", "/forms/{formIdentifier}/entries", "Submit a new entry to a form. fields is an object of API field IDs to values, e.g. {\"Field1\": \"Ada\", \"Field2\": \"Lovelace\", \"Field105\": \"20260131\"}. Dates must be YYYYMMDD. Submissions obey validation and the 50 per 5 minutes limit. A failed validation returns Success 0 with FieldErrors.", [["fields", "json", true, "body"]]],
  ["reports", "list", "GET", "/reports", "List reports.", []],
  ["reports", "get", "GET", "/reports/{reportIdentifier}", "Retrieve one report by hash or title slug.", []],
  ["reports", "listFields", "GET", "/reports/{reportIdentifier}/fields", "List the fields of the form a report is based on. system=true adds system fields.", [b("system")]],
  ["reports", "listEntries", "GET", "/reports/{reportIdentifier}/entries", "List the entries included in a report. system=true adds system fields.", [b("system")]],
  ["reports", "countEntries", "GET", "/reports/{reportIdentifier}/entries/count", "Count the entries in a report.", []],
  ["reports", "listWidgets", "GET", "/reports/{reportIdentifier}/widgets", "List a report's chart, graph and number widgets (name, type, size, hash).", []],
  ["users", "list", "GET", "/users", "List the account's sub-users with their permissions and API keys (limited by the caller's own permissions).", []],
  ["webhooks", "put", "PUT", "/forms/{formIdentifier}/webhooks", "Add or update a webhook on a form. Wufoo POSTs each new entry to url. Idempotent per url: repeating it updates the webhook. handshakeKey lets the receiver filter requests; metadata=true includes form and field structure. Returns the webhook Hash needed to delete it. A form holds at most 10 integrations.", [s("url", "body", true), s("handshakeKey", "body"), b("metadata", "body")]],
  ["webhooks", "delete", "DELETE", "/forms/{formIdentifier}/webhooks/{webhookHash}", "Delete a webhook from a form using the Hash returned when it was added.", []],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
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
    const body = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") {
        url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      } else if (name === "filters") {
        const list = Array.isArray(value) ? value : [value];
        list.forEach((filter, i) => {
          // Wufoo expects "FieldID Operator Value" in each Filter<n> parameter (spaces encode as "+").
          const [field, operator, ...rest] = String(filter).trim().split(/\s+/);
          search.set(`Filter${i + 1}`, `${field} ${operator} ${rest.join(" ")}`);
        });
      } else if (name === "fields" && typeof value === "object") {
        for (const [key, entry] of Object.entries(value as Record<string, unknown>))
          if (entry !== undefined && entry !== null) body.set(key, String(entry));
      } else if (where === "query") {
        // Wufoo's `system` flag is on whenever the parameter is present, even as system=false.
        if (name === "system" && value === false) continue;
        search.set(name, String(value));
      } else {
        body.set(name, String(value));
      }
    }
    const hasBody = method !== "GET" && method !== "DELETE" && body.size > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api/v3${url}.json${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body: hasBody ? body.toString() : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Wufoo answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    // Submitting an entry and writing webhooks change data; reads are queries.
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { wufoo: wufoo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wufoo ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Wufoo",
        description: "Wufoo online forms: forms and fields, entries (list, count, filter, submit), reports and widgets, users and webhooks.",
        icons,
      },
    ),
  }),
);
