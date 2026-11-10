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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://stackby.com/api";

// Stackby exposes no current-user endpoint, so the provider declares no health check.
const stackby = defineProvider({
  name: "Stackby",
  hosts: ["stackby.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
});

type Account = { fields: { token: string } };

// The vendor prose names the header `x-api-key`; its Postman requests use `api-key`. Send both (same host).
const headers = (account: Account) => ({
  "x-api-key": account.fields.token,
  "api-key": account.fields.token,
  Accept: "application/json",
});
const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>, ids?: readonly string[]) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  for (const id of ids ?? []) out.append("rowIds[]", id);
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const rowSchema = object({ id: string(), field: record(json()) });
const newRowSchema = object({ field: record(json()) });
const segment = encodeURIComponent;

const stackbyTools = (account: Account, signal: AbortSignal) =>
  router({
    listRows: query(
      {
        description:
          "List rows of a table. stackId and table (table ID or name) come from the stack URL or the stack and table list tools. Returned rows omit empty cells. filter uses Stackby syntax such as toContains({Name},APP); combine with and/or. Operators: toContains, doesNotContain, equal, notEqual, isEmpty, isNotEmpty, greaterThan, greaterThanEqual, lessThan, lessThanEqual, isExactly, isAnyOf. sort is an array of {field, direction asc|desc}. pageSize defaults to 100; use offset for further pages. rowIds fetches specific rows. Rate limit is 5 requests per second per stack.",
        input: object({
          stackId: string(),
          table: string(),
          view: string().optional(),
          filter: string().optional(),
          sort: array(object({ field: string(), direction: string().optional() })).optional(),
          maxRecord: number().optional(),
          pageSize: number().optional(),
          offset: number().optional(),
          latest: string().optional(),
          rowIds: array(string()).optional(),
        }),
      },
      async ({ fetch }, { stackId, table, sort, rowIds, maxRecord, ...rest }) => {
        const params = { ...rest, maxrecord: maxRecord };
        const sorting: Record<string, string> = {};
        (sort ?? []).forEach((item, index) => {
          sorting[`sort[${index}][field]`] = item.field;
          if (item.direction !== undefined) sorting[`sort[${index}][direction]`] = item.direction;
        });
        return decodeJson(
          await fetch(`${base}/v1/rowlist/${segment(stackId)}/${segment(table)}${search({ ...params, ...sorting }, rowIds)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        );
      },
    ),
    newRowsInView: query(
      {
        description:
          "Fetch the newest rows of a view. Get viewId from listViews. maxRecord limits the result (default 15).",
        input: object({ stackId: string(), tableId: string(), viewId: string(), maxRecord: number().optional() }),
      },
      async ({ fetch }, { stackId, tableId, viewId, ...params }) =>
        decodeJson(
          await fetch(`${base}/v1/newrows/${segment(stackId)}/${segment(tableId)}/${segment(viewId)}${search(params)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listViews: query(
      {
        description: "List the views of a table, with their IDs.",
        input: object({ stackId: string(), tableId: string() }),
      },
      async ({ fetch }, { stackId, tableId }) =>
        decodeJson(
          await fetch(`${base}/v1/viewlist/${segment(stackId)}/${segment(tableId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createRows: mutation(
      {
        description:
          "Create up to 10 rows in a table. Each record is {field: {ColumnName: value}}. Returns the created row IDs.",
        input: object({ stackId: string(), table: string(), records: array(newRowSchema) }),
        approval: always(),
      },
      async ({ fetch }, { stackId, table, records }) =>
        decodeJson(
          await fetch(`${base}/v1/rowcreate/${segment(stackId)}/${segment(table)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ records }),
          }),
          json(),
        ),
    ),
    updateRows: mutation(
      {
        description:
          "Update up to 10 rows. Each record is {id: rowId, field: {ColumnName: value}}; only the listed columns change.",
        input: object({ stackId: string(), table: string(), records: array(rowSchema) }),
        approval: always(),
      },
      async ({ fetch }, { stackId, table, records }) =>
        decodeJson(
          await fetch(`${base}/v1/rowupdate/${segment(stackId)}/${segment(table)}`, {
            method: "PATCH",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ records }),
          }),
          json(),
        ),
    ),
    deleteRows: mutation(
      {
        description: "Delete up to 10 rows by row ID. This cannot be undone.",
        input: object({ stackId: string(), table: string(), rowIds: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, { stackId, table, rowIds }) =>
        decodeJson(
          await fetch(`${base}/v1/rowdelete/${segment(stackId)}/${segment(table)}${search({}, rowIds)}`, {
            method: "DELETE",
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listStacks: query(
      {
        description: "List the stacks (bases) in a workspace.",
        input: object({ workspaceId: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/stackList`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    createStack: mutation(
      {
        description: "Create a stack in a workspace. color is a hex string, icon an emoji.",
        input: object({
          name: string(),
          workspaceId: string(),
          color: string().optional(),
          icon: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/v1/stack/create`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    deleteStack: mutation(
      {
        description: "Permanently delete a stack and all its tables.",
        input: object({ stackId: string() }),
        approval: always(),
      },
      async ({ fetch }, { stackId }) =>
        decodeJson(
          await fetch(`${base}/v1/stackDelete/${segment(stackId)}`, { method: "DELETE", signal, headers: headers(account) }),
          json(),
        ),
    ),
    listTables: query(
      {
        description: "List the tables of a stack, with their IDs.",
        input: object({ stackId: string() }),
      },
      async ({ fetch }, { stackId }) =>
        decodeJson(
          await fetch(`${base}/v1/tableList/${segment(stackId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createTable: mutation(
      {
        description:
          "Create a table in a stack. type is usually \"default\". data is optional initial data; copyTable and copyTableData duplicate another table's structure or rows.",
        input: object({
          stackId: string(),
          name: string(),
          type: string().optional(),
          data: string().optional(),
          copyTable: boolean().optional(),
          copyTableData: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { stackId, ...body }) =>
        decodeJson(
          await fetch(`${base}/v1/tableCreate/${segment(stackId)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({
              name: body.name,
              type: body.type ?? "default",
              data: body.data ?? "",
              copyTable: body.copyTable === true,
              copyTableData: body.copyTableData === true,
            }),
          }),
          json(),
        ),
    ),
    deleteTable: mutation(
      {
        description: "Permanently delete a table and its rows.",
        input: object({ stackId: string(), tableId: string() }),
        approval: always(),
      },
      async ({ fetch }, { stackId, tableId }) =>
        decodeJson(
          await fetch(`${base}/v1/tableDelete/${segment(stackId)}/${segment(tableId)}`, {
            method: "DELETE",
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listColumns: query(
      {
        description: "List the columns of a table, with their IDs and types.",
        input: object({ stackId: string(), tableId: string() }),
      },
      async ({ fetch }, { stackId, tableId }) =>
        decodeJson(
          await fetch(`${base}/v1/columnList/${segment(stackId)}/${segment(tableId)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    createColumn: mutation(
      {
        description:
          "Add a column to a table. type is one of shortText, longText, singleCollaborator, multipleCollaborator, singleOption, multipleOptions, attachment, checkbox, dateAndTime, number, phoneNumber, duration, time, rating, email, url, barcode, formula, createdTime, updatedTime, createdBy, updatedBy, autoNumber, checkList, location, signature, link, lookup. viewId comes from listViews. extra holds type-specific body fields: options (singleOption, multipleOptions), isTimeInclude and timeFormat \"12\"|\"24\" (dateAndTime), linkToTableId and linkToTableViewId (link), linkToTableId and linkColumnId (lookup).",
        input: object({
          type: string(),
          name: string(),
          stackId: string(),
          tableId: string(),
          viewId: string(),
          extra: record(json()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { type, extra, ...body }) =>
        decodeJson(
          await fetch(`${base}/v1/columnCreate/${segment(type)}`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ ...extra, ...body }),
          }),
          json(),
        ),
    ),
    deleteColumn: mutation(
      {
        description: "Delete a column from a table. This removes its data.",
        input: object({ stackId: string(), tableId: string(), viewId: string(), columnId: string() }),
        approval: always(),
      },
      async ({ fetch }, { stackId, ...body }) =>
        decodeJson(
          await fetch(`${base}/v1/columnDelete/${segment(stackId)}`, {
            method: "DELETE",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { stackby: stackby.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.stackby ?? [], (account) => stackbyTools(account, signal), { signal }), {
    title: "Stackby",
    description: "Read and write Stackby spreadsheet-database rows, tables, columns, views and stacks.",
    icons,
  }),
}));
