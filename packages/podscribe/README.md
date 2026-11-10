# Podscribe

Podcast advertising verification and attribution with Podscribe: campaigns, impressions, conversions, incrementality, campaign and creative reports, show/episode search, transcripts, audience data, rankers, and advertiser/user management.

**Interface:** OpenAPI, from Podscribe's official document at https://developers.podscribe.com/api/openapi.yaml (API reference: https://developers.podscribe.com/api/). All operations live on `https://backend.podscribe.ai`.

**Auth:** API key (`secrets`), sent as `Authorization: Bearer <key>`. Request an API key from Podscribe (Podscribe app, or your account contact); the regenerate endpoint is also exposed as a tool. Podscribe offers no user-created OAuth apps.

**Notes and gaps:**
- Many report endpoints are `POST` because they take filter bodies; they are treated as mutations and require approval, even when read-only.
- Several endpoints (TransUnion audience, file processing) are asynchronous: poll `file-processor/status/{id}` for the result file.
- Some endpoints require a Pro account.
