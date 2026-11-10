# Gelato

Gelato is a print-on-demand network. This package covers its REST API: creating, quoting, searching, converting and cancelling orders; browsing catalogs and products with prices, cover dimensions and regional stock; listing shipment methods; and reading store products and templates or creating a store product from a template.

## Interface

Hand-written tools (`operations.ts`) over `fetch`, 18 in total, named after the vendor docs at https://dashboard.gelato.com/docs/. The vendor docs site returned HTTP 403 to automated fetching during authoring, so the claim that Gelato publishes no OpenAPI document or official MCP server was not confirmed against the vendor. Its APIs sit on four subdomains (`order`, `product`, `shipment`, `ecommerce` under `gelatoapis.com`), so the operations are described by hand. A community-maintained set of OpenAPI files (api-evangelist/gelato on GitHub) was used only to cross-check paths; it is unofficial and not shipped. Each tool takes one `params` object holding path parameters and query or body fields. Every non-GET operation requires approval, including the read-only POST endpoints (orders:search, orders:quote, products:search, stock/region-availability), which are treated as mutations.

## Auth

API key. Create it in the Gelato dashboard; it is sent in the `X-API-KEY` header. Gelato does not offer user-created OAuth apps for this API.

## Known gaps

- Paths for prices and stock were not exercised against a live account. Deleting draft orders is not exposed because the endpoint could not be verified. `catalog.coverDimensions` takes `pageCount` as optional, as in the community spec.
- The vendor docs site blocks automated fetching, so field lists in tool descriptions are not exhaustive; unknown body fields are passed through as given.
- Webhook management is not exposed (Gelato configures webhooks in the dashboard).
- The icon is the Gelato mark from the official GelatoAS GitHub organisation avatar (460px PNG), as no SVG was reachable.
