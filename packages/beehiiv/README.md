# beehiiv

Manage beehiiv newsletters: publications, posts, subscriptions, segments, automations, custom fields, polls, podcasts, referral programs, tiers, ad network and webhooks (118 tools, 48 of them mutations).

**Interface:** OpenAPI 3.1, beehiiv's official API reference at https://developers.beehiiv.com/openapi/api-reference.json (server https://api.beehiiv.com/v2). Mutations require approval. The vendor also offers a developer MCP server, which is documentation-oriented and not used here.

**Auth**

- API key: create one in beehiiv under Settings > Integrations > API (https://app.beehiiv.com/settings/integrations). Sent as a bearer token.
- OAuth 2.0 (authorization code, `client_secret_post`): beehiiv does not offer self-serve OAuth app registration; contact beehiiv support to register a client, and give them the Executor redirect URI shown on the connect page. Authorize and token endpoints are on `https://app.beehiiv.com/oauth/`. Client authentication is `client_secret_post`; this is inferred from the OAuth2 page, which lists `client_id` and `client_secret` as form-body fields for `/oauth/token` and does not mention HTTP Basic. Confirm it with beehiiv support when the client is registered. The requested scopes follow beehiiv's OAuth2 page (https://developers.beehiiv.com/oauth2.md: `identify:read` plus read/write for automations, custom_fields, subscriptions, polls, podcasts, posts, publication_fields, publications, referral_program, segments, tiers and webhooks), not the full OpenAPI spec. Trim them if you only need read access.

**Known gaps:**

- The spec annotates some operations with scopes that the OAuth2 page does not list as grantable: `newsletter_lists:read/write` (12 operations), `data_deletion:read/write` (3), `complimentary_access:read` (2) and `condition_sets:read` (2). Those operations are effectively API-key only; under OAuth they are expected to return 403.
- In the spec, 4 operations carry no `OAuth Scope` annotation (`authors_index`, `authors_show`, `automations_listEmails`, `segments_create`) and `posts_test_send` carries a bare `posts` scope, which looks like a documentation typo. Their real OAuth scope requirements are unconfirmed.
- The icon is beehiiv's official 999px favicon/app icon, since beehiiv publishes no SVG logo. Most tools take a `publicationId` argument; list publications first.
