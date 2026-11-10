# Transporeon Carrier Interface

Carrier-side access to Transporeon (Trimble Transporeon): transports, offers and placed offers, bookings, deliveries and delivery items, status updates, attachments, price items, shipment confirmations and settlements.

Interface: Transporeon's official OpenAPI 3.1 document, `https://xch.transporeon.com/carrier_interface/openapi/v1/swagger.json`, loaded live. Mutations require approval.

Auth: four methods, because the production and test environments are separate hosts.
- `basic` (production, `xp.transporeon.com`): the Carrier Interface username (format `user@companyId`) and password that Transporeon issues for your carrier account.
- `oauth` (production): OAuth 2.0 client credentials, scope `carrierintegration`, token URL `https://api.transporeon.com/oauth2/token`, client authentication via HTTP Basic. The client ID is the same `user@companyId` and the secret is the password.
- `basicTest` and `oauthTest` (test, `xp.test.transporeon.com`, token URL `https://api.test.transporeon.com/oauth2/token`): the same two methods against the test environment. The public sandbox login `demo@123` / `demo` only works there.

Known gaps: the separate Transporeon Appointment Scheduling (yard management) API is not covered. OAuth accounts are not health-checked beyond the token exchange.
