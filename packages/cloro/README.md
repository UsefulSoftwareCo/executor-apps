# Cloro

Extract structured data (parsed answer, cited sources, brand entities, shopping results, ads) from ChatGPT, Gemini, Grok, Perplexity, Microsoft Copilot, Google AI Mode and Google Search, plus Cloro's async task queue, country list and credit balance.

Interface: Cloro's official OpenAPI 3.1 document, https://cloro.dev/docs/api-reference/openapi.json, compiled live against `https://api.cloro.dev`.

Auth: API key only (sent as a bearer token). Create one in the dashboard at https://dashboard.cloro.dev/api-keys. Cloro offers no OAuth. Keys are unscoped, and every monitoring call consumes credits, so all POST/DELETE operations require approval.

Health check: `GET /v1/credits`.

Known gaps: none known; tool coverage follows the published spec.
