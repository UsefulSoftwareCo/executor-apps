# Picnie

Generate images and PDFs from Picnie templates, process images (resize, crop, compress, convert, filter, text and image watermarks, AI background removal, OCR, metadata) and manage projects and templates.

**Interface:** hand-written tools over Picnie's REST API (`https://picnie.com/api/v1`). Picnie publishes no OpenAPI document, MCP server or GraphQL API; the endpoints, parameters and auth header come from the vendor's official docs (https://docs.picnie.com/api-reference/quick-start-zr42) and its published Postman collection (https://documenter.getpostman.com/view/25712226/2s93CGRvy6). 19 tools; every endpoint except the list and get calls is a mutation and needs approval.

**Auth:** API key only (Picnie has no OAuth). Create it in the Picnie dashboard (https://picnie.com). The key is sent as the `Authorization` header exactly as given, as in the vendor's Postman collection (the overview article mentions a Bearer prefix, the reference does not use one).

**Known gaps:** `upload-asset` is exposed as `projects.uploadAsset`, taking base64 content and building the multipart form in the handler (not exercised against the live API). Picnie's docs list delete-project, exposed as `projects.delete` (`delete_type` 1 = assets and project, 2 = assets only). A `create-image-collection` / `template_group_id` endpoint appears in no vendor documentation we could reach, so it was removed. `template_id` is sent as a string; the vendor's examples show an integer in places and a string for `project_id` elsewhere, so its docs are inconsistent and the string form is accepted as-is. The icon is the vendor's 128px favicon (its app icon). Responses are returned undecoded because the vendor documents no response schemas. Use a Picnie project_id from `projects.list`.
