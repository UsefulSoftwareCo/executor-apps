# Upload-Post

Upload-Post is a unified social media publishing API. This package covers uploading videos, photos, text and documents, scheduling and the post queue, upload history and status, retry/unpublish, user profiles and JWT connect links, analytics, comments and DMs, platform helpers (Facebook/LinkedIn pages, Pinterest boards, TikTok settings) and the FFmpeg jobs API.

Interface: the vendor's official OpenAPI 3 document at https://docs.upload-post.com/openapi.json (base URL https://api.upload-post.com/api). Mutations require approval.

Auth: API key (`Authorization: Apikey <key>`). Create one in the Upload-Post dashboard: the vendor's authentication guide says to open the "API Keys" section (https://app.upload-post.com/api-keys) and choose "Generate New API Key". OAuth is not offered for the API itself.

Known gaps:
- Two operations are intentionally omitted because the spec secures them with BearerAuth (a per-profile JWT from the white-label connect flow), which this package does not configure: `GET /uploadposts/users/validate-jwt` and `GET /uploadposts/reddit/detailed-posts`. They are not generated as tools, so they will not appear and fail with an API key.
- `POST /uploadposts/users/notifications` (configureNotifications) is skipped (`multiple_hosts`) because it uses its own server, https://app.upload-post.com/api. That host is intentionally not in `hosts`; enabling the operation later requires adding it.
- The FFmpeg download endpoint is included. Endpoints that upload local files use multipart bodies, so pass media as URLs.
