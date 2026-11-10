# Mighty Networks

Manage a Mighty Network through its Admin REST API: members, spaces, plans, posts, events, courses, badges, collections, abuse reports and more.

**Interface:** OpenAPI, from Mighty's own published document at https://api.mn.co/admin/v1/spec/rest.json (the spec behind https://docs.mightynetworks.com). Every operation is a tool under `https://api.mn.co`; mutations require approval.

**Auth:** API key (`apiKey`). In your network go to Admin > Settings > API Keys > Generate New API Key, choose its permissions and scopes, and copy the token (shown once). Also enter your network ID or subdomain (`networkId`, an integer ID or a subdomain such as `my-network`); the key is scoped to one network, so add one account per network. The configured value fills the `network_id` path parameter of every tool, so callers never pass it. The key is sent as a Bearer token and verified with `GET /admin/v1/networks/{network_id}/me`, which must return the network and user objects.

**List endpoints:** the published spec references 21 `*ResponsePaged` schemas it never defines, so the compiler would skip every list operation (and `replace_collections`). The package patches those schemas in `openapi.ts` as open objects whose `items`/`data` arrays hold the documented row type; Mighty's Admin API page shows two list envelope shapes (`items` + `links`, and `data` + `meta`), so both are typed and other fields are left open. Pagination uses `page` and `per_page` (default 25, max 100).

**Known gaps:** Webhooks are not tools. Mighty also documents a Headless GraphQL API (`POST https://api.mn.co/networks/:network_id_or_subdomain/graphql`) that accepts a host API key as a Bearer token and covers the Member and Admin APIs in one schema; docs.mightynetworks.com/headless-api does not state whether it is GA or beta, and lists it for OAuth apps on Scale and above. It is not mounted, since the Admin REST API follows the authoring order for interfaces. Mighty also offers an official MCP server (Admin > Integrations > MCP, Scale and above), which is not mounted either.

**Icon:** the official "mighty" wordmark tile from mightynetworks.com/favicon.svg (Simple Icons has no entry); the tile fill is written as `rgb()` so it stays visible in the dark variant. Mighty publishes no standalone mark (an unofficial symbol on Brandfetch is unclaimed), so the wordmark tile is used.
