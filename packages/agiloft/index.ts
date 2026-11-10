import {
  accountRouter,
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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Agiloft knowledgebase lives on its own host (acme.agiloft.com) and is addressed by name.
const siteUrl = (host: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.agiloft\.com)\/?$/.exec(host.trim().toLowerCase());
  if (match === null) throw new Error("Enter the hostname of your Agiloft instance, for example acme.agiloft.com.");
  return `https://${match[1]}`;
};

const Tables = object({ success: boolean() });

const agiloft = defineProvider({
  name: "Agiloft",
  hosts: ["*.agiloft.com"],
  auth: {
    // The Agiloft REST API authenticates every call with the $login and $password parameters of a
    // native (non-LDAP) KB user. OAuth is not offered: its authorization and token endpoints sit on
    // each customer's own host and the client is bound to a service user's contact id.
    credentials: secrets({
      label: "KB login",
      fields: object({
        host: plain(string({ minLength: 1 })),
        kb: plain(string({ minLength: 1 })),
        login: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
      }),
      request: ({ login, password }) => [query("$login", login), query("$password", password)],
    }),
  },
  async health({ account, fetch, signal }) {
    const base = siteUrl(account.fields.host);
    const params = new URLSearchParams({ $KB: account.fields.kb, $lang: "en", skipColumnsInfo: "true", err_code_resp: "1" });
    const response = await fetch(account.url(`${base}/ewws/EWTable/.json?${params.toString()}`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, Tables);
    return {
      accountInfo: {
        externalId: `${new URL(base).host}/${account.fields.kb}`,
        displayName: `${account.fields.kb} (${new URL(base).host})`,
      },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "url" | "body";
type Field = [name: string, type: Type, required: boolean, where: Where, param: string];

// `url` fields go in the query string (system parameters), `body` fields in the form body (record fields).
const s = (name: string, required = false, where: Where = "url", param = name): Field => [name, "string", required, where, param];
const n = (name: string, required = false, where: Where = "url", param = name): Field => [name, "number", required, where, param];
const b = (name: string, required = false, where: Where = "url", param = name): Field => [name, "boolean", required, where, param];
const j = (name: string, required = false, where: Where = "url", param = name): Field => [name, "json", required, where, param];

const table = s("table", true, "url", "$table");
const id = s("id", true);
const recordFields = j("fields", true, "body");

type Row = {
  resource: string;
  action: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  fields: Field[];
  /** Ask Agiloft for its JSON envelope instead of EWREST_ assignments. */
  json?: boolean;
  /** Read-only even though it is a POST. */
  readOnly?: boolean;
};

const rows: Row[] = [
  // Schema discovery
  {
    resource: "schema", action: "listTables", method: "GET", path: "/ewws/EWTable", json: true,
    description: "List the tables of the knowledgebase and their fields (label, logical name, type, required flag). Pass table to limit to one table by logical name, skipColumnsInfo to omit fields, includeLinkedInfo to add details of linked fields. Logical table and field names from here are what every other tool expects.",
    fields: [s("table", false, "url", "table"), b("skipColumnsInfo"), b("includeLinkedInfo", false, "url", "includelinkedinfo")],
  },
  {
    resource: "schema", action: "listSavedSearches", method: "GET", path: "/ewws/EWSavedSearch", json: true,
    description: "List the saved searches defined for a table. The label of a saved search is what records.search takes in its search parameter.",
    fields: [table],
  },
  {
    resource: "schema", action: "getChoiceId", method: "GET", path: "/ewws/EWGetChoiceLineId",
    description: "Look up the internal numeric id of a choice field value (for example Priority = High), for use in SQL where clauses of records.select. Ids change if the KB is copied or re-imported, so fetch them at run time.",
    fields: [table, s("field", true), s("value", true)],
  },

  // Records
  {
    resource: "records", action: "search", method: "POST", path: "/ewws/EWSearch", json: true, readOnly: true,
    description: "Search a table, optionally through a saved search, and return the requested fields. query is an ad hoc condition: values in single quotes (also field labels with spaces), operators =, !=, ~= (contains), <, <=, >, >=, joined with && (and) or || (or), null for empty, for example \"summary~='test'&&priority='High'\". fields lists the logical field names to return (default: id and ownership fields). page is zero-based; limit is the page size, 0 for all records.",
    fields: [table, s("search"), s("query"), j("fields", false, "body", "field"), n("page"), n("limit")],
  },
  {
    resource: "records", action: "select", method: "POST", path: "/ewws/EWSelect", readOnly: true,
    description: "Return the ids and count of the records matching a SQL where clause, written with database column names (not field labels), for example \"assigned_person='Jane Doe'\" or \"summary like '%urgent%' limit 0,200\". Only one statement; ordering is up to the database. Use records.search to get field values or a sorted result.",
    fields: [table, s("where", true, "body")],
  },
  {
    resource: "records", action: "get", method: "POST", path: "/ewws/EWRead", json: true, readOnly: true,
    description: "Read one record by id, or by searchSql (a single-record condition such as \"ext_id='a0B2c345'\"). Returns every field the user can see.",
    fields: [table, s("id"), s("searchSql", false, "url", "$searchSQL")],
  },
  {
    resource: "records", action: "create", method: "POST", path: "/ewws/EWCreate",
    description: "Create a record and return its id. fields maps logical field names to values: use the text shown in the UI for choice fields, an array for multi-value fields, and a leading colon for linked fields (Query By Example, for example {\"f_group\": \":Service Manager\"}). Escape : and ? in values with a backslash.",
    fields: [table, recordFields],
  },
  {
    resource: "records", action: "update", method: "POST", path: "/ewws/EWUpdate",
    description: "Update one record, found by id or by searchSql (a condition matching exactly one record), and return its contents afterwards. fields has the same encoding as records.create. Set force to update a locked record.",
    fields: [table, s("id"), s("searchSql", false, "url", "$searchSQL"), b("force"), recordFields],
  },
  {
    resource: "records", action: "upsert", method: "POST", path: "/ewws/EWUpsert",
    description: "Update the record matching match, or create one when none match, and return its id. match is a condition on a unique business key, for example \"external_id='SF-001234'\". More than one match is an error. fields has the same encoding as records.create.",
    fields: [table, s("match", true, "body", "$query"), recordFields],
  },
  {
    resource: "records", action: "delete", method: "POST", path: "/ewws/EWDelete",
    description: "Delete one or more records, all or nothing. id takes one id or an array. deleteRule says what happens to dependent records: ERROR_IF_DEPENDANTS, APPLY_DELETE_WHERE_POSSIBLE, DELETE_WHERE_POSSIBLE_OTHERWISE_UNLINK, APPLY_UNLINK, UNLINK_WHERE_POSSIBLE_OTHERWISE_DELETE or REPLACE_WITH_ANOTHER (which also needs subs, the ids of replacement records in the same table).",
    fields: [table, j("id", true, "body"), s("deleteRule", true, "body"), j("subs", false, "body")],
  },
  {
    resource: "records", action: "runActionButton", method: "POST", path: "/ewws/async/EWActionButton",
    description: "Run an action button on a record. It runs asynchronously: the answer carries a callback id to pass to records.asyncStatus. name is the logical name of the action button field.",
    fields: [table, id, s("name", true)],
  },
  {
    resource: "records", action: "asyncStatus", method: "GET", path: "/ewws/EWAsyncStatus",
    description: "Check an asynchronous call (such as records.runActionButton) by the callback id it returned. Reports the HTTP status: 200 finished, 201 queued, 202 running, 501 failed, 523 unknown id.",
    fields: [table, s("callbackId", true, "url", "callback_id")],
  },

  // Locks
  {
    resource: "locks", action: "get", method: "GET", path: "/ewws/EWLock", json: true,
    description: "Check whether a record is locked, by whom, and for how many more minutes.",
    fields: [table, id],
  },
  {
    resource: "locks", action: "lock", method: "PUT", path: "/ewws/EWLock", json: true,
    description: "Lock a record for the lock duration configured in the KB (the lock_expiration_time global variable).",
    fields: [table, id],
  },
  {
    resource: "locks", action: "unlock", method: "DELETE", path: "/ewws/EWLock", json: true,
    description: "Release the lock on a record. force lets a member of the admin group release another user's lock.",
    fields: [table, id, b("force")],
  },

  // Attachments
  {
    resource: "attachments", action: "list", method: "POST", path: "/ewws/EWAttachInfo", json: true, readOnly: true,
    description: "List the files attached to an attachment field of a record: name, size and position (index within the field).",
    fields: [table, id, s("field", true)],
  },
];

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
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

// Agiloft's default answer is a series of JavaScript assignments, EWREST_<field>='<value>';
const unescapeJs = (value: string) =>
  value.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, c: string) => {
    if (c[0] === "u" || c[0] === "x") return String.fromCharCode(parseInt(c.slice(1), 16));
    return c === "n" ? "\n" : c === "r" ? "\r" : c === "t" ? "\t" : c;
  });

function parseAnswer(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      // fall through to the assignment format
    }
  }
  const values: Record<string, string> = {};
  for (const match of trimmed.matchAll(/^EWREST_(\w+)\s*=\s*'((?:\\.|[^'\\])*)'\s*;?\s*$/gm)) {
    values[match[1]!] = unescapeJs(match[2]!);
  }
  return Object.keys(values).length > 0 ? values : { response: trimmed };
}

