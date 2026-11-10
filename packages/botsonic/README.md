# Botsonic

Manage Botsonic (Writesonic) AI chatbots: create, list and delete bots, upload knowledge base text, files and URLs, manage FAQs and starter questions, read conversations, end chats and generate chatbot responses. 24 tools; the 14 mutations and `get_bot_api_key` (which returns a bot's secret API key) require approval.

## Interface

OpenAPI. Botsonic's own FastAPI document, https://api.botsonic.ai/openapi.json (docs: https://docs.botsonic.com), is loaded live. Origin: `https://api.botsonic.ai`.

## Auth

Two API key methods, both listed as "Business Access Required" by Botsonic:

- **User API key** (`USER-API-KEY` header): bot management (list, get, create, delete bots, fetch a bot's API key). Create it in Botsonic under User Menu > API Dashboard > Tokens.
- **Bot API key** (`X-BOT-KEY` / `token` headers): everything scoped to one bot (data, FAQs, starter questions, conversations, chat generation). Find it under Bot > Share > Get REST API > API Token.

Each key only works on its own endpoints; add one account per key you need. No OAuth is offered by Botsonic.

## Known gaps

- `upload-file` takes JSON (`id`, `bot_id`, `file_url`, optional `file_name`); Botsonic fetches the file from `file_url`, so the file must be reachable at a URL. No file body is sent.
- Streaming responses from `/v1/business/botsonic` are returned as a single result.

## Notes

- Header mapping follows the vendor spec: `USER-API-KEY` for `/v1/business/bot*` management, `X-BOT-KEY` for bot-data, FAQ, starter question and conversation endpoints, `token` for `/v1/botsonic/generate`.
- `get_bot_api_key` is a GET but returns a bot's secret API key, so it is approval-gated like the mutations.
