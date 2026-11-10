# TemplateFox

Covers the TemplateFox API: generating PDFs and images from HTML/CSS (Jinja2) templates, sync and async PDF jobs, template and version management, AI-assisted template authoring jobs, PDF merge/rotate/page extraction, S3 storage integration, and account credits and transactions (24 tools, 14 of them mutations that require approval).

Interface: OpenAPI, loaded live from the vendor's official document at https://api.templatefox.com/openapi.json (origin `https://api.templatefox.com`). The document declares only a bearer (JWT) scheme, but the API accepts API keys in the `x-api-key` header, so `openapi.ts` rebinds that scheme name to an `x-api-key` header.

Auth: API key only. Create one in the TemplateFox dashboard (https://app.templatefox.com) and paste it as the account's API key. No OAuth app is offered by the vendor. The health check calls `GET /v1/account`, which costs no credits.

Known gaps: none known; all 24 operations in the spec are exposed. Note that PDF and image generation consume account credits.
