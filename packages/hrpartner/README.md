# HR Partner

Read and write HR Partner data: employees and their sub-records (contacts, addresses, absences, assets, benefits, education, grievances, notes, positions, reviews, skills, training and more), leave requests and balances, recruitment (jobs, applicants, applications, stage tracking), timesheets, expenses, projects, goals, checklists, reminders, performance reviews and the document library. Writes cover employees, reminders, applicants, applications and timeclock entries.

## Interface

Hand-written tools over HR Partner's REST API at `https://api.hrpartner.io`, following the official docs at https://developer.hrpartner.io. HR Partner publishes no OpenAPI document. List tools take a `filters` map of the query parameters each endpoint documents. Every mutation requires approval.

## Auth

API key. In HR Partner go to Setup -> Configure -> Integrations (needs full access rights), turn on API access for the company (off by default) and copy the API token. It is sent in the `x-api-key` header. There is no OAuth. The API needs an active trial or paid HR Partner subscription. The account identity is the company `slug` from `GET /company`.

## Known gaps

- The API has no paging; large result sets can take up to 5 seconds or time out, so filter queries.
- Only the documented endpoints are covered (the docs describe the API as early release); sub-module writes other than the ones listed are not offered by HR Partner.
- Attachment file downloads are not exposed.
- Rate limits: 60 GET or POST requests per second, with a burst limit of 900 requests per one-minute block. Responses time out after 60 seconds (504); add filters to shrink results.
- Vendor doc inconsistency for timeclock: the prose documents `POST /timeclock` (multipart), which this package uses. The vendor's curl and Node samples post to `/timesheet` and the Ruby sample posts to `/employee/`, so the samples disagree with the prose. Do not change the path to match a sample.
