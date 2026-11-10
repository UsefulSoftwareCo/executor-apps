# Magic Hour

Generate and edit AI video, images and audio: face swap, lip sync, text/image/audio to video, video translation, upscaling, background removal, voice generation and cloning, plus project status and account credits.

Interface: Magic Hour's official OpenAPI document, https://magichour.ai/openapi.json (API at https://api.magichour.ai). Mutations require approval.

## Auth

- API key (`apiKey`): create one in the Magic Hour Developer Hub, https://magichour.ai/developer?tab=api-keys. Sent as a bearer token to `api.magichour.ai`.

## Known gaps

- OAuth is only offered by Magic Hour's hosted MCP server (https://mcp.magichour.ai/), not by the REST API, so it is not included here.
- Generation jobs are asynchronous; poll the matching project status tool.
- The icon is Magic Hour's official 180px app icon (https://magichour.ai/apple-icon.png), since no SVG mark is published.
