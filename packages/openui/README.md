# OpenUI Cloud

Covers the OpenUI Cloud (Thesys) Gateway: non-streaming chat completions and Responses calls that generate UI (OpenUI Lang), the Conversations API (conversations and their items), and frontend token minting. 11 tools: `chat.complete`, `responses.create`, `conversations.{list,create,get,update,delete}`, `conversations.items.{list,add,get,delete}`, `frontendTokens.create`.

**Interface:** hand-written tools against `https://api.thesys.dev/v1`, from the docs at https://www.openui.com/docs/gateway/ (conversations, responses, chat-completions, authentication). OpenUI publishes no OpenAPI document and no official MCP server. Every mutation requires approval; generation calls are mutations because they cost tokens and `responses.create` can store state.

## Auth

- **API key** (`apiKey`): create one in the Thesys Console at https://console.thesys.dev/keys. It is sent as `Authorization: Bearer <key>`. There is no OAuth.

## Known gaps

- Streaming is not exposed; calls are forced to `stream: false`.
- Responses retrieval, models listing and the CLI-minted key flow are not documented as REST endpoints and are not included.
- The legacy C1 `visualize` endpoint is omitted.
- Request bodies are loosely typed (the docs give no full schemas). Not verified against a live account.
