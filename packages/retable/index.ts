import {
  accountRouter,
  array,
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

const base = "https://api.retable.io";

const retable = defineProvider({
  name: "Retable",
  hosts: ["api.retable.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/public/workspace`, {
      signal,
      headers: { ApiKey: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { ApiKey: token, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const id = () => string({ minLength: 1 });
const paging = { limit: number().optional(), offset: number().optional() };

function build(call: Call) {
  return router({
    workspaces: router(
      {
        list: query(
          { description: "List the workspaces the API key's user can access.", input: object({}) },
          async () => call("GET", "/v1/public/workspace"),
        ),
        get: query(
          { description: "Get a workspace and its projects.", input: object({ workspaceId: id() }) },
          async (_ctx, { workspaceId }) => call("GET", `/v1/public/workspace/${encodeURIComponent(workspaceId)}`),
        ),
        create: mutation(
          {
            description: "Create a workspace (a default project is created with it).",
            input: object({ name: string().optional(), description: string().optional() }),
          },
          async (_ctx, { name, description }) => call("POST", "/v1/public/workspace", {}, { name, description }),
        ),
      },
      { title: "Workspaces", description: "Top-level containers for projects." },
    ),
    projects: router(
      {
        list: query(
          { description: "List the projects in a workspace.", input: object({ workspaceId: id() }) },
          async (_ctx, { workspaceId }) => call("GET", `/v1/public/workspace/${encodeURIComponent(workspaceId)}/project`),
        ),
        get: query(
          { description: "Get a project and its tables.", input: object({ projectId: id(), ...paging }) },
          async (_ctx, { projectId, limit, offset }) =>
            call("GET", `/v1/public/project/${encodeURIComponent(projectId)}`, { limit, offset }),
        ),
        create: mutation(
          {
            description: "Create a project in a workspace. color is an optional hex value.",
            input: object({ workspaceId: id(), name: id(), description: string().optional(), color: string().optional() }),
          },
          async (_ctx, { workspaceId, name, description, color }) =>
            call("POST", `/v1/public/workspace/${encodeURIComponent(workspaceId)}/project`, {}, { name, description, color }),
        ),
      },
      { title: "Projects", description: "Projects group tables inside a workspace." },
    ),
    tables: router(
      {
        list: query(
          { description: "List the tables (retables) in a project.", input: object({ projectId: id() }) },
          async (_ctx, { projectId }) => call("GET", `/v1/public/project/${encodeURIComponent(projectId)}/retable`),
        ),
        get: query(
          { description: "Get a table's details and its columns (use this to find column IDs).", input: object({ retableId: id() }) },
          async (_ctx, { retableId }) => call("GET", `/v1/public/retable/${encodeURIComponent(retableId)}`),
        ),
        create: mutation(
          { description: "Create an empty table in a project.", input: object({ projectId: id() }) },
          async (_ctx, { projectId }) => call("POST", `/v1/public/project/${encodeURIComponent(projectId)}/retable`),
        ),
        search: query(
          {
            description:
              "Search a table's rows for a term in one column. columnIds optionally restricts the columns returned.",
            input: object({
              retableId: id(),
              columnId: id(),
              term: id(),
              columnIds: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, { retableId, columnId, term, columnIds, limit, offset }) =>
            call("GET", `/v1/public/retable/${encodeURIComponent(retableId)}/search`, {
              columnID: columnId,
              term,
              columnIDs: columnIds,
              limit,
              offset,
            }),
        ),
      },
      { title: "Tables", description: "Tables (called retables by the API)." },
    ),
    columns: router(
      {
        add: mutation(
          {
            description:
              "Add columns to a table. Each column is { title, type } where type is one of text, number, checkbox, image, calendar, color, email, phonenumber, percent.",
            input: object({ retableId: id(), columns: array(object({ title: id(), type: id() })) }),
          },
          async (_ctx, { retableId, columns }) =>
            call("POST", `/v1/public/retable/${encodeURIComponent(retableId)}/column`, {}, { columns }),
        ),
        delete: mutation(
          {
            description: "Delete columns from a table by column ID.",
            input: object({ retableId: id(), columnIds: array(id()) }),
          },
          async (_ctx, { retableId, columnIds }) =>
            call("DELETE", `/v1/public/retable/${encodeURIComponent(retableId)}/column`, {}, { column_ids: columnIds }),
        ),
      },
      { title: "Columns", description: "Add and remove table columns." },
    ),
    rows: router(
      {
        list: query(
          {
            description:
              "Read table rows (v1 shape: each row has a columns array). rowIds is an optional comma-separated list of up to 50 row IDs; omit it for all rows.",
            input: object({ retableId: id(), rowIds: string().optional() }),
          },
          async (_ctx, { retableId, rowIds }) =>
            call("GET", `/v1/public/retable/${encodeURIComponent(retableId)}/data`, { row_id: rowIds }),
        ),
        listFlat: query(
          {
            description:
              "Read table rows (v2 shape: each row has a flat fields map). rowIds is an optional comma-separated list of up to 50 row IDs; omit it for all rows.",
            input: object({ retableId: id(), rowIds: string().optional() }),
          },
          async (_ctx, { retableId, rowIds }) =>
            call("GET", `/v2/public/retable/${encodeURIComponent(retableId)}/data`, { row_id: rowIds }),
        ),
        insert: mutation(
          {
            description:
              "Insert rows. Each row is { columns: [{ column_id, cell_value }] }; a column name may be used in place of a column ID. Owner or editor only; fails with 402 when the row limit is exceeded.",
            input: object({ retableId: id(), rows: array(record(json())) }),
          },
          async (_ctx, { retableId, rows }) =>
            call("POST", `/v1/public/retable/${encodeURIComponent(retableId)}/data`, {}, { data: rows }),
        ),
        update: mutation(
          {
            description:
              "Update rows. Each row is { row_id, columns: [{ column_id, update_cell_value }] }. Owner or editor only.",
            input: object({ retableId: id(), rows: array(record(json())) }),
          },
          async (_ctx, { retableId, rows }) =>
            call("PUT", `/v1/public/retable/${encodeURIComponent(retableId)}/data`, {}, { rows }),
        ),
        delete: mutation(
          {
            description: "Delete rows by row ID. Owner only; unknown IDs are ignored and counted as 0.",
            input: object({ retableId: id(), rowIds: array(number()) }),
          },
          async (_ctx, { retableId, rowIds }) =>
            call("DELETE", `/v1/public/retable/${encodeURIComponent(retableId)}/data`, {}, { row_ids: rowIds }),
        ),
      },
      { title: "Rows", description: "Read, insert, update and delete table rows." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { retable: retable.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.retable ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Retable",
        description: "Collaborative spreadsheet database: workspaces, projects, tables, columns and rows, with row search.",
        icons,
      },
    ),
  }),
);
