# GageList

Calibration management for gages and instruments: list, read, add, update and delete gage records and calibration records, list manufacturers, and read account status and settings.

**Status: blocked on authentication.** See Auth.

## Interface

Hand-written tools over the GageList REST API (`https://gagelist.net/GageList/api`, 13 tools). GageList publishes no OpenAPI document; its docs (https://gagelist.com/developer-resources/) are prose pages and the API explorer needs a login. The documentation site is behind a Cloudflare challenge and could not be read directly. Only `GET /Account/Status` with a Bearer token is corroborated (a Pipedream example). Every other path (`/Gage/List`, `/Gage/Detail/{id}`, `/Gage/Create`, `/Gage/Update`, `/Gage/Delete/{id}`, the `/Calibration/*` paths, `/Account/Settings`, `/Manufacturer/List`) and the POST-with-JSON-body plus `start`/`record_number` query-string list convention are unverified guesses from naming convention.

## Auth

GageList's "Authenticate with GageList" page describes a form POST to the token endpoint (`https://gagelist.net/api/token`) with `grant_type=password` plus `client_id` and `client_secret`. Whether a username and password are also required is unverified. The apps framework `oauth2` type only accepts `grant: "client_credentials"`, so the package currently declares client credentials, which does not match the vendor and will likely fail at connection time. This needs a framework password grant or a custom credentials-exchange auth type (or confirmation of the real request) before shipping.
## Known gaps

- Manufacturer create, update and delete, and account settings update are not exposed (paths unknown).
- Attachments (get and upload), custom fields (get and update values) and calibration certificate generation are not exposed.
- All paths except `GET /Account/Status` are unverified against the vendor.
