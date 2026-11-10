# Formilla

Creates or updates customer contacts in Formilla (live chat and marketing automation) so contact data can drive automatic email and in-app messages.

**Interface:** custom tool written with `fetch` against the official Secure Token REST API at `https://api.formilla.com/api`. Formilla publishes no OpenAPI document, no GraphQL API and no MCP server; the REST API documented at https://blog.formilla.com/integrate-customer-data-with-the-formilla-rest-api/ has one operation, `POST /contacts`, exposed as `contacts.createOrUpdate` (requires approval). It takes `UserId` or `Email` (one is required), `FirstName`, `LastName`, `Phone`, `SignedUp_date` (Unix seconds), `IsUnsubscribed` and `CustomAttributes`.

**Auth:** Secure token, sent in the `formilla_auth_token` header. The REST API is disabled by default: enable it on the Security page of the Formilla dashboard and a token is generated for the account. Formilla has no OAuth. The REST API is not supported on Wix sites.

**Known gaps:** the API can only write contacts; there are no read, list, delete or chat endpoints. The health check has no read-only endpoint to use, so it posts a contact request with no identifier (which performs no action) and treats only 401 and 403 as a bad token. The vendor's docs are dated (last updated 2024); the icon is the 192px app icon from the Formilla blog's site icon.
