# Coassemble

Coassemble is an API-first training platform. This package covers the headless API: listing, reading, publishing, duplicating, deleting and exporting courses, AI generation of courses, screens and quizzes, and managing the clients and users that own courses (24 tools).

**Interface:** hand-written tools over the documented REST API at `https://api.coassemble.com/api/v1/headless`, from the official docs at https://developers.coassemble.com. Coassemble publishes no OpenAPI document. Mutations require approval.

**Auth:** workspace API key. Create one in Coassemble under Dashboard > Developer > API keys. The account asks for the workspace ID (shown on the same page) and the key; requests send `Authorization: COASSEMBLE:<workspace id>:<api key>`. The API needs a paid plan with API access (Build tier or above; SCORM export needs Partner). There is no OAuth.

**Known gaps:** the deprecated signed-URL and generate endpoints and the embed endpoints (`/embed/course`) are not exposed, since embed URLs are meant for end-user browsers. Health check calls `GET /clients`.
