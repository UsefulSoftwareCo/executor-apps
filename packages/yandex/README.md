# Yandex

Yandex Disk (browse, search by listing, copy, move, delete, publish, trash and restore, upload from URL, temporary download/upload links) and read-only Yandex Metrica (counters, goals, filters, grants, operations and Reporting API data), plus the Yandex ID profile. 31 tools.

**Interface:** hand-written tools over the documented REST APIs: Yandex Disk (https://yandex.com/dev/disk-api/doc/en/, `cloud-api.yandex.net`), Yandex Metrica (https://yandex.com/dev/metrika/en/, `api-metrika.yandex.net`) and Yandex ID (`login.yandex.ru`). Yandex publishes only a legacy Swagger 1.2 schema for Disk (`https://cloud-api.yandex.net/v1/schema?api=disk`), no OpenAPI 3 document, and no remote MCP server, so tools are written by hand. "Yandex" is a brand umbrella; this package covers Disk and Metrica. Yandex Music, Geocoder, Mail, Calendar and Cloud use different APIs and are not covered.

## Auth

- **OAuth token** (`token`): create an app at https://oauth.yandex.com/client/new, enable the permissions Disk REST API (read, write, info), Yandex.Metrica (read) and Yandex ID login info, then generate a token (https://yandex.com/dev/id/doc/en/tokens/debug-token) and paste it. Sent as `Authorization: OAuth <token>`.
- **OAuth 2.0** (`oauth`): use the same OAuth app with the Executor redirect URI shown on the connect page added as its Callback URI, then enter its ID and password as the client ID and secret. Scopes requested: `login:info`, `cloud_api:disk.info`, `cloud_api:disk.read`, `cloud_api:disk.write`, `metrika:read`. Endpoints `https://oauth.yandex.com/authorize` and `/token`; client credentials (`client_id`, `client_secret`) go in the form body alongside `grant_type=authorization_code` and `code`, which the Yandex OAuth docs (https://yandex.com/dev/id/doc/en/codes/code-url) confirm. Yandex limits an authorization app to three permission groups; this package requests exactly three (`login`, `cloud_api`, `metrika`), so adding another group would fail.

## Known gaps

- No byte transfer: Disk uploads and downloads go to short-lived `*.disk.yandex.net` hosts. The package returns the link (`disk.downloadLink`, `disk.uploadLink`) and offers `disk.uploadFromUrl`; it does not stream files.
- Metrica is read-only; creating counters, goals and uploading offline data are not exposed. Yandex Direct, Webmaster and other Yandex products are not covered.
- Not tested with live credentials.
