# Hyperbrowser

Cloud browsers for AI agents. Covers browser sessions (create, stop, update, recordings, downloads, CAPTCHA evaluation), profiles, scrape (single and batch), crawl, extract, browser agent tasks (HyperAgent, Browser Use, CUA and the Claude, Gemini, Meta and Grok computer-use agents), web fetch/search/crawl, extensions, and sandboxes with volumes, images and snapshots.

Interface: OpenAPI, the vendor's official document at https://www.hyperbrowser.ai/docs/openapi.json (the docs.hyperbrowser.ai URL redirects there). 91 tools, 46 of them mutations (all require approval). The document has no operationIds, so tool names are generated from tags, methods and paths.

Auth: API key only. Create one in the Hyperbrowser dashboard (https://app.hyperbrowser.ai) under API Keys. It is sent as the `x-api-key` header to `api.hyperbrowser.ai`. Hyperbrowser has no user-created OAuth apps.

Known gaps: the `/x402/*` pay-per-call endpoints are removed because they are authorised by on-chain payment rather than an API key (two session-management operations using that token are skipped). The `hyperbrowser-mcp` package is local-only (stdio) and is not used.

Icon: the official app icon (192px PNG) published with the Hyperbrowser docs.
