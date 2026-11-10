# Chili Piper

Meeting routing, scheduling, distributions, users and meetings in Chili Piper. This package also covers the catalog target "Chili Piper (MCP)".

## Interface

Chili Piper's official remote MCP server, `https://fire.chilipiper.com/api/fire-edge/v1/org/mcp` (see https://help.chilipiper.com/hc/en-us/articles/50430350863635-How-do-I-connect-Chili-Piper-via-MCP). It exposes the Edge API surface as tools; tools without a read-only hint require approval. Chili Piper publishes no public OpenAPI document, so no OpenAPI interface is mounted.

## Auth

- API access token (`token`): in Command Center, go to Integrations, Credentials, API Access Tokens and generate a token. It is sent as `Authorization: Bearer <token>`.
- OAuth (`oauth`): the server supports OAuth 2.0 with dynamic client registration and PKCE (metadata discovered from the MCP URL), so no OAuth app needs to be created by hand. It requires an Admin account on a paid Chili Piper plan. Add Executor's redirect URI if the server asks for one.

## Known gaps

The tool list is whatever the server advertises for the account; the MCP probe was only able to confirm the OAuth challenge without credentials.
