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

const base = "https://api.refiner.io/v1";

const refiner = defineProvider({
  name: "Refiner",
  hosts: ["api.refiner.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/`, { signal, headers: { Authorization: `Bearer ${account.fields.token}` } });
    const info = await decodeJson(response, object({ project_uuid: string(), project_name: string() }));
    return { accountInfo: { externalId: info.project_uuid, displayName: info.project_name } };
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

type Params = Record<string, unknown>;

// Refiner reads nested filters as bracket syntax: response_data[nps]=9, form_uuids[]=a.
const search = (params: Params) => {
  const out = new URLSearchParams();
  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) for (const item of value) add(`${key}[]`, item);
    else if (typeof value === "object") for (const [k, v] of Object.entries(value)) add(`${key}[${k}]`, v);
    else out.append(key, String(value));
  };
  for (const [key, value] of Object.entries(params)) add(key, value);
  return out.toString();
};

const filters = {
  response_data: record(string()).optional(),
  contact_data: record(string()).optional(),
  account_data: record(string()).optional(),
};

const refinerTools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: typeof globalThis.fetch, path: string, params: Params = {}) => {
    const qs = search(params);
    return decodeJson(await fetch(`${base}${path}${qs ? `?${qs}` : ""}`, { signal, headers: headers(account) }), json());
  };
  const send = async (fetch: typeof globalThis.fetch, method: string, path: string, body: Params) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: { ...headers(account), "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      json(),
    );
  // Refiner documents form-encoded bodies with bracket keys (account[id]); nested JSON is not shown for `account`.
  const sendForm = async (fetch: typeof globalThis.fetch, path: string, params: Params) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
        body: search(params),
      }),
      json(),
    );
  const sendQuery = async (fetch: typeof globalThis.fetch, method: string, path: string, params: Params) =>
    decodeJson(await fetch(`${base}${path}?${search(params)}`, { method, signal, headers: headers(account) }), json());

  return router({
    getAccount: query(
      {
        description:
          "Get the Refiner account: subscription plan and usage (monthly tracked users, events, page views, survey responses with limits) and the environments you have created.",
        input: object({}),
      },
      async ({ fetch }) => get(fetch, "/account"),
    ),
    listForms: query(
      {
        description:
          "List surveys (forms) ordered by name. list is all, published, drafts, archived or all_with_archived. include_config=1 adds each survey's configuration and elements; include_info=1 adds creation and publish dates, response and view counts and folder. page_length up to 1000.",
        input: object({
          list: string().optional(),
          page: number().optional(),
          page_length: number().optional(),
          include_config: number().optional(),
          include_info: number().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/forms", input),
    ),
    getFormHistory: query(
      {
        description: "List all previous versions (change log) of a survey, each with its full configuration snapshot and questions.",
        input: object({ form_uuid: string(), page: number().optional(), page_length: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/forms/history", input),
    ),
    publishForm: mutation(
      {
        description: "Publish a survey, or unpublish it by passing published=0.",
        input: object({ form_uuid: string(), published: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/forms/publish", input),
    ),
    duplicateForm: mutation(
      {
        description: "Duplicate a survey. The copy is stored as a draft with the given name. Returns new_form_uuid.",
        input: object({ form_uuid: string(), name: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/forms/duplicate", input),
    ),
    archiveForm: mutation(
      {
        description: "Archive a survey.",
        input: object({ form_uuid: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "DELETE", "/forms", input),
    ),
    listResponses: query(
      {
        description:
          "List survey responses, newest first, with answers and the responding contact. Filter by form_uuid, segment_uuid, tag_uuid (or the plural arrays form_uuids, segment_uuids, tag_uuids), date_range_start/date_range_end (ISO 8601), include (completed, partials or all), search, and response_data / contact_data / account_data objects such as {nps: \"9\"}. Set with_attributes=1 to include all contact attributes. Paginate with page or, for large sets, page_cursor from pagination.next_page_cursor; page_length up to 1000.",
        input: object({
          form_uuid: string().optional(),
          form_uuids: array(string()).optional(),
          segment_uuid: string().optional(),
          segment_uuids: array(string()).optional(),
          tag_uuid: string().optional(),
          tag_uuids: array(string()).optional(),
          date_range_start: string().optional(),
          date_range_end: string().optional(),
          include: string().optional(),
          search: string().optional(),
          with_attributes: number().optional(),
          page: number().optional(),
          page_cursor: string().optional(),
          page_length: number().optional(),
          ...filters,
        }),
      },
      async ({ fetch }, input) => get(fetch, "/responses", input),
    ),
    storeResponse: mutation(
      {
        description:
          "Store a survey response for a user, for historical data or your own survey UI. Needs form_uuid and one of id, email or uuid (contact). answers is an object of question identifier to value, stored as the response data. Optional date (ISO 8601), prevent_duplicates (default true), tags (max 20) and account ({id, name, ...}) to group the user.",
        input: object({
          form_uuid: string(),
          id: string().optional(),
          email: string().optional(),
          uuid: string().optional(),
          date: string().optional(),
          prevent_duplicates: boolean().optional(),
          tags: array(string()).optional(),
          account: record(string()).optional(),
          answers: record(json()),
        }),
        approval: always(),
      },
      async ({ fetch }, { answers, ...rest }) => sendForm(fetch, "/responses", { ...answers, ...rest }),
    ),
    tagResponse: mutation(
      {
        description: "Add tags (max 20) to an existing survey response by its uuid.",
        input: object({ uuid: string(), tags: array(string()) }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/responses/tags", input),
    ),
    getReport: query(
      {
        description:
          "Get aggregated reporting. type is nps, csat, ratings, distribution or count. Optionally filter by question_identifiers, tag_uuids, form_uuids, segment_uuids, date_range_start/date_range_end (default last 7 days) and response_data / contact_data / account_data.",
        input: object({
          type: string(),
          question_identifiers: array(string()).optional(),
          tag_uuids: array(string()).optional(),
          form_uuids: array(string()).optional(),
          segment_uuids: array(string()).optional(),
          date_range_start: string().optional(),
          date_range_end: string().optional(),
          ...filters,
        }),
      },
      async ({ fetch }, input) => get(fetch, "/reporting", input),
    ),
    listContacts: query(
      {
        description:
          "List contacts with their attributes, segments and account. order_by is display_name, email, first_seen_at, last_seen_at or last_form_submission_at. Filter by form_uuid, segment_uuid or search (email, id or name). Paginate with page or page_cursor; page_length up to 1000.",
        input: object({
          order_by: string().optional(),
          form_uuid: string().optional(),
          segment_uuid: string().optional(),
          search: string().optional(),
          page: number().optional(),
          page_cursor: string().optional(),
          page_length: number().optional(),
        }),
      },
      async ({ fetch }, input) => get(fetch, "/contacts", input),
    ),
    getContact: query(
      {
        description: "Get everything Refiner has on one contact. Identify it by id (your user ID), email or uuid (Refiner contact UUID).",
        input: object({ id: string().optional(), email: string().optional(), uuid: string().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/contact", input),
    ),
    deleteContact: mutation(
      {
        description:
          "Delete a contact and their survey responses. Identify it by id, email or uuid. To keep responses, overwrite the user's data with identifyUser instead.",
        input: object({ id: string().optional(), email: string().optional(), uuid: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => sendQuery(fetch, "DELETE", "/contact", input),
    ),
    identifyUser: mutation(
      {
        description:
          "Create or update a contact. Needs id or email. traits is an object of attribute slug to value (strings, numbers, booleans; slugs ending in _at are parsed as dates). account ({id, name, ...}) groups the user under an account.",
        input: object({
          id: string().optional(),
          email: string().optional(),
          traits: record(json()).optional(),
          account: record(string()).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { traits, ...rest }) => sendForm(fetch, "/identify-user", { ...traits, ...rest }),
    ),
    trackEvent: mutation(
      {
        description: "Track a named event for a user identified by id or email. Creates the user when missing.",
        input: object({ id: string().optional(), email: string().optional(), event: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/track-event", input),
    ),
    listSegments: query(
      {
        description: "List segments ordered by name.",
        input: object({ page: number().optional(), page_length: number().optional() }),
      },
      async ({ fetch }, input) => get(fetch, "/segments", input),
    ),
    addUserToSegment: mutation(
      {
        description: "Add a user (id or email; created when missing) to a manual segment.",
        input: object({ segment_uuid: string(), id: string().optional(), email: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "POST", "/sync-segment", input),
    ),
    removeUserFromSegment: mutation(
      {
        description: "Remove a user (id or email) from a manual segment.",
        input: object({ segment_uuid: string(), id: string().optional(), email: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) => send(fetch, "DELETE", "/sync-segment", input),
    ),
  });
};

export default defineApp({ user: { accounts: { refiner: refiner.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.refiner ?? [], (account) => refinerTools(account, signal), { signal }), {
    title: "Refiner",
    description:
      "In-app surveys and customer feedback: survey responses, NPS/CSAT reporting, contacts, forms, segments, user identification and event tracking.",
    icons,
  }),
}));
