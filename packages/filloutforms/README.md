# Fillout Forms

List forms and read their metadata, list, read, create and delete submissions, and create or delete webhooks in Fillout (8 tools).

## Interface

OpenAPI, compiled live from Fillout's official document at https://www.fillout.com/help/openapi.json (REST API docs: https://www.fillout.com/help/fillout-rest-api). Base URL `https://api.fillout.com/v1/api`. All mutations require approval.

## Auth

- API key: create one in Fillout under Settings, Developer (https://build.fillout.com/home/settings/developer). It is sent as a bearer token. 
- OAuth: create an OAuth app in Fillout under Settings, Developer, OAuth integrations (https://www.fillout.com/help/oauth-applications) and add the redirect URI shown on the Executor connect page. Authorization is at `https://app.zite.com/authorize/oauth`, the token exchange at `https://server.fillout.com/public/oauth/accessToken`. Fillout documents no scopes, refresh tokens or expiry, and does not state the token request content type, so the form-encoded default is used. The token response's `base_url` is not used; API calls go to `api.fillout.com`.

## Known gaps

- Icon: the official Fillout icon mark (https://www.fillout.com/fillout-icon.svg, linked from the brand page).
- The health check lists forms, so it does not work for EU accounts.
- Only the US host (`api.fillout.com`) is supported. Accounts on the EU region (`eu-api.fillout.com`) are not covered.
- Fillout's newer database/table/record endpoints are not in the official OpenAPI document and are not included.
