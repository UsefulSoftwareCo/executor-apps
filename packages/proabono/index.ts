import {
  accountRouter,
  base64,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// ProAbono gives every account its own API endpoint (for example https://api-42.proabono.com),
// shown in the BackOffice under Integration > API. Calls are authenticated with HTTP Basic:
// the Agent key is the username and the API key the password.
const normalize = (endpoint: string) => {
  const value = endpoint.trim().replace(/\/+$/, "");
  if (!value.startsWith("https://")) throw new Error("The ProAbono endpoint must be an https:// URL, for example https://api-42.proabono.com");
  return value;
};

const proabono = defineProvider({
  name: "ProAbono",
  hosts: ["*.proabono.com"],
  auth: {
    apiKeys: secrets({
      label: "Agent key and API key",
      fields: object({
        endpoint: plain(string({ minLength: 1 })),
        agentKey: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ agentKey, apiKey }) => header("authorization", t`Basic ${base64(t`${agentKey}:${apiKey}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${normalize(account.fields.endpoint)}/v1/Customers?SizePage=1`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    // An account with no customers answers 204 with an empty body, which is still a valid connection.
    if (response.status !== 204) await decodeJson(response, object({ Items: json() }));
    return { accountInfo: { externalId: account.fields.agentKey, displayName: account.fields.endpoint } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string, required = false): Field => [name, "number", required, "query"];
const b = (name: string): Field => [name, "boolean", false, "query"];

const paging = [n("Page"), n("SizePage")];
const createFlags = [b("EnsureBillable"), b("TryStart"), b("BillNow"), b("Migration")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean | "required",
];

const body = "body is the JSON request document exactly as ProAbono documents it (https://doc-api.proabono.com/).";
const listNote = "Returns Page, SizePage, Count, TotalItems and Items; use Page and SizePage to move through results. Returns null when there are no results (204).";

const rows: Row[] = [
  // Customers
  ["customers", "list", "GET", "/v1/Customers", `List customers, optionally by segment or by a feature in an active subscription. ${listNote}`, [s("ReferenceSegment"), s("ReferenceFeature"), ...paging]],
  ["customers", "get", "GET", "/v1/Customer", "Retrieve a customer by ReferenceCustomer.", [s("ReferenceCustomer", true)]],
  ["customers", "createOrUpdate", "POST", "/v1/Customer", `Create a customer, or update the one with the same ReferenceCustomer. ${body} Typical fields: ReferenceCustomer, Email, Name, Language, ReferenceSegment.`, [], "required"],
  ["customers", "getBillingAddress", "GET", "/v1/CustomerBillingAddress", "Retrieve a customer's billing address.", [s("ReferenceCustomer", true)]],
  ["customers", "setBillingAddress", "POST", "/v1/CustomerBillingAddress", `Set a customer's billing address. ${body}`, [s("ReferenceCustomer", true)], true],
  ["customers", "getPaymentSettings", "GET", "/v1/CustomerSettingsPayment", "Retrieve a customer's payment settings.", [s("ReferenceCustomer", true)]],
  ["customers", "setPaymentSettings", "POST", "/v1/CustomerSettingsPayment", `Set a customer's payment settings. ${body}`, [s("ReferenceCustomer", true)], true],
  ["customers", "anonymize", "POST", "/v1/Customer/Anonymization", "Anonymize a customer's personal data (irreversible).", [s("ReferenceCustomer", true)]],
  ["customers", "revokeLinks", "POST", "/v1/Customer/LinksRevokation", "Revoke the in-site links issued for a customer.", [s("ReferenceCustomer", true)]],
  ["customers", "invalidate", "POST", "/v1/Customer/Invalidation", "Invalidate a customer.", [s("ReferenceCustomer", true)]],
  ["customers", "suspend", "POST", "/v1/Customer/Suspension", "Suspend a customer.", [s("ReferenceCustomer", true)]],

  // Usages
  ["usages", "list", "GET", "/v1/Usages", "List the features and quantities used by a customer or a subscription, or the usage of one feature (ReferenceFeature).", [s("ReferenceCustomer"), n("IdCustomer"), n("IdSubscription"), s("ReferenceFeature")]],
  ["usages", "get", "GET", "/v1/Usage", "Retrieve the usage of one feature for a customer.", [s("ReferenceFeature", true), s("ReferenceCustomer", true)]],
  ["usages", "record", "POST", "/v1/Usage", `Record the usage of a feature. Body: ReferenceFeature, ReferenceCustomer (or IdSubscription) and QuantityCurrent (or Increment / IsEnabled as the feature requires) and DateStamp (required: it is the idempotency key). EnsureBillable defaults to true. ${body}`, [b("EnsureBillable")], true],
  ["usages", "recordMany", "POST", "/v1/Usages", `Record several usages at once. body is a JSON array of usage documents as for usages.record. ${body}`, [], true],

  // Offers and features
  ["offers", "list", "GET", "/v1/Offers", `List offers, optionally for a customer (ReferenceCustomer), as upgrades (Upgrade) or for a subscription (IdSubscription). ${listNote}`, [s("ReferenceSegment"), s("ReferenceCustomer"), b("Upgrade"), n("IdSubscription"), b("IsVisible"), s("PrefixReferenceOffer"), s("ReferencePricingTable"), b("IgnoreFeatures"), s("Language"), b("Html"), b("Links"), ...paging]],
  ["offers", "get", "GET", "/v1/Offer", "Retrieve an offer by ReferenceOffer, optionally priced for a customer, upgrade or subscription.", [s("ReferenceOffer", true), s("ReferenceCustomer"), b("Upgrade"), n("IdSubscription"), b("IgnoreFeatures"), s("Language")]],
  ["features", "list", "GET", "/v1/Features", `List features. ${listNote}`, [s("ReferenceSegment"), s("ReferenceCustomer"), s("Language"), b("IsVisible"), ...paging]],
  ["features", "get", "GET", "/v1/Feature", "Retrieve a feature by ReferenceFeature.", [s("ReferenceFeature", true), s("ReferenceSegment"), s("ReferenceCustomer"), s("Language")]],

  // Subscriptions
  ["subscriptions", "list", "GET", "/v1/Subscriptions", `List subscriptions, optionally of one customer, buyer or segment. ${listNote}`, [s("ReferenceSegment"), s("ReferenceCustomer"), s("ReferenceCustomerBuyer"), b("IgnoreFeatures"), ...paging]],
  ["subscriptions", "get", "GET", "/v1/Subscription/{IdSubscription}", "Retrieve a subscription by id.", [b("IgnoreFeatures"), s("ReferenceOffer")], false],
  ["subscriptions", "getForCustomer", "GET", "/v1/Subscription", "Retrieve a customer's latest active subscription (204 when there is none).", [s("ReferenceCustomer", true), b("IgnoreFeatures"), s("ReferenceOffer")]],
  ["subscriptions", "create", "POST", "/v1/Subscription", `Create a subscription. Body: ReferenceCustomer, ReferenceOffer and optional Metadata. Query flags EnsureBillable, TryStart and BillNow; Migration applies to the override form. ${body}`, createFlags, "required"],
  ["subscriptions", "setTerm", "POST", "/v1/Subscription/{IdSubscription}/DateTerm", "Set the term date of a subscription. Body: { DateTerm }.", [], true],
  ["subscriptions", "suspend", "POST", "/v1/Subscription/{IdSubscription}/Suspension", "Suspend a subscription.", []],
  ["subscriptions", "start", "POST", "/v1/Subscription/{IdSubscription}/Start", "Start a subscription. BillNow bills immediately.", [b("EnsureBillable"), b("BillNow")]],
  ["subscriptions", "upgrade", "POST", "/v1/Subscription/{IdSubscription}/Upgrade", "Move a subscription to another offer. Immediate defaults to true (false defers to the end of the term); BillNow bills immediately; IgnoreEngagement skips the engagement period.", [s("ReferenceOffer", true), b("BillNow"), b("Immediate"), b("IgnoreEngagement")]],
  ["subscriptions", "terminate", "POST", "/v1/Subscription/{IdSubscription}/Termination", "Terminate a subscription; set Immediate to end it now instead of at the end of the term.", [b("Immediate")]],

  // Pricing simulations
  ["pricing", "subscription", "POST", "/v1/Pricing/Subscription", `Simulate the price of a subscription without creating it (also accepts the create/override flags). ${body}`, [b("Html"), ...createFlags], "required"],
  ["pricing", "startSubscription", "POST", "/v1/Pricing/Subscription/{IdSubscription}/Start", "Simulate the price of starting a subscription.", [b("Html")]],
  ["pricing", "upgradeSubscription", "POST", "/v1/Pricing/Subscription/{IdSubscription}/Upgrade", "Simulate the price of upgrading a subscription.", [s("ReferenceOffer", true), b("Html")]],
  ["pricing", "usage", "POST", "/v1/Pricing/Usage", `Simulate the price of a usage without recording it. ${body}`, [b("Html"), b("NextTerm"), b("EnsureBillable")], "required"],
  ["pricing", "balanceLine", "POST", "/v1/Pricing/BalanceLine", `Simulate the price of a balance line. ${body}`, [b("Html")], "required"],

  // Billing
  ["balanceLines", "create", "POST", "/v1/BalanceLine", `Add a balance line (a one-off charge or credit) to a customer. EnsureBillable defaults to true. ${body}`, [b("EnsureBillable")], "required"],
  ["balanceLines", "list", "GET", "/v1/BalanceLines", "List a customer's pending balance lines and computed totals (SizePage=0 returns totals only). Returns null when there are none.", [s("ReferenceCustomer", true), s("ReferenceFeature"), n("IdSegment"), n("IdFeature"), n("IdSubscription"), ...paging]],
  ["billing", "billCustomer", "POST", "/v1/Billing/Customer", `Bill a customer now. ${body}`, [], "required"],
  ["invoices", "get", "GET", "/v1/Invoice/{IdInvoice}", "Retrieve an invoice by id.", []],
  ["invoices", "getByNumber", "GET", "/v1/Invoice", "Retrieve an invoice by its FullNumber.", [s("FullNumber", true)]],
  ["invoices", "list", "GET", "/v1/Invoices", `List invoices of a customer or subscription. ${listNote}`, [s("ReferenceCustomer"), n("IdCustomer"), n("IdSubscription"), ...paging]],
];

type Account = {
  fields: { endpoint: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function fieldsOf(path: string, extra: Field[], hasBody: boolean | "required"): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "number", true, "path"]);
  const bodyField: Field[] = hasBody ? [["body", "json", hasBody === "required", "query"]] : [];
  return [...pathFields, ...extra, ...bodyField];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const hasBody = input.body !== undefined;
    const url = `${normalize(account.fields.endpoint)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(account.url(url), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`ProAbono answered ${response.status}: ${text.slice(0, 1000)}`);
    // An empty 2xx body (204) means "no result"; null distinguishes it from a successful write that returns a document.
    return text === "" ? null : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody = false] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { proabono: proabono.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.proabono ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ProAbono",
        description:
          "ProAbono subscription management: customers, offers, features, subscriptions, usages, pricing simulations, balance lines and invoices.",
        instructions:
          "Customers are identified by your own ReferenceCustomer. Lists are paged with Page and SizePage. Pricing tools only simulate; subscriptions, usages and billing tools change real data. An empty answer (204) is returned as null and means no result.",
        icons,
      },
    ),
  }),
);
