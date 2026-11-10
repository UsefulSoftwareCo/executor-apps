# Breezy HR

Recruiting and applicant tracking with Breezy HR: companies, departments, pipelines, questionnaires and templates, positions, candidates (notes, stages, scorecards, documents, assessments, conversations, custom fields, education and work history), candidate search and webhook endpoints. 64 tools, 30 of them mutations that always ask for approval.

## Interface

OpenAPI 3.1, from Breezy's official API reference at https://developer.breezy.hr (base URL `https://api.breezy.hr/v3`). The developer portal publishes the definition only as one fragment per endpoint page (append `.md` to any reference page URL to see it). `document.json` merges those fragments, unchanged, into one document: paths and component schemas are combined and nothing else is edited. Refresh it by re-fetching the pages listed in https://developer.breezy.hr/llms.txt.

## Auth

- Access token: a Breezy personal access token (`breezy_pat_...`), or a session `access_token` returned by `POST /v3/signin` with email and password (valid 30 days from last use). Breezy accepts either as the bare `Authorization` header value; this package sends it that way. Create a personal access token in Breezy under your account's API settings (see https://developer.breezy.hr/reference/authorization).

Breezy has no user-created OAuth app flow (OAuth is for partner integrations only), so no `oauth2` method is offered.

## Known gaps

- Webhook endpoints require a Breezy Pro plan.
- Multipart resume and document upload operations depend on how the generator handles file bodies.
- `/signin` and `/signout` are exposed as tools but are rarely needed when you already hold a token.
- The icon is Breezy's official 192px app icon (https://assets-cdn.breezy.hr/favicon_192.png), as Breezy publishes no SVG mark.

## Reproducing document.json

Retrieved 2026-10-12. The 64 operations come from the 64 endpoint pages listed under "Breezy HR Public API" in https://developer.breezy.hr/llms.txt; each page's `.md` form embeds that operation's OpenAPI fragment. Fragment URLs:

- https://developer.breezy.hr/reference/signin-1.md
- https://developer.breezy.hr/reference/signout-1.md
- https://developer.breezy.hr/reference/gethealth.md
- https://developer.breezy.hr/reference/getuser.md
- https://developer.breezy.hr/reference/getuserdetails.md
- https://developer.breezy.hr/reference/listcompanies.md
- https://developer.breezy.hr/reference/getcompany.md
- https://developer.breezy.hr/reference/listdepartments.md
- https://developer.breezy.hr/reference/listcategories.md
- https://developer.breezy.hr/reference/listpipelines.md
- https://developer.breezy.hr/reference/getpipeline.md
- https://developer.breezy.hr/reference/listquestionnaires.md
- https://developer.breezy.hr/reference/getquestionnaire.md
- https://developer.breezy.hr/reference/listtemplates.md
- https://developer.breezy.hr/reference/gettemplate.md
- https://developer.breezy.hr/reference/getcompanycustomattributes.md
- https://developer.breezy.hr/reference/getcompanycustomfields.md
- https://developer.breezy.hr/reference/listpositions.md
- https://developer.breezy.hr/reference/createposition.md
- https://developer.breezy.hr/reference/getposition.md
- https://developer.breezy.hr/reference/updateposition.md
- https://developer.breezy.hr/reference/setpositionstate.md
- https://developer.breezy.hr/reference/getpositionteam.md
- https://developer.breezy.hr/reference/getpositionstream.md
- https://developer.breezy.hr/reference/getpositioncustomfields.md
- https://developer.breezy.hr/reference/updatepositioncustomfield.md
- https://developer.breezy.hr/reference/searchcandidates.md
- https://developer.breezy.hr/reference/listcandidates.md
- https://developer.breezy.hr/reference/addcandidate.md
- https://developer.breezy.hr/reference/addcandidatebyresume.md
- https://developer.breezy.hr/reference/getcandidate.md
- https://developer.breezy.hr/reference/updatecandidate.md
- https://developer.breezy.hr/reference/getcandidatemeta.md
- https://developer.breezy.hr/reference/setcandidatestage.md
- https://developer.breezy.hr/reference/addcandidatescorecard.md
- https://developer.breezy.hr/reference/movecandidate.md
- https://developer.breezy.hr/reference/getcandidatestream.md
- https://developer.breezy.hr/reference/postcandidatenote.md
- https://developer.breezy.hr/reference/getcandidateconversation.md
- https://developer.breezy.hr/reference/getcandidateresume.md
- https://developer.breezy.hr/reference/uploadcandidateresume.md
- https://developer.breezy.hr/reference/getcandidatedocuments.md
- https://developer.breezy.hr/reference/addcandidatedocument.md
- https://developer.breezy.hr/reference/getcandidatequestionnaires.md
- https://developer.breezy.hr/reference/submitcandidatequestionnaire.md
- https://developer.breezy.hr/reference/sendcandidatequestionnaire.md
- https://developer.breezy.hr/reference/getcandidateassessments.md
- https://developer.breezy.hr/reference/getcandidatebackgroundchecks.md
- https://developer.breezy.hr/reference/getcandidatecustomfields.md
- https://developer.breezy.hr/reference/updatecandidatecustomfield.md
- https://developer.breezy.hr/reference/updatecandidatecustomattribute.md
- https://developer.breezy.hr/reference/updatecandidateeducation.md
- https://developer.breezy.hr/reference/updatecandidateworkhistory.md
- https://developer.breezy.hr/reference/sendcandidatemessage.md
- https://developer.breezy.hr/reference/upsertcandidateassessment.md
- https://developer.breezy.hr/reference/deletecandidateassessment.md
- https://developer.breezy.hr/reference/querycompanycandidates.md
- https://developer.breezy.hr/reference/listwebhookendpoints.md
- https://developer.breezy.hr/reference/createwebhookendpoint.md
- https://developer.breezy.hr/reference/getwebhookendpoint.md
- https://developer.breezy.hr/reference/updatewebhookendpoint.md
- https://developer.breezy.hr/reference/deletewebhookendpoint.md
- https://developer.breezy.hr/reference/pausewebhookendpoint.md
- https://developer.breezy.hr/reference/resumewebhookendpoint.md

## Notes on tool safety

- `GET /signout` invalidates the session token, so `openapi.ts` marks it a mutation (approval required) via `kinds`.
- The health check calls `GET /v3/user` and decodes no fields, because Breezy documents no always-present User fields; a 2xx with a JSON body is the pass condition.
