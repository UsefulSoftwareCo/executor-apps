# Vestaboard

Reads and writes messages on a Vestaboard (Flagship, Note or Note Array): read the current message, send text or character codes, get and set the transition style and speed, and format text into a character-code grid.

**Interface:** custom tools over the Vestaboard Cloud API (`https://cloud.vestaboard.com`, docs at https://docs.vestaboard.com/docs/read-write-api/endpoints). Vestaboard publishes no OpenAPI document, GraphQL API or MCP server, so the five endpoints are written by hand.

**Auth:** Cloud API token (`apiKey`), sent as `X-Vestaboard-Token`. Create it in the API tab on web.vestaboard.com, or Settings / Advanced Settings in the mobile app, and select the permissions the tools need (the vendor names a Write permission, needed for `message.send` and `transition.set`; no separate Read toggle is documented). The token is shown only once. The Cloud API documents token auth only; no OAuth is documented.

**Known gaps:** the separate Subscription API (documented at https://docs.vestaboard.com/docs/subscription-api/endpoints; it takes a key plus secret, via `X-Vestaboard-Api-Key` and `X-Vestaboard-Api-Secret`, whereas this package uses the Cloud API token), the Local API (a board on your own network, not reachable from the cloud) and VBML composition beyond `/vbml/format` are not covered. Sending more than one message per 15 seconds can drop messages. The Cloud API publishes no cheaper identity endpoint, so the health check reads the current message.
