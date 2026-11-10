# QuickBooks

QuickBooks Online accounting (about 174 tools): list, get, create, update, delete, void and email for the accounting entities (accounts, bills, bill payments, classes, credit memos, customers, departments, deposits, employees, estimates, invoices, items, journal entries, payments, payment methods, purchases, purchase orders, refund receipts, sales receipts, tax agencies, codes and rates, terms, time activities, transfers, vendors, vendor credits, attachables, budgets, company currencies), 26 financial reports (profit and loss, balance sheet, cash flow, general ledger, aging, trial balance and more), company info, preferences, exchange rates, tax service, batch, change data capture and raw queries.

## Interface

Hand-written tools over the QuickBooks Online Accounting API v3 (`https://quickbooks.api.intuit.com/v3/company/{realmId}`, minor version 75), transcribed from Intuit's docs at <https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account>. Hand-written tools are preferred because Intuit's developer site (a client-rendered app that could not be fetched as text) links no OpenAPI document that could be found, and community conversions are unofficial and not used. Intuit's only MCP server found in its GitHub organisation, `intuit/quickbooks-online-mcp-server`, is a local stdio process that needs its own client id, secret and refresh token, so it does not fit Executor's hosted OAuth flow. The hosted endpoint `ai-inc.quickbooks.intuit.com` returns 403 Access Denied to unauthenticated requests and is not documented for generic clients, so it was not used.

The `minorversion=75` query parameter is the minimum supported minor version after Intuit retired minor versions 1 to 74 (from Intuit's announcement; the minor-versions page could not be fetched to re-confirm, so bump `minorVersion` in `index.ts` if Intuit raises the minimum). Mutations require approval on every call.

## Auth

OAuth 2.0 only. Intuit access tokens last one hour, so a pasted token is not offered. There are two methods with identical sign-in: `oauth` for production companies and `sandbox` for sandbox companies (the differences are the API host, `sandbox-quickbooks.api.intuit.com`, and the userinfo identity host, `sandbox-accounts.platform.intuit.com`).

Create an app at <https://developer.intuit.com/app/developer/dashboard>, enable the QuickBooks Online Accounting scope, and register Executor's redirect URI from the connect page under Keys & credentials (production apps need an HTTPS redirect URI and Intuit's app assessment; development keys work with sandbox companies). Paste the client ID and secret into the connect page. Scopes requested: `com.intuit.quickbooks.accounting`, `openid`, `profile`, `email`. The token endpoint uses HTTP Basic client authentication.

## Notes and gaps

- Every tool takes `realmId`, the company id. Intuit returns it on the redirect URL and the framework does not keep it, so supply it per call: it is in the QuickBooks URL / Company settings (production) or the developer dashboard Sandbox page.
- Updates need the record's `Id` and latest `SyncToken`. Updates are sparse by default where QuickBooks supports it.
- Customers, vendors, accounts and items cannot be deleted in QuickBooks; deactivate with `Active: false`.
- Not included: PDF download and attachment upload (binary and multipart), the Payments, Payroll and Projects (GraphQL) APIs, which use other scopes and hosts.
- The health check calls the OpenID userinfo endpoint because the company-scoped APIs need `realmId`.
- Not verified with a real account.
