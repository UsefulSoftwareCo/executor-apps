# Autotask

Datto Autotask PSA for managed service providers: tickets, companies, contacts, contracts, projects, tasks, time entries, configuration items, billing and the rest of the REST API (about 1,800 tools).

Interface: OpenAPI, from Datto's own Swagger 2.0 document, `https://webservices2.autotask.net/atservicesrest/swagger/docs/v1`. Autotask serves the same document on every zone; the package reads zone 2's copy and sends calls to the zone of the connected account.

Auth: API user (`apiKey`). Create it in Autotask under Admin > Resources (Users) > API User, with the "API User (system)" security level and an integration vendor. Enter the zone host (for example `webservices5`, shown in the API URL of your database), the API user's username, its API tracking identifier as the integration code, and its secret. These are sent as the `UserName`, `ApiIntegrationCode` and `Secret` headers. Autotask has no OAuth.

Known gaps: 1,218 of 3,017 operations are skipped because their schemas use references the compiler cannot resolve (`schema_reference`). Mutations require approval.
