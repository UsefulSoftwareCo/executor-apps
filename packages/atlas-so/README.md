# Atlas

Covers the Atlas (atlas.so) customer support platform: conversations and messages, customers, accounts, canned responses, custom fields, tags, CSAT surveys, help center articles, SLA rules, sessions, sidebars and users.

Interface: OpenAPI, from Atlas's official document at https://api.atlas.so/openapi.json (API base `https://api.atlas.so/v1`, docs at https://developers.atlas.so). All write operations require approval.

Auth: API key only (Atlas offers no OAuth for third-party apps). Create the key in the Atlas app under Configuration > External API (https://app.getatlas.io/configuration/external-api). It is sent as `Authorization: Bearer <key>`.

Known gaps: none known. The health check lists tags, so a key without read access to tags will report unhealthy.
