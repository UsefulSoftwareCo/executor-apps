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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.eventzillaapi.net/api/v2";

const eventzilla = defineProvider({
  name: "Eventzilla",
  hosts: ["www.eventzillaapi.net"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing events is read-only and rejects an invalid key with 401 (the categories endpoint answers 200 for any key).
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/events?limit=1`, {
      signal,
      headers: { "x-api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  "x-api-key": account.fields.token,
  Accept: "application/json",
  "content-type": "application/json",
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const ticketTypeInput = {
  ticket_type_name: string().optional(),
  quantity_total: number().optional(),
  ticket_type_description: string().optional(),
  sales_start_date: string().optional(),
  sales_start_time: string().optional(),
  sales_end_date: string().optional(),
  sales_end_time: string().optional(),
  limit_minimum: number().optional(),
  limit_maximum: number().optional(),
  additional_instructions: string().optional(),
  is_visible: boolean().optional(),
  boxoffice_only: boolean().optional(),
  unlock_code: string().optional(),
};

const eventzillaTools = (account: Account, signal: AbortSignal) => {
  return router({
    listEvents: query(
      {
        description:
          "List events in the account. Filter by status (live, draft, unpublished, completed) and category name; page with offset and limit (default 20).",
        input: object({
          status: string().optional(),
          category: string().optional(),
          offset: number().optional(),
          limit: number().optional(),
        }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/events${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getEvent: query(
      { description: "Get the details of one event.", input: object({ eventid: number() }) },
      async ({ fetch }, { eventid }) =>
        decodeJson(await fetch(`${base}/events/${eventid}`, { signal, headers: headers(account) }), json()),
    ),
    listCategories: query(
      { description: "List the event categories available to the account.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/categories`, { signal, headers: headers(account) }), json()),
    ),
    listEventTransactions: query(
      {
        description: "List the transactions (orders) of an event; page with offset and limit (default 20).",
        input: object({ eventid: number(), offset: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { eventid, ...page }) =>
        decodeJson(
          await fetch(`${base}/events/${eventid}/transactions${search(page)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listEventAttendees: query(
      { description: "List the attendees of an event.", input: object({ eventid: number() }) },
      async ({ fetch }, { eventid }) =>
        decodeJson(await fetch(`${base}/events/${eventid}/attendees`, { signal, headers: headers(account) }), json()),
    ),
    listEventTicketTypes: query(
      { description: "List the ticket types of an event.", input: object({ eventid: number() }) },
      async ({ fetch }, { eventid }) =>
        decodeJson(await fetch(`${base}/events/${eventid}/tickets`, { signal, headers: headers(account) }), json()),
    ),
    getAttendee: query(
      { description: "Get the details of one attendee.", input: object({ attendeeid: number() }) },
      async ({ fetch }, { attendeeid }) =>
        decodeJson(await fetch(`${base}/attendees/${attendeeid}`, { signal, headers: headers(account) }), json()),
    ),
    listUsers: query(
      {
        description: "List the users (organizers) of the account; page with offset and limit (default 20).",
        input: object({ offset: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base}/users${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    getUser: query(
      { description: "Get the details of one user (organizer).", input: object({ userid: number() }) },
      async ({ fetch }, { userid }) =>
        decodeJson(await fetch(`${base}/users/${userid}`, { signal, headers: headers(account) }), json()),
    ),
    getTransaction: query(
      {
        description: "Get a transaction by checkout ID or order reference number.",
        input: object({ identifier: string() }),
      },
      async ({ fetch }, { identifier }) =>
        decodeJson(
          await fetch(`${base}/transactions/${encodeURIComponent(identifier)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    prepareCheckout: query(
      {
        description:
          "Prepare a checkout for an event date: returns the ticket types, questions and payment options to use with createCheckoutOrder.",
        input: object({ eventid: number(), dateid: number() }),
      },
      async ({ fetch }, { eventid, dateid }) =>
        decodeJson(
          await fetch(`${base}/checkout/prepare/${eventid}/${dateid}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    toggleEventSales: mutation(
      {
        description: "Turn ticket sales for an event on (status true) or off (status false).",
        input: object({ eventid: number(), status: boolean() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/events/togglesales`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    cancelEventOrder: mutation(
      {
        description: "Cancel an event order. comments is the organizer's reason.",
        input: object({ checkout_id: number(), eventid: number(), comments: string() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/events/order/cancel`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    confirmEventOrder: mutation(
      {
        description: "Confirm an event order. sendemail defaults to true.",
        input: object({
          checkout_id: number(),
          eventid: number(),
          comments: string(),
          sendemail: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/events/order/confirm`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    createFreeTicketType: mutation(
      {
        description:
          "Create a free ticket type for an event. Dates are ISO 8601 (2026-02-05), times HH:MM.",
        input: object({ eventid: number(), ...ticketTypeInput }),
        approval: always(),
      },
      async ({ fetch }, { eventid, ...body }) =>
        decodeJson(
          await fetch(`${base}/events/${eventid}/ticket-types`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    updateFreeTicketType: mutation(
      {
        description: "Update a free ticket type of an event; send only the fields to change.",
        input: object({ eventid: number(), ticket_type_id: number(), ...ticketTypeInput }),
        approval: always(),
      },
      async ({ fetch }, { eventid, ticket_type_id, ...body }) =>
        decodeJson(
          await fetch(`${base}/events/${eventid}/ticket-types/${ticket_type_id}`, {
            method: "PATCH",
            signal,
            headers: headers(account),
            body: JSON.stringify(body),
          }),
          json(),
        ),
    ),
    checkInAttendee: mutation(
      {
        description:
          "Check an attendee in (checkin true) or revert the check-in (false), identified by the ticket barcode.",
        input: object({ barcode: string(), checkin: boolean() }),
        approval: always(),
      },
      async ({ fetch }, { barcode, checkin }) =>
        decodeJson(
          await fetch(`${base}/attendee/checkin`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify({ barcode, eventcheckin: checkin }),
          }),
          json(),
        ),
    ),
    createCheckoutOrder: mutation(
      {
        description:
          "Reserve tickets for an event date. ticket_types lists ticket_type_id and quantity. Returns a checkout_id for fillCheckoutOrder.",
        input: object({
          eventid: number(),
          eventdateid: number(),
          ticket_types: array(object({ ticket_type_id: number(), quantity: number() })),
          discount_code: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/checkout/create`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    fillCheckoutOrder: mutation(
      {
        description:
          "Fill a reserved order with buyer and attendee details and a payment option (payment_id from prepareCheckout). ticket_price_id comes from createCheckoutOrder; answers respond to registration questions.",
        input: object({
          eventid: number(),
          eventdateid: number(),
          checkout_id: number(),
          buyerdetails: array(
            object({
              buyer_firstname: string().optional(),
              buyer_lastname: string().optional(),
              buyer_email: string().optional(),
            }),
          ),
          tickets: array(
            object({
              ticket_price_id: number().optional(),
              first_name: string().optional(),
              last_name: string().optional(),
              email: string().optional(),
              answers: array(object({ question_id: number(), answer_text: string() })).optional(),
            }),
          ),
          payment_id: number(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/checkout/fillorder`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    confirmCheckoutOrder: mutation(
      {
        description: "Confirm a filled checkout order with its payment status. sendemail defaults to true.",
        input: object({
          eventid: number(),
          eventdateid: number(),
          checkout_id: number(),
          payment_status: string(),
          comments: string().optional(),
          sendemail: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/checkout/confirm`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });
};

export default defineApp({ user: { accounts: { eventzilla: eventzilla.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.eventzilla ?? [], (account) => eventzillaTools(account, signal), { signal }), {
    title: "Eventzilla",
    description:
      "Manage Eventzilla events, ticket types, orders, attendees and check-ins, and run the checkout flow.",
    icons,
  }),
}));
