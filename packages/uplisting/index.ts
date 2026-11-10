import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
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

const base = "https://connect.uplisting.io";

// Uplisting expects HTTP Basic with the Base64 of the bare API key (no "user:" prefix).
const authorization = (token: string) => `Basic ${btoa(token)}`;

const uplisting = defineProvider({
  name: "Uplisting",
  hosts: ["connect.uplisting.io", "auth.airdna.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The modern partner API. Client registration is not self-serve: the client id, secret and redirect URI are
    // issued by Uplisting (partner@uplisting.io). Tokens come from AirDNA's authorization server, PKCE S256.
    oauth: oauth2({
      authorizationUrl: "https://auth.airdna.co/oauth2/authorize",
      tokenUrl: "https://auth.airdna.co/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline_access",
        "properties:read",
        "properties:write",
        "bookings:read",
        "bookings:create",
        "bookings:update",
        "calendar:read",
        "calendar:write",
        "reviews:read",
        "custom_booking_attributes:read",
        "custom_booking_attributes:write",
        "messaging:read",
        "messaging:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response =
      account.method === "oauth"
        ? await fetch(`${base}/ping`, {
            signal,
            headers: { Authorization: `Bearer ${account.fields.access_token}`, "Content-Type": "application/json" },
          })
        : await fetch(`${base}/users/me`, {
            signal,
            headers: { Authorization: authorization(account.fields.token), "Content-Type": "application/json" },
          });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(authValue: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params, clientId?: string) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: authValue,
        "Content-Type": "application/json",
        ...(clientId === undefined ? {} : { "X-Uplisting-Client-ID": clientId }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const optionalString = string().optional();
const payload = record(json());
const range = { from: optionalString, to: optionalString };

function buildLegacy(call: Call) {
  return router({
    me: query(
      { description: "Verify the API key and return the Uplisting user it belongs to.", input: object({}) },
      async () => call("GET", "/users/me"),
    ),
    properties: router(
      {
        list: query(
          { description: "List all properties on the account in JSON API format, with addresses, photos, fees, taxes and amenities in included.", input: object({}) },
          async () => call("GET", "/properties"),
        ),
        get: query(
          { description: "Retrieve one property by id, with relationships (address, photos, fees, taxes, channel commissions, amenities).", input: object({ id: string() }) },
          async (_ctx, input) => call("GET", `/properties/${encodeURIComponent(input.id)}`),
        ),
        availability: query(
          {
            description:
              "Search properties available for a stay. Dates are YYYY-MM-DD; check_out is the morning of departure. All filters are optional.",
            input: object({
              check_in: optionalString,
              check_out: optionalString,
              number_of_guests: optionalString,
              min_price: optionalString,
              max_price: optionalString,
              city: optionalString,
            }),
          },
          async (_ctx, input: Params) => call("GET", "/availability", input),
        ),
      },
      { title: "Properties", description: "Properties and availability search." },
    ),
    bookings: router(
      {
        list: query(
          {
            description:
              "List bookings for a property (listing id), at most 50 per page. from and to are YYYY-MM-DD; with neither, returns a year from today (UTC). Use page for more.",
            input: object({ listingId: string(), ...range, page: optionalString }),
          },
          async (_ctx, input) => call("GET", `/bookings/${encodeURIComponent(input.listingId)}`, { from: input.from, to: input.to, page: input.page }),
        ),
        create: mutation(
          {
            description:
              'Create a confirmed booking. body is JSON API: {"data":{"attributes":{"check_in","check_out","guest_name","guest_email","guest_phone","number_of_guests"},"relationships":{"property":{"data":{"type":"properties","id":"..."}}}}}. Partner-only: needs a partner clientId issued by Uplisting (partner@uplisting.io); not available with an ordinary API key.',
            input: object({ clientId: string(), body: payload }),
          },
          async (_ctx, input) => call("POST", "/v2/bookings", {}, input.body, input.clientId),
        ),
        updateAttributes: mutation(
          {
            description:
              'Set custom booking attribute values on a booking. body: {"data":{"attributes":{"<attribute name>":"value"}}}. Partner-only: needs a partner clientId issued by Uplisting (partner@uplisting.io); not available with an ordinary API key.',
            input: object({ bookingId: string(), clientId: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/v2/bookings/${encodeURIComponent(input.bookingId)}`, {}, input.body, input.clientId),
        ),
      },
      { title: "Bookings", description: "Bookings and custom booking attributes." },
    ),
    customBookingAttributes: router(
      {
        list: query(
          { description: "List the booking attributes that can be changed on this account's bookings. Partner-only: needs a partner clientId issued by Uplisting (partner@uplisting.io); not available with an ordinary API key.", input: object({ clientId: string() }) },
          async (_ctx, input) => call("GET", "/v2/custom_booking_attributes", {}, undefined, input.clientId),
        ),
        create: mutation(
          {
            description:
              'Create a custom booking attribute (max 15 per partner per account; names must be namespaced like partner_attribute). body: {"data":{"attributes":{"name","description"}}}. Partner-only: needs a partner clientId issued by Uplisting.',
            input: object({ clientId: string(), body: payload }),
          },
          async (_ctx, input) => call("POST", "/v2/custom_booking_attributes", {}, input.body, input.clientId),
        ),
      },
      { title: "Custom booking attributes", description: "Partner-defined booking attributes used in automated message tags." },
    ),
    calendar: router(
      {
        get: query(
          {
            description:
              "Get the calendar (rates, availability, minimum stay) for a property, up to 12 months. from and to are YYYY-MM-DD; with neither, returns a year from today.",
            input: object({ listingId: string(), ...range }),
          },
          async (_ctx, input) => call("GET", `/calendar/${encodeURIComponent(input.listingId)}`, { from: input.from, to: input.to }),
        ),
        update: mutation(
          {
            description:
              'Update rates, availability, minimum length of stay and arrival/departure closures for date ranges; synced to all connected channels asynchronously. body: {"notification_url"?,"calendar":{"days":[{"date" or "from"+"to" (to is exclusive),"available","day_rate","minimum_length_of_stay","closed_for_arrival","closed_for_departure"}]}}.',
            input: object({ listingId: string(), body: payload }),
          },
          async (_ctx, input) => call("POST", `/calendar/${encodeURIComponent(input.listingId)}`, {}, input.body),
        ),
      },
      { title: "Calendar", description: "Per-night rates, availability and stay restrictions." },
    ),
    webhooks: router(
      {
        list: query({ description: "List registered webhooks.", input: object({}) }, async () => call("GET", "/hooks")),
        create: mutation(
          {
            description:
              "Register a webhook. body: {target_url, event}. Events: booking_created, booking_updated, booking_removed, property_created, property_updated, property_removed.",
            input: object({ body: payload }),
          },
          async (_ctx, input) => call("POST", "/hooks", {}, input.body),
        ),
        delete: mutation(
          { description: "Remove a webhook by the id returned when it was registered.", input: object({ id: string() }) },
          async (_ctx, input) => call("DELETE", `/hooks/${encodeURIComponent(input.id)}`),
        ),
        rotateSecret: mutation(
          { description: "Rotate the signing secret of a webhook. Returns the hook id and the new secret; update signature verification immediately.", input: object({ id: string() }) },
          async (_ctx, input) => call("POST", `/hooks/${encodeURIComponent(input.id)}/rotate_secret`),
        ),
      },
      { title: "Webhooks", description: "Push notifications for booking and property events." },
    ),
  });
}

const id = (value: string) => encodeURIComponent(value);

// The modern partner API (OAuth 2.0 bearer tokens). Same host, different routes and JSON:API bodies.
function buildOauth(call: Call) {
  const page = { limit: optionalString, cursor: optionalString };
  return router({
    ping: query(
      { description: "Verify the OAuth token; returns the user name, email and account id. Scope: any.", input: object({}) },
      async () => call("GET", "/ping"),
    ),
    properties: router(
      {
        list: query(
          {
            description:
              "List properties (cursor-paginated JSON:API). include is a CSV of address, amenities, channel_commissions, channels, discounts, fees, multi_units, photos, policy, protect_security_deposit_setting, suitability, taxes. Scope: properties:read.",
            input: object({ include: optionalString, ...page }),
          },
          async (_ctx, input: Params) => call("GET", "/properties", input),
        ),
        get: query(
          { description: "Fetch one property by id; include as in list. Scope: properties:read.", input: object({ id: string(), include: optionalString }) },
          async (_ctx, input) => call("GET", `/properties/${id(input.id)}`, { include: input.include }),
        ),
        availability: query(
          {
            description: "Search available properties. Dates are YYYY-MM-DD (check_in not earlier than yesterday). All filters optional. Scope: properties:read.",
            input: object({ check_in: optionalString, check_out: optionalString, number_of_guests: optionalString, min_price: optionalString, max_price: optionalString, city: optionalString }),
          },
          async (_ctx, input: Params) => call("GET", "/availability", input),
        ),
        updateFees: mutation(
          {
            description:
              'Bulk-update property fees. body: {"data":[{"type":"property_fees","id":"<propertyId>-cleaning_fee" or "-extra_guest_charge","attributes":{"amount","enabled","guests_included"}}]}. Scope: properties:write.',
            input: object({ propertyId: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/property_fees/${id(input.propertyId)}`, {}, input.body),
        ),
        updateDiscounts: mutation(
          {
            description:
              'Bulk-update length-of-stay discounts. body: {"data":[{"type":"property_discounts","id":"<propertyId>-weekly" or "-monthly","attributes":{"amount"}}]}. Scope: properties:write.',
            input: object({ propertyId: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/property_discounts/${id(input.propertyId)}`, {}, input.body),
        ),
      },
      { title: "Properties", description: "Properties, availability search, fees and discounts." },
    ),
    calendar: router(
      {
        get: query(
          {
            description: "Per-day availability and rates for a property. from defaults to today, to to a year later (max 730 days). Scope: calendar:read.",
            input: object({ propertyId: string(), ...range }),
          },
          async (_ctx, input) => call("GET", `/calendar/${id(input.propertyId)}`, { from: input.from, to: input.to }),
        ),
        update: mutation(
          {
            description:
              'Bulk-update availability and rates (202 with a request_id). body: {"data":{"type":"calendars","attributes":{"notification_url"?,"calendar_days":[{"date" or "from"+"to","available","description"(only when unavailable),"day_rate","minimum_length_of_stay","closed_for_arrival","closed_for_departure"}]}}}, max 1095 entries. Scope: calendar:write.',
            input: object({ propertyId: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/calendar/${id(input.propertyId)}`, {}, input.body),
        ),
      },
      { title: "Calendar", description: "Per-night rates, availability and stay restrictions." },
    ),
    bookings: router(
      {
        list: query(
          { description: "List bookings for a property (cursor-paginated). from defaults to today, to to a year later. Scope: bookings:read.", input: object({ propertyId: string(), ...range, ...page }) },
          async (_ctx, input) => call("GET", "/bookings", { property_id: input.propertyId, from: input.from, to: input.to, limit: input.limit, cursor: input.cursor }),
        ),
        get: query(
          {
            description:
              "Fetch one booking. include is a CSV of booking_tax_items, booking_discounts, booking_promotions, booking_upsells, booking_adjustments, booking_fees, booking_charges, booking_channel_fees, booking_cancellation_details, booking_payments, booking_refunds, security_deposit. Scope: bookings:read.",
            input: object({ id: string(), include: optionalString }),
          },
          async (_ctx, input) => call("GET", `/bookings/${id(input.id)}`, { include: input.include }),
        ),
        create: mutation(
          {
            description:
              'Create a booking. body: {"data":{"attributes":{"check_in","check_out","arrival_time"?,"departure_time"?,"guest_name"?,"guest_email"?,"guest_phone"?,"number_of_guests"?,"status":"pending"|"confirmed"},"relationships":{"property":{"data":{"id":123}}}}}. Scope: bookings:create.',
            input: object({ body: payload }),
          },
          async (_ctx, input) => call("POST", "/bookings", {}, input.body),
        ),
        update: mutation(
          {
            description:
              'Update a booking. body: {"data":{"attributes":{check_in, check_out, guest_name, guest_email, guest_phone, number_of_guests, status, note, arrival_time, departure_time}}} (non-empty). Scope: bookings:update.',
            input: object({ id: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/bookings/${id(input.id)}`, {}, input.body),
        ),
        cancel: mutation(
          { description: "Cancel a booking. Does not refund the guest; refunds are handled separately. Scope: bookings:update.", input: object({ id: string() }) },
          async (_ctx, input) => call("POST", `/bookings/${id(input.id)}/cancellation`),
        ),
        quote: query(
          {
            description: "Price quote for a prospective stay. Dates YYYY-MM-DD, number_of_guests > 0. Scope: bookings:create.",
            input: object({ propertyId: string(), check_in: string(), check_out: string(), number_of_guests: string(), promotion_code: optionalString }),
          },
          async (_ctx, input) =>
            call("GET", "/quotes", { property_id: input.propertyId, check_in: input.check_in, check_out: input.check_out, number_of_guests: input.number_of_guests, promotion_code: input.promotion_code }),
        ),
        respondToRequest: mutation(
          {
            description: 'Approve or decline a pending booking request. body: {"data":{"attributes":{"status":"approved"|"rejected","reason"?,"message"?}}}. Scope: bookings:update.',
            input: object({ id: string(), body: payload }),
          },
          async (_ctx, input) => call("PATCH", `/booking_requests/${id(input.id)}`, {}, input.body),
        ),
      },
      { title: "Bookings", description: "Bookings, quotes and booking requests." },
    ),
    customBookingAttributes: router(
      {
        list: query(
          { description: "List the custom booking attributes defined for your partner integration. Scope: custom_booking_attributes:read.", input: object({}) },
          async () => call("GET", "/custom_booking_attributes"),
        ),
        create: mutation(
          {
            description:
              'Create a custom booking attribute (snake_case, must start with your partner prefix, max 15 per account). body: {"data":{"attributes":{"name","description"}}}. Scope: custom_booking_attributes:write.',
            input: object({ body: payload }),
          },
          async (_ctx, input) => call("POST", "/custom_booking_attributes", {}, input.body),
        ),
      },
      { title: "Custom booking attributes", description: "Partner-defined booking attributes." },
    ),
    reviews: router(
      {
        list: query(
          { description: "List reviews for a property (cursor-paginated). Scope: reviews:read.", input: object({ propertyId: string(), ...page }) },
          async (_ctx, input) => call("GET", `/reviews/${id(input.propertyId)}`, { limit: input.limit, cursor: input.cursor }),
        ),
      },
      { title: "Reviews", description: "Guest reviews." },
    ),
    messaging: router(
      {
        listThreads: query(
          {
            description: "List message threads (cursor-paginated), optionally filtered by booking_id, booking_request_id, enquiry_id, property_id or guest_id. Scope: messaging:read.",
            input: object({ booking_id: optionalString, booking_request_id: optionalString, enquiry_id: optionalString, property_id: optionalString, guest_id: optionalString, ...page }),
          },
          async (_ctx, input: Params) => call("GET", "/threads", input),
        ),
        listMessages: query(
          { description: "List messages in a thread (cursor-paginated). channel is sms, email, airbnb, booking_dot_com or home_away. Scope: messaging:read.", input: object({ threadId: string(), ...page }) },
          async (_ctx, input) => call("GET", `/threads/${id(input.threadId)}/messages`, { limit: input.limit, cursor: input.cursor }),
        ),
        sendMessage: mutation(
          {
            description:
              'Send a message to the guest on a thread. body: {"data":{"type":"messages","attributes":{"channel":"sms"|"email"|"airbnb"|"booking_dot_com"|"home_away","body":"..."}}}; the channel must be enabled for the thread. Scope: messaging:write.',
            input: object({ threadId: string(), body: payload }),
          },
          async (_ctx, input) => call("POST", `/threads/${id(input.threadId)}/messages`, {}, input.body),
        ),
      },
      { title: "Messaging", description: "Guest message threads and messages." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { uplisting: uplisting.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.uplisting ?? [],
        (account) =>
          withApprovals(
            account.method === "oauth"
              ? buildOauth(client(`Bearer ${account.fields.access_token}`, fetch, signal))
              : buildLegacy(client(authorization(account.fields.token), fetch, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Uplisting",
        description: "Vacation rental management with Uplisting: properties, availability search, bookings, calendar rates and availability, reviews, guest messaging and webhooks. API-key accounts use the legacy public API; OAuth accounts use the modern partner API.",
        icons,
      },
    ),
  }),
);
