# Bidsketch

Covers Bidsketch's REST API: clients, proposals (including content, sections and fees), saved fees and sections, templates and webhooks.

Interface: hand-written tools over the official REST API documented at https://github.com/Bidsketch/bidsketch-api (base `https://bidsketch.com/api/v1`). The docs repo was last updated in 2016 and may be stale. No official OpenAPI document or MCP server was found, but that is unverified. So each documented endpoint is a tool; request bodies are passed as a `body` object using the field names in that documentation.

Auth: API token only (Bidsketch has no OAuth). Tokens are created at `[subdomain].bidsketch.com/account/api_tokens`; only Admin users can manage them. It is sent as `Authorization: Token token="..."`. Tokens are limited to 100 requests per 20 seconds.

Icon: the "B" mark cropped from the vendor's wordmark SVG (https://bidsketch.com/images/marketing/v2/bidsketch-logo-large-reverse.svg), recolored to the teal #008d9b used on the Bidsketch homepage; Bidsketch publishes no standalone mark of 128px or larger.

Known gaps: the API cannot update webhooks or create/modify templates; there are no tools for sending proposals or reading signatures.
