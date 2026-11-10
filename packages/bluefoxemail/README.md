# BlueFox Email

Covers BlueFox Email's project API: transactional and triggered emails and sending, campaigns, templates, contacts and fields, segments, subscriber lists and subscriptions, signup forms, domains, sender identities, webhook, suppression list, production access and test emails.

Interface: OpenAPI 3.0, the vendor's live spec at https://api.bluefox.email/v1/openapi.json (linked from https://bluefox.email/docs/api/). Tools are generated from it at runtime.

Auth: a project API key (`apiKey`), sent as `Authorization: Bearer <key>`. Create it in the BlueFox app under Project Settings > API Keys. The connect form also asks for the Project ID (Project Settings), which most endpoints take as the `projectId` path parameter and which the health check uses. BlueFox has no OAuth for third-party apps.

Gaps: the per-subscriber `SubscriptionToken` bearer scheme (used by custom preference pages) is not supported; only the API key is. The legacy flat-URL endpoints are included as the spec lists them. BlueFox's open-source MCP server is a local stdio process, not a remote server, so it is not used.

Icon: the official logo from bluefox.email (1300px RGBA PNG, `bluefoxemail-logo.png`); the vendor publishes no SVG.
