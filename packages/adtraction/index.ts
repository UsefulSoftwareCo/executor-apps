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
  type Schema,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.adtraction.net";

const adtraction = defineProvider({
  name: "Adtraction",
  hosts: ["api.adtraction.net"],
  auth: {
    // Adtraction has no OAuth. A token is created under Account > Settings and is sent in X-Token.
    token: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Partner tokens can read markets; advertiser tokens can read the advertiser account.
  async health({ account, fetch, signal }) {
    const headers = { "X-Token": account.fields.token, Accept: "application/json" };
    const partner = await fetch(`${base}/v2/partner/markets/`, { signal, headers });
    if (partner.ok) {
      await decodeJson(partner, json());
      return;
    }
    const advertiser = await fetch(`${base}/v2/advertiser/account/`, { signal, headers });
    await decodeJson(advertiser, json());
  },
});

type Kind = "query" | "mutation";
type FieldType = "string" | "number" | "boolean" | "array" | "json";
type Field = [name: string, type: FieldType, required: boolean, where: "path" | "query" | "body", description: string];
type Row = [group: string, action: string, method: string, path: string, kind: Kind, description: string, fields: Field[]];

const STATUS = "Transaction status: 1 = approved, 2 = pending, 3 = approved + pending, 4 = open claims, 5 = rejected";
const TX_STATUS_ALL = `${STATUS} (0 = all is also accepted for transaction listings)`;
const PAY_STATUS = "Payment status: 1 = not invoiced, 2 = invoiced to advertiser, 3 = ready for payment, 4 = paid to partner";
const programId: Field = ["programId", "number", false, "body", "Numerical ID of a partner program"];
const channelId: Field = ["channelId", "number", false, "body", "Numerical ID of a channel"];
const from: Field = ["fromDate", "string", true, "body", "Start of the range, ISO 8601 (UTC)"];
const to: Field = ["toDate", "string", true, "body", "End of the range, ISO 8601 (UTC)"];
const currency = (required: boolean): Field => ["currency", "string", required, "body", "ISO 4217 currency code, such as SEK"];
const market = (required: boolean): Field => ["market", "string", required, "body", "ISO 3166-1 alpha-2 country code of the market"];
const txStatus: Field = ["transactionStatus", "number", true, "body", STATUS];

const partnerStats = (action: string, path: string, description: string, extra: Field[] = []): Row => [
  "partner",
  action,
  "POST",
  `/v2/partner/${path}/`,
  "query",
  description,
  [from, to, currency(true), market(true), txStatus, programId, channelId, ...extra],
];
const partnerCommission = (action: string, path: string, description: string, needsStatus: boolean): Row => [
  "partner",
  action,
  "POST",
  `/v2/partner/commission/${path}/`,
  "query",
  description,
  [from, to, currency(true), ...(needsStatus ? [txStatus] : []), market(false), programId, channelId],
];
const advertiserStats = (action: string, path: string, description: string, withChannel: boolean): Row => [
  "advertiser",
  action,
  "POST",
  `/v2/advertiser/statistics${path}`,
  "query",
  description,
  [from, to, txStatus, ...(withChannel ? [channelId] : [])],
];

// Tool name, HTTP verb, path and fields follow the Adtraction API documentation (https://api.adtraction.net/).
// Reads that are POST requests carry filters in the body and are queries; writes, including getTrackingLink (which creates a link), are mutations and need approval. Path rows: optional path segments must be a contiguous prefix, and the leading segment of a row is required when later ones are optional.
const rows: Row[] = [
  // Partner: programs
  ["partner", "listMarkets", "GET", "/v2/partner/markets/", "query", "List the markets (countries) on which Adtraction offers partner programs.", []],
  ["partner", "listCurrencies", "GET", "/v2/partner/currencies/", "query", "List all active currencies on the Adtraction platform.", []],
  ["partner", "listChannels", "GET", "/v2/partner/channels/{channelId}/", "query", "List the approved channels (websites, blogs, newsletters, paid ads) in your partner account. Omit channelId for all.", [
    ["channelId", "number", false, "path", "Numerical ID of a channel"],
  ]],
  ["partner", "listApplications", "GET", "/v2/partner/applications/", "query", "List the status of your channel applications to partner programs.", [
    ["programId", "number", false, "query", "Numerical ID of a partner program"],
    ["channelId", "number", false, "query", "Numerical ID of a channel"],
  ]],
  ["partner", "listPrograms", "POST", "/v3/partner/programs/", "query", "List partner programs on the Adtraction platform for a market, with commission and approval details.", [
    market(true),
    programId,
    channelId,
    ["approvalStatus", "number", false, "body", "Approval status: 0 = rejected, 1 = approved, 2 = pending review"],
    ["status", "number", false, "body", "Program status on the platform: 0 = live, 3 = closing"],
  ]],
  ["partner", "listProgramCategories", "GET", "/v2/partner/programs/categories/{marketId}", "query", "List program categories for a market with the number of programs in each.", [
    ["marketId", "number", true, "path", "Numerical ID of a market (from listMarkets)"],
  ]],
  ["partner", "getProgramDirectory", "GET", "/v2/partner/programs/directory/{marketId}/{categoryId}", "query", "List all programs with their category, optionally filtered by market and category.", [
    ["marketId", "number", true, "path", "Numerical ID of a market"],
    ["categoryId", "number", false, "path", "Numerical ID of a category"],
  ]],
  ["partner", "listNewPrograms", "GET", "/v2/partner/programs/new/{marketId}/", "query", "List partner programs recently added to the platform (normally up to 30 days).", [
    ["marketId", "number", true, "path", "Numerical ID of a market"],
  ]],
  ["partner", "listCommissionTypes", "GET", "/v3/partner/programs/commissions/{programId}/{channelId}/", "query", "List the commission types of a partner program. With channelId, returns the commissions of the segment the channel belongs to.", [
    ["programId", "number", true, "path", "Numerical ID of the partner program"],
    ["channelId", "number", false, "path", "Numerical ID of a channel"],
  ]],
  ["partner", "listOffers", "POST", "/v2/partner/offers/", "query", "List coupon codes, vouchers and offers available for partner programs.", [market(false), programId, channelId]],
  // Partner: tracking links and products
  ["partner", "getTrackingLink", "POST", "/v2/partner/tracking/link/", "mutation", "Create an Adtraction tracking link for a program and channel, optionally to a specific page on the advertiser's domain.", [
    ["channelId", "number", true, "body", "Numerical ID of a channel"],
    ["programId", "number", true, "body", "Numerical ID of a partner program"],
    ["shortLink", "boolean", false, "body", "Return a short link instead of a traditional tracking link"],
    ["url", "string", false, "body", "Target page; must include http(s) and be on the advertiser's domain"],
    ["epi", "string", false, "body", "EPI value inserted into the tracking link"],
    ["epi2", "string", false, "body", "EPI2 value"],
    ["epi3", "string", false, "body", "EPI3 value"],
    ["epi4", "string", false, "body", "EPI4 value"],
    ["epi5", "string", false, "body", "EPI5 value"],
  ]],
  ["partner", "searchProducts", "POST", "/v2/partner/products/", "query", "Search the Adtraction product database. keyword supports AND, OR, -term, \"phrases\", wildcard*, parentheses, field:value (such as sku:123) and 'AND discounted:true'. Use getTrackingLink for tracking links.", [
    ["keyword", "string", true, "body", "Search keyword or query"],
    ["page", "number", true, "body", "Result page, starting at 0"],
    ["pageSize", "number", true, "body", "Products per page"],
    ["programId", "string", false, "body", "One or several program IDs, comma separated"],
    ["market", "string", false, "body", "ISO 3166-1 alpha-2 country code"],
    ["currency", "string", false, "body", "ISO 4217 currency code"],
    ["inStock", "boolean", false, "body", "Only products that are (or are not) in stock"],
    ["minPrice", "number", false, "body", "Minimum price"],
    ["maxPrice", "number", false, "body", "Maximum price"],
    ["sort", "string", false, "body", "Comma-separated sort keys (productPrice, programId, inStock, manufacturerArticleNumber, ean), each optionally followed by :asc or :desc"],
  ]],
  ["partner", "getProductFeed", "POST", "/v3/partner/products/feed/", "query", "Retrieve all products in an advertiser's product feed.", [
    ["programId", "number", true, "body", "Numerical ID of a partner program"],
    ["channelId", "number", true, "body", "Numerical ID of a channel"],
    ["feedId", "number", false, "body", "Numerical ID of a product feed"],
    ["setEpi", "boolean", false, "body", "Set the EPI to the product name in tracking URLs"],
    ["gt", "boolean", false, "body", "Make tracking links comply with Google Ads Transparent Click Tracker"],
  ]],
  ["partner", "getProductFeedInfo", "GET", "/v3/partner/products/feedinfo/{programId}/{channelId}/", "query", "Information about the product feeds of an advertiser: product count, last update and download link.", [
    ["programId", "number", true, "path", "Numerical ID of a partner program"],
    ["channelId", "number", true, "path", "Numerical ID of a channel"],
  ]],
  // Partner: performance
  ["partner", "listClicks", "POST", "/v2/partner/clicks/", "query", "List clicks tracked in your account during a period.", [
    from,
    to,
    currency(true),
    programId,
    channelId,
    market(false),
    ["commissionOnly", "boolean", false, "body", "Only clicks with commission"],
    ["epi", "string", false, "body", "EPI from the tracking link"],
    ["epi2", "string", false, "body", "EPI2 from the tracking link"],
    ["epi3", "string", false, "body", "EPI3 from the tracking link"],
    ["epi4", "string", false, "body", "EPI4 from the tracking link"],
    ["epi5", "string", false, "body", "EPI5 from the tracking link"],
    ["gclid", "string", false, "body", "Google Click ID"],
    ["gbraid", "string", false, "body", "gbraid from the tracking link"],
    ["wbraid", "string", false, "body", "wbraid from the tracking link"],
  ]],
  ["partner", "listTransactions", "POST", "/v2/partner/transactions/", "query", "List transactions (commission-generating events) tracked in your account during a period.", [
    from,
    to,
    ["transactionStatus", "number", true, "body", TX_STATUS_ALL],
    ["lastUpdated", "string", false, "body", "Only transactions updated after this time"],
    ["epi", "string", false, "body", "EPI of the transaction"],
    market(false),
    currency(false),
    programId,
    channelId,
    ["paymentStatus", "number", false, "body", PAY_STATUS],
    ["uniqueId", "string", false, "body", "Unique ID of the transaction"],
  ]],
  ["partner", "listTransactionsWithGclid", "POST", "/v2/partner/transactions/gclid/", "query", "List transactions that carry a Google Click ID during a period.", [from, to, txStatus, programId, channelId]],
  ["partner", "listLatestTransactions", "GET", "/v2/partner/transactions/latest/{number}/", "query", "List the latest approved or pending transactions (default 10).", [
    ["number", "number", false, "path", "How many transactions to return"],
  ]],
  ["partner", "listTransactionsInPayment", "GET", "/v2/partner/transactions/payment/{paymentId}/", "query", "List the transactions included in a payment.", [
    ["paymentId", "number", true, "path", "Numerical ID of a payment"],
  ]],
  ["partner", "createClaim", "PUT", "/v2/partner/claims/", "mutation", "Create a claim for an untracked transaction. Get commissionId from listCommissionTypes.", [
    ["programId", "number", true, "body", "Numerical ID of a partner program"],
    ["channelId", "number", true, "body", "Numerical ID of a channel"],
    ["orderId", "string", true, "body", "Advertiser order ID"],
    ["commissionId", "number", true, "body", "Numerical ID of the commission"],
    ["transactionDate", "string", true, "body", "UTC timestamp of when the advertiser reported the transaction"],
    ["orderValue", "number", true, "body", "Order value"],
    ["currency", "string", true, "body", "ISO 4217 currency code"],
    ["expectedCommission", "number", false, "body", "Expected commission when categories earn different commission"],
    ["epi", "string", false, "body", "EPI value"],
    ["epi2", "string", false, "body", "EPI2 value"],
    ["epi3", "string", false, "body", "EPI3 value"],
    ["epi4", "string", false, "body", "EPI4 value"],
    ["epi5", "string", false, "body", "EPI5 value"],
  ]],
  partnerStats("getStatistics", "statistics", "Aggregated impressions, clicks, transactions and commission over a period."),
  partnerStats("getStatisticsByAd", "statistics/ads", "Statistics grouped by ad."),
  partnerStats("getStatisticsByChannel", "statistics/channels", "Statistics grouped by channel."),
  partnerStats("getStatisticsByDay", "statistics/days", "Statistics grouped by day."),
  partnerStats("getStatisticsByProgram", "statistics/programs", "Statistics grouped by program."),
  partnerStats("getStatisticsByEpi", "statistics/epi", "Statistics grouped by EPI values (epi is grouped by default).", [
    ["groupbyEpi", "boolean", false, "body", "Group by EPI (default true)"],
    ["groupbyEpi2", "boolean", false, "body", "Group by EPI2 (default false)"],
    ["groupbyEpi3", "boolean", false, "body", "Group by EPI3 (default false)"],
    ["groupbyEpi4", "boolean", false, "body", "Group by EPI4 (default false)"],
    ["groupbyEpi5", "boolean", false, "body", "Group by EPI5 (default false)"],
  ]),
  partnerCommission("getCommissionByType", "type", "Commission earned over a period, grouped by commission type.", true),
  partnerCommission("getCommissionByPaymentStatus", "paymentstatus", "Commission earned over a period, grouped by payment status.", false),
  partnerCommission("getCommissionByTransactionStatus", "transactionstatus", "Commission earned over a period, grouped by transaction status.", false),
  // Partner: money
  ["partner", "getAccountBalance", "GET", "/v2/partner/balance/{currency}/", "query", "Account balance in a currency.", [
    ["currency", "string", true, "path", "ISO 4217 currency code"],
  ]],
  ["partner", "listPayments", "GET", "/v2/partner/payments/{currency}/{paymentId}/", "query", "List payments generated in your account, optionally for one currency or payment.", [
    ["currency", "string", true, "path", "ISO 4217 currency code"],
    ["paymentId", "number", false, "path", "Numerical ID of a payment"],
  ]],
  ["partner", "listTrackingErrors", "POST", "/v2/partner/tracking/errors/", "query", "List tracking errors from the last seven days.", [channelId, programId]],
  // Advertiser
  ["advertiser", "getAccount", "GET", "/v2/advertiser/account/", "query", "Details about your Adtraction advertiser account.", []],
  ["advertiser", "listChannels", "POST", "/v3/client/channels/", "query", "List the channels (partner sites) that have applied to your program.", [
    channelId,
    ["affiliateId", "number", false, "body", "Numerical ID of a partner account"],
    ["approvalStatus", "number", false, "body", "Approval status: 0 = rejected, 1 = approved, 2 = pending review"],
  ]],
  ["advertiser", "updateChannelStatus", "PUT", "/v3/client/channels/", "mutation", "Approve (1) or reject (0) a channel in your program. Rejecting requires rejectReason.", [
    channelId,
    ["approvalStatus", "number", false, "body", "0 = rejected, 1 = approved"],
    ["rejectReason", "number", false, "body", "Required for rejection: 0 not enough content, 1 not relevant content, 2 closed site/group/account, 3 404 on site, 4 site does not exist, 5 wrong or shady contact details, 6 unethical content, 7 incorrect site owner, 8 missing channel info, 9 too few followers, 10 poor design, 11 irrelevant traffic, 12 outdated content"],
  ]],
  ["advertiser", "listClicks", "POST", "/v2/advertiser/clicks/", "query", "List clicks in your program during a period (clicks older than 14 months are unavailable).", [from, to, channelId]],
  ["advertiser", "listTransactions", "POST", "/v2/advertiser/transactions/", "query", "List transactions tracked for your program during a period.", [
    from,
    to,
    txStatus,
    ["orderId", "string", false, "body", "Advertiser order ID"],
    channelId,
    ["paymentStatus", "number", false, "body", PAY_STATUS],
    ["uniqueId", "string", false, "body", "Unique ID of a transaction"],
  ]],
  ["advertiser", "updateTransaction", "PUT", "/v2/advertiser/transactions/", "mutation", "Update the status or order value of a pending transaction or open claim. Allowed status changes: 2 to 1, 2 to 5, 4 to 1, 4 to 5.", [
    ["orderId", "string", true, "body", "Advertiser order ID"],
    ["transactionStatus", "number", false, "body", "1 = approved, 2 = pending, 4 = open claim, 5 = rejected"],
    ["orderValue", "number", false, "body", "New order value"],
    ["productCategoryData", "json", false, "body", "Per-category order values when product category tracking is used"],
  ]],
  ["advertiser", "listSegments", "GET", "/v2/advertiser/segments/", "query", "List the commission segments of your program and the channels in each.", []],
  ["advertiser", "addCoupon", "PUT", "/v2/advertiser/coupon/", "mutation", "Assign a unique coupon code to a channel for coupon-code tracking.", [
    ["code", "string", true, "body", "Unique coupon code"],
    ["channelId", "number", true, "body", "Numerical ID of a partner channel"],
    ["toDate", "string", true, "body", "Last date the code is valid, ISO 8601 date"],
    ["cookieTrack", "boolean", false, "body", "Keep cookie tracking active while the code is valid (default true)"],
  ]],
  advertiserStats("getStatistics", "/", "Aggregated statistics for your program over a period.", false),
  advertiserStats("getStatisticsByAd", "/ads/", "Statistics grouped by ad.", true),
  advertiserStats("getStatisticsByChannel", "/channels/", "Statistics grouped by channel.", false),
  advertiserStats("getStatisticsByDay", "/days/", "Statistics grouped by day.", true),
  advertiserStats("getStatisticsBySegment", "/segments/", "Statistics grouped by commission segment.", false),
];

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const schema: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "array" ? array(string()) : type === "json" ? json() : string();
    shape[name] = required ? schema : schema.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required, , doc]) => `- ${name} (${type}${required ? ", required" : ""}): ${doc}`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, template: string, fields: Field[], input: Record<string, unknown>) => {
    let path = template;
    // Optional path segments must be a contiguous prefix: a later segment set without an earlier one would hit the wrong route.
    let missing: string | undefined;
    for (const [name, , , where] of fields) {
      if (where !== "path") continue;
      if (input[name] === undefined) missing ??= name;
      else if (missing !== undefined) throw new Error(`${name} requires ${missing} to be set`);
    }
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (where === "path") {
        // Optional trailing path segments are dropped when omitted.
        path = path.replace(`{${name}}/`, value === undefined ? "" : `${encodeURIComponent(String(value))}/`).replace(`{${name}}`, value === undefined ? "" : encodeURIComponent(String(value)));
      } else if (value !== undefined && value !== null) {
        if (where === "query") search.set(name, String(value));
        else body[name] = value;
      }
    }
    const qs = search.size > 0 ? `?${search.toString()}` : "";
    const hasBody = method !== "GET";
    const response = await fetcher(`${base}${path.replace(/\/\/+$/, "/")}${qs}`, {
      method,
      signal,
      headers: {
        "X-Token": token,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    return decodeJson(response, json());
  };

  const groups = new Map<string, Map<string, unknown>>();
  for (const [group, action, method, path, kind, description, fields] of rows) {
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = kind === "mutation" ? mutation(options, handler as never) : query(options, handler as never);
    const tools = groups.get(group) ?? new Map<string, unknown>();
    tools.set(action, tool);
    groups.set(group, tools);
  }
  const titles: Record<string, { title: string; description: string }> = {
    partner: {
      title: "Partner (publisher)",
      description: "Tools for partner (affiliate) tokens: programs, tracking links, products, clicks, transactions, statistics, commissions and payments.",
    },
    advertiser: {
      title: "Advertiser",
      description: "Tools for advertiser tokens: your program's channels, clicks, transactions, segments, coupons and statistics.",
    },
  };
  return router(
    Object.fromEntries(
      [...groups].map(([name, tools]) => [name, router(Object.fromEntries(tools) as never, titles[name])]),
    ) as never,
  );
}

export default defineApp(
  { user: { accounts: { adtraction: adtraction.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.adtraction ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Adtraction",
        description:
          "Adtraction affiliate network: partner programs, tracking links, product search and feeds, clicks, transactions, statistics, commissions and payments, plus advertiser-side channel approval, transactions and statistics.",
        icons,
        instructions:
          "Adtraction API tokens are either partner (publisher) or advertiser tokens; use the matching group (partner or advertiser). Dates are ISO 8601 in UTC. Statistics and listings are POST requests that only read data.",
      },
    ),
  }),
);
