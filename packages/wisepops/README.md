# Wisepops

Covers the Wisepops REST API: popup campaigns with display/click/email counts, collected contacts, webhooks (list, create, delete) and GDPR/CCPA data-privacy deletion.

Interface: hand-written tools over the official API documented at https://support.wisepops.com/en/articles/9897479-wisepops-api-documentation and https://support.wisepops.com/en/articles/9897509-webhooks (Wisepops publishes no OpenAPI document, GraphQL API or MCP server).

Auth: API key only. The key is tied to one website, so connect one account per website. It is sent as `Authorization: WISEPOPS-API key="..."`. Wisepops only offers API access on Custom plans; ask Wisepops support/Customer Success for a key. Wisepops has no OAuth.

Known gaps: the API is reporting-oriented, so popups cannot be created or edited. The default quota is 1,500 calls per 30 days; webhooks do not count against it. The webhook list response and delete response are undocumented, so list returns the raw JSON.

Quota note: the connection health check calls `GET /wisepops`, which costs one call from the 1,500 calls per 30 days quota. Wisepops documents no cheaper endpoint.

Icon: the vendor's SVG app icon at https://wisepops.com/favicon.svg (lime tile with black mark), used unchanged for light and dark. Wisepops publishes no separate mark logo (its only other SVG is a white wordmark).
