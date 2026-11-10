# Avalara

Calculate and manage sales and use tax with Avalara AvaTax: create and adjust transactions, tax calculation, companies, locations, nexus, tax codes, items, exemption certificates, addresses, filings and reports.

**Interface:** OpenAPI. Avalara serves its official AvaTax REST v2 document (Swagger 2.0) at `https://rest.avatax.com/swagger/v2/swagger.json`; tools are generated from it and call `https://rest.avatax.com/api/v2`. Every mutation requires approval.

**Auth:** account ID and license key (`apiKey`), sent as HTTP Basic auth. AvaTax also accepts the username and password of an AvaTax user in the same fields. Create a license key in the Avalara Admin Console under Settings > License and API keys (https://developer.avalara.com/avatax/authentication-in-rest/). Avalara offers OAuth only through its identity server for partner integrations, not user-created OAuth apps, so it is not offered here.

**Known gaps:** production only. The sandbox (`sandbox-rest.avatax.com`) uses separate credentials and a different host that this package does not declare. Other Avalara products (1099 & W-9, e-invoicing, Avi/MCP endpoints) are separate APIs and are not included. The health check sends an `X-Avalara-Client` header (Avalara's recommended client identifier) and validates credentials via `GET /api/v2/utilities/subscriptions`, because `/utilities/ping` returns 200 even for bad credentials; the generated tools do not set the header.

**Spec quirk:** the document lists Basic, Bearer and OAuth as a single combined requirement on every operation, so `security-patches.json` (generated from the document) narrows each operation to Basic auth. Regenerate it if Avalara adds operations.
