# PhotoRoom

AI image editing with PhotoRoom: background removal, static and AI-generated backgrounds, shadows, relighting, text removal, upscaling, outlines, positioning, virtual models, and account plan and credit usage (4 tools).

**Interface:** hand-written tools over the PhotoRoom REST APIs (`https://image-api.photoroom.com` and `https://sdk.photoroom.com`). PhotoRoom publishes no standalone OpenAPI URL (its docs at https://docs.photoroom.com/getting-started/api-reference-openapi embed the spec inline), and the API returns binary images, so tools return the result as `{ contentType, bytes, base64 }`. Tools: `account`, `edit.fromUrl` (GET `/v2/edit`), `edit.fromFile` (POST `/v2/edit`, base64 input), `removeBackground` (POST `/v1/segment`, base64 input). Edit options are passed as `params` using the API's dot-notation names (for example `background.color`, `shadow.mode`, `export.format`). All image tools consume credits and require approval.

**Auth:** API key sent as `x-api-key`. Create it in the PhotoRoom API dashboard (https://app.photoroom.com/api-dashboard). Prefix the key with `sandbox_` for free, watermarked test calls. PhotoRoom offers no user-created OAuth apps.

**Known gaps:**
- Multipart uploads of several images (virtual model additional product images, background guidance files, editWithAI additional images) are not exposed; URL inputs work through `edit.fromUrl`.
- Images are returned inline as base64, so very large outputs are bulky.
- Enterprise APIs (visual agent, visual QA, video) are not covered.
- Icon is the official 1200px app icon from photoroom.com.
