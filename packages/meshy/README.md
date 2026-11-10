# Meshy

Generative 3D for Meshy: text-to-3D, image-to-3D and multi-image-to-3D, text-to-image and image-to-image, retexture, remesh, resize, UV unwrap, format conversion, rigging, animations, 3D-print analysis, repair, split and multi-color, plus credit balance and usage.

**Interface:** OpenAPI, Meshy's official document at https://docs.meshy.ai/openapi.json (83 operations in the document, 67 tools, 32 mutations). Mutations require approval. The 16 `GET .../{id}/stream` operations (`text/event-stream`) are not exposed as tools: a tool cannot return an event stream. The framework drops them while importing the document (the `event_stream` rule in `apps`), before `openapiToolNames` builds its skipped list, so `scripts/tools.ts` and `check.sh` report `0 skipped` even though these 16 are absent. The plain `GET .../{id}` polling operations return the same task objects, so no capability is lost.

**Official MCP:** Meshy also publishes an MCP server (`meshy-dev/meshy-mcp-server`, npm `@meshy-ai/meshy-mcp-server`) with roughly 19 to 24 tools. It was not used because the OpenAPI document covers more operations.

**Auth:** API key only (Bearer `msy_...`). Create one at https://www.meshy.ai/developers/keys (the API Keys page named in https://docs.meshy.ai/en/api/authentication; https://www.meshy.ai/settings/api also resolves). Meshy does not offer user-created OAuth apps. The health check reads `/v1/balance`.

**Icon:** Meshy's official app icon (512px PNG) from meshy.ai; the dark variant is derived by `scripts/icon.ts` and recolors the dark violet background to pale green-yellow; the mark is fully visible on white and #111 tiles.

**Gaps:** Tasks are asynchronous; poll the task `GET` operations for results. Output model URLs are returned, not downloaded. The 16 `/stream` operations are not exposed (see Interface). The vendor spec itself omits the Creative Lab APIs (keychain, fridge magnet, figure, vinyl figure, brick figure, lamp, keycap, collapsible fidget, fidget pixel), the Text to Motion API, partner-specific d5 surfaces, and the legacy `/v1` and `/v2` path aliases, so the 67 tools are not the whole Meshy API.
