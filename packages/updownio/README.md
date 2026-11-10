# Updown.io

Manage Updown.io website and API monitoring: list, create, update and delete checks (including pulse checks), read downtimes and detailed metrics, manage alert recipients and status pages, and list the monitoring servers' IP addresses.

**Interface:** hand-written tools over the REST API documented at https://updown.io/api. Updown.io publishes no OpenAPI document, GraphQL API or MCP server, so each of the 18 documented endpoints is one tool. Path ids are explicit inputs, `query` carries query parameters and `body` carries the JSON request body (fields are listed in each tool description). Every create, update and delete tool requires approval.

**Auth:** API key. Copy it from https://updown.io/settings/edit (Settings, API) and paste it when connecting. A read-only key works for the read tools only. The key is sent as the `X-API-KEY` header to `updown.io`.

**Known gaps:** no OAuth (Updown.io does not offer it). The Push API (webhooks), the DNS API and the public pulse endpoint (`pulse.updown.io`, which needs no key) are not wrapped. Recipient types that need the web UI (Slack, Telegram, Zapier, Statuspage) cannot be created through the API.
