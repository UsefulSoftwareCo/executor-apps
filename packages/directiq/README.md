# DirectIQ

DirectIQ email marketing: contacts (list, get, by list, active, passive, create, delete), contact lists (list, get, create, delete), campaigns (list, create), templates (list, create), verified sender addresses and campaign reports (stats, reads, clicks, unsubscribes, spam complaints).

**Interface:** hand-written tools over DirectIQ's official REST API, documented at https://directiq.github.io/rest-api-doc/ (base URL `https://restapi.directiq.com`). DirectIQ publishes no OpenAPI document and no remote MCP server. Paths, methods and body fields (`Email`, `FirstName`, `LastName`, campaign and template objects) follow that reference. Every mutation requires approval.

**Auth:** API key only (the API has no OAuth). Each account stores the DirectIQ user name and the API key; both are sent as the `user-name` and `api-key` headers. Find the key in the DirectIQ dashboard under My Account > Social Media & Integrations > API Integration. Health check: `GET /contactlists`.

**Icon:** the envelope mark from DirectIQ's official logo (https://directiq.com/directiq-logo.svg), mark paths only.

**Gaps:** the multipart bulk CSV upload endpoint (`POST /contacts/upload/{listId}`) is not exposed. The API has no endpoint for sending a single transactional message (that is SMTP relay), so there is no send-email tool. Responses are returned as the API's raw JSON.
