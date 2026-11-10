# Presenton

Generate and export AI presentations with the Presenton Cloud API: sync and async deck generation, outlines, creating decks from JSON, exports (PPTX/PDF), standard templates, Smart Designs, file and image uploads, font checks, and webhooks.

**Interface:** OpenAPI. The official "Presenton Cloud API" document at https://docs.presenton.ai/openapi/cloud.json (24 operations, server https://api.presenton.ai). Presenton's other spec (`/api-reference/openapi.json`) is the whole internal FastAPI app including debug and billing routes, so it is deliberately not used.

**Auth:** API key. Create one on your Presenton account page at https://presenton.ai (keys look like `sk-presenton-...`); it is sent as `Authorization: Bearer <key>`. Presenton offers no user-created OAuth apps.

**Known gaps:** only the supported public Cloud API is exposed. Self-hosted Presenton instances, chat, enterprise-user management and the internal v1/v2 editing endpoints are not included.
