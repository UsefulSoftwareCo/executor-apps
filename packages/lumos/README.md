# Lumos

Administer Lumos (identity governance and access management): apps, users, groups, accounts, access policies and reviews, AppStore requestable permissions and access requests, tasks, vendor agreements and user offboarding.

**Interface:** OpenAPI, Lumos's official document at https://api.lumos.com/openapi.json (API reference: https://developers.lumos.com).

**Auth:** API token (`apiKey`), sent as `Authorization: Bearer <token>` to `api.lumos.com`. Create it in Lumos under Settings > API tokens (tokens look like `lsk_...`). Lumos offers no user-created OAuth apps. Mutations require approval.

**Known gaps:** the `/webhooks/*` callback endpoints are inbound vendor hooks and are not meaningful as tools.
