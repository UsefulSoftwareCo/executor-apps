# Captions

Covers the Captions Mirage API: add styled captions to videos, list and fetch caption templates, generate AI avatar and creator videos (v1 and v2), text-to-speech, browse avatars and voices, text overlays, and poll or download generated video.

**Interface:** OpenAPI, the vendor's official document at https://api.mirage.app/openapi.json (docs: https://captions.ai/help/docs/api/overview). The document declares no security scheme or server, so `openapi.ts` patches in an `x-api-key` header scheme, a base URL, and removes the `x-api-key` header parameter from each operation. It also removes the `/internal/*`, `/` and `/health` routes it lists.

**Auth:** API key (`apiKey`), sent as the `x-api-key` header. Create it in the Mirage platform dashboard at https://platform.mirage.app/ (reference: https://captions.ai/help/docs/api/overview). The health check calls `GET /v1/avatars?limit=1`, a catalog listing (the public spec has no account endpoint), so it only confirms the key is accepted and a JSON object is returned. No OAuth.

**Known gaps:** none known. The public spec's internal routes (API key generation and revocation, retention purge, rate-limit overrides, fal bridge) were removed on purpose, so they are not available as tools. Generation endpoints are asynchronous: poll the video status tool until COMPLETE. Tools that create videos are billed by Captions and require approval.
