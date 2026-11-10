import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.dripcel.com";

const dripcel = defineProvider({
  name: "Dripcel",
  hosts: ["api.dripcel.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Every Dripcel response is { ok, data }; /balance needs no permission beyond the key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/balance`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ ok: boolean() }));
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof globalThis.fetch;

// Calls the API and unwraps the { ok, data } envelope; a failure status rejects.
async function call(
  fetch: Fetch,
  account: Account,
  method: string,
  path: string,
  options: { query?: Record<string, string | undefined>; body?: unknown } = {},
): Promise<unknown> {
  const url = new URL(base + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${account.fields.token}`,
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const body = await decodeJson(response, object({ ok: boolean(), data: json().optional() }));
  return body.data ?? null;
}

const cell = string({ minLength: 1 });
const ids = array(string());
const Body = record(json());

function tools(account: Account) {
  return router({
    balance: query(
      { description: "Get the organisation's credit balance (a number).", input: object({}) },
      async ({ fetch }) => call(fetch, account, "GET", "/balance"),
    ),
    campaigns: router({
      list: query(
        { description: "List all campaigns.", input: object({}) },
        async ({ fetch }) => call(fetch, account, "GET", "/campaigns"),
      ),
      get: query(
        { description: "Get one campaign by _id.", input: object({ campaign_id: string() }) },
        async ({ fetch }, { campaign_id }) => call(fetch, account, "GET", `/campaigns/${encodeURIComponent(campaign_id)}`),
      ),
      listV2: query(
        { description: "List all Campaigns V2 (the newer, nested campaign model).", input: object({}) },
        async ({ fetch }) => call(fetch, account, "GET", "/campaigns/v2"),
      ),
      getV2: query(
        { description: "Get one Campaigns V2 campaign by _id.", input: object({ campaign_id: string() }) },
        async ({ fetch }, { campaign_id }) =>
          call(fetch, account, "GET", `/campaigns/v2/${encodeURIComponent(campaign_id)}`),
      ),
    }),
    compliance: router({
      checkSend: query(
        {
          description:
            "Check which cell numbers may be sent to, against a campaign's targeting (or global opt-outs when no campaign_id). Paid: 0.14 credits per cell.",
          input: object({ cells: array(cell), country: string(), campaign_id: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, { campaign_id, ...body }) =>
          call(fetch, account, "POST", "/compliance/send", { query: { campaign_id }, body }),
      ),
    }),
    contacts: router({
      get: query(
        { description: "Get a contact by cell number (MSISDN).", input: object({ cell }) },
        async ({ fetch }, { cell }) => call(fetch, account, "GET", `/contacts/${encodeURIComponent(cell)}`),
      ),
      search: query(
        {
          description:
            "Search contacts with a MongoDB-style body: { find: { cell?: string[], tag_ids?: { $in?, $all? }, updatedAt?: { $gte?, $lte? } }, projection?: { field: 1 }, options?: { skip?, limit? } }. Paid: 10 credits per request.",
          input: Body,
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/contacts/search", { body }),
      ),
      create: mutation(
        {
          description:
            "Upload new contacts (POST /contacts; creates only, up to 100,000). Body: { contacts: [{ cell, firstname?, c1?, tag_ids?, tags? ... }], country?: 'ZA'|'NA', tag_ids?, send? }.",
          input: object({
            contacts: array(Body),
            country: string().optional(),
            tag_ids: ids.optional(),
            send: Body.optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/contacts", { body }),
      ),
      upsert: mutation(
        {
          description:
            "Create or update contacts (PUT /contacts; up to 20,000, slower than create). Same body as create.",
          input: object({
            contacts: array(Body),
            country: string().optional(),
            tag_ids: ids.optional(),
            send: Body.optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "PUT", "/contacts", { body }),
      ),
      bulkUpdate: mutation(
        {
          description:
            "Bulk update contacts: { find: { cell?: string[], tag_ids?: { $in?, $all? } }, update: { $addToSet?: { tag_ids?: { $each }, deduped_campaign_ids?: { $each } } } or { $pull?: { tag_ids?: { $in } } } } (one operator per request). Heavily rate limited.",
          input: object({ find: Body, update: Body }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/contacts/update", { body }),
      ),
      delete: mutation(
        { description: "Delete a contact by cell number.", input: object({ cell }), approval: always() },
        async ({ fetch }, { cell }) => call(fetch, account, "DELETE", `/contacts/${encodeURIComponent(cell)}`),
      ),
      optOut: mutation(
        {
          description: "Opt a contact out of given campaigns, or of all campaigns with all: true.",
          input: object({
            cell,
            campaign_ids: ids.optional(),
            all: boolean().optional(),
            create_missing_contact: boolean().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { cell, ...body }) =>
          call(fetch, account, "POST", `/contacts/${encodeURIComponent(cell)}/optOut`, { body }),
      ),
      addTags: mutation(
        {
          description: "Add tags to a contact by tag_ids or tag names.",
          input: object({
            cell,
            tag_ids: ids.optional(),
            tags: array(string()).optional(),
            create_missing_contact: boolean().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { cell, ...body }) =>
          call(fetch, account, "PUT", `/contacts/${encodeURIComponent(cell)}/tag/add`, { body }),
      ),
      removeTags: mutation(
        {
          description: "Remove tags from a contact by tag_ids or tag names.",
          input: object({ cell, tag_ids: ids.optional(), tags: array(string()).optional() }),
          approval: always(),
        },
        async ({ fetch }, { cell, ...body }) =>
          call(fetch, account, "PUT", `/contacts/${encodeURIComponent(cell)}/tag/remove`, { body }),
      ),
    }),
    deliveries: router({
      list: query(
        {
          description: "List deliveries for a cell number or for one send's customerId. At least one is required.",
          input: object({ cell: string().optional(), customerId: string().optional() }),
        },
        async ({ fetch }, input) => call(fetch, account, "GET", "/deliveries", { query: input }),
      ),
    }),
    emailTemplates: router({
      list: query(
        { description: "List email templates.", input: object({}) },
        async ({ fetch }) => call(fetch, account, "GET", "/email/templates"),
      ),
    }),
    exchange: router({
      submitTransactions: mutation(
        {
          description:
            "Buyer: confirm leads received against a marketplace offer (POST /exchange/buyer/transaction). Each lead creates a transaction that credits the seller. 1-1000 items: [{ resource_id (your unique id), cell, exactly one of campaign_id | send_id | click_id, status?: 'completed'|'pending'|'rejected' }]. Duplicates within 7 days are forced to rejected; reached offer caps hold 'completed' as pending.",
          input: object({ transactions: array(Body) }),
          approval: always(),
        },
        async ({ fetch }, { transactions }) =>
          call(fetch, account, "POST", "/exchange/buyer/transaction", { body: transactions }),
      ),
      setTransactionStatus: mutation(
        {
          description: "Buyer: accept ('completed') or reject ('rejected') a pending exchange transaction by id.",
          input: object({ id: string(), status: string() }),
          approval: always(),
        },
        async ({ fetch }, { id, status }) =>
          call(fetch, account, "PUT", `/exchange/buyer/transaction/${encodeURIComponent(id)}/status`, {
            body: { status },
          }),
      ),
      searchTransactions: query(
        {
          description:
            "Buyer: search exchange transactions. All fields optional: { _id?: string|string[], status?: 'pending'|'completed'|'rejected', offer_id?: string|string[], createdAt?: { $gte?, $lte? } (ISO dates) }.",
          input: Body,
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/exchange/buyer/transaction/search", { body }),
      ),
    }),
    replies: router({
      search: query(
        {
          description:
            "Search replies. Filters (each optional; string fields also take string[]): _id, Message, kind (optIn|optOut|unknown), Msisdn, campaign_id, UserReference, Received { $gte, $lte }.",
          input: Body,
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/replies/search", { body }),
      ),
    }),
    sales: router({
      upload: mutation(
        {
          description:
            "Upload sales: [{ campaign_id, cell, send_id?, click_id?, soldAt?: 'YYYY-MM-DD', saleValue? }]. Use international cell format for Campaigns V2.",
          input: object({ sales: array(Body) }),
          approval: always(),
        },
        async ({ fetch }, { sales }) => call(fetch, account, "POST", "/sales", { body: sales }),
      ),
    }),
    send: router({
      sms: mutation(
        {
          description: "Send a single SMS. deliveryMethod must be exactly one of 'reverse', 'standard' or 'transactional' (the apps schema library has no enum type, so this is not validated client-side).",
          input: object({
            content: string(),
            cell,
            skipNonContacts: boolean(),
            country: string(),
            deliveryMethod: string(),
            campaign_id: string().optional(),
            sendOptions: Body.optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/send/sms", { body }),
      ),
      email: mutation(
        {
          description:
            "Send one of a campaign's email templates to a single existing contact. template is { kind: 'manual', data: { template_id } }, { kind: 'random', data: {} } or { kind: 'best', data: {} }.",
          input: object({
            campaign_id: string(),
            email: string(),
            from: string(),
            from_name: string().optional(),
            template: Body.optional(),
            to_start_at: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/send/email", { body }),
      ),
      bulkEmail: mutation(
        {
          description: "Send an email template to many addresses.",
          input: object({
            from: string(),
            template_id: string(),
            destinations: array(string()),
            filter_non_contacts: boolean().optional(),
            to_start_at: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/send/email/bulk", { body }),
      ),
    }),
    sendLogs: router({
      get: query(
        {
          description: "Get one send log by send _id. group_destinations is count or list.",
          input: object({ send_id: string(), group_destinations: string().optional() }),
        },
        async ({ fetch }, { send_id, group_destinations }) =>
          call(fetch, account, "GET", `/send-logs/${encodeURIComponent(send_id)}`, { query: { group_destinations } }),
      ),
      search: query(
        {
          description:
            "Search send logs: { find?: { campaign_id?: string[], startDeliveryAt?: { $gte?, $lte? } }, options?: { skip?, limit? } }.",
          input: Body,
        },
        async ({ fetch }, body) => call(fetch, account, "POST", "/send-logs/search", { body }),
      ),
    }),
    tags: router({
      list: query(
        { description: "List all tags.", input: object({}) },
        async ({ fetch }) => call(fetch, account, "GET", "/tags"),
      ),
      get: query(
        { description: "Get one tag by _id.", input: object({ tag_id: string() }) },
        async ({ fetch }, { tag_id }) => call(fetch, account, "GET", `/tags/${encodeURIComponent(tag_id)}`),
      ),
      delete: mutation(
        {
          description: "Delete a tag by _id; it is also removed from every contact and campaign that has it.",
          input: object({ tag_id: string() }),
          approval: always(),
        },
        async ({ fetch }, { tag_id }) => call(fetch, account, "DELETE", `/tags/${encodeURIComponent(tag_id)}`),
      ),
    }),
  });
}

export default defineApp({ user: { accounts: { dripcel: dripcel.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.dripcel ?? [], tools, { signal }), {
    title: "Dripcel",
    description: "SMS and email marketing: contacts, tags, campaigns, sends, replies, deliveries, sales and compliance checks.",
    icons,
  }),
}));
