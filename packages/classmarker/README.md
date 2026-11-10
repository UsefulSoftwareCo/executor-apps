# ClassMarker

Online quizzes and exams with ClassMarker: list the groups, links and tests an API key can reach, fetch recently finished results (by group, link or test), add and remove link access codes, manage question bank categories, and read, create and update questions.

**Interface:** hand-written tools over the documented ClassMarker API v1 (`https://api.classmarker.com`, reference at https://www.classmarker.com/online-testing/docs/api/). ClassMarker publishes no OpenAPI document and no remote MCP server, so all 16 documented endpoints are wrapped: `overview`, `results.*` (4), `accessLists.addCodes/removeCodes`, `categories.*` (5) and `questions.*` (4). Every mutation requires approval.

**Auth:** API key plus API secret. Create them in ClassMarker under My Account > Webhooks / API Keys > API Keys > New API Key (an account can have 3 keys; the key and secret are generated together). Every request is signed with query parameters `api_key`, `timestamp` and `signature` (SHA-256 of key, secret and timestamp), which the tools compute. ClassMarker has no OAuth.

**Icon:** the checkbox-and-tick mark cropped from the vendor's official logo PNG (`https://www.classmarker.com/img4/logos/classmarker-log-main-3x.png`); ClassMarker publishes no SVG and the mark is not in Simple Icons.

**Known gaps:** each API key is limited to 30 requests per hour (access code calls are exempt), and the health check spends one request. ClassMarker returns errors with HTTP 200; the tools turn them into failures. Results can reach back at most 3 months. Webhooks, certificates, users and group CRUD that some third-party wrappers list are not in the vendor's documented API and are not included. The documented update-category path is inconsistent (`/v1/category/{id}` versus the example `/v1/categories/category/{id}`); the tool uses the latter.
