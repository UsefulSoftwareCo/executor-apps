# Creatomate

Generate videos, images and GIFs with [Creatomate](https://creatomate.com): start renders from a template (with modifications) or from raw RenderScript, check render status, and create, list, read, update and delete templates.

## Interface

Hand-written tools over the REST API at `https://api.creatomate.com/v2` (docs: https://creatomate.com/docs/api/reference/introduction). Creatomate publishes no official OpenAPI document and no MCP server, so the seven documented endpoints are written by hand: `createRender`, `getRender`, `listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate`, `deleteTemplate`. Mutations require approval; creating a render spends credits.

## Auth

API key. Open your project in Creatomate, go to Project Settings, and copy the project's API key (https://creatomate.com/docs/api/reference/your-api-key). It is sent as `Authorization: Bearer <key>` to `api.creatomate.com`. Keys are per project. Creatomate offers no OAuth for the API.

## Known gaps

- No endpoint for listing past renders is documented, so there is none.
- Template listing is not paginated by the API.
- The icon is the logo from creatomate.com's site header (the vendor publishes no brand kit and Simple Icons has no entry).
