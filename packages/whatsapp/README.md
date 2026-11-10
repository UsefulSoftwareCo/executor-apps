# WhatsApp

WhatsApp Business Platform (Cloud API) through the Meta Graph API (v25.0): send text, template, media, location, contact, interactive and reaction messages, mark messages read, manage phone numbers (verify, register), business profiles, message templates, QR codes, Flows, blocked users, WABA analytics and webhook subscriptions. WhatsApp Business accounts only; personal WhatsApp accounts are not supported by the API.

**Interface:** hand-written tools over the Graph API (`https://graph.facebook.com/v25.0`). Meta publishes no OpenAPI document or official remote MCP server for the WhatsApp Business Platform (docs: https://developers.facebook.com/docs/whatsapp/cloud-api). 49 tools; every mutation requires approval.

## Auth

- **Access token (`token`)**: a system user or user access token with `whatsapp_business_messaging` and `whatsapp_business_management`. Create a Meta app with the WhatsApp product at https://developers.facebook.com/apps, then generate a permanent token from a system user in Meta Business Settings (https://business.facebook.com/settings/system-users).
- **OAuth (`oauth`)**: Facebook Login with your own Meta app. Paste the App ID and App Secret, and add the Executor redirect URI shown on the connect page to "Valid OAuth Redirect URIs". Scopes: `whatsapp_business_management`, `whatsapp_business_messaging` (messaging depends on management).

## Caveats

- OAuth is unconfirmed end to end: the scopes are valid Meta permissions per https://developers.facebook.com/docs/permissions/ (`whatsapp_business_messaging` depends on `whatsapp_business_management`), but Meta's Cloud API getting-started guide documents only system user tokens. For assets you do not own, Meta requires App Review (and Business Verification for Advanced Access); your own app's admins/testers can use the scopes in development mode. Prefer the system user token; test OAuth on your own Executor before relying on it. The token request is a POST form (client_secret_post), whereas Meta's manual-flow doc shows GET.
- Graph API version is pinned to v25.0 (supported until July 2028); v26.0 exists and can be adopted by changing `base` and `authorizationUrl`.

- OAuth tokens from Facebook Login are short-lived and there is no exchange hook, so for durable use connect with a system user token.
- Tools take a `phoneNumberId` (Cloud API phone number ID, not the display number) or `wabaId`.
- Free-form messages only deliver inside the 24-hour customer service window; use `messages.sendTemplate` otherwise.

## Known gaps

Uploading media from local files (`/{phone-number-id}/media` multipart) is not covered; send media by public `link`. Flow JSON authoring and asset upload, catalog/product management, payments, calling, and receiving webhooks (messages arrive via webhooks, which Executor does not host here) are not covered.
