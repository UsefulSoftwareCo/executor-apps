# Freshservice

Freshservice (Freshworks) IT service management: tickets with replies, notes, tasks and time entries, problems, changes, releases, requesters and requester groups, agents, roles and groups, assets and asset types, software, contracts, purchase orders, vendors, departments, locations, workspaces, announcements, knowledge base solutions, the service catalog, canned responses, business hours and SLA policies.

**Interface:** custom, hand-written tools over the Freshservice REST API v2 (`https://<subdomain>.freshservice.com/api/v2`, docs at https://api.freshservice.com/). Freshservice publishes no OpenAPI document or GraphQL API, so 155 of the most-used endpoints (paths checked against the docs page) are declared by hand. Freshworks may also offer a remote MCP server, but that was not verified against a vendor source, so this package does not rely on it; hand-written tools were chosen for their wider coverage (problems, changes, releases, assets, vendors, departments and more). Reads are queries; every mutation requires approval.

**Auth:** API key only. In Freshservice open your profile picture > Profile settings and copy the API key shown under the change-password section. Enter the account subdomain (the `acme` in `acme.freshservice.com`) and the key; the app sends it as basic auth (`<key>:X`) to `*.freshservice.com` only. The API docs say OAuth is supported and list per-endpoint scopes (for example `freshservice.tickets.view`), but they document no grant type or public authorization/token endpoints, so OAuth is omitted pending verification. The key's role limits what it can do, and the API is rate limited per minute by plan.

**Icon:** the Freshservice product mark, from the vendor SVG https://d3oc9eyfpjcc28.cloudfront.net/universal-apps/shared-assets/product-logos/freshservice-dew.svg.

**Known gaps:**
- Child tickets (`POST /tickets/{id}/create_child_ticket`) are not exposed; there is no documented endpoint to list them.
- File attachments (multipart uploads and downloads) are not supported.
- Projects, alerts, on-call management, custom objects, status page, journeys, onboarding/offboarding, audit logs and CAB endpoints are not covered.
- Tools take JSON for list/object fields (`tags`, `custom_fields`, `type_fields`, `cc_emails`).
- Custom CNAME domains do not work with the API; use the `*.freshservice.com` address.
