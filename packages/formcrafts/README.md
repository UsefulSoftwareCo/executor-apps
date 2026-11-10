# Formcrafts

Read access to a Formcrafts organization: workspaces, forms (with fields and pages), live form responses, and the list of uploaded files.

Interface: hand-written tools over Formcrafts API v2 (`https://api.formcrafts.com/v2`), documented at https://formcrafts.com/help/developers/api-docs-v2. Formcrafts publishes no OpenAPI document, so the tools mirror the documented endpoints. Tools: `organization`, `workspaces`, `forms.list`, `forms.get`, `forms.responses`, `files.list`. All are read-only, so none need approval.

Auth: API key. Create one in Formcrafts under Organization > Settings > API Keys (https://formcrafts.com/help/developers/api-key) and paste it into the connect page. The key is sent as HTTP basic auth (key as username, empty password) to `api.formcrafts.com`. Keys grant read access to the whole organization. Formcrafts offers no OAuth for third-party apps.

Known gaps: the API is read-only. `GET /v2/files/{id}/content` returns raw file bytes, which tools cannot return, so file downloads are not exposed (file metadata and ids are). Only live responses are returned, not test-mode ones. The documentation pages sit behind Cloudflare; endpoints were taken from the vendor's API v2 page via the Internet Archive.
