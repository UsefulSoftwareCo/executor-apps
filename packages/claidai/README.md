# Claid.ai

Claid.ai image APIs: synchronous, async and batch image editing (upscaling, decompression, background removal and blur, resizing and outpainting, adjustments, privacy, style transfer), AI edit, AI fashion models, scene and image/video generation, and storage connectors.

**Interface:** OpenAPI 3.1, Claid's own document at https://api.claid.ai/docs-v1.json (the spec behind https://docs.claid.ai). The document declares no `servers`, so `baseUrl` and the origin are pinned to `https://api.claid.ai` in `openapi.ts`.

**Auth:** API key only. Create it in the Claid dashboard (https://claid.ai/login, then Create API key on Overview or API keys). It is sent as `Authorization: Bearer <key>`. Claid has no user-created OAuth apps. The vendor's spec shows key scopes storage, image_editing, image_generation and video_generation; it documents nothing beyond those.

**Health check (known limitation):** every read under `/v1/storage/*` requires the `storage` scope and the spec has no parameterless read outside it, so the health check calls `GET /v1/storage/storages`. A key without the storage scope (for example an image-editing-only key) is shown as failing in the connection UI even though editing works. This is expected; give the key the storage scope to see a healthy account.

**Known gaps:** `POST /v1/image/edit/upload` takes multipart file uploads, which tool calls cannot send, so it is skipped (removed in `openapi.ts`); use the JSON edit endpoints with image URLs instead. All mutations (including edits, which consume credits) require approval.
