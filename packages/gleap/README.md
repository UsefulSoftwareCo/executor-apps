# Gleap

Customer feedback and support with Gleap: tickets, conversations, messages, sessions, companies, pipelines, help center, engagement (banners, chat messages, checklists, emails), AI content and project settings.

**Interface:** OpenAPI. Gleap serves its own Admin REST API v3 description at https://api.gleap.io/api-docs.json (linked from https://docs.gleap.io/llms.txt). Every mutation asks for approval.

**Auth:** API key. In Gleap, open Project Settings > Security, and copy the API key and the project ID. Enter both when connecting. The key is sent as `Authorization: Bearer <key>` and the project ID as the `project` header. Gleap offers no user-created OAuth apps.

**Known gaps:**
- Only the EU data region (`api.gleap.io`) is supported. Projects in the US region (`api.us.gleap.ai`) cannot connect yet.
- 29 operations that use the spec's separate service-account (`s2s`) scheme are skipped (`auth_method`); they need a service account token, not the project API key. The legacy `Api-Token` admin endpoints (`/admin/identify`, `/admin/track`) are not part of the spec and are not mounted.
