# Telegram

Runs a Telegram bot through the Bot API: send text, photos, documents, video, audio, voice, stickers, locations, contacts and polls; edit, forward, copy, pin and delete messages; answer callback queries; read and administer chats, members and invite links; fetch file metadata; and set or remove webhooks or poll updates.

**Interface:** custom tools written with `fetch` against the official Telegram Bot API at `https://api.telegram.org/bot<token>/<method>` (docs: https://core.telegram.org/bots/api). Telegram publishes no OpenAPI document, no GraphQL API and no MCP server for the Bot API, so the 45 most useful methods are hand-written, grouped as `bot`, `updates`, `messages`, `chats` and `files`. Every tool except the reads (`getMe`, `getMyCommands`, `getWebhookInfo`, `chats.get*`, `files.*`) requires approval. `updates.getUpdates` is a mutation because it consumes updates.

**Auth:** bot token only (`apiKey`). Message @BotFather on Telegram, run `/newbot` (or `/token` for an existing bot) and paste the token. Telegram offers no OAuth for bots. The token is placed in the request path, which is how the Bot API authenticates; only `api.telegram.org` receives it. The health check calls `getMe`.

**Gaps:** file upload by multipart is not supported (pass a `file_id` or a public HTTPS URL), nor are downloads of file contents (the file link embeds the token), inline mode, payments, stickers set management, forum topic management, business and games methods. User-account (MTProto) and the Gateway API are separate products and are not covered.
