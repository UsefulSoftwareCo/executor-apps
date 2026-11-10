# Drupal

Covers a Drupal site's content through core JSON:API: content items (nodes), taxonomy terms, users, media, comments, custom blocks, custom menu links and file metadata, plus generic list/get/create/update/delete tools for any other resource type the site exposes (`resources.*`, with `index` listing them). 43 tools, 18 of them mutations that require approval.

Interface: custom, hand-written tools over the JSON:API module that ships with Drupal core (https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module). Drupal is self-hosted and publishes no static OpenAPI document (the `openapi` contrib module generates one per site, and is not assumed), so the tools are generic over entity type and bundle. Query parameters (`filter[...]`, `sort`, `page[limit]`, `include`, `fields[...]`) are passed through `query`.

Auth, two methods, both asking for the site address (for example `https://example.com`, https only; a path prefix is kept for subdirectory installs):
- Username and password: Drupal core's Basic Authentication module must be enabled, and the user needs permission to use JSON:API and to read or write the content involved.
- Simple OAuth client credentials: install the Simple OAuth contrib module, create a Consumer (Administration > Configuration > Simple OAuth > Consumers) with the Client Credentials grant and a user whose roles apply, then enter the Client ID and secret. Executor exchanges them for a bearer token at `/oauth/token` and renews it. The grant is performed in code because the token endpoint is on the site's own host. There is no `oauth2` redirect flow, so no redirect URI is needed.

Credentials are only sent to the origin entered for the account.

Known gaps: JSON:API must be enabled on the site and its write mode left on for mutations to work. File uploads, JSON:API Extras customised paths, and the `/rest_api/access_token` flow (a site-specific module, not Drupal core or Simple OAuth) are not supported. Icon is the Simple Icons Drupal mark.
