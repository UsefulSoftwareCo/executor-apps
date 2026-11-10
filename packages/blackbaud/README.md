# Blackbaud

Raiser's Edge NXT constituent, gift, event and donor data through Blackbaud's official remote MCP server for the SKY API, `https://mcp.sky.blackbaud.com/mcp` (a third-party index lists it as "Blackbaud for Claude" in the Blackbaud Marketplace; not confirmed by Blackbaud). Tools are discovered from the server at run time; every tool not annotated read-only requires approval.

## Interface

Official remote MCP server. Blackbaud publishes no public OpenAPI document for the SKY REST API (`https://api.sky.blackbaud.com`), so the MCP server is the only official source of a broad tool set.

## Auth

OAuth 2.0 authorization code with PKCE (S256), `mcp:tools` scope. Blackbaud's OAuth server (`https://app.blackbaud.com/oauth/authorize`, `https://oauth2.sky.blackbaud.com/token`) has no dynamic client registration, so create an application at https://developer.blackbaud.com/apps, add Executor's redirect URI shown on the connect page to it, and paste its application ID and secret as the OAuth client. The Blackbaud environment's admin may need to enable the connector in the Blackbaud Marketplace first; data access follows the signed-in user's Blackbaud permissions.

## Known gaps

- Tool surface unverified: the tool list has not been observed. `node scripts/mcp-probe.ts` now runs and shows 401 plus OAuth metadata (issuer `https://oauth2.sky.blackbaud.com/`, S256 PKCE, scope `mcp:tools`, no registration endpoint), but tool names cannot be listed without a token.
- The token endpoint auth method `client_secret_basic` is the RFC 8414 default; the metadata does not list `token_endpoint_auth_methods_supported` and Blackbaud docs were not confirmed.
- Not verified end to end: no real account was connected. Typecheck and deploy pass, and the unauthenticated server answers 401 with OAuth metadata, but the server's tool list and whether it accepts tokens from a self-registered SKY application are unconfirmed.
- The REST API's subscription-key (`Bb-Api-Subscription-Key`) flow, the Blackbaud CRM API and the SOAP "basic auth" Blackbaud products are not covered.
