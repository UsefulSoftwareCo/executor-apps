# ServiceM8

Field service management in ServiceM8: jobs, clients (the API calls them companies), contacts, quotes and invoices, materials, scheduling and allocation windows, staff, queues, categories, badges, assets, attachments, notes, forms and the account's templates. 214 tools (120 mutations, each requiring approval).

## Interface

OpenAPI, from ServiceM8's own REST API reference at https://developer.servicem8.com/reference (base URL `https://api.servicem8.com/api_1.0`). ServiceM8 does not publish a downloadable OpenAPI file. Its reference site embeds each operation's OpenAPI excerpt on its own page, so `document.ts` is those excerpts for the "ServiceM8 API" section merged into one document, with examples and generic error responses dropped. Regenerate it from https://developer.servicem8.com/llms.txt when the API changes.

ServiceM8 also runs an official remote MCP server at `https://api.servicem8.com/mcp` (OAuth with dynamic registration). It exposes only about twenty tools (search, list, read jobs, notes, scheduling, messaging), so the REST API is used instead.

## Auth

- **API key**: in ServiceM8 go to Account > Settings > API Keys and create a key. Sent as `X-Api-Key`. No developer account is needed.
- **OAuth 2.0**: for a public or private add-on. Register as a Development Partner at https://www.servicem8.com/developer-registration, open Developer in the main menu, add an item, and note the App ID (client id) and App Secret. Set the add-on's Return URL to the redirect URI Executor shows on the connect page. Authorize `https://go.servicem8.com/oauth/authorize`, token `https://go.servicem8.com/oauth/access_token`, client credentials in the request body. Access tokens last one hour and are refreshed with the refresh token. The requested scopes are exactly the 63 that the generated tools use: vendor, create_jobs, create_notifications, read_/manage_ pairs for assets, attachments, badges, customer_contacts, customers, feedback, forms, inventory, job_categories, job_checklists, job_contacts, job_materials, job_payments, job_queues, jobs, knowledge, locations, schedule, service_templates, staff, suppliers, tasks, tax_rates and templates, plus publish_diary_items, publish_inbox, publish_job_notes, publish_messages, read_email, read_inbox, read_job_admin_activity, read_job_notes, read_messages, read_security_roles, read_sms and read_staff_time_events (the exact list is `scopes` in `openapi.ts`). The add-on's configured scopes must include them; scopes not granted make the matching tools return 403. SMS, email sending, staff GPS and photo scopes are deliberately not requested.

## Known gaps

- The Webhooks, Messaging, Document Templates, Custom Fields, Feed and Add-on SDK APIs are separate sections of the reference and are not included.
- File upload endpoints (attachment bodies) are multipart and limited to what the generated tools support.
- Asset endpoints only work for accounts with the Asset Management add-on.
- The API allows 180 requests per minute and 20000 per day per add-on per account.
