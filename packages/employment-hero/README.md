# Employment Hero

Employment Hero HR: organisations, employees, leave, timesheets, rostered shifts, pay details, payslips, bank, super and tax records, goals, forms, assets, certifications, benefits and workplace incidents.

**Interface:** hand-written tools over the official REST API at `https://api.employmenthero.com/api` (177 tools). Employment Hero publishes no OpenAPI document, only reference docs at https://developer.employmenthero.com/api-references and an official Postman collection at https://developer.employmenthero.com/postman-collection.json, which is the list of operations covered. Every tool takes its path ids as strings, named query filters as optional fields, and `body` (a JSON object) for writes. Every mutation requires approval.

**Auth:** OAuth 2.0 only; the API has no API keys. Sign in to Employment Hero HR, open your profile, choose Developer Portal, and register an app to get a client ID and secret. Scopes are chosen when the app is registered (they cannot be edited later and are not sent on the sign-in request), so select the ones you need. Add Executor's redirect URI to the app's allowed redirect URIs. PKCE is required and is used. API access needs a Platinum plan or higher. Tokens last 15 minutes and are refreshed automatically.

**Known gaps:**
- The eight multipart file-upload endpoints (assets, certifications, goals, induction content, leave requests, incidents, employee documents, employee certifications) are not exposed.
- Array query filters (for example `statuses`) are sent as repeated `key[]` parameters, which is a Rails convention not stated in the docs.
- Rate limits are 20 requests per second and 100 per minute.
