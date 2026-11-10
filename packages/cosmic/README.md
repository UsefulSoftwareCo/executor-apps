# Cosmic

Manage a Cosmic (cosmicjs.com) headless CMS bucket: objects (list, get, create, update, delete, batch), revisions, object types and media (list, get, update, delete).

Interface: hand-written tools over Cosmic's documented bucket REST API, `https://api.cosmicjs.com/v3/buckets/{bucket_slug}` (docs: https://www.cosmicjs.com/docs/api). Cosmic publishes no OpenAPI document. Its hosted MCP server (`https://mcp.cosmicjs.com/v1/buckets/{slug}`) is bucket-scoped by URL and was not used. All 18 tools are hand-written.

Auth: one method, bucket keys. Enter the bucket slug, read key and write key from Bucket Settings > API Access in the Cosmic dashboard. Read calls send the read key as `read_key`; mutations send the write key as a bearer token. There is no OAuth.

Known gaps: media upload (a multipart POST to `workers.cosmicjs.com`) is not exposed; one account covers one bucket; the agent and personal-access-token APIs on `dapi.cosmicjs.com` are not covered. Health check lists object types, since bucket keys have no whoami endpoint.
