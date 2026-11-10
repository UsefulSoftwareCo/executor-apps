# RingCentral

Calls, SMS, voicemail, fax, call logs and recordings, presence, meetings, team messaging and account administration through the RingCentral REST API (347 tools, 180 of them mutations that require approval).

Interface: OpenAPI, from RingCentral's official description at https://raw.githubusercontent.com/ringcentral/ringcentral-api-docs/main/specs/ringcentral_openapi3.json. The document's own OAuth URLs are placeholders, so the OAuth endpoints are declared in `index.ts`. Requests go to production (`platform.ringcentral.com`); the sandbox host is not supported.

Auth: OAuth 2.0 authorization code. Create an app at https://developers.ringcentral.com (Console, Create App, "REST API App", 3-legged OAuth authorization code flow), enable the permissions you need, and paste its client ID and secret into the connect page. Add Executor's redirect URI to the app's OAuth Redirect URI. The token request uses HTTP Basic client authentication.

Known gaps: no JWT or password-grant auth (it needs a token exchange outside the OAuth flow); no sandbox; scopes requested are a fixed set and must also be enabled on the app.
