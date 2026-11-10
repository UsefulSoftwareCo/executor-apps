# Freshdesk

Freshdesk helpdesk (Freshworks): tickets, conversations (replies, notes, forwards), time entries, satisfaction ratings, contacts, companies, agents, groups, roles, canned responses, knowledge base solutions, forums, products, mailboxes, business hours, SLA policies and automation rules.

**Interface:** custom, hand-written tools over the Freshdesk REST API v2 (`https://<subdomain>.freshdesk.com/api/v2`, docs at https://developers.freshdesk.com/api/). Freshdesk publishes no OpenAPI document or GraphQL API, so 102 of the most-used endpoints are declared by hand. Freshworks does publish an official remote MCP server at `https://<subdomain>.freshdesk.com/mcp` (generally available since 2026-09-10; about 37 tools covering tickets, conversations, contacts, agents, groups, companies and solution categories/folders/articles; the raw API key goes in the `Authorization` header). This package is preferred because it covers more (102 tools) and includes operations the MCP omits, such as delete, merge, forums, SLA policies and automation rules. Users who want the vendor-supported route can add the MCP endpoint as a remote MCP server instead. Reads are queries; every mutation requires approval.

**Auth:** API key only. In Freshdesk open your profile picture > Profile settings and copy the API key from the right-hand panel. Enter the account subdomain (the `acme` in `acme.freshdesk.com`) and the key; the app sends it as basic auth (`<key>:X`) to that host only. The Freshdesk REST API offers no user-created OAuth apps (Freshworks staff have said OAuth is not planned for Freshdesk), and the official MCP server also accepts API keys only, so OAuth is not offered. Accounts on a custom support domain still use their `*.freshdesk.com` address for the API.

**Known gaps:**
- File attachments (multipart uploads on tickets, notes, articles) are not supported.
- Bulk contact/ticket export jobs, ticket field/contact field management, and Freshdesk's admin-only configuration endpoints (apart from the read tools listed above) are not covered.
- Tools take JSON for list/object fields (`tags`, `custom_fields`, `cc_emails`).
