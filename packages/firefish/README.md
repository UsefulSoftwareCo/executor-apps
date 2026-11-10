# Firefish

Firefish is a recruitment CRM (https://www.firefishsoftware.com). This package covers
candidates (profile, compliance, preferences, pay, employment, education, certifications,
saved searches), contacts, companies, leads, jobs (permanent, contract and shift), placements
and offers, shift bookings, timesheets, adverts, actions, call and message notes, users and
preference properties: 77 hand-written tools, with every write behind an approval.

**Interface:** custom tools over the Firefish Public API (`https://api.firefishsoftware.com/api/...`).
Firefish publishes no OpenAPI document; its official reference is a Postman collection
documented at https://developer.firefishsoftware.com/, which is where the endpoints, query
parameters and scopes come from. Endpoint versions follow the docs (v1.1 companies, jobs,
placements; v1.2 bookings; v1.0 elsewhere). Deprecated v1.0 job search/profile are omitted.

**Auth:** OAuth 2.0 client credentials (no user sign-in). In Firefish, open API Settings and
create a Custom API: it gives a Client ID and Client Secret and lets you grant scopes
(Firefish Help Centre: "Firefish API Documentation"). Paste both on the Executor connect page.
The token endpoint is `https://api.firefishsoftware.com/authorization/token`; tokens last about
10 minutes and Executor renews them. Executor requests all 16 standard scopes (partner-only Behaviour scopes omitted)
(`candidatesAPI-read/write`, `contactsAPI-read/write`, `companiesAPI-read/write`,
`placementdetailsAPI-read/write`, `jobsAPI-read/write`, `actionsAPI-read`, `advertsAPI-read`,
`commsAPI-readWrite`, `usersAPI-read`, `leadsAPI-readWrite`, `teamsAPI-read`), so grant all of them to the Custom API
credentials; Firefish rejects scopes the credentials do not hold.

**Known gaps:** candidate document upload (multipart) is not exposed; the v1.1 shift booking
endpoints are superseded by v1.2 and omitted; the placements workflow "introduction" page is
documentation only. Firefish enforces 10 requests/second, 200/minute and 3,000/hour per endpoint,
and 10 token requests per minute per client. The tools take JSON bodies as documented (mostly
PascalCase field names) and have not been called against a live Firefish account.
