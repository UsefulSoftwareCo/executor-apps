# Manatal

Recruitment CRM and applicant tracking: candidates (with skills, tags, education, experience, notes, attachments, resumes), jobs, matches and match stages, job pipelines, organizations, contacts, users, and reference data (currencies, industries, languages, nationalities).

**Interface:** OpenAPI. Manatal publishes no downloadable document, so `openapi.json` is Manatal's own Open API v3 definition merged from the per-operation OpenAPI fragments embedded in each reference page of https://developers.manatal.com (base URL `https://api.manatal.com/open/v3`). Re-merge it if the docs change. The Manahook webhook API and the public Career Page API are separate services and are not included.

**Auth:** API key. Create it in Manatal under Settings > Integrations > API (an admin on a plan with API access). It is sent as `Authorization: Token <key>`. Manatal offers no OAuth for third-party apps.

**Gaps:** file upload endpoints (attachments, resume) use multipart bodies and may be limited by the tool compiler.
