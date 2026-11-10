# Hellotracks

Dispatch and field-workforce management in [Hellotracks](https://www.hellotracks.com): jobs (list, create, edit, archive, restore, delete, distribute, auto-assign, route optimization), members, places, live member locations, GPS tracks, reports and webhooks.

**Interface:** custom, hand-written tools over Hellotracks' RPC-style HTTP API (`POST https://api.hellotracks.com/api/<endpoint>` with parameters in a `data` object), documented at https://api-docs.hellotracks.com. Hellotracks publishes no OpenAPI document, GraphQL API or MCP server, so each documented endpoint is one tool that takes `data` as described in its tool description. Status 0 is success; any other status raises an error.

**Auth:** API key only (Hellotracks has no OAuth). In https://live.hellotracks.com open More > API & Integrations, enable the API and create a key (`ABCDEF.ABCDEF...`), shown once. It is sent in the `API-Key` header to `api.hellotracks.com`. The health check calls `getcompany`.

**Gaps:** request bodies are free-form `data` objects rather than typed fields. The separate `/v1/webhooks` REST route is not wrapped; `webhooks.get`/`webhooks.set` cover webhook configuration. All writes require approval.

Icon: Hellotracks' official 512px app icon from hellotracks.com.
