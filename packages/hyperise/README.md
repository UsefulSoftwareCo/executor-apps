# Hyperise

Hyperise personalises images, videos and web pages for sales and marketing outreach. This package covers its public REST API: validate the token, list image templates, list image views, enrich an email address, create/read/update/delete prospect business records, create personalised short links, and (Agency plan) create client accounts.

**Interface:** custom, hand-written tools over `https://app.hyperise.io/api/v1/regular`. Hyperise publishes no OpenAPI document, GraphQL API or MCP server; the tools follow the official API help pages at https://hyperise.customerly.help/en/collections/4317-api (also served at support.hyperise.com).

**Auth:** API token only (`apiKey`). Create it in Hyperise under Settings > API (https://app.hyperise.io/settings#/api). Hyperise sends the token as an `api_token` query parameter. It offers no OAuth. Mutations require approval.

**Known gaps:** only the six documented APIs plus client account creation are covered; there is no image or video rendering tool, since personalised images are plain URLs built from `base_url` + `image_url` with parameters. Short links need a custom link domain configured in the account. The icon is Hyperise's official app icon PNG (hyperise.com/img/hyperise-icon-new-256.png).
