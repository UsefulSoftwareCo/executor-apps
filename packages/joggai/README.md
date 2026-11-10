# JoggAI

Create AI videos with JoggAI: avatar videos, product (URL-to-video) videos, lip-sync, template videos and video translation, plus avatars (public, custom, photo, product), voices, music, scripts, asset uploads, quota and webhook endpoints.

## Interface

OpenAPI, from JoggAI's official v2 document at https://docs.jogg.ai/api-reference/v2/openapi-v2.yaml (base URL `https://api.jogg.ai`). The legacy v1 API (in maintenance, superseded by v2) is not included.

## Auth

API key only. JoggAI has no user-created OAuth apps. Log in to JoggAI, click your avatar, choose "API" and create a key. It is sent in the `x-api-key` header. The health check calls `GET /v2/user/whoami`.

## Known gaps

v1-only endpoints are not exposed. Video generation consumes JoggAI credits, so every mutation requires approval.
