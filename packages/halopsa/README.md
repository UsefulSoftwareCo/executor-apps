# Halo PSA

Halo PSA (HaloITSM and HaloPSA) service desk: tickets and actions, ticket types, statuses and priorities, clients, sites, end users, agents, teams, assets, projects, appointments, opportunities, quotations, invoices, client contracts, items, suppliers, knowledge base articles, attachments and reports.

## Interface

Hand-written tools (85) over the Halo REST API at `https://<your host>/api`, documented at https://halo.haloservicedesk.com/apidoc/info. Halo publishes its Swagger document only on each instance (behind the instance's own login), not at a stable public URL, and has no official remote MCP server, so each operation is declared from the reference. Lists take `pageinate`, `page_size`, `page_no`, `order`, `orderdesc` and `search`. Writes are POSTs of a JSON array in `body` (omit `id` to create, include it to update). Every write and delete requires approval.

## Auth

- **API application (client credentials).** In Halo open Configuration > Integrations > Halo API > View Applications > New, choose "Client ID and Secret (Services)", pick a login agent, and copy the client id and secret (the secret is shown once). Connect with your hostname (for example `example.halopsa.com`, on a Halo-hosted domain), the client id and the client secret; hosted customers who are asked for a tenant name can fill the optional tenant field. The token is requested from `https://<host>/auth/token` with scope `all`, and what a call may do is bounded by the permissions of the application's agent.

OAuth 2.0 authorization code is not offered: Halo's authorize and token URLs are per instance, and Executor declares OAuth URLs as static strings.

Credential scope: the provider declares `hosts` `*.halopsa.com`, `*.haloitsm.com` and `*.haloservicedesk.com`, so the client secret is a handle that Executor substitutes only on requests to those domains. Self-hosted Halo domains are not supported (requests to them are refused); supporting one means adding its host to the provider's `hosts` list. The optional `tenant` field is sent as a `?tenant=` query parameter on the token request and applies only to hosted instances on `*.halopsa.com` and `*.haloitsm.com`.

The client id and secret are sent in the token request's form body. This could not be re-verified against Halo's authentication docs (their pages are rendered client-side), so if a tenant rejects the form body, switching to Basic is the fallback.

The source URL is Halo's own demo instance (`halo.haloservicedesk.com`), not a stable public specification; each customer instance serves its own Swagger.

## Known gaps

- Only the commonly used resources are exposed; Halo has many more (custom fields, workflows, SLAs write, webhooks, etc.).
- Attachment upload and download are not included.
- No Halo-hosted OpenAPI document was usable, so request and response shapes are not described in the tool schemas beyond the documented parameters.
