# GorillaDesk

Field service management for pest control, lawn care and similar businesses: customers, jobs, schedules, estimates, invoices, recurring invoices, payments, credits, documents, items, services, taxes, branches, users and sources.

Interface: GorillaDesk's official OpenAPI 3.0.3 document at https://api.gorilladesk.com/v1/specs (API base `https://api.gorilladesk.com/v1`). Mutations require approval.

Auth: API key (bearer token). Keys are per company; create one on the Addons page at https://beta.gorilladesk.com/addons/api. GorillaDesk offers no OAuth for third-party apps.

Known gaps: none. All 40 spec operations compile as tools (36 reads, 4 mutations). The spec uses two kinds of `$ref` the compiler cannot follow because it only accepts `#/components/schemas/<name>`: `#/components/schemas/Customer/allOf/0` (used by the customer field of Job, Invoice, RecurringInvoice, Estimate, Payment, Credit and Document) and, in `POST /customers`, a pointer into the `PUT /customers/{customerId}` request body under `paths`. `openapi.ts` patches the document: it lifts the customer fields into a `CustomerBase` component, rewrites those refs, and inlines the PUT body (plus the required `location`) into `POST /customers`. Patches that edit schemas inside arrays replace the whole `allOf` array. The vendor also documents an MCP server (api.gorilladesk.com/mcp/v1/docs), but it is self-hosted at `http://<your-host>:3333`, not a hosted official server, so OpenAPI is the interface used.
