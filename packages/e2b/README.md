# E2B

Manage E2B cloud sandboxes for AI agents: create, connect, pause, resume, fork, snapshot and kill sandboxes, read their logs and metrics, and manage templates, tags and builds.

## Interface

OpenAPI, from E2B's official spec in the `e2b-dev/infra` repository:
https://raw.githubusercontent.com/e2b-dev/infra/main/spec/openapi.yml (API origin `https://api.e2b.app`). The URL tracks the `main` branch (not pinned; `info.version` stays 0.1.0), so the tool set can change when the spec changes.

## Auth

- API key: create a team API key in the E2B console (https://console.e2b.dev, API Keys tab). It is sent in the `X-API-Key` header.

E2B has no user-created OAuth apps, so there is no OAuth method.

## Known gaps

- Some exposed operations are marked deprecated in the spec (for example `GET/POST /sandboxes`, `GET /templates`); prefer their `/v2/...` counterparts.
- Operations that only accept bearer access tokens (dashboard login) or admin tokens are not callable with an API key.
- Commands, files and processes inside a running sandbox use the per-sandbox envd API on `*.e2b.app` hosts, which is not covered here.
