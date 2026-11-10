# Productlane

Customer support for software companies (Productlane's own wording), Linear native. This package covers the Productlane API v2: threads and messages, comments, contacts, companies, changelogs, help docs, projects, issues, tags, snippets, portal, members and workspace settings (webhooks, API keys, integrations and so on).

## Interface

OpenAPI, from Productlane own v2 document: https://productlane.com/api/v2/openapi (docs: https://productlane.mintlify.dev/docs/api-v2/introduction). Every operation lives on https://productlane.com/api/v2. Mutations require approval.

## Auth

API key only. Create one in Productlane under Settings, Integrations, API, then Create API key, and paste it as the API key. v2 keys start with `pl_v2_`; v1 keys (`pl_v1_*`) are rejected with HTTP 410 `unsupported_key_version`. It is sent as a bearer token. Productlane does not offer user-created OAuth apps, so there is no OAuth method.

## Known gaps

The v1 API (https://productlane.com/api/v1/openapi) is legacy and not included. Key scopes are enforced by Productlane: operations outside the key scopes return 403.

## Icon

The icon is Productlane's published `favicon.svg`. It is a vector file (not a 16/32px raster) and the only official SVG mark the vendor publishes; its brand pages offer raster uploads only.
