# NationBuilder

Covers the NationBuilder V2 API: people (signups), donations, events, lists, pages, paths, automations, tags, memberships and the rest of a nation's data (190 tools, 108 of them mutations that ask for approval).

Interface: OpenAPI, from NationBuilder's own V2 document at https://nationbuilder.com/api/v2/docs/v2/released.yaml (linked from https://nationbuilder.com/api/v2/reference). The document's server is `https://{subdomain}.nationbuilder.com`; the package replaces it with the account's own nation, and credentials only go to that origin.

Auth: one method, `apiKey`. Enter the nation slug (the part before `.nationbuilder.com`) and an API token. Create the token in the nation's control panel under Settings > Developer > Your apps: register an app, then use "Create test token" on its page. Test tokens do not need a redirect URI.

Known gaps: NationBuilder's OAuth endpoints are per nation (`https://<slug>.nationbuilder.com/oauth/authorize` and `/oauth/token`), and Executor's `oauth2` takes fixed URLs, so the OAuth flow is not offered. OAuth access tokens expire after 24 hours, so a token pasted in from another OAuth flow will stop working until replaced.
