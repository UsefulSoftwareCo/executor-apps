# DEV Community

Publish and read on DEV Community (dev.to): articles, comments, reactions, tags, users, organizations, podcasts, follows, analytics, and admin/moderation endpoints (billboards, badges, segments, pages and others, available to accounts with the matching role).

**Interface:** OpenAPI. Forem's own API V1 description, https://raw.githubusercontent.com/forem/forem-docs/974a6b62dc48d7500ec724ebc65287eed7ea946f/api_v1.json (Forem is the open-source software behind dev.to), mounted at https://dev.to. 126 tools, 54 of them mutations (each requires approval). The package adds the `Accept: application/vnd.forem.api-v1+json` and `User-Agent` headers. The Accept header is required by the documented API V1; the User-Agent is not documented, but dev.to returns 403 on requests without one.

**Auth:** API key. Create one at https://dev.to/settings/extensions under "DEV API Keys"; it is sent in the `api-key` header. DEV offers no OAuth for third-party apps, so there is no OAuth method.

**Known gaps:** The spec is pinned to forem-docs commit 974a6b6, so the tool list is reproducible; bump the SHA to pick up upstream API changes. Admin endpoints fail for non-admin keys.
