# SendPulse

SendPulse is a multichannel marketing platform. This package covers email campaigns and mailing lists, SMTP
transactional email, SMS, Viber, web push, pop-ups, email verification, CRM, Automation 360, education, the
file manager, LiveChat, and the Facebook Messenger, Instagram, Telegram, TikTok, Viber and WhatsApp chatbot
services, about 630 tools in total.

## Interface

OpenAPI. SendPulse publishes one official OpenAPI document per service, indexed at
https://api.sendpulse.com/.well-known/openapi/index.yaml (for example `.../crm.yaml`, `.../bulk-email.yaml`).
All 19 are mounted in one router, each under its own key: `email`, `smtp`, `sms`, `viber`, `webPush`, `popups`,
`verifier`, `crm`, `automation360`, `education`, `fileManager`, `liveChat`, `chatbots`, `facebook`,
`instagram`, `telegram`, `tiktok`, `viberChatbots` and `whatsapp`. Every mutation asks for approval.
The documents name their bearer scheme inconsistently (`oauth2`, `outh2`, `oAuth2ClientCredentials`);
`openapi.ts` declares each name as the same bearer header.

## Auth

- API key: a static key that never expires, created in SendPulse under Account settings, API
  (https://login.sendpulse.com/settings/#api; up to 5 keys). Sent as `Authorization: Bearer <key>`.
- OAuth client credentials: the REST API ID and secret from the same page, exchanged at
  `https://api.sendpulse.com/oauth/access_token` for one-hour bearer tokens. There is no browser redirect and
  no redirect URI to register.

## Known gaps

- Two Facebook operations (`/contacts/sendText` and `/campaigns/send`) have no tool. Their request schemas point into a schema property (`#/components/schemas/Campaign/properties/message_notification_type` and `.../message_tag`), which exists in the vendor document but which the framework cannot follow, so it skips them as `schema_reference`. The vendor spec is not broken; the tools are missing only for this reason.
- Operations that need a chatbot or project the account has not created return the service's own error.
