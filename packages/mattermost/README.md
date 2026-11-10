# Mattermost

Covers the Mattermost server REST API (v4): users, teams, channels, posts, files, reactions, preferences, webhooks, slash commands, bots, roles and schemes, jobs, plugins, compliance and the rest of the admin API, 649 tools in all (389 mutations, each requiring approval).

Interface: OpenAPI 3.0, Mattermost's official API document at https://raw.githubusercontent.com/mattermost/mattermost-developer-documentation/master/site/static/mattermost-openapi-v4.yaml (the source of https://developers.mattermost.com/api-documentation/). Mattermost is self-hosted or cloud-hosted per customer, so the document's server variable is replaced by each account's own server URL, and credentials are only ever sent to that origin.

Auth: one method, an access token. In Mattermost, create a personal access token (Profile > Security > Personal Access Tokens, which an admin must enable) or a bot account token (Integrations > Bot Accounts). When connecting, enter the server URL (for example `chat.example.com`) and the token. The token is sent as a bearer header. Mattermost's OAuth 2.0 app flow is not offered because its authorization and token endpoints live on each customer's own host, which a static OAuth declaration cannot express.

Known gaps: the WebSocket event API is not included. Some operations require a Mattermost Enterprise licence or a particular server version; the document covers the latest server, so older servers may reject calls.
