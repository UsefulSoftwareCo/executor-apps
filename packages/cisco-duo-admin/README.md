# Cisco Duo Admin

Manage Duo users, groups, phones, hardware tokens, bypass codes, administrators, integrations and policies, and read authentication, administrator and telephony logs, through the Duo Admin API (46 tools).

**Interface:** hand-written tools over the official Admin API, https://duo.com/docs/adminapi . Duo publishes no OpenAPI document for the Admin API (only for the Duo Network Gateway API), and its requests need a per-request HMAC signature that a generic OpenAPI client cannot produce, so each tool signs its own request (signature version 2, HMAC-SHA1, documented at https://duo.com/docs/adminapi#authentication).

**Auth:** API application credentials. In the Duo Admin Panel go to Applications > Protect an Application, add an "Admin API" application, grant it the permissions you need (read resource, read log, grant/write resource...), and copy the API hostname (`api-xxxxxxxx.duosecurity.com`), integration key (`DI...`) and secret key. Duo has no OAuth for the Admin API. The secret key is stored as a readable field because the app must compute the signature; it is only ever sent as the signature, never on the wire. Hostnames ending in `duofederal.com` are accepted too.

**Known gaps:**
- Not covered: bulk user endpoints, MSP sub-account and billing endpoints (`/accounts/v1`, `/admin/v1/billing`), branding, trust monitor events, Duo Desktop, custom user attributes, directory sync, administrator creation, integration create/update, and policy writes.
- The signed Date header is sent as `-0000` UTC, as in Duo's documentation; the Admin API app needs the matching permission for each tool or Duo answers 40301.
- Not exercised against a live tenant; endpoints and parameters follow the vendor docs.
