# HackMD

Notes, folders, teams, note versions, comments, trash, history and webhooks (user and team) in HackMD.

**Interface:** OpenAPI. HackMD's official OpenAPI 3.0 document, https://api.hackmd.io/v1/docs/swagger.json (Swagger UI at https://api.hackmd.io/v1/docs). The document declares a relative server (`/v1`); the package pins the origin to `https://api.hackmd.io`.

**Auth:** API access token (`apiKey`). Create one in your HackMD account settings, in the API section (see HackMD's API docs at https://hackmd.io/@hackmd-api/developer-portal). The official OpenAPI document declares only an HTTP bearer scheme (`token`), so no OAuth method is declared.

**Known gaps:** none known. Image upload (`POST /notes/{noteId}/images`) and the webhook delivery export are exposed as the spec describes them; multipart upload may be limited by the generic OpenAPI runtime.
