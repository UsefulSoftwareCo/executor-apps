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

const base = "https://subs.api.tryprive.com/api/v1";

const prive = defineProvider({
  name: "Prive",
  hosts: ["subs.api.tryprive.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A one-row subscription page is read-only and always answers with an object.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/subscriptions?page=1&limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

type Params = Record<string, string | number | boolean | string[] | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const item of value) out.append(key, item);
    else out.set(key, String(value));
  }
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const enc = encodeURIComponent;

const paging = {
  page: number().optional(),
  limit: number().optional(),
  sort: string().optional(),
  desc: boolean().optional(),
  minCreatedAt: string().optional(),
  maxCreatedAt: string().optional(),
  minUpdatedAt: string().optional(),
  maxUpdatedAt: string().optional(),
  includeDeleted: boolean().optional(),
};

const pagingNote =
  "page starts at 1 and limit is 1-250 (default 10). sort defaults to createdAt ascending; set desc to reverse. Date filters are ISO 8601 date-times; set both min and max explicitly because the documented defaults are 2023-01-01.";

const priveTools = (account: Account, signal: AbortSignal) => {
  const headers = {
    Authorization: `Bearer ${account.fields.token}`,
    Accept: "application/json",
    "content-type": "application/json",
  };

  const get = (path: string, params: Params = {}, fetch: typeof globalThis.fetch) =>
    fetch(`${base}${path}${search(params)}`, { signal, headers }).then((r) => decodeJson(r, json()));

  const send = (
    method: "POST" | "PATCH" | "PUT" | "DELETE",
    path: string,
    body: unknown,
    fetch: typeof globalThis.fetch,
  ) =>
    fetch(`${base}${path}`, {
      method,
      signal,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then((r) => decodeJson(r, json()));

  const read = (description: string, input: Parameters<typeof object>[0], path: string) =>
    query({ description, input: object(input) }, async ({ fetch }, args) =>
      get(path, args as Params, fetch),
    );

  return router({
    listSubscriptions: query(
      {
        description: `List subscriptions with filters. ${pagingNote} status is ACTIVE, PAUSED, EXPIRED, CANCELLED or FAILED; statuses filters on several at once. Filter by subscriberId, subscriberEmail, subscriberExternalId (Shopify customer id), subscriptionExternalId (Shopify subscription id), variantIds, or the next billing date range.`,
        input: object({
          ...paging,
          status: string().optional(),
          statuses: array(string()).optional(),
          variantIds: array(string()).optional(),
          subscriberId: string().optional(),
          subscriberEmail: string().optional(),
          subscriberExternalId: string().optional(),
          subscriptionExternalId: string().optional(),
          minNextBillingDate: string().optional(),
          maxNextBillingDate: string().optional(),
          includeDunningInstances: boolean().optional(),
        }),
      },
      async ({ fetch }, input) => get("/subscriptions", input as Params, fetch),
    ),
    countSubscriptions: read(
      "Count subscriptions. Accepts the same filters as listSubscriptions without paging.",
      {
        status: string().optional(),
        subscriberId: string().optional(),
        subscriberEmail: string().optional(),
        minCreatedAt: string().optional(),
        maxCreatedAt: string().optional(),
      },
      "/subscriptions/count",
    ),
    getSubscription: query(
      { description: "Get one subscription by its Prive id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(`/subscriptions/${enc(id)}`, {}, fetch),
    ),
    createSubscription: mutation(
      {
        description:
          "Create a subscription. body is the JSON payload of POST /subscriptions (subscriber, lines, delivery address, payment method and cadence); see https://developers.tryprive.com/reference/publicapicontroller_createsubscription for the fields.",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/subscriptions", body, fetch),
    ),
    updateSubscriptionStatus: mutation(
      {
        description:
          "Change a subscription's status to ACTIVE, PAUSED, EXPIRED, CANCELLED or FAILED. cancelReason is only used with CANCELLED.",
        input: object({ id: string(), status: string(), cancelReason: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send("PATCH", `/subscriptions/${enc(id)}/status`, body, fetch),
    ),
    updateSubscriptionPaymentMethod: mutation(
      {
        description:
          "Update a subscription's payment method. Leaving paymentMethodExternalId out sends the subscriber an email to set a new payment method.",
        input: object({ id: string(), paymentMethodExternalId: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send("PATCH", `/subscriptions/${enc(id)}/paymentMethod`, body, fetch),
    ),
    applyDiscountCode: mutation(
      {
        description: "Apply a discount code to a subscription.",
        input: object({ id: string(), code: string() }),
        approval: always(),
      },
      async ({ fetch }, { id, code }) =>
        send("POST", `/subscriptions/${enc(id)}/discountCodes/${enc(code)}`, undefined, fetch),
    ),
    removeDiscountCode: mutation(
      {
        description: "Remove a discount code from a subscription.",
        input: object({ id: string(), code: string() }),
        approval: always(),
      },
      async ({ fetch }, { id, code }) =>
        send("DELETE", `/subscriptions/${enc(id)}/discountCodes/${enc(code)}`, undefined, fetch),
    ),
    previewBillingDeliveryCadence: query(
      {
        description:
          "Preview the effect of updateBillingDeliveryCadence on a subscription. Pass the same cadence fields as query parameters in params.",
        input: object({ id: string(), params: json().optional() }),
      },
      async ({ fetch }, { id, params }) =>
        get(`/subscriptions/${enc(id)}/billingDeliveryCadenceUpdatePreview`, (params ?? {}) as Params, fetch),
    ),
    updateBillingDeliveryCadence: mutation(
      {
        description:
          "Update a subscription's billing and delivery cadence. Lines without a matching cadence are left alone. body is the JSON payload documented at https://developers.tryprive.com/reference/publicapicontroller_updatebillingdeliverycadence.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptions/${enc(id)}/billingDeliveryCadence`, body, fetch),
    ),
    updateDeliveryAddress: mutation(
      {
        description: "Update a subscription's delivery address. body is the address JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptions/${enc(id)}/deliveryAddress`, body, fetch),
    ),
    updateDeliveryShippingOption: mutation(
      {
        description: "Update a subscription's delivery shipping option. body is the shipping option JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) =>
        send("PATCH", `/subscriptions/${enc(id)}/deliveryShippingOption`, body, fetch),
    ),
    updateSubscriptionOfferOption: mutation(
      {
        description: "Update a subscription's offer option. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) =>
        send("PATCH", `/subscriptions/${enc(id)}/subscriptionOfferOption`, body, fetch),
    ),
    updateSubscriptionCustomAttributes: mutation(
      {
        description:
          "Replace a subscription's customAttributes. This overwrites the existing attributes instead of merging, so send the complete set. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptions/${enc(id)}/customAttributes`, body, fetch),
    ),
    updateNextBillingAndDeliveryDate: mutation(
      {
        description: "Change a subscription's next billing and delivery date. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) =>
        send("PATCH", `/subscriptions/${enc(id)}/nextBillingAndDeliveryDate`, body, fetch),
    ),
    skipUpcomingOrder: mutation(
      {
        description:
          "Skip (skip true) or unskip (skip false) the upcoming order on a date (YYYY-MM-DD). With automations configured this can also change other upcoming orders.",
        input: object({ id: string(), date: string(), skip: boolean() }),
        approval: always(),
      },
      async ({ fetch }, { id, date, skip }) =>
        send("PATCH", `/subscriptions/${enc(id)}/upcomingOrders/${enc(date)}/skip`, { skip }, fetch),
    ),
    listSubscriptionBillingAttempts: query(
      {
        description: "List the billing attempts of one subscription. page starts at 1, limit is 1-250.",
        input: object({ id: string(), page: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { id, ...rest }) => get(`/subscriptions/${enc(id)}/billingAttempts`, rest, fetch),
    ),
    countSubscriptionBillingAttempts: query(
      { description: "Count the billing attempts of one subscription.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(`/subscriptions/${enc(id)}/billingAttempts/count`, {}, fetch),
    ),
    listSubscriptionSwapAndAddOnOptions: query(
      {
        description: "List the swap and add-on options available to one subscription.",
        input: object({ id: string(), page: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { id, ...rest }) => get(`/subscriptions/${enc(id)}/swapAndAddOnOptions`, rest, fetch),
    ),
    listSwapAndAddOnOptions: query(
      {
        description: "List swap and add-on options across the store. page starts at 1, limit is 1-250.",
        input: object({ page: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, input) => get("/swapAndAddOnOptions", input, fetch),
    ),
    createOneTimeAddOn: mutation(
      {
        description: "Add a one-time add-on to an upcoming order. body is the JSON payload.",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/oneTimeAddOns", body, fetch),
    ),
    updateOneTimeAddOn: mutation(
      {
        description: "Update a one-time add-on. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/oneTimeAddOns/${enc(id)}`, body, fetch),
    ),
    deleteOneTimeAddOn: mutation(
      { description: "Delete a one-time add-on.", input: object({ id: string() }), approval: always() },
      async ({ fetch }, { id }) => send("DELETE", `/oneTimeAddOns/${enc(id)}`, undefined, fetch),
    ),
    listSubscriptionLines: query(
      {
        description: `List subscription lines (one per product variant on a subscription). ${pagingNote}`,
        input: object({ ...paging, subscriptionId: string().optional() }),
      },
      async ({ fetch }, input) => get("/subscriptionLines", input as Params, fetch),
    ),
    createSubscriptionLine: mutation(
      {
        description: "Add a line to a subscription. body is the JSON payload (subscription id, variant, quantity, price).",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/subscriptionLines", body, fetch),
    ),
    updateSubscriptionLineQuantity: mutation(
      {
        description: "Set the quantity (minimum 1) of a subscription line.",
        input: object({ id: string(), quantity: number() }),
        approval: always(),
      },
      async ({ fetch }, { id, quantity }) => send("PATCH", `/subscriptionLines/${enc(id)}/quantity`, { quantity }, fetch),
    ),
    updateSubscriptionLinePrice: mutation(
      {
        description: "Update the price of a subscription line. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptionLines/${enc(id)}/price`, body, fetch),
    ),
    swapSubscriptionLine: mutation(
      {
        description: "Swap the product variant of a subscription line. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptionLines/${enc(id)}/swap`, body, fetch),
    ),
    updateSubscriptionLineCustomAttributes: mutation(
      {
        description: "Update the customAttributes of a subscription line's variant. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptionLines/${enc(id)}/customAttributes`, body, fetch),
    ),
    createSubscriptionLineSchedule: mutation(
      {
        description: "Create a schedule on a subscription line. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("POST", `/subscriptionLines/${enc(id)}/schedule`, body, fetch),
    ),
    updateSubscriptionLineSchedule: mutation(
      {
        description: "Update the schedule on a subscription line. body is the JSON payload.",
        input: object({ id: string(), body: json() }),
        approval: always(),
      },
      async ({ fetch }, { id, body }) => send("PATCH", `/subscriptionLines/${enc(id)}/schedule`, body, fetch),
    ),
    deleteSubscriptionLine: mutation(
      { description: "Delete a subscription line.", input: object({ id: string() }), approval: always() },
      async ({ fetch }, { id }) => send("DELETE", `/subscriptionLines/${enc(id)}`, undefined, fetch),
    ),
    listSubscribers: query(
      {
        description: `List subscribers (customers with subscriptions). ${pagingNote} Filter by id, email or externalId (Shopify customer id).`,
        input: object({
          ...paging,
          id: string().optional(),
          email: string().optional(),
          externalId: string().optional(),
        }),
      },
      async ({ fetch }, input) => get("/subscribers", input as Params, fetch),
    ),
    getSubscriber: query(
      { description: "Get one subscriber by Prive id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(`/subscribers/${enc(id)}`, {}, fetch),
    ),
    listSubscriberSubscriptions: query(
      {
        description: "List the subscriptions of one subscriber.",
        input: object({ id: string(), page: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { id, ...rest }) => get(`/subscribers/${enc(id)}/subscriptions`, rest, fetch),
    ),
    listSubscriberShopifyPaymentMethods: query(
      { description: "List a subscriber's Shopify payment methods.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(`/subscribers/${enc(id)}/shopifyPaymentMethods`, {}, fetch),
    ),
    updateSubscriber: mutation(
      {
        description:
          "Update a subscriber. The API requires every field: pass null for firstName, lastName, phoneCountryCode or phone to clear them; email must be a string.",
        input: object({
          id: string(),
          email: string(),
          firstName: string().optional(),
          lastName: string().optional(),
          phoneCountryCode: string().optional(),
          phone: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { id, email, firstName, lastName, phoneCountryCode, phone }) =>
        send(
          "PATCH",
          `/subscribers/${enc(id)}`,
          {
            email,
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            phoneCountryCode: phoneCountryCode ?? null,
            phone: phone ?? null,
          },
          fetch,
        ),
    ),
    createPortalLoginToken: mutation(
      {
        description: "Create a customer portal login token for a subscriber, so they can sign in to the subscription portal.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send("POST", `/subscribers/${enc(id)}/portalLoginToken`, {}, fetch),
    ),
    listOrders: query(
      {
        description: `List processed orders. ${pagingNote} status is PROCESSED, REFUNDED or PARTIALLY_REFUNDED.`,
        input: object({
          ...paging,
          subscriptionId: string().optional(),
          subscriptionExternalId: string().optional(),
          status: string().optional(),
          subscriberId: string().optional(),
          subscriberEmail: string().optional(),
          subscriberExternalId: string().optional(),
          orderExternalId: string().optional(),
        }),
      },
      async ({ fetch }, input) => get("/orders", input as Params, fetch),
    ),
    countOrders: read(
      "Count processed orders, optionally filtered by subscriptionId, subscriberId or status.",
      { subscriptionId: string().optional(), subscriberId: string().optional(), status: string().optional() },
      "/orders/count",
    ),
    listOrderLineItems: read(
      `List order line items. ${pagingNote}`,
      { ...paging, orderExternalId: string().optional(), subscriptionId: string().optional() },
      "/orderLineItems",
    ),
    listBaseOrders: read(
      `List fulfilled and upcoming orders (Shopify checkout orders are excluded). ${pagingNote}`,
      { ...paging, subscriptionId: string().optional(), subscriberId: string().optional() },
      "/baseOrders",
    ),
    listBaseOrderLineItems: read(
      `List line items of fulfilled and upcoming orders. ${pagingNote}`,
      { ...paging, subscriptionId: string().optional() },
      "/baseOrderLineItems",
    ),
    listProducts: read(
      `List products synced from the store. ${pagingNote}`,
      { ...paging },
      "/products",
    ),
    listBillingAttempts: read(
      `List billing attempts across all subscriptions. ${pagingNote}`,
      { ...paging, subscriptionId: string().optional() },
      "/billingAttempts",
    ),
    createBillingAttempt: mutation(
      {
        description:
          "Create a billing attempt. The PROCESS_NOW trigger moves the subscription's next delivery date to now and charges immediately. body is the JSON payload documented at https://developers.tryprive.com/reference/publicapicontroller_createbillingattempt.",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/billingAttempts", body, fetch),
    ),
    listSubscriptionDiscountCodes: read(
      `List discount codes applied to subscriptions. ${pagingNote}`,
      { ...paging, subscriptionId: string().optional() },
      "/subscriptionDiscountCodes",
    ),
    listSubscriptionActivities: read(
      `List subscription activity events (status changes, edits, billing). ${pagingNote}`,
      { ...paging, subscriptionId: string().optional() },
      "/subscriptionActivities",
    ),
    listCancellationQuestions: read(
      "List the cancellation survey questions.",
      { page: number().optional(), limit: number().optional() },
      "/cancellationQuestions",
    ),
    listCancellationSurveyResults: read(
      `List cancellation survey results. ${pagingNote}`,
      { ...paging, subscriptionId: string().optional() },
      "/cancellationSurveyResults",
    ),
    createCancellationSurveyResult: mutation(
      {
        description: "Record a cancellation survey answer. body is the JSON payload.",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/cancellationSurveyResults", body, fetch),
    ),
    listMemberships: read(
      `List memberships. ${pagingNote}`,
      { ...paging },
      "/memberships",
    ),
    createLifetimeMembership: mutation(
      {
        description: "Grant a lifetime membership. body is the JSON payload.",
        input: object({ body: json() }),
        approval: always(),
      },
      async ({ fetch }, { body }) => send("POST", "/memberships/lifetime", body, fetch),
    ),
    listWebhooks: query(
      { description: "List webhook subscriptions.", input: object({}) },
      async ({ fetch }) => get("/webhooks", {}, fetch),
    ),
    getWebhook: query(
      { description: "Get one webhook by id.", input: object({ id: string() }) },
      async ({ fetch }, { id }) => get(`/webhooks/${enc(id)}`, {}, fetch),
    ),
    createWebhook: mutation(
      {
        description:
          "Create a webhook. topic is one of subscriptions/created, subscriptions/line_removed, subscriptions/status/updated, orders/created, billingAttempts/created, billingAttempts/success, billingAttempts/failed, paymentMethod/updated, subscriptionActivities/created, subscription/customAttributes/updated.",
        input: object({ address: string(), topic: string() }),
        approval: always(),
      },
      async ({ fetch }, input) => send("POST", "/webhooks", input, fetch),
    ),
    updateWebhook: mutation(
      {
        description: "Update a webhook's address or topic.",
        input: object({ id: string(), address: string().optional(), topic: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { id, ...body }) => send("PATCH", `/webhooks/${enc(id)}`, body, fetch),
    ),
    deleteWebhook: mutation(
      { description: "Delete a webhook.", input: object({ id: string() }), approval: always() },
      async ({ fetch }, { id }) => send("DELETE", `/webhooks/${enc(id)}`, undefined, fetch),
    ),
    testWebhook: mutation(
      {
        description: "Send a test event to a webhook's address.",
        input: object({ id: string() }),
        approval: always(),
      },
      async ({ fetch }, { id }) => send("POST", `/webhooks/${enc(id)}/test`, {}, fetch),
    ),
  });
};

export default defineApp({ user: { accounts: { prive: prive.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.prive ?? [], (account) => priveTools(account, signal), { signal }), {
    title: "Prive",
    description:
      "Manage Prive subscription commerce: subscribers, subscriptions, lines, upcoming orders, billing attempts, discount codes, products and webhooks.",
    icons,
  }),
}));
