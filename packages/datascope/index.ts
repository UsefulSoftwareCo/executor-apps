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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.mydatascope.com/api/external";

const datascope = defineProvider({
  name: "DataScope",
  hosts: ["www.mydatascope.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing locations is read-only and needs no export permission.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/locations`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | undefined>;

const headers = (account: Account, body = false) => ({
  Authorization: account.fields.token,
  Accept: "application/json",
  ...(body ? { "content-type": "application/json" } : {}),
});

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const optString = () => string().optional();
const optNumber = () => number().optional();

const datascopeTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Params = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers: headers(account) }), json());
  const send = (path: string, body: unknown, params: Params = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(
        await fetch(`${base}${path}${search(params)}`, {
          method: "POST",
          signal,
          headers: headers(account, true),
          body: JSON.stringify(body),
        }),
        json(),
      );

  // Query-string POST with an empty body (assign_task, change_form_answer, findings/create per the vendor Swagger).
  const sendQuery = (path: string, params: Params) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(
        await fetch(`${base}${path}${search(params)}`, { method: "POST", signal, headers: headers(account) }),
        json(),
      );
  // change_state: the Swagger declares query parameters, the prose docs a form-encoded body.
  // Send both (identical values); the server reads either.
  const sendQueryAndForm = (path: string, params: Record<string, string>) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeJson(
        await fetch(`${base}${path}${search(params)}`, {
          method: "POST",
          signal,
          headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(params).toString(),
        }),
        json(),
      );

  const locationFields = {
    name: optString(),
    description: optString(),
    code: optString(),
    address: optString(),
    city: optString(),
    country: optString(),
    latitude: optString(),
    longitude: optString(),
    phone: optString(),
    company_code: optString(),
    company_name: optString(),
    email: optString(),
  };
  const listObjectFields = {
    name: optString(),
    description: optString(),
    code: optString(),
    attribute1: optString(),
    attribute2: optString(),
  };

  return router({
    listAnswers: query(
      {
        description:
          "List completed form answers (v2). Defaults to the last 7 days; start/end are dates and the range may not exceed 90 days. Filter by form_id, user_id (email) or location_id. date_modified=true filters by modification date. limit max 200 (default 200), offset for paging.",
        input: object({
          form_id: optString(),
          user_id: optString(),
          start: optString(),
          end: optString(),
          location_id: optString(),
          date_modified: optString(),
          limit: optNumber(),
          offset: optNumber(),
        }),
      },
      async (ctx, input) => get("/v2/answers", input)(ctx),
    ),
    listAnswersV5: query(
      {
        description:
          "List form answers with the v5 (beta) endpoint; needs export permission for the key's user. version v1-v5 selects the shape; custom_fields is a comma-separated list of extras (for example answers_data_in_array, answers_extra_data, form_finished). form_id may be comma-separated. Dates are ISO 8601 (max 90 days) or days_limit (default 7). Page with page/limit (max 200) or the since cursor (<updated_at>|<form_answer_id>). sort_order is asc or desc.",
        input: object({
          version: optString(),
          custom_fields: optString(),
          form_id: optString(),
          user_id: optString(),
          location_id: optString(),
          days_limit: optNumber(),
          start: optString(),
          end: optString(),
          date_modified: optString(),
          order_date: optString(),
          sort_order: optString(),
          limit: optNumber(),
          page: optNumber(),
          offset: optNumber(),
          since: optString(),
        }),
      },
      async (ctx, input) => get("/v5/answers", input)(ctx),
    ),
    listAnswersWithMetadata: query(
      {
        description: "List answers with metadata from the legacy /answers endpoint (up to 600 results). Filter by form_id, user_id, start, end, location_id.",
        input: object({ form_id: optString(), user_id: optString(), start: optString(), end: optString(), location_id: optString() }),
      },
      async (ctx, input) => get("/answers", input)(ctx),
    ),
    changeFormAnswer: mutation(
      {
        description:
          "Change the value of one question in a completed form answer. form_name and form_code identify the answer; subform_index starts at 1 and is omitted when the question is not in a subform.",
        input: object({
          form_name: string(),
          form_code: string(),
          question_name: string(),
          question_value: string(),
          subform_index: optNumber(),
        }),
        approval: always(),
      },
      async (ctx, input) => sendQuery("/change_form_answer", input)(ctx),
    ),
    listStates: query(
      { description: "List the workflow states a form answer can be moved to (type, key, identifier).", input: object({}) },
      async (ctx) => get("/list_states")(ctx),
    ),
    changeState: mutation(
      {
        description: "Move a form answer to another workflow state. form_name is the form name (not ID), form_code identifies the answer, form_state_id is the key from listStates.",
        input: object({ form_name: string(), form_code: string(), form_state_id: string() }),
        approval: always(),
      },
      async (ctx, input) => sendQueryAndForm("/change_state", input)(ctx),
    ),
    listSignatures: query(
      {
        description:
          "List signatures. start/end are ISO 8601; without start the whole history is walked. limit max 200; pass back next_cursor as since. custom_fields accepts signer_identity and documents.",
        input: object({ start: optString(), end: optString(), limit: optNumber(), since: optString(), custom_fields: optString() }),
      },
      async (ctx, input) => get("/signatures/list", input)(ctx),
    ),
    listLocations: query({ description: "List all locations.", input: object({}) }, async (ctx) => get("/locations")(ctx)),
    createLocation: mutation(
      { description: "Create a location.", input: object(locationFields), approval: always() },
      async (ctx, input) => send("/locations", { location: input })(ctx),
    ),
    updateLocation: mutation(
      {
        description: "Update a location by id; only the fields supplied are sent.",
        input: object({ id: string(), ...locationFields }),
        approval: always(),
      },
      async (ctx, { id, ...input }) => send(`/locations/${encodeURIComponent(id)}`, { location: input })(ctx),
    ),
    listMetadataObjects: query(
      {
        description: "List the elements of a list (metadata type). metadata_type is the list's id or name; use the locations tools for locations.",
        input: object({ metadata_type: string() }),
      },
      async (ctx, input) => get("/metadata_objects", input)(ctx),
    ),
    getMetadataObject: query(
      { description: "Get one element of a list.", input: object({ metadata_type: string(), metadata_id: string() }) },
      async (ctx, input) => get("/metadata_object", input)(ctx),
    ),
    createMetadataObject: mutation(
      {
        description: "Create an element in a list.",
        input: object({ metadata_type: string(), ...listObjectFields }),
        approval: always(),
      },
      async (ctx, { metadata_type, ...input }) => send("/metadata_object", { list_object: input }, { metadata_type })(ctx),
    ),
    updateMetadataObject: mutation(
      {
        description: "Update an element of a list by id.",
        input: object({ id: string(), ...listObjectFields }),
        approval: always(),
      },
      async (ctx, { id, ...input }) => send(`/metadata_object/${encodeURIComponent(id)}`, { list_object: input })(ctx),
    ),
    createMetadataType: mutation(
      {
        description: "Create an empty list. list_type is standard, percent or price.",
        input: object({ name: string(), description: optString(), code: optString(), list_type: optString() }),
        approval: always(),
      },
      async (ctx, input) => send("/metadata_types", { list: input })(ctx),
    ),
    updateMetadataType: mutation(
      {
        description: "Update a list by id.",
        input: object({ id: string(), name: optString(), description: optString(), code: optString(), list_type: optString() }),
        approval: always(),
      },
      async (ctx, { id, ...input }) => send(`/metadata_types/${encodeURIComponent(id)}`, { list: input })(ctx),
    ),
    bulkUpdateMetadataObjects: mutation(
      {
        description:
          "Experimental. Replace the whole contents of a list: elements whose code is missing from list_objects are soft-deleted. metadata_type cannot be locations.",
        input: object({
          metadata_type: string(),
          name: optString(),
          list_objects: array(object(listObjectFields)),
        }),
        approval: always(),
      },
      async (ctx, input) => send("/metadata_objects/bulk_update", input)(ctx),
    ),
    assignTask: mutation(
      {
        description:
          "Assign a form task to a user. user_id is the user's email, date is 'YYYY-mm-dd HH:MM', gap is hours. Location is given with l_code, location_name, location_address, l_phone, l_email, latitude, longitude; company with c_name and c_code.",
        input: object({
          form_id: string(),
          user_id: string(),
          date: optString(),
          task_instruction: optString(),
          gap: optNumber(),
          code: optString(),
          l_code: optString(),
          location_name: optString(),
          location_address: optString(),
          l_phone: optString(),
          l_email: optString(),
          latitude: optString(),
          longitude: optString(),
          c_name: optString(),
          c_code: optString(),
        }),
        approval: always(),
      },
      async (ctx, input) => sendQuery("/assign_task", input)(ctx),
    ),
    createTicket: mutation(
      {
        description:
          "Create a ticket (finding). expiration_date is 'YYYY-MM-DD HH:MM'. assignees is a comma-separated list of user IDs or emails (max 100). Optional: author_email, status (open, in_progress, paused, closed), priority (low, medium, high, critical), location_id, location_name, type (ticket type ID or name, see listTicketTypes), invitees (comma-separated, max 100), creation_date ('YYYY-MM-DD HH:MM').",
        input: object({
          name: string(),
          description: string(),
          expiration_date: string(),
          assignees: string(),
          author_email: optString(),
          status: optString(),
          priority: optString(),
          location_id: optString(),
          location_name: optString(),
          type: optString(),
          invitees: optString(),
          creation_date: optString(),
        }),
        approval: always(),
      },
      async (ctx, input) => sendQuery("/findings/create", input)(ctx),
    ),
    listTaskAssigns: query(
      {
        description: "List task assignments. start/end are YYYY-MM-DD and filter on start_time; without them all history is returned. limit default 100, max 300.",
        input: object({ start: optString(), end: optString(), status: optString(), location_id: optString(), user_email: optString(), limit: optNumber(), offset: optNumber() }),
      },
      async (ctx, input) => get("/task_assigns", input)(ctx),
    ),
    getTaskAssign: query(
      { description: "Get one task assignment by id.", input: object({ id: string() }) },
      async (ctx, { id }) => get(`/task_assigns/${encodeURIComponent(id)}`)(ctx),
    ),
    listNotifications: query(
      { description: "List notifications; defaults to the last 7 days.", input: object({ start: optString(), end: optString() }) },
      async (ctx, input) => get("/notifications", input)(ctx),
    ),
    listFiles: query(
      { description: "List files uploaded with form answers between start and end.", input: object({ start: optString(), end: optString() }) },
      async (ctx, input) => get("/files", input)(ctx),
    ),
    listTickets: query(
      {
        description:
          "List tickets (findings). start/end use dd-mm-yyyy, default last 7 days, max 90 days. status is open, in_progress, paused or closed. limit max 200, offset max 2000.",
        input: object({ start: optString(), end: optString(), status: optString(), task_form_id: optString(), limit: optNumber(), offset: optNumber() }),
      },
      async (ctx, input) => get("/findings/list", input)(ctx),
    ),
    getTicket: query(
      { description: "Get one ticket by its document id.", input: object({ id: string() }) },
      async (ctx, { id }) => get(`/findings/get/${encodeURIComponent(id)}`)(ctx),
    ),
    lastTickets: query({ description: "Get the most recent tickets.", input: object({}) }, async (ctx) => get("/last_findings")(ctx)),
    listTicketTypes: query(
      { description: "List ticket types, optionally filtered by a search term.", input: object({ search: optString() }) },
      async (ctx, input) => get("/findings/types", input)(ctx),
    ),
  });
};

export default defineApp({ user: { accounts: { datascope: datascope.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.datascope ?? [], (account) => datascopeTools(account, signal), { signal }), {
    title: "DataScope",
    description: "Read and update DataScope mobile form answers, locations, lists, task assignments, signatures, files and tickets.",
    icons,
  }),
}));
