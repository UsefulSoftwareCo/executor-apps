# Recruiterflow

Recruiting CRM and ATS: candidates, jobs, clients, contacts, pipelines, activities, notes, users and more (128 tools, 52 of them mutations that ask for approval).

Interface: Recruiterflow's official OpenAPI document, https://recruiterflow.com/swagger.yml (the source of https://recruiterflow.com/api), served from `https://api.recruiterflow.com`. The document declares the key as a header parameter on each operation, has no security scheme and no servers entry, so `openapi.ts` supplies the base URL and an `RF-Api-Key` header scheme.

Auth: API key only. Recruiterflow offers no OAuth for customers. An admin creates the key in Recruiterflow under Company Settings > API and pastes it as the account's API key; it is sent in the `RF-Api-Key` header. Health check calls `GET /api/external/user/list`.

Known gaps: the spec's example responses are untyped strings, so outputs are returned as raw JSON.
