# OpenHands

Run and manage OpenHands Cloud (app.all-hands.dev) coding agents: start and search conversations, send messages, read events and git changes, manage sandboxes and sandbox specs, secrets, settings and profiles, git providers and organization endpoints.

**Interface:** OpenAPI, the official document published by OpenHands Cloud at https://app.all-hands.dev/openapi.json (240 tools). The document declares no servers, so the package pins `https://app.all-hands.dev`. All mutations require approval.

**Auth:** API key. Create one in OpenHands Cloud under Settings > API Keys. It is sent as `Authorization: Bearer <key>`, per the OpenHands Cloud API docs (the spec declares an `X-Access-Token` scheme, which is overridden). No OAuth app option exists for the public API.

**Known gaps:** Self-hosted OpenHands deployments on other hosts are not supported. The document also includes browser-session, OAuth callback, webhook and admin routes that an API key cannot use; they appear as tools but will fail with an authorization error.

Icon: OpenHands app icon from https://www.openhands.dev/favicon.svg, with the background square removed so the mark shows on light and dark.
