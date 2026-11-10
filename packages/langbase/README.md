# Langbase

Run and manage Langbase AI agents: pipes, memory sets and documents, threads and messages, web search, crawl, parser, chunker, embeddings, agent runs and traces.

Interface: Langbase's official OpenAPI document, https://api.langbase.com/openapi.json (OpenAPI 3.0, host `api.langbase.com`).

Auth: API key only (Langbase has no OAuth for third-party apps). Create a user or org API key by opening your personal profile page (or the organization profile page for an org key), choosing "API keys" in the sidebar, and clicking "Generate API Key" in the User API Keys (or Org API Keys) section; it is sent as a Bearer token. Note that a pipe's own API key is a different, pipe-scoped key; use a user or org key for account-wide tools.

Known gaps: LLM provider keys for pipe runs are passed per request via the `LB-LLM-KEY` header where the spec declares it; otherwise the keys stored in your Langbase account are used. Streaming responses are returned buffered.
