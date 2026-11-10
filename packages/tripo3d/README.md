# Tripo3D

Generate and process 3D models with Tripo: text, image and multiview to 3D (H and P series), text-to-image, image-to-image, image-to-multiview, multiview editing, texturing, format conversion, model import, rig check, auto rigging, animation retargeting, mesh segmentation, part completion, retopology, task polling, file upload, credit balance and usage. 20 tools.

## Interface

Hand-written tools over the official Tripo v3 REST API (`https://openapi.tripo3d.ai/v3`), written from the vendor docs at https://developers.tripo3d.ai/llms.txt. Tripo publishes no OpenAPI document (the docs are HTML/markdown only), so there is no generated router. Tripo's only official MCP server (VAST-AI-Research/tripo-mcp) is alpha and Blender-only, so it is not used. Most generation and processing endpoints accept more fields than are typed here; every such tool takes an `options` object that is merged into the request body, so newer parameters remain reachable.

## Auth

API key only. Create one in the Tripo Console at https://platform.tripo3d.ai under "API Keys". It is sent as `Authorization: Bearer <key>` to `openapi.tripo3d.ai`. The vendor documents only API keys and no OAuth flow, so there is no OAuth method. Health check: `GET /v3/account/balance`.

## Known gaps

- Tools that start tasks spend credits and require approval; poll `tasks.get` for results.
- `files.upload` takes base64 content; the separate large-file upload flow (over 60 MB) is not wrapped, pass a public URL as `input` instead.
- Webhook management is not covered. The China-region docs site (developers.tripo3d.com) does not name an API host, so only `openapi.tripo3d.ai` is supported.
- No batch task lookup: the vendor docs confirm only `GET /v3/tasks/{task_id}`, so a batch `tasks.list` was removed; poll tasks one by one.
- Gaussian splat generation is not in the vendor docs index and is not wrapped.
- `account.usage` takes no cursor: vendor docs show no pagination.
- The older v2 API (`api.tripo3d.ai/v2/openapi`) is not exposed.
