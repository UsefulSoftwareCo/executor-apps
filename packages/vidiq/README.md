# vidIQ

Research YouTube and Instagram creators, videos, keywords, trends and comments, generate titles and thumbnails, and read analytics for connected YouTube channels in vidIQ. This package covers the "vidIQ MCP" catalog target.

## Interface

vidIQ's official remote MCP server, `https://mcp.vidiq.com/mcp` (Streamable HTTP; setup guide: https://support.vidiq.com/en/articles/15082430-vidiq-mcp). vidIQ publishes no OpenAPI or GraphQL API. The server's tools are exposed directly; any tool without `readOnlyHint` requires approval. The MCP is available on all vidIQ plans (Free, Boost and Max); tool calls draw from the same credit balance as vidIQ's other AI features.

## Auth

- **API key** (`apiKey`): create one in vidIQ at Account Settings > MCP (https://app.vidiq.com/account/settings/mcp). It is sent as `Authorization: Bearer <key>` (unverified, see Known gaps). vidIQ states that write actions (editing video details or thumbnails, publishing Instagram Reels, connecting a channel) do not work with API keys.
- **OAuth** (`oauth`): the server publishes OAuth metadata and dynamic client registration, so no OAuth app needs to be created. Scope `api`. Redirect URI: use Executor's callback URL shown on the connect page. Sign in with the vidIQ account you want to use.

## Known gaps

- The API-key header format is unverified. Neither vidIQ's setup article nor its GitHub README gives a header name or example, and the Cursor setup page (https://vidiq.com/cursor/) could not be fetched (bot checkpoint). Authorization: Bearer is an assumption; OAuth is the confirmed path.
- No credentialed call was made; the tool list depends on the account's plan.
- Icon: vidIQ's official mark from the vendor's repository (https://github.com/vid-io/vidiq-mcp, `assets/vidiq-icon-mark.svg`).
