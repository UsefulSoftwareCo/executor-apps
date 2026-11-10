# Square

Payments, orders, customers, catalog, inventory, invoices, subscriptions, loyalty, gift cards, bookings, team and the rest of the Square Connect API (322 tools, production host `connect.squareup.com`).

**Interface:** OpenAPI, Square's official document at https://raw.githubusercontent.com/square/connect-api-specification/master/api.json. The document declares its OAuth scheme as `oauth2`; `openapi.ts` overrides it as a bearer scheme because Square accepts both personal access tokens and OAuth tokens as `Authorization: Bearer`.

**Auth**

- Personal access token (`token`): copy it from the Square Developer Console, Applications, your app, Credentials (production access token).
- OAuth (`oauth`): create an application in the Square Developer Console, open OAuth, and copy the application id (client id) and secret. Add the Executor redirect URI shown on the connect page under Redirect URL. Square token exchange uses a JSON body, and tokens expire after 30 days (refresh tokens are issued).

The requested OAuth scopes cover the generated tools except those needing administrative or spec-undefined scopes. These tools are PAT-only (or need extra scopes in a custom app): channel create/update (`CHANNELS_CREATE`, `CHANNELS_UPDATE`), device codes (`DEVICE_CREDENTIAL_MANAGEMENT`: ListDeviceCodes, CreateDeviceCode, GetDeviceCode), add-on configurations (`ADDON_CONFIGURATIONS_*`), bank account create/disable (`BANK_ACCOUNTS_WRITE`, not defined in the spec's scope table), and the online-checkout merchant-settings get/update (`PAYMENT_METHODS_READ`, also not in the spec's scope table).

**Known gaps**

- 10 operations are skipped: one because the document is invalid for that operation and nine that reference missing components in the published document.
- Sandbox (`connect.squareupsandbox.com`) is not supported; tools target production only.
- Requests send `Square-Version: 2026-09-16`, the default declared in the spec, so responses match the compiled tools. The spec URL tracks the `master` branch, so the tool set can change when Square republishes it.
- Read-only POST operations (searches, batch retrieves) are classified by HTTP method and therefore require approval like mutations.
