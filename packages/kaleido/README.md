# Kaleido

Manage the Kaleido enterprise blockchain platform: organizations, consortia, environments, nodes, services, membership, API keys and app credentials, across the 177 operations of the Kaleido platform API.

## Interface

OpenAPI 3.0 from Kaleido's official [API reference](https://api.kaleido.io/platform.html). Kaleido publishes no standalone spec URL, so the document the reference embeds is bundled as `platform.json`, extracted unchanged. Base URL `https://console.kaleido.io/api/v1`.

## Auth

API key only. In the Kaleido console open your user menu, Profile Settings, API Keys, and create a key; Kaleido shows it once. It is sent as a Bearer token. There is no OAuth for third-party apps, so no redirect URI applies.

## Known gaps

- Only the AWS US region (`console.kaleido.io`) is wired. Accounts in the EU, Sydney, Seoul or Azure US regions use different hosts (`console-eu`, `console-ap`, `console-ko`, `console-us1`) and are not supported yet.
- The data-plane APIs of individual nodes and services (such as the REST API Gateway) live on per-environment hosts and are not included.
