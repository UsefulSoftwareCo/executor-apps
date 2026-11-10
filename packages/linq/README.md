# Linq

Send and manage iMessage, RCS, SMS and WhatsApp conversations through the Linq Partner APIs: chats, messages, reactions, polls, attachments, phone numbers, blocked handles, webhooks, capability checks, contact cards, location sharing, payments and WhatsApp templates.

**Interface:** OpenAPI, loaded live from Linq's official documents, mounted as two providers in one router:

- `imessage` (iMessage, RCS, SMS): https://cdn.linqapp.com/openapi/linq-api-v3.yaml (linked from https://docs.linqapp.com/llms.txt), base URL `https://api.linqapp.com/api/partner`. 70 tools.
- `whatsapp` (WhatsApp Messages Partner API v1, beta): https://whatsapp.messages.api.linqapp.com/v1/openapi.yaml (linked from https://docs.linqapp.com/channel/whatsapp/llms.txt), base URL `https://whatsapp.messages.api.linqapp.com`. 26 tools.

**Auth:** each provider takes an API token (`apiKey`), sent as `Authorization: Bearer <token>`.

- iMessage/RCS/SMS: generate the token at https://dashboard.linqapp.com/api-tooling (API, Overview, Generate new token), per https://docs.linqapp.com/channel/imessage/getting-started/authentication.
- WhatsApp: a separate key bound to one brand, issued by Linq at WhatsApp onboarding (your integration contact); it does not work on the other API.

No OAuth is documented by Linq, so there is no OAuth method. All mutations require approval, as does `getPaymentCredentials` (a GET that returns the handoff token for revealing card credentials).

**Known gaps:** The WhatsApp `GET /v1/streams/events` server-sent-event stream is not exposed as a tool (use the event log or webhooks). The icon is Linq's official 180px app icon (no SVG is published).
