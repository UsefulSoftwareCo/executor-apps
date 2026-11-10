# ConvertAPI

Convert files between 200+ formats with ConvertAPI: documents, spreadsheets, presentations, images, PDF operations, web pages, barcodes and QR codes. About 330 conversion and file tools (328 conversion endpoints plus upload, download, delete and head), and user info and statistics.

**Interface:** OpenAPI 3.0, ConvertAPI's official schema at https://v2.convertapi.com/info/openapi (see https://www.convertapi.com/docs/openapi-schema). 334 tools, 0 skipped. The API host is `v2.convertapi.com`; credentials go only to that origin.

**Auth:** two secret methods, both sent as `Authorization: Bearer <token>`. ConvertAPI has no OAuth for API access. Both are copied from the ConvertAPI dashboard Authentication page (https://www.convertapi.com/a/authentication).
- **API token** (`apiKey`): used for conversions and file operations. Create one on the Authentication page.
- **Master token** (`masterToken`): one per account, available to Administrator and Owner roles. It is the only credential that authenticates the admin endpoints `GET /user` and `GET /user/statistic` (the vendor's docs: "authenticates administrative endpoints, like user information, consumption, statistics"). Add it as a separate account or method if you need those two tools. The vendor does not state the exact dashboard location of the Master token on the docs page; look on the Authentication page.

**Health check:** runs `GET /user` with the Master token and checks the always-present `Active` and `Email` fields. API token accounts skip the check, because the API token is rejected by `/user` and ConvertAPI offers no other read-only account endpoint.

**Unauthenticated endpoints:** `POST /upload`, `GET /d/{fileId}` and `DELETE /d/{fileId}` declare no security in the vendor spec, so no token is sent for them. The vendor docs do not say whether they need auth, and this is not verified against a live account.

**Regional hosts:** the spec lists regional servers (eu-v2, uk-v2, us-v2, ca-v2, as-v2, au-v2) but they are not used. `v2.convertapi.com` is the worldwide GEO-routed host, so files may be processed in any region; the vendor serves EU (GDPR) data residency from `eu-v2`. The vendor does not say whether tokens work on regional hosts, so this package does not target them.

**Known gaps:** Every POST and DELETE is a mutation and requires approval; conversions consume conversion credits. The icon is the official ConvertAPI GitHub org avatar (PNG); replace with an official SVG if one is found.
