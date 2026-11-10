import {
  accountRouter,
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

const endpoint = "https://www.planyo.com/rest/";

const planyo = defineProvider({
  name: "Planyo",
  hosts: ["www.planyo.com"],
  auth: {
    // Planyo has no OAuth. The key is created in the Planyo admin panel (Settings > API).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ method: "get_site_info", api_key: account.fields.token }),
    });
    await decodeJson(response, object({ response_code: number() })).then((body) => {
      if (body.response_code !== 0) throw new Error("Planyo rejected the API key");
    });
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, input: Params) => {
    const form = new URLSearchParams({ method, api_key: token });
    const { params, ...named } = input;
    for (const [key, value] of Object.entries({ ...((params as Params | undefined) ?? {}), ...named })) {
      if (value !== undefined && value !== null) form.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(endpoint, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const body = await decodeJson(response, object({ response_code: number(), response_message: string(), data: json() }));
    if (body.response_code !== 0) throw new Error(`Planyo ${method} failed (${body.response_code}): ${body.response_message}`);
    return body.data;
  };
}

type Call = ReturnType<typeof client>;
type Field = "s" | "n";
type Spec = { required?: Record<string, Field>; optional?: Record<string, Field> };

const extra = record(json()).optional();
const base = (kind: Field) => (kind === "n" ? number() : string({ minLength: 1 }));

function shape(spec: Spec) {
  return {
    ...Object.fromEntries(Object.entries(spec.required ?? {}).map(([k, f]) => [k, base(f)])),
    ...Object.fromEntries(Object.entries(spec.optional ?? {}).map(([k, f]) => [k, (f === "n" ? number() : string()).optional()])),
    params: extra,
  };
}

const extraNote = " Pass any other documented parameter (https://www.planyo.com/api.php?topic=<method>) in `params`.";

function read(call: Call, method: string, description: string, spec: Spec = {}) {
  return query({ description: description + extraNote, input: object(shape(spec)) }, async (_ctx, input: Params) => call(method, input));
}

function write(call: Call, method: string, description: string, spec: Spec = {}) {
  return mutation({ description: description + extraNote, input: object(shape(spec)) }, async (_ctx, input: Params) => call(method, input));
}

const time = "Format YYYY-MM-DD HH:MM:SS or a date.";

function build(c: Call) {
  return router({
    site: router(
      {
        info: read(c, "get_site_info", "Get the Planyo site's name, timezone, admin, properties and photos. site_id is only needed for metasite keys.", { optional: { site_id: "n", language: "s" } }),
        list: read(c, "list_sites", "List the sites of a Planyo metasite (metasite API keys only).", { optional: { page: "n" } }),
        reviews: read(c, "list_reviews", "List reviews added by clients.", { optional: { site_id: "n", resource_id: "n" } }),
        formItems: read(c, "get_form_items", "Get the reservation form items for a resource, the global form, or all forms (resource_id -1).", { optional: { resource_id: "n" } }),
        update: write(c, "modify_site", "Modify site settings. Fields to change go in `params`.", { optional: { site_id: "n" } }),
      },
      { title: "Site", description: "Site information, reviews and reservation forms." },
    ),
    resources: router(
      {
        list: read(c, "list_resources", "List resources. detail_level is an ORed sum: 1 name, 2 settings, 4 properties, 8 photos. 100 results per page.", { optional: { detail_level: "n", page: "n", page_size: "n" } }),
        get: read(c, "get_resource_info", "Get a resource's details, photos and properties.", { required: { resource_id: "n" }, optional: { language: "s" } }),
        search: read(c, "resource_search", `Find resources available for a period. start_time/end_time: ${time}`, { required: { start_time: "s", end_time: "s", quantity: "n" }, optional: { site_id: "n", sort: "s", detail_level: "n" } }),
        add: write(c, "add_resource", "Create a resource by copying an existing one (base resource) under a new name.", { required: { name: "s" }, optional: { copy_resource_id: "n" } }),
        update: write(c, "modify_resource", "Modify a resource. Fields to change go in `params`.", { required: { resource_id: "n" } }),
        setUnitNames: write(c, "set_unit_names", "Set the unit names of a resource (count must equal its quantity). Pass unit names in `params` as documented.", { required: { resource_id: "n" } }),
        remove: write(c, "remove_resource", "Permanently remove a resource and all its reservations. Verification params resource_name, site_id and resource_id_md5 go in `params`.", { required: { resource_id: "n" } }),
      },
      { title: "Resources", description: "Rentable resources, units and search." },
    ),
    reservations: router(
      {
        list: read(c, "list_reservations", "List reservations starting (or created, with list_by_creation_date) in a period. 500 per call; use page. detail_level is an ORed sum: 1 info, 2 form items, 4 pricing/payments, 8 resource props, 16 site props, 32 user props, 64 products.", { required: { start_time: "s", end_time: "s" }, optional: { resource_id: "n", site_id: "n", detail_level: "n", page: "n", user_id: "n", user_email: "s", sort: "s", required_status: "s" } }),
        get: read(c, "get_reservation_data", "Get a reservation's details.", { required: { reservation_id: "n" }, optional: { language: "s" } }),
        search: read(c, "reservation_search", "Search reservations by name, login, user ID, reservation ID, email, phone or resource name.", { required: { query: "s" }, optional: { page: "n" } }),
        searchByFormItem: read(c, "search_reservations_by_form_item", "Find reservations whose form item item_name has item_value.", { required: { item_name: "s", item_value: "s" } }),
        actions: read(c, "get_reservation_actions", "List reservation events (modifications, cancellations).", { optional: { reservation_id: "n", user_id: "n", start_time: "s", end_time: "s" } }),
        canMake: read(c, "can_make_reservation", `Check whether a reservation is possible, including constraints beyond availability. ${time}`, { required: { resource_id: "n", start_time: "s", end_time: "s", quantity: "n" } }),
        make: write(c, "make_reservation", `Create a reservation. Needs email and first_name unless user_id is set (put them in \`params\`). Customer notifications are sent unless send_notifications=false. ${time}`, { required: { resource_id: "n", start_time: "s", end_time: "s", quantity: "n" }, optional: { user_id: "n", email: "s", first_name: "s", last_name: "s" } }),
        modify: write(c, "modify_reservation", "Modify a reservation's resource, times, quantity, user or form items.", { required: { reservation_id: "n" }, optional: { resource_id: "n", start_time: "s", end_time: "s", quantity: "n" } }),
        doAction: write(c, "do_reservation_action", "Perform an action: Confirm, Cancel, Reserve, Verify, Checkin, Checkout, Noshow, Unconfirm, Uncancel, Lock, Unlock, Promote and others.", { required: { reservation_id: "n", action: "s" }, optional: { comment: "s" } }),
        setNotes: write(c, "set_reservation_notes", "Set user and/or admin notes (user_notes, admin_notes).", { required: { reservation_id: "n" }, optional: { user_notes: "s", admin_notes: "s" } }),
        setPrice: write(c, "set_reservation_price", "Set a custom reservation price.", { required: { reservation_id: "n" }, optional: { price: "s" } }),
        recalculatePrice: write(c, "recalculate_price", "Recalculate the price of an existing reservation.", { required: { reservation_id: "n" } }),
        delete: write(c, "delete_reservation", "Permanently delete a reservation. Irreversible; use do_reservation_action Cancel to cancel instead.", { required: { reservation_id: "n" } }),
      },
      { title: "Reservations", description: "Create, find, change and act on reservations." },
    ),
    availability: router(
      {
        isAvailable: read(c, "is_resource_available", `Check availability of a resource for a period. ${time}`, { required: { resource_id: "n", start_time: "s", end_time: "s", quantity: "n" } }),
        usage: read(c, "get_resource_usage", `Get usage (reservations, vacations) of a resource or the site for a period. ${time}`, { required: { start_time: "s", end_time: "s" }, optional: { resource_id: "n" } }),
        usageForMonth: read(c, "get_resource_usage_for_month", "Get usage for an entire month.", { required: { month: "n", year: "n" }, optional: { resource_id: "n" } }),
        weeklySchedule: read(c, "get_weekly_schedule", "Get weekly vacations / working hours of a resource.", { optional: { resource_id: "s" } }),
        eventTimes: read(c, "get_event_times", "List event times of an event-type resource.", { required: { resource_id: "n" } }),
        icalFeedUrl: read(c, "get_ical_feed_url", "Get an iCal feed URL for a site or resources.", { optional: { resource_id: "n" } }),
        listVacations: read(c, "list_vacations", "List vacations in a period (resource_id=all with include_site_vacations for everything).", { required: { start_time: "s", end_time: "s" }, optional: { resource_id: "s", site_id: "n" } }),
        addVacation: write(c, "add_vacation", "Add a one-time vacation (blocked period) for a resource or site.", { required: { start_time: "s", end_time: "s" }, optional: { resource_id: "n", site_id: "n", title: "s" } }),
        removeVacation: write(c, "remove_vacation", "Remove a vacation.", { required: { vacation_id: "n" } }),
        setAvailability: write(c, "set_resource_availability", "Set availability in bulk for days or time units.", { required: { resource_id: "n" } }),
        setWeeklySchedule: write(c, "set_weekly_schedule", "Replace the regular weekly schedule (av-<day>-<hhmm>-<hhmm> params in `params`).", { optional: { resource_id: "s" } }),
      },
      { title: "Availability", description: "Availability, usage, vacations and schedules." },
    ),
    pricing: router(
      {
        rentalPrice: read(c, "get_rental_price", `Price of a rental for a resource and period. ${time}`, { required: { resource_id: "n", start_time: "s", end_time: "s", quantity: "n" } }),
        resourcePricing: read(c, "get_resource_pricing", "Complete pricing information for the site's resources.", { optional: { resource_id: "n" } }),
        rules: read(c, "get_pricing_manager_rules", "List Pricing Manager rules.", { optional: { resource_id: "n" } }),
        seasons: read(c, "get_resource_seasons", "List seasonal settings of a resource.", { optional: { resource_id: "n" } }),
        setPricing: write(c, "set_resource_pricing", "Set prices for a resource's Pricing Manager rules (rule_price_type_xxx / rule_price_value_xxx in `params`).", { required: { resource_id: "n" } }),
        setDailyPricing: write(c, "set_resource_daily_pricing", "Set daily prices (price_value_YYYY-MM-DD in `params`).", { required: { resource_id: "n" } }),
      },
      { title: "Pricing", description: "Rental prices, pricing rules and seasons." },
    ),
    payments: router(
      {
        list: read(c, "list_payments", "List payments made for reservations.", { optional: { start_time: "s", end_time: "s", page: "n" } }),
        forReservation: read(c, "list_reservation_payments", "List payments of a reservation, including coupon usage.", { required: { reservation_id: "n" } }),
        amount: read(c, "get_reservation_payment_amount", "Total paid and number of payments for a reservation.", { required: { reservation_id: "n" } }),
        add: write(c, "add_reservation_payment", "Record a payment for a reservation. Never pass card numbers.", { required: { reservation_id: "n", amount: "s" }, optional: { payment_mode: "s" } }),
        modify: write(c, "modify_reservation_payment", "Change the status of a reservation payment.", { required: { payment_id: "n" } }),
        remove: write(c, "remove_reservation_payment", "Delete a payment from a reservation.", { required: { payment_id: "n" } }),
      },
      { title: "Payments", description: "Reservation payments." },
    ),
    products: router(
      {
        list: read(c, "list_additional_products", "List additional products defined on the site.", { optional: { site_id: "n" } }),
        forReservation: read(c, "get_reservation_products", "Additional products reserved on a reservation.", { required: { reservation_id: "n" } }),
        setForReservation: write(c, "set_reservation_products", "Set usage of all additional products for a reservation (triggers notifications and price recalculation).", { required: { reservation_id: "n" } }),
        add: write(c, "add_additional_product", "Add an additional product.", { required: { name: "s" } }),
        update: write(c, "modify_additional_product", "Modify an additional product.", { required: { product_id: "n" } }),
        remove: write(c, "remove_additional_product", "Remove an additional product from the site and all reservations. Verification params site_id and product_id_md5 go in `params`.", { required: { product_id: "n" } }),
      },
      { title: "Additional products", description: "Extras that can be added to reservations." },
    ),
    properties: router(
      {
        get: read(c, "get_custom_property", "Read a custom property of a user, site, resource or reservation (type: user, site, resource, reservation).", { required: { type: "s", name: "s" }, optional: { id: "n" } }),
        set: write(c, "set_custom_property", "Set a custom property (type: user, site, resource, reservation).", { required: { type: "s", name: "s", value: "s" }, optional: { id: "n" } }),
        delete: write(c, "delete_custom_property", "Delete a custom property by name.", { required: { type: "s", name: "s" }, optional: { id: "n" } }),
      },
      { title: "Custom properties", description: "Custom properties of users, sites, resources and reservations." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { planyo: planyo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.planyo ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Planyo",
        description: "Planyo online reservation system: resources, reservations, availability, pricing, payments and additional products.",
        icons,
      },
    ),
  }),
);
