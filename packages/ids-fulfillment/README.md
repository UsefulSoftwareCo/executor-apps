# IDS Fulfillment

Covers the IDS Fulfillment (DHL Supply Chain 3PL) public API: ship requests and order lookup, inventory receipts, stock adjustments, item master data, storer inventory and WMS order status, with preview endpoints.

Interface: OpenAPI, from the vendor's own Swagger document at https://api.idsfulfillment.com/swagger/v1/swagger.json (swagger UI at https://api.idsfulfillment.com/swagger). The document declares no security scheme or servers, so the package declares an `ApiKey` header scheme and pins the origin to `https://api.idsfulfillment.com`.

Auth: API key only (`apiKey`), sent in the `ApiKey` header. IDS issues the key during customer onboarding; ask your IDS account contact. IDS does not offer OAuth. Optional warehouse code and customer number values are not collected, as the public spec does not use them.

Known gaps: every mutation (POST) requires approval. The API is only usable by IDS customers; the health check lists one item.
