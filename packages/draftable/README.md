# Draftable

Compares documents (PDF, Word, PowerPoint, RTF and text) with the Draftable Compare API: create a comparison from two public file URLs, list and fetch comparisons, build a viewer URL, delete comparisons, and export a comparison to PDF (single page, combined, left or right).

**Interface:** custom tools written with `fetch` against the official REST API at `https://api.draftable.com/v1`. Draftable publishes no OpenAPI document or MCP server, so the endpoints (`/comparisons`, `/exports`) follow the official API documentation at https://api.draftable.com/introduction and the vendor's open-source client libraries (https://github.com/draftable/compare-api-node-client). Tools: `comparisons.list`, `comparisons.get`, `comparisons.viewerUrl`, `comparisons.create`, `comparisons.delete`, `exports.create`, `exports.get`. Create, delete and export requests require approval.

**Auth:** account ID plus auth token, sent as `Authorization: Token <token>`. Both are on https://api.draftable.com/account/credentials (a free test account is available). Draftable has no OAuth. The account ID is only used to build viewer URLs.

**Known gaps:** comparisons are created from source URLs only; uploading file bytes (multipart) is not exposed. Viewer URLs are unsigned, so they load only for comparisons created with `public: true`; signed URLs need an HMAC with the token and are not generated. Regional endpoints and API Self-hosted use other base URLs and are not supported (only `api.draftable.com`). The health check lists comparisons, which Draftable notes can be slow on large accounts.
