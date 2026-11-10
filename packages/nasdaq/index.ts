import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://data.nasdaq.com/api/v3";

const nasdaq = defineProvider({
  name: "Nasdaq Data Link",
  hosts: ["data.nasdaq.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing databases needs no subscription, but a wrong key still answers 401.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/databases.json?per_page=1`, {
      signal,
      headers: { "x-api-token": account.fields.token, accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

export default defineApp(
  { user: { accounts: { nasdaq: nasdaq.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.nasdaq ?? [],
        (account) => {
          // The key goes in the documented x-api-token header so it never appears in URLs.
          const get = async (path: string, params: Params = {}) => {
            const url = new URL(`${base}${path}`);
            for (const [key, value] of Object.entries(params)) {
              if (value === undefined || value === null) continue;
              if (Array.isArray(value)) url.searchParams.set(key, value.join(","));
              else url.searchParams.set(key, String(value));
            }
            return decodeJson(
              await fetch(url.toString(), {
                signal,
                headers: { "x-api-token": account.fields.token, accept: "application/json" },
              }),
              json(),
            );
          };
          return router({
            databases: router(
              {
                list: query(
                  {
                    description: "List Nasdaq Data Link databases (data providers' collections).",
                    input: object({ query: string().optional(), page: number().optional(), per_page: number().optional() }),
                  },
                  (_ctx, input) => get("/databases.json", input),
                ),
                get: query(
                  {
                    description: "Get metadata for a database by its code, for example WIKI.",
                    input: object({ database_code: string({ minLength: 1 }) }),
                  },
                  (_ctx, { database_code }) => get(`/databases/${encodeURIComponent(database_code)}.json`),
                ),
              },
              { title: "Databases", description: "Browse the databases that group datasets." },
            ),
            datasets: router(
              {
                search: query(
                  {
                    description:
                      "Search time-series datasets by keyword, optionally within one database. Returns dataset codes and column names.",
                    input: object({
                      query: string().optional(),
                      database_code: string().optional(),
                      page: number().optional(),
                      per_page: number().optional(),
                    }),
                  },
                  (_ctx, input) => get("/datasets.json", input),
                ),
                metadata: query(
                  {
                    description: "Get a time-series dataset's metadata: name, description, columns, frequency and date range.",
                    input: object({ database_code: string({ minLength: 1 }), dataset_code: string({ minLength: 1 }) }),
                  },
                  (_ctx, { database_code, dataset_code }) =>
                    get(`/datasets/${encodeURIComponent(database_code)}/${encodeURIComponent(dataset_code)}/metadata.json`),
                ),
                data: query(
                  {
                    description:
                      "Fetch rows of a time-series dataset, for example WIKI/AAPL. Supports date filters, column selection, frequency collapse and transforms.",
                    input: object({
                      database_code: string({ minLength: 1 }),
                      dataset_code: string({ minLength: 1 }),
                      start_date: string().optional(),
                      end_date: string().optional(),
                      limit: number().optional(),
                      column_index: number().optional(),
                      order: string().optional(),
                      collapse: string().optional(),
                      transform: string().optional(),
                    }),
                  },
                  (_ctx, { database_code, dataset_code, ...params }) =>
                    get(`/datasets/${encodeURIComponent(database_code)}/${encodeURIComponent(dataset_code)}/data.json`, params),
                ),
              },
              { title: "Datasets", description: "Time-series datasets addressed as DATABASE/DATASET, for example WIKI/AAPL." },
            ),
            datatables: router(
              {
                metadata: query(
                  {
                    description: "Get a datatable's metadata: columns, filterable columns and primary keys.",
                    input: object({ vendor_code: string({ minLength: 1 }), datatable_code: string({ minLength: 1 }) }),
                  },
                  (_ctx, { vendor_code, datatable_code }) =>
                    get(`/datatables/${encodeURIComponent(vendor_code)}/${encodeURIComponent(datatable_code)}/metadata.json`),
                ),
                data: query(
                  {
                    description:
                      "Query a datatable such as ZACKS/FC or SHARADAR/SF1. `filters` maps a filterable column, optionally suffixed .gt .gte .lt .lte, to a value, for example { ticker: \"AAPL\", \"calendardate.gte\": \"2020-01-01\" }. Page with next_cursor_id from the previous response.",
                    input: object({
                      vendor_code: string({ minLength: 1 }),
                      datatable_code: string({ minLength: 1 }),
                      filters: record(json()).optional(),
                      columns: array(string()).optional(),
                      per_page: number().optional(),
                      cursor_id: string().optional(),
                    }),
                  },
                  (_ctx, { vendor_code, datatable_code, filters, columns, per_page, cursor_id }) =>
                    get(`/datatables/${encodeURIComponent(vendor_code)}/${encodeURIComponent(datatable_code)}.json`, {
                      ...filters,
                      "qopts.columns": columns,
                      "qopts.per_page": per_page,
                      "qopts.cursor_id": cursor_id,
                    }),
                ),
              },
              { title: "Datatables", description: "Non-time-series tables queried with column filters and cursor pagination." },
            ),
          });
        },
        { signal },
      ),
      {
        title: "Nasdaq Data Link",
        description:
          "Financial and economic data from Nasdaq Data Link: search databases and time-series datasets, and query datatables, with an API key.",
        icons,
      },
    ),
  }),
);
