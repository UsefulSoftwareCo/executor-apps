# HelloLeads

Covers the HelloLeads CRM private API: list lead lists, list leads, and create a lead in a list.

**Interface:** custom, hand-written tools with `fetch`. HelloLeads publishes no OpenAPI document, GraphQL API or MCP server, and its API documentation is only distributed as PDFs from the account's API settings. The base URL `https://app.helloleads.io/index.php/private/api` and the `GET /lists`, `GET /leads` and `POST /leads` endpoints were taken from the vendor-linked POST API PDF as used by public integrations, not from a machine-readable vendor spec, and could not be exercised without a real account.

**Auth:** API key plus account email, no OAuth. In HelloLeads open Settings, API Integrations and copy the API key; enter it with the email address of the account. They are sent as the `hls-key: token=<key>` and `Xemail` headers.

**Known gaps:** only three operations are exposed; update, delete and other lead endpoints are not documented publicly. Creating a lead requires approval. The icon is the speech-bubble mark cropped from the vendor's PNG logo (no SVG is published), so it is a raster at low resolution upscaled to 256px.
