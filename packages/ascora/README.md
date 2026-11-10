# Ascora

Ascora is Australian field service management software. This package covers customers, contacts, jobs, quotes, enquiries, inventory (supplies, kits, categories), suppliers, supplier invoices and notes.

## Interface

Hand-written tools over the Ascora REST API at `https://api.ascora.com.au`. Ascora publishes no OpenAPI document, GraphQL schema or MCP server; the only endpoint documented on the vendor knowledge-base page is `POST /Enquiry` (https://www.ascora.com.au/kb/ascora-enquiry-api). The authoritative source for the remaining endpoints is Ascora's PDF API user guide (linked from the Support "API Endpoints" page, https://support.ascora.com.au/display/AS/API+Endpoints, whose TLS certificate has expired so it could not be fetched). The other 20 paths (`/Customers/*`, `/Jobs/*`, `/Quotes/*`, `/Inventory/*`, `/Suppliers/*`, `/SupplierInvoices/*`, `/Notes/Note`) and their query and body field names come from an unofficial Ascora client (API version 1.7; a third-party review cites guide v1.6) and are unverified against the vendor's guide. A response with HTTP 200 and `success: false` is raised as an error; this is not confirmed against a live tenant. Responses are returned as Ascora sends them. Mutations (`customers.upsert`, `contacts.upsert`, `suppliers.upsert`, `enquiries.create`, `notes.create`) require approval.

## Auth

API key. In Ascora, open Administration, then API Settings, enable the API and choose Generate New API Key. Executor sends it in the `Auth` request header. Generating a new key disconnects every application using the old one. No OAuth.

## Known gaps

- Attachment upload (`/Attachments/...`, multipart) is not exposed.
- The Accounting API (invoice details, MarkInvoice) uses separate Basic authentication and is not included.
- Only `enquiries.create` is confirmed by vendor documentation. The other tools were not exercised against a live tenant.
- The three Jobs tools (`jobs.list`, `jobs.search`, `jobs.get`) are especially unverified: a third-party review says Ascora's documented API has no Jobs endpoint. They may fail; their descriptions say so.

## Icon

The gear-arch emblem cropped from the vendor logo at https://ascora.com.au/assets/img/ascora_logo_1200_630.png.
