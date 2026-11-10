# Google Forms

Google Forms and quizzes: create forms, read and batch-update their questions and settings, manage
publication, read responses, and create or delete response watches (Pub/Sub notifications).

**Interface:** OpenAPI. Google publishes the Forms API only as a Discovery document and has no
official Forms MCP server, so this uses APIs.guru's maintained OpenAPI conversion of Google's
official Forms v1 Discovery document, an unofficial conversion:
https://api.apis.guru/v2/specs/googleapis.com/forms/v1/openapi.json. The conversion omits `forms.setPublishSettings`,
which is in the Discovery document, so that one tool is hand-written (`custom.setPublishSettings`).
Forms created through the API after June 30, 2026 are unpublished by default; call it with
`isPublished` and `isAcceptingResponses` true to collect responses. Generated tools sit under `api.`.
Requests go to `https://forms.googleapis.com`. Mutations require approval.

**Auth:** OAuth 2.0 with your own Google OAuth client (Google has no dynamic client registration).
In the Google Cloud console, enable the Google Forms API, configure the OAuth consent screen, and
create an OAuth client ID of type "Web application". Add the redirect URI shown on Executor's
connect page to the client's authorized redirect URIs, then paste the client ID and secret into the
connect page. Scopes requested: `forms.body` and `forms.responses.readonly` (plus `openid email
profile` to identify the account); the app asks for offline access so it receives a refresh token.

**Known gaps:** no API-key method (the Forms API only accepts user OAuth tokens); the API cannot
list forms (use Google Drive to find form IDs). Response watches need a Cloud Pub/Sub topic. While
the OAuth consent screen is in Testing status, Google expires refresh tokens after 7 days; publish
the consent screen for long-lived access.
