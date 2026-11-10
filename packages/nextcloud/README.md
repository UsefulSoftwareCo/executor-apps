# Nextcloud

Files, users, groups, shares, Talk conversations, notifications, user status, activity and server apps on a Nextcloud server, plus a generic OCS escape hatch.

Interface: custom hand-written tools over the Nextcloud OCS API (https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-api-overview.html) and WebDAV for files (https://docs.nextcloud.com/server/latest/developer_manual/client_apis/WebDAV/basic.html). Nextcloud publishes per-app OpenAPI files in its source repository, but the API origin is the user's own server, so the tools are written by hand. Groups: `files` (list/read/write/createFolder/move/copy/delete), `users`, `groups`, `shares`, `server` (capabilities and apps), `notifications`, `status`, `activity`, `talk` and `request.ocs` for any other OCS endpoint. Every mutation requires approval.

## Auth

- App password (`appPassword`): in Nextcloud open Personal settings, Security, "Devices & sessions", enter a name and choose "Create new app password". Connect with the server URL (for example `https://cloud.example.com`, sub-path installs such as `https://example.com/nextcloud` work), the user name and the app password. Sent as HTTP Basic authentication with the `OCS-APIRequest: true` header. Admin tools (users, groups, apps) need an admin account.

## Known gaps

- OAuth is not offered: Nextcloud OAuth 2 clients are registered per server by an admin.
- Documented exception: the provider declares no `hosts`. Nextcloud is self-hosted on arbitrary origins and framework host patterns cannot cover them. The app code therefore receives the raw app password, not a handle. It is sent only to the https origin of the server URL you connect with, enforced by the package's own `serverOrigin()`, not by the framework.
- `files.read` and `files.write` handle UTF-8 text only; there is no binary upload or download.
- Talk, notifications, activity and user status need the matching Nextcloud apps enabled.
