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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Ragic accounts live on one regional server and every request must go to that server. The docs give no
// complete list; these are the hosts named in the HTTP API docs and the OpenAPI server description.
const servers = ["www", "na3", "ap2", "ap5", "ap8", "eu2"] as const;
type Server = (typeof servers)[number];
const isServer = (value: string): value is Server => (servers as readonly string[]).includes(value);

const ragic = defineProvider({
  name: "Ragic",
  hosts: servers.map((server) => `${server}.ragic.com`),
  auth: {
    apiKey: secrets({
      label: `API key (server: ${servers.join(", ")}; account: the account name in your Ragic URL)`,
      fields: object({
        server: plain(string({ minLength: 1 })),
        account: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  // Documented exception to the authoring guide: Ragic has no read-only current-user endpoint
  // (its /AUTH endpoint takes a password), so health makes no network call and only checks the
  // server name. A wrong key or account surfaces as an error on the first tool call.
  async health({ account }) {
    if (!isServer(account.fields.server)) {
      throw new Error(`Unknown Ragic server "${account.fields.server}". Use one of: ${servers.join(", ")}`);
    }
  },
});

type Params = Record<string, unknown>;

function client(server: Server, accountName: string, token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = `https://${server}.ragic.com/${encodeURIComponent(accountName)}`;
  // sheet is "<tab folder>/<sheet index>" or just "<sheet index>", e.g. "sales/1".
  const sheetUrl = (sheet: string, recordId?: number | string, suffix = "") => {
    const clean = sheet.replace(/^\/+|\/+$/g, "");
    if (clean === "" || clean.split("/").some((part) => part === "." || part === "..")) throw new Error(`Invalid sheet path "${sheet}"`);
    const path = clean.split("/").map(encodeURIComponent).join("/");
    return `${base}/${path}${recordId === undefined ? "" : `/${encodeURIComponent(String(recordId))}`}${suffix}`;
  };
  const withParams = (url: string, params: Params, multi: Record<string, readonly string[] | undefined> = {}) => {
    const u = new URL(url);
    u.searchParams.set("api", "");
    u.searchParams.set("version", "2025-01-01");
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, String(value));
    }
    for (const [key, values] of Object.entries(multi)) for (const value of values ?? []) u.searchParams.append(key, value);
    return u.toString().replace("api=&", "api&");
  };
  const headers = (extra: Record<string, string> = {}) => ({ authorization: `Basic ${token}`, ...extra });
  const send = async (method: string, url: string, body?: unknown) =>
    decodeJson(
      body instanceof FormData
        ? // fetch sets the multipart content-type and boundary itself
          await fetcher(url, { method, signal, headers: headers(), body })
        : await fetcher(url, {
            method,
            signal,
            headers: headers(body === undefined ? {} : { "content-type": "application/json" }),
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          }),
      json(),
    );
  return { sheetUrl, withParams, send, base };
}

const sheetField = string({ minLength: 1 });
const writeFlags = {
  doFormula: boolean().optional(),
  doDefaultValue: boolean().optional(),
  doLinkLoad: boolean().optional(),
  doWorkflow: boolean().optional(),
  doValidation: boolean().optional(),
  checkLock: boolean().optional(),
};

export default defineApp(
  { user: { accounts: { ragic: ragic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ragic ?? [],
        (account) => {
          const { server, account: accountName, token } = account.fields;
          if (!isServer(server)) throw new Error(`Unknown Ragic server "${server}". Use one of: ${servers.join(", ")}`);
          const c = client(server, accountName, token, fetch, signal);
          return router({
            records: router({
              list: query(
                {
                  description:
                    "List records of a sheet (default 1000). sheet is '<tab folder>/<sheet index>' such as 'sales/1'. where entries are 'fieldId,operator,value' (operators eq, regex, gte, lte, gt, lt, like, eqeq; encode commas in values as %2C; dates yyyy/MM/dd). order is 'fieldId,ASC|DESC'. fieldIds limits returned fields. naming 'EID' keys by field id, 'FNAME' by field name.",
                  input: object({
                    sheet: sheetField,
                    where: array(string()).optional(),
                    fts: string().optional(),
                    filterId: string().optional(),
                    limit: number().optional(),
                    offset: number().optional(),
                    order: string().optional(),
                    reverse: boolean().optional(),
                    listing: boolean().optional(),
                    subtables: boolean().optional(),
                    fieldIds: array(string()).optional(),
                    naming: string().optional(),
                  }),
                },
                async (_ctx, i) =>
                  c.send(
                    "GET",
                    c.withParams(
                      c.sheetUrl(i.sheet),
                      {
                        fts: i.fts,
                        filterId: i.filterId,
                        limit: i.limit,
                        offset: i.offset,
                        order: i.order,
                        reverse: i.reverse,
                        listing: i.listing,
                        subtables: i.subtables === undefined ? undefined : i.subtables ? 1 : 0,
                        naming: i.naming,
                      },
                      { where: i.where, fetchDomainIds: i.fieldIds },
                    ),
                  ),
              ),
              get: query(
                {
                  description:
                    "Get one record by id. Set history, comment, approval or conversation to include that metadata.",
                  input: object({
                    sheet: sheetField,
                    recordId: number(),
                    naming: string().optional(),
                    subtables: boolean().optional(),
                    history: boolean().optional(),
                    comment: boolean().optional(),
                    approval: boolean().optional(),
                    conversation: boolean().optional(),
                  }),
                },
                async (_ctx, i) =>
                  c.send(
                    "GET",
                    c.withParams(c.sheetUrl(i.sheet, i.recordId), {
                      naming: i.naming,
                      subtables: i.subtables === undefined ? undefined : i.subtables ? 1 : 0,
                      history: i.history,
                      comment: i.comment,
                      approval: i.approval,
                      conversation: i.conversation,
                    }),
                  ),
              ),
              create: mutation(
                {
                  description:
                    "Create a record. values maps field ids to values. Subtable rows use '_subtable_<key>': { '-1': { fieldId: value } }. doWorkflow=false skips workflows.",
                  input: object({ sheet: sheetField, values: record(json()), ...writeFlags }),
                  approval: always(),
                },
                async (_ctx, { sheet, values, ...flags }) =>
                  c.send("POST", c.withParams(c.sheetUrl(sheet), flags), values),
              ),
              update: mutation(
                {
                  description:
                    "Update a record. values holds only the changed field ids. Existing subtable rows are addressed by row id; delete subtable rows with '_DELSUB_<key>': [rowIds].",
                  input: object({ sheet: sheetField, recordId: number(), values: record(json()), ...writeFlags }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId, values, ...flags }) =>
                  c.send("POST", c.withParams(c.sheetUrl(sheet, recordId), flags), values),
              ),
              delete: mutation(
                {
                  description: "Delete a record by id.",
                  input: object({ sheet: sheetField, recordId: number() }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId }) => c.send("DELETE", c.withParams(c.sheetUrl(sheet, recordId), {})),
              ),
              lock: mutation(
                {
                  description: "Lock a record so others cannot edit it.",
                  input: object({ sheet: sheetField, recordId: number() }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId }) => c.send("POST", c.withParams(c.sheetUrl(sheet, recordId), { lock: "" })),
              ),
              unlock: mutation(
                {
                  description: "Unlock a locked record.",
                  input: object({ sheet: sheetField, recordId: number() }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId }) => c.send("POST", c.withParams(c.sheetUrl(sheet, recordId), { unlock: "" })),
              ),
              comment: mutation(
                {
                  description: "Add a comment to a record.",
                  input: object({ sheet: sheetField, recordId: number(), comment: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId, comment }) => {
                  // Docs: comments are multipart/form-data with `c` (required) and `at` (optional attachment).
                  const form = new FormData();
                  form.append("c", comment);
                  return c.send("POST", c.withParams(c.sheetUrl(sheet, recordId), {}), form);
                },
              ),
            }),
            sheets: router({
              schema: query(
                {
                  description: "Get a sheet's field schema (field ids, names and types). Requires manager access to the sheet.",
                  input: object({ sheet: sheetField }),
                },
                async (_ctx, { sheet }) => c.send("GET", c.withParams(c.sheetUrl(sheet, "metadata", "/schema"), {})),
              ),
              actionButtons: query(
                {
                  description: "List a sheet's action buttons in a category (for example massOperation).",
                  input: object({ sheet: sheetField, category: string().optional() }),
                },
                async (_ctx, { sheet, category }) =>
                  c.send("GET", c.withParams(c.sheetUrl(sheet, "metadata", "/actionButton"), { category })),
              ),
              runActionButton: mutation(
                {
                  description: "Run an action button (bId from actionButtons) on a record.",
                  input: object({ sheet: sheetField, recordId: number(), buttonId: string({ minLength: 1 }) }),
                  approval: always(),
                },
                async (_ctx, { sheet, recordId, buttonId }) =>
                  c.send("POST", c.withParams(c.sheetUrl(sheet, recordId), { bId: buttonId }), {}),
              ),
              massUpdate: mutation(
                {
                  description:
                    "Asynchronously update many records. Target them with where entries or recordIds (give at least one); values maps field ids to new values. Returns a taskId for tasks.status.",
                  input: object({
                    sheet: sheetField,
                    where: array(string()).optional(),
                    recordIds: array(number()).optional(),
                    values: record(json()),
                  }),
                  approval: always(),
                },
                async (_ctx, { sheet, where, recordIds, values }) => {
                  if ((where === undefined || where.length === 0) && (recordIds === undefined || recordIds.length === 0))
                    throw new Error("massUpdate needs where or recordIds");
                  // Docs body: { action: [{ field: <fieldId>, value: <value> }] }
                  const action = Object.entries(values).map(([field, value]) => ({ field: Number(field), value }));
                  return c.send(
                    "POST",
                    c.withParams(c.sheetUrl(sheet, "massOperation", "/massUpdate"), {}, { where, recordId: recordIds?.map(String) }),
                    { action },
                  );
                },
              ),
              massLock: mutation(
                {
                  description:
                    "Asynchronously lock or unlock many records. Target them with where entries or recordIds (give at least one). Returns a taskId for tasks.status.",
                  input: object({
                    sheet: sheetField,
                    where: array(string()).optional(),
                    recordIds: array(number()).optional(),
                    unlock: boolean().optional(),
                  }),
                  approval: always(),
                },
                async (_ctx, { sheet, where, recordIds, unlock }) => {
                  if ((where === undefined || where.length === 0) && (recordIds === undefined || recordIds.length === 0))
                    throw new Error("massLock needs where or recordIds");
                  // Docs body: { action: "lock" | "unlock" }
                  return c.send(
                    "POST",
                    c.withParams(c.sheetUrl(sheet, "massOperation", "/massLock"), {}, { where, recordId: recordIds?.map(String) }),
                    { action: unlock ? "unlock" : "lock" },
                  );
                },
              ),
            }),
            tasks: router({
              status: query(
                {
                  description: "Progress of an asynchronous mass operation by taskId.",
                  input: object({ taskId: string({ minLength: 1 }) }),
                },
                async (_ctx, { taskId }) => c.send("GET", c.withParams(c.base, { taskId })),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Ragic",
        description:
          "Ragic no-code database: list, search, create, update and delete sheet records, read sheet schemas, comment, lock, run action buttons and mass operations. Each account needs the Ragic server, account name and API key.",
        icons,
      },
    ),
  }),
);
