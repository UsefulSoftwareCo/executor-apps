# BotPenguin

Manages BotPenguin inbox contacts (list with filters, bulk import, mark deleted), lists segments, and sends WhatsApp template and plain or image messages through a connected WhatsApp bot.

**Interface:** custom tools written with `fetch` against the official API at `https://api.v7.botpenguin.com`, following the vendor's API documentation at https://help.botpenguin.com/api-documentation/contacts-and-chats-apis.md and https://help.botpenguin.com/api-documentation/whatsapp-cloud-api.md. BotPenguin publishes no OpenAPI document, GraphQL API or MCP server. Tools: `segments.list`, `contacts.list`, `contacts.import`, `contacts.delete` (account token) and `templates.list`, `templates.send`, `messages.send` (WhatsApp bot key). Every mutation requires approval.

**Auth:** BotPenguin has two separate credentials and no OAuth, so the app offers two account types.
- *API access token*: in BotPenguin, More, Developer, second tab "API Access Token" (https://help.botpenguin.com/developers-guide/api-access-token). Sent as `Authorization: Bearer <token>` with `authtype: Key`. One token per user, covers all bots.
- *WhatsApp bot API key*: pick the bot, Settings, API Key tab, Generate API key (https://help.botpenguin.com/bots/whatsapp-bot/whatapp-chatbot-settings/api-key-settings). Sent as the `apiKey` header and query parameter. The key belongs to one bot, so connect one account per bot.

Connect whichever account type you need; the available tools depend on which one is connected.

**Known gaps:** the chats/leads listing (`/inbox/direct/chats`) and lead update (`/inbox/direct/lead`) endpoints use an `x-bot-token` / `x-bp-token` that the docs say must be requested from support@botpenguin.com, so they are not exposed. The WhatsApp-bot listing and template dynamic-field tools have no documented vendor endpoint and are not exposed. Account type health checks call the segments (token) or templates (WhatsApp key) list and only verify a successful response; the exact failure shape of BotPenguin's API is not documented.
