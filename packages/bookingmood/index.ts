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

const base = "https://api.bookingmood.com/v1";

const bookingmood = defineProvider({
  name: "Bookingmood",
  hosts: ["api.bookingmood.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The key is scoped to one organization, so its organization is always listed.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/organizations?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(json()));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | readonly string[] | undefined>;

// Every Bookingmood request is a PostgREST call: filters are column=operator.value query parameters.
function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, params: Params, body?: unknown) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (typeof value === "string") url.searchParams.set(key, value);
      else for (const item of value) url.searchParams.append(key, item);
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        // Return the affected rows from writes instead of an empty body.
        Prefer: "return=representation",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const filters = record(string()).optional();

const filterHelp =
  "filters maps a column to a PostgREST condition, for example { status: 'eq.CONFIRMED', created_at: 'gte.2026-01-01' }. Operators: eq, neq, gt, gte, lt, lte, like, ilike, in.(a,b), is.null, not.<op>.";

const reservedListKeys = new Set(["select", "order", "limit", "offset"]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkUuid(value: string) {
  if (!uuidPattern.test(value)) throw new Error(`Not a uuid: ${value}`);
  return value;
}

const listInput = object({
  select: string().optional(),
  filters,
  order: string().optional(),
  limit: number().optional(),
  offset: number().optional(),
});

// Resource tables and the writes each one documents. Reads exist for every table.
// c = create (POST), u = update (PATCH), d = delete (DELETE).
const resources: Record<string, { label: string; verbs: string }> = {
  api_requests: { label: "API requests", verbs: "" },
  attribute_options: { label: "attribute options", verbs: "cud" },
  attributes: { label: "attributes", verbs: "cud" },
  booking_details: { label: "booking details", verbs: "cud" },
  booking_updates: { label: "booking updates", verbs: "" },
  bookings: { label: "bookings", verbs: "ud" },
  calendar_event_notes: { label: "calendar event notes", verbs: "cud" },
  calendar_event_updates: { label: "calendar event updates", verbs: "" },
  calendar_events: { label: "calendar events", verbs: "ud" },
  capacities: { label: "capacities", verbs: "cud" },
  capacity_group_dependencies: { label: "capacity group dependencies", verbs: "cud" },
  capacity_groups: { label: "capacity groups", verbs: "cud" },
  contact_bookings: { label: "contact bookings", verbs: "cud" },
  contacts: { label: "contacts", verbs: "cud" },
  coupon_products: { label: "coupon products", verbs: "cud" },
  coupon_services: { label: "coupon services", verbs: "cud" },
  coupon_uses: { label: "coupon uses", verbs: "cud" },
  coupons: { label: "coupons", verbs: "cud" },
  external_calendars: { label: "external calendars", verbs: "cud" },
  invoices: { label: "invoices", verbs: "cud" },
  line_item_taxes: { label: "line item taxes", verbs: "cud" },
  line_items: { label: "line items", verbs: "cud" },
  members: { label: "organization members", verbs: "cd" },
  message_events: { label: "message events", verbs: "" },
  message_templates: { label: "message templates", verbs: "cud" },
  messages: { label: "messages", verbs: "" },
  organization_calendar_logs: { label: "organization calendar logs", verbs: "" },
  organizations: { label: "organizations", verbs: "" },
  paddle_plans: { label: "Paddle plans", verbs: "" },
  paddle_subscriptions: { label: "Paddle subscriptions", verbs: "" },
  payments: { label: "payments", verbs: "cud" },
  permissions: { label: "member permissions", verbs: "cud" },
  price_calendar_entries: { label: "price calendar entries", verbs: "cud" },
  pricelabs_pricing: { label: "PriceLabs pricing", verbs: "" },
  pricing_widgets: { label: "pricing widgets", verbs: "cud" },
  product_attribute_options: { label: "product attribute options", verbs: "cud" },
  product_calendar_logs: { label: "product calendar logs", verbs: "" },
  product_message_templates: { label: "product message templates", verbs: "cud" },
  product_reply_to_addresses: { label: "product reply-to addresses", verbs: "cud" },
  product_services: { label: "product services", verbs: "cud" },
  products: { label: "products (rentals)", verbs: "cud" },
  refunds: { label: "refunds", verbs: "cud" },
  reply_to_addresses: { label: "reply-to addresses", verbs: "cud" },
  review_products: { label: "review products", verbs: "cud" },
  review_widget_listings: { label: "review widget listings", verbs: "cud" },
  review_widgets: { label: "review widgets", verbs: "cud" },
  reviews: { label: "reviews", verbs: "cud" },
  seasons: { label: "seasons", verbs: "cud" },
  services: { label: "services (booking form fields and extras)", verbs: "cud" },
  site_listings: { label: "site listings", verbs: "cud" },
  site_nav_items: { label: "site navigation items", verbs: "cud" },
  site_pages: { label: "site pages", verbs: "cud" },
  site_views: { label: "site views", verbs: "" },
  sites: { label: "sites", verbs: "u" },
  task_assignees: { label: "task assignees", verbs: "cud" },
  task_template_assignees: { label: "task template assignees", verbs: "cud" },
  task_templates: { label: "task templates", verbs: "cud" },
  tasks: { label: "tasks", verbs: "cud" },
  taxes: { label: "taxes", verbs: "cud" },
  user_profiles: { label: "user profiles", verbs: "" },
  webhook_notifications: { label: "webhook notifications", verbs: "" },
  webhooks: { label: "webhooks", verbs: "cud" },
  widget_analytics: { label: "widget analytics", verbs: "" },
  widget_listings: { label: "widget listings", verbs: "cud" },
  widgets: { label: "widgets", verbs: "cud" },
};

function requireFilters(applied: Record<string, string> | undefined) {
  if (!applied || Object.keys(applied).length === 0) {
    throw new Error("Refusing to change every row: pass at least one filter, for example { id: 'eq.<uuid>' }.");
  }
  return applied;
}

function resourceTools(call: Call, table: string, { label, verbs }: { label: string; verbs: string }) {
  const tools: Record<string, any> = {
    list: query(
      {
        description: `List ${label}. ${filterHelp} select picks columns and embeds related tables (for example '*,products(*)'). order is like 'created_at.desc'. At most 1000 rows per call; page with limit and offset.`,
        input: listInput,
      },
      async (_ctx, { select, filters: applied, order, limit, offset }) => {
        for (const key of Object.keys(applied ?? {})) {
          if (reservedListKeys.has(key)) {
            throw new Error(`Filter column '${key}' collides with the list parameter of the same name; use the ${key} input instead.`);
          }
        }
        return call("GET", table, {
          ...applied,
          select,
          order,
          limit: limit === undefined ? undefined : String(limit),
          offset: offset === undefined ? undefined : String(offset),
        });
      },
    ),
  };
  if (verbs.includes("c")) {
    tools.create = mutation(
      {
        description: `Create ${label}. body is one row object or an array of row objects; returns the created rows.`,
        input: object({ body: json() }),
      },
      async (_ctx, { body }) => call("POST", table, {}, body),
    );
  }
  if (verbs.includes("u")) {
    tools.update = mutation(
      {
        description: `Update ${label}: apply the partial row in body to every row matching filters (required). ${filterHelp} Returns the updated rows.`,
        input: object({ filters: record(string()), body: json() }),
      },
      async (_ctx, { filters: applied, body }) => call("PATCH", table, requireFilters(applied), body),
    );
  }
  if (verbs.includes("d")) {
    tools.delete = mutation(
      {
        description: `Delete ${label} matching filters (required). ${filterHelp} Returns the deleted rows.`,
        input: object({ filters: record(string()) }),
      },
      async (_ctx, { filters: applied }) => call("DELETE", table, requireFilters(applied)),
    );
  }
  return router(tools, { title: label });
}

const showPending = string().optional();

function build(call: Call) {
  const resourceRouters = Object.fromEntries(
    Object.entries(resources).map(([table, meta]) => [table, resourceTools(call, table, meta)]),
  );
  return router({
    ...resourceRouters,
    availability: query(
      {
        description:
          "Availability intervals (available, tentative, unavailable, booked, reserved) for one or more products over a long period. Pass product_id (one uuid, the form the vendor's example shows) or product_ids (uuids, sent as repeated product_ids keys). show_booked_as is booked or unavailable, show_closed_as is closed or unavailable, show_pending_as is CANCELLED, TENTATIVE or CONFIRMED. perform_sync (true or false) syncs external calendars first.",
        input: object({
          product_id: string().optional(),
          product_ids: array(string()).optional(),
          perform_sync: string().optional(),
          show_booked_as: string().optional(),
          show_closed_as: string().optional(),
          show_pending_as: showPending,
        }),
      },
      async (_ctx, { product_id, product_ids, ...rest }) =>
        call("GET", "availability", {
          ...rest,
          product_id: product_id === undefined ? undefined : checkUuid(product_id),
          product_ids: product_ids?.map(checkUuid),
        }),
    ),
    search: query(
      {
        description:
          "Search which products are available for a date range. body may hold interval { start, end }, occupancy { <capacity_group_id>: guests }, option_ids (attribute option ids), product_ids, show_booked_as, show_closed_as and show_pending_as. Returns match, availability and a price range per product. Read-only: it does not create a booking.",
        input: object({ body: record(json()).optional() }),
      },
      async (_ctx, { body }) => call("POST", "search", {}, body ?? {}),
    ),
    cartValidate: query(
      {
        description:
          "Validate a cart before checkout: reports availability and occupancy per item. body is { cart: { items: [{ id, product_id, interval { start, end }, occupancy, form_values }], coupon_codes? } }. Read-only.",
        input: object({ show_pending_as: showPending, body: json() }),
      },
      async (_ctx, { show_pending_as, body }) => call("POST", "cart-validate", { show_pending_as }, body),
    ),
    book: mutation(
      {
        description:
          "Create a booking for one product. body needs product_id, interval { start, end } (dates), occupancy { <capacity_group_id>: guests } and may hold form_values { <service_id>: value }, coupon_codes, currency, language, redirect_url and show_pending_as. Returns booking_id, reference, secret and payment_url (send the guest there to pay, when set).",
        input: object({ body: record(json()) }),
      },
      async (_ctx, { body }) => call("POST", "book", {}, body),
    ),
    cartCheckout: mutation(
      {
        description:
          "Check out a cart of several products. body is { items: [{ id, product_id, interval, occupancy, form_values }], coupon_codes? }. currency, language, redirect_url, failure_url and show_pending_as are optional. Returns booking_id, reference, secret and payment_url.",
        input: object({
          currency: string().optional(),
          language: string().optional(),
          redirect_url: string().optional(),
          failure_url: string().optional(),
          show_pending_as: showPending,
          body: json(),
        }),
      },
      async (_ctx, { body, ...params }) => call("POST", "cart-checkout", params, body),
    ),
  });
}

export default defineApp(
  { user: { accounts: { bookingmood: bookingmood.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.bookingmood ?? [], (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Bookingmood",
        description:
          "Manage a Bookingmood vacation-rental business: products, bookings, contacts, payments, invoices, pricing and seasons, coupons, messages, tasks, sites and webhooks, plus availability search and the booking flow.",
        instructions:
          "The API is PostgREST over Postgres tables. Use select to choose columns or embed related tables, and filters like { id: 'eq.<uuid>' }. update and delete refuse to run without filters.",
        icons,
      },
    ),
  }),
);
