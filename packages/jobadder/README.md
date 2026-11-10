# JobAdder

Recruitment CRM and ATS tools for JobAdder: candidates, jobs, job ads, job applications, placements, companies, contacts, notes, interviews, requisitions, opportunities, users and webhooks.

**Interface:** OpenAPI. Tools are generated from JobAdder's official OpenAPI 3.0 document, https://api.jobadder.com/v2/openapi.json (reference at https://api.jobadder.com/v2/docs), against `https://api.jobadder.com/v2`. Mutations require approval.

**Auth:** OAuth 2.0 authorization code flow only; JobAdder has no API keys. Register an application with JobAdder (https://developers.jobadder.com) to get a client ID and secret, and add Executor's redirect URI to the application's allowed redirect URLs. The connect page asks for the client. Endpoints come from https://id.jobadder.com/.well-known/openid-configuration. The package requests every `read_*` and `write_*` scope plus `read`, `write` and `offline_access` (needed for refresh tokens). Partner-only scopes (`partner_jobboard`, `partner_ui_action`) are not requested.

**Known gaps:** JobAdder returns the API base URL with each token (`api`); this package assumes the standard `https://api.jobadder.com/v2`. JobAdder's identity server disables PKCE, while its metadata advertises S256; if authorization fails on PKCE, revisit.