type Account = {
  fields: { host: string; kb: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.host);

  const call = async (row: Row, input: Record<string, unknown>) => {
    const search = new URLSearchParams({ $KB: account.fields.kb, $lang: "en", err_code_resp: "1" });
    const form = new URLSearchParams();
    for (const [name, , , where, param] of row.fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (row.action === "update" && name === "force") {
        if (value === true) form.append("$operationHints", "NOLOCK");
      } else if (name === "fields" && row.action !== "search") {
        // Record fields map logical field names to values: one form parameter per field.
        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
          for (const item of Array.isArray(entry) ? entry : [entry]) form.append(key, String(item));
        }
      } else {
        const target = where === "body" ? form : search;
        for (const item of Array.isArray(value) ? value : [value]) target.append(param, String(item));
      }
    }

    const hasBody = row.method === "POST";
    const path = row.json === true ? `${row.path}/.json` : row.path;
    const response = await fetcher(account.url(`${base}${path}?${search.toString()}`), {
      method: row.method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body: hasBody ? form.toString() : undefined,
    });
    const text = await response.text();
    if (row.action === "asyncStatus") return { status: response.status };
    if (!response.ok) throw new Error(`Agiloft answered ${response.status}: ${text.slice(0, 1000)}`);
    return parseAnswer(text);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const options = { description: describe(row.description, row.fields), input: schemaFor(row.fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(row, input);
    const readOnly = row.method === "GET" || row.readOnly === true;
    const tool = readOnly ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(row.resource) ?? {};
    group[row.action] = tool;
    groups.set(row.resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { agiloft: agiloft.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.agiloft ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Agiloft",
        description:
          "Agiloft contract lifecycle and business process management: knowledgebase schema, record search, read, create, update, upsert and delete, record locks, action buttons and attachment info.",
        icons,
      },
    ),
  }),
);
