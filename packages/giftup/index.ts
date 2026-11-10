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

const base = "https://api.giftup.app";

const giftup = defineProvider({
  name: "Gift Up!",
  hosts: ["api.giftup.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/company`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({ id: string() }));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;
type Patch = { op: string; path: string; value?: unknown };

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const url = (path: string, params: Params = {}) => {
    const u = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const v of value) u.searchParams.append(key, String(v));
      else u.searchParams.set(key, String(value));
    }
    return u.toString();
  };
  const call = async (method: string, path: string, params: Params, body: unknown, contentType: string, testMode?: boolean) => {
    const response = await fetcher(url(path, params), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(testMode === true ? { "x-giftup-testmode": "true" } : {}),
        ...(body === undefined ? {} : { "Content-Type": contentType }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    // 422 bodies explain why a gift card action was refused, so surface them.
    if (!response.ok) throw new Error(`Gift Up returned ${response.status}: ${text.slice(0, 500)}`);
    return text.trim() === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };
  const jsonType = "application/json";
  return {
    get: (path: string, params: Params = {}, testMode?: boolean) => call("GET", path, params, undefined, jsonType, testMode),
    post: (path: string, body: unknown = {}, testMode?: boolean) => call("POST", path, {}, body, jsonType, testMode),
    patch: (path: string, operations: readonly Patch[], testMode?: boolean) =>
      call("PATCH", path, {}, operations, "application/json-patch+json", testMode),
    del: (path: string) => call("DELETE", path, {}, undefined, jsonType),
  };
}

type Client = ReturnType<typeof client>;

const enc = encodeURIComponent;
const TestMode = boolean().optional();
const Metadata = record(json()).optional();
const PatchOps = array(
  object({
    op: string({ minLength: 1 }),
    path: string({ minLength: 1 }),
    value: json().optional(),
  }),
);
const Paging = {
  limit: number().optional(),
  offset: number().optional(),
};

const tools = (c: Client) =>
  router(
    {
      company: router(
        {
          get: query(
            { description: "Get the company (Gift Up account) that owns the API key: id, name, currency and onboarding state.", input: object({}) },
            async () => c.get("/company"),
          ),
        },
        { title: "Company" },
      ),
      giftCards: router(
        {
          list: query(
            {
              description:
                "List gift cards. status is active, expired, redeemed or voided. Dates are UTC (yyyy-MM-dd or ISO 8601). limit is 1-100 (default 10). Returns giftCards, total and hasMore.",
              input: object({
                status: string().optional(),
                createdOnOrAfter: string().optional(),
                updatedOnOrAfter: string().optional(),
                orderId: string().optional(),
                sku: string().optional(),
                recipientEmail: string().optional(),
                purchaserEmail: string().optional(),
                paymentTransactionId: string().optional(),
                testMode: TestMode,
                ...Paging,
              }),
            },
            async (_ctx, { testMode, ...input }) => c.get("/gift-cards", input, testMode),
          ),
          get: query(
            { description: "Get a gift card by code, including balance, order, fulfilment and ledger.", input: object({ code: string({ minLength: 1 }), testMode: TestMode }) },
            async (_ctx, { code, testMode }) => c.get(`/gift-cards/${enc(code)}`, {}, testMode),
          ),
          update: mutation(
            {
              description:
                'Update a gift card with JSON Patch operations. Supported paths: /title, /expireson, /validfrom, /receipientemail (spelled this way in the Gift Up docs; unverified against a live account), /recipientname, /sku, /terms. Example: [{ "op": "replace", "path": "/title", "value": "New title" }].',
              input: object({ code: string({ minLength: 1 }), operations: PatchOps, testMode: TestMode }),
              approval: always(),
            },
            async (_ctx, { code, operations, testMode }) => c.patch(`/gift-cards/${enc(code)}`, operations, testMode),
          ),
          topUp: mutation(
            {
              description:
                "Add balance to a gift card (live data unless testMode is true). Pass amount for currency-backed cards or units for unit-backed cards. Returns transactionId and the new balance.",
              input: object({
                code: string({ minLength: 1 }),
                amount: number().optional(),
                units: number().optional(),
                reason: string().optional(),
                locationId: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/top-up`, body, testMode),
          ),
          redeem: mutation(
            {
              description:
                "Deduct balance from a gift card (live data unless testMode is true). Pass amount for currency-backed cards or units for unit-backed cards. redeemedOn is an optional UTC datetime (now or past). Returns transactionId and the remaining balance.",
              input: object({
                code: string({ minLength: 1 }),
                amount: number().optional(),
                units: number().optional(),
                reason: string().optional(),
                locationId: string().optional(),
                redeemedOn: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/redeem`, body, testMode),
          ),
          redeemInFull: mutation(
            {
              description: "Deduct the entire remaining balance from a gift card.",
              input: object({
                code: string({ minLength: 1 }),
                reason: string().optional(),
                locationId: string().optional(),
                redeemedOn: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/redeem-in-full`, body, testMode),
          ),
          undoRedemption: mutation(
            {
              description: "Reverse a previous redemption. transactionId is returned by redeem and appears in the gift card ledger.",
              input: object({
                code: string({ minLength: 1 }),
                transactionId: string({ minLength: 1 }),
                reason: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/undo-redemption`, body, testMode),
          ),
          void: mutation(
            {
              description: "Void a gift card so it can no longer be redeemed.",
              input: object({
                code: string({ minLength: 1 }),
                reason: string().optional(),
                locationId: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/void`, body, testMode),
          ),
          reactivate: mutation(
            {
              description: "Reactivate a voided gift card so it can be redeemed again (needs a positive remaining balance).",
              input: object({
                code: string({ minLength: 1 }),
                reason: string().optional(),
                locationId: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { code, testMode, ...body }) => c.post(`/gift-cards/${enc(code)}/reactivate`, body, testMode),
          ),
          transferBalances: mutation(
            {
              description: "Move the balances of one or more source gift cards onto a single destination gift card. Codes are gift card codes.",
              input: object({
                sourceGiftCards: array(string({ minLength: 1 })),
                destinationGiftCard: string({ minLength: 1 }),
                reason: string().optional(),
                locationId: string().optional(),
                metadata: Metadata,
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { testMode, ...body }) => c.post("/gift-cards/transfer-balances", body, testMode),
          ),
        },
        { title: "Gift cards", description: "Look up, redeem, top up and manage gift cards. Calls hit live data unless testMode is true." },
      ),
      orders: router(
        {
          list: query(
            {
              description:
                "List orders. source is one of API, Checkout, Dashboard, Import, Square, Vend, External. Returns orders, total and hasMore.",
              input: object({
                createdOnOrAfter: string().optional(),
                purchaserEmail: string().optional(),
                source: string().optional(),
                testMode: TestMode,
                ...Paging,
              }),
            },
            async (_ctx, { testMode, ...input }) => c.get("/orders", input, testMode),
          ),
          get: query(
            { description: "Get an order by id.", input: object({ id: string({ minLength: 1 }), testMode: TestMode }) },
            async (_ctx, { id, testMode }) => c.get(`/orders/${enc(id)}`, {}, testMode),
          ),
          create: mutation(
            {
              description:
                "Create an order, which creates its gift cards. Live-mode orders are charged at Gift Up's fee; set testMode to true to create a free test order. Body fields: orderDate, disableAllEmails, purchaserEmail, purchaserName, tip, serviceFee, discount, revenue, itemDetails (list of { quantity, id | name, description, code, backingType, price, value, units, ... }), recipientDetails ({ recipientName, recipientEmail, message, scheduledFor, fulfilmentMethod, shippingAddress, shippingOption }), salesTaxes, metadata.",
              input: object({ order: record(json()), testMode: TestMode }),
              approval: always(),
            },
            async (_ctx, { order, testMode }) => c.post("/orders", order, testMode),
          ),
          update: mutation(
            {
              description: "Update an order with JSON Patch operations. Supported paths: /purchasername, /purchaseremail and metadata. id may be the order id or order number.",
              input: object({ id: string({ minLength: 1 }), operations: PatchOps, testMode: TestMode }),
              approval: always(),
            },
            async (_ctx, { id, operations, testMode }) => c.patch(`/orders/${enc(id)}`, operations),
          ),
          addNote: mutation(
            {
              description: "Add a note (up to 500 characters) to an order.",
              input: object({ id: string({ minLength: 1 }), content: string({ minLength: 1 }), testMode: TestMode }),
              approval: always(),
            },
            async (_ctx, { id, content, testMode }) => c.post(`/orders/${enc(id)}/notes`, { content }, testMode),
          ),
          markPosted: mutation(
            {
              description:
                "Mark a postal order as posted. codes must list every code in the order as { oldCode, newCode }; set newCode equal to oldCode to keep a code.",
              input: object({
                id: string({ minLength: 1 }),
                codes: array(object({ oldCode: string({ minLength: 1 }), newCode: string({ minLength: 1 }) })),
                testMode: TestMode,
              }),
              approval: always(),
            },
            async (_ctx, { id, codes, testMode }) => c.post(`/orders/${enc(id)}/post`, { codes }, testMode),
          ),
        },
        { title: "Orders", description: "List, create and update gift card orders." },
      ),
      items: router(
        {
          list: query(
            { description: "List items (the gift cards for sale), optionally only those in a group.", input: object({ groupId: string().optional() }) },
            async (_ctx, input) => c.get("/items", input),
          ),
          get: query(
            { description: "Get an item by id.", input: object({ id: string({ minLength: 1 }) }) },
            async (_ctx, { id }) => c.get(`/items/${enc(id)}`),
          ),
          create: mutation(
            {
              description:
                "Create an item for sale. Fields include name, description, backingType (Currency or Units), priceType (Specified or Custom), price, value, units, equivalentValuePerUnit, minimumPrice, maximumPrice, availableFrom, availableUntil, groupId, detailsURL, stockLevel, codes, perOrderLimit, additionalTerms, sku.",
              input: object({ item: record(json()) }),
              approval: always(),
            },
            async (_ctx, { item }) => c.post("/items", item),
          ),
          update: mutation(
            {
              description: 'Update an item with JSON Patch operations, for example [{ "op": "replace", "path": "/name", "value": "New name" }].',
              input: object({ id: string({ minLength: 1 }), operations: PatchOps }),
              approval: always(),
            },
            async (_ctx, { id, operations }) => c.patch(`/items/${enc(id)}`, operations),
          ),
          delete: mutation(
            { description: "Delete an item.", input: object({ id: string({ minLength: 1 }) }), approval: always() },
            async (_ctx, { id }) => c.del(`/items/${enc(id)}`),
          ),
        },
        { title: "Items", description: "The gift cards offered for sale in the checkout." },
      ),
      groups: router(
        {
          list: query({ description: "List item groups.", input: object({}) }, async () => c.get("/groups")),
          get: query(
            { description: "Get an item group by id.", input: object({ id: string({ minLength: 1 }) }) },
            async (_ctx, { id }) => c.get(`/groups/${enc(id)}`),
          ),
          create: mutation(
            {
              description: "Create an item group.",
              input: object({
                name: string({ minLength: 1 }),
                description: string().optional(),
                sortOrder: number().optional(),
                autoExpand: boolean().optional(),
              }),
              approval: always(),
            },
            async (_ctx, body) => c.post("/groups", body),
          ),
          update: mutation(
            {
              description: "Update an item group with JSON Patch operations (paths /name, /description, /autoExpand; sort order is only settable at creation).",
              input: object({ id: string({ minLength: 1 }), operations: PatchOps }),
              approval: always(),
            },
            async (_ctx, { id, operations }) => c.patch(`/groups/${enc(id)}`, operations),
          ),
          delete: mutation(
            { description: "Delete an item group.", input: object({ id: string({ minLength: 1 }) }), approval: always() },
            async (_ctx, { id }) => c.del(`/groups/${enc(id)}`),
          ),
        },
        { title: "Item groups" },
      ),
      locations: router(
        { list: query({ description: "List locations.", input: object({}) }, async () => c.get("/locations")) },
        { title: "Locations" },
      ),
      promotions: router(
        { list: query({ description: "List promotions.", input: object({}) }, async () => c.get("/promotions")) },
        { title: "Promotions" },
      ),
      reports: router(
        {
          listTransactions: query(
            {
              description:
                "List report transactions (gift card and order events). events, users and locations filter by value and accept several; code filters by gift card code. limit is 1-100 (default 20).",
              input: object({
                eventOccurredOnOrAfter: string().optional(),
                eventOccurredOnOrBefore: string().optional(),
                events: array(string()).optional(),
                users: array(string()).optional(),
                locations: array(string()).optional(),
                code: string().optional(),
                testMode: TestMode,
                ...Paging,
              }),
            },
            async (_ctx, { testMode, ...input }) => c.get("/reports/transactions", input, testMode),
          ),
          getTransaction: query(
            { description: "Get a report transaction by id.", input: object({ id: string({ minLength: 1 }), testMode: TestMode }) },
            async (_ctx, { id, testMode }) => c.get(`/reports/transactions/${enc(id)}`, {}, testMode),
          ),
        },
        { title: "Reports" },
      ),
      settings: router(
        {
          checkout: query({ description: "Get checkout settings.", input: object({}) }, async () => c.get("/settings/checkout")),
          email: query({ description: "Get email settings.", input: object({}) }, async () => c.get("/settings/email")),
          giftCard: query({ description: "Get gift card settings.", input: object({}) }, async () => c.get("/settings/gift-card")),
          shipping: query({ description: "Get shipping settings.", input: object({}) }, async () => c.get("/settings/shipping")),
          listArtwork: query({ description: "List gift card artwork.", input: object({}) }, async () => c.get("/settings/gift-card/artwork")),
          deleteArtwork: mutation(
            { description: "Delete gift card artwork by id.", input: object({ id: string({ minLength: 1 }) }), approval: always() },
            async (_ctx, { id }) => c.del(`/settings/gift-card/artwork/${enc(id)}`),
          ),
        },
        { title: "Settings" },
      ),
      users: router(
        {
          list: query({ description: "List users with access to the company.", input: object({}) }, async () => c.get("/users")),
          get: query(
            { description: "Get a user by id.", input: object({ id: string({ minLength: 1 }) }) },
            async (_ctx, { id }) => c.get(`/users/${enc(id)}`),
          ),
        },
        { title: "Users" },
      ),
      webhooks: router(
        {
          list: query({ description: "List webhooks.", input: object({}) }, async () => c.get("/hooks")),
          get: query(
            { description: "Get a webhook by id.", input: object({ id: string({ minLength: 1 }) }) },
            async (_ctx, { id }) => c.get(`/hooks/${enc(id)}`),
          ),
          subscribe: mutation(
            {
              description:
                "Subscribe a webhook. event is order-created, gift-card-created, gift-card-updated or gift-card-redeemed. Gift Up first POSTs { test: true } to targetUrl and needs a 200. Requests are signed with secret in X-Request-Signature-Sha-256.",
              input: object({
                event: string({ minLength: 1 }),
                targetUrl: string({ minLength: 1 }),
                secret: string().optional(),
                isTestMode: boolean().optional(),
              }),
              approval: always(),
            },
            async (_ctx, { event, ...body }) => c.post(`/hooks/${enc(event)}/subscribe`, body),
          ),
          delete: mutation(
            { description: "Delete a webhook.", input: object({ id: string({ minLength: 1 }) }), approval: always() },
            async (_ctx, { id }) => c.del(`/hooks/${enc(id)}`),
          ),
        },
        { title: "Webhooks" },
      ),
    },
    {},
  );

export default defineApp(
  { user: { accounts: { giftup: giftup.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.giftup ?? [], (account) => tools(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Gift Up!",
        description: "Sell and manage gift cards with Gift Up!: gift cards, orders, items, groups, locations, promotions, reports, settings, users and webhooks.",
        icons,
      },
    ),
  }),
);
