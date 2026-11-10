# Elastic Email

Covers the Elastic Email v4 REST API: sending transactional email, campaigns, contacts, lists, segments, templates, files, domains, inbound routes, suppressions, events, statistics, email verification, webhooks, subaccounts and API keys/SMTP credentials.

**Interface:** OpenAPI 3.0, the vendor's official document at https://api.elasticemail.com/public/v4/swagger (74 paths).

**Auth:** API key only. Elastic Email offers no user-created OAuth apps. Create a key in the Elastic Email app under Settings > Manage API Keys (https://app.elasticemail.com/api/settings/manage-api) and pick the permissions the key needs. It is sent in the `X-ElasticEmail-ApiKey` header to `api.elasticemail.com`.

**Known gaps:** the alternate `X-Auth-Token` custom-branding scheme is not exposed. Health check calls `GET /lists?limit=1`, so a key without list read access will show as unhealthy.

**Icon:** the official arrow-loop app icon (270px PNG) from elasticemail.com; Simple Icons has no entry.
