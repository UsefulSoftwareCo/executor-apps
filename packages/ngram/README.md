# ngram

Create AI-generated videos and images with ngram, track render jobs, and browse voices, styles, aspect ratios, durations and brand kits. 20 tools: account and credits, catalog lookups, video creation (from text, from URL, prepare/create, status, list, cancel) and image creation/editing and status/list.

## Interface

ngram's official remote MCP server, `https://mcp.ngram.com` (docs: https://www.ngram.com/docs/mcp). ngram publishes no OpenAPI document; its REST API (`https://www.ngram.com/api/v1`) is documented only as prose, so the MCP server is the interface with the most working tools. Mutating tools require approval; tools with `readOnlyHint` do not.

## Auth

- API key: create one in ngram under Settings -> API Keys (it starts with `ngs_`) and paste it. It is sent as `Authorization: Bearer`.
- OAuth: the server publishes OAuth metadata with dynamic client registration (via Supabase auth), so no OAuth app needs creating. The Executor redirect URI is registered automatically through dynamic client registration (`registration_endpoint` on the Supabase auth server), so there is nothing to add by hand. Executor requests `offline_access`, which the Supabase authorization server advertises along with the `refresh_token` grant, so the short-lived access token can be refreshed.
- Hosts: credentials go to `mcp.ngram.com` and to the Supabase auth host `dwklztaldfwaufscnqbw.supabase.co` (token exchange and refresh), so both are declared.

## Known gaps

The account health check uses the MCP initialize handshake. Video renders take many minutes; poll with the status tools. At most three video jobs may process at once per account.
