# Google Classroom

Courses, rosters (students, teachers), invitations, coursework, coursework materials, announcements,
topics, student submissions and grading, rubrics, student groups, grading periods, add-on
attachments, and guardians in Google Classroom.

**Interface:** OpenAPI, converted from Google's own Classroom API v1 Discovery document (`https://classroom.googleapis.com/$discovery/rest?version=v1`) by `scripts/google-discovery.ts` into `openapi.json`, whose `info.x-executor-discovery` records the revision. Google publishes no OpenAPI for it.
Google has no official Classroom MCP server. Requests go to
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
and the right role. Submission grading writes use the coursework scopes. The add-on tools
(`*.getAddOnContext` and `*.addOnAttachments.*`) serve Classroom add-ons: most need the
`classroom.addons.*` scopes, which this app does not request, so they fail with Google's permission
error. While the consent screen is
in Testing status, refresh tokens expire after 7 days; sensitive Classroom scopes also require app
verification for production use.
