# ShipBob

Orders, products and variants, inventory, shipments, returns, warehouse receiving, channels, locations, invoices and transactions, and webhooks on ShipBob's fulfillment platform.

**Interface:** OpenAPI. ShipBob's official 2026-07 API document, https://marketplaceapi.shipbob.com/docs/2026-07.json (linked from https://developer.shipbob.com). Tools go to `https://api.shipbob.com`, or `https://sandbox-api.shipbob.com` when the account's environment is `sandbox`.

**Auth:** Personal access token. In the ShipBob dashboard open Integrations > API Tokens and choose Generate New Token (sandbox accounts are created at https://webstage.shipbob.dev/app/merchant/#/SignUp). Enter the token and pick `production` or `sandbox`.

**Known gaps:** ShipBob's OAuth2 authorization-code flow is declared in the document but is for registered partner applications, not user-created OAuth apps, so it is not offered. Only the 2026-07 API version is exposed.
