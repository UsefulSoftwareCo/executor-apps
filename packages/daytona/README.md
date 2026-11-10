# Daytona

Daytona provides isolated cloud sandboxes for running code and agent workflows. This package covers two of Daytona's three official HTTP APIs, mounted under one router:

- `platform`: sandboxes (create, start, stop, archive, resize, labels), snapshots, volumes, runners, regions, organizations and members, API keys, docker registries, audit logs and jobs (169 tools).
- `toolbox`: files, processes, git, LSP and computer use inside a running sandbox (107 tools). Every tool takes a required `sandboxId` argument, which the package puts in the path of the per-sandbox proxy, `https://proxy.app.daytona.io/toolbox/{sandboxId}`.

Interface: OpenAPI, from the official descriptions listed at https://www.daytona.io/docs/en/tools/api/: https://www.daytona.io/docs/openapi.json (Platform; https://daytona.io/openapi.json served identical content and is an alternate), https://www.daytona.io/docs/toolbox-openapi.json and https://www.daytona.io/docs/analytics-openapi.json (Swagger 2.0). The Platform description declares only `http://localhost:3000` as a server, so the package sets `baseUrl` to `https://app.daytona.io/api`. Mutations require approval.

Auth: API key. Create one in the Daytona dashboard under API Keys (https://app.daytona.io/dashboard/keys); it is sent as `Authorization: Bearer <key>` to both hosts. The Toolbox spec declares the same Bearer API-key scheme. The Analytics API (sandbox logs, metrics, traces and usage on `https://analytics.app.daytona.io`) is not offered. Its spec's only scheme reads "JWT token or Admin API key"; its introduction says "Daytona API keys or JWT tokens", but the permissions a dashboard API key can carry include no admin role, and nothing documents that such a key works there. The Platform API already serves sandbox logs, traces and metrics (`/sandbox/{sandboxId}/telemetry/...`) and the organization's usage overview with the API key. Mount it again, with a `sameCredential` reason, once a dashboard key is shown to work.

Not offered: OAuth. Daytona's API-keys documentation does not mention OAuth, and its Platform spec only declares an `openIdConnect` scheme for the dashboard login (a localhost discovery URL). Nothing in the vendor docs describes registering your own OAuth app. Daytona also documents JWT login through the `daytona login` CLI plus an `X-Daytona-Organization-ID` header; that cannot be completed inside Executor, so it is omitted.

Known gaps: the Platform API operations that take an organization scope use the API key's own organization; the `X-Daytona-Organization-ID` header is not exposed.
