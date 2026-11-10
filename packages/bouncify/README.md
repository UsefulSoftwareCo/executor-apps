# Bouncify

Email verification through Bouncify: real-time single address verification, bulk lists (create from an email array or CSV text, start, status, download results, delete) and the credit balance.

**Interface:** custom tools written with `fetch` against `https://api.bouncify.io/v1`. Bouncify documents its API on readme.io (https://bouncify.readme.io/reference/overview) as per-endpoint OpenAPI fragments but publishes no single OpenAPI document, GraphQL API or MCP server, so the endpoints and parameters come from those vendor reference pages. Tools: `getCredits`, `verify`, `bulk.uploadEmails`, `bulk.uploadCsv`, `bulk.start`, `bulk.status`, `bulk.download`, `bulk.delete` (8 tools).

**Approvals:** `verify`, `bulk.uploadEmails`, `bulk.uploadCsv`, `bulk.start` and `bulk.delete` require approval (they spend credits or delete data). `getCredits`, `bulk.status` and `bulk.download` do not.

**Auth:** API key only (Bouncify has no OAuth). Find it in your Bouncify account on the API page of your dashboard (https://app.bouncify.io). It is sent as the `apikey` query parameter, as the vendor API requires. The health check calls `GET /v1/info`.

**Known gaps:** none of the documented endpoints are omitted. Bulk CSV upload takes the file as text. Bouncify's reference lists no other endpoints.
