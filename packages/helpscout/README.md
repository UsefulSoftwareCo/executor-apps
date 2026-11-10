# Help Scout

Help Scout is a shared-inbox support platform. This package covers the Inbox API
2.0 (conversations and threads, replies and notes, customers and their contact
details, organizations, mailboxes, users, teams, tags, webhooks, workflows,
reports) and the Docs API (sites, collections, categories, articles). About 86
tools; every create, update and delete requires approval.

## Interface

Hand-written tools over REST. Help Scout publishes no OpenAPI document (only
third-party conversions exist, which are not used), so the tools follow the
official references:

- Inbox API: https://developer.helpscout.com/mailbox-api/ at `https://api.helpscout.net/v2`
- Docs API: https://developer.helpscout.com/docs-api/ at `https://docsapi.helpscout.net/v1`

Tools are mounted as `inbox.*` (OAuth connection) and `docs.*` (Docs key
connection).

## Auth

- **OAuth2** (Inbox API). Create an app in Help Scout under Your Profile > My
  Apps and enter its app ID and secret as the client ID and secret on the connect
  page. Set the app's redirect URL to the Executor callback URL shown on the
  connect page. Authorization is
  `https://secure.helpscout.net/authentication/authorizeClientApplication`, tokens
  come from `https://api.helpscout.net/v2/oauth2/token` (`client_secret_post`).
  Help Scout has no scopes: the token carries the authorizing user's permissions.
  Access tokens last 48 hours and refresh with the refresh token.
- **Docs API key**. Create it under Your Profile > Authentication > API Keys. It
  is sent as the HTTP Basic username with a dummy password.

## Known gaps

- Inbox and Docs need separate connections (different credentials).
- The Inbox API's client-credentials flow (internal apps) is not offered.
- Attachment upload on threads is passed through as JSON; Docs file upload
  (multipart), article drafts and revisions, and chat/Beacon APIs are not covered.
- Help Scout also runs an official remote MCP server (`https://mcp.helpscout.net/mcp`, OAuth with dynamic registration). It is not used because new connections are read-only, it needs a separate Docs key on its authorization page, and these hand-written tools include writes.
- Not covered yet: conversation snooze and reassignment, user status (get/list/set), team member updates, saved-reply create/update/delete, customer chat handles, customer property set/update, organization properties, thread schedule endpoints, and inbox routing configuration.
- Reports need a Plus or Pro plan.
