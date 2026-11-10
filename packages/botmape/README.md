# BotMape

Manage BotMape AI agents: create and update agents, chat with them, curate their knowledge base, read conversations and messages, and pull usage analytics (15 tools).

**Interface:** hand-written tools over BotMape's REST API at `https://botmape.com/api`. BotMape publishes no OpenAPI document; the 15 endpoints and their parameters were read from the API documentation that ships inside BotMape's web app bundle (https://botmape.com/assets/index-CBmxStTw.js, the endpoint table near the "Send Message" entry), which renders at https://botmape.com/api-docs. That page is a client-rendered app, so fetching it as plain HTML returns only the app shell.

**Auth:** API key. Create one in the BotMape dashboard (API keys, keys start with `bm_`). It is sent in the `X-API-Key` header; the API also accepts it as a Bearer token. BotMape offers no user-created OAuth apps.

**Icon:** the hexagon mark cropped (no wordmark) from BotMape's official 1024px app icon (https://botmape.com/favicon.png); the vendor publishes no SVG.

**Known gaps:** BotMape advertises 60+ endpoints, but only these 15 are documented as the public API. The web app bundle references other routes (leads and their CSV export/transcribe routes, appointments, contact, unanswered chatbot questions and their resolve route, train-url, upload-pdf, developer keys). They are undocumented, so it is unknown whether they accept an API key, and they are not included. Responses are returned as untyped JSON because the docs give examples, not schemas. Not verified against a live key.
