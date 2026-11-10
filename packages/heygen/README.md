# HeyGen

Create AI avatar videos with HeyGen: videos and WebM videos, avatars and avatar groups, photo avatars, digital twins, voices and brand voices, templates, video translation, streaming (interactive) avatar sessions, folders, webhooks, assets, text-to-speech and account quota.

## Interface

Two tool groups:

- `api`: OpenAPI, from HeyGen's official document at https://developers.heygen.com/openapi.yaml (52 tools, 29 of them mutations). One operation is skipped as `multiple_hosts`: the asset upload endpoint lives on `upload.heygen.com`, a different origin from `api.heygen.com`, so file upload is not available.
- `v3`: 8 hand-written `fetch` tools for v3 endpoints that HeyGen documents on developers.heygen.com but that are missing from the OpenAPI document: `listVoices` (GET /v3/voices), `getVoice` (GET /v3/voices/{voice_id}), `generateSpeech` (POST /v3/voices/speech), `generateCloneSpeech` (POST /v3/models/audio/tts), `listCloneVoices` (GET /v3/models/audio/voices), `getAsset` (GET /v3/assets/{asset_id}), `deleteAsset` (DELETE /v3/assets/{asset_id}) and `getCurrentUser` (GET /v3/users/me). Mutations (speech generation, which spends credits, and asset deletion) require approval.

The OpenAPI document is therefore not the whole API. HeyGen also runs a remote MCP server at https://mcp.heygen.com/mcp/v1, which requires OAuth; this package does not use it.

## Auth

- API key: create one in the API dashboard at https://app.heygen.com/developers/api. It is sent in the `X-API-KEY` header. The account check calls `GET /v3/users/me`, the endpoint HeyGen's API key guide uses to validate a key.
- OAuth: not offered. HeyGen's authorization server (https://api2.heygen.com/.well-known/oauth-authorization-server) does advertise a `registration_endpoint` (https://api2.heygen.com/v1/oauth/register), but app approval is gated by HeyGen's Integration Intake form and partner review, and registering an OAuth app is not self-service. So a user cannot create their own OAuth app and the package takes an API key only.

## Known gaps

- Asset upload (`upload.heygen.com`) is not exposed.
- Not covered: streaming text-to-speech (`/v3/models/audio/tts/stream`, Server-Sent Events), asset listing (HeyGen's v3 reference documents get and delete only), keep-alive for streaming sessions, shareable video URL and personalized video, which are not in the OpenAPI document or the docs index checked. Talking-photo deletion is covered by the photo-avatar delete operation in the OpenAPI document where present.
- Knowledge-base endpoints are not exposed: HeyGen's current docs index lists no knowledge-base reference pages (the OpenAPI document only mentions a `knowledge_base` field on the streaming session request).
- The OpenAPI document also contains legacy v1 and v2 operations; HeyGen's docs steer new work to v3.
