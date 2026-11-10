# Tave

Tave (now VSCO Workspace) is studio management software for photographers. This package covers its public REST API v2: address book contacts, brands, custom fields, discounts, events and event types, files, jobs, orders, payments, invoices, contracts and more (151 tools, 82 of them mutations, each of which asks for approval).

Interface: OpenAPI, from the vendor's official document at https://workspace.vsco.co/api/v2/openapi.json (also served at https://tave.io/v2/openapi.json, which redirects to the same API). Calls go to `https://workspace.vsco.co/api/v2`.

Auth: API key. In Tave/VSCO Workspace open Settings > API Integrations and choose New API Key (the default permission is Read and Write; pick a narrower permission when you only need reads). The key is sent as a bearer token. The API has no OAuth.

Notes and gaps:

- The official document `$ref`s into another schema's properties in a few places, which the importer rejects. `openapi.ts` patches those references into named `PhoneNumber` and `TaxLine` schemas; no operations are lost.
- The icon is Tave's own app icon (256px PNG, the leaf-and-"a" mark), taken from the Internet Archive capture of tave.com's apple-touch-icon (2024-12-27). VSCO acquired Tave in 2025 and now serves tave.com with the VSCO mark; that parent-company mark is deliberately not used. The VSCO Workspace product publishes no separate mark of its own that we found.
