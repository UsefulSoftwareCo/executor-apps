# DynaPictures

Dynamic image generation: render images and PDFs from DynaPictures templates by overriding layer values, run standalone AI image generation jobs, and manage workspaces, media library assets and NEW_IMAGE webhooks.

**Interface:** custom, hand-written tools over the REST API documented at https://dynapictures.com/docs/. DynaPictures publishes no OpenAPI document and no MCP server. 16 tools.

**Auth:** API key (`Authorization: Bearer <key>`). Find it on the DynaPictures account page or in a template's API console. The vendor docs describe API-key Bearer auth only.

**Known gaps:**
- Media asset upload and replace (multipart POST to `/media/{workspaceId}/assets`) are deferred, not a vendor limitation; the apps framework has no multipart support here.
- Binary responses, `GET /links/...` render URLs, `/batch` PDF streaming and countdown timer GIFs are not exposed; images are generated with `responseFormat: json`.
- `templates.list` only returns templates with "Sync to Zapier" enabled (vendor behavior); use `templates.get` with a UID otherwise.
