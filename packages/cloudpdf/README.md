# CloudPDF

Manage PDF documents in CloudPDF: create documents, upload new file versions, check processing status, set default viewing permissions (download, search, selection, public), manage webhooks and read account plan and usage.

Interface: hand-written tools over CloudPDF's Server API 2.0 (`https://api.cloudpdf.io`, docs at https://cloudpdf.io/developers/api-docs). CloudPDF publishes no OpenAPI document and no MCP server, so the 14 tools wrap the documented endpoints with `fetch`. Mutations require approval.

Auth: API key. Create a "Simple API Key" in the CloudPDF dashboard under Settings > API Keys; it is sent in the `X-Authorization` header. The signed (JWT) mode and its Secret Signing Key are intentionally not used; they are only needed for the omitted viewer endpoint. No OAuth.

Known gaps:
- The PDF bytes themselves are uploaded with a PUT to the pre-signed S3 `uploadUrl` returned by `documents.create` or `documents.files.create`; that host is not CloudPDF's, so no tool performs the upload. Tools cover creating the document, marking the upload complete and polling status.
- The viewer endpoint (`/v2/viewer/documents/:id`) only accepts signed JWTs and is omitted.
- The vendor's update-webhook docs omit `file.processed` from the event list while create includes it; the update tool passes `events` through unchanged.
