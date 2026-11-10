# Twitch

Look up users, channels, streams, clips, videos, games and schedules, and manage a channel as the connected user: chat messages, announcements, shoutouts, raids, polls, predictions, channel points rewards, moderation (bans, AutoMod, blocked terms, moderators, VIPs, Shield Mode, unban requests, warnings), ads, markers, EventSub subscriptions and whispers (103 tools).

**Interface:** custom tools written with `fetch` against Twitch's official Helix API at `https://api.twitch.tv/helix` (docs: https://dev.twitch.tv/docs/api/reference/). Twitch publishes no OpenAPI document, GraphQL API or official remote MCP server, so the operations are hand-written from the reference. Mutations require approval. Helix needs the app's `Client-Id` header next to the token; Executor does not pass the OAuth client id to apps, so the package asks `https://id.twitch.tv/oauth2/validate` for the client a token was issued to (once per account session). List parameters (for example `id`, `login`, `user_id`) take comma-separated strings and are sent as repeated query parameters.

**Auth:**
- OAuth 2.0 with your own Twitch app (Twitch has no dynamic client registration). Register an application at https://dev.twitch.tv/console/apps, add the redirect URI shown on Executor's connect page as an OAuth Redirect URL, set the client type to Confidential, and paste the client ID and a generated client secret into the connect page. Token requests send the client credentials in the form body. Scopes cover reading and managing channels, chat, moderation, channel points, polls, predictions, schedule, subscriptions, follows and whispers; none require Twitch staff access.
- A user access token pasted directly (for example from the Twitch CLI), for one-off use. It expires and cannot be refreshed.

**Known gaps:** app access tokens (client credentials) are not offered, so endpoints that require one (such as EventSub webhook management with an app token) are limited to user-token behavior. No Drops entitlements, Conduits, Guest Star, extension configuration/secrets/chat, Clips download, or the iCal schedule feed. Twitch rate limits (800 points per minute per user) apply.
