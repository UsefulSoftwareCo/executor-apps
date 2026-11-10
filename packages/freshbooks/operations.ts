// FreshBooks publishes no OpenAPI document; these are the documented REST endpoints
// (https://www.freshbooks.com/api/). Paths use {account_id} for accounting resources and
// {business_id} for projects, time tracking and services.
export type Operation = { group: string; name: string; method: "GET" | "POST" | "PUT" | "DELETE"; path: string; description: string };

const A = "/accounting/account/{account_id}";
const B = "business/{business_id}";

function crud(group: string, noun: string, base: string, opts: { create?: boolean; update?: boolean; remove?: boolean; plural?: string; one?: string; get?: boolean; note?: string } = {}): Operation[] {
  const plural = opts.plural ?? `${noun}s`;
  const one = opts.one ?? base;
  const note = opts.note ? ` ${opts.note}` : "";
  const ops: Operation[] = [
    { group, name: "list", method: "GET", path: base, description: `List ${plural}. Filters (search[...]), sort, page and per_page go in query.${note}` },
  ];
  if (opts.get !== false) ops.push({ group, name: "get", method: "GET", path: `${one}/{id}`, description: `Get one ${noun} by id.${note}` });
  if (opts.create !== false) ops.push({ group, name: "create", method: "POST", path: opts.one ?? base, description: `Create a ${noun}. Body is wrapped in a "${noun.replace(/ /g, "_")}" key.${note}` });
  if (opts.update !== false) ops.push({ group, name: "update", method: "PUT", path: `${one}/{id}`, description: `Update a ${noun}. Body is wrapped in a "${noun.replace(/ /g, "_")}" key. Set vis_state to 1 to delete or 2 to archive where supported.${note}` });
  if (opts.remove) ops.push({ group, name: "delete", method: "DELETE", path: `${one}/{id}`, description: `Delete a ${noun}.` });
  return ops;
}

export const operations: Operation[] = [
  { group: "identity", name: "getMe", method: "GET", path: "/auth/api/v1/users/me", description: "Current user with business_memberships. Each membership's business.account_id is the account_id for accounting tools and business.id is the business_id for projects, time entries and services." },
  ...crud("invoices", "invoice", `${A}/invoices/invoices`),
  ...crud("clients", "client", `${A}/users/clients`),
  ...crud("estimates", "estimate", `${A}/estimates/estimates`),
  ...crud("expenses", "expense", `${A}/expenses/expenses`),
  ...crud("expenseCategories", "expense category", `${A}/expenses/categories`, { create: false, update: false, plural: "expense categories" }),
  ...crud("items", "item", `${A}/items/items`),
  ...crud("payments", "payment", `${A}/payments/payments`),
  ...crud("creditNotes", "credit note", `${A}/credit_notes/credit_notes`, { note: "Path not confirmed in the vendor docs." }),
  ...crud("bills", "bill", `${A}/bills/bills`),
  ...crud("billPayments", "bill payment", `${A}/bill_payments/bill_payments`),
  ...crud("billVendors", "bill vendor", `${A}/bill_vendors/bill_vendors`, { get: false }),
  ...crud("otherIncomes", "other income", `${A}/other_incomes/other_incomes`, { plural: "other incomes" }),
  ...crud("taxes", "tax", `${A}/taxes/taxes`, { plural: "taxes" }),
  { group: "reports", name: "paymentsCollected", method: "GET", path: `${A}/reports/accounting/payments_collected`, description: "Payments collected report. Pass start_date and end_date in query." },
  { group: "reports", name: "taxSummary", method: "GET", path: `${A}/reports/accounting/taxsummary`, description: "Tax summary report. Pass start_date and end_date in query." },
  { group: "reports", name: "accountsAging", method: "GET", path: `${A}/reports/accounting/accounts_aging`, description: "Accounts aging (receivables) report. Pass start_date and end_date in query." },
  ...crud("projects", "project", `/projects/${B}/projects`, { remove: true, one: `/projects/${B}/project` }),
  ...crud("timeEntries", "time entry", `/timetracking/${B}/time_entries`, { remove: true, plural: "time entries" }),
  { group: "services", name: "list", method: "GET", path: `/comments/${B}/services`, description: "List services. Filters, page and per_page go in query." },
  { group: "services", name: "get", method: "GET", path: `/comments/${B}/service/{id}`, description: "Get one service by id." },
  { group: "services", name: "create", method: "POST", path: `/comments/${B}/service`, description: "Create a service. Body is wrapped in a \"service\" key." },
];
