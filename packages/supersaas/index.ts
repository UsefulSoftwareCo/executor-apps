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
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.supersaas.com";

const supersaas = defineProvider({
  name: "SuperSaaS",
  hosts: ["www.supersaas.com"],
  auth: {
    // HTTP Basic: the account name is the username and the API key is the password.
    apiKey: secrets({
      label: "Account name and API key",
      fields: object({ account: string({ minLength: 1 }), apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api/schedules.json`, {
      signal,
      headers: { Authorization: basic(account.fields) },
    });
    await decodeJson(response, json());
  },
});

type Credentials = { account: string; apiKey: string };
type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;

function basic(fields: Credentials) {
  return `Basic ${btoa(`${fields.account}:${fields.apiKey}`)}`;
}

function toSearch(params: Params | undefined) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined) search.set(key, String(value));
  return search;
}

// Nested fields (user[name], booking[start]) are sent form-encoded, as the vendor documents.
function nested(root: string, fields: Record<string, unknown>) {
  const out: Params = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    out[`${root}[${key}]`] = typeof value === "object" ? JSON.stringify(value) : (value as string | number | boolean);
  }
  return out;
}

function client(credentials: Credentials, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, query?: Params, form?: Params) => {
    const search = toSearch(query).toString();
    const headers: Record<string, string> = { Authorization: basic(credentials), Accept: "application/json" };
    let body: string | undefined;
    if (form) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = toSearch(form).toString();
    }
    const response = await fetcher(`${base}${path}${search ? `?${search}` : ""}`, { method, signal, headers, body });
    const text = await response.text();
    if (!response.ok) throw new Error(`SuperSaaS ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`);
    let parsed: unknown = null;
    if (text.trim()) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    // Creates answer 201 with an empty body; the new id is the last segment of the Location header.
    const location = response.headers.get("location");
    return { status: response.status, location, id: location ? (location.split("/").pop() ?? null) : null, data: parsed } as unknown as Record<string, never>;
  };
}

// Numeric ids are SuperSaaS ids and go in the path. Foreign keys may contain a period, which the vendor
// requires in the query form, so they are sent as ?id=.
function userTarget(id: string | undefined, query: Params = {}): [string, Params] {
  if (id === undefined) return ["/api/users.json", query];
  if (/^\d+$/.test(id)) return [`/api/users/${id}.json`, query];
  return ["/api/users.json", { ...query, id }];
}

const ScheduleId = number();
const Paging = { limit: number().optional(), offset: number().optional() };
const Fields = record(json());

function build(call: ReturnType<typeof client>) {
  return router({
    schedules: query(
      { description: "List the account's schedules as [schedule id, name] pairs.", input: object({}) },
      async () => call("GET", "/api/schedules.json"),
    ),
    resources: query(
      {
        description: "List the resources or services of a schedule as [id, name] pairs. Not available for capacity schedules.",
        input: object({ schedule_id: ScheduleId }),
      },
      async (_ctx, { schedule_id }) => call("GET", "/api/resources.json", { schedule_id }),
    ),
    fieldList: query(
      {
        description: "List the custom fields of a schedule, or of the user object when schedule_id is omitted.",
        input: object({ schedule_id: number().optional() }),
      },
      async (_ctx, { schedule_id }) => call("GET", "/api/field_list.json", { schedule_id }),
    ),
    groups: query(
      { description: "List the user groups defined in the account as [group id, name] pairs.", input: object({}) },
      async () => call("GET", "/api/groups.json"),
    ),
    superForms: query(
      { description: "List the account's form definitions as [form id, name] pairs.", input: object({}) },
      async () => call("GET", "/api/super_forms.json"),
    ),
    users: router(
      {
        list: query(
          {
            description: "List users (default 100 per call). Use offset to page past 1000. form=true includes attached form data.",
            input: object({ ...Paging, form: boolean().optional() }),
          },
          async (_ctx, input) => call("GET", "/api/users.json", input),
        ),
        get: query(
          {
            description:
              "Read one user by id. A fully numeric id is the SuperSaaS id, anything else is your own foreign key (for example 1234fk).",
            input: object({ id: string({ minLength: 1 }), form: boolean().optional() }),
          },
          async (_ctx, { id, form }) => call("GET", ...userTarget(id, { form })),
        ),
        create: mutation(
          {
            description:
              "Create a user. Pass id to use your own foreign key (for example 1234fk), otherwise SuperSaaS assigns one. fields: name (required, max 50 chars, an email if email login is on), email, password, full_name, address, mobile, phone, country (ISO 3166-1 alpha-2), timezone (IANA), field_1, field_2, super_field, credit, role (3 regular, 4 superuser, -1 blocked), group (group id), webhook. Set duplicate to 'raise' to fail instead of updating an existing key.",
            input: object({ id: string().optional(), fields: Fields, duplicate: string().optional(), webhook: boolean().optional() }),
          },
          async (_ctx, { id, fields, duplicate, webhook }) =>
            call("POST", ...userTarget(id, { duplicate, webhook }), nested("user", fields)),
        ),
        update: mutation(
          {
            description:
              "Update a user by id (SuperSaaS id or your foreign key) with the given fields (same fields as create). notfound: 'error' returns 404 for a missing key, 'ignore' returns 200; without it a missing key creates the user.",
            input: object({ id: string({ minLength: 1 }), fields: Fields, notfound: string().optional(), webhook: boolean().optional() }),
          },
          async (_ctx, { id, fields, notfound, webhook }) =>
            call("PUT", ...userTarget(id, { notfound, webhook }), nested("user", fields)),
        ),
        delete: mutation(
          { description: "Delete a user by id (SuperSaaS id or your foreign key).", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, { id }) => call("DELETE", ...userTarget(id, {})),
        ),
      },
      { title: "Users", description: "Create, read, update and delete the account's users." },
    ),
    appointments: router(
      {
        recentChanges: query(
          {
            description:
              "Recent changes (created, updated or deleted bookings) of a schedule. Without from, the 10 most recent changes. from/to are UTC 'YYYY-MM-DD HH:MM:SS'. user filters by name, id or foreign key (0 is the admin). slot=true (capacity schedules) nests bookings inside slots.",
            input: object({
              schedule_id: ScheduleId,
              from: string().optional(),
              to: string().optional(),
              user: string().optional(),
              slot: boolean().optional(),
              ...Paging,
            }),
          },
          async (_ctx, { schedule_id, ...rest }) => call("GET", `/api/changes/${schedule_id}.json`, rest),
        ),
        range: query(
          {
            description:
              "List appointments of a schedule starting at 'from' (local time, default now) up to 'to'. today=true limits to the current local day. user, resource_id and service_id filter resource and service schedules; slot=true nests bookings in slots (capacity schedules).",
            input: object({
              schedule_id: ScheduleId,
              from: string().optional(),
              to: string().optional(),
              today: boolean().optional(),
              user: string().optional(),
              resource_id: number().optional(),
              service_id: number().optional(),
              slot: boolean().optional(),
              ...Paging,
            }),
          },
          async (_ctx, { schedule_id, ...rest }) => call("GET", `/api/range/${schedule_id}.json`, rest),
        ),
        agenda: query(
          {
            description:
              "Upcoming appointments of one user (name, id or foreign key; 0 is the admin) on a schedule, or across all schedules when schedule_id is omitted.",
            input: object({ schedule_id: number().optional(), user: string({ minLength: 1 }), from: string().optional(), slot: boolean().optional() }),
          },
          async (_ctx, { schedule_id, ...rest }) => call("GET", schedule_id === undefined ? "/api/agenda.json" : `/api/agenda/${schedule_id}.json`, rest),
        ),
        available: query(
          {
            description:
              "Free slots of a resource or capacity schedule from a local date-time. length is minutes and resource a resource name (resource schedules); full=true includes full slots (capacity schedules). Not available for service schedules.",
            input: object({
              schedule_id: ScheduleId,
              from: string({ minLength: 1 }),
              length: number().optional(),
              resource: string().optional(),
              full: boolean().optional(),
              maxresults: number().optional(),
            }),
          },
          async (_ctx, { schedule_id, ...rest }) => call("GET", `/api/free/${schedule_id}.json`, rest),
        ),
        list: query(
          {
            description: "List bookings of a schedule. start/finish (local time) apply to resource and service schedules.",
            input: object({ schedule_id: ScheduleId, start: string().optional(), finish: string().optional(), limit: number().optional() }),
          },
          async (_ctx, input) => call("GET", "/api/bookings.json", input),
        ),
        get: query(
          {
            description: "Read one booking. form=true includes attached form data.",
            input: object({ schedule_id: ScheduleId, id: number(), form: boolean().optional() }),
          },
          async (_ctx, { id, ...rest }) => call("GET", `/api/bookings/${id}.json`, rest),
        ),
        create: mutation(
          {
            description:
              "Create a booking (not supported on service schedules). fields: start and finish (local 'YYYY-MM-DD HH:MM:SS', resource schedules), slot_id (capacity schedules), resource_id, full_name, address, mobile, phone, country, email, field_1, field_2, field_1_r, field_2_r, super_field, form_id. Which are required depends on the schedule's Process configuration. user_id books on behalf of a user (id or foreign key like 1234fk).",
            input: object({ schedule_id: ScheduleId, user_id: string().optional(), webhook: boolean().optional(), fields: Fields }),
          },
          async (_ctx, { schedule_id, user_id, webhook, fields }) =>
            call("POST", "/api/bookings.json", { schedule_id }, { ...(user_id ? { user_id } : {}), ...(webhook === undefined ? {} : { webhook }), ...nested("booking", fields) }),
        ),
        update: mutation(
          {
            description: "Update a booking with the given fields (same fields as create).",
            input: object({ schedule_id: ScheduleId, id: number(), webhook: boolean().optional(), fields: Fields }),
          },
          async (_ctx, { schedule_id, id, webhook, fields }) =>
            call("PUT", `/api/bookings/${id}.json`, { schedule_id }, { ...(webhook === undefined ? {} : { webhook }), ...nested("booking", fields) }),
        ),
        delete: mutation(
          { description: "Delete a booking.", input: object({ schedule_id: ScheduleId, id: number() }) },
          async (_ctx, { schedule_id, id }) => call("DELETE", `/api/bookings/${id}.json`, { schedule_id }),
        ),
      },
      { title: "Appointments", description: "Read availability and appointments, and create, update or delete bookings." },
    ),
    slots: router(
      {
        list: query(
          {
            description: "List slots of a capacity schedule sorted by start. limit defaults to 100 (max 2500).",
            input: object({ schedule_id: ScheduleId, start: string().optional(), finish: string().optional(), ...Paging }),
          },
          async (_ctx, input) => call("GET", "/api/slots.json", input),
        ),
        get: query(
          { description: "Read one slot of a capacity schedule.", input: object({ schedule_id: ScheduleId, id: number() }) },
          async (_ctx, { id, ...rest }) => call("GET", `/api/slots/${id}.json`, rest),
        ),
        create: mutation(
          {
            description:
              "Create a slot on a capacity schedule. fields: start and finish (local 'YYYY-MM-DD HH:MM', finish after start), title, location, description (max 2000 chars), capacity (number, '-' for unlimited, 0 for no bookings), price, color ('#hex' or 0-14). Omitted fields take the schedule defaults.",
            input: object({ schedule_id: ScheduleId, fields: Fields }),
          },
          async (_ctx, { schedule_id, fields }) => call("POST", "/api/slots.json", { schedule_id }, nested("slot", fields)),
        ),
        update: mutation(
          {
            description: "Partially update a slot (same fields as create).",
            input: object({ schedule_id: ScheduleId, id: number(), fields: Fields }),
          },
          async (_ctx, { schedule_id, id, fields }) => call("PUT", `/api/slots/${id}.json`, { schedule_id }, nested("slot", fields)),
        ),
        delete: mutation(
          {
            description: "Delete a slot. This also deletes its bookings without notifying the people who booked, and cannot be undone.",
            input: object({ schedule_id: ScheduleId, id: number() }),
          },
          async (_ctx, { schedule_id, id }) => call("DELETE", `/api/slots/${id}.json`, { schedule_id }),
        ),
      },
      { title: "Slots", description: "Manage the slots of capacity schedules." },
    ),
    forms: router(
      {
        list: query(
          {
            description:
              "List completed forms of one form definition (form_id, from the Configure Overview URL or superForms). from is a UTC 'YYYY-MM-DD HH:MM:SS' lower bound on update time. user filters by name, id or foreign key (0 is the admin).",
            input: object({ form_id: number(), from: string().optional(), user: string().optional(), ...Paging }),
          },
          async (_ctx, input) => call("GET", "/api/forms.json", input),
        ),
        get: query(
          { description: "Read one completed form by its id.", input: object({ id: number() }) },
          async (_ctx, { id }) => call("GET", "/api/forms.json", { id }),
        ),
      },
      { title: "Forms", description: "Read completed custom forms." },
    ),
    promotions: router(
      {
        list: query(
          { description: "List promotion (coupon) codes with description and usage count.", input: object({ ...Paging }) },
          async (_ctx, input) => call("GET", "/api/promotions.json", input),
        ),
        get: query(
          { description: "Read one promotion code.", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, { id }) => call("GET", "/api/promotions.json", { id }),
        ),
        duplicate: mutation(
          {
            description: "Create a new promotion code by copying an existing template code (create the template on the Promotions screen first).",
            input: object({ id: string({ minLength: 1 }), template_code: string({ minLength: 1 }) }),
          },
          async (_ctx, { id, template_code }) => call("POST", "/api/promotions.json", { id, template_code }),
        ),
        delete: mutation(
          { description: "Delete a promotion code. Bookings already made with it keep their discount.", input: object({ id: string({ minLength: 1 }) }) },
          async (_ctx, { id }) => call("DELETE", "/api/promotions.json", { id }),
        ),
      },
      { title: "Promotions", description: "Coupon codes and their usage." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { supersaas: supersaas.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.supersaas ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SuperSaaS",
        description: "Online appointment scheduling: schedules, appointments, availability, capacity slots, users, forms and promotions.",
        instructions:
          "Dates are 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'; booking times are in the schedule's local time, change feeds in UTC. Call schedules first to find schedule ids. Create and delete calls answer with the new id in 'id' (taken from the Location header) when the API returns one.",
        icons,
      },
    ),
  }),
);
