# Oomnitza

Covers the Oomnitza v3 REST API: assets, users, software, accessories, contracts, locations, stockrooms, subscriptions, SaaS applications (roles and users), custom objects and their records, activity and connector run logs, plus a `request` escape hatch for any other `/api/v3` path.

**Interface:** hand-written tools over `https://<subdomain>.oomnitza.com/api/v3`. Oomnitza publishes its Swagger docs only inside each customer instance (Configuration > Integrations > Rest APIs), not at a public URL, so there is no OpenAPI document to compile. Endpoints follow the vendor's [REST API help article](https://oomnitza.zendesk.com/hc/en-us/articles/17200339347991-Oomnitza-REST-APIs); the endpoint list was cross-checked against the community-generated client at github.com/Yohan460/oomnitza (unofficial, used for facts only).

**Auth:** API token (`apiKey`). Enter your instance subdomain (`mycompany` for `https://mycompany.oomnitza.com`) and an API token generated in your Oomnitza user profile. The token is sent in the `Authorization2` header. OAuth is not offered by Oomnitza.

**Approvals:** every create, update and delete requires approval.

**Known gaps:** request and response bodies are untyped JSON because the schemas are instance-specific (custom fields vary per tenant); call `assets.meta` to see field names. The v4 API is not covered.
