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
  router,
  string,
  boolean,
  number,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const production = "https://api.freeagent.com/v2";
const sandbox = "https://api.sandbox.freeagent.com/v2";
// FreeAgent rejects requests without a User-Agent.
const userAgent = "Executor (https://executor.sh)";

const Me = object({
  user: object({ url: string(), first_name: string(), last_name: string(), email: string() }),
});

type Account = { method: "oauth" | "sandbox"; fields: { access_token: string } };

const baseOf = (account: Account) => (account.method === "sandbox" ? sandbox : production);

// FreeAgent has no scopes: the token carries the authorising user's own permission level.
const freeagent = defineProvider({
  name: "FreeAgent",
  hosts: ["api.freeagent.com", "api.sandbox.freeagent.com"],
  auth: {
    // FreeAgent offers no client registration: the connect page asks for an app's client id and secret
    // from the Developer Dashboard. The token endpoint takes the client credentials as HTTP Basic auth.
    oauth: oauth2({
      authorizationUrl: "https://api.freeagent.com/v2/approve_app",
      tokenUrl: "https://api.freeagent.com/v2/token_endpoint",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
    sandbox: oauth2({
      authorizationUrl: "https://api.sandbox.freeagent.com/v2/approve_app",
      tokenUrl: "https://api.sandbox.freeagent.com/v2/token_endpoint",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseOf(account)}/users/me`, { signal, headers: headers(account) });
    const { user } = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: user.url,
        displayName: `${user.first_name} ${user.last_name}`,
        email: user.email,
      },
    };
  },
});

function headers(account: Account): Record<string, string> {
  return {
    Authorization: `Bearer ${account.fields.access_token}`,
    "User-Agent": userAgent,
    Accept: "application/json",
  };
}

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const b = (name: string): Field => [name, "boolean", false, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

const paging = [n("page"), n("per_page")];
const since = [s("updated_since")];
const dates = [s("from_date"), s("to_date")];

// A write sends `{ [wrapper]: body }`; "*" sends the body as it is.
type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  wrapper?: string,
];

const writeNote = "body holds the resource's attributes exactly as FreeAgent documents them (https://dev.freeagent.com/docs).";

const rows: Row[] = [
  // Company
  ["company", "get", "GET", "/company", "The company: name, type, currency, sales tax registration, accounting dates and subdomain.", []],
  ["company", "businessCategories", "GET", "/company/business_categories", "The business categories a company can choose from.", []],
  ["company", "taxTimeline", "GET", "/company/tax_timeline", "Upcoming and past tax deadlines (VAT, corporation tax, payroll, self assessment).", []],
  ["company", "emailAddresses", "GET", "/email_addresses", "Email addresses that FreeAgent can send invoices and estimates from.", []],
  ["company", "cisBands", "GET", "/cis_bands", "Construction Industry Scheme bands.", []],
  ["company", "cisSettings", "GET", "/cis_settings", "The company's Construction Industry Scheme settings.", []],
  ["company", "updateCisSettings", "PUT", "/cis_settings", `Update CIS settings. ${writeNote}`, [], "cis_settings"],
  ["company", "accountLocks", "GET", "/account_locks", "The date up to which the accounts are locked against changes.", []],
  ["company", "updateAccountLocks", "PUT", "/account_locks", `Set the account lock. ${writeNote}`, [], "account_lock"],
  ["company", "deleteAccountLocks", "DELETE", "/account_locks", "Remove the account lock.", []],

  // Users
  ["users", "me", "GET", "/users/me", "The authenticated user.", []],
  ["users", "list", "GET", "/users", "List users. view is all or a role filter such as staff, active_staff, advisors, active_advisors.", [s("view"), ...paging]],
  ["users", "get", "GET", "/users/{id}", "Retrieve a user.", []],
  ["users", "create", "POST", "/users", `Create a user and send an invitation. ${writeNote}`, [], "user"],
  ["users", "update", "PUT", "/users/{id}", `Update a user. ${writeNote}`, [], "user"],
  ["users", "updateMe", "PUT", "/users/me", `Update the authenticated user. ${writeNote}`, [], "user"],
  ["users", "delete", "DELETE", "/users/{id}", "Delete a user.", []],

  // Contacts
  ["contacts", "list", "GET", "/contacts", "List contacts. view is active, clients, suppliers, active_projects, completed_projects, open_clients or open_suppliers; sort is name, created_at or updated_at (prefix - to reverse).", [s("view"), s("sort"), ...since, ...paging]],
  ["contacts", "get", "GET", "/contacts/{id}", "Retrieve a contact.", []],
  ["contacts", "create", "POST", "/contacts", `Create a contact. Needs a name: first_name and last_name, or organisation_name. ${writeNote}`, [], "contact"],
  ["contacts", "update", "PUT", "/contacts/{id}", `Update a contact. ${writeNote}`, [], "contact"],
  ["contacts", "delete", "DELETE", "/contacts/{id}", "Delete a contact (only possible when it has no invoices or projects).", []],

  // Notes
  ["notes", "list", "GET", "/notes", "List notes on a contact or a project. Pass contact or project as a resource URL.", [s("contact"), s("project"), ...paging]],
  ["notes", "get", "GET", "/notes/{id}", "Retrieve a note.", []],
  ["notes", "create", "POST", "/notes", `Create a note on the contact or project given as a resource URL. ${writeNote}`, [s("contact"), s("project")], "note"],
  ["notes", "update", "PUT", "/notes/{id}", `Update a note. ${writeNote}`, [], "note"],
  ["notes", "delete", "DELETE", "/notes/{id}", "Delete a note.", []],

  // Projects and time
  ["projects", "list", "GET", "/projects", "List projects. view is active, completed, cancelled or hidden; contact is a contact URL; nested=true includes tasks.", [s("view"), s("contact"), s("sort"), b("nested"), ...since, ...paging]],
  ["projects", "get", "GET", "/projects/{id}", "Retrieve a project.", []],
  ["projects", "create", "POST", "/projects", `Create a project. ${writeNote}`, [], "project"],
  ["projects", "update", "PUT", "/projects/{id}", `Update a project. ${writeNote}`, [], "project"],
  ["projects", "delete", "DELETE", "/projects/{id}", "Delete a project.", []],
  ["tasks", "list", "GET", "/tasks", "List tasks. view is active, completed or all; project is a project URL.", [s("view"), s("project"), s("sort"), ...since, ...paging]],
  ["tasks", "get", "GET", "/tasks/{id}", "Retrieve a task.", []],
  ["tasks", "create", "POST", "/tasks", `Create a task on the project given as a resource URL. ${writeNote}`, [s("project", true)], "task"],
  ["tasks", "update", "PUT", "/tasks/{id}", `Update a task. ${writeNote}`, [], "task"],
  ["tasks", "delete", "DELETE", "/tasks/{id}", "Delete a task.", []],
  ["timeslips", "list", "GET", "/timeslips", "List timeslips. Filter by user, task or project resource URL, view (all, unbilled, running) and from_date/to_date; nested=true includes the task, project and user.", [s("user"), s("task"), s("project"), s("view"), b("nested"), ...dates, ...since, ...paging]],
  ["timeslips", "get", "GET", "/timeslips/{id}", "Retrieve a timeslip.", []],
  ["timeslips", "create", "POST", "/timeslips", `Create a timeslip (task, user, project, dated_on, hours). ${writeNote}`, [], "timeslip"],
  ["timeslips", "createBatch", "POST", "/timeslips", "Create several timeslips at once. body is { timeslips: [ ... ] }.", [], "*"],
  ["timeslips", "update", "PUT", "/timeslips/{id}", `Update a timeslip. ${writeNote}`, [], "timeslip"],
  ["timeslips", "delete", "DELETE", "/timeslips/{id}", "Delete a timeslip.", []],
  ["timeslips", "startTimer", "POST", "/timeslips/{id}/timer", "Start the timer on a timeslip.", []],
  ["timeslips", "stopTimer", "DELETE", "/timeslips/{id}/timer", "Stop the timer on a timeslip.", []],

  // Invoices
  ["invoices", "list", "GET", "/invoices", "List invoices. view is recent_open_or_overdue, open, overdue, open_or_overdue, draft, paid, scheduled_to_email or thank_you_emails, or a status; contact and project are resource URLs; nested_invoice_items=true includes line items.", [s("view"), s("contact"), s("project"), s("sort"), b("nested_invoice_items"), ...since, ...paging]],
  ["invoices", "get", "GET", "/invoices/{id}", "Retrieve an invoice with its items.", []],
  ["invoices", "create", "POST", "/invoices", `Create an invoice (contact, dated_on, payment_terms_in_days and invoice_items are the usual fields). ${writeNote}`, [], "invoice"],
  ["invoices", "update", "PUT", "/invoices/{id}", `Update an invoice. To change items send invoice_items with url (update) or url and _destroy true (remove). ${writeNote}`, [], "invoice"],
  ["invoices", "delete", "DELETE", "/invoices/{id}", "Delete a draft invoice.", []],
  ["invoices", "duplicate", "POST", "/invoices/{id}/duplicate", "Duplicate an invoice as a new draft.", []],
  ["invoices", "pdf", "GET", "/invoices/{id}/pdf", "The invoice as a base64-encoded PDF.", []],
  ["invoices", "sendEmail", "POST", "/invoices/{id}/send_email", "Email an invoice. body is { email: { to, cc, bcc, from, subject, body, attach_pdf } }.", [], "invoice"],
  ["invoices", "markAsSent", "PUT", "/invoices/{id}/transitions/mark_as_sent", "Mark a draft invoice as sent.", []],
  ["invoices", "markAsDraft", "PUT", "/invoices/{id}/transitions/mark_as_draft", "Move an invoice back to draft.", []],
  ["invoices", "markAsScheduled", "PUT", "/invoices/{id}/transitions/mark_as_scheduled", "Schedule a draft invoice to be emailed on its date.", []],
  ["invoices", "markAsCancelled", "PUT", "/invoices/{id}/transitions/mark_as_cancelled", "Cancel an invoice.", []],
  ["invoices", "convertToCreditNote", "PUT", "/invoices/{id}/transitions/convert_to_credit_note", "Convert an invoice into a credit note.", []],
  ["invoices", "directDebit", "POST", "/invoices/{id}/direct_debit", "Collect payment for an invoice by direct debit.", []],
  ["invoices", "timeline", "GET", "/invoices/timeline", "Invoice timeline: invoiced and paid totals by period.", []],
  ["invoices", "getDefaultAdditionalText", "GET", "/invoices/default_additional_text", "The default additional text on new invoices.", []],
  ["invoices", "setDefaultAdditionalText", "PUT", "/invoices/default_additional_text", `Set the default additional text. ${writeNote}`, [], "default_additional_text"],
  ["invoices", "deleteDefaultAdditionalText", "DELETE", "/invoices/default_additional_text", "Remove the default additional text.", []],
  ["recurringInvoices", "list", "GET", "/recurring_invoices", "List recurring invoice profiles. view is active or draft; contact is a contact URL.", [s("view"), s("contact"), s("sort"), ...since, ...paging]],
  ["recurringInvoices", "get", "GET", "/recurring_invoices/{id}", "Retrieve a recurring invoice profile.", []],

  // Estimates
  ["estimates", "list", "GET", "/estimates", "List estimates. view is recent, draft, sent, approved, rejected or invoiced; contact, project and invoice are resource URLs; nested_estimate_items=true includes items.", [s("view"), s("contact"), s("project"), s("invoice"), b("nested_estimate_items"), ...dates, ...since, ...paging]],
  ["estimates", "get", "GET", "/estimates/{id}", "Retrieve an estimate with its items.", []],
  ["estimates", "create", "POST", "/estimates", `Create an estimate. ${writeNote}`, [], "estimate"],
  ["estimates", "update", "PUT", "/estimates/{id}", `Update an estimate. ${writeNote}`, [], "estimate"],
  ["estimates", "delete", "DELETE", "/estimates/{id}", "Delete an estimate.", []],
  ["estimates", "duplicate", "POST", "/estimates/{id}/duplicate", "Duplicate an estimate.", []],
  ["estimates", "pdf", "GET", "/estimates/{id}/pdf", "The estimate as a base64-encoded PDF.", []],
  ["estimates", "sendEmail", "POST", "/estimates/{id}/send_email", "Email an estimate. body is { email: { to, cc, bcc, from, subject, body } }.", [], "estimate"],
  ["estimates", "markAsSent", "PUT", "/estimates/{id}/transitions/mark_as_sent", "Mark an estimate as sent.", []],
  ["estimates", "markAsDraft", "PUT", "/estimates/{id}/transitions/mark_as_draft", "Move an estimate back to draft.", []],
  ["estimates", "markAsApproved", "PUT", "/estimates/{id}/transitions/mark_as_approved", "Mark an estimate as approved.", []],
  ["estimates", "markAsRejected", "PUT", "/estimates/{id}/transitions/mark_as_rejected", "Mark an estimate as rejected.", []],
  ["estimates", "convertToInvoice", "PUT", "/estimates/{id}/transitions/convert_to_invoice", "Convert an estimate into an invoice.", []],
  ["estimates", "createItem", "POST", "/estimate_items", `Add an item to an estimate (body includes estimate as a resource URL). ${writeNote}`, [], "estimate_item"],
  ["estimates", "updateItem", "PUT", "/estimate_items/{id}", `Update an estimate item. ${writeNote}`, [], "estimate_item"],
  ["estimates", "deleteItem", "DELETE", "/estimate_items/{id}", "Delete an estimate item.", []],
  ["estimates", "getDefaultAdditionalText", "GET", "/estimates/default_additional_text", "The default additional text on new estimates.", []],
  ["estimates", "setDefaultAdditionalText", "PUT", "/estimates/default_additional_text", `Set the default additional text. ${writeNote}`, [], "default_additional_text"],
  ["estimates", "deleteDefaultAdditionalText", "DELETE", "/estimates/default_additional_text", "Remove the default additional text.", []],

  // Credit notes
  ["creditNotes", "list", "GET", "/credit_notes", "List credit notes. view is recent_open_or_overdue, open, overdue, open_or_overdue, draft or refunded; contact and project are resource URLs; nested_credit_note_items=true includes items.", [s("view"), s("contact"), s("project"), s("sort"), b("nested_credit_note_items"), ...since, ...paging]],
  ["creditNotes", "get", "GET", "/credit_notes/{id}", "Retrieve a credit note with its items.", []],
  ["creditNotes", "create", "POST", "/credit_notes", `Create a credit note. ${writeNote}`, [], "credit_note"],
  ["creditNotes", "update", "PUT", "/credit_notes/{id}", `Update a credit note. ${writeNote}`, [], "credit_note"],
  ["creditNotes", "delete", "DELETE", "/credit_notes/{id}", "Delete a credit note.", []],
  ["creditNotes", "pdf", "GET", "/credit_notes/{id}/pdf", "The credit note as a base64-encoded PDF.", []],
  ["creditNotes", "sendEmail", "POST", "/credit_notes/{id}/send_email", "Email a credit note. body is { email: { to, cc, bcc, from, subject, body } }.", [], "credit_note"],
  ["creditNotes", "markAsSent", "PUT", "/credit_notes/{id}/transitions/mark_as_sent", "Mark a credit note as sent.", []],
  ["creditNotes", "markAsDraft", "PUT", "/credit_notes/{id}/transitions/mark_as_draft", "Move a credit note back to draft.", []],
  ["creditNoteReconciliations", "list", "GET", "/credit_note_reconciliations", "List credit note reconciliations (credit notes applied to invoices).", [...dates, ...since, ...paging]],
  ["creditNoteReconciliations", "get", "GET", "/credit_note_reconciliations/{id}", "Retrieve a credit note reconciliation.", []],
  ["creditNoteReconciliations", "create", "POST", "/credit_note_reconciliations", `Apply a credit note to an invoice. ${writeNote}`, [], "credit_note_reconciliation"],
  ["creditNoteReconciliations", "update", "PUT", "/credit_note_reconciliations/{id}", `Update a credit note reconciliation. ${writeNote}`, [], "credit_note_reconciliation"],
  ["creditNoteReconciliations", "delete", "DELETE", "/credit_note_reconciliations/{id}", "Delete a credit note reconciliation.", []],

  // Bills and expenses
  ["bills", "list", "GET", "/bills", "List bills. view is recent, open, overdue, open_or_overdue, paid or recurring; contact and project are resource URLs; nested_bill_items=true includes items.", [s("view"), s("contact"), s("project"), b("nested_bill_items"), ...dates, ...since, ...paging]],
  ["bills", "get", "GET", "/bills/{id}", "Retrieve a bill.", []],
  ["bills", "create", "POST", "/bills", `Create a bill. ${writeNote}`, [], "bill"],
  ["bills", "update", "PUT", "/bills/{id}", `Update a bill. ${writeNote}`, [], "bill"],
  ["bills", "delete", "DELETE", "/bills/{id}", "Delete a bill.", []],
  ["expenses", "list", "GET", "/expenses", "List expenses. view is recent; project is a project URL.", [s("view"), s("project"), ...dates, ...since, ...paging]],
  ["expenses", "get", "GET", "/expenses/{id}", "Retrieve an expense.", []],
  ["expenses", "create", "POST", "/expenses", `Create an expense (user, category, dated_on, gross_value, description, optional attachment). ${writeNote}`, [], "expense"],
  ["expenses", "update", "PUT", "/expenses/{id}", `Update an expense. ${writeNote}`, [], "expense"],
  ["expenses", "delete", "DELETE", "/expenses/{id}", "Delete an expense.", []],
  ["expenses", "mileageSettings", "GET", "/expenses/mileage_settings", "Mileage engine sizes, rates and allowances.", []],
  ["attachments", "get", "GET", "/attachments/{id}", "Retrieve an attachment, including its content URL.", []],
  ["attachments", "delete", "DELETE", "/attachments/{id}", "Delete an attachment.", []],

  // Banking
  ["bankAccounts", "list", "GET", "/bank_accounts", "List bank accounts. view is standard_bank_accounts, paypal_accounts or credit_card_accounts.", [s("view"), ...paging]],
  ["bankAccounts", "get", "GET", "/bank_accounts/{id}", "Retrieve a bank account.", []],
  ["bankAccounts", "create", "POST", "/bank_accounts", `Create a bank account. ${writeNote}`, [], "bank_account"],
  ["bankAccounts", "update", "PUT", "/bank_accounts/{id}", `Update a bank account. ${writeNote}`, [], "bank_account"],
  ["bankAccounts", "delete", "DELETE", "/bank_accounts/{id}", "Delete a bank account.", []],
  ["bankFeeds", "list", "GET", "/bank_feeds", "List bank feeds.", [...paging]],
  ["bankFeeds", "get", "GET", "/bank_feeds/{id}", "Retrieve a bank feed.", []],
  ["bankTransactions", "list", "GET", "/bank_transactions", "List the transactions of a bank account (bank_account is a resource URL, required). view is unexplained, explained, manual, imported or marked_for_review; last_uploaded=true returns the latest upload.", [s("bank_account", true), s("view"), b("last_uploaded"), ...dates, ...since, ...paging]],
  ["bankTransactions", "get", "GET", "/bank_transactions/{id}", "Retrieve a bank transaction.", []],
  ["bankTransactions", "delete", "DELETE", "/bank_transactions/{id}", "Delete a bank transaction.", []],
  ["bankTransactions", "uploadStatement", "POST", "/bank_transactions/statement", "Upload a bank statement as JSON. bank_account is a resource URL; body is { statement: [ { dated_on, description, amount } ] }.", [s("bank_account", true)], "*"],
  ["bankTransactionExplanations", "list", "GET", "/bank_transaction_explanations", "List explanations of a bank account's transactions (bank_account is a resource URL, required).", [s("bank_account", true), ...dates, ...since, ...paging]],
  ["bankTransactionExplanations", "get", "GET", "/bank_transaction_explanations/{id}", "Retrieve a bank transaction explanation.", []],
  ["bankTransactionExplanations", "create", "POST", "/bank_transaction_explanations", `Explain a bank transaction (bank_transaction, dated_on, gross_value and a category, paid invoice, bill or transfer). ${writeNote}`, [], "bank_transaction_explanation"],
  ["bankTransactionExplanations", "update", "PUT", "/bank_transaction_explanations/{id}", `Update an explanation. ${writeNote}`, [], "bank_transaction_explanation"],
  ["bankTransactionExplanations", "delete", "DELETE", "/bank_transaction_explanations/{id}", "Delete an explanation.", []],

  // Accounting
  ["categories", "list", "GET", "/categories", "List the chart of accounts: income, cost of sales, admin expense and general categories. sub_accounts=true includes sub accounts.", [b("sub_accounts")]],
  ["categories", "get", "GET", "/categories/{nominal_code}", "Retrieve a category by nominal code.", []],
  ["categories", "create", "POST", "/categories", `Create a category. ${writeNote}`, [], "*"],
  ["categories", "update", "PUT", "/categories/{nominal_code}", `Update a category. ${writeNote}`, [], "*"],
  ["categories", "delete", "DELETE", "/categories/{nominal_code}", "Delete a category.", []],
  ["journalSets", "list", "GET", "/journal_sets", "List manual journal sets. Filter by tag and from_date/to_date.", [s("tag"), ...dates, ...since, ...paging]],
  ["journalSets", "get", "GET", "/journal_sets/{id}", "Retrieve a journal set.", []],
  ["journalSets", "openingBalances", "GET", "/journal_sets/opening_balances", "The opening balances journal set.", []],
  ["journalSets", "create", "POST", "/journal_sets", `Create a journal set (dated_on, description, journal_entries with debit_value and category). ${writeNote}`, [], "journal_set"],
  ["journalSets", "update", "PUT", "/journal_sets/{id}", `Update a journal set. ${writeNote}`, [], "journal_set"],
  ["journalSets", "delete", "DELETE", "/journal_sets/{id}", "Delete a journal set.", []],
  ["transactions", "list", "GET", "/accounting/transactions", "List accounting transactions (required: from_date and to_date), optionally by nominal_code.", [s("from_date", true), s("to_date", true), s("nominal_code"), ...paging]],
  ["transactions", "get", "GET", "/accounting/transactions/{id}", "Retrieve an accounting transaction.", []],
  ["priceListItems", "list", "GET", "/price_list_items", "List price list items.", [s("sort"), ...paging]],
  ["priceListItems", "get", "GET", "/price_list_items/{id}", "Retrieve a price list item.", []],
  ["priceListItems", "create", "POST", "/price_list_items", `Create a price list item. ${writeNote}`, [], "price_list_item"],
  ["priceListItems", "update", "PUT", "/price_list_items/{id}", `Update a price list item. ${writeNote}`, [], "price_list_item"],
  ["priceListItems", "delete", "DELETE", "/price_list_items/{id}", "Delete a price list item.", []],
  ["stockItems", "list", "GET", "/stock_items", "List stock items.", [s("sort"), ...paging]],
  ["stockItems", "get", "GET", "/stock_items/{id}", "Retrieve a stock item.", []],
  ["capitalAssets", "list", "GET", "/capital_assets", "List capital assets. view is all or disposed; include_history=true adds depreciation history.", [s("view"), b("include_history"), ...paging]],
  ["capitalAssets", "get", "GET", "/capital_assets/{id}", "Retrieve a capital asset.", []],
  ["capitalAssets", "listTypes", "GET", "/capital_asset_types", "List capital asset types.", []],
  ["capitalAssets", "getType", "GET", "/capital_asset_types/{id}", "Retrieve a capital asset type.", []],
  ["capitalAssets", "createType", "POST", "/capital_asset_types", `Create a capital asset type. ${writeNote}`, [], "capital_asset_type"],
  ["capitalAssets", "updateType", "PUT", "/capital_asset_types/{id}", `Update a capital asset type. ${writeNote}`, [], "capital_asset_type"],
  ["capitalAssets", "deleteType", "DELETE", "/capital_asset_types/{id}", "Delete a capital asset type.", []],
  ["hirePurchases", "list", "GET", "/hire_purchases", "List hire purchases.", [...paging]],
  ["hirePurchases", "get", "GET", "/hire_purchases/{id}", "Retrieve a hire purchase.", []],
  ["properties", "list", "GET", "/properties", "List properties (UK unincorporated landlord companies).", [...paging]],
  ["properties", "get", "GET", "/properties/{id}", "Retrieve a property.", []],
  ["properties", "create", "POST", "/properties", `Create a property. ${writeNote}`, [], "property"],
  ["properties", "update", "PUT", "/properties/{id}", `Update a property. ${writeNote}`, [], "property"],
  ["properties", "delete", "DELETE", "/properties/{id}", "Delete a property.", []],

  // Reports
  ["reports", "profitAndLoss", "GET", "/accounting/profit_and_loss/summary", "Profit and loss summary for a period. Pass from_date and to_date, or accounting_period (for example 2025/26).", [s("from_date"), s("to_date"), s("accounting_period")]],
  ["reports", "balanceSheet", "GET", "/accounting/balance_sheet", "Balance sheet. as_at_date is YYYY-MM-DD.", [s("as_at_date")]],
  ["reports", "balanceSheetOpeningBalances", "GET", "/accounting/balance_sheet/opening_balances", "Opening balances on the balance sheet.", []],
  ["reports", "trialBalance", "GET", "/accounting/trial_balance/summary", "Trial balance summary.", [s("from_date"), s("to_date")]],
  ["reports", "trialBalanceOpeningBalances", "GET", "/accounting/trial_balance/summary/opening_balances", "Opening balances in the trial balance.", []],
  ["reports", "cashflow", "GET", "/cashflow", "Cashflow for a period (from_date and to_date required).", [s("from_date", true), s("to_date", true)]],

  // Sales tax and tax returns
  ["salesTax", "listPeriods", "GET", "/sales_tax_periods", "List sales tax (VAT) registration periods.", []],
  ["salesTax", "getPeriod", "GET", "/sales_tax_periods/{id}", "Retrieve a sales tax period.", []],
  ["salesTax", "createPeriod", "POST", "/sales_tax_periods", `Create a sales tax period. ${writeNote}`, [], "sales_tax_period"],
  ["salesTax", "updatePeriod", "PUT", "/sales_tax_periods/{id}", `Update a sales tax period. ${writeNote}`, [], "sales_tax_period"],
  ["salesTax", "deletePeriod", "DELETE", "/sales_tax_periods/{id}", "Delete a sales tax period.", []],
  ["salesTax", "ecMossRates", "GET", "/ec_moss/sales_tax_rates", "EC MOSS sales tax rates for a country (country and date required).", [s("country", true), s("date", true)]],
  ["vatReturns", "list", "GET", "/vat_returns", "List VAT returns.", []],
  ["vatReturns", "get", "GET", "/vat_returns/{period_ends_on}", "Retrieve a VAT return by period end date (YYYY-MM-DD).", []],
  ["vatReturns", "markAsFiled", "PUT", "/vat_returns/{period_ends_on}/mark_as_filed", "Mark a VAT return as filed.", []],
  ["vatReturns", "markAsUnfiled", "PUT", "/vat_returns/{period_ends_on}/mark_as_unfiled", "Mark a VAT return as unfiled.", []],
  ["vatReturns", "markPaymentAsPaid", "PUT", "/vat_returns/{period_ends_on}/payments/{payment_date}/mark_as_paid", "Mark a VAT return payment as paid.", []],
  ["vatReturns", "markPaymentAsUnpaid", "PUT", "/vat_returns/{period_ends_on}/payments/{payment_date}/mark_as_unpaid", "Mark a VAT return payment as unpaid.", []],
  ["corporationTaxReturns", "list", "GET", "/corporation_tax_returns", "List corporation tax returns.", []],
  ["corporationTaxReturns", "get", "GET", "/corporation_tax_returns/{period_ends_on}", "Retrieve a corporation tax return by period end date.", []],
  ["corporationTaxReturns", "markAsFiled", "PUT", "/corporation_tax_returns/{period_ends_on}/mark_as_filed", "Mark a corporation tax return as filed.", []],
  ["corporationTaxReturns", "markAsUnfiled", "PUT", "/corporation_tax_returns/{period_ends_on}/mark_as_unfiled", "Mark a corporation tax return as unfiled.", []],
  ["corporationTaxReturns", "markAsPaid", "PUT", "/corporation_tax_returns/{period_ends_on}/mark_as_paid", "Mark a corporation tax return as paid.", []],
  ["corporationTaxReturns", "markAsUnpaid", "PUT", "/corporation_tax_returns/{period_ends_on}/mark_as_unpaid", "Mark a corporation tax return as unpaid.", []],
  ["finalAccountsReports", "list", "GET", "/final_accounts_reports", "List final accounts reports.", []],
  ["finalAccountsReports", "get", "GET", "/final_accounts_reports/{period_ends_on}", "Retrieve a final accounts report by period end date.", []],
  ["finalAccountsReports", "markAsFiled", "PUT", "/final_accounts_reports/{period_ends_on}/mark_as_filed", "Mark a final accounts report as filed.", []],
  ["finalAccountsReports", "markAsUnfiled", "PUT", "/final_accounts_reports/{period_ends_on}/mark_as_unfiled", "Mark a final accounts report as unfiled.", []],
  ["selfAssessmentReturns", "list", "GET", "/users/{user_id}/self_assessment_returns", "List a user's self assessment returns.", []],
  ["selfAssessmentReturns", "get", "GET", "/users/{user_id}/self_assessment_returns/{period_ends_on}", "Retrieve a self assessment return.", []],
  ["selfAssessmentReturns", "markAsFiled", "PUT", "/users/{user_id}/self_assessment_returns/{period_ends_on}/mark_as_filed", "Mark a self assessment return as filed.", []],
  ["selfAssessmentReturns", "markAsUnfiled", "PUT", "/users/{user_id}/self_assessment_returns/{period_ends_on}/mark_as_unfiled", "Mark a self assessment return as unfiled.", []],
  ["selfAssessmentReturns", "markPaymentAsPaid", "PUT", "/users/{user_id}/self_assessment_returns/{period_ends_on}/payments/{payment_date}/mark_as_paid", "Mark a self assessment payment as paid.", []],
  ["selfAssessmentReturns", "markPaymentAsUnpaid", "PUT", "/users/{user_id}/self_assessment_returns/{period_ends_on}/payments/{payment_date}/mark_as_unpaid", "Mark a self assessment payment as unpaid.", []],

  // Payroll
  ["payroll", "year", "GET", "/payroll/{year}", "Payroll periods and payments for a tax year (for example 2025).", []],
  ["payroll", "period", "GET", "/payroll/{year}/{period}", "Payslips for a payroll period (0 is April, 11 is March).", []],
  ["payroll", "markPaymentAsPaid", "PUT", "/payroll/{year}/payments/{payment_date}/mark_as_paid", "Mark a payroll payment as paid.", []],
  ["payroll", "markPaymentAsUnpaid", "PUT", "/payroll/{year}/payments/{payment_date}/mark_as_unpaid", "Mark a payroll payment as unpaid.", []],
  ["payroll", "profiles", "GET", "/payroll_profiles/{year}", "Payroll profiles for a tax year. user is a user URL.", [s("user")]],
];

function fieldsOf(path: string, extra: Field[], wrapper: string | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = wrapper === undefined ? [] : [["body", "json", true, "query"]];
  return [...pathFields, ...extra, ...body];
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
  const call = async (
    method: string,
    path: string,
    fields: Field[],
    wrapper: string | undefined,
    input: Record<string, unknown>,
  ) => {
    let target = path;
    const search = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else search.set(name, String(value));
    }
    const hasBody = wrapper !== undefined && input.body !== undefined;
    const payload = hasBody ? (wrapper === "*" ? input.body : { [wrapper]: input.body }) : undefined;
    const response = await fetcher(`${baseOf(account)}${target}${search.size > 0 ? `?${search.toString()}` : ""}`, {
      method,
      signal,
      headers: { ...headers(account), ...(hasBody ? { "content-type": "application/json" } : {}) },
      body: hasBody ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`FreeAgent answered ${response.status}: ${text.slice(0, 1000)}`);
    const parsed = text === "" ? { ok: true } : (JSON.parse(text) as Record<string, unknown>);
    const total = response.headers.get("X-Total-Count");
    const link = response.headers.get("Link");
    if (method === "GET" && total !== null && typeof parsed === "object" && parsed !== null) {
      return { ...parsed, _totalCount: Number(total), ...(link === null ? {} : { _link: link }) };
    }
    return parsed;
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, wrapper] of rows) {
    const fields = fieldsOf(path, extra, wrapper);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, wrapper, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { freeagent: freeagent.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.freeagent ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "FreeAgent",
        description:
          "FreeAgent accounting: contacts, invoices, estimates, credit notes, bills, expenses, banking, projects, time tracking, tax returns and reports.",
        instructions:
          "FreeAgent identifies related resources by URL (for example https://api.freeagent.com/v2/contacts/123); pass those URLs in filters and request bodies. Writes take a body with the resource's attributes; the tool wraps it in the resource key. Lists return 25 items per page (per_page up to 100); _totalCount gives the total.",
        icons,
      },
    ),
  }),
);
