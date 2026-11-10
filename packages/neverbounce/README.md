# NeverBounce

Email verification with NeverBounce: real-time single-address checks, bulk list verification jobs (create, parse, start, status, results, CSV download, delete), account credit and job counts, and Proof of Email token confirmation.

**Interface:** hand-written tools over the REST API v4.2 (`https://api.neverbounce.com/v4.2`). NeverBounce publishes no OpenAPI document, no GraphQL API and no MCP server, so the tools follow the official developer docs (https://developers.neverbounce.com) and the official Node SDK (https://github.com/NeverBounce/NeverBounceApi-NodeJS). Requests are JSON POSTs with the key in the body, as the official SDK does. The docs list GET for some read endpoints (account/info, single/check, jobs/search, status, results, download), but the API accepts POST for them too. Single-check `timeout` is in seconds, per the vendor docs.

**Auth:** API key only. Create a Custom Integration app at https://app.neverbounce.com/apps/custom-integration/new; the app's overview page shows the key (it starts with `secret_`). NeverBounce has no user-created OAuth apps. Legacy V3 username/secret credentials do not work.

**Approvals:** every mutation asks first: `single.check` (billable, one credit per call, so modeled as a mutation), job create, parse, start, delete and POE confirm.

**Known gaps:** NeverBounce reports bad keys as HTTP 200 with `status: "auth_failure"`; the tools turn any non-success status into an error. The `jobs.download` tool returns CSV text inline, so prefer `jobs.results` for large jobs. The icon is cropped from the logo on the vendor's developer docs (80px source, upscaled), since no SVG is published.
