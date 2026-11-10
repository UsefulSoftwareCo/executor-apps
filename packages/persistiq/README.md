# PersistIQ

Sales outreach automation: leads, campaigns (including adding and removing leads and posting replies), lead fields and statuses, events, tags, do-not-contact domains, users and the webhook plugin.

**Interface:** OpenAPI 3.0.1, PersistIQ's own document at https://api.persistiq.com/api-docs/v1/swagger.json (base URL `https://api.persistiq.com`). Every mutation requires approval.

**Auth:** API key only (PersistIQ offers no OAuth). It is a company-wide key sent in the `x-api-key` header. Find it in PersistIQ under Settings > Integrations > API Key. The health check lists users and only checks that the request succeeds.

**Icon:** the vendor's own 180px app icon from https://persistiq.com/apple-touch-icon.png (not in Simple Icons).

**Known gaps:** the API is rate limited to 100 requests per minute per key.
