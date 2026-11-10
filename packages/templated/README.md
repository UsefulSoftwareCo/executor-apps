# Templated

Generate images and PDFs from designed templates with [Templated](https://templated.io): create and edit templates, render them with dynamic layer content, manage renders, folders, fonts, uploads, and run AI template generation.

## Interface

OpenAPI, from Templated's own published document at `https://api.templated.io/v3/api-docs` (official; the vendor docs are at https://templated.io/docs). That document describes the whole Templated backend, including the dashboard, admin, billing and auth endpoints. The package removes every path outside the public `/v1` API (and the `/v1/public`, `/v1/test`, `/v1/p` and image proxy helpers), leaving the documented API-key surface. The document declares no security scheme, so the bearer scheme is supplied in `openapi.ts`.

## Auth

- **API key** (`apiKey`): create it in the Templated dashboard under the "API Key" tab (https://app.templated.io/api-key). It is sent as `Authorization: Bearer <key>` to `api.templated.io`.

Templated offers no user-created OAuth apps for this API, so there is no OAuth method.

## Known gaps

- Mutations (create/update/delete templates, renders, folders and so on, and render requests that consume credits) require approval. `GET /v1/render` and `GET /v1/download/{templateId}` are GET requests that render output, so they are marked as mutations and also require approval. The spec's own `apiKey` query parameter and `Authorization` header parameters are removed so credentials never appear in tool input.
- Some operations take multipart uploads; the document's own schemas for these are loose, so file upload tools may be of limited use.
- The upstream document is generated and can change; the path filter in `openapi.ts` is a static list of excluded paths, so new non-`/v1` paths would appear until it is refreshed.
