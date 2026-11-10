# Ghost (Admin API)

Posts, pages, tags, members, labels, tiers, newsletters, offers, staff users, webhooks, site info, settings and themes on a Ghost publication, plus a `request` escape hatch for any other Admin API endpoint.

## Interface

Hand-written tools over the official Ghost Admin API (`https://<site>/ghost/api/admin/`, docs at https://docs.ghost.org/admin-api). Ghost publishes no OpenAPI document and no official MCP server, so the documented integration endpoints are wrapped directly. Create and update tools take the body wrapped in the resource name, as in the docs (`{"posts": [{...}]}`); browse tools take `filter` (NQL), `limit`, `page`, `order`, `include` and `fields`. Every create, update, delete and the `request` tool requires approval.

## Auth

Admin API key. In Ghost Admin open Settings > Integrations, add a custom integration (or use a staff access token from your user profile) and copy:

- **Site URL**: the Admin API URL shown there, for example `https://mysite.ghost.io` (custom domains and sub-path installs work; must be https).
- **Admin API key**: in the form `{id}:{secret}`. The app signs a 5-minute HS256 JWT from it per request (`Authorization: Ghost <token>`).

Ghost documents no OAuth flow for the Admin API, so none is declared. The provider declares no `hosts` because every site has its own domain; requests are only sent to the account's own site origin.

## Known gaps

- Image and theme uploads are multipart and not supported.
- Integration keys are limited to the documented endpoints; `site.settings` and `site.themes` need a staff access token of an Owner/Admin and may be refused otherwise.
- Icon: Simple Icons `ghost`.
