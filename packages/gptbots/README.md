# GPTBots

Chat with a GPTBots enterprise AI agent and manage what it uses: conversations and messages, knowledge bases, documents and similarity search, database tables, user attributes, workflows and credit analytics. 35 tools in six groups (`conversations` 9, `knowledge` 14, `database` 4, `users` 2, `workflows` 2, `analytics` 4).

## Interface

Hand-written tools over the GPTBots REST API ([API reference](https://www.gptbots.ai/docs/api-reference/overview)). GPTBots publishes no OpenAPI document, so each tool was written from its endpoint page. Hosts are `api-sg.gptbots.ai`, `api-jp.gptbots.ai` and `api-th.gptbots.ai`. Mutations require approval. `sendMessage` uses blocking mode only; streaming and webhook responses are not exposed.

## Auth

Agent API key (Bearer) plus the region of your data center (`sg`, `jp` or `th`). In GPTBots open the agent, go to Agent Integration, Development-API Service, enable it and choose "Create APIKey". A key belongs to one agent, so all tools act on that agent. No OAuth is offered. Free plans are limited to 3 requests per minute.

## Known gaps

- Not included: agent and workflow version import/release/rollback, spreadsheet document add/update and text document update (the add-text endpoint itself is included, taking `file_url` or inline `file_base64`), Q&A chunk endpoints, metadata field create/update/delete, knowledge base sync (Google Drive only), user ID binding and CDP (documented on a different host form), human handoff, text/voice model endpoints, and the account-level APIs that use the developer key and secret (model list, organization and API key management).
- Binary multipart file uploads are not offered; documents are added by URL or base64 in JSON.
- Icon: the 800x800 square app mark at `https://res.srcgptbots.com/aigc/image/favicon.png` (GPTBots' own CDN; despite the file name it is the full-size mark, not a 16/32px favicon).
