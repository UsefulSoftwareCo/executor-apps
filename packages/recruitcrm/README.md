# Recruit CRM

Candidates, companies, contacts, jobs, deals, hotlists, tasks, meetings, notes, call logs, subscriptions, pipelines and custom-field lookups in Recruit CRM.

**Interface:** OpenAPI. The tools are generated from Recruit CRM's own OpenAPI 3.0 document, served by the API at <https://api.recruitcrm.io/docs> (reference: <https://docs.recruitcrm.io>). The document declares no servers or security scheme requirement, so `openapi.ts` pins `https://api.recruitcrm.io` and a bearer token.

**Auth:** API token (`apiKey`). In Recruit CRM, open Admin Settings, Account Management (API and integrations) and copy the API token. It is sent as `Authorization: Bearer <token>`. Recruit CRM offers no OAuth for customers, so there is no OAuth method.

**Approvals:** every mutation (create, update, delete, assign and so on) requires approval.

**Known gaps:** Recruit CRM describes its API as beta, so endpoints may change without notice. File and resume upload is limited to what the document describes.
