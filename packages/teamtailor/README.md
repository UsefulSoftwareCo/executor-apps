# Teamtailor

Applicant tracking with Teamtailor: jobs, candidates, job applications, notes, stages, interviews, job offers, users, teams, requisitions, custom fields, forms, scorecards and audit events (about 130 tools).

Interface: hand-written tools over the official Teamtailor Public API (JSON:API), documented at https://docs.teamtailor.com/. Teamtailor publishes no OpenAPI document, only a Postman collection, so the tools mirror the collection's operations. Every tool takes JSON:API parameters in `query` (`filter[...]`, `include`, `sort`, `page[size]` up to 30, `page[number]`) and writes take a JSON:API document in `body`. Requests send `X-Api-Version: 20240404`. Every write requires approval.

Auth: API key. Create one in Teamtailor under Settings > Integrations > API keys (https://app.teamtailor.com/app/settings/integrations/api-keys) and give it the scopes you need (public, internal, admin). The key is sent as `Authorization: Token token=<key>`. Set the optional `region` field to `na` if your data is on the North America stack (`api.na.teamtailor.com`); leave it empty for the EU stack (`api.teamtailor.com`). Teamtailor offers OAuth only to integration partners, so it is not included.

Known gaps: the partner and job-board APIs and webhook management are not covered. Requests go to one region per account.
