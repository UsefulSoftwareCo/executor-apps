# PayChasers

Manage clients and payment chases in [PayChasers](https://www.paychasers.com): list and create clients, list and create chases, send follow-ups, mark chases paid, and (Enterprise) bulk-create chases. Mutations require approval.

## Interface

Custom tools over the REST API documented at https://www.paychasers.com/docs/api (base URL `https://paychasers.com/api/v1`). PayChasers publishes no OpenAPI document, so the 8 tools are hand-written from that page. Responses are returned as raw JSON because the docs give no response schemas except for `/me`.

## Auth

API key only. Create it in PayChasers under Settings, API Key (the key starts with `pck_` and is shown once). It is sent as `Authorization: Bearer <key>`. PayChasers offers no OAuth.

## Known gaps

- No delete endpoints for clients or chases exist in the API.
- Bulk creation is Enterprise only; other plans get 403.
- Follow-ups are limited to 10 per hour. Webhooks (Enterprise) are not exposed.
- The icon is the site's official 1080px app icon (`orange-paychaser.png`); the vendor publishes no SVG.
