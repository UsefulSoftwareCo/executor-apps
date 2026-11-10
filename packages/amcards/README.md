# Amcards

Send physical greeting cards and manage AMcards contacts, groups, cards, mailings, campaigns, templates, gifts, credit transactions, payment methods, photos and vectors (43 tools).

## Interface

Hand-written tools over AMcards' REST API (Tastypie-style resources) at `https://amcards.com/.api/v1/` (resource index: https://amcards.com/.api/v1/). AMcards publishes no OpenAPI document, MCP server or GraphQL API, and no public API reference was found. Resources and paths come from the live API index and the public resource schemas (category, gift). Private resource schemas require a token, so create/update bodies are free-form JSON; use each resource's `schema` tool to see the fields and allowed methods for your account. Tools for methods an account's resource does not allow return AMcards' 405 error.

## Auth

API access token only. It is labeled "API Access Token" in the AMcards dashboard; the exact menu location is unverified, as AMcards publishes no API documentation. It is sent as `Authorization: Token <token>`. This scheme (Django REST framework token auth) is unverified against vendor docs or a real token; if requests return 401, try `Bearer`. AMcards offers no OAuth app registration to users, so no OAuth method is declared. Health check: `GET /user/`.

## Known gaps

- Mutation tools were not exercised against a real account (no credentials were used).
- Wallet resource and file/photo upload are not exposed.