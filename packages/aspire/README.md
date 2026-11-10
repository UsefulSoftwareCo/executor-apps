# Aspire

Covers Aspire Software, the landscaping and field-service ERP (not .NET Aspire): properties, contacts, companies, opportunities, services, work tickets and visits, invoices, payments, receipts, vendors, catalog items, equipment, pay rates, clock times, attachments and more, 164 tools in all (65 mutations, each requiring approval).

Interface: OpenAPI 3.0, Aspire's official External API document at https://cloud-api.youraspire.com/swagger/v1/swagger.json (API guide: https://guide.youraspire.com/apidocs). List tools accept the OData options ($filter, $select, $orderby, $expand, $top, $skip). The `/Authorization` token endpoints are used internally and not exposed as tools.

Auth: one method, API Client ID and secret. An Aspire user with Admin permission creates them in Aspire (API access is included with Enterprise; Corporate and Growth tiers can request it through AspireCare). When connecting, enter the environment (`production` or `sandbox`), the Client ID and the secret. Executor exchanges them for a bearer token at `/Authorization` on `cloud-api.youraspire.com` (or `cloudsandbox-api.youraspire.com`) and mints a new one when a call returns 401. This is done in code rather than with the `oauth2` method because Aspire uses a JSON token exchange, not OAuth. There is no OAuth app to register and no redirect URI.

Known gaps: no webhooks. Which calls succeed depends on the API user's permissions in Aspire. The icon is the product icon from Aspire's own site (vendor SVG).
