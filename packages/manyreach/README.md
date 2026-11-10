# ManyReach

Cold email outreach with ManyReach: campaigns and sequences, prospects, lists, senders (mailboxes), messages and replies, blacklists, tags, subaccounts (clientspaces) and domain/mailbox orders.

**Interface:** OpenAPI. ManyReach publishes its API v2 as a Swagger 2.0 document, linked from https://api.manyreach.com and served at https://api.manyreach.com/swagger/docs/v2. Mutations require approval.

**Auth:** API key (`X-API-Key` header, sent only to `api.manyreach.com`). Create an API key in your ManyReach account settings. ManyReach has no OAuth for third-party apps.

**Icon:** ManyReach's official app icon (apple-touch-icon from app.manyreach.com), since it publishes no SVG.

**Known gaps:** Rate limit is 60 requests/min by default (300 on higher plans). The Orders endpoints (`/api/v2/orders*`) are main-account only and return 403 MAIN_ACCOUNT_REQUIRED for other keys. No official MCP server endpoint was found, so this package uses the OpenAPI document.
