import {
  accountRouter,
  array,
  bearer,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  record,
  router,
  type Schema,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Odoo Online and Odoo.sh databases live on their own host: https://<name>.odoo.com.
const instanceUrl = (instance: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(\.odoo\.(?:com|sh))?\/?$/.exec(
    instance.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <name> of <name>.odoo.com (or the full <name>.odoo.com / <name>.odoo.sh host).");
  return `https://${match[1]}${match[2] ?? ".odoo.com"}`;
};

const odoo = defineProvider({
  name: "Odoo",
  hosts: ["*.odoo.com", "*.odoo.sh"],
  auth: {
    // The JSON-2 API (Odoo 19+) takes the user's API key as a bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        database: plain(string()),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => bearer(token),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = instanceUrl(account.fields.instance);
    const response = await fetch(account.url(`${base}/json/2/res.users/context_get`), {
      method: "POST",
      signal,
      headers: databaseHeaders(account.headers(), account.fields.database),
      body: "{}",
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(base).hostname, username: new URL(base).hostname, profileUrl: base } };
  },
});

const databaseHeaders = (auth: Record<string, string>, database: string) => ({
  ...auth,
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  ...(database.trim() === "" ? {} : { "X-Odoo-Database": database.trim() }),
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

const safe = /^[A-Za-z_][A-Za-z0-9_.]*$/;
const name = (value: unknown, label: string) => {
  const text = String(value);
  if (!safe.test(text)) throw new Error(`${label} must contain only letters, digits, "_" and ".".`);
  return text;
};

function client(base: string, database: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (model: string, method: string, body: Params = {}) => {
    const response = await fetcher(`${base}/json/2/${name(model, "model")}/${name(method, "method")}`, {
      method: "POST",
      signal,
      headers: databaseHeaders({}, database),
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema<any, boolean>;
const q = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  query({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));
const m = (description: string, input: AnySchema, run: (input: Params) => Promise<unknown>) =>
  mutation({ description, input: input as Schema<Params, boolean> }, async (_ctx, value: Params) => run(value));

const ids = array(number());
const values = record(json());
const domainHelp =
  'domain is an Odoo search domain: a list of [field, operator, value] triples, e.g. [["is_company","=",true],["name","ilike","deco"]]; prefix operators "|", "&" and "!" combine them. Omit for all records.';
const contextField = record(json()).optional();
const withContext = (i: Params, extra: Params = {}): Params => ({
  ...extra,
  ...(i.context === undefined ? {} : { context: i.context }),
});

const listShape = {
  domain: array(json()).optional(),
  fields: array(string()).optional(),
  limit: number().optional(),
  offset: number().optional(),
  order: string().optional(),
  context: contextField,
};
const listBody = (i: Params): Params =>
  withContext(i, {
    domain: i.domain ?? [],
    ...(i.fields === undefined ? {} : { fields: i.fields }),
    limit: i.limit ?? 80,
    ...(i.offset === undefined ? {} : { offset: i.offset }),
    ...(i.order === undefined ? {} : { order: i.order }),
  });

// CRUD tools over one fixed model.
function modelTools(c: Client, model: string, noun: string, plural: string, opts: { remove?: boolean; write?: boolean } = {}) {
  return router(
    {
      list: q(`List ${plural} (model ${model}). ${domainHelp} limit defaults to 80; page with offset. fields limits the returned columns.`, object(listShape), (i) =>
        c.call(model, "search_read", listBody(i)),
      ),
      count: q(`Count ${plural} matching a domain.`, object({ domain: array(json()).optional(), context: contextField }), (i) =>
        c.call(model, "search_count", withContext(i, { domain: i.domain ?? [] })),
      ),
      get: q(`Read ${plural} by id.`, object({ ids, fields: array(string()).optional(), context: contextField }), (i) =>
        c.call(model, "read", withContext(i, { ids: i.ids, ...(i.fields === undefined ? {} : { fields: i.fields }) })),
      ),
      ...(opts.write === false
        ? {}
        : {
            create: m(`Create a ${noun}. values maps field names to values; returns the new ids.`, object({ values, context: contextField }), (i) =>
              c.call(model, "create", withContext(i, { vals_list: [i.values] })),
            ),
            update: m(`Update ${plural}; only the fields in values change.`, object({ ids, values, context: contextField }), (i) =>
              c.call(model, "write", withContext(i, { ids: i.ids, vals: i.values })),
            ),
          }),
      ...(opts.remove === true
        ? {
            delete: m(`Delete ${plural} by id.`, object({ ids, context: contextField }), (i) =>
              c.call(model, "unlink", withContext(i, { ids: i.ids })),
            ),
          }
        : {}),
    },
    { title: plural[0]!.toUpperCase() + plural.slice(1), description: `${plural} in the ${model} model.` },
  );
}

// A named workflow button or method on a fixed model, run on records by id.
const action = (c: Client, model: string, method: string, description: string) =>
  m(description, object({ ids, context: contextField }), (i) => c.call(model, method, withContext(i, { ids: i.ids })));

function build(c: Client) {
  const rpc = (i: Params) => c.call(String(i.model), String(i.method), withContext(i, (i.arguments as Params | undefined) ?? {}));
  return router({
    records: router(
      {
        list: q(
          `Search any model and return field values (search_read). ${domainHelp}`,
          object({ model: string({ minLength: 1 }), ...listShape }),
          (i) => c.call(String(i.model), "search_read", listBody(i)),
        ),
        search: q(
          "Search any model and return only the matching ids.",
          object({ model: string({ minLength: 1 }), domain: array(json()).optional(), limit: number().optional(), offset: number().optional(), order: string().optional(), context: contextField }),
          (i) =>
            c.call(String(i.model), "search", withContext(i, {
              domain: i.domain ?? [],
              limit: i.limit ?? 80,
              ...(i.offset === undefined ? {} : { offset: i.offset }),
              ...(i.order === undefined ? {} : { order: i.order }),
            })),
        ),
        count: q(
          "Count records of any model matching a domain.",
          object({ model: string({ minLength: 1 }), domain: array(json()).optional(), context: contextField }),
          (i) => c.call(String(i.model), "search_count", withContext(i, { domain: i.domain ?? [] })),
        ),
        get: q(
          "Read records of any model by id.",
          object({ model: string({ minLength: 1 }), ids, fields: array(string()).optional(), context: contextField }),
          (i) => c.call(String(i.model), "read", withContext(i, { ids: i.ids, ...(i.fields === undefined ? {} : { fields: i.fields }) })),
        ),
        group: q(
          "Aggregate any model: group records by fields and compute aggregates (form_read_group). groupby entries look like \"stage_id\" or \"create_date:month\"; aggregates look like \"__count\" or \"expected_revenue:sum\".",
          object({
            model: string({ minLength: 1 }),
            domain: array(json()).optional(),
            groupby: array(string()),
            aggregates: array(string()).optional(),
            limit: number().optional(),
            order: string().optional(),
            context: contextField,
          }),
          (i) =>
            c.call(String(i.model), "formatted_read_group", withContext(i, {
              domain: i.domain ?? [],
              groupby: i.groupby,
              aggregates: i.aggregates ?? ["__count"],
              ...(i.limit === undefined ? {} : { limit: i.limit }),
              ...(i.order === undefined ? {} : { order: i.order }),
            })),
        ),
        nameSearch: q(
          "Find records of any model by display name (name_search); returns [id, name] pairs.",
          object({ model: string({ minLength: 1 }), name: string(), domain: array(json()).optional(), limit: number().optional(), context: contextField }),
          (i) =>
            c.call(String(i.model), "name_search", withContext(i, { name: i.name, domain: i.domain ?? [], limit: i.limit ?? 8 })),
        ),
        create: m(
          "Create a record of any model. values maps field names to values; returns the new ids.",
          object({ model: string({ minLength: 1 }), values, context: contextField }),
          (i) => c.call(String(i.model), "create", withContext(i, { vals_list: [i.values] })),
        ),
        update: m(
          "Update records of any model; only the fields in values change.",
          object({ model: string({ minLength: 1 }), ids, values, context: contextField }),
          (i) => c.call(String(i.model), "write", withContext(i, { ids: i.ids, vals: i.values })),
        ),
        delete: m(
          "Delete records of any model by id.",
          object({ model: string({ minLength: 1 }), ids, context: contextField }),
          (i) => c.call(String(i.model), "unlink", withContext(i, { ids: i.ids })),
        ),
        call: m(
          "Call any public method of any model (JSON-2 API: POST /json/2/<model>/<method>). Pass ids for record methods (empty for model methods) and the method's named parameters in arguments. Always asks first.",
          object({ model: string({ minLength: 1 }), method: string({ minLength: 1 }), ids: ids.optional(), arguments: record(json()).optional(), context: contextField }),
          (i) => c.call(String(i.model), String(i.method), withContext(i, { ...((i.arguments as Params | undefined) ?? {}), ...(i.ids === undefined ? {} : { ids: i.ids }) })),
        ),
      },
      { title: "Records", description: "Search, read, write and call methods on any Odoo model." },
    ),
    models: router(
      {
        list: q(
          "List the models installed in the database (ir.model): technical name, label and whether they are transient. domain filters, e.g. [[\"model\",\"ilike\",\"sale\"]].",
          object({ domain: array(json()).optional(), limit: number().optional(), offset: number().optional() }),
          (i) =>
            c.call("ir.model", "search_read", {
              domain: i.domain ?? [],
              fields: ["model", "name", "transient"],
              limit: i.limit ?? 100,
              ...(i.offset === undefined ? {} : { offset: i.offset }),
              order: "model",
            }),
        ),
        fields: q(
          "Describe the fields of a model (fields_get): type, label, required, readonly, relation and selection values. attributes limits what is returned per field.",
          object({ model: string({ minLength: 1 }), fields: array(string()).optional(), attributes: array(string()).optional() }),
          (i) =>
            c.call(String(i.model), "fields_get", {
              ...(i.fields === undefined ? {} : { allfields: i.fields }),
              attributes: i.attributes ?? ["string", "type", "required", "readonly", "relation", "selection"],
            }),
        ),
      },
      { title: "Models", description: "Discover the models and fields of the database." },
    ),
    whoami: q("Return the context of the API user: language, timezone and user id.", object({}), () =>
      c.call("res.users", "context_get"),
    ),
    contacts: modelTools(c, "res.partner", "contact", "contacts", { remove: true }),
    users: modelTools(c, "res.users", "user", "users", { write: false }),
    companies: modelTools(c, "res.company", "company", "companies", { write: false }),
    leads: modelTools(c, "crm.lead", "lead or opportunity", "leads and opportunities", { remove: true }),
    products: modelTools(c, "product.product", "product variant", "product variants"),
    productTemplates: modelTools(c, "product.template", "product template", "product templates", { remove: true }),
    saleOrders: modelTools(c, "sale.order", "sales order or quotation", "sales orders and quotations", { remove: true }),
    saleOrderLines: modelTools(c, "sale.order.line", "sales order line", "sales order lines", { remove: true }),
    purchaseOrders: modelTools(c, "purchase.order", "purchase order", "purchase orders", { remove: true }),
    invoices: modelTools(c, "account.move", "journal entry, invoice or bill", "journal entries, invoices and bills"),
    payments: modelTools(c, "account.payment", "payment", "payments"),
    stockPickings: modelTools(c, "stock.picking", "transfer", "stock transfers"),
    stockQuants: modelTools(c, "stock.quant", "stock quantity", "stock quantities", { write: false }),
    projects: modelTools(c, "project.project", "project", "projects", { remove: true }),
    tasks: modelTools(c, "project.task", "task", "tasks", { remove: true }),
    employees: modelTools(c, "hr.employee", "employee", "employees"),
    calendarEvents: modelTools(c, "calendar.event", "calendar event", "calendar events", { remove: true }),
    helpdeskTickets: modelTools(c, "helpdesk.ticket", "helpdesk ticket", "helpdesk tickets (Enterprise Helpdesk app)"),
    workflow: router(
      {
        confirmSaleOrder: action(c, "sale.order", "action_confirm", "Confirm quotations so they become sales orders."),
        cancelSaleOrder: action(c, "sale.order", "action_cancel", "Cancel sales orders or quotations."),
        confirmPurchaseOrder: action(c, "purchase.order", "button_confirm", "Confirm requests for quotation so they become purchase orders."),
        postInvoice: action(c, "account.move", "action_post", "Post draft invoices, bills or journal entries."),
        resetInvoiceToDraft: action(c, "account.move", "button_draft", "Reset posted invoices or entries to draft."),
        cancelInvoice: action(c, "account.move", "button_cancel", "Cancel invoices or entries."),
        markLeadWon: action(c, "crm.lead", "action_set_won", "Mark opportunities as won."),
        markLeadLost: m(
          "Mark opportunities as lost, optionally with a lost reason id (crm.lost.reason).",
          object({ ids, lostReasonId: number().optional(), feedback: string().optional(), context: contextField }),
          (i) =>
            c.call("crm.lead", "action_set_lost", withContext(i, {
              ids: i.ids,
              ...(i.lostReasonId === undefined ? {} : { lost_reason_id: i.lostReasonId }),
              ...(i.feedback === undefined ? {} : { lost_feedback: i.feedback }),
            })),
        ),
        validateTransfer: action(c, "stock.picking", "button_validate", "Validate stock transfers (receipts, deliveries)."),
        postMessage: m(
          "Post a message in the chatter of a record of any model (message_post). Set subtype to \"mail.mt_note\" for an internal note or \"mail.mt_comment\" to notify followers.",
          object({
            model: string({ minLength: 1 }),
            id: number(),
            body: string({ minLength: 1 }),
            subtype: string().optional(),
            partnerIds: ids.optional(),
            context: contextField,
          }),
          (i) =>
            c.call(String(i.model), "message_post", withContext(i, {
              ids: [i.id],
              body: i.body,
              message_type: "comment",
              subtype_xmlid: i.subtype ?? "mail.mt_note",
              ...(i.partnerIds === undefined ? {} : { partner_ids: i.partnerIds }),
            })),
        ),
        messages: q(
          "List chatter messages of a record (mail.message).",
          object({ model: string({ minLength: 1 }), id: number(), limit: number().optional() }),
          (i) =>
            c.call("mail.message", "search_read", {
              domain: [["model", "=", String(i.model)], ["res_id", "=", i.id]],
              fields: ["date", "author_id", "message_type", "subtype_id", "body"],
              order: "id desc",
              limit: i.limit ?? 30,
            }),
        ),
      },
      { title: "Workflow", description: "Confirm, post, win/lose and validate records, and use the chatter." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { odoo: odoo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.odoo ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            build(client(instanceUrl(account.fields.instance), account.fields.database, signed, signal)),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Odoo",
        description:
          "Contacts, CRM leads, sales and purchase orders, invoices, products, stock, projects, tasks, employees and any model of an Odoo database.",
        icons,
      },
    ),
  }),
);
