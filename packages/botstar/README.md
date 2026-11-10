# BotStar

Manage BotStar chatbots: list, create and publish bots, bot attributes, per-user attributes, CMS entities, fields and items, and send messages to bot users.

Interface: OpenAPI, from BotStar's official Public API document at https://apis.botstar.com/docs/public-api.yaml (docs: https://apis.botstar.com/docs/). The document lists the staging server; the package overrides the base URL to `https://apis.botstar.com/v1`, the production server the docs page itself uses.

Auth: API token (`apiKey`), sent as a bearer token. Copy it from https://app.botstar.com/account/profile (API Token). The token is account-level; call the list-bots tool to find the bot ID other tools need. BotStar offers no OAuth for third-party apps.

Known gaps: the public API covers bots, attributes, publishing, users, CMS and messages only. Bot flow design, analytics and the Livechat API are not exposed. The official document has 25 operations.
