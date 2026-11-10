# Imagior

Generates images from Imagior design templates: list templates, read their elements, render an image with element overrides, and check the account's remaining credits (5 tools).

## Interface

Hand-written tools over Imagior's REST API at `https://api.imagior.com`, following the official docs at https://docs.imagior.com/api-reference. Imagior publishes no downloadable OpenAPI document (the docs index links `api-reference/openapi.json`, which returns 404), and its third-party listing on Jentic uses paths that differ from the official docs, so it is not used. The generate-image response shape is not documented, so `images.generate` returns the raw JSON.

Tools: `account.get`, `templates.list`, `templates.elements`, `templates.basicElements`, `images.generate`. `images.generate` consumes one credit per image and always asks for approval.

## Auth

API key only (Imagior has no OAuth). Create one on the Developers page of the Imagior dashboard (https://docs.imagior.com/getting-started/generate-api-key); it is sent as `Authorization: Bearer <key>` to `api.imagior.com`. The account health check calls `GET /user/account`.

## Known gaps

Imagior's public API has no endpoints to create or edit templates or to list generated images; templates are designed in the dashboard.
