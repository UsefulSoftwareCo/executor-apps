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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.fireberry.com";

const fireberry = defineProvider({
  name: "Fireberry",
  hosts: ["api.fireberry.com"],
  auth: {
    apiKey: secrets({
      label: "API access token (TokenID)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/record/account?pagesize=1`, {
      signal,
      headers: { tokenid: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ success: boolean() }));
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Record<string, string | number | undefined> = {}, body?: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
    // Vendor docs: /metadata/* takes tokenid as a query parameter; /api/* takes it as a header.
    if (path.startsWith("/metadata/")) url.searchParams.set("tokenid", token);
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        ...(path.startsWith("/metadata/") ? {} : { tokenid: token }),
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const seg = encodeURIComponent;
const objectName = () =>
  string({ minLength: 1 });
const objectDoc =
  "Object system name (account, contact, opportunity, task, ...) or the numeric object code of a custom object.";
const typeDoc = "Numeric object type code (account=1, contact=2, case=5; list them with metadata.listObjects).";
const paging = { pagesize: number().optional(), pagenumber: number().optional() };

function build(call: Call) {
  const records = router(
    {
      list: query(
        {
          description: `List records of an object (page size max 50, page number max 10; use query.run for larger or filtered reads). ${objectDoc}`,
          input: object({ object: objectName(), ...paging }),
        },
        (_c, { object: o, pagesize, pagenumber }) => call("GET", `/api/record/${seg(o)}`, { pagesize, pagenumber }),
      ),
      get: query(
        { description: `Get one record by its id (GUID). ${objectDoc}`, input: object({ object: objectName(), id: string({ minLength: 1 }) }) },
        (_c, { object: o, id }) => call("GET", `/api/record/${seg(o)}/${seg(id)}`),
      ),
      listRelated: query(
        {
          description: `List the records of a related object linked to a record. objectType and relatedObjectType are numeric object type codes. ${typeDoc}`,
          input: object({
            objectType: number(),
            id: string({ minLength: 1 }),
            relatedObjectType: number(),
            ...paging,
          }),
        },
        (_c, { objectType, id, relatedObjectType, pagesize, pagenumber }) =>
          call("GET", `/api/record/${objectType}/${seg(id)}/${relatedObjectType}`, { pagesize, pagenumber }),
      ),
      create: mutation(
        {
          description: `Create a record. body maps field system names to values (for example {"accountname": "Acme"}); picklists take their numeric value and lookups take the related record id. ${objectDoc}`,
          input: object({ object: objectName(), body: json() }),
        },
        (_c, { object: o, body }) => call("POST", `/api/record/${seg(o)}`, {}, body),
      ),
      update: mutation(
        {
          description: `Update a record by id. body maps the field system names to change to new values. ${objectDoc}`,
          input: object({ object: objectName(), id: string({ minLength: 1 }), body: json() }),
        },
        (_c, { object: o, id, body }) => call("PUT", `/api/record/${seg(o)}/${seg(id)}`, {}, body),
      ),
      delete: mutation(
        { description: `Delete a record by id. ${objectDoc}`, input: object({ object: objectName(), id: string({ minLength: 1 }) }) },
        (_c, { object: o, id }) => call("DELETE", `/api/record/${seg(o)}/${seg(id)}`),
      ),
      batchCreate: mutation(
        {
          description: `Create multiple records at once (batch API; not available on every license; keep batches to 20 or fewer, the documented batch-delete limit). Invalid records are dropped individually while valid ones are still created. records is an array of field maps. objectType: ${typeDoc}`,
          input: object({ objectType: number(), records: array(json()) }),
        },
        (_c, { objectType, records: data }) => call("POST", `/api/v3/record/${objectType}/batch/create`, {}, { data }),
      ),
      batchUpdate: mutation(
        {
          description: `Update multiple records at once (keep batches to 20 or fewer, the documented batch-delete limit). updates is an array of {"id": "<record id>", "record": {<fields to change>}}. objectType: ${typeDoc}`,
          input: object({ objectType: number(), updates: array(json()) }),
        },
        (_c, { objectType, updates: data }) => call("POST", `/api/v3/record/${objectType}/batch/update`, {}, { data }),
      ),
      batchDelete: mutation(
        {
          description: `Delete up to 20 records at once by id (documented limit). objectType: ${typeDoc}`,
          input: object({ objectType: number(), ids: array(string({ minLength: 1 })) }),
        },
        (_c, { objectType, ids: data }) => call("POST", `/api/v3/record/${objectType}/batch/delete`, {}, { data }),
      ),
    },
    { title: "Records", description: "Read and write records of any standard or custom object." },
  );

  const queries = router(
    {
      run: query(
        {
          description:
            'Query records with the v3 structured query. body: {"objectType": 1, "fields": [{"name": "accountname"}], "filter": [{"type": "AND", "conditions": [{"fieldName": "accountname", "operator": "start-with", "value": "A"}]}], "orderBy": [{"name": "accountname", "order": "asc"}], "pageNumber": 1, "pageSize": 100}. Operators: eq, ne, lt, gt, le, ge, start-with, not-start-with, is-null, is-not-null, eq-in, not-in, between, userid. fields may use related fields such as contactid_fullname; aggrFunc (SUM, COUNT, MIN, MAX) needs groupBy. pageSize is 1-500.',
          input: object({ body: json() }),
        },
        (_c, { body }) => call("POST", "/api/v3/query", {}, body),
      ),
      legacy: query(
        {
          description:
            'Query records with the legacy query. body: {"objecttype": 1, "fields": "accountname,emailaddress1" (or "*"), "query": "((accountname = \'Acme\') AND (statuscode = 1))", "page_size": 50, "page_number": 1, "sort_by": "accountname", "sort_type": "asc"}.',
          input: object({ body: json() }),
        },
        (_c, { body }) => call("POST", "/api/query", {}, body),
      ),
    },
    { title: "Query", description: "Search, filter, sort and aggregate records." },
  );

  const metadata = router(
    {
      listObjects: query({ description: "List all objects (standard and custom) with their name, systemName and objectType code.", input: object({}) }, () =>
        call("GET", "/metadata/records"),
      ),
      getObject: query(
        { description: `Get one object's metadata. ${typeDoc}`, input: object({ objectType: number() }) },
        (_c, { objectType }) => call("GET", `/metadata/records/${objectType}`),
      ),
      listFields: query(
        { description: `List an object's fields with their types. ${typeDoc}`, input: object({ objectType: number() }) },
        (_c, { objectType }) => call("GET", `/metadata/records/${objectType}/fields`),
      ),
      getField: query(
        { description: `Get one field's details. ${typeDoc}`, input: object({ objectType: number(), fieldName: string({ minLength: 1 }) }) },
        (_c, { objectType, fieldName }) => call("GET", `/metadata/records/${objectType}/fields/${seg(fieldName)}`),
      ),
      listPicklistValues: query(
        {
          description: `List the values of a picklist field (use these numeric values when writing records). ${typeDoc}`,
          input: object({ objectType: number(), fieldName: string({ minLength: 1 }) }),
        },
        (_c, { objectType, fieldName }) => call("GET", `/metadata/records/${objectType}/fields/${seg(fieldName)}/values`),
      ),
    },
    { title: "Metadata", description: "Discover objects, fields and picklist values." },
  );

  const schema = router(
    {
      createObject: mutation(
        {
          description: "Create a custom object. name is the singular name, collectionname the plural.",
          input: object({ name: string({ minLength: 1 }), collectionname: string({ minLength: 1 }) }),
        },
        (_c, body) => call("POST", "/api/v2/record/58", {}, body),
      ),
      deleteCustomField: mutation(
        {
          description: `Delete a custom field. fieldType must be one of: text, emailaddress, url, phonenumber, number, textarea, html, date, datetime, lookup, summary, formula, picklist. ${typeDoc}`,
          input: object({ objectType: number(), fieldType: string({ minLength: 1 }), fieldName: string({ minLength: 1 }) }),
        },
        (_c, { objectType, fieldType, fieldName }) =>
          call("DELETE", `/api/v2/system-field/${objectType}/${seg(fieldType)}/${seg(fieldName)}`),
      ),
    },
    { title: "Schema", description: "Create custom objects and delete custom fields." },
  );

  return router({ records, query: queries, metadata, schema });
}

export default defineApp(
  { user: { accounts: { fireberry: fireberry.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fireberry ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Fireberry",
        description:
          "Fireberry CRM: accounts, contacts, opportunities, tasks, invoices and any custom object, with v3 queries, batch writes and metadata.",
        icons,
        instructions:
          "Records are addressed by object system name (account, contact, ...) or custom object code. Use metadata.listObjects and metadata.listFields to find object type codes and field system names before querying or writing.",
      },
    ),
  }),
);
