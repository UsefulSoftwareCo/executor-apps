# Shorten.REST

Create and manage Shorten.REST short link aliases (list, create, update, delete, per-domain listing) and read click analytics.

## Interface

OpenAPI (Swagger 2.0), from Shorten.REST's official document at https://docs.shorten.rest/swagger.json (loaded live). API host: https://api.shorten.rest. Every mutation requires approval. No official MCP server or GraphQL API exists.

## Auth

API key, sent in the `x-api-key` header. Create one in the Shorten.REST dashboard at https://app.shorten.rest. No OAuth is documented.

## Icon

The "S" app icon from https://shorten.rest/apple-touch-icon.svg.

## Known gaps

The API is small (a handful of operations on aliases and clicks); domain and account administration is dashboard-only.
