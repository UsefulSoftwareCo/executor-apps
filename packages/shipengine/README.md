# ShipEngine

Covers the ShipEngine (now branded ShipStation API) shipping API: carriers, rates, labels, shipments, batches, tracking, address validation, warehouses, package types, manifests and webhooks.

Interface: OpenAPI, from the vendor's official repository, https://raw.githubusercontent.com/ShipEngine/shipengine-openapi/master/openapi.yaml, all calls to https://api.shipengine.com. Every mutation requires approval.

Auth: API key only. ShipEngine has no user-created OAuth apps. Create a key in the ShipStation API dashboard (dashboard.shipengine.com), choosing the Production or Sandbox environment (sandbox keys start with `TEST_`); it is sent in the `API-Key` header.

Known gaps: the Partner/Carrier-onboarding endpoints need partner-level keys. Connected-account checks use `GET /v1/carriers`. This package does not cover the legacy ShipStation v1 API (ssapi.shipstation.com).

Skipped operations: the spec has 97 operations; 80 became tools and 17 were skipped, all with code `schema_reference`. The vendor schema `international_shipment_options` references `#/components/schemas/Allowed incoterms`, a component name containing a space, and the Executor OpenAPI compiler cannot resolve it, so every operation whose request or response embeds that schema is skipped: `GET/POST /v1/labels`, `GET /v1/labels/external_shipment_id/{id}`, `GET /v1/labels/{label_id}`, `POST /v1/labels/rates/{rate_id}`, `POST /v1/labels/rate_shopper_id/{id}`, `POST /v1/labels/shipment/{id}`, `POST /v1/labels/{label_id}/return`, `POST /v1/labels/{label_id}/cancel_refund`, `POST /v1/rates`, `POST /v1/rates/bulk`, `GET/POST /v1/shipments`, `GET /v1/shipments/external_shipment_id/{id}`, `PUT /v1/shipments/recognize`, and `GET/PUT /v1/shipments/{shipment_id}`. Label creation, rate calculation and shipment create/get/update are therefore not available; carriers, tracking, address validation, batches, warehouses, package types, manifests and webhooks are.

No official ShipEngine MCP server was confirmed (a web search for one could not be run in this pass); the OpenAPI is the only interface used.
