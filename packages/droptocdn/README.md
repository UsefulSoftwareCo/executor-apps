# Drop to CDN

Upload files and publish HTML pages to public Cloudflare-hosted CDN URLs, then list, inspect and delete hosted files.

**Interface:** OpenAPI, the vendor's own live spec at https://api.droptocdn.com/v1/openapi.json (5 operations: list/upload files, get/delete a file, publish a page).

**Auth:** API key. Create it in the Drop to CDN dashboard under Settings (a default key is made at registration). It is sent as `Authorization: Bearer dtc_...` to `api.droptocdn.com`. The service offers no OAuth.

**Known gaps:** the public spec has no usage/review endpoints. Mutations require approval.
