# Simplesat

Covers the Simplesat public API: surveys (including sending email surveys), questions, responses (search, create or update), answers, customers (including bulk) and team members.

Interface: OpenAPI, the vendor's own document at https://developer.simplesat.io/api/Simplesat%20API%20(v1)%20OpenAPI.yaml (API at https://api.simplesat.io).

Auth: API key. Create one at https://app.simplesat.io/settings/api-keys/ with the scopes for the endpoints you want to use; it is sent in the `X-Simplesat-Token` header. Simplesat offers no user-created OAuth apps.

Icon: the official logo PNG (200px) published with Simplesat's API docs, since Simple Icons has no entry.

Known gaps: the health check lists surveys, so the key needs the `read surveys` scope. Webhooks are configured in the Simplesat app and are not part of the API description.
