# Cloudinary

Manage Cloudinary media: upload and destroy assets, rename, tag, explode and archive them, folders, upload presets, upload mappings, named transformations, structured metadata fields and rules, moderation, streaming profiles, triggers, usage and search.

**Interface:** OpenAPI. The source is Cloudinary's official combined "Cloudinary API v1.1" schema (OpenAPI 3.1) published at https://github.com/cloudinary/api-schemas (`api/schema.yml`), compiled live. It yields 114 tools (76 mutations, all behind approval). Every operation lives under `https://api.cloudinary.com/v1_1/{cloud_name}/...`, so `cloud_name` is a tool argument.

**Auth:** API key and secret (HTTP Basic). Create or copy them in the Cloudinary Console under Settings > API Keys. The connection asks for your cloud name, API key and API secret; the cloud name is used for the health check (`/ping`).

**OAuth:** Cloudinary documents customer-registered OAuth apps (beta; https://cloudinary.com/documentation/using_oauth_to_access_cloudinary_apis). Create one in the Console under Settings > Developers > OAuth Apps, using the Executor redirect URI shown on the connect page, client secret post auth, and the Upload, Asset Management and Offline Access scopes. Access tokens last 5 minutes and refresh tokens rotate. The user's roles still limit what the app may do.

**Known gaps:**
- OAuth is untested against a live account. The scope strings `asset_management` and `upload` come from the official schema and `offline_access` (needed for refresh tokens) is assumed from standard OAuth naming because the docs show only Console labels. The OAuth health check makes no network call because the token carries no cloud name; a bad token shows up on the first tool call.
- Only the regional default host `api.cloudinary.com` is used; EU/AP regional hosts (`api-eu`, `api-ap`) are not routed.
- The separate Environment Config, Provisioning and beta AI (image-to-video, video analysis, video canvas) schemas are not mounted; the combined schema covers the core upload, admin and search APIs.
- Uploads of local files must pass a URL, data URI or remote path as `file`; multipart bodies are limited to what the framework supports.
