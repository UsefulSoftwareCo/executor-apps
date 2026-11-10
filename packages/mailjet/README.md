# Mailjet

Send and manage email with Mailjet: transactional sending (Send API v3 and v3.1), messages, contacts and contact lists, campaigns and drafts, statistics, webhooks and senders through the Email API, plus templates, template content, images, labels and tokens through the Content API.

## Interface

Two official OpenAPI documents published by Mailjet, each mounted under its own key in one router:

- `email`: https://dev.mailjet.com/_bundle/openapi/openapi-mailjet.yaml (Email API, `/v3` and `/v3.1`)
- `content`: https://dev.mailjet.com/_bundle/openapi/openapi-passport.yaml (Content API, `/v1`)

Both live on `https://api.mailjet.com`. Mutations require approval. 177 tools in total (151 email, 26 content). The checked-in `email.json` and `content.json` are those documents converted to JSON with parameter schemas that point into a component schema's properties inlined (the generator only supports references to whole component schemas); nothing else is changed.

## Auth

API key and secret key (HTTP Basic, API key as username). Create them under Account settings > API Key Management (https://app.mailjet.com/account/apikeys). The Content API also accepts bearer tokens, but this package uses Basic for both. The health check calls `GET /v3/REST/myprofile`. Mailjet has no OAuth for user-created apps, so none is offered.

## Known gaps

- The SMS API (`/v4`) and Parse API are not in the published OpenAPI documents and are not exposed.
- Mailjet's official MCP server is a local stdio server, not a remote one, so it is not used.
- The icon is Mailjet's own app icon from assets.mailjet.com (the Sinch-era mark).
