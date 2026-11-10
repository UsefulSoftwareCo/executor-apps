# Firebase

Administer Firebase projects: create and manage Android, iOS and web apps, Hosting (sites, channels, versions, releases, domains), Authentication (users, tenants, identity providers), Cloud Messaging (send, topic subscriptions), App Distribution, App Check, Realtime Database instances and Security Rules. 262 tools on an OAuth account and 19 on a Web API key account; every mutation requires approval.

## Interface

OpenAPI, vendored as one JSON file per API. Google publishes its APIs only as Discovery documents, so `discovery-to-openapi.mjs` converts Google's official documents into OpenAPI 3 (our conversion, checked in; no maintained official OpenAPI exists). Mounts and sources (`https://<host>/$discovery/rest?version=<v>`):

- `management` firebase.googleapis.com v1beta1 (37 tools)
- `hosting` firebasehosting.googleapis.com v1beta1 (66)
- `auth` identitytoolkit.googleapis.com v1, `/v1/projects/...` admin endpoints (22)
- `authconfig` identitytoolkit v2, `/v2/projects/...` (41)
- `messaging` fcm.googleapis.com v1 (6)
- `appdistribution` firebaseappdistribution v1 (26)
- `appcheck` firebaseappcheck v1 (46)
- `database` firebasedatabase v1beta (7)
- `rules` firebaserules v1 (11)
- `client` identitytoolkit v1 `/v1/accounts:*` end-user endpoints (19), Web API key accounts only

To refresh, download a document and run `node packages/firebase/discovery-to-openapi.mjs <doc> > packages/firebase/<name>.json`; `auth.json`, `authconfig.json` and `client.json` are then filtered by path prefix (`/v1/projects`, `/v2/projects`, everything else under `/v1`), and `client.json` has its security rewritten to the `x-goog-api-key` header scheme. Firebase's official MCP server is a local `firebase-tools` process, not a remote server, so it is not used.

## Auth

- OAuth 2.0 (admin tools): discovery from `https://accounts.google.com`, scopes `openid email profile`, `firebase`, `firebase.messaging` and `cloud-platform`, with `access_type=offline` and `prompt=consent` for a refresh token. Create a "Web application" OAuth client in Google Cloud Console (APIs & Services > Credentials), enable the Firebase Management, Hosting, Identity Toolkit, FCM, App Distribution, App Check, Realtime Database Management and Rules APIs on the project, and add Executor's redirect URI from the connect page as an authorized redirect URI. Not verified with a real account.
- Web API key (client tools only): the Web API key of a Firebase project (Project settings > General), sent as `x-goog-api-key`. It unlocks sign-up, sign-in with password, custom token or IdP, email-link and phone flows, password reset, OOB codes (verification and reset emails), and account lookup/update/delete with a user's ID token. Not verified with a real key.

## Known gaps

- Secure Token refresh (`securetoken.googleapis.com/v1/token`) is not in Google's Discovery documents and is not included.
- Cloud Firestore, Cloud Storage for Firebase, Data Connect, Remote Config and Crashlytics APIs are not included. Realtime Database data itself (REST on the instance host) is not included.
- Hosting file upload to the upload URL and App Distribution binary upload (`media.upload`) are exposed only as the JSON methods.
- No service account auth (Executor has no JWT-bearer method).
- Identity Toolkit v2 client endpoints (MFA, password policy, recaptcha config) are dropped.
- Sign-in endpoints that are read-like (lookup, queryAccounts) run without approval; all other mutations need it.

## Icon

Firebase mark from Simple Icons (`firebase`).
