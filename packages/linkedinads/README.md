# LinkedIn Ads

Manage LinkedIn Campaign Manager from an agent: ad accounts and their users, campaign groups, campaigns, creatives, targeting discovery and audience-size estimates, and performance analytics (single and multi-pivot, including member demographics). This is the advertising side of LinkedIn; posting as a member is the separate `linkedin` package.

## Interface

Custom tools over LinkedIn's Marketing REST API at `https://api.linkedin.com/rest/*` with the `LinkedIn-Version` header (pinned to `202609`) and Rest.li 2.0 protocol. LinkedIn publishes no OpenAPI document, GraphQL API or MCP server for it, so the tools are hand-written against the official docs at <https://learn.microsoft.com/en-us/linkedin/marketing/> (accounts, campaign groups, campaigns, creatives, `adAnalytics`, ad targeting). Create and update tools take the documented JSON body for fields that are open-ended (campaign body, targeting criteria, `$set` patches). Mutations require approval.

## Auth

OAuth 2.0 only; LinkedIn has no personal API keys.

1. Create an app at <https://www.linkedin.com/developers/apps> and request the **Advertising API** product (LinkedIn reviews it; development tier works for test ad accounts).
2. On the Auth tab add the redirect URI shown on Executor's connect page, then paste the Client ID and Client Secret into the connect page.

Scopes requested: `r_ads`, `rw_ads`, `r_ads_reporting`. The member also needs a role on the ad account (VIEWER is read-only; CAMPAIGN_MANAGER or higher to change things).

## Known gaps

- Not included because they need other LinkedIn products or permissions: lead gen forms and lead responses, conversion rules and the Conversions API (`rw_conversions`), matched audiences/DMP segments, organization pages and organic share statistics (Community Management), media/image uploads for creatives (create the post first, then reference it).
- Tools for the audience count and targeting entity endpoints were written from LinkedIn's targeting docs and are not exercised against a live account.
- Batch operations are not exposed; call the single-entity tools.
- PKCE: the package cannot control whether the host sends `code_challenge`. Unverified: it needs a live authorization request with a real LinkedIn developer app, which was not made. A fake client_id cannot distinguish rejection of code_challenge from rejection of the client. If LinkedIn rejects code_challenge, the framework needs an opt-out for PKCE (out of scope here). LinkedIn's docs do not mention PKCE.
- LinkedIn only returns refresh tokens to approved partner apps; other tokens last about 60 days.
- The `LinkedIn-Version` header is pinned to `202609`; LinkedIn sunsets versions after a year.
