# BaseLinker

Covers BaseLinker (now branded Base.com), the e-commerce operations hub: orders and order returns, inventory catalogs, products, prices and stock, purchase orders, invoices and receipts, couriers and packages, external storages and macros.

## Interface

Custom tools. BaseLinker publishes no OpenAPI, GraphQL or MCP interface; its API is a single RPC endpoint (`POST https://api.baselinker.com/connector.php`, form fields `method` and a JSON `parameters` string). Docs: https://api.baselinker.com/. Each of the 203 tools maps to one method in the vendor's method index (https://api.baselinker.com/, 203 methods as of 2026-10-12) and takes a `parameters` object holding that method's documented fields. The package covers every indexed method; none are excluded. `addCategory` and `getStoragesList`, which appear in the docs only inside the tester's example JSON, are not exposed. No official OpenAPI or MCP server was found; the docs describe only the RPC endpoint. Read methods (`get*`) are queries; everything else is a mutation and needs approval. Errors (HTTP 200 with `status: "ERROR"`) are raised as tool errors.

## Auth

API token (`X-BLToken` header). Create it in BaseLinker under Account & other > My account > API. BaseLinker has no OAuth for users. The API limit is 100 requests per minute per token.

## Known gaps

- Tool inputs are a free-form `parameters` object, not per-method typed schemas.
- Methods BaseLinker adds after 2026-10-12 will be missing until the list is updated.
- Icon is Base.com's official 512px app icon (no SVG published).
