# WoopSocial

Schedule and publish social media posts through WoopSocial: posts and post validation, social accounts, projects, media uploads, webhooks and post analytics.

Interface: OpenAPI, the vendor's official document at https://api.woopsocial.com/v1/openapi.yaml (docs: https://docs.woopsocial.com/api-reference/overview). Every mutation requires approval.

## Auth

- API key (bearer token): create one at https://app.woopsocial.com/api-access and paste it when connecting.

WoopSocial offers no user-created OAuth apps, so there is no OAuth method.

## Gaps

The spec also lists a localhost server, which is ignored; only `https://api.woopsocial.com` is used. WoopSocial also publishes an MCP server, not mounted because the OpenAPI document covers the same tools.
