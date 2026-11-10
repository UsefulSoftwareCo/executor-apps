# Google Classroom

Courses, rosters (students, teachers), invitations, coursework, coursework materials, announcements,
topics, student submissions and grading, and guardians in Google Classroom.

**Interface:** OpenAPI. Google publishes the Classroom API only as a Discovery document and has no
official Classroom MCP server, so this uses APIs.guru's maintained OpenAPI conversion of Google's
official Classroom v1 Discovery document, an unofficial conversion:
https://api.apis.guru/v2/specs/googleapis.com/classroom/v1/openapi.json. Requests go to
`https://classroom.googleapis.com`. Mutations require approval.

**Auth:** OAuth 2.0 with your own Google OAuth client (Google has no dynamic client registration).
In the Google Cloud console, enable the Google Classroom API, configure the OAuth consent screen, and
create an OAuth client ID of type "Web application". Add the redirect URI shown on Executor's
connect page to the client's authorized redirect URIs, then paste the client ID and secret into the
connect page. Scopes requested cover courses, rosters, coursework, materials, announcements, topics,
submissions (read), guardian links, and profile emails and photos, plus `openid email profile`; the
app asks for offline access so it receives a refresh token.

**Known gaps:** no API-key method (the Classroom API needs user OAuth tokens). Some operations
(guardians, guardian invitations, creating courses for others) need a Workspace for Education domain
and the right role. Submission grading writes use the coursework scopes. While the consent screen is
in Testing status, refresh tokens expire after 7 days; sensitive Classroom scopes also require app
verification for production use.
