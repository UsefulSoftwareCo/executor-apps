# Contacts+

Contacts, tags, teams and webhooks in Contacts+ (the contact manager by FullContact): 21 hand-written tools covering
account, contacts (get, scroll, search, create, update, delete, change owner, manage tags), tags, teams and webhooks.
Mutations require approval. Every call accepts an optional `teamId` to act on a team's data.

## Interface

Custom tools over the official Contacts+ REST API (`https://api.contactsplus.com/api/v1/<method>`, all POST with JSON
bodies), documented at https://www.contactsplus.com/developers/contacts-api/. Contacts+ publishes no OpenAPI document,
GraphQL schema or MCP server.

## Auth

OAuth 2.0 only; there are no API keys. Create an OAuth app at https://app.contactsplus.com/apps, register Executor's
redirect URI shown on the connect page, and enter the client ID and secret there. The authorize URL
(`https://app.contactsplus.com/oauth/authorize`) and token URL (`https://api.contactsplus.com/v3/oauth.exchangeAuthCode`)
come from the vendor's official Node SDK; scopes are comma-separated.

## Known gaps

- `contacts.uploadPhoto` (multipart) is not exposed.
- BLOCKED on the platform: Contacts+ access tokens expire (`access_token_expiration`) and refresh at a separate endpoint
  (`https://api.contactsplus.com/v3/oauth.refreshToken`, form body client_id, client_secret, refresh_token). Executor's
  `oauth2` config has no refresh-URL option, so renewal will not reach that endpoint and accounts must be reconnected at
  expiry. Declare the refresh URL once the framework supports it; this is not worked around in app code.
- The vendor docs register apps at https://ui.contactsplus.com/apps; the official SDK and this package use
  https://app.contactsplus.com/apps. Both resolve.
- Unverified: the authorize request carries the framework's default parameters (response_type, state, possibly PKCE),
  while the SDK sends only client_id, scope and redirect_uri. Confirm on the first live connect.
- The authorize URL is not stated in the vendor docs; it was taken from the official SDK source.
