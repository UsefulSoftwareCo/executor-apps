# HelpDesk

HelpDesk.com (the LiveChat/Text ticketing product) covering tickets, ticket tags, followers, child tickets and silos, agents, teams, custom fields, canned responses, macros, rules, views, mailboxes, reply addresses, email domains, templates, trusted and blocked emails, webhooks, subscriptions, audit log, imported tickets and the reports endpoints.

## Interface

OpenAPI 3.0.3, from HelpDesk's official API reference at [api.helpdesk.com/docs](https://api.helpdesk.com/docs), host `api.helpdesk.com`. The vendor serves the document only embedded in that Redoc page, with no standalone URL, so it is bundled as `spec.json`: the embedded document unchanged, except that an analytics `<script>` was removed from `info.description`. 139 tools, 73 of them mutations.

## Auth

- Personal Access Token (`pat`): create one in the [Developer Console](https://platform.text.com/console/) under Tools, Personal Access Tokens, signing in with your HelpDesk.com credentials. Enter the account ID shown in the console and the token; they are sent as HTTP Basic. HelpDesk's docs suggest the `accounts--my:ro` scope; grant the HelpDesk scopes for whatever tools you want to call.
- OAuth 2 (`oauth`): HelpDesk shares LiveChat's accounts service. Create an app in the Developer Console, add the HelpDesk blocks and scopes there, and enter its client ID and secret on the connect page. Add the Executor redirect URI shown on the connect page to the app's redirect URIs. Scopes are configured on the app, not on the authorization request, so none are declared here. Authorization is at `https://accounts.livechat.com/` and tokens at `https://accounts.livechat.com/v2/token`; this part follows the LiveChat authorization docs and has not been exercised against a real app.

## Known gaps

Attachment upload (`POST /v1/transactions/{id}/attachments`) is multipart and the bundled spec's request body may not be usable for file uploads. The health check treats 403 as authenticated, since a token limited to other scopes cannot read licenses.
