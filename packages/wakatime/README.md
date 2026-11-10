# WakaTime

Coding time tracking: summaries, stats, insights, durations, heartbeats, goals,
projects and commits, custom rules, data exports, organization dashboards and
public/private leaderboards. 43 tools; the 9 that write (heartbeats, external
durations, custom rules, data dumps) always ask for approval.

## Interface

Hand-written tools over the WakaTime REST API (`https://api.wakatime.com/api/v1`),
following the official reference at <https://wakatime.com/developers>. WakaTime
publishes no OpenAPI document and no official MCP server (the OpenAPI files on
apis.io are third-party and generated from the docs, so they are not used).

## Auth

- **Secret API key**: copy it from <https://wakatime.com/settings/api-key>. Sent as
  HTTP Basic (`base64(key)`), as WakaTime documents.
- **OAuth 2.0**: create an app at <https://wakatime.com/apps> and enter its client
  id and secret on the connect page. Add Executor's callback URL as the app's
  redirect URI. Scopes requested: `email`, `read_summaries`, `read_stats`,
  `read_goals`, `read_orgs`, `read_private_leaderboards`, `read_heartbeats`,
  `write_heartbeats`. Tokens last 365 days; refresh tokens are supported.

## Gaps

- Org write scopes (`write_orgs`, `write_private_leaderboards`) are not requested,
  so org and leaderboard management is read-only.
- Stats endpoints can return 202 while WakaTime computes data; retry.
