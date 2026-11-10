# TinyFish

Web agents for the live web: run natural-language browser automations, search the web, fetch and extract page content, run deep research, open remote browser sessions, and manage run history, browser context profiles, vault connections and the wallet.

## Interface

OpenAPI, from TinyFish's own published specs (listed in https://docs.tinyfish.ai/llms.txt), one mounted under each key:

- `agent` https://agent.tinyfish.ai/v1/openapi/main (automation, runs, profiles, vault, wallet)
- `research` https://agent.tinyfish.ai/v1/openapi/research
- `search` https://agent.tinyfish.ai/v1/openapi/search (api.search.tinyfish.ai)
- `fetch` https://agent.tinyfish.ai/v1/openapi/fetch (api.fetch.tinyfish.ai)
- `browser` https://agent.tinyfish.ai/v1/openapi/browser (api.browser.tinyfish.ai)

## Auth

API key, sent in the case-sensitive `X-API-Key` header. Create one at https://agent.tinyfish.ai/api-keys ("Create API Key"); it is shown once. TinyFish's hosted MCP server uses OAuth 2.1 and is not used here.

## Known gaps

The streaming (SSE) endpoints cannot return a stream as a tool result, so use the async or synchronous variants. Mutations (starting runs, creating profiles, spending wallet funds) ask for approval. The main spec's `POST /v1/automation/run-sse` and the research spec's `POST /v1/automation/run-research` and `GET /v1/research-run/{id}/events` are text/event-stream and are dropped by the compiler without being reported as skipped.
