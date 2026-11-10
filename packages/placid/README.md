# Placid

Placid generates images, PDFs and videos from design templates. This package exposes 25 tools: create, retrieve and delete images, PDFs (including merge) and videos; list, create, update and delete templates and collections; and list, rename and delete custom fonts.

**Interface:** hand-written tools over Placid's REST API 2.0 (`https://api.placid.app/api/rest`, docs at https://placid.app/docs/2.0/rest/authentication). Placid publishes no OpenAPI document for this API: `https://placid.app/openapi.json` describes only a separate, unauthenticated "Natural Language API" (5 operations), so it is not used. Placid also ships an official remote MCP server (https://placid.app/help/mcp-setup-guide) at `https://mcp.placid.app/<custom-url>`, where the custom URL is shown on each project's MCP page; it uses HTTP transport and the same project API token (`Authorization: Bearer <token>`). It was not probed (it needs a real project URL, and we do not use real accounts) and is not mounted, because it is per-project and is expected to duplicate the generation and template tools already exposed here. DELETE calls accept an empty 2xx body, since the docs do not say whether deletes return JSON. The icon is Placid's app icon (android-icon-192x192.png), not a logo file.

**Auth:** API token (`apiKey`). Create it in Placid under Projects, pick the project, then API Tokens. Tokens are scoped to one project, so add one account per project. It is sent as `Authorization: Bearer <token>`. Placid offers no OAuth for user-created apps.

Mutations, including every render (which spends credits), require approval.

**Known gaps:** file uploads (`POST /media`, `POST /fonts`) need multipart bodies and are not exposed; pass image URLs in layers instead. Layer and modification objects are passed through as JSON, see the Placid layer docs for their properties.
