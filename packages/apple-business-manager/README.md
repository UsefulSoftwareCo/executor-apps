# Apple Business Manager

Lists organization devices, the device management (MDM) servers they can be assigned to, and assigns or unassigns devices through Apple's Business API (`https://api-business.apple.com/v1`: `orgDevices`, `mdmServers`, `orgDeviceActivities`). The tools are hand-written because Apple publishes its reference as developer documentation pages, not as a downloadable OpenAPI document. Paths, `fields[<type>]` parameters, `limit` (maximum 1000), `cursor` with `meta.paging.nextCursor`, the `/assignedServer` and `/relationships/assignedServer` variants and the `orgDeviceActivities` request body were checked against Apple's Apple Business API reference (developer.apple.com/documentation/applebusinessapi). Also covered: users, audit events, device Activation Lock status and AppleCare coverage. Apple Business Manager is now called Apple Business; the API is the same. Blueprints, configurations, apps, packages, user groups and organizational units exist in the API but are not wrapped. Assign and unassign always ask for approval.

## Auth

API account credentials (OAuth 2.0 client credentials with a signed JWT assertion). In Apple Business Manager open Preferences, then API, create an API account and key, and download the private key (a PKCS#8 `.pem`). Enter the client ID (`BUSINESSAPI.…`), the key ID and the PEM contents. The app signs an ES256 JWT (`iss` and `sub` = client ID, `aud` = `https://account.apple.com/auth/oauth2/v2/token`, `kid` = key ID) and POSTs it to `https://account.apple.com/auth/oauth2/token` with scope `business.api` (use `school.api` for Apple School Manager, which this package does not target). Apple's OAuth guide documents this split: the request goes to `/auth/oauth2/token` while the audience claim is the `/v2/token` URL. Access tokens last one hour and are renewed on a 401. Tokens are cached per account. There is no browser OAuth flow, so there is no redirect URI.

## Icon

The official Apple Business app icon (512px PNG) that Apple Inc. publishes on the App Store, taken via Apple's iTunes lookup API. Apple Business Manager was renamed Apple Business, and Simple Icons has no mark for it.

## Known gaps

Credentials were not exercised against Apple; the token request follows the documented curl example but has not been run live.
