# AI21 Studio

Covers AI21 Studio on `https://api.ai21.com`: Jamba chat completions, Maestro runs, the file library, assistants and routes, stored secrets, MCP storage, website connector, structured RAG, plus the Gateway/TokenWise settings and analytics endpoints that the same document publishes.

Interface: OpenAPI 3.1, AI21's own document at https://api.ai21.com/openapi.json (135 tools, 62 mutations, none skipped; 76 of the document's 211 operations are removed, see Known gaps). The document declares no servers or security schemes, so the package sets the base URL and a bearer scheme itself.

Auth: API key only. Create one in AI21 Studio under Settings, API keys (https://docs.ai21.com/docs/create-api-key). It is sent as `Authorization: Bearer <key>`. AI21 does not offer user-created OAuth apps.

Known gaps: the package removes these routes from AI21's document. The catch-all proxies (`/gateway` and `/tokenwise` under `v1`, `v1beta`, `off/v1`, `on/v1`, plus the malformed `v1internal{path}` templates) declare an `X-AI21-Key` header and AI21's authentication docs describe only Bearer, so they are unverified with a Bearer key (they also publish OPTIONS verbs). `/harness/api/{path}` and `/harness/api/auth/cli-config` are internal. `/gateway/settings/provider-keys` and `/tokenwise/settings/provider-keys` manage stored provider credentials. `/solutions/tlv_municipality/convrag` and `/solutions-preview/tlv_municipality/convrag` are customer-specific demos. The remaining Gateway/TokenWise settings, insights and analytics routes and `/demos` may still reject ordinary keys. Health check lists library files.

Icon: the official 512px favicon from https://www.ai21.com/wp-content/uploads/2026/01/favicon.png (the AI21 "a" mark). AI21 Studio has no separate product mark, so the company mark is accepted as the product's own; the SVG on the site is a wordmark that vanishes on the dark variant.
