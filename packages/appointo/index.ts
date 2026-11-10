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

const base = "https://app.appointo.me/api";

const appointo = defineProvider({
  name: "Appointo",
  hosts: ["app.appointo.me"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing one product is read-only; an invalid token answers 401 invalid_api_token.
  // The reference documents no response schema, so no fields are decoded.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/products?limit=1`, {
      signal,
      headers: { "APPOINTO-TOKEN": account.fields.token },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | readonly number[] | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "PUT", path: string, params: Params = {}, body?: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      search.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
    const qs = search.size > 0 ? `?${search}` : "";
    const response = await fetcher(`${base}${path}${qs}`, {
      method,
      signal,
      headers: { "APPOINTO-TOKEN": token, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };
}

const page = {
  limit: number().optional(),
  offset: number().optional(),
  search_term: string().optional(),
};

function build(call: ReturnType<typeof client>) {
  return router({
    products: router(
      {
        list: query(
          {
            description: "List the Shopify products configured for booking in Appointo, with their appointments (variants). limit max and default 100.",
            input: object(page),
          },
          async (_ctx, { limit, offset, search_term }) => call("GET", "/products", { limit, offset, search_term }),
        ),
      },
      { title: "Products", description: "Bookable products." },
    ),
    appointments: router(
      {
        list: query(
          {
            description:
              "List appointments (bookable product variants). Pass appointment_id for one, or product_id for one product's appointments. limit max and default 100.",
            input: object({
              appointment_id: number().optional(),
              product_id: number().optional(),
              ...page,
            }),
          },
          async (_ctx, { appointment_id, product_id, limit, offset, search_term }) =>
            call("GET", "/appointments", { appointment_id, product_id, limit, offset, search_term }),
        ),
        getAvailability: query(
          {
            description:
              "Get calendar availability for an appointment between start_date and end_date (YYYY-MM-DD). impersonated_tms limits it to team member ids.",
            input: object({
              appointment_id: number(),
              start_date: string({ minLength: 10 }),
              end_date: string().optional(),
              impersonated_tms: array(number()).optional(),
            }),
          },
          async (_ctx, { appointment_id, start_date, end_date, impersonated_tms }) =>
            call("GET", `/appointments/${appointment_id}/calendar_availability`, { start_date, end_date, impersonated_tms }),
        ),
        upsertConfig: mutation(
          {
            description:
              "Upsert an appointment's availability configuration and date overrides. Appointo's reference page does not document the body, so config, availabilities and override are passed through as JSON objects in the shape the Appointo dashboard stores.",
            input: object({
              appointment_id: number(),
              config: json().optional(),
              availabilities: json().optional(),
              override: json().optional(),
            }),
          },
          async (_ctx, { appointment_id, config, availabilities, override }) =>
            call("PUT", `/appointments/${appointment_id}`, {}, {
              ...(config !== undefined ? { config } : {}),
              ...(availabilities !== undefined ? { availabilities } : {}),
              ...(override !== undefined ? { override } : {}),
            }),
        ),
      },
      { title: "Appointments", description: "Bookable appointments and their availability." },
    ),
    bookings: router(
      {
        list: query(
          {
            description:
              "List bookings. status is past or upcoming; booking_id fetches one; search_term matches product, customer name, email, phone and order name. limit max and default 100.",
            input: object({ booking_id: number().optional(), status: string().optional(), ...page }),
          },
          async (_ctx, { booking_id, status, limit, offset, search_term }) =>
            call("GET", "/bookings", { booking_id, status, limit, offset, search_term }),
        ),
        listCancelled: query(
          {
            description: "List cancelled bookings. status is past or upcoming. limit max and default 100.",
            input: object({ status: string().optional(), ...page }),
          },
          async (_ctx, { status, limit, offset, search_term }) =>
            call("GET", "/bookings/cancelled_bookings", { status, limit, offset, search_term }),
        ),
        create: mutation(
          {
            description:
              "Create a booking for a customer. timestring is the ISO 8601 time slot from the availability tool. Vendor limit: 100 requests per day.",
            input: object({
              appointment_id: number(),
              timestring: string({ minLength: 1 }),
              email: string({ minLength: 3 }),
              name: string({ minLength: 1 }),
              quantity: number().optional(),
              phone: string().optional(),
            }),
          },
          async (_ctx, { appointment_id, timestring, email, name, quantity, phone }) =>
            call("POST", "/bookings", {}, {
              appointment_id,
              timestring,
              email,
              name,
              ...(quantity !== undefined ? { quantity } : {}),
              ...(phone !== undefined ? { phone } : {}),
            }),
        ),
        reschedule: mutation(
          {
            description:
              "Reschedule a booking to a new ISO 8601 timestring. customer_ids limits it to those customers (default: the whole booking). override forces the slot. Vendor limit: 100 requests per day.",
            input: object({
              booking_id: number(),
              timestring: string({ minLength: 1 }),
              customer_ids: array(number()).optional(),
              override: boolean().optional(),
            }),
          },
          async (_ctx, { booking_id, timestring, customer_ids, override }) =>
            call("PUT", "/bookings/reschedule", {}, {
              booking_id,
              timestring,
              ...(customer_ids !== undefined ? { customer_ids } : {}),
              ...(override !== undefined ? { override } : {}),
            }),
        ),
        cancel: mutation(
          {
            description:
              "Cancel a booking. customer_ids limits it to those customers (default: the whole booking). Vendor limit: 100 requests per day.",
            input: object({ booking_id: number(), customer_ids: array(number()).optional() }),
          },
          async (_ctx, { booking_id, customer_ids }) =>
            call("PUT", "/bookings/cancel", {}, {
              booking_id,
              ...(customer_ids !== undefined ? { customer_ids } : {}),
            }),
        ),
        update: mutation(
          {
            description:
              "Update a booking's start and end buffer times (integers greater than 0). Vendor limit: 100 requests per day.",
            input: object({
              booking_id: number(),
              start_buffer_time: number().optional(),
              end_buffer_time: number().optional(),
            }),
          },
          async (_ctx, { booking_id, start_buffer_time, end_buffer_time }) =>
            call("PUT", `/bookings/${booking_id}`, {}, {
              booking_id,
              ...(start_buffer_time !== undefined ? { start_buffer_time } : {}),
              ...(end_buffer_time !== undefined ? { end_buffer_time } : {}),
            }),
        ),
      },
      { title: "Bookings", description: "Create, list, reschedule and cancel bookings." },
    ),
    subscriptions: router(
      {
        list: query(
          {
            description: "List appointment subscription contracts. search_term matches product name, variant name, order number or customer name.",
            input: object({ search_term: string().optional() }),
          },
          async (_ctx, { search_term }) => call("GET", "/appointment_subscriptions", { search_term }),
        ),
      },
      { title: "Subscriptions", description: "Recurring appointment subscription contracts." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { appointo: appointo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.appointo ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Appointo",
        description: "Appointment booking for Shopify stores: products, appointments, availability, bookings and subscription contracts.",
        icons,
      },
    ),
  }),
);
