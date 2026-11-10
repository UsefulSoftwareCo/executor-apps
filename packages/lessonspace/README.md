# Lessonspace

Launch Lessonspace online classroom spaces and manage the organisation's sessions, session playback, transcripts, recordings, spaces and users.

**Interface:** OpenAPI (Swagger 2.0) published by Lessonspace at https://api.thelessonspace.com/v2/docs.json (reference: https://api.thelessonspace.com/v2/docs/). Official source.

**Auth:** Organisation API key. Find it in the developer settings of your Lessonspace organisation dashboard. It is sent as `Authorization: Organisation <key>`. Lessonspace offers no OAuth.

**Gaps:** The spec has 11 operations (launch space, list spaces/sessions/users, session detail/update, playback, transcript, delete recordings, delete user). Webhooks are not covered. Health check calls `GET /v2/hello/`.
