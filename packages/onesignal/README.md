# OneSignal

Send push notifications, email and SMS with OneSignal, and manage apps, users, subscriptions, segments, outcomes and live activities.

Interface: OpenAPI. Tools are generated from OneSignal's official specification, https://raw.githubusercontent.com/OneSignal/api/main/api.json (repository OneSignal/api), pinned to version 1.2.2 as read on 2026-10-12 (the URL tracks the `main` branch). The spec's server is the legacy `https://onesignal.com/api/v1`; this package overrides it to `https://api.onesignal.com`, where OneSignal's current docs describe `Authorization: Key <key>`. Operations without `security` in the spec (`delete_user`) use the app key.

Auth, sent as `Authorization: Key <key>`:

- **App API key** plus the **App ID**: create the key in the OneSignal dashboard under Settings > Keys & IDs. It covers app-scoped operations (notifications, users, subscriptions, segments, outcomes, live activities, legacy players).
- **Organization API key**: create it under Organization Settings > Keys & IDs. It is needed for organization-level operations (list, create, view and update apps).

The REST API offers no OAuth. OneSignal's official hosted MCP server (https://api.onesignal.com/mcp/oauth, open beta, 43 tools) is also mounted, under `mcp`, with OAuth via dynamic client registration and S256 PKCE (discovered from https://api.onesignal.com). It adds templates, custom events and email deliverability/warmup tools missing from the spec. Non-utility MCP tools may need per-app enablement in OneSignal. Tools are under `rest` (API keys) and `mcp` (OAuth); MCP tools that are not read-only require approval.

Known gaps: the published spec does not describe templates, API key management or custom events; use the MCP tools for those. Operations using the legacy `/players` endpoints are included but deprecated by OneSignal.
