# BigChange

BigChange field service and job management (JobWatch): jobs, job groups and recurrences, contacts, persons, resources, vehicles, absences, timesheets, finance (invoices, quotes, purchase orders, sales opportunities), stock, notes, worksheets, reference data, assets and webhook subscriptions.

## Interface

OpenAPI, from BigChange's own documents linked from the developer portal (https://developers.bigchange.com), mounted under three keys of one provider:

- `rest`: https://api.bigchange.com/swagger/v1/swagger.json (237 tools)
- `assets`: https://api.bigchange.com/swagger/asset-management/v1/swagger.json (32 tools)
- `webhooks`: https://api.bigchange.com/swagger/webhooks/v1/swagger.json (5 tools)

All operations compile (none skipped). Every mutation requires approval.

## Auth

One method, `clientCredentials` (BigChange's Partner API application, OAuth 2.0 client-credentials grant). Create the application in the developer portal under Account > Manage API Keys (https://developers.bigchange.com/account/integrations) and enter the numeric BigChange customer id, the client id and the client secret. The app exchanges them at `https://api.bigchange.com/auth/tokens` (form body `grant_type=client_credentials`, `client_id`, `client_secret`), caches the bearer token until it expires, and sends the `Customer-Id` header on each call. No redirect URI is involved.

## Known gaps

- The generated tools still list `Customer-Id` as a required header argument. The connected account's customer id always replaces whatever is passed.
- The legacy JobWatch web-services API (webservice.bigchange.com, API key plus username and password) is not covered.
