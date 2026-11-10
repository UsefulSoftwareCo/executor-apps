# EspoCRM

Accounts, contacts, leads, opportunities, cases, tasks, meetings, calls, emails, documents, campaigns, target lists, users and any other (including custom) entity type on an EspoCRM instance, with related-record linking and streams.

Interface: custom hand-written tools over the EspoCRM REST API (https://docs.espocrm.com/development/api/). EspoCRM 9.3+ serves an OpenAPI document, but only from each instance (`/api/v1/OpenApi`, for admins and API users), not at a stable public URL, so it cannot be mounted here. 17 typed entity groups (list, get, create, update, delete, listRelated, link, unlink, stream each), the same nine on `records` for any entity type, plus `stream.list/post` and `meta.currentUser/metadata/settings`. Every mutation requires approval.

## Auth

- API user key (`apiKey`): in EspoCRM, Administration, API Users, create an API user with the "API Key" authentication method, assign it a Role that limits what it may access, and copy the API Key. Connect with the instance URL (for example `https://crm.example.com`, a sub-path install is fine) and the key. Sent as the `X-Api-Key` header.

## Known gaps

- OAuth is not offered: EspoCRM has no OAuth provider for API access. HMAC and Basic authentication are not offered; the API key method is the documented simple route.
- Documented exception: the provider declares no `hosts`. EspoCRM is self-hosted on arbitrary origins that framework host patterns cannot cover, so app code receives the raw API key. It is sent only to the https origin of the URL you connect with, which is enforced by the package's own `siteOrigin()`.
- `where` filters are sent in PHP bracket notation; very complex filters may need a `whereGroup` form that is not exposed.
- Mass actions, attachments upload and import are not exposed.
