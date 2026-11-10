# Simla.com

Simla.com (formerly RetailCRM) CRM: orders, customers, corporate customers, products and inventory, payments, delivery, tasks, costs, custom fields, telephony, users and reference data, through the Simla.com REST API v5.

**Interface:** OpenAPI. Simla.com publishes its official OpenAPI 3 definition only inside the page https://rest-api-docs.simla.com/v5/ (no standalone file URL), so `document.json` is that definition, extracted verbatim except that two component schemas (`mixed`, `Classes`) the docs generator serialized as empty arrays are empty objects. 196 tools (108 mutations, which ask for approval). The 24 skipped operations are the partner-integration callbacks that Simla.com calls on a partner's own server (delivery, payment, telephony and similar modules), not part of the account API.

**Auth:** API key. Create one in Simla.com in the API key management section of the system administrative settings (under Integration), choose the methods and stores it may use, and enter it with your account host (for example `mycompany.simla.com`). The key is sent in the `X-API-KEY` header to that host only. The host must be a single label before `.simla.com` (for example `mycompany.simla.com`); multi-level hosts are not accepted.

**Known gaps:** OAuth is not offered; Simla.com has no user-created OAuth apps for the REST API. Only `*.simla.com` hosts are accepted; legacy RetailCRM domains are not. When a key covers several stores, many methods need the store code in the `site` parameter.
