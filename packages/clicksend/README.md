# ClickSend

Send SMS, MMS, email, voice, fax and physical post with ClickSend, and manage contacts, contact lists, SMS campaigns, sender IDs, subaccounts, numbers and account settings.

## Interface

OpenAPI. ClickSend publishes its REST API v3 definition (Swagger 2.0) in its official SDK repository: <https://raw.githubusercontent.com/ClickSend/clicksend-go/master/api/swagger.yaml>. `spec.json` is that file converted to JSON unchanged, because the generator accepts documents rather than raw YAML. ClickSend does not host the spec at a stable URL of its own; refresh `spec.json` from the repository to pick up API changes. API base: `https://rest.clicksend.com/v3`. 188 tools, 107 of them mutations (all require approval).

## Auth

HTTP Basic with a username and API key. Sign in to the ClickSend dashboard, open Developers > API Credentials, and copy your username and API key (a separate key can be created for API use). ClickSend offers no user-created OAuth apps for the REST API, so there is no OAuth method.

## Gaps

None known; all operations in the spec compile. The `GET /v3/account` call backs the health check.
