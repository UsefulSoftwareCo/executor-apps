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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.eventbriteapi.com/v3";

const eventbrite = defineProvider({
  name: "Eventbrite",
  hosts: ["www.eventbriteapi.com"],
  auth: {
    // The private token of an Eventbrite app (Account settings > Developer links > API keys).
    token: secrets({
      label: "Private token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Eventbrite has no client registration: the connect page asks for an OAuth app's client.
    // Eventbrite OAuth has no scopes and its tokens do not expire.
    oauth: oauth2({
      authorizationUrl: "https://www.eventbrite.com/oauth/authorize",
      tokenUrl: "https://www.eventbrite.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(`${base}/users/me/`, {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    // The user object's name may be null or absent, so only the id is required.
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
// Encodes a model-supplied path segment; "." and ".." survive encoding and would be normalized by URL, so reject them.
const enc = (segment: string) => {
  if (segment === "." || segment === "..") throw new Error(`Invalid path segment: ${segment}`);
  return encodeURIComponent(segment);
};

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    return u.toString();
  };
  const headers = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
  const send = async (method: string, path: string, body?: unknown, params?: Params) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Some calls (DELETE, ticket group attach) answer 204 with no body.
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
  return {
    get: (path: string, params?: Params) => send("GET", path, undefined, params),
    post: (path: string, body?: unknown) => send("POST", path, body ?? {}),
    del: (path: string) => send("DELETE", path),
  };
}

const id = string({ minLength: 1 });
const expand = string().optional();
const continuation = string().optional();
const body = json();


export default defineApp(
  { user: { accounts: { eventbrite: eventbrite.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.eventbrite ?? [],
        (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          const c = client(token, fetch, signal);
          return router({
            users: router({
              me: query(
                { description: "The authenticated user.", input: object({ expand }) },
                async (_ctx, { expand }) => c.get("/users/me/", { expand }),
              ),
              get: query(
                { description: "A user by ID.", input: object({ userId: id }) },
                async (_ctx, { userId }) => c.get(`/users/${enc(userId)}/`),
              ),
              organizations: query(
                {
                  description: "Organizations the authenticated user belongs to. Organization IDs are needed by most other tools.",
                  input: object({ continuation }),
                },
                async (_ctx, { continuation }) => c.get("/users/me/organizations/", { continuation }),
              ),
              orders: query(
                { description: "Orders placed by a user.", input: object({ userId: id, status: string().optional(), continuation }) },
                async (_ctx, { userId, status, continuation }) => c.get(`/users/${enc(userId)}/orders/`, { status, continuation }),
              ),
            }),
            organizations: router({
              members: query(
                { description: "Members of an organization.", input: object({ organizationId: id, continuation }) },
                async (_ctx, { organizationId, continuation }) =>
                  c.get(`/organizations/${enc(organizationId)}/members/`, { continuation }),
              ),
              roles: query(
                { description: "Roles defined in an organization.", input: object({ organizationId: id, continuation }) },
                async (_ctx, { organizationId, continuation }) =>
                  c.get(`/organizations/${enc(organizationId)}/roles/`, { continuation }),
              ),
            }),
            events: router({
              list: query(
                {
                  description:
                    "Events of an organization. status is a comma-separated list (draft, live, started, ended, completed, canceled, all); orderBy e.g. start_asc, start_desc, created_asc, created_desc; timeFilter is all, current_future or past.",
                  input: object({
                    organizationId: id,
                    status: string().optional(),
                    orderBy: string().optional(),
                    timeFilter: string().optional(),
                    nameFilter: string().optional(),
                    venueFilter: string().optional(),
                    seriesFilter: string().optional(),
                    expand,
                    continuation,
                  }),
                },
                async (_ctx, i) =>
                  c.get(`/organizations/${enc(i.organizationId)}/events/`, {
                    status: i.status,
                    order_by: i.orderBy,
                    time_filter: i.timeFilter,
                    name_filter: i.nameFilter,
                    venue_filter: i.venueFilter,
                    series_filter: i.seriesFilter,
                    expand: i.expand,
                    continuation: i.continuation,
                  }),
              ),
              get: query(
                {
                  description: "An event by ID. expand is a comma-separated list such as venue, organizer, ticket_availability, category.",
                  input: object({ eventId: id, expand }),
                },
                async (_ctx, { eventId, expand }) => c.get(`/events/${enc(eventId)}/`, { expand }),
              ),
              description: query(
                { description: "The rendered HTML description of an event.", input: object({ eventId: id }) },
                async (_ctx, { eventId }) => c.get(`/events/${enc(eventId)}/description/`),
              ),
              create: mutation(
                {
                  description:
                    "Create a draft event in an organization. event is the Eventbrite event object, for example { name: { html }, start: { timezone, utc }, end: { timezone, utc }, currency, online_event, venue_id, capacity, listed, shareable }. Set is_series to create a series parent.",
                  input: object({ organizationId: id, event: body }),
                  approval: always(),
                },
                async (_ctx, { organizationId, event }) => c.post(`/organizations/${enc(organizationId)}/events/`, { event }),
              ),
              update: mutation(
                {
                  description: "Update an event. event holds only the fields to change, in the same shape as when creating.",
                  input: object({ eventId: id, event: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, event }) => c.post(`/events/${enc(eventId)}/`, { event }),
              ),
              delete: mutation(
                {
                  description: "Delete an event. Only works for events with no pending or completed orders. Cannot be undone.",
                  input: object({ eventId: id }),
                  approval: always(),
                },
                async (_ctx, { eventId }) => c.del(`/events/${enc(eventId)}/`),
              ),
              publish: mutation(
                { description: "Publish a draft event so it goes live.", input: object({ eventId: id }), approval: always() },
                async (_ctx, { eventId }) => c.post(`/events/${enc(eventId)}/publish/`),
              ),
              unpublish: mutation(
                { description: "Unpublish a live event, returning it to draft.", input: object({ eventId: id }), approval: always() },
                async (_ctx, { eventId }) => c.post(`/events/${enc(eventId)}/unpublish/`),
              ),
              copy: mutation(
                {
                  description: "Duplicate an event. All fields are optional overrides for the copy (name, start_date, end_date, timezone, summary).",
                  input: object({ eventId: id, overrides: body.optional() }),
                  approval: always(),
                },
                async (_ctx, { eventId, overrides }) => c.post(`/events/${enc(eventId)}/copy/`, overrides),
              ),
              cancel: mutation(
                { description: "Cancel an event.", input: object({ eventId: id }), approval: always() },
                async (_ctx, { eventId }) => c.post(`/events/${enc(eventId)}/cancel/`),
              ),
              byVenue: query(
                {
                  description: "Events held at a venue.",
                  input: object({ venueId: id, status: string().optional(), orderBy: string().optional(), continuation }),
                },
                async (_ctx, i) =>
                  c.get(`/venues/${enc(i.venueId)}/events/`, { status: i.status, order_by: i.orderBy, continuation: i.continuation }),
              ),
              series: query(
                { description: "A series parent event by ID.", input: object({ eventSeriesId: id }) },
                async (_ctx, { eventSeriesId }) => c.get(`/series/${enc(eventSeriesId)}/`),
              ),
              seriesEvents: query(
                {
                  description: "Occurrences of an event series. orderBy is required, e.g. start_asc.",
                  input: object({ eventSeriesId: id, orderBy: string({ minLength: 1 }), status: string().optional(), continuation }),
                },
                async (_ctx, i) =>
                  c.get(`/series/${enc(i.eventSeriesId)}/events/`, { order_by: i.orderBy, status: i.status, continuation: i.continuation }),
              ),
              addSchedule: mutation(
                {
                  description:
                    "Add occurrences to a series parent. schedule is { occurrence_duration (seconds), recurrence_rule (iCal RRULE text) }.",
                  input: object({ eventId: id, schedule: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, schedule }) => c.post(`/events/${enc(eventId)}/schedules/`, schedule),
              ),
              displaySettings: query(
                { description: "Display settings of an event.", input: object({ eventId: id }) },
                async (_ctx, { eventId }) => c.get(`/events/${enc(eventId)}/display_settings/`),
              ),
              updateDisplaySettings: mutation(
                {
                  description: "Change an event's display settings. settings holds the fields to change (show_start_date, show_end_date, show_map, ...).",
                  input: object({ eventId: id, settings: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, settings }) => c.post(`/events/${enc(eventId)}/display_settings/`, settings),
              ),
              capacity: query(
                { description: "Capacity tier of an event.", input: object({ eventId: id }) },
                async (_ctx, { eventId }) => c.get(`/events/${enc(eventId)}/capacity_tier/`),
              ),
              updateCapacity: mutation(
                {
                  description: "Update an event's capacity. capacityTier is the body, e.g. { capacity_total: 200 }.",
                  input: object({ eventId: id, capacityTier: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, capacityTier }) => c.post(`/events/${enc(eventId)}/capacity_tier/`, capacityTier),
              ),
              ticketBuyerSettings: query(
                { description: "Ticket buyer settings (confirmation message, refund policy, redirect URLs) of an event.", input: object({ eventId: id }) },
                async (_ctx, { eventId }) => c.get(`/events/${enc(eventId)}/ticket_buyer_settings/`),
              ),
              updateTicketBuyerSettings: mutation(
                {
                  description: "Update an event's ticket buyer settings. settings holds the fields to change.",
                  input: object({ eventId: id, settings: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, settings }) => c.post(`/events/${enc(eventId)}/ticket_buyer_settings/`, { ticket_buyer_settings: settings }),
              ),
              structuredContent: query(
                {
                  description: "Structured content (modules) of an event. Set edit to read the latest working version instead of the published one.",
                  input: object({ eventId: id, edit: boolean().optional() }),
                },
                async (_ctx, { eventId, edit }) => c.get(`/events/${enc(eventId)}/structured_content/${edit ? "edit/" : ""}`),
              ),
              updateStructuredContent: mutation(
                {
                  description:
                    "Create or update structured content. Send the current modules plus publish: true in content; version is the version number from the latest working version.",
                  input: object({ eventId: id, version: string({ minLength: 1 }), content: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, version, content }) =>
                  c.post(`/events/${enc(eventId)}/structured_content/${enc(version)}/`, content),
              ),
            }),
            ticketClasses: router({
              list: query(
                { description: "Ticket classes of an event.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/ticket_classes/`, { continuation }),
              ),
              forSale: query(
                { description: "Ticket classes of an event that can be purchased right now.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/ticket_classes/for_sale/`, { continuation }),
              ),
              get: query(
                { description: "One ticket class.", input: object({ eventId: id, ticketClassId: id }) },
                async (_ctx, { eventId, ticketClassId }) => c.get(`/events/${enc(eventId)}/ticket_classes/${enc(ticketClassId)}/`),
              ),
              create: mutation(
                {
                  description:
                    "Create a ticket class. ticketClass is e.g. { name, quantity_total, cost: \"USD,2500\" (omit for free), free, donation, minimum_quantity, maximum_quantity, sales_start, sales_end, hidden }. Tiered events also need inventory_tier_id.",
                  input: object({ eventId: id, ticketClass: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, ticketClass }) => c.post(`/events/${enc(eventId)}/ticket_classes/`, { ticket_class: ticketClass }),
              ),
              update: mutation(
                {
                  description: "Update a ticket class. ticketClass holds only the fields to change.",
                  input: object({ eventId: id, ticketClassId: id, ticketClass: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, ticketClassId, ticketClass }) =>
                  c.post(`/events/${enc(eventId)}/ticket_classes/${enc(ticketClassId)}/`, { ticket_class: ticketClass }),
              ),
              groups: query(
                { description: "Ticket groups of an organization.", input: object({ organizationId: id, status: string().optional(), continuation }) },
                async (_ctx, i) => c.get(`/organizations/${enc(i.organizationId)}/ticket_groups/`, { status: i.status, continuation: i.continuation }),
              ),
              getGroup: query(
                { description: "One ticket group.", input: object({ ticketGroupId: id }) },
                async (_ctx, { ticketGroupId }) => c.get(`/ticket_groups/${enc(ticketGroupId)}/`),
              ),
              createGroup: mutation(
                {
                  description: "Create a ticket group in an organization. ticketGroup is { name, status } (max 300 live per organization).",
                  input: object({ organizationId: id, ticketGroup: body }),
                  approval: always(),
                },
                async (_ctx, { organizationId, ticketGroup }) =>
                  c.post(`/organizations/${enc(organizationId)}/ticket_groups/`, { ticket_group: ticketGroup }),
              ),
              updateGroup: mutation(
                {
                  description: "Update a ticket group.",
                  input: object({ ticketGroupId: id, ticketGroup: body }),
                  approval: always(),
                },
                async (_ctx, { ticketGroupId, ticketGroup }) => c.post(`/ticket_groups/${enc(ticketGroupId)}/`, { ticket_group: ticketGroup }),
              ),
              deleteGroup: mutation(
                { description: "Mark a ticket group as deleted.", input: object({ ticketGroupId: id }), approval: always() },
                async (_ctx, { ticketGroupId }) => c.del(`/ticket_groups/${enc(ticketGroupId)}/`),
              ),
              inventoryTiers: query(
                { description: "Inventory tiers of an event.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/inventory_tiers/`, { continuation }),
              ),
              getInventoryTier: query(
                { description: "One inventory tier.", input: object({ eventId: id, inventoryTierId: id }) },
                async (_ctx, { eventId, inventoryTierId }) => c.get(`/events/${enc(eventId)}/inventory_tiers/${enc(inventoryTierId)}/`),
              ),
            }),
            orders: router({
              get: query(
                { description: "An order by ID. expand e.g. attendees, event, promo_code.", input: object({ orderId: id, expand }) },
                async (_ctx, { orderId, expand }) => c.get(`/orders/${enc(orderId)}/`, { expand }),
              ),
              byEvent: query(
                {
                  description: "Orders of an event. status e.g. active, inactive, all; changedSince is an ISO 8601 UTC time.",
                  input: object({ eventId: id, status: string().optional(), changedSince: string().optional(), expand, continuation }),
                },
                async (_ctx, i) =>
                  c.get(`/events/${enc(i.eventId)}/orders/`, {
                    status: i.status,
                    changed_since: i.changedSince,
                    expand: i.expand,
                    continuation: i.continuation,
                  }),
              ),
              byOrganization: query(
                {
                  description: "Orders across an organization's events.",
                  input: object({
                    organizationId: id,
                    status: string().optional(),
                    changedSince: string().optional(),
                    onlyEmails: array(string()).optional(),
                    expand,
                    continuation,
                  }),
                },
                async (_ctx, i) =>
                  c.get(`/organizations/${enc(i.organizationId)}/orders/`, {
                    status: i.status,
                    changed_since: i.changedSince,
                    only_emails: i.onlyEmails,
                    expand: i.expand,
                    continuation: i.continuation,
                  }),
              ),
              retentionPolicy: query(
                { description: "Whether the service fee is retained if the order is refunded.", input: object({ orderId: id }) },
                async (_ctx, { orderId }) => c.get(`/orders/${enc(orderId)}/get_retention_policy_information/`),
              ),
              refund: mutation(
                {
                  description: "Fully refund an order. Moves money and cannot be undone.",
                  input: object({ orderId: id, refund: body.optional() }),
                  approval: always(),
                },
                async (_ctx, { orderId, refund }) => c.post(`/orders/${enc(orderId)}/refunds/`, refund),
              ),
            }),
            attendees: router({
              byEvent: query(
                {
                  description: "Attendees of an event. status e.g. attending, not_attending, cancelled, refunded, unpaid, all.",
                  input: object({
                    eventId: id,
                    status: string().optional(),
                    changedSince: string().optional(),
                    attendeeIds: array(string()).optional(),
                    expand,
                    continuation,
                  }),
                },
                async (_ctx, i) =>
                  c.get(`/events/${enc(i.eventId)}/attendees/`, {
                    status: i.status,
                    changed_since: i.changedSince,
                    attendee_ids: i.attendeeIds,
                    expand: i.expand,
                    continuation: i.continuation,
                  }),
              ),
              byOrganization: query(
                {
                  description: "Attendees across all events of an organization.",
                  input: object({ organizationId: id, status: string().optional(), changedSince: string().optional(), expand, continuation }),
                },
                async (_ctx, i) =>
                  c.get(`/organizations/${enc(i.organizationId)}/attendees/`, {
                    status: i.status,
                    changed_since: i.changedSince,
                    expand: i.expand,
                    continuation: i.continuation,
                  }),
              ),
              get: query(
                { description: "One attendee of an event.", input: object({ eventId: id, attendeeId: id, expand }) },
                async (_ctx, { eventId, attendeeId, expand }) => c.get(`/events/${enc(eventId)}/attendees/${enc(attendeeId)}/`, { expand }),
              ),
            }),
            venues: router({
              list: query(
                { description: "Venues of an organization.", input: object({ organizationId: id, continuation }) },
                async (_ctx, { organizationId, continuation }) => c.get(`/organizations/${enc(organizationId)}/venues/`, { continuation }),
              ),
              get: query(
                { description: "A venue by ID.", input: object({ venueId: id }) },
                async (_ctx, { venueId }) => c.get(`/venues/${enc(venueId)}/`),
              ),
              create: mutation(
                {
                  description: "Create a venue. venue is { name, address: { address_1, city, region, postal_code, country }, capacity, ... }.",
                  input: object({ organizationId: id, venue: body }),
                  approval: always(),
                },
                async (_ctx, { organizationId, venue }) => c.post(`/organizations/${enc(organizationId)}/venues/`, { venue }),
              ),
              update: mutation(
                { description: "Update a venue. venue holds only the fields to change.", input: object({ venueId: id, venue: body }), approval: always() },
                async (_ctx, { venueId, venue }) => c.post(`/venues/${enc(venueId)}/`, { venue }),
              ),
            }),
            discounts: router({
              list: query(
                {
                  description:
                    "Discounts (access codes, discount codes) of an organization. scope is required: event, multi_events or user (event scope also needs eventId); eventId narrows to one event; code filters by code.",
                  input: object({
                    organizationId: id,
                    scope: string({ minLength: 1 }),
                    eventId: string().optional(),
                    code: string().optional(),
                    continuation,
                  }),
                },
                async (_ctx, i) =>
                  c.get(`/organizations/${enc(i.organizationId)}/discounts/`, {
                    scope: i.scope,
                    event_id: i.eventId,
                    code: i.code,
                    continuation: i.continuation,
                  }),
              ),
              get: query(
                { description: "A discount by ID.", input: object({ discountId: id }) },
                async (_ctx, { discountId }) => c.get(`/discounts/${enc(discountId)}/`),
              ),
              create: mutation(
                {
                  description:
                    "Create a discount. discount is e.g. { type: \"coded\" | \"access\" | \"public\", code, percent_off or amount_off, event_id, ticket_class_ids, quantity_available, start_date, end_date }.",
                  input: object({ organizationId: id, discount: body }),
                  approval: always(),
                },
                async (_ctx, { organizationId, discount }) =>
                  c.post(`/organizations/${enc(organizationId)}/discounts/`, { discount }),
              ),
              update: mutation(
                { description: "Update a discount.", input: object({ discountId: id, discount: body }), approval: always() },
                async (_ctx, { discountId, discount }) => c.post(`/discounts/${enc(discountId)}/`, { discount }),
              ),
              delete: mutation(
                { description: "Delete an unused discount. Cannot be undone.", input: object({ discountId: id }), approval: always() },
                async (_ctx, { discountId }) => c.del(`/discounts/${enc(discountId)}/`),
              ),
            }),
            questions: router({
              list: query(
                { description: "Custom questions asked at checkout for an event.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/questions/`, { continuation }),
              ),
              get: query(
                { description: "One custom question.", input: object({ eventId: id, questionId: id }) },
                async (_ctx, { eventId, questionId }) => c.get(`/events/${enc(eventId)}/questions/${enc(questionId)}/`),
              ),
              create: mutation(
                {
                  description: "Add a custom question to an event. question is { question: { html }, type, required, choices?, ... }.",
                  input: object({ eventId: id, question: body }),
                  approval: always(),
                },
                async (_ctx, { eventId, question }) => c.post(`/events/${enc(eventId)}/questions/`, { question }),
              ),
              delete: mutation(
                { description: "Remove a custom question from an event.", input: object({ eventId: id, questionId: id }), approval: always() },
                async (_ctx, { eventId, questionId }) => c.del(`/events/${enc(eventId)}/questions/${enc(questionId)}/`),
              ),
              canned: query(
                { description: "Default (canned) questions of an event.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/canned_questions/`, { continuation }),
              ),
            }),
            reports: router({
              sales: query(
                {
                  description:
                    "Sales report. eventIds is a comma-separated list; filter is the grouping (e.g. date, ticket_type); startDate and endDate are ISO 8601; timePeriod is a preset.",
                  input: object({
                    eventIds: string({ minLength: 1 }),
                    filter: string().optional(),
                    startDate: string().optional(),
                    endDate: string().optional(),
                    timePeriod: string().optional(),
                  }),
                },
                async (_ctx, i) =>
                  c.get("/reports/sales/", {
                    event_ids: i.eventIds,
                    filter: i.filter,
                    start_date: i.startDate,
                    end_date: i.endDate,
                    time_period: i.timePeriod,
                  }),
              ),
              attendees: query(
                {
                  description: "Attendee report. eventIds is a comma-separated list; filter is the grouping.",
                  input: object({
                    eventIds: string({ minLength: 1 }),
                    filter: string().optional(),
                    startDate: string().optional(),
                    endDate: string().optional(),
                    status: string().optional(),
                  }),
                },
                async (_ctx, i) =>
                  c.get("/reports/attendees/", {
                    event_ids: i.eventIds,
                    filter: i.filter,
                    start_date: i.startDate,
                    end_date: i.endDate,
                    status: i.status,
                  }),
              ),
            }),
            webhooks: router({
              list: query(
                { description: "Webhooks of an organization.", input: object({ organizationId: id, continuation }) },
                async (_ctx, { organizationId, continuation }) => c.get(`/organizations/${enc(organizationId)}/webhooks/`, { continuation }),
              ),
              create: mutation(
                {
                  description:
                    "Create a webhook. endpointUrl receives POSTs; actions is a comma-separated list such as order.placed,attendee.updated,event.published; eventId limits it to one event.",
                  input: object({ organizationId: id, endpointUrl: string({ minLength: 1 }), actions: string({ minLength: 1 }), eventId: string().optional() }),
                  approval: always(),
                },
                async (_ctx, i) =>
                  c.post(`/organizations/${enc(i.organizationId)}/webhooks/`, {
                    endpoint_url: i.endpointUrl,
                    actions: i.actions,
                    ...(i.eventId ? { event_id: i.eventId } : {}),
                  }),
              ),
              delete: mutation(
                { description: "Delete a webhook.", input: object({ webhookId: id }), approval: always() },
                async (_ctx, { webhookId }) => c.del(`/webhooks/${enc(webhookId)}/`),
              ),
            }),
            teams: router({
              list: query(
                { description: "Teams of an event.", input: object({ eventId: id, continuation }) },
                async (_ctx, { eventId, continuation }) => c.get(`/events/${enc(eventId)}/teams/`, { continuation }),
              ),
              get: query(
                { description: "One team of an event.", input: object({ eventId: id, teamId: id }) },
                async (_ctx, { eventId, teamId }) => c.get(`/events/${enc(eventId)}/teams/${enc(teamId)}/`),
              ),
              attendees: query(
                { description: "Attendees of a team.", input: object({ eventId: id, teamId: id, continuation }) },
                async (_ctx, { eventId, teamId, continuation }) => c.get(`/events/${enc(eventId)}/teams/${enc(teamId)}/attendees/`, { continuation }),
              ),
            }),
            reference: router({
              categories: query(
                { description: "All event categories with subcategories.", input: object({}) },
                async () => c.get("/categories/"),
              ),
              subcategories: query(
                { description: "All event subcategories.", input: object({}) },
                async () => c.get("/subcategories/"),
              ),
              formats: query(
                { description: "All event formats (conference, seminar, ...).", input: object({}) },
                async () => c.get("/formats/"),
              ),
              feeRates: query(
                { description: "Eventbrite fee rates for a country and currency (ISO codes, e.g. US and USD).", input: object({ country: id, currency: id }) },
                async (_ctx, { country, currency }) => c.get("/pricing/fee_rates", { country, currency }),
              ),
              calculatePrice: query(
                {
                  description: "Estimate fees, tax and total for a hypothetical ticket price. Makes no changes. body is the price calculation request.",
                  input: object({ request: body }),
                },
                async (_ctx, { request }) => c.post("/pricing/calculate_price_for_item/", request),
              ),
              seatMaps: query(
                { description: "Seat maps of an organization.", input: object({ organizationId: id }) },
                async (_ctx, { organizationId }) => c.get(`/organizations/${enc(organizationId)}/seatmaps/`),
              ),
            }),
          });
        },
        { signal },
      ),
      {
        title: "Eventbrite",
        description:
          "Events, ticket classes, orders, attendees, venues, discounts, questions, reports and webhooks from the Eventbrite API v3.",
        icons,
      },
    ),
  }),
);
