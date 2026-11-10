# Jobvite

Read and update Jobvite (now Jobvite by Employ) applicant tracking data: candidates and applications, candidate attachments, education and work history, jobs, employees, departments, rejection reasons (dispositions) and offer letters.

Interface: hand-written tools over the Jobvite REST API v2 at https://api.jobvite.com/api/v2. Jobvite publishes no OpenAPI document and no GraphQL or MCP endpoint; its reference is behind the help center (https://help.jobvite.com/hc/en-us/articles/8870636608925-Jobvite-API) and could not be fetched, so the 10 operations here (candidate list/get/update, application education and work history, job, employee, department, disposition, offerLetter) are the paths confirmed by third-party integration listings (Knit's Jobvite API list). List tools take a free-form `query` object for Jobvite's filter and paging parameters. `candidate.update` (PUT) requires approval.

## Auth

- API key and secret key: Jobvite issues both to the customer or integration partner (request them from Jobvite support or your Jobvite administrator; ask for access to the APIs listed above). They are sent as the `x-jvi-api` and `x-jvi-sc` headers. No OAuth.

## Gaps

- Not verified against a live account or the official docs: header names and the exact parameter and body shapes come from secondary sources.
- Onboard New Hire API, job posting, and other partner-specific endpoints are not covered.
- Health check calls `GET /candidate?count=1`; the response is only required to be JSON.
- Paths other than `/candidate` come from Knit listings only and are unconfirmed: `candidate.update` (PUT /candidate), `candidate.get` (attachments) and `offerLetter.get` may differ on a live account; their descriptions say so.
- The icon is the 196px site favicon; no public press-kit SVG could be fetched.
