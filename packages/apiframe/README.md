# Apiframe

Generate AI images, video and music through Apiframe's single API: image, video and music generation, image editing (inpaint/outpaint), image and video upscaling, background removal, job status and model discovery (`list_models`).

**Interface:** Apiframe's official remote MCP server, `https://mcp.apiframe.ai` (streamable HTTP), documented at https://apiframe.ai/docs/mcp. Apiframe publishes no OpenAPI document, and its REST API is wider than the MCP server (see gaps), but the MCP tools take the same request bodies as the REST endpoints.

**Auth:** API key. Create one in the Apiframe console at https://console.apiframe.ai/dashboard/api-keys; it is sent as the `X-API-Key` header. The MCP server does not offer OAuth (the probe shows no OAuth metadata), so there is no OAuth method. Generation calls spend account credits; every non-read-only tool asks for approval.

**Known gaps:** Midjourney/Suno/Udio follow-up actions (upscale variants, extend, cover), LoRA training, file uploads, assets and webhooks are REST-only at Apiframe and not exposed here.
